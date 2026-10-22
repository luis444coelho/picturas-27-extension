// End-to-end tests of the video tasks of B003 (ST-VID-COM-001) against the
// running Docker Compose stack, through nginx. They need the test operation of
// D-37, enabled only for the tests with a temporary compose file outside the
// repository (VIDEO_TEST_OPERATIONS=1 in projects and video_worker).
//
//   VIDEO_E2E_URL=https://localhost:8080 VIDEO_E2E_FIXTURES=<dir> \
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node --test test/video/e2e-tasks.test.js
//
// Fixtures (made with the worker image, see the Stage 5 report): short.mp4
// (4 s, 640x360, H.264/AAC), long.mp4 (90 s, 1080p, H.264/AAC) and rot.mp4
// (321x241 4:4:4 with a 90 degree display matrix, no audio).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const mongoose = require("mongoose");

const BASE = process.env.VIDEO_E2E_URL;
const FIXTURES = process.env.VIDEO_E2E_FIXTURES;
const MONGO =
  process.env.VIDEO_E2E_MONGO || "mongodb://localhost:27018/project";
const USERS_MONGO =
  process.env.VIDEO_E2E_USERS_MONGO || "mongodb://localhost:27019/user";
const SOCKET_IO =
  process.env.VIDEO_E2E_SOCKET_IO ||
  path.join(__dirname, "../../../frontend/node_modules/socket.io-client");
const REPO = path.join(__dirname, "../../..");

const skip =
  !BASE || !FIXTURES ? "set VIDEO_E2E_URL and VIDEO_E2E_FIXTURES" : false;
const STEP = { operation: "test_reencode", version: 1, parameters: {} };
const ctx = {};
const timings = [];
let db;
let usersDb;

// ---- helpers -----------------------------------------------------------------

async function api(method, url, { token, body, query, headers = {} } = {}) {
  const qs = query ? `?${new URLSearchParams(query)}` : "";
  const started = performance.now();
  const resp = await fetch(`${BASE}/api-gateway${url}${qs}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
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
          email: `e2e-b003-${type}-${stamp}@test.local`,
          password: "e2e-password",
          type,
        };
  const r = await api("POST", "/users", { body });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  return { id: r.json.user._id, token: r.json.jwt };
}

async function createProject(user, name = "e2e b003") {
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
  return r.json.version;
}

const videosUrl = (ownerId, projectId) =>
  `/projects/${ownerId}/${projectId}/videos`;

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
  socket.taskEvents = [];
  socket.on("video-task-update", (e) =>
    socket.taskEvents.push({ ...e, at: performance.now() }),
  );
  return socket;
}

async function uploadAndIngest(user, projectId, socket, name) {
  const data = fs.readFileSync(path.join(FIXTURES, name));
  const ticket = await api("POST", `${videosUrl(user.id, projectId)}/uploads`, {
    token: user.token,
    body: { fileName: name, mimeType: "video/mp4", sizeBytes: data.length },
  });
  assert.equal(ticket.status, 201, JSON.stringify(ticket.json));
  const put = await fetch(ticket.json.upload.url, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: data,
  });
  assert.equal(put.status, 200);
  const videoId = ticket.json.videoId;
  const done = new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("ingestion timeout")),
      120000,
    );
    const handler = (e) => {
      if (e.videoId !== videoId || e.status === "processing") return;
      clearTimeout(timer);
      socket.off("video-ingest-update", handler);
      resolve(e);
    };
    socket.on("video-ingest-update", handler);
  });
  const complete = await api(
    "POST",
    `${videosUrl(user.id, projectId)}/${videoId}/upload/complete`,
    { token: user.token },
  );
  assert.equal(complete.status, 202, JSON.stringify(complete.json));
  const event = await done;
  assert.equal(event.status, "completed", JSON.stringify(event));
  return videoId;
}

function submit(user, ownerId, projectId, videoId, steps = [STEP], query) {
  return api("POST", `${videosUrl(ownerId, projectId)}/${videoId}/operations`, {
    token: user.token,
    body: { steps },
    query,
  });
}

function waitTask(socket, taskId, predicate, timeoutMs = 240000) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const tick = setInterval(() => {
      const found = socket.taskEvents.find(
        (e) => e.taskId === taskId && predicate(e),
      );
      if (found) {
        clearInterval(tick);
        resolve(found);
      } else if (performance.now() - started > timeoutMs) {
        clearInterval(tick);
        reject(new Error(`timeout waiting for task ${taskId}`));
      }
    }, 50);
  });
}

const isFinal = (e) => ["completed", "failed", "cancelled"].includes(e.status);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function remaining(user) {
  const r = await api("GET", `/users/${user.id}`, { token: user.token });
  return r.json.remaining_operations;
}

function compose(...args) {
  return execFileSync("docker", ["compose", ...args], {
    cwd: REPO,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

// Whether /tmp/video/<taskId> exists and whether an FFmpeg of the task runs.
function workerState(taskId) {
  const script = `
import os
d = '/tmp/video/${taskId}'
ff = False
for pid in filter(str.isdigit, os.listdir('/proc')):
    try:
        cmd = open(f'/proc/{pid}/cmdline', 'rb').read()
    except OSError:
        continue
    if cmd.startswith(b'ffmpeg') and b'${taskId}' in cmd:
        ff = True
print(int(os.path.exists(d)), int(ff))`;
  const out = compose(
    "exec",
    "-T",
    "video_worker",
    "python",
    "-c",
    script,
  ).trim();
  const [dir, ffmpeg] = out.split(" ").map(Number);
  return { dir: dir === 1, ffmpeg: ffmpeg === 1 };
}

async function storageHead(ownerId, key) {
  const [projectId, stage, name] = key.split("/");
  const resp = await fetch(
    `http://localhost:11000/video/object/${ownerId}/${projectId}/${stage}/${name}`,
    { method: "HEAD" },
  );
  return resp.status;
}

