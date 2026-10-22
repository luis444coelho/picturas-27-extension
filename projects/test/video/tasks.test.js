// Unit tests of the video tasks (B003): acceptance (ADD T-03), quota (T-04,
// D-44, D-45, V8), cancellation (TASK-004/005), worker replies, idempotency
// (ADR-004, ADR-005), and ADR-003.
//
//   cd projects && node --test test/video/tasks.test.js
const test = require("node:test");
const assert = require("node:assert/strict");

const { createTasks } = require("../../video/tasks");
const { createLocks } = require("../../video/locks");
const { createRegistry } = require("../../video/operations");
const testReencode = require("../../video/operations/test_reencode");
const { VideoError } = require("../../video/errors");
const { createStorage, createUsers, silentLog } = require("./fakes");
const {
  createCollection,
  createTaskBus,
  createFakeQuota,
} = require("./task-fakes");

const OWNER = "64b000000000000000000001";
const GUEST = "64b000000000000000000002";
const PREMIUM = "64b000000000000000000004";
const ANON = "64b000000000000000000003";
const PROJECT = "64b0000000000000000000aa";
const VIDEO = "64b0000000000000000000c1";

function sourceVideo(overrides = {}) {
  return {
    _id: VIDEO,
    project_id: PROJECT,
    owner_id: OWNER,
    created_by: OWNER,
    original_name: "férias.mov",
    mime_type: "video/quicktime",
    status: "completed",
    storage: {
      original_key: `${PROJECT}/video_src/${VIDEO}.mov`,
      thumb_key: `${PROJECT}/video_thumb/${VIDEO}.thumb.jpg`,
      first_frame_key: `${PROJECT}/video_thumb/${VIDEO}.frame0.jpg`,
    },
    meta: {
      container: "mov",
      video_codec: "h264",
      audio_codec: "aac",
      width: 1921,
      height: 1080,
      rotation: 90,
      display_width: 1080,
      display_height: 1921,
      fps_num: 30000,
      fps_den: 1001,
      duration_ms: 12_000,
      size_bytes: 10 * 1024 * 1024,
      bitrate: 4_000_000,
    },
    ...overrides,
  };
}

const STEP = { operation: "test_reencode", version: 1, parameters: {} };

function setup(options = {}) {
  const VideoTask = createCollection();
  const Video = createCollection();
  const Lock = createCollection({ unique: ["project_id"] });
  const bus = createTaskBus(options.bus);
  const quota = createFakeQuota(options.quota);
  const storage = createStorage();
  const users = createUsers({
    [OWNER]: "free",
    [GUEST]: "free",
    [PREMIUM]: "premium",
    [ANON]: "anonymous",
  });
  const tasks = createTasks({
    VideoTask,
    Video,
    locks: createLocks({ Lock }),
    quota,
    bus,
    users,
    storage,
    registry: createRegistry([testReencode, ...(options.ops || [])]),
    log: silentLog,
  });
  return { VideoTask, Video, Lock, bus, quota, storage, tasks };
}

const project = { _id: PROJECT, user_id: OWNER };

function submit(ctx, overrides = {}) {
  return ctx.tasks.submit({
    project,
    callerId: OWNER,
    inputVideos: [sourceVideo()],
    steps: [STEP],
    correlationId: "corr-1",
    ...overrides,
  });
}

async function rejects(promise, status, code) {
  await assert.rejects(promise, (err) => {
    assert.ok(err instanceof VideoError, err.message);
    assert.equal(err.status, status);
    assert.equal(err.code, code);
    return true;
  });
}

function completedReply(ctx, taskId, overrides = {}) {
  const task = ctx.VideoTask.docs.get(taskId);
  const t = task.plan.targets;
  const k = (x) => `${x.projectId}/${x.stage}/${x.name}`;
  return {
    operation: "task.run",
    taskId,
    correlationId: "corr-1",
    status: "completed",
    output: {
      meta: {
        formatName: "mov,mp4,m4a,3gp,3g2,mj2",
        majorBrand: "isom",
        videoCodec: "h264",
        audioCodec: "aac",
        width: 1080,
        height: 1920,
        rotation: 0,
        fpsNum: 30000,
        fpsDen: 1001,
        durationMs: 12_012,
        sizeBytes: 5_000_000,
        bitrate: 3_000_000,
      },
      stream: { pixFmt: "yuv420p" },
      keys: {
        original: k(t.original),
        thumb: k(t.thumb),
        firstFrame: k(t.firstFrame),
      },
      previewMade: false,
    },
    ...overrides,
  };
}

