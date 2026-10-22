// End-to-end tests of UC-VID-006 (download) and UC-VID-007 (information)
// against the running Docker Compose stack, through nginx
// (https://localhost:8080). Skipped unless VIDEO_E2E_URL is set.
//
//   VIDEO_E2E_URL=https://localhost:8080 VIDEO_E2E_FIXTURES=<dir> \
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node --test test/video/e2e-access.test.js
//
// Fixtures (generated with the video worker image, see the B002 test report):
// ok.mp4 (640×360 tagged 90°, H.264/AAC), ok.mov (30000/1001 fps), ok.avi
// (MPEG-4/MP3), noaudio.mp4 (H.264 without audio). The log checks read the
// container logs with `docker logs`.
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const mongoose = require("mongoose");

const BASE = process.env.VIDEO_E2E_URL;
const FIXTURES = process.env.VIDEO_E2E_FIXTURES;
const STORAGE = process.env.VIDEO_E2E_STORAGE || "http://localhost:11000/video";
const MONGO =
  process.env.VIDEO_E2E_MONGO || "mongodb://localhost:27018/project";
const PROJECTS_CONTAINER =
  process.env.VIDEO_E2E_PROJECTS_CONTAINER || "picturas-projects-1";
const NGINX_CONTAINER =
  process.env.VIDEO_E2E_NGINX_CONTAINER || "picturas-nginx-1";
const GATEWAY_CONTAINER =
  process.env.VIDEO_E2E_GATEWAY_CONTAINER || "picturas-api_gateway-1";

const skip =
  !BASE || !FIXTURES ? "set VIDEO_E2E_URL and VIDEO_E2E_FIXTURES" : false;
const MIME = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
};

let Video;
const ctx = {};
const startedAt = new Date();

