// B004 through nginx/API/MongoDB/RabbitMQ/storage/worker. Explicitly opt in:
// VIDEO_E2E_URL=https://nginx VIDEO_E2E_FIXTURES=/tmp/b004-fixtures \
// NODE_TLS_REJECT_UNAUTHORIZED=0 node --test test/video/e2e-basic-edits.test.js
// Inside the Docker network use internal Mongo/storage defaults below.
// Own users/projects/objects and the exclusive AMQP observer are cleaned in after().
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");
const amqp = require("amqplib");
const crypto = require("node:crypto");
const BASE = process.env.VIDEO_E2E_URL,
  FIXTURES = process.env.VIDEO_E2E_FIXTURES;
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
  replies: [],
  progress: [],
  timings: [],
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
async function api(method, route, user, body, headers = {}) {
  if (user?.shareId && route.startsWith("/projects/"))
    route += `${route.includes("?") ? "&" : "?"}share=${encodeURIComponent(user.shareId)}`;
  const at = performance.now();
  const response = await fetch(`${BASE}/api-gateway${route}`, {
    method,
    headers: {
      ...(user ? { Authorization: `Bearer ${user.token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: response.status, data, elapsed: performance.now() - at };
}
async function until(fn, label, timeout = 120000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const result = await fn();
    if (result) return result;
    await sleep(100);
  }
  throw new Error(`timeout: ${label}`);
}
async function register(type) {
  const r = await api("POST", "/users", null, {
    name: "B004 persistent test",
    email: `b004-${type}-${Date.now()}-${Math.random().toString(16).slice(2)}@test.local`,
    password: "b004-test-password",
    type,
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const user = { id: r.data.user._id, token: r.data.jwt };
  state.users.push(user);
  return user;
}
const videos = (user, project) =>
  `/projects/${user.ownerId ?? user.id}/${project}/videos`;
async function editor() {
  const user = await register("free"),
    owner = state.owner,
    p = state.project;
  const info = await api("GET", `/projects/${owner.id}/${p}`, owner);
  const share = await api(
    "POST",
    `/projects/${owner.id}/${p}/share`,
    owner,
    { permission: "edit" },
    { "X-Project-Version": String(info.data.version) },
  );
  assert.equal(share.status, 201, JSON.stringify(share.data));
  return { ...user, ownerId: owner.id, shareId: share.data.id };
}
async function project(user) {
  const r = await api("POST", `/projects/${user.id}`, user, {
    name: "B004 persistent test",
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  state.projects.push({ id: r.data._id, user });
  return r.data._id;
}
async function upload(user, p, name) {
  const type = {
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
  }[path.extname(name)];
  const data = fs.readFileSync(path.join(FIXTURES, name));
  const r = await api("POST", `${videos(user, p)}/uploads`, user, {
    fileName: name,
    mimeType: type,
    sizeBytes: data.length,
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const put = await fetch(publicUrl(r.data.upload.url), {
    method: "PUT",
    headers: { "Content-Type": type },
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
async function submit(user, p, video, s) {
  return api("POST", `${videos(user, p)}/${video}/operations`, user, {
    steps: [s],
  });
}
async function finish(user, p, id) {
  const done = await until(async () => {
    const r = await api("GET", `${videos(user, p)}/tasks/${id}`, user);
    assert.equal(r.status, 200);
    return (
      ["completed", "failed", "cancelled"].includes(r.data.status) && r.data
    );
  }, `task ${id}`);
  return done;
}
async function remaining(user) {
  return (await api("GET", `/users/${user.id}`, user)).data
    .remaining_operations;
}
async function objectStatus(userId, key) {
  return (await fetch(`${STORAGE}/object/${userId}/${key}`, { method: "HEAD" }))
    .status;
}
async function store(target, content) {
  const r = await fetch(`${STORAGE}/url/put`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...target,
      contentType: "video/mp4",
      public: false,
    }),
  });
  assert.equal(r.status, 200);
  const { url } = await r.json();
  assert.equal(
    (
      await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "video/mp4" },
        body: content,
      })
    ).status,
    200,
  );
}
async function deleteOwnBucket(user) {
  assert.ok(state.users.some((own) => own.id === user.id));
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
  assert.ok(!xml.includes("<IsTruncated>true</IsTruncated>"));
  const keys = [...xml.matchAll(/<Key>(.*?)<\/Key>/g)].map((match) => match[1]);
  for (const key of keys) {
    assert.ok(
      ["src/", "preview/", "out/"].includes(key) ||
        state.projects.some(
          (p) => p.user.id === user.id && key.startsWith(p.id + "/"),
        ),
      `unexpected key in own bucket: ${key}`,
    );
    const response = await s3("DELETE", key);
    assert.ok(
      [200, 204, 404].includes(response.status),
      `own bucket cleanup: ${response.status} ${await response.text()}`,
    );
  }
  const removed = await s3("DELETE");
  assert.ok([200, 204, 404].includes(removed.status), await removed.text());
}

test.describe("B004 real stack", { skip, timeout: 240000 }, () => {
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
      (m) => {
        if (m) {
          const r = JSON.parse(m.content);
          if (r.taskId)
            (m.fields.routingKey === "video_project_queue"
              ? state.replies
              : state.progress
            ).push(r);
        }
      },
      { noAck: true },
    );
    state.owner = await register("premium");
    state.project = await project(state.owner);
    for (const name of [
      "base.mp4",
      "fraction.mov",
      "mpeg.avi",
      "h264.avi",
      "odd.mp4",
      "rot.mp4",
      "long.mp4",
    ])
      state.sources[name] = await upload(state.owner, state.project, name);
  });
  test.after(async () => {
    try {
      // Every delete is scoped to ids made by this invocation; no sweeping by name.
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
          "results",
          "processes",
        ])
          await state.db.collection(name).deleteMany(query);
        await state.db.collection("projects").deleteOne({ _id: oid(id) });
      }
      for (const user of state.users) {
        await deleteOwnBucket(user);
        assert.match(user.id, /^[0-9a-f]{24}$/);
        fs.rmSync(
          path.join(
            process.env.VIDEO_E2E_LOCAL_IMAGES || "/app/images/users",
            user.id,
          ),
          { recursive: true, force: true },
        );
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
    console.log("B004 timings (ms):", JSON.stringify(state.timings));
  });
  for (const [name, s, mode] of [
    ["base.mp4", step("trim", { startMs: 0, endMs: 2000 }), "copy"],
    ["h264.avi", step("trim", { startMs: 0, endMs: 2000 }), "encode"],
    ["mpeg.avi", step("trim", { startMs: 0, endMs: 2000 }), "encode"],
    ["fraction.mov", step("trim", { startMs: 137, endMs: 2137 }), "encode"],
    ["mpeg.avi", step("remove_audio"), "encode"],
    ["h264.avi", step("remove_audio"), "copy"],
    [
      "fraction.mov",
      step("speed", { factor: 0.25, _input: { fpsNum: 999, fpsDen: 1 } }),
      "encode",
    ],
    ["mpeg.avi", step("speed", { factor: 4 }), "encode"],
    ["rot.mp4", step("speed", { factor: 4 }), "encode"],
    ["odd.mp4", step("trim", { startMs: 0, endMs: 2000 }), "copy"],
  ])
    test(`${name} ${s.operation}: pipeline, provenance, actual metadata and videoMode`, async () => {
      const user = state.owner,
        p = state.project,
        input = state.sources[name];
      const r = await submit(user, p, input, s);
      assert.equal(r.status, 202, JSON.stringify(r.data));
      state.timings.push(["accept", r.elapsed]);
      assert.ok(r.elapsed <= 1000);
      const done = await finish(user, p, r.data.taskId);
      assert.equal(done.status, "completed", JSON.stringify(done));
      const task = await state.db
          .collection("videotasks")
          .findOne({ _id: oid(done.taskId) }),
        output = await until(
          () =>
            state.db
              .collection("videos")
              .findOne({ _id: oid(done.resultVideoId) }),
          "persisted result video",
        );
      const recipe = (list) =>
        list.map((item) => ({ ...item, parameters: item.parameters ?? {} }));
      assert.deepEqual(output.source_video_ids.map(String), [input]);
      assert.deepEqual(recipe(output.recipe), [s]);
      assert.deepEqual(recipe(task.steps), [s]);
      const info = await api(
        "GET",
        `${videos(user, p)}/${done.resultVideoId}`,
        user,
      );
      assert.deepEqual(info.data.recipe, [s]);
      assert.equal(output.meta.video_codec, "h264");
      assert.equal(output.meta.container, "mp4");
      assert.equal(
        output.meta.audio_codec,
        s.operation === "remove_audio" ||
          name === "rot.mp4" ||
          name === "odd.mp4"
          ? null
          : "aac",
      );
      assert.equal(task.plan.steps[0].input.fpsNum === 999, false);
      const serverSource = await state.db
        .collection("videos")
        .findOne({ _id: oid(input) });
      assert.deepEqual(task.plan.steps[0].input, {
        fpsNum: serverSource.meta.fps_num,
        fpsDen: serverSource.meta.fps_den,
      });
      assert.equal(output.meta.fps_num, serverSource.meta.fps_num);
      assert.equal(output.meta.fps_den, serverSource.meta.fps_den);
      for (const key of Object.values(output.storage))
        assert.equal(await objectStatus(user.id, key), 200);
      const reply = await until(
        () =>
          state.replies.find(
            (item) =>
              item.taskId === done.taskId && item.status === "completed",
          ),
        "observed completed",
      );
      assert.equal(reply.metadata.videoMode, mode);
      if (name === "odd.mp4") {
        assert.ok(task.plan.targets.preview);
        assert.ok(output.storage.preview_key);
        assert.equal(task.plan.preview, null);
      }
      const gallery = await api("GET", videos(user, p), user);
      assert.ok(gallery.data.videos.some((v) => v.id === done.resultVideoId));
    });
  test("B001/B002 regression: immutable source, original download and HTTP Range", async () => {
    const user = state.owner,
      p = state.project,
      id = state.sources["base.mp4"];
    const r = await api("GET", `${videos(user, p)}/${id}/download`, user);
    assert.equal(r.status, 200);
    const bytes = Buffer.from(
      await (await fetch(publicUrl(r.data.url))).arrayBuffer(),
    );
    assert.deepEqual(bytes, fs.readFileSync(path.join(FIXTURES, "base.mp4")));
    const range = await fetch(publicUrl(r.data.url), {
      headers: { Range: "bytes=0-31" },
    });
    assert.equal(range.status, 206);
    assert.equal((await range.arrayBuffer()).byteLength, 32);
    const info = await api("GET", `${videos(user, p)}/${id}`, user);
    assert.equal(info.status, 200);
    assert.equal(info.data.meta.videoCodec, "h264");
    assert.deepEqual(info.data.recipe, []);
    assert.equal((await api("GET", videos(user, p))).status, 401);
  });
  test("validation and rejected operations: no task/quota; server duration/fps", async () => {
    const user = await editor(),
      p = state.project,
      v = state.sources["base.mp4"],
      before = await remaining(user);
    const count = await state.db
      .collection("videotasks")
      .countDocuments({ project_id: oid(p) });
    for (const s of [
      step("trim", { startMs: 0, endMs: 1 }),
      step("trim", { startMs: 0, endMs: 999999 }),
      step("speed", { factor: 1 }),
      step("speed", { factor: 0 }),
    ]) {
      const valid = await api("POST", `${videos(user, p)}/validate`, user, {
        videoId: v,
        steps: [s],
      });
      assert.equal(valid.status, 200);
      assert.equal(valid.data.valid, false);
      state.timings.push(["validate", valid.elapsed]);
      assert.ok(valid.elapsed <= 1000);
      const r = await submit(user, p, v, s);
      assert.equal(r.status, 422);
      assert.equal(r.data.error.code, "INVALID_STEP_PARAMS");
      assert.ok(r.data.correlationId);
    }
    assert.equal(await remaining(user), before);
    assert.equal(
      await state.db
        .collection("videotasks")
        .countDocuments({ project_id: oid(p) }),
      count,
    );
    const noAudio = await submit(
      user,
      p,
      state.sources["odd.mp4"],
      step("remove_audio"),
    );
    assert.equal(noAudio.status, 422);
    assert.equal(noAudio.data.error.details.errors[0].code, "NO_AUDIO_STREAM");
    assert.equal(await remaining(user), before);
    assert.equal(
      await state.db
        .collection("videotasks")
        .countDocuments({ project_id: oid(p) }),
      count,
    );
  });
  test("cancel active encoding refunds quota and a failed task refunds once", async () => {
    const user = await editor(),
      p = state.project,
      v = state.sources["long.mp4"],
      before = await remaining(user);
    const r = await submit(user, p, v, step("speed", { factor: 0.25 }));
    assert.equal(r.status, 202);
    await until(
      () =>
        state.progress.find(
          (item) => item.taskId === r.data.taskId && item.progress > 0,
        ),
      "FFmpeg positive progress",
    );
    const cancel = await api(
      "DELETE",
      `${videos(user, p)}/tasks/${r.data.taskId}`,
      user,
    );
    assert.equal(cancel.status, 200);
    assert.equal(cancel.data.status, "cancelled");
    assert.equal(await remaining(user), before);
    await until(
      () =>
        state.replies.find(
          (item) =>
            item.taskId === r.data.taskId && item.status === "cancelled",
        ),
      "worker cancelled",
    );
    assert.equal(
      state.replies.some(
        (item) => item.taskId === r.data.taskId && item.status === "completed",
      ),
      false,
    );
    assert.equal(
      await state.db
        .collection("videos")
        .countDocuments({ _id: oid(r.data.taskId) }),
      0,
    );
    // Missing original exercises the actual worker failure and refund path.
    const missing = await upload(state.owner, p, "base.mp4");
    const doc = await state.db
      .collection("videos")
      .findOne({ _id: oid(missing) });
    await fetch(
      `${STORAGE}/object/${state.owner.id}/${doc.storage.original_key}`,
      { method: "DELETE" },
    );
    const failed = await submit(user, p, missing, step("speed", { factor: 2 }));
    assert.equal(failed.status, 202);
    const done = await finish(user, p, failed.data.taskId);
    assert.equal(done.status, "failed");
    assert.equal(done.error.code, "RESOURCE_UNAVAILABLE");
    await until(async () => (await remaining(user)) === before, "refund");
  });
  test("persisted plan republication and late-result preview cleanup with real Mongo/AMQP/storage", async () => {
    const user = state.owner,
      p = state.project;
    const r = await submit(
      user,
      p,
      state.sources["odd.mp4"],
      step("trim", { startMs: 0, endMs: 2000 }),
    );
    assert.equal(r.status, 202);
    await finish(user, p, r.data.taskId);
    const original = await state.db
      .collection("videotasks")
      .findOne({ _id: oid(r.data.taskId) });
    // A new test-owned document represents a crash before publication. No shared service is stopped.
    const id = new mongoose.Types.ObjectId(),
      at = new Date(),
      plan = structuredClone(original.plan);
    for (const target of Object.values(plan.targets))
      target.name = target.name.replace(r.data.taskId, String(id));
    const doc = {
      ...original,
      _id: id,
      status: "queued",
      result_video_id: null,
      published_at: null,
      createdAt: new Date(at - 120000),
      updatedAt: at,
      status_changed_at: at,
      plan,
      refund: { state: "none", at: null },
    };
    await state.db.collection("videotasks").insertOne(doc);
    await until(
      async () => {
        const t = await state.db.collection("videotasks").findOne({ _id: id });
        return t.status === "completed" && t;
      },
      "maintenance republication",
      90000,
    );
    const stored = await state.db.collection("videotasks").findOne({ _id: id });
    assert.deepEqual(stored.plan, plan);
    assert.ok(stored.published_at);
    const lateId = new mongoose.Types.ObjectId(),
      late = structuredClone(plan);
    for (const target of Object.values(late.targets))
      target.name = target.name.replace(String(id), String(lateId));
    await state.db.collection("videotasks").insertOne({
      ...doc,
      _id: lateId,
      status: "cancelled",
      plan: late,
      published_at: at,
      status_changed_at: at,
    });
    await store(late.targets.preview, Buffer.from("b004 late preview"));
    const key = `${p}/video_preview/${lateId}.mp4`;
    assert.equal(await objectStatus(user.id, key), 200);
    state.channel.publish(
      "picturas",
      "video_project_queue",
      Buffer.from(
        JSON.stringify({
          operation: "task.run",
          taskId: String(lateId),
          status: "completed",
          output: { keys: {} },
        }),
      ),
      { contentType: "application/json", persistent: true },
    );
    await until(
      async () => (await objectStatus(user.id, key)) === 404,
      "late preview cleanup",
    );
    assert.equal(
      await state.db.collection("videos").countDocuments({ _id: lateId }),
      0,
    );
  });
  test("image flow regression: upload, brightness worker and committed downloadable result", async () => {
    const user = state.owner,
      p = state.project,
      route = `/projects/${user.id}/${p}`;
    async function version() {
      return String((await api("GET", route, user)).data.version);
    }
    const body = new FormData(),
      original = fs.readFileSync(path.join(FIXTURES, "image.png"));
    body.append(
      "image",
      new Blob([original], { type: "image/png" }),
      "b004-image.png",
    );
    const uploaded = await fetch(`${BASE}/api-gateway${route}/img`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.token}`,
        "X-Project-Version": await version(),
      },
      body,
    });
    assert.equal(uploaded.status, 204, await uploaded.text());
    const tool = await api(
      "POST",
      `${route}/tool`,
      user,
      { procedure: "brightness", params: { brightness: 0.5 } },
      { "X-Project-Version": await version() },
    );
    assert.equal(tool.status, 201, JSON.stringify(tool.data));
    const started = await api(
      "POST",
      `${route}/process`,
      user,
      {},
      { "X-Project-Version": await version() },
    );
    assert.equal(started.status, 201, JSON.stringify(started.data));
    await until(async () => {
      const doc = await state.db
        .collection("projects")
        .findOne({ _id: oid(p) });
      return doc.committedToken > 0 && doc.committedToken === doc.activeToken;
    }, "image commit");
    const result = await api("GET", `${route}/process/url`, user);
    assert.equal(result.status, 200);
    assert.equal(result.data.imgs.length, 1);
    const data = Buffer.from(
      await (await fetch(publicUrl(result.data.imgs[0].url))).arrayBuffer(),
    );
    assert.equal(data.readUInt32BE(16), 64);
    assert.equal(data.readUInt32BE(20), 48);
    assert.notDeepEqual(data, original);
    const sharp = require("sharp");
    const pixel = await sharp(data).removeAlpha().raw().toBuffer();
    assert.deepEqual([...pixel.subarray(0, 3)], [0, 0, 127]);
  });
});
