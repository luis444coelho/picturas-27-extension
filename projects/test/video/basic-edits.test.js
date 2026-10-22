// B004 domain and application contracts, persisted and reproducible:
// NODE_PATH=<dependencies> node --test test/video/basic-edits.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const { registry } = require("../../video/operations");
const chain = require("../../video/chain");
const plans = require("../../video/plan");
const { applyPlanExtras } = require("../../video/planExtras");
const { createTasks } = require("../../video/tasks");
const { createLocks } = require("../../video/locks");
const {
  createCollection,
  createTaskBus,
  createFakeQuota,
} = require("./task-fakes");
const { createStorage, createUsers, silentLog } = require("./fakes");
const OWNER = "64b000000000000000000001",
  PROJECT = "64b0000000000000000000aa",
  VIDEO = "64b0000000000000000000c1";
const source = () => ({
  _id: VIDEO,
  owner_id: OWNER,
  project_id: PROJECT,
  original_name: "source.mp4",
  status: "completed",
  meta: {
    container: "mp4",
    video_codec: "h264",
    audio_codec: "aac",
    width: 321,
    height: 241,
    display_width: 321,
    display_height: 241,
    rotation: 0,
    fps_num: 30000,
    fps_den: 1001,
    duration_ms: 10000,
    size_bytes: 1000,
  },
  storage: { original_key: `${PROJECT}/video_src/${VIDEO}.mp4` },
});
const step = (operation, parameters = {}) => ({
  operation,
  version: 1,
  parameters,
});
const props = () => chain.propsFromMeta(source().meta);
function build(s, overrides = {}) {
  const input = source();
  Object.assign(input.meta, overrides);
  const p = chain.propsFromMeta(input.meta);
  const checked = chain.validateChain([s], p, "free", registry);
  assert.equal(checked.error, null);
  const decided = plans.decide([s], [input], checked.props, registry);
  const plan = plans.buildPlan({
    taskId: "task",
    ownerId: OWNER,
    projectId: PROJECT,
    steps: [s],
    inputs: [input],
    decided,
  });
  const original = structuredClone(plan);
  applyPlanExtras(plan, [s], p, registry);
  assert.deepEqual(plan.output, original.output);
  assert.deepEqual(plan.preview, original.preview);
  for (const [key, value] of Object.entries(original.targets))
    assert.deepEqual(plan.targets[key], value);
  return plan;
}
for (const [parameters, code, details] of [
  [{}, "INVALID_INTERVAL", { field: "startMs" }],
  [{ startMs: 0, endMs: 2.5 }, "INVALID_INTERVAL", { field: "endMs" }],
  [
    { startMs: -1, endMs: 100 },
    "OUT_OF_BOUNDS",
    { field: "startMs", durationMs: 10000 },
  ],
  [
    { startMs: 0, endMs: 10001 },
    "OUT_OF_BOUNDS",
    { field: "endMs", durationMs: 10000 },
  ],
  [{ startMs: 500, endMs: 500 }, "INVALID_INTERVAL", { field: "endMs" }],
  [
    { startMs: 0, endMs: 33 },
    "INVALID_INTERVAL",
    { field: "endMs", minDurationMs: 34 },
  ],
])
  test(`trim validates ${JSON.stringify(parameters)}`, () =>
    assert.deepEqual(registry.get("trim").validate(parameters, props()), [
      { code, ...details },
    ]));
for (const [factor, code] of [
  [undefined, "INVALID_SPEED_FACTOR"],
  [null, "INVALID_SPEED_FACTOR"],
  ["2", "INVALID_SPEED_FACTOR"],
  [NaN, "INVALID_SPEED_FACTOR"],
  [Infinity, "INVALID_SPEED_FACTOR"],
  [0, "INVALID_SPEED_FACTOR"],
  [-1, "INVALID_SPEED_FACTOR"],
  [0.249, "SPEED_FACTOR_OUT_OF_RANGE"],
  [4.001, "SPEED_FACTOR_OUT_OF_RANGE"],
  [1, "NO_CHANGES"],
])
  test(`speed rejects ${String(factor)}`, () =>
    assert.equal(registry.get("speed").validate({ factor })[0].code, code));
for (const factor of [0.25, 0.5, 0.75, 1.25, 1.5, 2, 4])
  test(`speed accepts ${factor}`, () => {
    assert.deepEqual(registry.get("speed").validate({ factor }), []);
    const plan = build(
      step("speed", { factor, _input: { fpsNum: 999, fpsDen: 1 } }),
    );
    assert.deepEqual(plan.steps[0].input, { fpsNum: 30000, fpsDen: 1001 });
    assert.equal(plan.expectedDurationMs, Math.round(10000 / factor));
    assert.equal(plan.output.video.codec, "libx264");
    assert.equal(plan.output.video.preset, "veryfast");
    assert.equal(plan.output.video.crf, 23);
    assert.equal(plan.output.audio.bitrate, "128k");
  });
