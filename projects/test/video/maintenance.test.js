// Unit tests of the maintenance routine (Q-ADD-14 without batches, D-04, D-15,
// D-41, D-45, D-46), with a controllable clock.
//
//   cd projects && node --test test/video/maintenance.test.js
const test = require("node:test");
const assert = require("node:assert/strict");

const { createMaintenance, DEFAULTS } = require("../../video/maintenance");
const { createTasks } = require("../../video/tasks");
const { createLocks } = require("../../video/locks");
const { createRegistry } = require("../../video/operations");
const testReencode = require("../../video/operations/test_reencode");
const { createStorage, createUsers, silentLog } = require("./fakes");
const {
  createCollection,
  createTaskBus,
  createFakeQuota,
} = require("./task-fakes");

const OWNER = "64b000000000000000000001";
const PROJECT = "64b0000000000000000000aa";
const GONE = "64b0000000000000000000ee";
const T0 = new Date("2026-10-22T12:00:00Z");
const MIN = 60 * 1000;

function setup() {
  let clock = T0;
  const now = () => clock;
  const VideoTask = createCollection({ now });
  const Video = createCollection({ now });
  const Lock = createCollection({ unique: ["project_id"], now });
  const Project = createCollection({ now });
  const bus = createTaskBus();
  const quota = createFakeQuota();
  const storage = createStorage();
  const locks = createLocks({ Lock });
  const tasks = createTasks({
    VideoTask,
    Video,
    locks,
    quota,
    bus,
    users: createUsers({ [OWNER]: "free" }),
    storage,
    registry: createRegistry([testReencode]),
    log: silentLog,
    now,
  });
  const maintenance = createMaintenance({
    VideoTask,
    Video,
    Lock,
    Project,
    tasks,
    storage,
    log: silentLog,
    now,
  });
  return {
    VideoTask,
    Video,
    Lock,
    Project,
    bus,
    quota,
    storage,
    tasks,
    maintenance,
    advance: (ms) => {
      clock = new Date(clock.getTime() + ms);
    },
  };
}

async function addTask(ctx, overrides = {}) {
  return ctx.VideoTask.create({
    project_id: PROJECT,
    owner_id: OWNER,
    runner_id: OWNER,
    kind: "single",
    steps: [],
    input_video_ids: [],
    status: "queued",
    step: 1,
    total_steps: 1,
    progress: 0,
    cost: 1,
    reserved_credits: 1,
    refund: { state: "none", at: null },
    correlation_id: "corr",
    plan: { targets: {} },
    published_at: T0,
    status_changed_at: T0,
    ...overrides,
  });
}

test("defaults follow D-41 and D-15", () => {
  assert.equal(DEFAULTS.fastEveryMs, 60_000);
  assert.equal(DEFAULTS.slowEveryMs, 10 * MIN);
  assert.equal(DEFAULTS.orphanLockMs, 60_000);
  assert.equal(DEFAULTS.stuckMs, (3 * 60 + 10) * MIN);
  assert.equal(DEFAULTS.abandonedUploadMs, 1_200_000);
});

test("orphan slots: no task after 60 s, or task already final → released; active task kept (T-03)", async () => {
  const ctx = setup();
  const active = await addTask(ctx);
  const done = await addTask(ctx, {
    project_id: "64b0000000000000000000a2",
    status: "completed",
  });
  await ctx.Lock.create({
    project_id: PROJECT,
    holder_kind: "task",
    holder_id: active._id,
  });
  await ctx.Lock.create({
    project_id: "64b0000000000000000000a2",
    holder_kind: "task",
    holder_id: done._id,
  });
  await ctx.Lock.create({
    project_id: "64b0000000000000000000a3",
    holder_kind: "task",
    holder_id: "64b0000000000000000000f9",
  });

  assert.equal(
    await ctx.maintenance.releaseOrphanLocks(),
    0,
    "younger than 60 s",
  );
  ctx.advance(61_000);
  assert.equal(await ctx.maintenance.releaseOrphanLocks(), 2);
  assert.deepEqual(
    ctx.Lock.all().map((l) => l.project_id),
    [PROJECT],
  );
});

test("queued tasks never published are republished after 60 s (D-41)", async () => {
  const ctx = setup();
  const task = await addTask(ctx, { published_at: null });
  await addTask(ctx, { project_id: "64b0000000000000000000a2" });
  assert.equal(await ctx.maintenance.republishUnpublished(), 0);
  ctx.advance(61_000);
  assert.equal(await ctx.maintenance.republishUnpublished(), 1);
  assert.equal(ctx.bus.operations[0].taskId, task._id);
  assert.ok(ctx.VideoTask.docs.get(task._id).published_at);
  assert.equal(await ctx.maintenance.republishUnpublished(), 0);
});

test("active tasks without a transition for 3 h 10 min → failed, refund, cancel, slot freed (D-41)", async () => {
  const ctx = setup();
  const task = await addTask(ctx, { status: "processing" });
  await ctx.Lock.create({
    project_id: PROJECT,
    holder_kind: "task",
    holder_id: task._id,
  });

  ctx.advance(3 * 60 * MIN);
  assert.equal(await ctx.maintenance.closeStuckTasks(), 0, "3 h is not enough");
  ctx.advance(11 * MIN);
  assert.equal(await ctx.maintenance.closeStuckTasks(), 1);

  const stored = ctx.VideoTask.docs.get(task._id);
  assert.equal(stored.status, "failed");
  assert.equal(stored.error.code, "PROCESSING_ERROR");
  assert.equal(stored.refund.state, "done");
  assert.deepEqual(ctx.quota.refunds, [[OWNER, 1]]);
  assert.equal(ctx.bus.control[0].taskId, task._id);
  assert.equal(ctx.Lock.docs.size, 0);
});