// ---- acceptance -----------------------------------------------------------

test("accepts one step: 202 body, queued task, slot, reservation, task.run (TASK-001, QUOTA-002)", async () => {
  const ctx = setup();
  const result = await submit(ctx);

  assert.equal(result.status, "queued");
  const task = ctx.VideoTask.docs.get(result.taskId);
  assert.equal(task.status, "queued");
  assert.equal(task.kind, "single");
  assert.equal(task.total_steps, 1);
  assert.equal(task.cost, 1);
  assert.equal(task.reserved_credits, 1);
  assert.equal(task.runner_id, OWNER);
  assert.ok(task.published_at, "publication confirmed");
  assert.deepEqual(ctx.quota.reserves, [[OWNER, 1]]);

  const [lock] = ctx.Lock.all();
  assert.equal(lock.holder_id, result.taskId);

  const [msg] = ctx.bus.operations;
  assert.equal(msg.operation, "task.run");
  assert.equal(msg.taskId, result.taskId);
  assert.equal(msg.correlationId, "corr-1");
  assert.equal(msg.plan.targets.original.name, `${result.taskId}.mp4`);
  assert.equal(msg.plan.targets.original.stage, "video_out");
  assert.equal(msg.plan.targets.original.userId, OWNER);
  assert.equal(msg.plan.inputs[0].source.name, `${VIDEO}.mov`);
  assert.ok(
    !JSON.stringify(msg).includes("http"),
    "no URLs in the message (T-08)",
  );

  assert.equal(ctx.bus.ws.at(-1).event, "video-task-update");
  assert.equal(ctx.bus.ws.at(-1).status, "queued");
});

test("plan: working format MP4 H.264/AAC re-encoded with default settings and even crop (NFR-013, NFR-018, D-39)", async () => {
  const ctx = setup();
  const { taskId } = await submit(ctx);
  const { output } = ctx.VideoTask.docs.get(taskId).plan;
  assert.equal(output.container, "mp4");
  assert.deepEqual(output.video, {
    mode: "encode",
    codec: "libx264",
    preset: "veryfast",
    crf: 23,
    pixFmt: "yuv420p",
    evenCrop: true,
  });
  assert.deepEqual(output.audio, {
    mode: "encode",
    codec: "aac",
    bitrate: "128k",
  });
  assert.equal(output.faststart, true);
});

test("Premium: no reservation and nothing reserved (QUOTA-005)", async () => {
  const ctx = setup();
  const { taskId } = await submit(ctx, { callerId: PREMIUM });
  assert.deepEqual(ctx.quota.reserves, []);
  assert.equal(ctx.VideoTask.docs.get(taskId).reserved_credits, 0);
});

test("guest with edit permission: the guest's quota is used, not the owner's (QUOTA-006)", async () => {
  const ctx = setup();
  const { taskId } = await submit(ctx, { callerId: GUEST });
  assert.deepEqual(ctx.quota.reserves, [[GUEST, 1]]);
  const task = ctx.VideoTask.docs.get(taskId);
  assert.equal(task.runner_id, GUEST);
  assert.equal(task.owner_id, OWNER);
});

test("chain of 3 steps: cost 3, kind chain, totalSteps 3 (QUOTA-008, TASK-008)", async () => {
  const ctx = setup();
  const { taskId } = await submit(ctx, { steps: [STEP, STEP, STEP] });
  const task = ctx.VideoTask.docs.get(taskId);
  assert.equal(task.cost, 3);
  assert.equal(task.kind, "chain");
  assert.equal(task.total_steps, 3);
  assert.deepEqual(ctx.quota.reserves, [[OWNER, 3]]);
});

test("anonymous runner → 403, nothing created (AUTH-002)", async () => {
  const ctx = setup();
  await rejects(submit(ctx, { callerId: ANON }), 403, "FORBIDDEN");
  assert.equal(ctx.VideoTask.docs.size, 0);
  assert.equal(ctx.Lock.docs.size, 0);
});

