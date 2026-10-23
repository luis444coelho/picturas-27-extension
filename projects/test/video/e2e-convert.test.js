// B005 through nginx/API/MongoDB/RabbitMQ/storage/worker. Explicitly opt in:
// VIDEO_E2E_URL=https://nginx VIDEO_E2E_FIXTURES=/tmp/b007-e2e-fixtures \
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
    name: "B007 persistent test",
    email: `b007-${type}-${Date.now()}-${Math.random().toString(16).slice(2)}@test.local`,
    password: "b007-test-password",
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
  const r = await api("POST", `/projects/${user.id}`, user, { name: "B007 persistent test" });
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

test.describe("B007 real stack", { skip, timeout: 900000 }, () => {
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
    await state.channel.consume(q.queue, (m) => m &&
      (m.fields.routingKey === "video_ws_queue" ? state.progress : state.replies).push(JSON.parse(m.content)),
    { noAck: true });
    state.owner = await register("premium");
    state.project = await project(state.owner);
    for (const name of ["base.mp4", "base.mov", "h264.avi", "odd.mp4", "silent.mp4", "incompatible.avi", "long.mp4"])
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
        await sleep(500);
        for (const key of keys) {
          assert.ok(key.startsWith(`${id}/`));
          await fetch(`${STORAGE}/object/${user.id}/${key}`, { method: "DELETE" });
        }
        for (const name of ["videos", "videotasks", "video_project_locks", "results", "processes"])
          await state.db.collection(name).deleteMany(query);
        await state.db.collection("projects").deleteOne({ _id: oid(id) });
      }
      for (const user of state.users) {
        await deleteOwnBucket(user);
        await state.usersDb.collection("users").deleteOne({ _id: oid(user.id) });
      }
    } finally {
      try { await state.channel?.close(); }
      finally { await state.connection?.close(); await Promise.allSettled([state.db?.close(), state.usersDb?.close()]); }
    }
  });

  test("six matrix paths, preview keys, dual-output reply and stored playable files", async () => {
    const user = state.owner, p = state.project;
    const cases = [
      ["base.mp4", "mov", "h264", "aac", "copy", "copy"],
      ["base.mp4", "avi", "mpeg4", "mp3", "encode", "encode"],
      ["base.mov", "mp4", "h264", "aac", "copy", "copy"],
      ["base.mov", "avi", "mpeg4", "mp3", "encode", "encode"],
      ["h264.avi", "mp4", "h264", "aac", "copy", "encode"],
      ["h264.avi", "mov", "h264", "aac", "copy", "encode"],
      ["silent.mp4", "avi", "mpeg4", null, "encode", "none"],
      ["odd.mp4", "avi", "mpeg4", null, "encode", "none"],
      ["odd.mp4", "mov", "h264", null, "copy", "none"],
      ["incompatible.avi", "mp4", "h264", "aac", "copy", "encode"],
    ];
    for (const [name, target, video, audio, videoMode, audioMode] of cases) {
      const s = step("convert", { target });
      const check = await validate(user, p, state.sources[name], s);
      assert.equal(check.status, 200, JSON.stringify([name, target, check.data]));
      assert.deepEqual([check.data.output.videoMode, check.data.output.audioMode], [videoMode, audioMode]);
      const { done, task, output } = await runOperation(s, name);
      if (name === "base.mp4" && ["avi", "mov"].includes(target)) {
        assert.equal(output.original_name, `base.${target}`);
        const info = await api("GET", `${videos(user, p)}/${output._id}`, user);
        assert.equal(info.status, 200, JSON.stringify(info.data));
        assert.equal(info.data.originalName, `base.${target}`);
        assert.equal(info.data.downloadFileName, `base_convert.${target}`);
        const gallery = await api("GET", videos(user, p), user);
        assert.equal(gallery.status, 200, JSON.stringify(gallery.data));
        assert.equal(gallery.data.videos.find((v) => v.id === String(output._id))?.originalName, `base.${target}`);
      }
      assert.deepEqual([output.meta.container, output.meta.video_codec, output.meta.audio_codec], [target, video, audio]);
      assert.deepEqual(output.recipe.map(({ operation, version, parameters }) => ({ operation, version, parameters })), [s]);
      assert.equal(task.plan.convert.previewInSameInvocation, target === "avi");
      if (name === "h264.avi") assert.equal(task.plan.output.genpts, true);
      if (target === "avi") {
        assert.equal(task.plan.output.video.quality, 3);
        if (audio) assert.equal(task.plan.output.audio.bitrate, "192k");
      }
      const expectedPreview = target !== "mp4" || name === "incompatible.avi";
      assert.equal(Boolean(output.storage.preview_key), expectedPreview, `${name}→${target} preview`);
      const reply = await until(() => state.replies.find((m) => m.taskId === done.taskId && m.status === "completed"), "worker reply");
      assert.equal(reply.output.previewMade, expectedPreview);
      assert.equal(Boolean(reply.output.keys.preview), expectedPreview);
      assert.equal(reply.output.keys.preview, output.storage.preview_key);
      for (const key of Object.values(output.storage)) assert.equal(await objectStatus(user.id, key), 200);
      if (name === "odd.mp4") {
        const dims = target === "avi" ? [128, 96] : [129, 97];
        assert.deepEqual([output.meta.width, output.meta.height], dims);
      }
      if (process.env.VIDEO_E2E_OUTPUTS) {
        const stem = `${path.parse(name).name}-${path.extname(name).slice(1)}-to-${target}`;
        fs.writeFileSync(path.join(process.env.VIDEO_E2E_OUTPUTS, `${stem}.${target}`), await readObject(user.id, output.storage.original_key));
        if (expectedPreview) fs.writeFileSync(path.join(process.env.VIDEO_E2E_OUTPUTS, `${stem}-preview.mp4`), await readObject(user.id, output.storage.preview_key));
      }
    }
  });

  test("SAME_FORMAT and UNSUPPORTED_TARGET_FORMAT do not reserve quota or create tasks", async () => {
    const user = state.editor, p = state.project, video = state.sources["base.mp4"];
    const before = await remaining(user);
    const count = await state.db.collection("videotasks").countDocuments({ project_id: oid(p) });
    for (const [target, code] of [["mp4", "SAME_FORMAT"], ["webm", "UNSUPPORTED_TARGET_FORMAT"]]) {
      const r = await submit(user, p, video, step("convert", { target }));
      assert.equal(r.status, 422, JSON.stringify(r.data));
      assert.equal(r.data.error.code, code);
    }
    assert.equal(await remaining(user), before);
    assert.equal(await state.db.collection("videotasks").countDocuments({ project_id: oid(p) }), count);
  });

  test("cancel AVI encoding after progress, refund, no output and clean targets", async () => {
    const user = state.editor, p = state.project;
    const before = await remaining(user);
    const r = await submit(user, p, state.sources["long.mp4"], step("convert", { target: "avi" }));
    assert.equal(r.status, 202, JSON.stringify(r.data));
    await until(() => state.progress.find((e) => e.taskId === r.data.taskId && e.progress > 0), "AVI progress", 60000);
    const cancelled = await api("DELETE", `${videos(user, p)}/tasks/${r.data.taskId}`, user);
    assert.equal(cancelled.status, 200, JSON.stringify(cancelled.data));
    const done = await finish(user, p, r.data.taskId);
    assert.equal(done.status, "cancelled");
    assert.equal(done.resultVideoId, undefined);
    await until(async () => (await remaining(user)) === before, "credit refunded");
    await until(() => state.replies.find((m) => m.taskId === r.data.taskId && m.status === "cancelled"), "worker cancellation");
    assert.equal(await state.db.collection("videos").countDocuments({ _id: oid(r.data.taskId) }), 0);
    const task = await state.db.collection("videotasks").findOne({ _id: oid(r.data.taskId) });
    for (const target of Object.values(task.plan.targets))
      assert.equal(await objectStatus(state.owner.id, `${target.projectId}/${target.stage}/${target.name}`), 404);
  });
});