test("pending refunds are retried until done (D-45)", async () => {
  const ctx = setup();
  const task = await addTask(ctx, {
    status: "failed",
    refund: { state: "pending", at: null },
  });
  ctx.quota.failRefund = true;
  ctx.advance(61_000);
  await ctx.maintenance.retryPendingRefunds();
  assert.equal(ctx.VideoTask.docs.get(task._id).refund.state, "pending");

  ctx.quota.failRefund = false;
  ctx.advance(61_000);
  await ctx.maintenance.retryPendingRefunds();
  assert.equal(ctx.VideoTask.docs.get(task._id).refund.state, "done");
  assert.deepEqual(ctx.quota.refunds, [[OWNER, 1]]);
});

test("abandoned uploads (queued > 900 s + 300 s): object and record deleted; recent ones kept (D-15)", async () => {
  const ctx = setup();
  const old = await ctx.Video.create({
    project_id: PROJECT,
    owner_id: OWNER,
    created_by: OWNER,
    original_name: "a.mp4",
    mime_type: "video/mp4",
    status: "queued",
    storage: { original_key: `${PROJECT}/video_src/old.mp4` },
  });
  ctx.advance(19 * MIN);
  const recent = await ctx.Video.create({
    project_id: PROJECT,
    owner_id: OWNER,
    created_by: OWNER,
    original_name: "b.mp4",
    mime_type: "video/mp4",
    status: "queued",
    storage: { original_key: `${PROJECT}/video_src/recent.mp4` },
  });
  assert.equal(
    await ctx.maintenance.removeAbandonedUploads(),
    0,
    "19 min is not enough",
  );
  ctx.advance(2 * MIN);
  assert.equal(await ctx.maintenance.removeAbandonedUploads(), 1);

  assert.equal(ctx.Video.docs.has(old._id), false, "record deleted");
  assert.deepEqual(
    ctx.storage.removed,
    [`${PROJECT}/video_src/old.mp4`],
    "object deleted",
  );
  assert.equal(ctx.Video.docs.get(recent._id).status, "queued");
});

test("deleted project: active task cancelled with refund, videos and objects removed, slot removed (T-00, D-46)", async () => {
  const ctx = setup();
  await ctx.Project.create({ _id: PROJECT, name: "alive" });

  const alive = await ctx.Video.create({
    project_id: PROJECT,
    owner_id: OWNER,
    created_by: OWNER,
    original_name: "k.mp4",
    mime_type: "video/mp4",
    status: "completed",
    storage: { original_key: `${PROJECT}/video_src/k.mp4` },
  });
  const gone = await ctx.Video.create({
    project_id: GONE,
    owner_id: OWNER,
    created_by: OWNER,
    original_name: "g.mp4",
    mime_type: "video/mp4",
    status: "completed",
    storage: {
      original_key: `${GONE}/video_src/g.mp4`,
      preview_key: `${GONE}/video_preview/g.mp4`,
      thumb_key: `${GONE}/video_thumb/g.thumb.jpg`,
      first_frame_key: `${GONE}/video_thumb/g.frame0.jpg`,
    },
  });
  const active = await addTask(ctx, { project_id: GONE, status: "processing" });
  const oldFinal = await addTask(ctx, {
    project_id: GONE,
    status: "completed",
    status_changed_at: new Date(T0.getTime() - 4 * 60 * MIN),
  });
  await ctx.Lock.create({
    project_id: GONE,
    holder_kind: "task",
    holder_id: active._id,
  });

  assert.equal(await ctx.maintenance.removeDeletedProjects(), 1);

  assert.equal(ctx.Video.docs.has(gone._id), false);
  assert.equal(ctx.Video.docs.has(alive._id), true);
  assert.deepEqual(ctx.storage.removed.sort(), [
    `${GONE}/video_preview/g.mp4`,
    `${GONE}/video_src/g.mp4`,
    `${GONE}/video_thumb/g.frame0.jpg`,
    `${GONE}/video_thumb/g.thumb.jpg`,
  ]);
  // D-46: cancelled with refund and a cancel message, kept for late results.
  const cancelled = ctx.VideoTask.docs.get(active._id);
  assert.equal(cancelled.status, "cancelled");
  assert.equal(cancelled.refund.state, "done");
  assert.deepEqual(ctx.quota.refunds, [[OWNER, 1]]);
  assert.equal(ctx.bus.control[0].taskId, active._id);
  assert.equal(
    ctx.VideoTask.docs.has(oldFinal._id),
    false,
    "old final task removed",
  );
  assert.equal(ctx.Lock.docs.size, 0);

  // After 3 h 10 min the cancelled task goes too.
  ctx.advance(3 * 60 * MIN + 11 * MIN);
  await ctx.maintenance.removeDeletedProjects();
  assert.equal(ctx.VideoTask.docs.size, 0);
});

test("runs do not overlap and errors do not stop the routine", async () => {
  const ctx = setup();
  const m = createMaintenance({
    VideoTask: {
      find: () => ({
        lean: async () => {
          throw new Error("mongo down");
        },
      }),
    },
    Video: ctx.Video,
    Lock: ctx.Lock,
    Project: ctx.Project,
    tasks: ctx.tasks,
    storage: ctx.storage,
    log: silentLog,
    options: { fastEveryMs: 10, slowEveryMs: 10_000 },
  });
  m.start();
  await new Promise((r) => setTimeout(r, 50));
  m.stop();
});