test("input not completed → 409 RESOURCE_NOT_READY, no task, no quota (COM-001)", async () => {
  const ctx = setup();
  await rejects(
    submit(ctx, { inputVideos: [sourceVideo({ status: "processing" })] }),
    409,
    "RESOURCE_NOT_READY",
  );
  assert.equal(ctx.VideoTask.docs.size, 0);
  assert.deepEqual(ctx.quota.reserves, []);
});

test("input above the runner's duration limit → 422 LIMIT_EXCEEDED", async () => {
  const ctx = setup();
  const meta = { ...sourceVideo().meta, duration_ms: 6 * 60 * 1000 };
  await rejects(
    submit(ctx, { inputVideos: [sourceVideo({ meta })] }),
    422,
    "LIMIT_EXCEEDED",
  );
});

test("steps missing or empty → 422 INVALID_REQUEST {field: steps} (D-42)", async () => {
  const ctx = setup();
  for (const steps of [undefined, [], "x"]) {
    await assert.rejects(submit(ctx, { steps }), (err) => {
      assert.equal(err.status, 422);
      assert.equal(err.code, "INVALID_REQUEST");
      assert.deepEqual(err.details, { field: "steps" });
      return true;
    });
  }
  assert.equal(ctx.VideoTask.docs.size, 0);
});

test("unknown operation, unsupported version, bad parameters → 422 INVALID_STEP_PARAMS {index, errors} (COM-005, D-42)", async () => {
  const ctx = setup();
  const cases = [
    [
      [{ operation: "nope", version: 1 }],
      0,
      { code: "INVALID_STEP_PARAMS", field: "operation" },
    ],
    [
      [STEP, { ...STEP, version: 2 }],
      1,
      { code: "INVALID_STEP_PARAMS", field: "version", supportedVersions: [1] },
    ],
    [
      [{ ...STEP, parameters: { crf: 10 } }],
      0,
      { code: "INVALID_STEP_PARAMS", field: "crf" },
    ],
  ];
  for (const [steps, index, error] of cases) {
    await assert.rejects(submit(ctx, { steps }), (err) => {
      assert.equal(err.status, 422);
      assert.equal(err.code, "INVALID_STEP_PARAMS");
      assert.deepEqual(err.details, { index, errors: [error] });
      return true;
    });
  }
  assert.equal(ctx.VideoTask.docs.size, 0);
  assert.equal(ctx.Lock.docs.size, 0);
  assert.deepEqual(ctx.quota.reserves, []);
});

test("second task in the same project → 409 TASK_ALREADY_ACTIVE {taskId}, nothing reserved (NFR-021, D-44)", async () => {
  const ctx = setup();
  const first = await submit(ctx);
  await assert.rejects(submit(ctx, { callerId: GUEST }), (err) => {
    assert.equal(err.status, 409);
    assert.equal(err.code, "TASK_ALREADY_ACTIVE");
    assert.deepEqual(err.details, { taskId: first.taskId });
    return true;
  });
  assert.deepEqual(ctx.quota.reserves, [[OWNER, 1]]);
  assert.equal(ctx.VideoTask.docs.size, 1);
});

test("quota exhausted → 429 QUOTA_EXCEEDED {cost, remaining}, slot released, no task (QUOTA-001/007, D-44)", async () => {
  const ctx = setup({ quota: { credits: { [OWNER]: 3 } } });
  await assert.rejects(
    submit(ctx, { steps: [STEP, STEP, STEP, STEP] }),
    (err) => {
      assert.equal(err.status, 429);
      assert.equal(err.code, "QUOTA_EXCEEDED");
      assert.deepEqual(err.details, { cost: 4, remaining: 3 });
      return true;
    },
  );
  assert.equal(ctx.Lock.docs.size, 0);
  assert.equal(ctx.VideoTask.docs.size, 0);
  assert.equal(ctx.quota.credits[OWNER], 3);

  // With 5 credits the same chain passes and leaves 1 (QUOTA-007).
  const ok = setup({ quota: { credits: { [OWNER]: 5 } } });
  await submit(ok, { steps: [STEP, STEP, STEP, STEP] });
  assert.equal(ok.quota.credits[OWNER], 1);
});

test("users service error on reservation → 500 INTERNAL_ERROR, slot released, no task (V8)", async () => {
  const ctx = setup({ quota: { failReserve: true } });
  await rejects(submit(ctx), 500, "INTERNAL_ERROR");
  assert.equal(ctx.Lock.docs.size, 0);
  assert.equal(ctx.VideoTask.docs.size, 0);
});