// The crash tests get their own Registered user and project: the owner's 5
// daily credits are used by the tests above.
async function crashCtx() {
  if (!ctx.crash) {
    const user = await register("free");
    const project = await createProject(user, "e2e b003 crash");
    const socket = await connectSocket(user.token, project);
    const long = await uploadAndIngest(user, project, socket, "long.mp4");
    ctx.crash = { user, project, socket, long };
  }
  return ctx.crash;
}

// ---- suite --------------------------------------------------------------------

test.describe("B003 video tasks end to end", { skip }, () => {
  test.before(async () => {
    await mongoose.connect(MONGO);
    db = mongoose.connection;
    usersDb = mongoose.createConnection(USERS_MONGO);
    await usersDb.asPromise();

    ctx.owner = await register("free");
    ctx.guest = await register("free");
    ctx.premium = await register("premium");
    ctx.anon = await register("anonymous");
    ctx.project = await createProject(ctx.owner);
    ctx.socket = await connectSocket(ctx.owner.token, ctx.project);
    ctx.short = await uploadAndIngest(
      ctx.owner,
      ctx.project,
      ctx.socket,
      "short.mp4",
    );
    ctx.long = await uploadAndIngest(
      ctx.owner,
      ctx.project,
      ctx.socket,
      "long.mp4",
    );
    ctx.rot = await uploadAndIngest(
      ctx.owner,
      ctx.project,
      ctx.socket,
      "rot.mp4",
    );
  });

  test.after(async () => {
    ctx.socket?.close();
    ctx.crash?.socket.close();
    console.log("timings (ms):", JSON.stringify(timings));
    await usersDb?.close();
    await mongoose.disconnect();
  });

  test("one step: 202 {taskId, queued} in ≤ 1 s, queued → processing → completed, result in the project (TASK-001/002/003, NFR-005, COM-002/003, QUOTA-002/003, NFR-018)", async () => {
    const before = await remaining(ctx.owner);
    const r = await submit(ctx.owner, ctx.owner.id, ctx.project, ctx.short);
    timings.push(["POST operations", r.elapsed]);
    assert.equal(r.status, 202, JSON.stringify(r.json));
    assert.deepEqual(Object.keys(r.json).sort(), ["status", "taskId"]);
    assert.equal(r.json.status, "queued");
    assert.ok(r.elapsed <= 1000, `accepted in ${r.elapsed} ms`);
    assert.equal(
      await remaining(ctx.owner),
      before - 1,
      "1 credit reserved on acceptance",
    );

    const done = await waitTask(ctx.socket, r.json.taskId, isFinal);
    assert.equal(done.status, "completed", JSON.stringify(done));
    const statuses = ctx.socket.taskEvents
      .filter((e) => e.taskId === r.json.taskId)
      .map((e) => e.status)
      .filter((s, i, a) => s !== a[i - 1]);
    assert.deepEqual(statuses, ["queued", "processing", "completed"]);
    assert.equal(done.resultVideoId, r.json.taskId, "ADR-005");
    assert.equal(done.progress, 100);
    for (const e of ctx.socket.taskEvents)
      assert.deepEqual(
        Object.keys(e)
          .filter((k) => !["at"].includes(k))
          .sort()
          .filter(
            (k) =>
              ![
                "projectId",
                "taskId",
                "status",
                "step",
                "totalSteps",
                "progress",
                "resultVideoId",
                "error",
              ].includes(k),
          ),
        [],
        "events carry only ids, status and progress (T-03)",
      );

    const view = await api(
      "GET",
      `${videosUrl(ctx.owner.id, ctx.project)}/tasks/${r.json.taskId}`,
      {
        token: ctx.owner.token,
      },
    );
    assert.equal(view.status, 200);
    assert.equal(view.json.status, "completed");
    assert.equal(view.json.progress, 100);
    assert.equal(view.json.resultVideoId, r.json.taskId);

    const gallery = await api("GET", videosUrl(ctx.owner.id, ctx.project), {
      token: ctx.owner.token,
    });
    assert.ok(
      gallery.json.videos.some((v) => v.id === r.json.taskId),
      "result listed (COM-003)",
    );

    const info = await api(
      "GET",
      `${videosUrl(ctx.owner.id, ctx.project)}/${r.json.taskId}`,
      {
        token: ctx.owner.token,
      },
    );
    assert.equal(info.status, 200);
    assert.equal(info.json.meta.container, "mp4");
    assert.equal(info.json.meta.videoCodec, "h264");
    assert.equal(info.json.meta.audioCodec, "aac");
    assert.deepEqual(
      info.json.sources.map((s) => s.id),
      [ctx.short],
    );
    assert.deepEqual(info.json.recipe, [STEP]);
    assert.equal(
      await remaining(ctx.owner),
      before - 1,
      "no refund and no extra debit on completion",
    );

    const video = await db
      .collection("videos")
      .findOne({ _id: new mongoose.Types.ObjectId(r.json.taskId) });
    for (const key of [
      video.storage.original_key,
      video.storage.thumb_key,
      video.storage.first_frame_key,
    ])
      assert.equal(await storageHead(ctx.owner.id, key), 200, key);
    assert.equal(
      video.storage.preview_key,
      undefined,
      "encoded H.264 yuv420p plays as it is (T-06)",
    );
  });

  test("rotated 321x241 source → 240x320 result, rotation applied and even sizes (T-02, Q-ADD-25)", async () => {
    const r = await submit(ctx.owner, ctx.owner.id, ctx.project, ctx.rot);
    assert.equal(r.status, 202);
    const done = await waitTask(ctx.socket, r.json.taskId, isFinal);
    assert.equal(done.status, "completed");
    const video = await db
      .collection("videos")
      .findOne({ _id: new mongoose.Types.ObjectId(r.json.taskId) });
    assert.deepEqual(
      [
        video.meta.width,
        video.meta.height,
        video.meta.rotation,
        video.meta.audio_codec,
      ],
      [240, 320, 0, null],
    );
  });

  test("chain of 2 on a long video: progress ≥ 1×/s, monotone, step k of 2, nothing visible before completed, one FFmpeg encoding (NFR-009, TASK-008, COM-002, NFR-013)", async () => {
    const r = await submit(ctx.owner, ctx.owner.id, ctx.project, ctx.long, [
      STEP,
      STEP,
    ]);
    assert.equal(r.status, 202);
    const taskId = r.json.taskId;

    await waitTask(
      ctx.socket,
      taskId,
      (e) => e.status === "processing" && e.progress > 0,
    );
    const gallery = await api("GET", videosUrl(ctx.owner.id, ctx.project), {
      token: ctx.owner.token,
    });
    assert.ok(
      !gallery.json.videos.some((v) => v.id === taskId),
      "no partial result (COM-002)",
    );
    const during = await api(
      "GET",
      `${videosUrl(ctx.owner.id, ctx.project)}/tasks/${taskId}`,
      {
        token: ctx.owner.token,
      },
    );
    assert.equal(during.json.status, "processing");
    assert.equal(during.json.totalSteps, 2);

    const done = await waitTask(ctx.socket, taskId, isFinal);
    assert.equal(done.status, "completed");

    const progress = ctx.socket.taskEvents.filter(
      (e) =>
        e.taskId === taskId &&
        e.status === "processing" &&
        e.progress !== undefined,
    );
    const values = progress.map((e) => e.progress);
    assert.deepEqual(
      values,
      [...values].sort((a, b) => a - b),
      "monotone",
    );
    const gaps = progress.slice(1).map((e, i) => e.at - progress[i].at);
    const maxGap = Math.max(...gaps);
    timings.push(["max gap between progress events", maxGap]);
    timings.push(["progress events", progress.length]);
    assert.ok(
      maxGap <= 1000,
      `max gap ${maxGap} ms (NFR-009: at least once per second)`,
    );
    assert.ok(
      progress.some((e) => e.step === 2 && e.totalSteps === 2),
      "reaches step 2 of 2 (D-40)",
    );
    assert.equal(done.progress, 100);

    const logs = compose("logs", "--since", "15m", "video_worker");
    const encodings = logs
      .split("\n")
      .filter((l) => l.includes('"video.task.ffmpeg"') && l.includes(taskId));
    assert.equal(encodings.length, 1, "one encoding invocation (NFR-013)");
    assert.equal(encodings[0].split("-filter_complex").length - 1, 1);
  });

  test("one active task per project; guest editor cannot cancel; runner cancels: FFmpeg ended, temporaries gone, credit back, no result (NFR-021, TASK-004/005, QUOTA-004)", async () => {
    const before = await remaining(ctx.owner);
    const r = await submit(ctx.owner, ctx.owner.id, ctx.project, ctx.long);
    assert.equal(r.status, 202);
    const taskId = r.json.taskId;

    const second = await submit(
      ctx.owner,
      ctx.owner.id,
      ctx.project,
      ctx.short,
    );
    assert.equal(second.status, 409);
    assert.equal(second.json.error.code, "TASK_ALREADY_ACTIVE");
    assert.deepEqual(second.json.error.details, { taskId });
    assert.ok(second.json.correlationId);
    assert.equal(
      await remaining(ctx.owner),
      before - 1,
      "the 409 reserves nothing",
    );

    const share = await api(
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
    assert.equal(share.status, 201, JSON.stringify(share.json));
    ctx.editShare = { share: share.json.id };

    await waitTask(
      ctx.socket,
      taskId,
      (e) => e.status === "processing" && e.progress > 0,
    );
    assert.equal(workerState(taskId).ffmpeg, true, "FFmpeg running");

    const guestCancel = await api(
      "DELETE",
      `${videosUrl(ctx.owner.id, ctx.project)}/tasks/${taskId}`,
      {
        token: ctx.guest.token,
        query: ctx.editShare,
      },
    );
    assert.equal(guestCancel.status, 403);
    assert.equal(guestCancel.json.error.code, "FORBIDDEN");

    const cancel = await api(
      "DELETE",
      `${videosUrl(ctx.owner.id, ctx.project)}/tasks/${taskId}`,
      {
        token: ctx.owner.token,
      },
    );
    assert.equal(cancel.status, 200, JSON.stringify(cancel.json));
    assert.equal(cancel.json.status, "cancelled");
    assert.equal(await remaining(ctx.owner), before, "credit back (QUOTA-004)");

    let state = workerState(taskId);
    for (let i = 0; i < 40 && (state.ffmpeg || state.dir); i++) {
      await sleep(250);
      state = workerState(taskId);
    }
    assert.deepEqual(
      state,
      { dir: false, ffmpeg: false },
      "FFmpeg ended and /tmp/video/<taskId> removed",
    );

    const again = await api(
      "DELETE",
      `${videosUrl(ctx.owner.id, ctx.project)}/tasks/${taskId}`,
      {
        token: ctx.owner.token,
      },
    );
    assert.equal(again.status, 409);
    assert.equal(again.json.error.code, "TASK_NOT_ACTIVE");

    await sleep(2000);
    assert.equal(
      await db
        .collection("videos")
        .findOne({ _id: new mongoose.Types.ObjectId(taskId) }),
      null,
    );
    for (const stage of ["video_out/X.mp4", "video_thumb/X.thumb.jpg"])
      assert.equal(
        await storageHead(
          ctx.owner.id,
          `${ctx.project}/${stage.replace("X", taskId)}`,
        ),
        404,
      );

    // The slot is free again: the guest editor can submit, on the guest's quota (QUOTA-006).
    const guestBefore = await remaining(ctx.guest);
    const next = await submit(
      ctx.guest,
      ctx.owner.id,
      ctx.project,
      ctx.short,
      [STEP],
      ctx.editShare,
    );
    assert.equal(next.status, 202, JSON.stringify(next.json));
    assert.equal(await remaining(ctx.guest), guestBefore - 1);
    assert.equal(await remaining(ctx.owner), before);
    const task = await db
      .collection("videotasks")
      .findOne({ _id: new mongoose.Types.ObjectId(next.json.taskId) });
    assert.equal(String(task.runner_id), ctx.guest.id);
    await waitTask(ctx.socket, next.json.taskId, isFinal);
  });

  test("quota: 6 steps with 5 credits → 429 QUOTA_EXCEEDED {cost, remaining}, nothing reserved, project not blocked (QUOTA-001/007, D-44, ERROR-001)", async () => {
    const user = await register("free");
    const project = await createProject(user);
    const socket = await connectSocket(user.token, project);
    const video = await uploadAndIngest(user, project, socket, "short.mp4");

    const r = await submit(user, user.id, project, video, [
      STEP,
      STEP,
      STEP,
      STEP,
      STEP,
      STEP,
    ]);
    assert.equal(r.status, 429);
    assert.equal(r.json.error.code, "QUOTA_EXCEEDED");
    assert.deepEqual(r.json.error.details, { cost: 6, remaining: 5 });
    assert.ok(r.json.error.message);
    assert.match(r.json.correlationId, /^[0-9a-f-]{36}$/);
    assert.equal(await remaining(user), 5);

    const ok = await submit(user, user.id, project, video, [
      STEP,
      STEP,
      STEP,
      STEP,
      STEP,
    ]);
    assert.equal(ok.status, 202, "same project accepts the next request");
    assert.equal(await remaining(user), 0);
    await waitTask(socket, ok.json.taskId, isFinal);
    socket.close();
  });

  test("Premium: accepted with no quota call and no daily counter (QUOTA-005)", async () => {
    const project = await createProject(ctx.premium);
    const socket = await connectSocket(ctx.premium.token, project);
    const video = await uploadAndIngest(
      ctx.premium,
      project,
      socket,
      "short.mp4",
    );
    const r = await submit(ctx.premium, ctx.premium.id, project, video, [
      STEP,
      STEP,
    ]);
    assert.equal(r.status, 202);
    const done = await waitTask(socket, r.json.taskId, isFinal);
    assert.equal(done.status, "completed");
    const user = await usersDb
      .collection("users")
      .findOne({ _id: new mongoose.Types.ObjectId(ctx.premium.id) });
    assert.deepEqual(user.operations, [], "no daily operations counted");
    const task = await db
      .collection("videotasks")
      .findOne({ _id: new mongoose.Types.ObjectId(r.json.taskId) });
    assert.equal(task.reserved_credits, 0);
    socket.close();
  });

  test("validation endpoint in ≤ 1 s; invalid steps → 422 with the stable format (COM-004/005/006, D-42, D-43)", async () => {
    const url = videosUrl(ctx.owner.id, ctx.project);
    const v = await api("POST", `${url}/validate`, {
      token: ctx.owner.token,
      body: { videoId: ctx.short, steps: [STEP, STEP, STEP] },
    });
    timings.push(["POST validate", v.elapsed]);
    assert.equal(v.status, 200);
    assert.ok(v.elapsed <= 1000, `${v.elapsed} ms`);
    assert.equal(v.json.valid, true);
    assert.equal(v.json.cost, 3);
    assert.equal(v.json.output.container, "mp4");

    const bad = await api("POST", `${url}/validate`, {
      token: ctx.owner.token,
      body: {
        videoId: ctx.short,
        steps: [STEP, { operation: "nope", version: 1 }],
      },
    });
    assert.equal(bad.json.valid, false);
    assert.deepEqual(bad.json.errors, [
      {
        index: 1,
        errors: [{ code: "INVALID_STEP_PARAMS", field: "operation" }],
      },
    ]);

    const tasksBefore = await db.collection("videotasks").countDocuments();
    const r = await submit(ctx.owner, ctx.owner.id, ctx.project, ctx.short, [
      { ...STEP, version: 9 },
    ]);
    assert.equal(r.status, 422);
    assert.equal(r.json.error.code, "INVALID_STEP_PARAMS");
    assert.deepEqual(r.json.error.details, {
      index: 0,
      errors: [
        {
          code: "INVALID_STEP_PARAMS",
          field: "version",
          supportedVersions: [1],
        },
      ],
    });
    assert.ok(r.json.correlationId);
    const missing = await submit(
      ctx.owner,
      ctx.owner.id,
      ctx.project,
      ctx.short,
      [],
    );
    assert.equal(missing.status, 422);
    assert.equal(missing.json.error.code, "INVALID_REQUEST");
    assert.equal(
      await db.collection("videotasks").countDocuments(),
      tasksBefore,
      "no task created",
    );
  });

  test("access: no JWT 401, anonymous 403, other user's path 403, unknown video 404 without a task (AUTH, COM-001)", async () => {
    const url = videosUrl(ctx.owner.id, ctx.project);
    assert.equal(
      (await api("GET", `${url}/tasks/64b000000000000000000001`)).status,
      401,
    );
    const anon = await submit(ctx.anon, ctx.owner.id, ctx.project, ctx.short);
    assert.equal(anon.status, 403);
    const other = await submit(ctx.guest, ctx.owner.id, ctx.project, ctx.short);
    assert.equal(other.status, 403, "no share: not the owner's path");
    const unknown = await submit(
      ctx.owner,
      ctx.owner.id,
      ctx.project,
      "64b0000000000000000000ff",
    );
    assert.equal(unknown.status, 404);
    assert.equal(unknown.json.error.code, "NOT_FOUND");
    const notFoundTask = await api(
      "GET",
      `${url}/tasks/64b0000000000000000000ff`,
      { token: ctx.owner.token },
    );
    assert.equal(notFoundTask.status, 404);
  });

  test("correlationId of a task in the gateway, projects and worker logs; no signed URLs in logs (NFR-002, ERROR-002)", async () => {
    const r = await submit(ctx.owner, ctx.owner.id, ctx.project, ctx.short);
    assert.equal(r.status, 202);
    await waitTask(ctx.socket, r.json.taskId, isFinal);
    const task = await db
      .collection("videotasks")
      .findOne({ _id: new mongoose.Types.ObjectId(r.json.taskId) });
    const id = task.correlation_id;
    assert.match(id, /^[0-9a-f-]{36}$/);
    for (const service of ["api_gateway", "projects", "video_worker"]) {
      const logs = compose("logs", "--since", "10m", service);
      assert.ok(logs.includes(id), `${service} logs carry ${id}`);
      assert.ok(
        !/X-Amz-Signature|Signature=/.test(logs),
        `${service} logs without signatures`,
      );
    }
  });

  test("worker crash: redelivered and restarted from zero, then completed (NFR-007, AC7)", async () => {
    const c = await crashCtx();
    const r = await submit(c.user, c.user.id, c.project, c.long);
    assert.equal(r.status, 202, JSON.stringify(r.json));
    const taskId = r.json.taskId;
    const first = await waitTask(
      c.socket,
      taskId,
      (e) => e.status === "processing" && e.progress > 0,
    );
    compose("restart", "-t", "1", "video_worker");
    await waitTask(
      c.socket,
      taskId,
      (e) => e.status === "processing" && e.progress === 0 && e.at > first.at,
    );
    const done = await waitTask(c.socket, taskId, isFinal);
    assert.equal(done.status, "completed");
    const video = await db
      .collection("videos")
      .findOne({ _id: new mongoose.Types.ObjectId(taskId) });
    assert.equal(video.status, "completed");
  });

  test("two failed deliveries: dead-letter → failed PROCESSING_ERROR, credit back, no video, temporaries cleaned (NFR-007, AC7)", async () => {
    const c = await crashCtx();
    const before = await remaining(c.user);
    const r = await submit(c.user, c.user.id, c.project, c.long);
    assert.equal(r.status, 202, JSON.stringify(r.json));
    const taskId = r.json.taskId;
    const first = await waitTask(
      c.socket,
      taskId,
      (e) => e.status === "processing" && e.progress > 0,
    );
    compose("restart", "-t", "1", "video_worker");
    const second = await waitTask(
      c.socket,
      taskId,
      (e) =>
        e.status === "processing" && e.progress > 0 && e.at > first.at + 500,
    );
    assert.ok(second);
    compose("restart", "-t", "1", "video_worker");

    const done = await waitTask(c.socket, taskId, isFinal, 60000);
    assert.equal(done.status, "failed");
    assert.deepEqual(done.error, { code: "PROCESSING_ERROR" });
    assert.equal(await remaining(c.user), before, "credit back");
    assert.equal(
      await db
        .collection("videos")
        .findOne({ _id: new mongoose.Types.ObjectId(taskId) }),
      null,
    );
    let state = workerState(taskId);
    for (let i = 0; i < 40 && state.dir; i++) {
      await sleep(250);
      state = workerState(taskId);
    }
    assert.equal(
      state.dir,
      false,
      "/tmp/video/<taskId> cleaned after the dead-letter",
    );
    const lock = await db
      .collection("video_project_locks")
      .findOne({ project_id: new mongoose.Types.ObjectId(c.project) });
    assert.equal(lock, null, "slot freed");
  });

  test("maintenance: orphan slot and abandoned upload removed within one run (T-03, D-15, D-41)", async () => {
    const project = await createProject(ctx.owner, "e2e b003 maintenance");
    const old = new Date(Date.now() - 25 * 60 * 1000);
    await db.collection("video_project_locks").insertOne({
      project_id: new mongoose.Types.ObjectId(project),
      holder_kind: "task",
      holder_id: new mongoose.Types.ObjectId(),
      createdAt: old,
    });
    const ticket = await api(
      "POST",
      `${videosUrl(ctx.owner.id, project)}/uploads`,
      {
        token: ctx.owner.token,
        body: {
          fileName: "short.mp4",
          mimeType: "video/mp4",
          sizeBytes: fs.statSync(path.join(FIXTURES, "short.mp4")).size,
        },
      },
    );
    const put = await fetch(ticket.json.upload.url, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4" },
      body: fs.readFileSync(path.join(FIXTURES, "short.mp4")),
    });
    assert.equal(put.status, 200);
    const videoId = new mongoose.Types.ObjectId(ticket.json.videoId);
    const original = (await db.collection("videos").findOne({ _id: videoId }))
      .storage.original_key;
    assert.equal(await storageHead(ctx.owner.id, original), 200);
    await db
      .collection("videos")
      .updateOne({ _id: videoId }, { $set: { updatedAt: old } });

    let lock;
    let video;
    for (let i = 0; i < 80; i++) {
      lock = await db
        .collection("video_project_locks")
        .findOne({ project_id: new mongoose.Types.ObjectId(project) });
      video = await db.collection("videos").findOne({ _id: videoId });
      if (!lock && !video) break;
      await sleep(1000);
    }
    assert.equal(lock, null, "orphan slot released");
    assert.equal(video, null, "abandoned upload record deleted");
    assert.equal(
      await storageHead(ctx.owner.id, original),
      404,
      "abandoned upload object deleted",
    );
  });
});
