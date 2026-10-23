// B008 through nginx/API/MongoDB/RabbitMQ/storage/worker/users. Explicitly opt in:
// VIDEO_E2E_URL=https://nginx VIDEO_E2E_FIXTURES=/tmp/b008-e2e-fixtures \
// NODE_TLS_REJECT_UNAUTHORIZED=0 [VIDEO_E2E_OUTPUTS=/tmp/b008-outputs] \
// node --test test/video/e2e-composition.test.js
// Own users/projects/objects/presets/marks and the exclusive AMQP observer are
// cleaned in after(); nothing is removed by global names.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const amqp = require("amqplib");

const BASE = process.env.VIDEO_E2E_URL,
  FIXTURES = process.env.VIDEO_E2E_FIXTURES,
  OUTPUTS = process.env.VIDEO_E2E_OUTPUTS;
const skip =
  !BASE || !FIXTURES ? "set VIDEO_E2E_URL and VIDEO_E2E_FIXTURES" : false;
const MONGO =
  process.env.VIDEO_E2E_MONGO || "mongodb://projects_mongoDB:27018/project";
const USERS =
  process.env.VIDEO_E2E_USERS_MONGO || "mongodb://users_mongoDB:27019/user";
const STORAGE =
  process.env.VIDEO_E2E_STORAGE || "http://img_storage:11000/video";