test("broker down: still 202, task queued with published_at null for the routine (D-41)", async () => {
  const ctx = setup({ bus: { failPublish: true } });
  const { taskId, status } = await submit(ctx);
  assert.equal(status, "queued");
  assert.equal(ctx.VideoTask.docs.get(taskId).published_at, null);
});

test("validate: no task, no quota, no queues; output props of the result (ADD T-01, D-43)", async () => {
  const ctx = setup();
  const result = await ctx.tasks.validate({
    callerId: OWNER,
    inputVideos: [sourceVideo()],
    steps: [STEP, STEP],
  });
  assert.equal(result.valid, true);
  assert.equal(result.cost, 2);
  assert.equal(result.totalSteps, 2);
  // Rotation applied by the encoding, odd width cropped to even (T-02).
  assert.equal(result.output.width, 1080);
  assert.equal(result.output.height, 1920);
  assert.equal(result.output.rotation, 0);
  assert.equal(result.output.container, "mp4");
  assert.equal(ctx.VideoTask.docs.size, 0);
  assert.deepEqual(ctx.quota.reserves, []);
  assert.equal(ctx.bus.operations.length, 0);

  const invalid = await ctx.tasks.validate({
    callerId: OWNER,
    inputVideos: [sourceVideo()],
    steps: [{ operation: "nope", version: 1 }],
  });
  assert.equal(invalid.valid, false);
  assert.deepEqual(invalid.errors, [
    { index: 0, errors: [{ code: "INVALID_STEP_PARAMS", field: "operation" }] },
  ]);
});

// ---- query and cancellation ----------------------------------------------

test("GET: view with status, step, totalSteps and progress; other project → 404 (TASK-002/006/008)", async () => {
  const ctx = setup();
  const { taskId } = await submit(ctx);
  const view = await ctx.tasks.get({ projectId: PROJECT, taskId });
  assert.equal(view.status, "queued");
  assert.equal(view.step, 1);
  assert.equal(view.totalSteps, 1);
  assert.equal(view.progress, 0);
  await rejects(
    ctx.tasks.get({ projectId: "64b0000000000000000000bb", taskId }),
    404,
    "NOT_FOUND",
  );
  await rejects(
    ctx.tasks.get({ projectId: PROJECT, taskId: "x" }),
    404,
    "NOT_FOUND",
  );
});

test("cancel by someone else → 403; by the runner → cancelled, control message, refund, slot freed (TASK-004/005, QUOTA-004)", async () => {
  const ctx = setup();
  const { taskId } = await submit(ctx);

  await rejects(
    ctx.tasks.cancel({ projectId: PROJECT, taskId, callerId: GUEST }),
    403,
    "FORBIDDEN",
  );

  const view = await ctx.tasks.cancel({
    projectId: PROJECT,
    taskId,
    callerId: OWNER,
    correlationId: "c2",
  });
  assert.equal(view.status, "cancelled");
  assert.deepEqual(ctx.bus.control, [{ taskId, correlationId: "corr-1" }]);
  assert.deepEqual(ctx.quota.refunds, [[OWNER, 1]]);
  assert.equal(ctx.VideoTask.docs.get(taskId).refund.state, "done");
  assert.equal(ctx.Lock.docs.size, 0);
  assert.equal(ctx.bus.ws.at(-1).status, "cancelled");

  // Not active any more → 409 TASK_NOT_ACTIVE, no second refund (D-44).
  await rejects(
    ctx.tasks.cancel({ projectId: PROJECT, taskId, callerId: OWNER }),
    409,
    "TASK_NOT_ACTIVE",
  );
  assert.equal(ctx.quota.refunds.length, 1);
});

test("Premium cancellation: no refund call (QUOTA-005)", async () => {
  const ctx = setup();
  const { taskId } = await submit(ctx, { callerId: PREMIUM });
  await ctx.tasks.cancel({ projectId: PROJECT, taskId, callerId: PREMIUM });
  assert.deepEqual(ctx.quota.refunds, []);
  assert.equal(ctx.VideoTask.docs.get(taskId).refund.state, "none");
});

// ---- worker replies --------------------------------------------------------

