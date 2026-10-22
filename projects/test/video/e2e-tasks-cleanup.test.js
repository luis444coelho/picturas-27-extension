// End-to-end test of the deleted-project part of the maintenance routine
// (ADD T-00, Q-ADD-14, D-41, D-46), which runs every 10 minutes: allow up to
// 11 minutes. Needs the same environment as e2e-tasks.test.js.
//
//   VIDEO_E2E_URL=https://localhost:8080 VIDEO_E2E_FIXTURES=<dir> \
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node --test test/video/e2e-tasks-cleanup.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const BASE = process.env.VIDEO_E2E_URL;
const FIXTURES = process.env.VIDEO_E2E_FIXTURES;
const MONGO =
  process.env.VIDEO_E2E_MONGO || "mongodb://localhost:27018/project";
const SOCKET_IO =
  process.env.VIDEO_E2E_SOCKET_IO ||
  path.join(__dirname, "../../../frontend/node_modules/socket.io-client");
const skip =
  !BASE || !FIXTURES ? "set VIDEO_E2E_URL and VIDEO_E2E_FIXTURES" : false;
const STEP = { operation: "test_reencode", version: 1, parameters: {} };
const oid = (id) => new mongoose.Types.ObjectId(id);

async function api(method, url, { token, body, headers = {} } = {}) {
  const resp = await fetch(`${BASE}/api-gateway${url}`, {
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

async function storageHead(ownerId, key) {
  const [projectId, stage, name] = key.split("/");
  const resp = await fetch(
    `http://localhost:11000/video/object/${ownerId}/${projectId}/${stage}/${name}`,
    { method: "HEAD" },
  );
  return resp.status;
}

function nextEvent(socket, name, predicate, timeoutMs = 180000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`no ${name}`)), timeoutMs);
    const handler = (e) => {
      if (!predicate(e)) return;
      clearTimeout(timer);
      socket.off(name, handler);
      resolve(e);
    };
    socket.on(name, handler);
  });
}

test(
  "deleted project: active task cancelled with refund, videos and objects removed, slot removed (T-00, D-46)",
  { skip, timeout: 15 * 60 * 1000 },
  async () => {
    await mongoose.connect(MONGO);
    const db = mongoose.connection;
    try {
      const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const reg = await api("POST", "/users", {
        body: {
          name: "e2e cleanup",
          email: `e2e-b003-cleanup-${stamp}@test.local`,
          password: "e2e-password",
          type: "free",
        },
      });
      const user = { id: reg.json.user._id, token: reg.json.jwt };
      const created = await api("POST", `/projects/${user.id}`, {
        token: user.token,
        body: { name: "e2e b003 cleanup" },
      });
      const project = created.json._id;
      const videos = `/projects/${user.id}/${project}/videos`;

      const { io } = require(SOCKET_IO);
      const socket = io(BASE, {
        transports: ["websocket"],
        rejectUnauthorized: false,
        auth: { token: user.token },
      });
      await new Promise((resolve, reject) => {
        socket.on("connect", resolve);
        socket.on("connect_error", reject);
      });
      socket.emit("join-project", project);

      // A video and a completed result, so the user has spent 1 credit today.
      const data = fs.readFileSync(path.join(FIXTURES, "short.mp4"));
      const ticket = await api("POST", `${videos}/uploads`, {
        token: user.token,
        body: {
          fileName: "short.mp4",
          mimeType: "video/mp4",
          sizeBytes: data.length,
        },
      });
      await fetch(ticket.json.upload.url, {
        method: "PUT",
        headers: { "Content-Type": "video/mp4" },
        body: data,
      });
      const ingested = nextEvent(
        socket,
        "video-ingest-update",
        (e) => e.videoId === ticket.json.videoId && e.status !== "processing",
      );
      await api("POST", `${videos}/${ticket.json.videoId}/upload/complete`, {
        token: user.token,
      });
      assert.equal((await ingested).status, "completed");

      const sub = await api(
        "POST",
        `${videos}/${ticket.json.videoId}/operations`,
        { token: user.token, body: { steps: [STEP] } },
      );
      assert.equal(sub.status, 202);
      const done = await nextEvent(
        socket,
        "video-task-update",
        (e) => e.taskId === sub.json.taskId && e.status === "completed",
      );
      assert.equal(done.status, "completed");
      socket.close();

      // An active task that holds the slot and 1 reserved credit, as if the
      // project were deleted while it waited (D-46). It is not in the queue.
      const active = new mongoose.Types.ObjectId();
      const now = new Date();
      await db.collection("videotasks").insertOne({
        _id: active,
        project_id: oid(project),
        owner_id: oid(user.id),
        runner_id: oid(user.id),
        kind: "single",
        steps: [STEP],
        input_video_ids: [oid(ticket.json.videoId)],
        status: "queued",
        step: 1,
        total_steps: 1,
        progress: 0,
        cost: 1,
        reserved_credits: 1,
        refund: { state: "none", at: null },
        correlation_id: "e2e-cleanup",
        result_video_id: null,
        error: null,
        plan: { targets: {} },
        published_at: now,
        status_changed_at: now,
        createdAt: now,
        updatedAt: now,
      });
      await db.collection("video_project_locks").insertOne({
        project_id: oid(project),
        holder_kind: "task",
        holder_id: active,
        createdAt: now,
      });
      const before = (
        await api("GET", `/users/${user.id}`, { token: user.token })
      ).json.remaining_operations;
      assert.equal(before, 4);

      const keys = [];
      for (const v of await db
        .collection("videos")
        .find({ project_id: oid(project) })
        .toArray())
        keys.push(...Object.values(v.storage));
      assert.equal(
        keys.length,
        6,
        "original + thumb + frame0 of the source and of the result",
      );
      for (const key of keys)
        assert.equal(await storageHead(user.id, key), 200, key);

      const version = (
        await api("GET", `/projects/${user.id}/${project}`, {
          token: user.token,
        })
      ).json.version;
      const del = await api("DELETE", `/projects/${user.id}/${project}`, {
        token: user.token,
        headers: { "X-Project-Version": String(version) },
      });
      assert.ok([200, 204].includes(del.status), JSON.stringify(del.json));

      let left;
      const started = Date.now();
      for (;;) {
        left = await db
          .collection("videos")
          .countDocuments({ project_id: oid(project) });
        if (left === 0 || Date.now() - started > 11 * 60 * 1000) break;
        await new Promise((r) => setTimeout(r, 5000));
      }
      console.log(
        "deleted-project cleanup after (s):",
        Math.round((Date.now() - started) / 1000),
      );
      assert.equal(left, 0, "videos removed");
      for (const key of keys)
        assert.equal(await storageHead(user.id, key), 404, key);
      assert.equal(
        await db
          .collection("video_project_locks")
          .countDocuments({ project_id: oid(project) }),
        0,
      );
      const task = await db.collection("videotasks").findOne({ _id: active });
      assert.equal(task.status, "cancelled", "D-46");
      assert.equal(task.refund.state, "done");
      const after = (
        await api("GET", `/users/${user.id}`, { token: user.token })
      ).json.remaining_operations;
      assert.equal(after, 5, "reserved credit given back");
    } finally {
      await mongoose.disconnect();
    }
  },
);