const BROKER = process.env.VIDEO_E2E_AMQP || "amqp://user:password@rabbitmq";
const state = {
  users: [],
  projects: [],
  sources: {},
  free: {},
  replies: [],
  ws: [],
  tasks: {},
};
const oid = (id) => new mongoose.Types.ObjectId(id);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function publicUrl(url) {
  const source = new URL(url),
    base = new URL(BASE);
  if (source.hostname === "localhost" || source.hostname === "127.0.0.1") {
    source.protocol = base.protocol;
    source.hostname = base.hostname;
    source.port = base.port;
  }
  return source.toString();
}
async function request(
  method,
  route,
  user,
  { json, raw, type, headers = {} } = {},
) {
  const response = await fetch(`${BASE}/api-gateway${route}`, {
    method,
    headers: {
      ...(user ? { Authorization: `Bearer ${user.token}` } : {}),
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(raw ? { "Content-Type": type } : {}),
      ...headers,
    },
    body: json ? JSON.stringify(json) : raw,
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  let data = buffer.toString();
  if ((response.headers.get("content-type") || "").includes("json"))
    data = JSON.parse(data || "null");
  return { status: response.status, data };
}
const api = (method, route, user, json) =>
  request(method, route, user, { json });
async function until(fn, label, timeout = 240000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const result = await fn();
    if (result) return result;
    await sleep(150);
  }
  throw new Error(`timeout: ${label}`);
}
async function register(type) {
  const r = await api("POST", "/users", null, {
    name: "B008 persistent test",
    email: `b008-${type}-${Date.now()}-${Math.random().toString(16).slice(2)}@test.local`,
    password: "b008-test-password",
    type,
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const user = { id: r.data.user._id, token: r.data.jwt };
  state.users.push(user);
  return user;
}
const videos = (user, project) => `/projects/${user.id}/${project}/videos`;
async function project(user) {
  const r = await api("POST", `/projects/${user.id}`, user, {
    name: "B008 persistent test",
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  state.projects.push({ id: r.data._id, user });
  return r.data._id;
}
async function upload(user, p, name, as = name) {
  const data = fs.readFileSync(path.join(FIXTURES, name));
  const r = await api("POST", `${videos(user, p)}/uploads`, user, {
    fileName: as,
    mimeType: "video/mp4",
    sizeBytes: data.length,
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const put = await fetch(publicUrl(r.data.upload.url), {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: data,
  });
  assert.equal(put.status, 200, await put.text());
  assert.equal(
    (
      await api(
        "POST",
        `${videos(user, p)}/${r.data.videoId}/upload/complete`,
        user,
      )
    ).status,
    202,
  );
  await until(async () => {
    const d = await state.db
      .collection("videos")
      .findOne({ _id: oid(r.data.videoId) });
    if (d?.status === "failed") throw new Error(JSON.stringify(d.error));
    return d?.status === "completed" && d;
  }, `ingest ${name}`);
  return r.data.videoId;
}
const step = (operation, parameters = {}) => ({
  operation,
  version: 1,
  parameters,
});
const clip = (videoId, steps = []) => ({ videoId, steps });
const concat = (...clips) => step("concat", { clips });
const ADJUST = step("adjust", {
  brightness: 1.2,
  contrastFactor: 1,
  saturationFactor: 1,
});
const validate = (user, p, steps, videoId) =>
  api(
    "POST",
    `${videos(user, p)}/validate`,
    user,
    videoId ? { videoId, steps } : { steps },
  );
const submit = (user, p, steps, videoId) =>
  api(
    "POST",
    videoId
      ? `${videos(user, p)}/${videoId}/operations`
      : `${videos(user, p)}/operations`,
    user,
    { steps },
  );
async function finish(user, p, id) {
  return until(async () => {
    const r = await api("GET", `${videos(user, p)}/tasks/${id}`, user);
    assert.equal(r.status, 200);
    return (
      ["completed", "failed", "cancelled"].includes(r.data.status) && r.data
    );
  }, `task ${id}`);
}
async function remaining(user) {
  return (await api("GET", `/users/${user.id}`, user)).data
    .remaining_operations;
}
async function storageUrl(kind, body) {
  const r = await fetch(`${STORAGE}/url/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assert.equal(r.status, 200);
  return (await r.json()).url;
}
async function readObject(userId, key) {
  const [projectId, stage, name] = key.split("/");
  const file = await fetch(
    await storageUrl("get", { userId, projectId, stage, name, public: false }),
  );
  assert.equal(file.status, 200);
  return Buffer.from(await file.arrayBuffer());
}
const objectStatus = async (userId, key) =>
  (await fetch(`${STORAGE}/object/${userId}/${key}`, { method: "HEAD" }))
    .status;
async function taskCount(p) {
  return state.db
    .collection("videotasks")
    .countDocuments({ project_id: oid(p) });
}
// Accepts, waits, and returns the stored task and result (and keeps the result
// for the playback check of the host when VIDEO_E2E_OUTPUTS is set).
async function run(user, p, steps, videoId, label) {
  const r = await submit(user, p, steps, videoId);
  assert.equal(r.status, 202, JSON.stringify(r.data));
  const done = await finish(user, p, r.data.taskId);
  assert.equal(done.status, "completed", JSON.stringify(done));
  const task = await state.db
    .collection("videotasks")
    .findOne({ _id: oid(done.taskId) });
  const output = await until(
    () =>
      state.db.collection("videos").findOne({ _id: oid(done.resultVideoId) }),
    "result video",
  );
  const info = await api("GET", `${videos(user, p)}/${output._id}`, user);
  assert.equal(info.status, 200, JSON.stringify(info.data));
  state.tasks[label] = done.taskId;
  if (OUTPUTS) {
    const ext = path.extname(output.storage.original_key);
    fs.writeFileSync(
      path.join(OUTPUTS, `${label}${ext}`),
      await readObject(user.id, output.storage.original_key),
    );
    if (output.storage.preview_key)
      fs.writeFileSync(
        path.join(OUTPUTS, `${label}-preview.mp4`),
        await readObject(user.id, output.storage.preview_key),
      );
  }
  return { done, task, output, info: info.data };
}
async function rejected(user, p, steps, videoId, status, code, details) {
  const before = await taskCount(p);
  for (const r of [
    await validate(user, p, steps, videoId),
    await submit(user, p, steps, videoId),
  ]) {
    assert.equal(r.status, status, JSON.stringify([steps, r.data]));
    assert.equal(r.data.error.code, code, JSON.stringify(r.data));
    assert.ok(r.data.correlationId);
    if (details)
      for (const [k, v] of Object.entries(details))
        assert.deepEqual(r.data.error.details[k], v, JSON.stringify(r.data));
  }
  assert.equal(await taskCount(p), before, "no task created");
}
// D-86 + quota: valid on validation, refused with QUOTA_EXCEEDED before any
// task for a Registered user whose daily credits do not cover N.
async function validButOverQuota(user, p, steps, videoId, cost) {
  const before = await taskCount(p);
  const credits = await remaining(user);
  const check = await validate(user, p, steps, videoId);
  assert.equal(check.status, 200, JSON.stringify(check.data));
  assert.deepEqual([check.data.valid, check.data.cost], [true, cost]);
  const r = await submit(user, p, steps, videoId);
  assert.equal(r.status, 429, JSON.stringify(r.data));
  assert.equal(r.data.error.code, "QUOTA_EXCEEDED");
  assert.equal(r.data.error.details.cost, cost);
  assert.equal(await taskCount(p), before, "no task created");
  assert.equal(await remaining(user), credits, "no credit used");
}
async function deleteOwnBucket(user) {
  const bucket = `user-${user.id}`;
  const endpoint = process.env.VIDEO_E2E_S3 || "http://seaweedfs:9000";
  async function s3(method, key = "") {
    const resource = `/${bucket}${key ? "/" + key : ""}`,
      date = new Date().toUTCString();
    const signature = crypto
      .createHmac("sha1", process.env.VIDEO_E2E_S3_SECRET || "admin123")
      .update(`${method}\n\n\n${date}\n${resource}`)
      .digest("base64");
    return fetch(endpoint + resource, {
      method,
      headers: {
        Date: date,
        Authorization: `AWS ${process.env.VIDEO_E2E_S3_ACCESS || "admin"}:${signature}`,
      },
    });
  }
  const listing = await s3("GET");
  if (listing.status === 404) return;
  assert.equal(listing.status, 200);
  const xml = await listing.text();
  for (const key of [...xml.matchAll(/<Key>(.*?)<\/Key>/g)].map((m) => m[1])) {
    assert.ok(
      ["src/", "preview/", "out/"].includes(key) ||
        state.projects.some(
          (p) => p.user.id === user.id && key.startsWith(p.id + "/"),
        ),
      `unexpected key in own bucket: ${key}`,
    );
    await s3("DELETE", key);
  }
  await s3("DELETE");
}

test.describe("B008 real stack", { skip, timeout: 1800000 }, () => {
  test.before(async () => {
    state.db = mongoose.createConnection(MONGO);
    await state.db.asPromise();
    state.usersDb = mongoose.createConnection(USERS);
    await state.usersDb.asPromise();
    state.connection = await amqp.connect(BROKER);
    state.channel = await state.connection.createChannel();
    const q = await state.channel.assertQueue("", {
      exclusive: true,
      autoDelete: true,
    });
    await state.channel.bindQueue(q.queue, "picturas", "video_project_queue");
    await state.channel.bindQueue(q.queue, "picturas", "video_ws_queue");
    await state.channel.consume(
      q.queue,
      (m) =>
        m &&
        (m.fields.routingKey === "video_ws_queue"
          ? state.ws
          : state.replies
        ).push(JSON.parse(m.content)),
      { noAck: true },
    );
    state.owner = await register("premium");
    state.project = await project(state.owner);
    for (const name of [
      "odd.mp4",
      "wide.mp4",
      "tall.mp4",
      "phone.mp4",
      "long.mp4",
    ])
      state.sources[name] = await upload(state.owner, state.project, name);
    state.free.user = await register("free");
    state.free.project = await project(state.free.user);
    for (const name of ["wide.mp4", "long.mp4"])
      state.free[name] = await upload(
        state.free.user,
        state.free.project,
        name,
      );
  });

  test.after(async () => {
    try {
      if (OUTPUTS)
        fs.writeFileSync(
          path.join(OUTPUTS, "tasks.json"),
          JSON.stringify(state.tasks, null, 2),
        );
      for (const { id, user } of state.projects) {
        const query = { project_id: oid(id) };
        const keys = new Set();
        for (const v of await state.db
          .collection("videos")
          .find(query)
          .toArray())
          for (const key of Object.values(v.storage || {}))
            if (typeof key === "string") keys.add(key);
        for (const t of await state.db
          .collection("videotasks")
          .find(query)
          .toArray()) {
          if (["queued", "processing"].includes(t.status))
            await api("DELETE", `${videos(user, id)}/tasks/${t._id}`, user);
          for (const target of Object.values(t.plan?.targets || {}))
            keys.add(`${target.projectId}/${target.stage}/${target.name}`);
        }
        for (const mark of await state.db
          .collection("video_watermarks")
          .find(query)
          .toArray())
          keys.add(`${id}/video_src/wm-${mark._id}.png`);
        await sleep(500);
        for (const key of keys) {
          assert.ok(key.startsWith(`${id}/`));
          await fetch(`${STORAGE}/object/${user.id}/${key}`, {
            method: "DELETE",
          });
        }
        for (const name of [
          "videos",
          "videotasks",
          "video_project_locks",
          "video_watermarks",
        ])
          await state.db.collection(name).deleteMany(query);
        await state.db.collection("projects").deleteOne({ _id: oid(id) });
      }
      for (const user of state.users) {
        await deleteOwnBucket(user);
        await state.usersDb
          .collection("videopresets")
          .deleteMany({ owner_id: oid(user.id) });
        await state.usersDb
          .collection("users")
          .deleteOne({ _id: oid(user.id) });
      }
    } finally {
      try {
        await state.channel?.close();
      } finally {
        await state.connection?.close();
        await Promise.allSettled([state.db?.close(), state.usersDb?.close()]);
      }
    }
  });

  test("heterogeneous concat with a repeated odd first clip: one task, estimates, result, names (UC-VID-013, D-35, D-75)", async () => {
    const s = state.sources,
      user = state.owner,
      p = state.project;
    const ids = [
      s["odd.mp4"],
      s["wide.mp4"],
      s["tall.mp4"],
      s["phone.mp4"],
      s["odd.mp4"],
    ];
    const steps = [concat(...ids.map((id) => clip(id)))];
    const check = await validate(user, p, steps);
    assert.equal(check.status, 200, JSON.stringify(check.data));
    assert.equal(check.data.valid, true);
    assert.deepEqual([check.data.cost, check.data.totalSteps], [1, 1]);
    assert.deepEqual(
      [
        check.data.output.width,
        check.data.output.height,
        check.data.output.fpsNum,
        check.data.output.fpsDen,
      ],
      [320, 240, 25, 1],
    );
    assert.equal(check.data.output.audioCodec, "aac");
    const { task, output, info } = await run(
      user,
      p,
      steps,
      null,
      "concat-heterogeneous",
    );
    assert.deepEqual(
      [task.kind, task.cost, task.total_steps],
      ["concat", 1, 1],
    );
    assert.deepEqual(task.input_video_ids.map(String), ids);
    assert.deepEqual(
      task.plan.inputs.map((i) => i.videoId),
      ids.slice(0, 4),
    );
    assert.deepEqual(
      task.plan.composition.clips.map((c) => c.file),
      [0, 1, 2, 3, 0],
    );
    assert.deepEqual(
      output.source_video_ids.map(String),
      ids,
      "order with repetitions (CONCAT-001)",
    );
    assert.equal(output.recipe[0].operation, "concat");
    assert.deepEqual(
      [
        output.meta.width,
        output.meta.height,
        output.meta.fps_num,
        output.meta.fps_den,
      ],
      [320, 240, 25, 1],
    );
    assert.deepEqual(
      [output.meta.video_codec, output.meta.audio_codec, output.meta.container],
      ["h264", "aac", "mp4"],
    );
    assert.ok(
      Math.abs(output.meta.duration_ms - 11000) <= 150,
      String(output.meta.duration_ms),
    );
    // D-35/D-75: name of the first source with the real extension; download with the top-level steps.
    assert.equal(output.original_name, "odd.mp4");
    assert.equal(info.originalName, "odd.mp4");
    assert.equal(info.downloadFileName, "odd_concat.mp4");
    const reply = await until(
      () =>
        state.replies.find(
          (m) => m.taskId === task._id.toString() && m.status === "completed",
        ),
      "reply",
    );
    assert.equal(reply.output.meta.width, 320);
  });

  test("concat with sub-chains (trim, speed, filter, watermark in a clip) and final steps; N steps and step k of N", async () => {
    const s = state.sources,
      user = state.owner,
      p = state.project;
    const steps = [
      concat(
        clip(s["wide.mp4"], [
          step("trim", { startMs: 500, endMs: 2500 }),
          step("filter", { filter: "sepia" }),
        ]),
        clip(s["phone.mp4"], [step("speed", { factor: 2 })]),
        clip(s["odd.mp4"], [
          step("watermark", {
            type: "text",
            text: "B008",
            position: { preset: "center" },
            scale: 0.3,
            opacity: 0.8,
          }),
        ]),
      ),
      step("orient", { rotation: 90, flipH: false, flipV: false }),
      ADJUST,
    ];
    const check = await validate(user, p, steps);
    assert.equal(check.status, 200, JSON.stringify(check.data));
    assert.deepEqual([check.data.cost, check.data.totalSteps], [7, 7]);
    assert.deepEqual(
      [check.data.output.width, check.data.output.height],
      [360, 640],
    );
    assert.ok(Math.abs(check.data.output.durationMs - 5000) <= 50);
    const { task, output, info } = await run(
      user,
      p,
      steps,
      null,
      "concat-subchains",
    );
    assert.deepEqual(
      [task.kind, task.cost, task.total_steps, task.reserved_credits],
      ["concat", 7, 7, 0],
    );
    assert.ok(
      task.steps[0].parameters.clips[2].steps[0].parameters._mark.watermarkId,
      "server _mark in the clip",
    );
    assert.deepEqual([output.meta.width, output.meta.height], [360, 640]);
    assert.ok(
      Math.abs(output.meta.duration_ms - 5000) <= 150,
      String(output.meta.duration_ms),
    );
    assert.equal(info.downloadFileName, "wide_concat_orient_adjust.mp4");
    const events = state.ws.filter(
      (e) =>
        e.taskId === String(task._id) && e.status === "processing" && e.step,
    );
    assert.ok(events.length);
    assert.ok(
      events.every((e) => e.totalSteps === 7 && e.step >= 1 && e.step <= 7),
    );
  });

  test("chain without concat: trim + watermark + filter in one task (generic path, keyframe and visual_input)", async () => {
    const user = state.owner,
      p = state.project,
      video = state.sources["wide.mp4"];
    const steps = [
      step("trim", { startMs: 1000, endMs: 2500 }),
      step("watermark", {
        type: "text",
        text: "B008",
        position: { preset: "bottom-right" },
        scale: 0.2,
        opacity: 1,
      }),
      step("filter", { filter: "bw" }),
    ];
    const { task, output, info } = await run(
      user,
      p,
      steps,
      video,
      "chain-generic",
    );
    assert.deepEqual([task.kind, task.cost, task.total_steps], ["chain", 3, 3]);
    assert.equal(task.plan.composition, undefined);
    assert.ok(Math.abs(output.meta.duration_ms - 1500) <= 100);
    assert.deepEqual(output.source_video_ids.map(String), [video]);
    assert.equal(output.original_name, "wide.mp4");
    assert.equal(info.downloadFileName, "wide_trim_watermark_filter.mp4");
    const reply = await until(
      () =>
        state.replies.find(
          (m) => m.taskId === String(task._id) && m.status === "completed",
        ),
      "reply",
    );
    assert.equal(reply.metadata.videoMode, "encode");
  });

  test("chains ending in convert: MOV (generic path), AVI (composition path, preview in the same invocation), concat to AVI; MP4 is SAME_FORMAT", async () => {
    const s = state.sources,
      user = state.owner,
      p = state.project;
    const mov = await run(
      user,
      p,
      [ADJUST, step("convert", { target: "mov" })],
      s["wide.mp4"],
      "chain-to-mov",
    );
    assert.equal(mov.task.plan.convert, undefined);
    assert.deepEqual(
      [
        mov.output.meta.container,
        mov.output.meta.video_codec,
        mov.output.meta.audio_codec,
      ],
      ["mov", "h264", "aac"],
    );
    assert.ok(mov.output.storage.preview_key);
    assert.equal(mov.output.original_name, "wide.mov");
    assert.equal(mov.info.downloadFileName, "wide_adjust_convert.mov");

    const avi = await run(
      user,
      p,
      [ADJUST, step("convert", { target: "avi" })],
      s["wide.mp4"],
      "chain-to-avi",
    );
    assert.deepEqual(avi.task.plan.convert, { previewInSameInvocation: true });
    assert.deepEqual(
      [
        avi.output.meta.container,
        avi.output.meta.video_codec,
        avi.output.meta.audio_codec,
      ],
      ["avi", "mpeg4", "mp3"],
    );
    assert.ok(avi.output.storage.preview_key);
    assert.equal(avi.output.original_name, "wide.avi");
    assert.equal(avi.info.downloadFileName, "wide_adjust_convert.avi");
    const reply = await until(
      () =>
        state.replies.find(
          (m) => m.taskId === String(avi.task._id) && m.status === "completed",
        ),
      "reply",
    );
    assert.equal(reply.output.previewMade, true);

    const concatAvi = await run(
      user,
      p,
      [
        concat(clip(s["wide.mp4"]), clip(s["tall.mp4"])),
        step("convert", { target: "avi" }),
      ],
      null,
      "concat-to-avi",
    );
    assert.equal(concatAvi.output.meta.container, "avi");
    assert.equal(concatAvi.info.downloadFileName, "wide_concat_convert.avi");
    assert.ok(concatAvi.output.storage.preview_key);

    // Every operation produces MP4 (DQ-013): a final conversion to MP4 is SAME_FORMAT.
    const same = await submit(
      user,
      p,
      [ADJUST, step("convert", { target: "mp4" })],
      s["wide.mp4"],
    );
    assert.equal(same.status, 422, JSON.stringify(same.data));
    assert.equal(same.data.error.code, "INVALID_STEP_PARAMS");
    assert.equal(same.data.error.details.errors[0].code, "SAME_FORMAT");
  });

  test("INVALID_CHAIN rules (D-79), no fixed limits (D-86) with the quota before the task, routes (D-78), concat errors", async () => {
    const user = state.free.user,
      p = state.free.project,
      video = state.free["wide.mp4"];
    const before = await remaining(user);
    await rejected(user, p, [], video, 422, "INVALID_CHAIN", {
      rule: "empty_chain",
    }); // CHAIN-007
    await rejected(
      user,
      p,
      [
        step("trim", { startMs: 0, endMs: 1000 }),
        step("convert", { target: "mov" }),
        ADJUST,
      ],
      video,
      422,
      "INVALID_CHAIN",
      { rule: "convert_not_last", index: 1 },
    );
    await rejected(
      user,
      p,
      [ADJUST, step("extract_frames")],
      video,
      422,
      "INVALID_CHAIN",
      { rule: "frame_extraction", index: 1 },
    );
    // No fixed number of steps (D-86): 11 steps are valid; the Registered
    // quota (5 a day) refuses them before any task (QUOTA_EXCEEDED, 429).
    await validButOverQuota(user, p, Array(11).fill(ADJUST), video, 11);
    // With :video and a concat (D-78).
    await rejected(
      user,
      p,
      [concat(clip(video), clip(video))],
      video,
      422,
      "INVALID_REQUEST",
      { field: "steps" },
    );
    // Without :video.
    await rejected(
      user,
      p,
      [concat(clip(video), clip(video)), concat(clip(video), clip(video))],
      null,
      422,
      "INVALID_CHAIN",
      { rule: "multiple_concat", index: 1 },
    );
    await rejected(
      user,
      p,
      [concat(clip(video, [concat(clip(video), clip(video))]), clip(video))],
      null,
      422,
      "INVALID_CHAIN",
      { rule: "multiple_concat", clipIndex: 0, stepIndex: 0 },
    );
    await rejected(
      user,
      p,
      [concat(clip(video, [step("convert", { target: "mov" })]), clip(video))],
      null,
      422,
      "INVALID_CHAIN",
      { rule: "convert_not_last", clipIndex: 0 },
    );
    await validButOverQuota(
      user,
      p,
      [concat(clip(video), clip(video, Array(10).fill(ADJUST)))],
      null,
      11,
    );
    await rejected(
      user,
      p,
      [concat(clip(video))],
      null,
      422,
      "INSUFFICIENT_INPUTS",
    );
    // No fixed number of clips (D-86): 11 clips for a Registered user, cost 1.
    const eleven = await validate(user, p, [
      concat(...Array(11).fill(clip(video))),
    ]);
    assert.equal(eleven.status, 200, JSON.stringify(eleven.data));
    assert.deepEqual([eleven.data.valid, eleven.data.cost], [true, 1]);
    const missing = "64b0000000000000000000ff";
    await rejected(
      user,
      p,
      [concat(clip(video), clip(missing))],
      null,
      404,
      "NOT_FOUND",
      { videoId: missing, clipIndex: 1 },
    );
    // concat_not_first on both routes: the structure comes before the route check (D-80).
    await rejected(
      user,
      p,
      [ADJUST, concat(clip(video), clip(video))],
      video,
      422,
      "INVALID_CHAIN",
      { rule: "concat_not_first", index: 1 },
    );
    const notFirst = await submit(
      user,
      p,
      [ADJUST, concat(clip(video), clip(video))],
      null,
    );
    assert.deepEqual(
      [
        notFirst.status,
        notFirst.data.error.code,
        notFirst.data.error.details.rule,
      ],
      [422, "INVALID_CHAIN", "concat_not_first"],
    );
    // A chain without concat on the route without :video (D-78).
    const noVideo = await submit(user, p, [ADJUST], null);
    assert.deepEqual(
      [
        noVideo.status,
        noVideo.data.error.code,
        noVideo.data.error.details.field,
      ],
      [422, "INVALID_REQUEST", "steps"],
    );
    assert.equal(await remaining(user), before, "no quota used");
  });

  test("order of the phases (D-80) and LIMIT_EXCEEDED (D-81) for the Registered profile", async () => {
    const user = state.free.user,
      p = state.free.project,
      long = state.free["long.mp4"],
      wide = state.free["wide.mp4"];
    const before = await remaining(user);
    // Structure before steps: invalid parameters in a chain with a misplaced convert → INVALID_CHAIN.
    await rejected(
      user,
      p,
      [
        step("speed", { factor: 9 }),
        step("convert", { target: "mov" }),
        ADJUST,
      ],
      wide,
      422,
      "INVALID_CHAIN",
      { rule: "convert_not_last", index: 1 },
    );
    // Without concat, invalid parameters that would also exceed 5 min → INVALID_STEP_PARAMS (B003).
    const invalid = await submit(
      user,
      p,
      [step("speed", { factor: 0.1 })],
      long,
    );
    assert.equal(invalid.status, 422, JSON.stringify(invalid.data));
    assert.equal(invalid.data.error.code, "INVALID_STEP_PARAMS");
    // Valid parameters above 5 min: 90 s at 0.25× = 360 s → LIMIT_EXCEEDED of the result.
    await rejected(
      user,
      p,
      [step("speed", { factor: 0.25 })],
      long,
      422,
      "LIMIT_EXCEEDED",
      { total: 360000, limit: 300000 },
    );
    // Concat sum counting repetitions: 4 × 90 s = 360 s.
    await rejected(
      user,
      p,
      [concat(...Array(4).fill(clip(long)))],
      null,
      422,
      "LIMIT_EXCEEDED",
      { total: 360000, limit: 300000 },
    );
    // Final step: (90 + 3) s at 0.5× = 186 s fine; (90 + 90) s at 0.5× = 360 s → LIMIT_EXCEEDED.
    await rejected(
      user,
      p,
      [concat(clip(long), clip(long)), step("speed", { factor: 0.5 })],
      null,
      422,
      "LIMIT_EXCEEDED",
      { total: 360000, limit: 300000 },
    );
    // Intermediate outputs are not limited: 90 s at 0.25× (360 s) then trimmed to 60 s.
    const ok = await validate(
      user,
      p,
      [
        step("speed", { factor: 0.25 }),
        step("trim", { startMs: 0, endMs: 60000 }),
      ],
      long,
    );
    assert.equal(ok.status, 200, JSON.stringify(ok.data));
    assert.equal(ok.data.valid, true);
    // A step error inside a clip carries its address (200 on validate).
    const inner = await validate(user, p, [
      concat(clip(wide), clip(wide, [step("speed", { factor: 9 })])),
    ]);
    assert.equal(inner.status, 200);
    assert.deepEqual(
      [
        inner.data.errors[0].index,
        inner.data.errors[0].clipIndex,
        inner.data.errors[0].stepIndex,
      ],
      [0, 1, 0],
    );
    assert.equal(await remaining(user), before);
  });

  test("Registered: N credits reserved for a chain, cancellation refunds N, step k of N (QUOTA-008, CHAIN-013)", async () => {
    const user = state.free.user,
      p = state.free.project,
      long = state.free["long.mp4"],
      wide = state.free["wide.mp4"];
    const start = await remaining(user);
    // A chain of 2 steps on the short video, completed: 2 credits.
    const done = await run(
      user,
      p,
      [ADJUST, step("filter", { filter: "sepia" })],
      wide,
      "free-chain",
    );
    assert.deepEqual([done.task.cost, done.task.reserved_credits], [2, 2]);
    assert.equal(await remaining(user), start - 2);
    // A concat of 3 steps on the long video, cancelled after progress: 3 credits back.
    const before = await remaining(user);
    // concat (1) + one clip step (1) + one final step (1) = 3.
    const steps = [
      concat(clip(long, [ADJUST]), clip(wide)),
      step("filter", { filter: "bw" }),
    ];
    const r = await submit(user, p, steps, null);
    assert.equal(r.status, 202, JSON.stringify(r.data));
    assert.equal(await remaining(user), before - 3);
    await until(
      () => state.ws.find((e) => e.taskId === r.data.taskId && e.progress > 0),
      "progress",
      90000,
    );
    const cancelled = await api(
      "DELETE",
      `${videos(user, p)}/tasks/${r.data.taskId}`,
      user,
    );
    assert.equal(cancelled.status, 200, JSON.stringify(cancelled.data));
    assert.equal((await finish(user, p, r.data.taskId)).status, "cancelled");
    await until(
      async () => (await remaining(user)) === before,
      "3 credits refunded",
    );
    assert.equal(
      await state.db
        .collection("videos")
        .countDocuments({ _id: oid(r.data.taskId) }),
      0,
      "no result",
    );
    const task = await state.db
      .collection("videotasks")
      .findOne({ _id: oid(r.data.taskId) });
    assert.deepEqual(
      [task.total_steps, task.reserved_credits, task.refund.state],
      [3, 3, "done"],
    );
    for (const target of Object.values(task.plan.targets))
      assert.equal(
        await objectStatus(
          user.id,
          `${target.projectId}/${target.stage}/${target.name}`,
        ),
        404,
      );
    const events = state.ws.filter(
      (e) => e.taskId === r.data.taskId && e.status === "processing" && e.step,
    );
    assert.ok(
      events.every((e) => e.totalSteps === 3 && e.step >= 1 && e.step <= 3),
    );
  });

  test("error.phase on failures: download (source missing) and encode (corrupted source), GET and event (D-82)", async () => {
    const user = state.owner,
      p = state.project;
    const victim = await upload(user, p, "wide.mp4", "victim.mp4");
    const corrupt = await upload(user, p, "wide.mp4", "corrupt.mp4");
    // Download: the stored original disappears after the ingestion.
    const v1 = await state.db
      .collection("videos")
      .findOne({ _id: oid(victim) });
    await fetch(`${STORAGE}/object/${user.id}/${v1.storage.original_key}`, {
      method: "DELETE",
    });
    // Encode: the stored original is replaced by bytes FFmpeg cannot read.
    const v2 = await state.db
      .collection("videos")
      .findOne({ _id: oid(corrupt) });
    const [projectId, stage, name] = v2.storage.original_key.split("/");
    const put = await fetch(
      await storageUrl("put", {
        userId: user.id,
        projectId,
        stage,
        name,
        contentType: "video/mp4",
        public: false,
      }),
      {
        method: "PUT",
        headers: { "Content-Type": "video/mp4" },
        body: crypto.randomBytes(8192),
      },
    );
    assert.equal(put.status, 200);
    for (const [video, code, phase] of [
      [victim, "RESOURCE_UNAVAILABLE", "download"],
      [corrupt, "PROCESSING_ERROR", "encode"],
    ]) {
      const r = await submit(
        user,
        p,
        [ADJUST, step("filter", { filter: "bw" })],
        video,
      );
      assert.equal(r.status, 202, JSON.stringify(r.data));
      const done = await finish(user, p, r.data.taskId);
      assert.equal(done.status, "failed");
      assert.deepEqual([done.error.code, done.error.phase], [code, phase]);
      const reply = await until(
        () =>
          state.replies.find(
            (m) => m.taskId === r.data.taskId && m.status === "failed",
          ),
        "failed reply",
      );
      assert.equal(reply.error.phase, phase);
      const event = await until(
        () =>
          state.ws.find(
            (e) => e.taskId === r.data.taskId && e.status === "failed",
          ),
        "failed event",
      );
      assert.deepEqual(event.error, { code, phase });
    }
  });

  test("video presets: create, PATCH, duplicate name, concat, anonymous, other user, delete; image mark in another project (D-83, D-84, D-85)", async () => {
    const owner = state.owner,
      p = state.project,
      base = `/users/${owner.id}/video-presets`;
    const created = await api("POST", base, owner, {
      name: "720p + marca",
      steps: [
        step("resize", { width: 1280, height: 720 }),
        {
          ...ADJUST,
          parameters: { ...ADJUST.parameters, _input: { fpsNum: 1 } },
        },
      ],
    });
    assert.equal(created.status, 201, JSON.stringify(created.data));
    assert.deepEqual(
      created.data.steps[1].parameters,
      ADJUST.parameters,
      "server fields removed",
    );
    const list = await api("GET", base, owner);
    assert.equal(list.status, 200);
    assert.deepEqual(
      list.data.map((x) => x.name),
      ["720p + marca"],
    );
    const renamed = await api("PATCH", `${base}/${created.data.id}`, owner, {
      name: "Vertical",
      steps: [step("orient", { rotation: 90, flipH: false, flipV: false })],
    });
    assert.equal(renamed.status, 200, JSON.stringify(renamed.data));
    assert.deepEqual(
      [renamed.data.name, renamed.data.steps[0].operation],
      ["Vertical", "orient"],
    );
    const duplicate = await api("POST", base, owner, {
      name: "  vertical ",
      steps: [ADJUST],
    });
    assert.equal(duplicate.status, 409, JSON.stringify(duplicate.data));
    assert.equal(duplicate.data.error.code, "PRESET_NAME_TAKEN");
    const withConcat = await api("POST", base, owner, {
      name: "Junção",
      steps: [
        concat(
          clip(state.sources["wide.mp4"]),
          clip(state.sources["tall.mp4"]),
        ),
      ],
    });
    assert.equal(withConcat.status, 422);
    assert.deepEqual(
      [
        withConcat.data.error.code,
        withConcat.data.error.details.rule,
        withConcat.data.error.details.index,
      ],
      ["INVALID_CHAIN", "concat_in_preset", 0],
    );
    const unknown = await api("POST", base, owner, {
      name: "X",
      steps: [step("blur")],
    });
    assert.deepEqual(
      [unknown.status, unknown.data.error.code],
      [422, "INVALID_STEP_PARAMS"],
    );
    const anonymous = await register("anonymous");
    const anon = await api(
      "POST",
      `/users/${anonymous.id}/video-presets`,
      anonymous,
      { name: "A", steps: [ADJUST] },
    );
    assert.deepEqual([anon.status, anon.data.error.code], [403, "FORBIDDEN"]);
    const other = await api("GET", base, state.free.user);
    assert.deepEqual([other.status, other.data.error.code], [403, "FORBIDDEN"]);
    assert.equal((await request("GET", base, null)).status, 401);
    // The image presets dialog never sees video chains.
    const image = await api("GET", `/users/${owner.id}/presets`, owner);
    assert.equal(image.status, 200);
    assert.ok(!JSON.stringify(image.data).includes("Vertical"));
    // D-84: a preset with an image mark of this project, loaded in another project.
    const mark = await request(
      "POST",
      `${videos(owner, p)}/watermarks`,
      owner,
      {
        raw: fs.readFileSync(path.join(FIXTURES, "mark.png")),
        type: "image/png",
      },
    );
    assert.equal(mark.status, 201, JSON.stringify(mark.data));
    const markStep = step("watermark", {
      type: "image",
      watermarkId: mark.data.watermarkId,
      position: { preset: "top-left" },
      scale: 0.1,
      opacity: 1,
    });
    const withMark = await api("POST", base, owner, {
      name: "Logo",
      steps: [markStep],
    });
    assert.equal(withMark.status, 201, JSON.stringify(withMark.data));
    const here = await validate(
      owner,
      p,
      withMark.data.steps,
      state.sources["wide.mp4"],
    );
    assert.equal(here.data.valid, true, JSON.stringify(here.data));
    const p2 = await project(owner);
    const elsewhere = await upload(owner, p2, "wide.mp4");
    const there = await validate(owner, p2, withMark.data.steps, elsewhere);
    assert.equal(there.status, 200, JSON.stringify(there.data));
    assert.equal(there.data.valid, false);
    assert.equal(
      there.data.errors[0].errors[0].code,
      "INVALID_WATERMARK_CONTENT",
    );
    // Delete, then 404.
    assert.equal(
      (await api("DELETE", `${base}/${created.data.id}`, owner)).status,
      204,
    );
    assert.equal(
      (await api("DELETE", `${base}/${created.data.id}`, owner)).status,
      404,
    );
  });

  // ---- revision of B008 (D-86, D-87): the three actions -----------------------

  const chainValidate = (user, p, steps, videoId) =>
    api(
      "POST",
      `${videos(user, p)}/chain/validate`,
      user,
      videoId ? { videoId, steps } : { steps },
    );
  const completedReplies = (taskId) =>
    state.replies.filter((m) => m.taskId === taskId && m.status === "completed")
      .length;

  test('"Aplicar várias operações": 12 steps on one video of a Premium user, one task, inputs of every step', async () => {
    const user = state.owner,
      p = state.project,
      video = state.sources["wide.mp4"];
    const steps = [
      step("trim", { startMs: 0, endMs: 2500 }),
      ADJUST,
      step("filter", { filter: "sepia" }),
      step("orient", { rotation: 90, flipH: false, flipV: false }),
      step("resize", { width: 180, height: 320 }),
      step("watermark", {
        type: "text",
        text: "B008",
        position: { preset: "bottom-right" },
        scale: 0.3,
        opacity: 0.8,
      }),
      step("speed", { factor: 2 }),
      step("adjust", {
        brightness: 1,
        contrastFactor: 1.3,
        saturationFactor: 1,
      }),
      step("orient", { rotation: 0, flipH: true, flipV: false }),
      step("filter", { filter: "bw" }),
      step("remove_audio"),
      step("convert", { target: "mov" }),
    ];
    const check = await chainValidate(user, p, steps, video);
    assert.equal(check.status, 200, JSON.stringify(check.data));
    assert.deepEqual(
      [check.data.valid, check.data.cost, check.data.totalSteps],
      [true, 12, 12],
    );
    assert.equal(check.data.inputs.steps.length, 12);
    assert.equal(check.data.inputs.steps[0].durationMs, 3000);
    assert.equal(check.data.inputs.steps[1].durationMs, 2500);
    assert.equal(
      check.data.inputs.steps[7].durationMs,
      1250,
      "after the speed",
    );
    assert.deepEqual(
      [
        check.data.inputs.steps[5].displayWidth,
        check.data.inputs.steps[5].displayHeight,
      ],
      [180, 320],
    );
    const { task, output, info } = await run(
      user,
      p,
      steps,
      video,
      "multi-12-steps",
    );
    assert.deepEqual(
      [task.kind, task.cost, task.total_steps, task.reserved_credits],
      ["chain", 12, 12, 0],
    );
    assert.deepEqual(
      [output.meta.container, output.meta.video_codec, output.meta.audio_codec],
      ["mov", "h264", null],
    );
    assert.deepEqual([output.meta.width, output.meta.height], [180, 320]);
    assert.ok(
      Math.abs(output.meta.duration_ms - 1250) <= 100,
      String(output.meta.duration_ms),
    );
    assert.equal(completedReplies(String(task._id)), 1);
    assert.equal(
      info.downloadFileName,
      "wide_trim_adjust_filter_orient_resize_watermark_speed_adjust_orient_filter_remove_audio_convert.mov",
    );
  });

  test('"Juntar vídeos": 13 clips with repetitions and no operations on a Premium user, cost 1', async () => {
    const user = state.owner,
      p = state.project,
      s = state.sources;
    const order = ["odd.mp4", "wide.mp4", "tall.mp4", "phone.mp4"];
    const ids = Array.from({ length: 13 }, (_, i) => s[order[i % 4]]);
    const durations = {
      "odd.mp4": 2000,
      "wide.mp4": 3000,
      "tall.mp4": 2000,
      "phone.mp4": 2000,
    };
    const expected = Array.from(
      { length: 13 },
      (_, i) => durations[order[i % 4]],
    ).reduce((a, b) => a + b, 0);
    const steps = [concat(...ids.map((id) => clip(id)))];
    const check = await chainValidate(user, p, steps);
    assert.equal(check.status, 200, JSON.stringify(check.data));
    assert.deepEqual(
      [check.data.valid, check.data.cost, check.data.totalSteps],
      [true, 1, 1],
    );
    assert.equal(check.data.output.durationMs, expected);
    const { task, output } = await run(user, p, steps, null, "concat-13-clips");
    assert.deepEqual([task.kind, task.cost], ["concat", 1]);
    assert.deepEqual(output.source_video_ids.map(String), ids);
    assert.deepEqual(
      task.plan.inputs.map((i) => i.videoId),
      order.map((n) => s[n]),
    );
    assert.ok(
      output.recipe[0].parameters.clips.every((c) => c.steps.length === 0),
    );
    assert.ok(
      Math.abs(output.meta.duration_ms - expected) <= 300,
      `${output.meta.duration_ms} vs ${expected}`,
    );
    assert.deepEqual([output.meta.width, output.meta.height], [320, 240]);
  });

  test("Movie Maker: 3 videos with different chains (one empty) and 3 operations after the concat", async () => {
    const user = state.owner,
      p = state.project,
      s = state.sources;
    const steps = [
      concat(
        clip(s["wide.mp4"], [
          step("trim", { startMs: 0, endMs: 2000 }),
          step("filter", { filter: "sepia" }),
        ]),
        clip(s["tall.mp4"]),
        clip(s["phone.mp4"], [step("speed", { factor: 2 }), ADJUST]),
      ),
      step("orient", { rotation: 90, flipH: false, flipV: false }),
      step("watermark", {
        type: "text",
        text: "Movie Maker",
        position: { preset: "center" },
        scale: 0.4,
        opacity: 0.7,
      }),
      step("adjust", {
        brightness: 1,
        contrastFactor: 1,
        saturationFactor: 1.4,
      }),
    ];
    const check = await chainValidate(user, p, steps);
    assert.equal(check.status, 200, JSON.stringify(check.data));
    assert.deepEqual([check.data.valid, check.data.cost], [true, 8]);
    assert.deepEqual(
      check.data.inputs.clips.map((c) => c.length),
      [2, 0, 2],
    );
    assert.deepEqual(
      check.data.inputs.clipOutputs.map((o) => o.durationMs),
      [2000, 2000, 1000],
    );
    assert.deepEqual(
      [
        check.data.inputs.steps[1].displayWidth,
        check.data.inputs.steps[1].displayHeight,
      ],
      [640, 360],
      "input of the first final step",
    );
    const { task, output, info } = await run(
      user,
      p,
      steps,
      null,
      "movie-maker-3",
    );
    assert.deepEqual(
      [task.kind, task.cost, task.total_steps],
      ["concat", 8, 8],
    );
    assert.deepEqual([output.meta.width, output.meta.height], [360, 640]);
    assert.ok(
      Math.abs(output.meta.duration_ms - 5000) <= 150,
      String(output.meta.duration_ms),
    );
    assert.equal(
      info.downloadFileName,
      "wide_concat_orient_watermark_adjust.mp4",
    );
    assert.equal(completedReplies(String(task._id)), 1);
  });

  test("anonymous user refused on validation, chain validation and acceptance (RN1)", async () => {
    const anonymous = await register("anonymous");
    const created = await api("POST", `/projects/${anonymous.id}`, anonymous, {
      name: "B008 anonymous",
    });
    assert.equal(created.status, 201, JSON.stringify(created.data));
    state.projects.push({ id: created.data._id, user: anonymous });
    const p = created.data._id,
      fake = "64b0000000000000000000fe";
    for (const r of [
      await chainValidate(anonymous, p, [ADJUST], fake),
      await chainValidate(anonymous, p, [concat(clip(fake), clip(fake))]),
      await submit(anonymous, p, [ADJUST], fake),
      await submit(anonymous, p, [concat(clip(fake), clip(fake))], null),
    ]) {
      assert.equal(r.status, 403, JSON.stringify(r.data));
      assert.equal(r.data.error.code, "FORBIDDEN");
    }
    assert.equal(await taskCount(p), 0);
  });

  test("Registered: a failure in the middle leaves no result and gives the credits back (CHAIN-013)", async () => {
    const user = await register("free");
    const p = await project(user);
    const video = await upload(user, p, "wide.mp4", "broken.mp4");
    const doc = await state.db
      .collection("videos")
      .findOne({ _id: oid(video) });
    const [projectId, stage, name] = doc.storage.original_key.split("/");
    const put = await fetch(
      await storageUrl("put", {
        userId: user.id,
        projectId,
        stage,
        name,
        contentType: "video/mp4",
        public: false,
      }),
      {
        method: "PUT",
        headers: { "Content-Type": "video/mp4" },
        body: crypto.randomBytes(8192),
      },
    );
    assert.equal(put.status, 200);
    const before = await remaining(user);
    const r = await submit(
      user,
      p,
      [
        ADJUST,
        step("filter", { filter: "bw" }),
        step("orient", { rotation: 180, flipH: false, flipV: false }),
      ],
      video,
    );
    assert.equal(r.status, 202, JSON.stringify(r.data));
    const done = await finish(user, p, r.data.taskId);
    assert.deepEqual(
      [done.status, done.error.code, done.error.phase],
      ["failed", "PROCESSING_ERROR", "encode"],
    );
    await until(
      async () => (await remaining(user)) === before,
      "3 credits back",
    );
    assert.equal(
      await state.db
        .collection("videos")
        .countDocuments({ _id: oid(r.data.taskId) }),
      0,
      "no result",
    );
    const task = await state.db
      .collection("videotasks")
      .findOne({ _id: oid(r.data.taskId) });
    assert.deepEqual([task.reserved_credits, task.refund.state], [3, "done"]);
    for (const target of Object.values(task.plan.targets))
      assert.equal(
        await objectStatus(
          user.id,
          `${target.projectId}/${target.stage}/${target.name}`,
        ),
        404,
      );
  });

  // D-88 (a): measured, no limit. Opt in with VIDEO_E2E_D88=1 (long); the
  // timings go to VIDEO_E2E_OUTPUTS/d88.json, the memory is sampled on the host.
  test(
    "D-88 measurements: concat of 100 short clips and a long chain on a Premium user",
    { skip: process.env.VIDEO_E2E_D88 ? false : "set VIDEO_E2E_D88=1" },
    async () => {
      const user = state.owner,
        p = state.project;
      const shortId = await upload(user, p, "short.mp4");
      const results = {};
      const timed = async (label, steps, videoId) => {
        const at = Date.now();
        const r = await submit(user, p, steps, videoId);
        assert.equal(r.status, 202, JSON.stringify(r.data));
        const done = await finish(user, p, r.data.taskId);
        const started = state.replies.find(
          (m) => m.taskId === r.data.taskId && m.status === "started",
        );
        const completed = state.replies.find(
          (m) => m.taskId === r.data.taskId && m.status === "completed",
        );
        results[label] = {
          taskId: r.data.taskId,
          status: done.status,
          requestBytes: JSON.stringify({ steps }).length,
          acceptToFinalMs: Date.now() - at,
          workerMs:
            started && completed
              ? Date.parse(completed.timestamp) - Date.parse(started.timestamp)
              : null,
          resultDurationMs:
            (
              await state.db
                .collection("videos")
                .findOne({ _id: oid(r.data.taskId) })
            )?.meta?.duration_ms ?? null,
        };
        assert.equal(done.status, "completed", JSON.stringify(done));
      };
      await timed(
        "concat-100-short-clips",
        [concat(...Array(100).fill(clip(shortId)))],
        null,
      );
      const long = Array.from({ length: 60 }, (_, i) =>
        i % 3 === 0
          ? step("adjust", {
              brightness: i % 2 ? 1.05 : 0.95,
              contrastFactor: 1,
              saturationFactor: 1,
            })
          : i % 3 === 1
            ? step("filter", { filter: i % 2 ? "warm" : "cold" })
            : step("orient", { rotation: 0, flipH: true, flipV: false }),
      );
      await timed("chain-60-steps-on-90s", long, state.sources["long.mp4"]);
      if (OUTPUTS)
        fs.writeFileSync(
          path.join(OUTPUTS, "d88.json"),
          JSON.stringify(results, null, 2),
        );
      console.log(JSON.stringify(results));
    },
  );
});