test("started → processing, step 1, progress 0, event (TASK-002/003)", async () => {
  const ctx = setup();
  const { taskId } = await submit(ctx);
  await ctx.tasks.handleReply({
    operation: "task.run",
    taskId,
    status: "started",
  });
  const task = ctx.VideoTask.docs.get(taskId);
  assert.equal(task.status, "processing");
  assert.equal(ctx.bus.ws.at(-1).status, "processing");

  // Redelivery: processing → processing restarts at 0 (NFR-007).
  await ctx.VideoTask.updateOne({ _id: taskId }, { $set: { progress: 50 } });
  await ctx.tasks.handleReply({
    operation: "task.run",
    taskId,
    status: "started",
    metadata: { redelivered: true },
  });
  assert.equal(ctx.VideoTask.docs.get(taskId).progress, 0);
});

test("completed → result video with the task's _id, sources and recipe; slot freed; no confirmation call (COM-002/003, QUOTA-003, ADR-005)", async () => {
  const ctx = setup();
  await ctx.Video.create(sourceVideo());
  const { taskId } = await submit(ctx);
  await ctx.tasks.handleReply({
    operation: "task.run",
    taskId,
    status: "started",
  });
  await ctx.tasks.handleReply(completedReply(ctx, taskId));

  const task = ctx.VideoTask.docs.get(taskId);
  assert.equal(task.status, "completed");
  assert.equal(task.progress, 100);
  assert.equal(task.result_video_id, taskId);
  assert.equal(task.refund.state, "none");
  assert.deepEqual(ctx.quota.refunds, []);
  assert.equal(ctx.Lock.docs.size, 0);

  const video = ctx.Video.docs.get(taskId);
  assert.equal(ctx.Video.docs.size, 2);
  assert.equal(video.status, "completed");
  assert.equal(video.original_name, "férias.mov", "first source's name (D-35)");
  assert.equal(video.mime_type, "video/mp4");
  assert.equal(video.meta.container, "mp4");
  assert.equal(video.meta.display_width, 1080);
  assert.deepEqual(video.source_video_ids, [VIDEO]);
  assert.deepEqual(video.recipe, [STEP]);
  assert.equal(video.task_id, taskId);
  assert.equal(video.created_by, OWNER);
  assert.equal(
    video.storage.original_key,
    `${PROJECT}/video_out/${taskId}.mp4`,
  );

  const last = ctx.bus.ws.at(-1);
  assert.equal(last.status, "completed");
  assert.equal(last.resultVideoId, taskId);
  assert.equal(last.progress, 100);
});

test("completed delivered twice → one video, one event (ADR-005)", async () => {
  const ctx = setup();
  const { taskId } = await submit(ctx);
  const reply = completedReply(ctx, taskId);
  await ctx.tasks.handleReply(reply);
  const events = ctx.bus.ws.length;
  await ctx.tasks.handleReply(reply);
  assert.equal(ctx.Video.docs.size, 1);
  assert.equal(ctx.bus.ws.length, events);
});

test("crash between the transition and the video: the redelivered reply creates it (ADR-005)", async () => {
  const ctx = setup();
  const { taskId } = await submit(ctx);
  await ctx.VideoTask.updateOne(
    { _id: taskId },
    { $set: { status: "completed", result_video_id: taskId } },
  );
  await ctx.tasks.handleReply(completedReply(ctx, taskId));
  assert.equal(ctx.Video.docs.size, 1);
  assert.equal(ctx.Lock.docs.size, 0);
});

test("completed after cancellation → uploaded objects deleted, no video (TASK-005, NFR-007)", async () => {
  const ctx = setup();
  const { taskId } = await submit(ctx);
  await ctx.tasks.cancel({ projectId: PROJECT, taskId, callerId: OWNER });
  await ctx.tasks.handleReply(completedReply(ctx, taskId));
  assert.equal(ctx.Video.docs.size, 0);
  assert.ok(ctx.storage.removed.includes(`${PROJECT}/video_out/${taskId}.mp4`));
  assert.ok(
    ctx.storage.removed.includes(`${PROJECT}/video_thumb/${taskId}.thumb.jpg`),
  );
  assert.equal(ctx.VideoTask.docs.get(taskId).status, "cancelled");
});

