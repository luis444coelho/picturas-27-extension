// End-to-end tests of UC-VID-000 against the running Docker Compose stack,
// through nginx (https://localhost:8080). Skipped unless VIDEO_E2E_URL is set.
//
//   VIDEO_E2E_URL=https://localhost:8080 VIDEO_E2E_FIXTURES=<dir> \
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node --test test/video/e2e.test.js
//
// Fixtures are generated with the video worker image (see the Stage 5 report).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const BASE = process.env.VIDEO_E2E_URL;
const FIXTURES = process.env.VIDEO_E2E_FIXTURES;
const STORAGE = process.env.VIDEO_E2E_STORAGE || "http://localhost:11000/video";
const MONGO =
  process.env.VIDEO_E2E_MONGO || "mongodb://localhost:27018/project";
const SOCKET_IO =
  process.env.VIDEO_E2E_SOCKET_IO ||
  path.join(__dirname, "../../../frontend/node_modules/socket.io-client");

const skip =
  !BASE || !FIXTURES ? "set VIDEO_E2E_URL and VIDEO_E2E_FIXTURES" : false;
const MB = 1024 * 1024;
const MIME = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
};

let Video;
const ctx = {};
const timings = [];

async function api(method, url, { token, body, query, headers = {} } = {}) {
  const qs = query ? `?${new URLSearchParams(query)}` : "";
  const started = performance.now();
  const resp = await fetch(`${BASE}/api-gateway${url}${qs}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...headers,
    },
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const elapsed = performance.now() - started;
  const text = await resp.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (_) {
    json = text;
  }
  return { status: resp.status, json, elapsed };
}

async function register(type) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const body =
    type === "anonymous"
      ? { type }
      : {
          name: `e2e ${type}`,
          email: `e2e-${type}-${stamp}@test.local`,
          password: "e2e-password",
          type,
        };
  const r = await api("POST", "/users", { body });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  return { id: r.json.user._id, token: r.json.jwt };
}

async function createProject(user, name = "e2e video") {
  const r = await api("POST", `/projects/${user.id}`, {
    token: user.token,
    body: { name },
  });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  return r.json._id;
}

async function projectVersion(owner, projectId) {
  const r = await api("GET", `/projects/${owner.id}/${projectId}`, {
    token: owner.token,
  });
  assert.equal(r.status, 200);
  return r.json.version;
}

function videosUrl(ownerId, projectId) {
  return `/projects/${ownerId}/${projectId}/videos`;
}

function fixture(name) {
  return fs.readFileSync(path.join(FIXTURES, name));
}

async function requestUpload(
  caller,
  ownerId,
  projectId,
  fileName,
  sizeBytes,
  query,
) {
  const mimeType = MIME[path.extname(fileName)] || "video/x-matroska";
  return api("POST", `${videosUrl(ownerId, projectId)}/uploads`, {
    token: caller.token,
    body: { fileName, mimeType, sizeBytes },
    query,
  });
}

async function put(ticket, data, contentType) {
  const resp = await fetch(ticket.upload.url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType ?? ticket.upload.headers["Content-Type"],
    },
    body: data,
  });
  return resp.status;
}

// Full client flow: URL, PUT through /s3-video/, confirmation.
async function upload(
  caller,
  ownerId,
  projectId,
  name,
  { as = name, query } = {},
) {
  const data = fixture(name);
  const ticket = await requestUpload(
    caller,
    ownerId,
    projectId,
    as,
    data.length,
    query,
  );
  assert.equal(ticket.status, 201, JSON.stringify(ticket.json));
  timings.push(["POST uploads", ticket.elapsed]);

  assert.equal(await put(ticket.json, data), 200);

  const done = await api(
    "POST",
    `${videosUrl(ownerId, projectId)}/${ticket.json.videoId}/upload/complete`,
    {
      token: caller.token,
      query,
    },
  );
  assert.equal(done.status, 202, JSON.stringify(done.json));
  timings.push(["POST upload/complete", done.elapsed]);
  return ticket.json.videoId;
}

function waitIngest(socket, videoId, timeoutMs = 90000) {
  const started = performance.now();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off("video-ingest-update", handler);
      reject(new Error(`no final video-ingest-update for ${videoId}`));
    }, timeoutMs);
    const handler = (event) => {
      if (event.videoId !== videoId || event.status === "processing") return;
      clearTimeout(timer);
      socket.off("video-ingest-update", handler);
      timings.push([
        "ingestion (confirm → final event)",
        performance.now() - started,
      ]);
      resolve(event);
    };
    socket.on("video-ingest-update", handler);
  });
}

async function connectSocket(token, projectId) {
  const { io } = require(SOCKET_IO);
  const socket = io(BASE, {
    transports: ["websocket"],
    rejectUnauthorized: false,
    auth: { token },
  });
  await new Promise((resolve, reject) => {
    socket.on("connect", resolve);
    socket.on("connect_error", reject);
  });
  socket.emit("join-project", projectId);
  return socket;
}

async function storageHead(ownerId, key) {
  const [projectId, stage, name] = key.split("/");
  const resp = await fetch(
    `${STORAGE}/object/${ownerId}/${projectId}/${stage}/${name}`,
    { method: "HEAD" },
  );
  return resp.status;
}

async function ingestAndWait(caller, ownerId, projectId, name, options) {
  const listen = waitIngestLater(projectId);
  const videoId = await upload(caller, ownerId, projectId, name, options);
  const event = await listen(videoId);
  return { videoId, event };
}

// The socket listens before the confirmation, so the final event is not missed.
function waitIngestLater() {
  const events = [];
  const handler = (event) => events.push(event);
  ctx.socket.on("video-ingest-update", handler);
  return async (videoId) => {
    const found = events.find(
      (e) => e.videoId === videoId && e.status !== "processing",
    );
    ctx.socket.off("video-ingest-update", handler);
    if (found) return found;
    return waitIngest(ctx.socket, videoId);
  };
}

// D-12: the client is notified first and the cleanup follows right after.
async function assertNothingLeft(videoId, ownerId, projectId, ext) {
  for (let i = 0; i < 20 && (await Video.findById(videoId).lean()); i++) {
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.equal(
    await Video.findById(videoId).lean(),
    null,
    "record must be gone",
  );
  assert.equal(
    await storageHead(ownerId, `${projectId}/video_src/${videoId}${ext}`),
    404,
    "original must be gone",
  );
  assert.equal(
    await storageHead(ownerId, `${projectId}/video_thumb/${videoId}.thumb.jpg`),
    404,
  );
  assert.equal(
    await storageHead(ownerId, `${projectId}/video_preview/${videoId}.mp4`),
    404,
  );
}

test.describe("UC-VID-000 end to end", { skip }, () => {
  test.before(async () => {
    await mongoose.connect(MONGO);
    Video = require("../../models/video");

    ctx.owner = await register("free");
    ctx.other = await register("free");
    ctx.anon = await register("anonymous");
    ctx.premium = await register("premium");
    ctx.project = await createProject(ctx.owner);
    ctx.premiumProject = await createProject(ctx.premium);
    ctx.anonProject = await createProject(ctx.anon);
    ctx.socket = await connectSocket(ctx.owner.token, ctx.project);
    ctx.premiumSocket = await connectSocket(
      ctx.premium.token,
      ctx.premiumProject,
    );
  });

  test.after(async () => {
    ctx.socket?.close();
    ctx.premiumSocket?.close();
    await mongoose.disconnect();
    console.log(
      "TIMINGS " + JSON.stringify(timings.map(([k, v]) => [k, Math.round(v)])),
    );
  });

  // --- Authentication and authorization (AUTH-001/002/003, NFR-001/017) ---

  test("401 UNAUTHENTICATED without JWT, with an invalid JWT, on every video route", async () => {
    const url = videosUrl(ctx.owner.id, ctx.project);
    for (const [method, suffix] of [
      ["GET", ""],
      ["POST", "/uploads"],
      ["POST", "/64b000000000000000000001/upload/complete"],
      ["DELETE", "/64b000000000000000000001/upload"],
      ["GET", "/64b000000000000000000001/playback"],
    ]) {
      for (const token of [undefined, "not-a-jwt"]) {
        const r = await api(method, `${url}${suffix}`, {
          token,
          body: method === "POST" ? {} : undefined,
        });
        assert.equal(r.status, 401, `${method} ${suffix} ${token}`);
        assert.equal(r.json.error.code, "UNAUTHENTICATED");
        assert.match(r.json.correlationId, /^[0-9a-f-]{36}$/);
      }
    }
  });

  test("403 FORBIDDEN when the token user is not the path user", async () => {
    const r = await api("GET", videosUrl(ctx.owner.id, ctx.project), {
      token: ctx.other.token,
    });
    assert.equal(r.status, 403);
    assert.equal(r.json.error.code, "FORBIDDEN");
  });

  test("403 FORBIDDEN for the anonymous user, even on its own project (AUTH-002)", async () => {
    const list = await api("GET", videosUrl(ctx.anon.id, ctx.anonProject), {
      token: ctx.anon.token,
    });
    assert.equal(list.status, 403);
    assert.equal(list.json.error.code, "FORBIDDEN");
    const up = await requestUpload(
      ctx.anon,
      ctx.anon.id,
      ctx.anonProject,
      "a.mp4",
      1000,
    );
    assert.equal(up.status, 403);
  });

  test("404 NOT_FOUND for an unknown project or video", async () => {
    const r = await api(
      "GET",
      videosUrl(ctx.owner.id, "64b0000000000000000000ff"),
      { token: ctx.owner.token },
    );
    assert.equal(r.status, 404);
    assert.equal(r.json.error.code, "NOT_FOUND");
    const p = await api(
      "GET",
      `${videosUrl(ctx.owner.id, ctx.project)}/64b0000000000000000000ff/playback`,
      {
        token: ctx.owner.token,
      },
    );
    assert.equal(p.status, 404);
  });

  test("share links: read can list but not upload; edit guest cannot confirm another's upload; revoked → 410", async () => {
    const version = await projectVersion(ctx.owner, ctx.project);
    const read = await api(
      "POST",
      `/projects/${ctx.owner.id}/${ctx.project}/share`,
      {
        token: ctx.owner.token,
        body: { permission: "read" },
        headers: { "X-Project-Version": String(version) },
      },
    );
    assert.equal(read.status, 201, JSON.stringify(read.json));
    const share = { share: read.json.id };

    const list = await api("GET", videosUrl(ctx.owner.id, ctx.project), {
      token: ctx.other.token,
      query: share,
    });
    assert.equal(list.status, 200);
    const up = await requestUpload(
      ctx.other,
      ctx.owner.id,
      ctx.project,
      "a.mp4",
      1000,
      share,
    );
    assert.equal(up.status, 403);
    assert.equal(up.json.error.code, "FORBIDDEN");

    const editResp = await api(
      "POST",
      `/projects/${ctx.owner.id}/${ctx.project}/share`,
      {
        token: ctx.owner.token,
        body: { permission: "edit" },
        headers: {
          "X-Project-Version": String(
            await projectVersion(ctx.owner, ctx.project),
          ),
        },
      },
    );
    const edit = { share: editResp.json.id };
    const ownerTicket = await requestUpload(
      ctx.owner,
      ctx.owner.id,
      ctx.project,
      "a.mp4",
      1000,
    );
    const confirm = await api(
      "POST",
      `${videosUrl(ctx.owner.id, ctx.project)}/${ownerTicket.json.videoId}/upload/complete`,
      { token: ctx.other.token, query: edit },
    );
    assert.equal(confirm.status, 403);
    await api(
      "DELETE",
      `${videosUrl(ctx.owner.id, ctx.project)}/${ownerTicket.json.videoId}/upload`,
      {
        token: ctx.owner.token,
      },
    );

    const revoke = await api(
      "DELETE",
      `/projects/${ctx.owner.id}/${ctx.project}/share/${read.json.id}`,
      {
        token: ctx.owner.token,
        headers: {
          "X-Project-Version": String(
            await projectVersion(ctx.owner, ctx.project),
          ),
        },
      },
    );
    assert.ok([200, 204].includes(revoke.status), JSON.stringify(revoke.json));
    const revoked = await api("GET", videosUrl(ctx.owner.id, ctx.project), {
      token: ctx.other.token,
      query: share,
    });
    assert.equal(revoked.status, 410);
    assert.equal(revoked.json.error.code, "SHARE_LINK_REVOKED");
  });

  // --- Request validation (UPLOAD-003/004/020, D-23) ---

  test("422 UNSUPPORTED_FORMAT for a container outside the matrix", async () => {
    const r = await requestUpload(
      ctx.owner,
      ctx.owner.id,
      ctx.project,
      "a.mkv",
      1000,
    );
    assert.equal(r.status, 422);
    assert.equal(r.json.error.code, "UNSUPPORTED_FORMAT");
  });

  test("422 LIMIT_EXCEEDED above 200 MB for Registered; Premium accepted up to 2 GB", async () => {
    const free = await requestUpload(
      ctx.owner,
      ctx.owner.id,
      ctx.project,
      "big.mp4",
      250 * MB,
    );
    assert.equal(free.status, 422);
    assert.equal(free.json.error.code, "LIMIT_EXCEEDED");
    assert.deepEqual(free.json.error.details, {
      field: "size",
      limit: 200 * MB,
      total: 250 * MB,
    });

    const premium = await requestUpload(
      ctx.premium,
      ctx.premium.id,
      ctx.premiumProject,
      "big.mp4",
      250 * MB,
    );
    assert.equal(premium.status, 201);
    const tooBig = await requestUpload(
      ctx.premium,
      ctx.premium.id,
      ctx.premiumProject,
      "big.mp4",
      2048 * MB + 1,
    );
    assert.equal(tooBig.status, 422);
    await api(
      "DELETE",
      `${videosUrl(ctx.premium.id, ctx.premiumProject)}/${premium.json.videoId}/upload`,
      {
        token: ctx.premium.token,
      },
    );
  });

  test("422 INVALID_REQUEST for a malformed upload request", async () => {
    const r = await api(
      "POST",
      `${videosUrl(ctx.owner.id, ctx.project)}/uploads`,
      {
        token: ctx.owner.token,
        body: { fileName: "a.mp4", mimeType: "video/mp4" },
      },
    );
    assert.equal(r.status, 422);
    assert.equal(r.json.error.code, "INVALID_REQUEST");
  });

  // --- Main flow (AC1, AC2, AC6) ---

  test("MP4 with rotation: completed, metadata, thumbnail, frame 0, no preview copy, no quota", async () => {
    const before = await api("GET", `/users/${ctx.owner.id}`, {
      token: ctx.owner.token,
    });
    const { videoId, event } = await ingestAndWait(
      ctx.owner,
      ctx.owner.id,
      ctx.project,
      "ok.mp4",
      {
        as: "Férias São João.mp4",
      },
    );
    assert.deepEqual(event, {
      projectId: ctx.project,
      videoId,
      status: "completed",
    });

    const doc = await Video.findById(videoId).lean();
    assert.equal(doc.status, "completed");
    assert.equal(doc.original_name, "Férias São João.mp4");
    assert.equal(doc.mime_type, "video/mp4");
    assert.equal(String(doc.owner_id), ctx.owner.id);
    assert.deepEqual(doc.source_video_ids, []);
    assert.deepEqual(doc.recipe, []);
    const m = doc.meta;
    assert.deepEqual(
      [
        m.container,
        m.video_codec,
        m.audio_codec,
        m.width,
        m.height,
        m.rotation,
        m.display_width,
        m.display_height,
      ],
      ["mp4", "h264", "aac", 320, 240, 90, 240, 320],
    );
    assert.deepEqual([m.fps_num, m.fps_den], [25, 1]);
    assert.ok(
      Math.abs(m.duration_ms - 2000) < 100,
      `duration ${m.duration_ms}`,
    );
    assert.equal(m.size_bytes, fixture("ok.mp4").length);
    assert.ok(m.bitrate > 0);
    assert.equal(doc.storage.preview_key, undefined);
    assert.equal(
      await storageHead(ctx.owner.id, doc.storage.original_key),
      200,
    );
    assert.equal(await storageHead(ctx.owner.id, doc.storage.thumb_key), 200);
    assert.equal(
      await storageHead(ctx.owner.id, doc.storage.first_frame_key),
      200,
    );

    const list = await api("GET", videosUrl(ctx.owner.id, ctx.project), {
      token: ctx.owner.token,
    });
    const item = list.json.videos.find((v) => v.id === videoId);
    assert.equal(item.displayWidth, 240);
    assert.equal(item.displayHeight, 320);
    const thumb = await fetch(item.thumbnailUrl);
    assert.equal(thumb.status, 200);
    assert.equal(thumb.headers.get("content-type"), "image/jpeg");

    const after = await api("GET", `/users/${ctx.owner.id}`, {
      token: ctx.owner.token,
    });
    assert.equal(
      after.json.remaining_operations,
      before.json.remaining_operations,
      "upload must not use quota",
    );
    ctx.mp4 = videoId;
  });

  test("playback URL goes through /s3-video/, supports Range (206) and uses no quota", async () => {
    const before = await api("GET", `/users/${ctx.owner.id}`, {
      token: ctx.owner.token,
    });
    const r = await api(
      "GET",
      `${videosUrl(ctx.owner.id, ctx.project)}/${ctx.mp4}/playback`,
      { token: ctx.owner.token },
    );
    assert.equal(r.status, 200);
    assert.equal(r.json.mimeType, "video/mp4");
    assert.equal(r.json.expiresIn, 900);
    assert.match(
      r.json.url,
      new RegExp(
        `^${BASE}/s3-video/user-${ctx.owner.id}/${ctx.project}/video_src/`,
      ),
    );

    const full = await fetch(r.json.url);
    assert.equal(full.status, 200);
    assert.equal(
      Number(full.headers.get("content-length")),
      fixture("ok.mp4").length,
    );
    const part = await fetch(r.json.url, { headers: { Range: "bytes=0-99" } });
    assert.equal(part.status, 206);
    assert.equal((await part.arrayBuffer()).byteLength, 100);

    const after = await api("GET", `/users/${ctx.owner.id}`, {
      token: ctx.owner.token,
    });
    assert.equal(
      after.json.remaining_operations,
      before.json.remaining_operations,
    );
  });

  for (const [name, preview] of [
    ["ok.mov", "remux"],
    ["ok.avi", "re-encoded"],
    ["high10.mp4", "re-encoded (Q-ADD-20)"],
  ]) {
    test(`${name}: preview copy (${preview}) used by the player, original kept for the rest`, async () => {
      const { videoId, event } = await ingestAndWait(
        ctx.owner,
        ctx.owner.id,
        ctx.project,
        name,
      );
      assert.equal(event.status, "completed", JSON.stringify(event));
      const doc = await Video.findById(videoId).lean();
      assert.equal(
        doc.storage.preview_key,
        `${ctx.project}/video_preview/${videoId}.mp4`,
      );
      assert.equal(
        await storageHead(ctx.owner.id, doc.storage.preview_key),
        200,
      );
      assert.equal(doc.mime_type, MIME[path.extname(name)]);

      const r = await api(
        "GET",
        `${videosUrl(ctx.owner.id, ctx.project)}/${videoId}/playback`,
        { token: ctx.owner.token },
      );
      assert.equal(r.json.mimeType, "video/mp4");
      assert.match(r.json.url, /\/video_preview\//);
      const media = await fetch(r.json.url);
      assert.equal(media.headers.get("content-type"), "video/mp4");
    });
  }

  test("video shorter than 1 s: thumbnail from frame 0 (Q-ADD-22)", async () => {
    const { videoId, event } = await ingestAndWait(
      ctx.owner,
      ctx.owner.id,
      ctx.project,
      "short.mp4",
    );
    assert.equal(event.status, "completed");
    const doc = await Video.findById(videoId).lean();
    assert.ok(doc.meta.duration_ms < 1000);
    assert.equal(await storageHead(ctx.owner.id, doc.storage.thumb_key), 200);
  });

  // --- Rejections leave nothing behind (AC4, Garantia Mínima, D-12) ---

  for (const [name, code] of [
    ["hevc.mp4", "INVALID_CODEC"],
    ["audio.mp4", "INVALID_CODEC"],
    ["trunc.mp4", "CORRUPTED_FILE"],
    ["long.mp4", "LIMIT_EXCEEDED"],
  ]) {
    test(`${name} → failed with ${code}, no record and no object left`, async () => {
      const { videoId, event } = await ingestAndWait(
        ctx.owner,
        ctx.owner.id,
        ctx.project,
        name,
      );
      assert.deepEqual(event, {
        projectId: ctx.project,
        videoId,
        status: "failed",
        error: { code },
      });
      await assertNothingLeft(videoId, ctx.owner.id, ctx.project, ".mp4");
      const list = await api("GET", videosUrl(ctx.owner.id, ctx.project), {
        token: ctx.owner.token,
      });
      assert.ok(!list.json.videos.some((v) => v.id === videoId));
    });
  }

  test("Premium accepts the 5:10 video refused to a Registered user (FA3)", async () => {
    const listen = [];
    const handler = (e) => listen.push(e);
    ctx.premiumSocket.on("video-ingest-update", handler);
    const videoId = await upload(
      ctx.premium,
      ctx.premium.id,
      ctx.premiumProject,
      "long.mp4",
    );
    const event =
      listen.find((e) => e.videoId === videoId && e.status !== "processing") ??
      (await waitIngest(ctx.premiumSocket, videoId));
    ctx.premiumSocket.off("video-ingest-update", handler);
    assert.equal(event.status, "completed");
    const doc = await Video.findById(videoId).lean();
    assert.ok(doc.meta.duration_ms > 5 * 60 * 1000);
  });

  test("cancel before confirming removes record and object (FA2, UPLOAD-006)", async () => {
    const data = fixture("ok.mp4");
    const ticket = await requestUpload(
      ctx.owner,
      ctx.owner.id,
      ctx.project,
      "c.mp4",
      data.length,
    );
    assert.equal(await put(ticket.json, data), 200);
    const id = ticket.json.videoId;
    const del = await api(
      "DELETE",
      `${videosUrl(ctx.owner.id, ctx.project)}/${id}/upload`,
      { token: ctx.owner.token },
    );
    assert.equal(del.status, 204);
    await assertNothingLeft(id, ctx.owner.id, ctx.project, ".mp4");
    const late = await api(
      "POST",
      `${videosUrl(ctx.owner.id, ctx.project)}/${id}/upload/complete`,
      {
        token: ctx.owner.token,
      },
    );
    assert.equal(late.status, 404);
  });

  test("confirming without the file, or with a partial file, is UPLOAD_ABORTED and leaves nothing", async () => {
    const data = fixture("ok.mp4");
    const empty = await requestUpload(
      ctx.owner,
      ctx.owner.id,
      ctx.project,
      "e.mp4",
      data.length,
    );
    const r1 = await api(
      "POST",
      `${videosUrl(ctx.owner.id, ctx.project)}/${empty.json.videoId}/upload/complete`,
      {
        token: ctx.owner.token,
      },
    );
    assert.equal(r1.status, 422);
    assert.equal(r1.json.error.code, "UPLOAD_ABORTED");
    await assertNothingLeft(
      empty.json.videoId,
      ctx.owner.id,
      ctx.project,
      ".mp4",
    );

    const partial = await requestUpload(
      ctx.owner,
      ctx.owner.id,
      ctx.project,
      "p.mp4",
      data.length,
    );
    assert.equal(await put(partial.json, data.subarray(0, 1000)), 200);
    const r2 = await api(
      "POST",
      `${videosUrl(ctx.owner.id, ctx.project)}/${partial.json.videoId}/upload/complete`,
      {
        token: ctx.owner.token,
      },
    );
    assert.equal(r2.status, 422);
    assert.equal(r2.json.error.code, "UPLOAD_ABORTED");
    await assertNothingLeft(
      partial.json.videoId,
      ctx.owner.id,
      ctx.project,
      ".mp4",
    );
  });

  test("the PUT must use the signed Content-Type; queued videos never show in the gallery", async () => {
    const data = fixture("ok.mp4");
    const ticket = await requestUpload(
      ctx.owner,
      ctx.owner.id,
      ctx.project,
      "s.mp4",
      data.length,
    );
    assert.equal(await put(ticket.json, data, "application/octet-stream"), 403);
    const list = await api("GET", videosUrl(ctx.owner.id, ctx.project), {
      token: ctx.owner.token,
    });
    assert.ok(!list.json.videos.some((v) => v.id === ticket.json.videoId));
    await api(
      "DELETE",
      `${videosUrl(ctx.owner.id, ctx.project)}/${ticket.json.videoId}/upload`,
      {
        token: ctx.owner.token,
      },
    );
  });

  test("RESOURCE_NOT_READY (409) for playback while ingesting; INVALID_STATE for a second confirmation", async () => {
    const data = fixture("long.mp4");
    const ticket = await requestUpload(
      ctx.premium,
      ctx.premium.id,
      ctx.premiumProject,
      "w.mp4",
      data.length,
    );
    const url = `${videosUrl(ctx.premium.id, ctx.premiumProject)}/${ticket.json.videoId}`;
    assert.equal(
      (await api("GET", `${url}/playback`, { token: ctx.premium.token })).json
        .error.code,
      "RESOURCE_NOT_READY",
    );
    await put(ticket.json, data);
    await api("POST", `${url}/upload/complete`, { token: ctx.premium.token });
    const again = await api("POST", `${url}/upload/complete`, {
      token: ctx.premium.token,
    });
    assert.equal(again.status, 409);
    assert.equal(again.json.error.code, "INVALID_STATE");
    await waitIngest(ctx.premiumSocket, ticket.json.videoId);
  });

  // --- Regression of the image flow (rule 2.6) ---

  test("image flow still works: project routes and image upload pass through the video router", async () => {
    const form = new FormData();
    form.append(
      "image",
      new Blob([fixture("img.png")], { type: "image/png" }),
      "img.png",
    );
    const version = await projectVersion(ctx.owner, ctx.project);
    const up = await api(
      "POST",
      `/projects/${ctx.owner.id}/${ctx.project}/img`,
      {
        token: ctx.owner.token,
        body: form,
        headers: { "X-Project-Version": String(version) },
      },
    );
    // The existing gateway route answers 204 (apiGateway/routes/projects.js).
    assert.equal(up.status, 204, JSON.stringify(up.json));
    const imgs = await api(
      "GET",
      `/projects/${ctx.owner.id}/${ctx.project}/imgs`,
      { token: ctx.owner.token },
    );
    assert.equal(imgs.status, 200);
    assert.equal(imgs.json.length, 1);
    // Old routes keep their old status codes: auth.checkToken answers 401 for a user mismatch.
    const legacy = await api(
      "GET",
      `/projects/${ctx.owner.id}/${ctx.project}`,
      { token: ctx.other.token },
    );
    assert.equal(legacy.status, 401);
  });
});