test("D-54: keyframe plan, deterministic preview destination and preserved decisions", () => {
  const plan = build(step("trim", { startMs: 0, endMs: 4000 }));
  assert.deepEqual(plan.keyframeCopy.video, { mode: "copy", genpts: false });
  assert.deepEqual(plan.keyframeCopy.audio, { mode: "copy" });
  assert.deepEqual(plan.targets.preview, {
    userId: OWNER,
    projectId: PROJECT,
    stage: "video_preview",
    name: "task.mp4",
  });
  assert.equal(plan.keyframeCopy.preview.whenCompatible, null);
  assert.equal(plan.keyframeCopy.preview.whenIncompatible.video, "libx264");
  const old = structuredClone(plan.targets.preview);
  applyPlanExtras(plan, plan.steps, props(), registry);
  assert.deepEqual(plan.targets.preview, old);
});
for (const [audio, expected] of [
  ["aac", "copy"],
  ["mp3", "encode"],
  [null, "none"],
])
  test(`keyframe audio ${audio}`, () => {
    const plan = build(step("trim", { startMs: 1000, endMs: 4000 }), {
      container: "avi",
      audio_codec: audio,
    });
    assert.equal(plan.keyframeCopy.audio.mode, expected);
    assert.equal(plan.keyframeCopy.video.genpts, true);
  });
test("mpeg4 has no conditional video copy; odd dimensions do not exclude H264 copy", () => {
  assert.equal(
    build(step("trim", { startMs: 0, endMs: 4000 }), {
      container: "avi",
      video_codec: "mpeg4",
    }).keyframeCopy,
    undefined,
  );
  assert.ok(build(step("trim", { startMs: 0, endMs: 4000 })).keyframeCopy);
});
test("remove_audio estimates and copy eligibility", () => {
  const op = registry.get("remove_audio");
  assert.deepEqual(op.validate({}, { ...props(), audioCodec: null }), [
    { code: "NO_AUDIO_STREAM" },
  ]);
  assert.equal(op.estimate(props()).width, 321);
  assert.equal(op.estimate({ ...props(), videoCodec: "mpeg4" }).width, 320);
  assert.deepEqual(build(step("remove_audio")).output.video, { mode: "copy" });
  assert.deepEqual(build(step("remove_audio")).output.audio, { mode: "none" });
});
function setup() {
  const VideoTask = createCollection(),
    Video = createCollection(),
    Lock = createCollection({ unique: ["project_id"] }),
    bus = createTaskBus(),
    quota = createFakeQuota(),
    storage = createStorage();
  const tasks = createTasks({
    VideoTask,
    Video,
    locks: createLocks({ Lock }),
    quota,
    bus,
    users: createUsers({ [OWNER]: "free" }),
    storage,
    registry,
    log: silentLog,
  });
  const submit = (s) =>
    tasks.submit({
      project: { _id: PROJECT, user_id: OWNER },
      callerId: OWNER,
      inputVideos: [source()],
      steps: [s],
      correlationId: "b004-test",
    });
  return { VideoTask, Video, Lock, bus, quota, storage, tasks, submit };
}
test("invalid inputs create no task, quota reservation or publication", async () => {
  const ctx = setup();
  for (const s of [
    step("trim", { startMs: 0, endMs: 1 }),
    step("speed", { factor: 1 }),
    step("speed", { factor: 0 }),
  ])
    await assert.rejects(ctx.submit(s), {
      status: 422,
      code: "INVALID_STEP_PARAMS",
    });
  assert.equal(ctx.VideoTask.all().length, 0);
  assert.equal(ctx.quota.reserves.length, 0);
  assert.equal(ctx.bus.operations.length, 0);
});
test("plan complete before publish, server fps overrides client; republish unchanged", async () => {
  const ctx = setup();
  const recipe = step("trim", { startMs: 0, endMs: 4000 });
  recipe.input = { fpsNum: 999, fpsDen: 1 };
  const { taskId } = await ctx.submit(recipe);
  const stored = ctx.VideoTask.docs.get(taskId);
  assert.ok(stored.plan.targets.preview);
  assert.deepEqual(stored.plan.steps[0].input, { fpsNum: 30000, fpsDen: 1001 });
  assert.deepEqual(ctx.bus.operations[0].plan, stored.plan);
  const original = structuredClone(stored.plan);
  await ctx.tasks.publish(stored);
  assert.deepEqual(ctx.bus.operations[1].plan, original);
});
test("failure and cancellation refund once; late result deletes persisted preview even if omitted in reply", async () => {
  for (const status of ["failed", "cancelled"]) {
    const ctx = setup(),
      { taskId } = await ctx.submit(step("trim", { startMs: 0, endMs: 4000 }));
    if (status === "cancelled")
      await ctx.tasks.cancel({ projectId: PROJECT, taskId, callerId: OWNER });
    else {
      await ctx.tasks.handleReply({
        taskId,
        status: "failed",
        error: { code: "PROCESSING_ERROR" },
      });
      await ctx.tasks.handleReply({
        taskId,
        status: "failed",
        error: { code: "PROCESSING_ERROR" },
      });
    }
    assert.equal(ctx.quota.refunds.length, 1);
    await ctx.tasks.handleReply({
      taskId,
      status: "completed",
      output: { keys: {} },
    });
    assert.ok(
      ctx.storage.removed.includes(`${PROJECT}/video_preview/${taskId}.mp4`),
    );
    assert.equal(ctx.Video.all().length, 0);
  }
});