test("completed with missing outputs → failed, refund, objects deleted", async () => {
  const ctx = setup();
  const { taskId } = await submit(ctx);
  const reply = completedReply(ctx, taskId);
  delete reply.output.keys.thumb;
  await ctx.tasks.handleReply(reply);
  assert.equal(ctx.VideoTask.docs.get(taskId).status, "failed");
  assert.equal(ctx.Video.docs.size, 0);
  assert.deepEqual(ctx.quota.refunds, [[OWNER, 1]]);
  assert.ok(ctx.storage.removed.includes(`${PROJECT}/video_out/${taskId}.mp4`));
});

test("failed → failed with category, refund once even if redelivered, slot freed (QUOTA-004, ERROR-001)", async () => {
  const ctx = setup();
  const { taskId } = await submit(ctx);
  const reply = {
    operation: "task.run",
    taskId,
    status: "failed",
    error: {
      code: "PROCESSING_ERROR",
      message: "Conversion failed! /tmp/video/x",
    },
  };
  await ctx.tasks.handleReply(reply);
  await ctx.tasks.handleReply(reply);

  const task = ctx.VideoTask.docs.get(taskId);
  assert.equal(task.status, "failed");
  assert.equal(task.error.code, "PROCESSING_ERROR");
  assert.ok(
    !task.error.message.includes("/tmp"),
    "technical cause stays in the logs (ERROR-002)",
  );
  assert.deepEqual(ctx.quota.refunds, [[OWNER, 1]]);
  assert.equal(ctx.Lock.docs.size, 0);
  assert.deepEqual(ctx.bus.ws.at(-1).error, { code: "PROCESSING_ERROR" });
});

test("missing original → failed RESOURCE_UNAVAILABLE", async () => {
  const ctx = setup();
  const { taskId } = await submit(ctx);
  await ctx.tasks.handleReply({
    operation: "task.run",
    taskId,
    status: "failed",
    error: { code: "RESOURCE_UNAVAILABLE" },
  });
  assert.equal(
    ctx.VideoTask.docs.get(taskId).error.code,
    "RESOURCE_UNAVAILABLE",
  );
});

test("dead-letter after two deliveries → failed PROCESSING_ERROR, refund, cancel published (NFR-007, AC7)", async () => {
  const ctx = setup();
  const { taskId } = await submit(ctx);
  const request = ctx.bus.operations[0];
  await ctx.tasks.handleReply(request, { "x-death": [{ count: 2 }] });
  const task = ctx.VideoTask.docs.get(taskId);
  assert.equal(task.status, "failed");
  assert.equal(task.error.code, "PROCESSING_ERROR");
  assert.deepEqual(ctx.quota.refunds, [[OWNER, 1]]);
  assert.equal(ctx.bus.control.at(-1).taskId, taskId);
  assert.equal(ctx.Video.docs.size, 0);
});

test("started of a cancelled task → cancellation published again (ADR-003)", async () => {
  const ctx = setup();
  const { taskId } = await submit(ctx);
  await ctx.tasks.cancel({ projectId: PROJECT, taskId, callerId: OWNER });
  await ctx.tasks.handleReply({
    operation: "task.run",
    taskId,
    status: "started",
  });
  assert.equal(ctx.bus.control.length, 2);
  assert.equal(ctx.VideoTask.docs.get(taskId).status, "cancelled");
});

test("refund failing stays pending and is settled later (D-45)", async () => {
  const ctx = setup();
  const { taskId } = await submit(ctx);
  ctx.quota.failRefund = true;
  await ctx.tasks.handleReply({
    operation: "task.run",
    taskId,
    status: "failed",
    error: { code: "PROCESSING_ERROR" },
  });
  assert.equal(ctx.VideoTask.docs.get(taskId).refund.state, "pending");

  ctx.quota.failRefund = false;
  await ctx.tasks.settleRefund({ _id: taskId });
  await ctx.tasks.settleRefund({ _id: taskId });
  assert.equal(ctx.VideoTask.docs.get(taskId).refund.state, "done");
  assert.deepEqual(ctx.quota.refunds, [[OWNER, 1]]);
});

test("unknown task in a reply → ignored", async () => {
  const ctx = setup();
  await ctx.tasks.handleReply({
    operation: "task.run",
    taskId: "64b0000000000000000000ff",
    status: "completed",
  });
  await ctx.tasks.handleReply({
    operation: "task.run",
    taskId: "bad",
    status: "completed",
  });
  assert.equal(ctx.Video.docs.size, 0);
});
