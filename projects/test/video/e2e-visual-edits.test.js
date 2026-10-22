// B005 through nginx/API/MongoDB/RabbitMQ/storage/worker. Explicitly opt in:
// VIDEO_E2E_URL=https://nginx VIDEO_E2E_FIXTURES=/tmp/b005-e2e-fixtures \
// NODE_TLS_REJECT_UNAUTHORIZED=0 node --test test/video/e2e-visual-edits.test.js
// Own users/projects/objects/marks and the exclusive AMQP observer are cleaned
// in after(); nothing is removed by global names.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const amqp = require("amqplib");
const sharp = require("sharp");
const { createWatermarkCleanup } = require("../../video/watermarkCleanup");

const BASE = process.env.VIDEO_E2E_URL,
  FIXTURES = process.env.VIDEO_E2E_FIXTURES;
const skip = !BASE || !FIXTURES ? "set VIDEO_E2E_URL and VIDEO_E2E_FIXTURES" : false;
const MONGO = process.env.VIDEO_E2E_MONGO || "mongodb://projects_mongoDB:27018/project";
const USERS = process.env.VIDEO_E2E_USERS_MONGO || "mongodb://users_mongoDB:27019/user";
const STORAGE = process.env.VIDEO_E2E_STORAGE || "http://img_storage:11000/video";
const BROKER = process.env.VIDEO_E2E_AMQP || "amqp://user:password@rabbitmq";
const state = { users: [], projects: [], sources: {}, replies: [], progress: [], timings: {}, equivalence: [] };
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
async function request(method, route, user, { json, raw, type, headers = {} } = {}) {
  if (user?.shareId && route.startsWith("/projects/"))
    route += `${route.includes("?") ? "&" : "?"}share=${encodeURIComponent(user.shareId)}`;
  const at = performance.now();
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
  const elapsed = performance.now() - at;
  let data = buffer;
  if ((response.headers.get("content-type") || "").includes("json")) data = JSON.parse(buffer.toString() || "null");
  else if (!(response.headers.get("content-type") || "").startsWith("image/")) data = buffer.toString();
  return { status: response.status, data, headers: response.headers, elapsed };
}
const api = (method, route, user, json, headers) => request(method, route, user, { json, headers });
async function until(fn, label, timeout = 180000) {
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
    name: "B005 persistent test",
    email: `b005-${type}-${Date.now()}-${Math.random().toString(16).slice(2)}@test.local`,
    password: "b005-test-password",
    type,
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const user = { id: r.data.user._id, token: r.data.jwt };
  state.users.push(user);
  return user;
}
const videos = (user, project) => `/projects/${user.ownerId ?? user.id}/${project}/videos`;
async function editor() {
  const user = await register("free"),
    owner = state.owner,
    p = state.project;
  const info = await api("GET", `/projects/${owner.id}/${p}`, owner);
  const share = await api("POST", `/projects/${owner.id}/${p}/share`, owner, { permission: "edit" }, { "X-Project-Version": String(info.data.version) });
  assert.equal(share.status, 201, JSON.stringify(share.data));
  return { ...user, ownerId: owner.id, shareId: share.data.id };
}
async function project(user) {
  const r = await api("POST", `/projects/${user.id}`, user, { name: "B005 persistent test" });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  state.projects.push({ id: r.data._id, user });
  return r.data._id;
}
async function upload(user, p, name) {
  const type = { ".mp4": "video/mp4", ".mov": "video/quicktime", ".avi": "video/x-msvideo" }[path.extname(name)];
  const data = fs.readFileSync(path.join(FIXTURES, name));
  const r = await api("POST", `${videos(user, p)}/uploads`, user, { fileName: name, mimeType: type, sizeBytes: data.length });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const put = await fetch(publicUrl(r.data.upload.url), { method: "PUT", headers: { "Content-Type": type }, body: data });
  assert.equal(put.status, 200, await put.text());
  assert.equal((await api("POST", `${videos(user, p)}/${r.data.videoId}/upload/complete`, user)).status, 202);
  await until(async () => {
    const d = await state.db.collection("videos").findOne({ _id: oid(r.data.videoId) });
    if (d?.status === "failed") throw new Error(JSON.stringify(d.error));
    return d?.status === "completed" && d;
  }, `ingest ${name}`);
  return r.data.videoId;
}
const step = (operation, parameters = {}) => ({ operation, version: 1, parameters });
const submit = (user, p, video, s) => api("POST", `${videos(user, p)}/${video}/operations`, user, { steps: [s] });
const validate = (user, p, video, s) => api("POST", `${videos(user, p)}/validate`, user, { videoId: video, steps: [s] });
const previewOf = (user, p, video, steps) => api("POST", `${videos(user, p)}/${video}/preview`, user, { steps });
async function finish(user, p, id) {
  return until(async () => {
    const r = await api("GET", `${videos(user, p)}/tasks/${id}`, user);
    assert.equal(r.status, 200);
    return ["completed", "failed", "cancelled"].includes(r.data.status) && r.data;
  }, `task ${id}`);
}
async function remaining(user) {
  return (await api("GET", `/users/${user.id}`, user)).data.remaining_operations;
}
async function readObject(userId, key) {
  const [projectId, stage, name] = key.split("/");
  const r = await fetch(`${STORAGE}/url/get`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, projectId, stage, name, public: false }),
  });
  assert.equal(r.status, 200);
  const file = await fetch((await r.json()).url);
  assert.equal(file.status, 200);
  return Buffer.from(await file.arrayBuffer());
}
const objectStatus = async (userId, key) => (await fetch(`${STORAGE}/object/${userId}/${key}`, { method: "HEAD" })).status;
async function runOperation(s, name = "quad.mp4", user = state.owner) {
  const input = state.sources[name];
  const r = await submit(user, state.project, input, s);
  assert.equal(r.status, 202, JSON.stringify(r.data));
  (state.timings.accept ||= []).push(r.elapsed);
  const done = await finish(user, state.project, r.data.taskId);
  assert.equal(done.status, "completed", JSON.stringify(done));
  const task = await state.db.collection("videotasks").findOne({ _id: oid(done.taskId) });
  const output = await until(() => state.db.collection("videos").findOne({ _id: oid(done.resultVideoId) }), "result video");
  return { input, done, task, output };
}
// Mean absolute difference per channel (0–255) between two images, after
// resizing the second to the size of the first.
async function difference(a, b) {
  const one = await sharp(a).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const two = await sharp(b).removeAlpha().resize(one.info.width, one.info.height, { fit: "fill" }).raw().toBuffer();
  let sum = 0;
  for (let i = 0; i < one.data.length; i += 1) sum += Math.abs(one.data[i] - two[i]);
  return { mean: sum / one.data.length, width: one.info.width, height: one.info.height };
}
async function deleteOwnBucket(user) {
  assert.ok(state.users.some((own) => own.id === user.id));
  const bucket = `user-${user.id}`;
  const endpoint = process.env.VIDEO_E2E_S3 || "http://seaweedfs:9000";
  async function s3(method, key = "") {
    const resource = `/${bucket}${key ? "/" + key : ""}`,
      date = new Date().toUTCString();
    const signature = crypto.createHmac("sha1", process.env.VIDEO_E2E_S3_SECRET || "admin123").update(`${method}\n\n\n${date}\n${resource}`).digest("base64");
    return fetch(endpoint + resource, { method, headers: { Date: date, Authorization: `AWS ${process.env.VIDEO_E2E_S3_ACCESS || "admin"}:${signature}` } });
  }
  const listing = await s3("GET");
  if (listing.status === 404) return;
  assert.equal(listing.status, 200);
  const xml = await listing.text();
  assert.ok(!xml.includes("<IsTruncated>true</IsTruncated>"));
  for (const key of [...xml.matchAll(/<Key>(.*?)<\/Key>/g)].map((m) => m[1])) {
    assert.ok(["src/", "preview/", "out/"].includes(key) || state.projects.some((p) => p.user.id === user.id && key.startsWith(p.id + "/")), `unexpected key in own bucket: ${key}`);
    const response = await s3("DELETE", key);
    assert.ok([200, 204, 404].includes(response.status), `own bucket cleanup: ${response.status}`);
  }
  const removed = await s3("DELETE");
  assert.ok([200, 204, 404].includes(removed.status));
}
async function imageVersion(user, p) {
  return String((await api("GET", `/projects/${user.id}/${p}`, user)).data.version);
}
const p95 = (values) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * 0.95) - 1];
const mark = (parameters) => ({ position: { preset: "bottom-right" }, scale: 0.2, opacity: 0.6, ...parameters });