async function api(method, url, { token, body, query, headers = {} } = {}) {
  const qs = query ? `?${new URLSearchParams(query)}` : "";
  const resp = await fetch(`${BASE}/api-gateway${url}${qs}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await resp.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (_) {
    json = text;
  }
  return { status: resp.status, json };
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

async function createProject(user, name = "e2e access") {
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
  return String(r.json.version);
}

async function share(owner, projectId, permission) {
  const r = await api("POST", `/projects/${owner.id}/${projectId}/share`, {
    token: owner.token,
    body: { permission },
    headers: { "X-Project-Version": await projectVersion(owner, projectId) },
  });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  return r.json.id;
}

function videosUrl(ownerId, projectId) {
  return `/projects/${ownerId}/${projectId}/videos`;
}

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

// Upload through /s3-video/ and wait for the ingestion by polling the
// information endpoint, which only returns the state until it completes.
async function ingest(fixtureName, as) {
  const data = fs.readFileSync(path.join(FIXTURES, fixtureName));
  const url = videosUrl(ctx.owner.id, ctx.project);
  const ticket = await api("POST", `${url}/uploads`, {
    token: ctx.owner.token,
    body: {
      fileName: as,
      mimeType: MIME[path.extname(fixtureName)],
      sizeBytes: data.length,
    },
  });
  assert.equal(ticket.status, 201, JSON.stringify(ticket.json));
  const put = await fetch(ticket.json.upload.url, {
    method: "PUT",
    headers: ticket.json.upload.headers,
    body: data,
  });
  assert.equal(put.status, 200);
  const videoId = ticket.json.videoId;

  const pending = await api("GET", `${url}/${videoId}`, {
    token: ctx.owner.token,
  });
  assert.equal(pending.status, 200);
  assert.deepEqual(Object.keys(pending.json).sort(), [
    "id",
    "originalName",
    "status",
  ]);

  const done = await api("POST", `${url}/${videoId}/upload/complete`, {
    token: ctx.owner.token,
  });
  assert.equal(done.status, 202, JSON.stringify(done.json));

  for (let i = 0; i < 120; i++) {
    const info = await api("GET", `${url}/${videoId}`, {
      token: ctx.owner.token,
    });
    if (info.json?.status === "completed")
      return { videoId, data, info: info.json };
    assert.notEqual(info.json?.status, "failed", JSON.stringify(info.json));
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`ingestion of ${fixtureName} did not complete`);
}

function info(videoId, caller = ctx.owner, query) {
  return api("GET", `${videosUrl(ctx.owner.id, ctx.project)}/${videoId}`, {
    token: caller.token,
    query,
  });
}

function download(videoId, caller = ctx.owner, query) {
  return api(
    "GET",
    `${videosUrl(ctx.owner.id, ctx.project)}/${videoId}/download`,
    { token: caller.token, query },
  );
}

// stdout and stderr: the video log writes errors to stderr (video/log.js).
function containerLogs(name) {
  const result = spawnSync(
    "docker",
    ["logs", "--since", startedAt.toISOString(), name],
    { encoding: "utf8", maxBuffer: 64e6 },
  );
  return `${result.stdout}\n${result.stderr}`;
}

function jsonLines(text) {
  return text
    .split("\n")
    .filter((line) => line.startsWith("{"))
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (_) {
        return null;
      }
    })
    .filter(Boolean);
}

// A copy of a completed record, to set up states the API cannot produce in
// B002 (missing object, missing metadata, results with provenance).
async function cloneVideo(fromId, changes) {
  const source = await Video.findById(fromId).lean();
  const { _id, createdAt, updatedAt, ...rest } = source;
  const doc = await Video.create({ ...rest, ...changes });
  ctx.extraIds.push(doc._id);
  return String(doc._id);
}

test.describe("UC-VID-006 and UC-VID-007 end to end", { skip }, () => {
  test.before(async () => {
    await mongoose.connect(MONGO);
    Video = require("../../models/video");
    ctx.extraIds = [];
    ctx.owner = await register("free");
    ctx.other = await register("free");
    ctx.anon = await register("anonymous");
    ctx.project = await createProject(ctx.owner);
    ctx.quotaBefore = (
      await api("GET", `/users/${ctx.owner.id}`, { token: ctx.owner.token })
    ).json.remaining_operations;

    ctx.mp4 = await ingest("ok.mp4", "Férias São João.mp4");
    ctx.mov = await ingest("ok.mov", "clip.mov");
    ctx.avi = await ingest("ok.avi", "camara.avi");
    ctx.noaudio = await ingest("noaudio.mp4", "mudo.mp4");
  });

  test.after(async () => {
    await Video.deleteMany({ _id: { $in: ctx.extraIds } });
    await mongoose.disconnect();
  });

  // --- Authentication and authorization (INFO-001, DOWNLOAD-001, NFR-001/017) ---

  test("401 UNAUTHENTICATED without JWT or with an invalid JWT", async () => {
    const id = ctx.mp4.videoId;
    for (const route of [info, download]) {
      const none = await route(id, { token: undefined });
      assert.equal(none.status, 401);
      assert.equal(none.json.error.code, "UNAUTHENTICATED");
      const bad = await route(id, { token: "not-a-jwt" });
      assert.equal(bad.status, 401);
    }
  });

  test("403 for a user without access and for anonymous users, without metadata or URL", async () => {
    const id = ctx.mp4.videoId;
    for (const route of [info, download]) {
      const other = await route(id, ctx.other);
      assert.equal(other.status, 403);
      assert.equal(other.json.error.code, "FORBIDDEN");
      assert.equal(other.json.meta, undefined);
      assert.equal(other.json.url, undefined);
    }

    // An anonymous user in their own project is refused too (RN1).
    const anonProject = await createProject(ctx.anon);
    const r = await api(
      "GET",
      `${videosUrl(ctx.anon.id, anonProject)}/${id}/download`,
      { token: ctx.anon.token },
    );
    assert.equal(r.status, 403);
    assert.equal(r.json.error.code, "FORBIDDEN");
  });

  test("read share link: information and download allowed; revoked → 410", async () => {
    const shareId = await share(ctx.owner, ctx.project, "read");
    const query = { share: shareId };

    const i = await info(ctx.avi.videoId, ctx.other, query);
    assert.equal(i.status, 200);
    assert.equal(i.json.status, "completed");
    const d = await download(ctx.avi.videoId, ctx.other, query);
    assert.equal(d.status, 200);
    assert.equal(d.json.fileName, "camara.avi");

    const revoke = await api(
      "DELETE",
      `/projects/${ctx.owner.id}/${ctx.project}/share/${shareId}`,
      {
        token: ctx.owner.token,
        headers: {
          "X-Project-Version": await projectVersion(ctx.owner, ctx.project),
        },
      },
    );
    assert.ok([200, 204].includes(revoke.status));
    const after = await download(ctx.avi.videoId, ctx.other, query);
    assert.equal(after.status, 410);
    assert.equal(after.json.error.code, "SHARE_LINK_REVOKED");
    assert.equal(after.json.url, undefined);
  });

  test("404 NOT_FOUND for an unknown or malformed video id", async () => {
    for (const id of ["nope", "64b0000000000000000000ff"]) {
      for (const route of [info, download]) {
        const r = await route(id);
        assert.equal(r.status, 404);
        assert.equal(r.json.error.code, "NOT_FOUND");
      }
    }
  });

  // --- Information (INFO-002 to 009) ---

  test("MP4 tagged 90°: display resolution 360 × 640, H.264/AAC, 30 fps, size and duration (INFO-002 to 006)", async () => {
    const r = await info(ctx.mp4.videoId);
    assert.equal(r.status, 200);
    const { meta } = r.json;
    assert.equal(meta.container, "mp4");
    assert.equal(meta.videoCodec, "h264");
    assert.equal(meta.audioCodec, "aac");
    assert.equal(meta.displayWidth, 360);
    assert.equal(meta.displayHeight, 640);
    assert.equal(meta.fpsNum / meta.fpsDen, 30);
    assert.equal(meta.sizeBytes, ctx.mp4.data.length);
    assert.ok(Math.abs(meta.durationMs - 3000) <= 100, String(meta.durationMs));
    assert.deepEqual(r.json.unavailable, []);
    assert.deepEqual(r.json.sources, []);
    assert.deepEqual(r.json.recipe, []);
    assert.equal(r.json.downloadFileName, "Férias São João.mp4");
  });

  test("MOV at 30000/1001 fps (INFO-006)", async () => {
    const r = await info(ctx.mov.videoId);
    assert.equal(r.json.meta.container, "mov");
    assert.equal(r.json.meta.fpsNum, 30000);
    assert.equal(r.json.meta.fpsDen, 1001);
    assert.equal(r.json.downloadFileName, "clip.mov");
  });

  test("MP4 without audio: audioCodec null, not unavailable (INFO-004)", async () => {
    const r = await info(ctx.noaudio.videoId);
    assert.equal(r.json.meta.audioCodec, null);
    assert.deepEqual(r.json.unavailable, []);
  });

  test("AVI: meta describes the stored original (MPEG-4/MP3), not the MP4 preview copy (FA2)", async () => {
    const r = await info(ctx.avi.videoId);
    assert.equal(r.json.meta.container, "avi");
    assert.equal(r.json.meta.videoCodec, "mpeg4");
    assert.equal(r.json.meta.audioCodec, "mp3");
    assert.equal(r.json.mimeType, "video/x-msvideo");
    const stored = await Video.findById(ctx.avi.videoId).lean();
    assert.ok(stored.storage.preview_key, "the AVI has a preview copy");
  });

  test("missing metadata → unavailable and METADATA_UNAVAILABLE logged with correlationId (INFO-009)", async () => {
    const id = await cloneVideo(ctx.mp4.videoId, {});
    await Video.updateOne(
      { _id: id },
      { $unset: { "meta.fps_num": 1, "meta.size_bytes": 1 } },
    );
    const r = await info(id);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.unavailable, ["size", "fps"]);

    await new Promise((resolve) => setTimeout(resolve, 500));
    const warn = jsonLines(containerLogs(PROJECTS_CONTAINER)).find(
      (l) => l.event === "METADATA_UNAVAILABLE" && l.videoId === id,
    );
    assert.ok(warn, "METADATA_UNAVAILABLE must be logged");
    assert.match(warn.correlationId, /^[0-9a-f-]{36}$/);
    assert.deepEqual(warn.attributes, ["size", "fps"]);
  });

  test("result: provenance in order, removed source as null, steps in order (INFO-008, D-35)", async () => {
    const removedId = new mongoose.Types.ObjectId();
    const id = await cloneVideo(ctx.mp4.videoId, {
      source_video_ids: [ctx.mov.videoId, removedId],
      recipe: [
        { operation: "trim", version: 1, parameters: { startMs: 0 } },
        { operation: "filter", version: 1, parameters: { name: "sepia" } },
      ],
    });
    const r = await info(id);
    assert.deepEqual(r.json.sources, [
      { id: ctx.mov.videoId, originalName: "clip.mov" },
      { id: String(removedId), originalName: null },
    ]);
    assert.deepEqual(
      r.json.recipe.map((s) => s.operation),
      ["trim", "filter"],
    );
    assert.equal(r.json.downloadFileName, "Férias São João_trim_filter.mp4");
  });

  test("video not completed: information shows only the state; download 409 RESOURCE_NOT_READY (DOWNLOAD-003)", async () => {
    const id = await cloneVideo(ctx.mp4.videoId, { status: "processing" });
    const i = await info(id);
    assert.deepEqual(i.json, {
      id,
      originalName: "Férias São João.mp4",
      status: "processing",
    });
    const d = await download(id);
    assert.equal(d.status, 409);
    assert.equal(d.json.error.code, "RESOURCE_NOT_READY");
    assert.equal(d.json.url, undefined);
  });

  // --- Download (DOWNLOAD-001 to 009, NFR-016, NFR-025) ---

  test("AVI download: same bytes, .avi, stored type; URL through /s3-video/ (DOWNLOAD-001, 006, NFR-016)", async () => {
    const r = await download(ctx.avi.videoId);
    assert.equal(r.status, 200);
    assert.deepEqual(Object.keys(r.json).sort(), [
      "expiresAt",
      "fileName",
      "url",
    ]);
    assert.equal(r.json.fileName, "camara.avi");
    assert.equal(new URL(r.json.url).pathname.split("/")[1], "s3-video");
    assert.match(new URL(r.json.url).pathname, /\/video_src\/.*\.avi$/);

    const file = await fetch(r.json.url);
    assert.equal(file.status, 200);
    assert.equal(file.headers.get("content-type"), "video/x-msvideo");
    const body = Buffer.from(await file.arrayBuffer());
    assert.equal(sha256(body), sha256(ctx.avi.data));
  });

  test("valid for 15 minutes: Expires of the signature = expiresAt = issue + 900 s (DOWNLOAD-002)", async () => {
    const before = Date.now();
    const r = await download(ctx.mp4.videoId);
    const after = Date.now();
    const expiresAt = Date.parse(r.json.expiresAt);
    assert.ok(expiresAt >= before + 899_000 && expiresAt <= after + 901_000);
    const signed = Number(new URL(r.json.url).searchParams.get("Expires"));
    assert.ok(Math.abs(signed * 1000 - expiresAt) <= 1000);
  });

  test("expired URL → 403 from storage; a new request gives a new valid URL (DOWNLOAD-002, 008)", async () => {
    // Same signing path with a 2 s validity, since 15 min cannot be waited for.
    const stored = await Video.findById(ctx.mp4.videoId).lean();
    const [projectId, stage, name] = stored.storage.original_key.split("/");
    const short = await fetch(`${STORAGE}/url/get`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: ctx.owner.id,
        projectId,
        stage,
        name,
        expires: 2,
        public: true,
      }),
    }).then((resp) => resp.json());
    assert.equal((await fetch(short.url)).status, 200);
    await new Promise((resolve) => setTimeout(resolve, 3500));
    assert.equal((await fetch(short.url)).status, 403);

    const first = await download(ctx.mp4.videoId);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const second = await download(ctx.mp4.videoId);
    assert.notEqual(first.json.url, second.json.url);
    assert.ok(
      Date.parse(second.json.expiresAt) > Date.parse(first.json.expiresAt),
    );
    assert.equal((await fetch(second.json.url)).status, 200);
  });

  test("Range request → 206 with the missing bytes (DOWNLOAD-007, NFR-025)", async () => {
    const r = await download(ctx.mp4.videoId);
    const total = ctx.mp4.data.length;
    const from = Math.floor(total * 0.6);
    const part = await fetch(r.json.url, {
      headers: { Range: `bytes=${from}-` },
    });
    assert.equal(part.status, 206);
    assert.equal(
      part.headers.get("content-range"),
      `bytes ${from}-${total - 1}/${total}`,
    );
    const body = Buffer.from(await part.arrayBuffer());
    assert.ok(body.equals(ctx.mp4.data.subarray(from)));
  });

  test("object missing in storage → 404 RESOURCE_UNAVAILABLE, logged, no URL", async () => {
    const stored = await Video.findById(ctx.mp4.videoId).lean();
    const [projectId] = stored.storage.original_key.split("/");
    const id = await cloneVideo(ctx.mp4.videoId, {
      storage: {
        ...stored.storage,
        original_key: `${projectId}/video_src/missing-${Date.now()}.mp4`,
      },
    });
    const r = await download(id);
    assert.equal(r.status, 404);
    assert.equal(r.json.error.code, "RESOURCE_UNAVAILABLE");
    assert.equal(r.json.url, undefined);

    await new Promise((resolve) => setTimeout(resolve, 500));
    const line = jsonLines(containerLogs(PROJECTS_CONTAINER)).find(
      (l) => l.event === "video.download.unavailable" && l.videoId === id,
    );
    assert.ok(line, "the failure must be logged");
    assert.equal(line.correlationId, r.json.correlationId);
  });

  // --- No quota, no task (DOWNLOAD-004, INFO-007, QUOTA-008) ---

  test("quota unchanged and no task created after information and downloads", async () => {
    for (const v of [ctx.mp4, ctx.mov]) {
      await info(v.videoId);
      await download(v.videoId);
    }
    const after = await api("GET", `/users/${ctx.owner.id}`, {
      token: ctx.owner.token,
    });
    assert.equal(after.json.remaining_operations, ctx.quotaBefore);

    const collections = (
      await mongoose.connection.db.listCollections().toArray()
    ).map((c) => c.name);
    if (collections.includes("videotasks")) {
      const tasks = await mongoose.connection.db
        .collection("videotasks")
        .countDocuments({
          project_id: new mongoose.Types.ObjectId(ctx.project),
        });
      assert.equal(tasks, 0);
    }
  });

  // --- Logs (DOWNLOAD-009, T-10) ---

  test("each issued URL is logged with correlationId, user and resource; no signature in any log", async () => {
    const r = await download(ctx.noaudio.videoId);
    assert.equal(r.status, 200);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const projectsLogs = containerLogs(PROJECTS_CONTAINER);
    const issued = jsonLines(projectsLogs).filter(
      (l) =>
        l.event === "video.download.issued" &&
        l.videoId === ctx.noaudio.videoId,
    );
    assert.ok(issued.length >= 1);
    for (const line of issued) {
      assert.match(line.correlationId, /^[0-9a-f-]{36}$/);
      assert.equal(line.userId, ctx.owner.id);
      assert.equal(line.projectId, ctx.project);
    }

    const signature = new URL(r.json.url).searchParams.get("Signature");
    for (const name of [
      PROJECTS_CONTAINER,
      NGINX_CONTAINER,
      GATEWAY_CONTAINER,
    ]) {
      const text = containerLogs(name);
      assert.ok(!text.includes("Signature="), `${name} logs a signature`);
      assert.ok(!text.includes(signature), `${name} logs the URL`);
    }

    // The transfer is in the /s3-video/ access log, path only (T-10); the
    // gateway never sees it (NFR-016).
    const part = await fetch(r.json.url, { headers: { Range: "bytes=10-" } });
    assert.equal(part.status, 206);
    await part.arrayBuffer();
    await new Promise((resolve) => setTimeout(resolve, 500));
    const pathname = new URL(r.json.url).pathname;
    const access = containerLogs(NGINX_CONTAINER)
      .split("\n")
      .filter((line) => line.includes(`"GET ${pathname}"`));
    assert.ok(
      access.some((line) => / 206 /.test(line)),
      "206 transfer in the access log",
    );
    assert.ok(access.every((line) => !line.includes("?")));
    const gateway = containerLogs(GATEWAY_CONTAINER);
    assert.ok(!gateway.includes(pathname));
  });
});