test.describe("B005 real stack", { skip, timeout: 900000 }, () => {
  test.before(async () => {
    state.db = mongoose.createConnection(MONGO);
    await state.db.asPromise();
    state.usersDb = mongoose.createConnection(USERS);
    await state.usersDb.asPromise();
    state.connection = await amqp.connect(BROKER);
    state.channel = await state.connection.createChannel();
    const q = await state.channel.assertQueue("", { exclusive: true, autoDelete: true });
    await state.channel.bindQueue(q.queue, "picturas", "video_project_queue");
    await state.channel.bindQueue(q.queue, "picturas", "video_ws_queue");
    await state.channel.consume(
      q.queue,
      (m) => m && (m.fields.routingKey === "video_ws_queue" ? state.progress : state.replies).push(JSON.parse(m.content)),
      { noAck: true },
    );
    state.owner = await register("premium");
    state.project = await project(state.owner);
    for (const name of ["quad.mp4", "quad.avi", "odd.mp4", "portrait.mp4", "long.mp4"])
      state.sources[name] = await upload(state.owner, state.project, name);
    state.editor = await editor();
  });

  test.after(async () => {
    try {
      for (const { id, user } of state.projects) {
        const query = { project_id: oid(id) };
        const keys = new Set();
        for (const v of await state.db.collection("videos").find(query).toArray())
          for (const key of Object.values(v.storage || {})) if (typeof key === "string") keys.add(key);
        for (const t of await state.db.collection("videotasks").find(query).toArray()) {
          if (["queued", "processing"].includes(t.status)) await api("DELETE", `${videos(user, id)}/tasks/${t._id}`, user);
          for (const target of Object.values(t.plan?.targets || {})) keys.add(`${target.projectId}/${target.stage}/${target.name}`);
        }
        for (const w of await state.db.collection("video_watermarks").find(query).toArray()) keys.add(`${id}/video_src/wm-${w._id}.png`);
        await sleep(500);
        for (const key of keys) {
          assert.ok(key.startsWith(`${id}/`));
          await fetch(`${STORAGE}/object/${user.id}/${key}`, { method: "DELETE" });
        }
        for (const name of ["videos", "videotasks", "video_project_locks", "video_watermarks", "results", "processes"])
          await state.db.collection(name).deleteMany(query);
        await state.db.collection("projects").deleteOne({ _id: oid(id) });
      }
      for (const user of state.users) {
        await deleteOwnBucket(user);
        assert.match(user.id, /^[0-9a-f]{24}$/);
        fs.rmSync(path.join(process.env.VIDEO_E2E_LOCAL_IMAGES || "/app/images/users", user.id), { recursive: true, force: true });
        await state.usersDb.collection("users").deleteOne({ _id: oid(user.id) });
      }
    } finally {
      try {
        await state.channel?.close();
      } finally {
        await state.connection?.close();
        await Promise.allSettled([state.db?.close(), state.usersDb?.close()]);
      }
    }
    console.log("B005 timings (ms):", JSON.stringify(state.timings));
    console.log("B005 sharp/FFmpeg mean difference:", JSON.stringify(state.equivalence));
  });

  // ---- the five operations through the pipeline -----------------------------

  for (const [name, s, size, audio] of [
    ["quad.mp4", step("adjust", { brightness: 1.3, contrastFactor: 0.8, saturationFactor: 0 }), [320, 240], "aac"],
    ["odd.mp4", step("filter", { filter: "sepia" }), [320, 240], "aac"],
    ["portrait.mp4", step("resize", { width: 180, height: 240 }), [180, 240], "aac"],
    ["portrait.mp4", step("orient", { rotation: 90, flipH: true, flipV: false }), [320, 240], "aac"],
    ["quad.avi", step("watermark", mark({ type: "text", text: "© PictuRAS 2026" })), [320, 240], "aac"],
  ])
    test(`${name} ${s.operation}: pipeline, provenance, recipe, metadata and audio`, async () => {
      const { input, done, task, output } = await runOperation(s, name);
      const source = await state.db.collection("videos").findOne({ _id: oid(input) });
      assert.deepEqual(output.source_video_ids.map(String), [input]);
      const strip = (list) => list.map(({ operation, version, parameters }) => {
        const { _mark, ...rest } = parameters || {};
        return { operation, version, parameters: rest };
      });
      assert.deepEqual(strip(output.recipe), [s]);
      assert.deepEqual(strip(task.steps), [s]);
      const info = await api("GET", `${videos(state.owner, state.project)}/${done.resultVideoId}`, state.owner);
      assert.deepEqual(strip(info.data.recipe), [s]);
      assert.deepEqual([output.meta.container, output.meta.video_codec, output.meta.audio_codec], ["mp4", "h264", audio]);
      assert.deepEqual([output.meta.display_width, output.meta.display_height, output.meta.rotation || 0], [...size, 0]);
      assert.equal(output.meta.fps_num / output.meta.fps_den, source.meta.fps_num / source.meta.fps_den);
      assert.ok(Math.abs(output.meta.duration_ms - source.meta.duration_ms) <= 50, `${output.meta.duration_ms} vs ${source.meta.duration_ms}`);
      for (const key of Object.values(output.storage)) assert.equal(await objectStatus(state.owner.id, key), 200);
      if (s.operation === "watermark") {
        assert.match(String(output.recipe[0].parameters._mark.watermarkId), /^[0-9a-f]{24}$/);
        assert.equal(task.plan.steps[0].mark.source.stage, "video_src");
        assert.equal(task.plan.output.audio.mode, "encode", "MP3 in AVI becomes AAC (WATERMARK-011)");
      } else if (name === "quad.mp4") assert.equal(task.plan.output.audio.mode, "copy", "AAC is copied");
      if (s.operation === "filter") assert.equal(task.plan.steps[0].filter.id, "sepia");
      const gallery = await api("GET", videos(state.owner, state.project), state.owner);
      assert.ok(gallery.data.videos.some((v) => v.id === done.resultVideoId));
      const original = await state.db.collection("videos").findOne({ _id: oid(input) });
      assert.deepEqual(original.storage, source.storage, "the original is unchanged");
    });

  // ---- sharp ↔ FFmpeg equivalence (NFR-015 pass criterion, ADD T-07) -----------

  const EQUIVALENCE = [
    ...[
      [90, false, false],
      [180, false, false],
      [270, false, false],
      [0, true, false],
      [0, false, true],
      [90, true, false],
      [270, true, false],
    ].map(([rotation, flipH, flipV]) => step("orient", { rotation, flipH, flipV })),
    ...["bw", "sepia", "negative", "vintage", "cold", "warm"].map((filter) => step("filter", { filter })),
  ];
  async function equivalent(s) {
    const shown = await previewOf(state.owner, state.project, state.sources["quad.mp4"], [s]);
    assert.equal(shown.status, 200, String(shown.data));
    const { output } = await runOperation(s);
    const frame = await readObject(state.owner.id, output.storage.first_frame_key);
    const d = await difference(shown.data, frame);
    const meta = await sharp(shown.data).metadata();
    assert.deepEqual([meta.width, meta.height], [d.width, d.height]);
    assert.deepEqual([meta.width, meta.height], [output.meta.display_width, output.meta.display_height]);
    state.equivalence.push([s.operation, s.parameters, Number(d.mean.toFixed(2))]);
    assert.ok(d.mean <= 12, `${JSON.stringify(s)} mean difference ${d.mean}`);
  }
  test("preview (sharp on frame 0) matches the first frame of the FFmpeg result: 7 orientations + identity, 6 filters", async () => {
    for (const s of EQUIVALENCE) await equivalent(s);
    const identity = await previewOf(state.owner, state.project, state.sources["quad.mp4"], [step("orient", { rotation: 180, flipH: true, flipV: true })]);
    const plain = await previewOf(state.owner, state.project, state.sources["quad.mp4"], [step("adjust", { brightness: 1, contrastFactor: 1, saturationFactor: 1 })]);
    assert.equal(plain.status, 200, "NO_CHANGES still previews the unchanged frame");
    assert.ok((await difference(identity.data, plain.data)).mean <= 2, "identity preview equals the first frame");
  });

  // D-67 (pending): the ADD 4.3 formulas eq=contrast / eq=saturation (YUV) do
  // not match sharp linear / modulate (RGB, LCh); kept visible as a todo.
  for (const s of [
    step("adjust", { brightness: 1.2, contrastFactor: 1, saturationFactor: 1 }),
    step("adjust", { brightness: 1, contrastFactor: 1.3, saturationFactor: 1 }),
    step("adjust", { brightness: 1, contrastFactor: 0.6, saturationFactor: 1 }),
    step("adjust", { brightness: 1, contrastFactor: 1, saturationFactor: 0.5 }),
    step("adjust", { brightness: 1.2, contrastFactor: 1.3, saturationFactor: 0.5 }),
  ])
    test(`adjust preview matches the FFmpeg result ${JSON.stringify(s.parameters)}`, { todo: "D-67 pendente" }, () => equivalent(s));

  test("NFR-015: preview ≤ 1 s for 95% of requests; thumbnails and validation ≤ 1 s", async () => {
    const times = [];
    for (let i = 0; i < 40; i += 1) {
      const s = [
        step("adjust", { brightness: 0.5 + (i % 30) * 0.05, contrastFactor: 1, saturationFactor: 1 }),
        step("filter", { filter: ["bw", "sepia", "negative", "vintage", "cold", "warm"][i % 6] }),
        step("resize", { width: 160 + 2 * i, height: 130 }),
        step("orient", { rotation: [90, 180, 270][i % 3], flipH: i % 2 === 0 }),
      ][i % 4];
      const r = await previewOf(state.editor, state.project, state.sources["long.mp4"], [s]);
      assert.equal(r.status, 200, String(r.data));
      assert.equal(r.headers.get("content-type"), "image/jpeg");
      times.push(r.elapsed);
    }
    state.timings.previewP95 = Number(p95(times).toFixed(1));
    state.timings.previewMax = Number(Math.max(...times).toFixed(1));
    assert.ok(p95(times) <= 1000, `p95 ${p95(times)}`);
    const thumbs = await api("GET", `${videos(state.editor, state.project)}/${state.sources["long.mp4"]}/filters/thumbnails`, state.editor);
    assert.equal(thumbs.status, 200);
    assert.deepEqual(thumbs.data.thumbnails.map((t) => t.filter), ["bw", "sepia", "negative", "vintage", "cold", "warm"]);
    state.timings.thumbnails = Number(thumbs.elapsed.toFixed(1));
    assert.ok(thumbs.elapsed <= 1000);
    const checked = await validate(state.editor, state.project, state.sources["long.mp4"], step("adjust", { brightness: 1.5, contrastFactor: 1, saturationFactor: 1 }));
    assert.equal(checked.data.valid, true);
    state.timings.validate = Number(checked.elapsed.toFixed(1));
    assert.ok(checked.elapsed <= 1000);
    const resized = await previewOf(state.owner, state.project, state.sources["portrait.mp4"], [step("resize", { width: 180, height: 240 })]);
    assert.deepEqual([resized.headers.get("x-output-width"), resized.headers.get("x-output-height")], ["180", "240"]);
  });

  // ---- validation before the task (ST-VID-004 AC2, ADJUST-006, ...) ----------

  test("rejections before task and quota; client _mark never prevails (ADR-010)", async () => {
    const user = state.editor,
      p = state.project,
      video = state.sources["quad.mp4"];
    const before = await remaining(user);
    const cases = [
      [step("adjust", { brightness: 2.5, contrastFactor: 1, saturationFactor: 1 }), "INVALID_ADJUST_PARAMS", "brightness"],
      [step("adjust", { brightness: 1, contrastFactor: 1, saturationFactor: 1 }), "NO_CHANGES"],
      [step("filter", { filter: "cartoon" }), "INVALID_FILTER", "filter"],
      [step("resize", { width: 2560, height: 1440 }), "INVALID_RESIZE_PARAMS", "width"],
      [step("resize", { width: 320, height: 240 }), "NO_CHANGES"],
      [step("orient", { rotation: 45 }), "INVALID_ORIENT_PARAMS", "rotation"],
      [step("orient", { rotation: 180, flipH: true, flipV: true }), "NO_CHANGES"],
      [step("watermark", mark({ type: "text", text: "   " })), "INVALID_WATERMARK_CONTENT", "text"],
      [step("watermark", mark({ type: "text", text: "ok", position: { x: 1300, y: 0 } })), "WATERMARK_OUT_OF_BOUNDS", "position.x"],
      [step("watermark", mark({ type: "image", watermarkId: "64b0000000000000000000d9", _mark: { watermarkId: "64b0000000000000000000d9", width: 10, height: 10 } })), "INVALID_WATERMARK_CONTENT", "watermarkId"],
      [step("watermark", mark({ type: "text", text: "ok", scale: 0.6 })), "INVALID_WATERMARK_PARAMS", "scale"],
    ];
    for (const [s, code, field] of cases) {
      const checked = await validate(user, p, video, s);
      assert.equal(checked.status, 200, JSON.stringify(checked.data));
      assert.equal(checked.data.valid, false);
      assert.equal(checked.data.errors[0].errors[0].code, code, JSON.stringify(s));
      if (field) assert.equal(checked.data.errors[0].errors[0].field, field);
      const rejected = await submit(user, p, video, s);
      assert.equal(rejected.status, 422, JSON.stringify(rejected.data));
      assert.equal(rejected.data.error.details.errors[0].code, code);
    }
    const limit = (await validate(user, p, video, cases[3][0])).data.errors[0].errors[0].limit;
    assert.deepEqual(limit, { width: 1920, height: 1080 }, "RESIZE-006 ceiling of a registered user");
    assert.equal((await validate(state.owner, p, video, step("resize", { width: 2560, height: 1440 }))).data.valid, true, "premium ceiling");
    const forged = await previewOf(user, p, video, [step("filter", { filter: "cartoon" })]);
    assert.equal(forged.status, 422);
    assert.equal(await remaining(user), before, "quota intact");
    assert.equal(await state.db.collection("videotasks").countDocuments({ runner_id: oid(user.id) }), 0, "no task");
  });

  // ---- watermark images (D-60, D-62) -----------------------------------------

  test("watermark images: local PNG/JPEG, gallery image, rejections, preview and a real overlay", async () => {
    const user = state.editor,
      p = state.project,
      base = videos(user, p);
    const png = await request("POST", `${base}/watermarks`, user, { raw: fs.readFileSync(path.join(FIXTURES, "logo.png")), type: "image/png" });
    assert.equal(png.status, 201, JSON.stringify(png.data));
    assert.deepEqual([png.data.width, png.data.height], [40, 20]);
    const jpeg = await request("POST", `${base}/watermarks`, user, { raw: fs.readFileSync(path.join(FIXTURES, "photo.jpg")), type: "image/jpeg" });
    assert.equal(jpeg.status, 201);
    const stored = await state.db.collection("video_watermarks").findOne({ _id: oid(jpeg.data.watermarkId) });
    assert.deepEqual([stored.kind, String(stored.project_id), stored.width, stored.height], ["image", p, 120, 60]);
    const normalized = await sharp(await readObject(state.owner.id, `${p}/video_src/wm-${jpeg.data.watermarkId}.png`)).metadata();
    assert.deepEqual([normalized.format, normalized.channels], ["png", 4]);
    const count = await state.db.collection("video_watermarks").countDocuments({ project_id: oid(p) });
    const gif = await request("POST", `${base}/watermarks`, user, { raw: fs.readFileSync(path.join(FIXTURES, "anim.gif")), type: "image/png" });
    assert.equal(gif.status, 422);
    assert.equal(gif.data.error.code, "INVALID_WATERMARK_CONTENT");
    const big = await request("POST", `${base}/watermarks`, user, { raw: fs.readFileSync(path.join(FIXTURES, "big.png")), type: "image/png" });
    assert.ok([413, 422].includes(big.status), `big image: ${big.status}`);
    state.timings.bigUploadStatus = big.status;
    const empty = await api("POST", `${base}/watermarks`, user, {});
    assert.equal(empty.status, 422);
    assert.equal(await state.db.collection("video_watermarks").countDocuments({ project_id: oid(p) }), count, "rejections store nothing");

    const owner = state.owner,
      route = `/projects/${owner.id}/${p}`;
    const form = new FormData();
    form.append("image", new Blob([fs.readFileSync(path.join(FIXTURES, "image.png"))], { type: "image/png" }), "b005-gallery.png");
    const added = await fetch(`${BASE}/api-gateway${route}/img`, { method: "POST", headers: { Authorization: `Bearer ${owner.token}`, "X-Project-Version": await imageVersion(owner, p) }, body: form });
    assert.equal(added.status, 204, await added.text());
    const imageId = String((await state.db.collection("projects").findOne({ _id: oid(p) })).imgs.at(-1)._id);
    const gallery = await api("POST", `${base}/watermarks`, user, { imageId });
    assert.equal(gallery.status, 201, JSON.stringify(gallery.data));
    assert.deepEqual([gallery.data.width, gallery.data.height], [64, 48]);
    assert.equal((await api("POST", `${base}/watermarks`, user, { imageId: "64b0000000000000000000d9" })).status, 422);

    const s = step("watermark", mark({ type: "image", watermarkId: png.data.watermarkId, position: { x: 200, y: 150 }, scale: 0.25, opacity: 1 }));
    const shown = await request("POST", `${base}/${state.sources["quad.mp4"]}/watermark-preview`, user, { json: { steps: [s] } });
    assert.equal(shown.status, 200);
    assert.equal(shown.headers.get("content-type"), "image/jpeg");
    (state.timings.watermarkPreview ||= []).push(Number(shown.elapsed.toFixed(1)));
    const textPreview = await request("POST", `${base}/${state.sources["quad.mp4"]}/watermark-preview`, user, { json: { steps: [step("watermark", mark({ type: "text", text: "Pré-visualização" }))] } });
    assert.equal(textPreview.status, 200);
    const outOfBounds = await request("POST", `${base}/${state.sources["quad.mp4"]}/watermark-preview`, user, { json: { steps: [step("watermark", mark({ type: "image", watermarkId: png.data.watermarkId, position: { x: 300, y: 0 } }))] } });
    assert.equal(outOfBounds.status, 422);

    const before = await remaining(user);
    const { output, task } = await runOperation(s, "quad.mp4", user);
    assert.equal(await remaining(user), before - 1, "one credit");
    assert.deepEqual([task.plan.steps[0].mark.x, task.plan.steps[0].mark.y, task.plan.steps[0].mark.width, task.plan.steps[0].mark.height], [200, 150, 80, 40]);
    const frame = await readObject(state.owner.id, output.storage.first_frame_key);
    const raw = await sharp(frame).raw().toBuffer({ resolveWithObject: true });
    const px = (x, y) => [...raw.data.subarray((y * raw.info.width + x) * 3, (y * raw.info.width + x) * 3 + 3)];
    assert.ok(px(240, 170)[0] > 200 && px(240, 170)[1] < 60 && px(240, 170)[2] > 200, `mark pixel ${px(240, 170)}`);
    const d = await difference(shown.data, frame);
    state.equivalence.push(["watermark-preview", "image", Number(d.mean.toFixed(2))]);
    assert.ok(d.mean <= 12, `watermark preview vs result ${d.mean}`);

    const cleanup = createWatermarkCleanup({
      VideoWatermark: state.db.model("videoWatermarkE2E", new mongoose.Schema({}, { strict: false, collection: "video_watermarks" })),
      VideoTask: state.db.model("videoTaskE2E", new mongoose.Schema({}, { strict: false, collection: "videotasks" })),
      Video: state.db.model("videoE2E", new mongoose.Schema({}, { strict: false, collection: "videos" })),
      Project: state.db.model("projectE2E", new mongoose.Schema({}, { strict: false, collection: "projects" })),
      storage: {},
      log: { info() {}, error() {} },
    });
    assert.equal(await cleanup.referenced({ _id: oid(png.data.watermarkId) }), true, "used by a task and a recipe");
    assert.equal(await cleanup.referenced({ _id: oid(gallery.data.watermarkId) }), false, "unused mark");
  });

  // ---- cancellation and the one-task rule (D-66) -----------------------------

  test("cancel during encoding refunds; a B005 request during a B004 task is refused by the server (D-66)", async () => {
    const user = state.editor,
      p = state.project,
      long = state.sources["long.mp4"];
    const before = await remaining(user);
    const b004 = await submit(user, p, long, step("speed", { factor: 0.25 }));
    assert.equal(b004.status, 202, JSON.stringify(b004.data));
    const blocked = await submit(user, p, state.sources["quad.mp4"], step("filter", { filter: "bw" }));
    assert.equal(blocked.status, 409, JSON.stringify(blocked.data));
    assert.equal(blocked.data.error.code, "TASK_ALREADY_ACTIVE");
    assert.equal(blocked.data.error.details.taskId, b004.data.taskId);
    assert.ok(blocked.data.error.message.length > 0 && blocked.data.correlationId, "message and support code for the interface");
    state.timings.d66 = blocked.data;
    await api("DELETE", `${videos(user, p)}/tasks/${b004.data.taskId}`, user);
    assert.equal((await finish(user, p, b004.data.taskId)).status, "cancelled");

    const r = await submit(user, p, long, step("resize", { width: 1920, height: 1080 }));
    assert.equal(r.status, 202, JSON.stringify(r.data));
    // Progress events of the WebSocket queue (about twice per second, B003).
    await until(() => state.progress.find((e) => e.taskId === r.data.taskId && e.progress > 0), "positive progress", 60000);
    const cancelled = await api("DELETE", `${videos(user, p)}/tasks/${r.data.taskId}`, user);
    assert.equal(cancelled.status, 200, JSON.stringify([cancelled.data, (await api("GET", `${videos(user, p)}/tasks/${r.data.taskId}`, user)).data]));
    const done = await finish(user, p, r.data.taskId);
    assert.equal(done.status, "cancelled");
    assert.equal(done.resultVideoId, undefined);
    await until(async () => (await remaining(user)) === before, "credits returned");
    await until(() => state.replies.find((m) => m.taskId === r.data.taskId && m.status === "cancelled"), "worker cancelled");
    assert.equal(await state.db.collection("videos").countDocuments({ _id: oid(r.data.taskId) }), 0, "no partial result");
  });

  // ---- regression of the image flow (rule 2.6) --------------------------------

  test("image flow regression: upload, brightness worker and committed downloadable result", async () => {
    const user = await register("premium"),
      p = await project(user),
      route = `/projects/${user.id}/${p}`;
    const body = new FormData(),
      original = fs.readFileSync(path.join(FIXTURES, "image.png"));
    body.append("image", new Blob([original], { type: "image/png" }), "b005-image.png");
    const uploaded = await fetch(`${BASE}/api-gateway${route}/img`, { method: "POST", headers: { Authorization: `Bearer ${user.token}`, "X-Project-Version": await imageVersion(user, p) }, body });
    assert.equal(uploaded.status, 204, await uploaded.text());
    const tool = await api("POST", `${route}/tool`, user, { procedure: "brightness", params: { brightness: 0.5 } }, { "X-Project-Version": await imageVersion(user, p) });
    assert.equal(tool.status, 201, JSON.stringify(tool.data));
    const started = await api("POST", `${route}/process`, user, {}, { "X-Project-Version": await imageVersion(user, p) });
    assert.equal(started.status, 201, JSON.stringify(started.data));
    await until(async () => {
      const doc = await state.db.collection("projects").findOne({ _id: oid(p) });
      return doc.committedToken > 0 && doc.committedToken === doc.activeToken;
    }, "image commit");
    const result = await api("GET", `${route}/process/url`, user);
    assert.equal(result.status, 200);
    const data = Buffer.from(await (await fetch(publicUrl(result.data.imgs[0].url))).arrayBuffer());
    assert.deepEqual([data.readUInt32BE(16), data.readUInt32BE(20)], [64, 48]);
    // The fixture's blue depends on the platform's YUV->RGB conversion (253
    // on aarch64, 255 elsewhere): the expected value comes from the input,
    // with the truncation of PIL's ImageEnhance.Brightness (255 -> 127).
    const input = await sharp(original).removeAlpha().raw().toBuffer();
    const pixel = await sharp(data).removeAlpha().raw().toBuffer();
    assert.deepEqual([...pixel.subarray(0, 3)], [0, 0, Math.floor(input[2] * 0.5)]);
    state.timings.imageBlue = [input[2], pixel[2]];
  });
});
