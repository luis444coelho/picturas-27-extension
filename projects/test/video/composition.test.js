// Unit tests of B008 (UC-VID-013, UC-VID-014): structure of the chains (D-78,
// D-79, D-85), the concat operation (ADD 4.8), the validation in three phases
// (D-80, D-81, ADR-016), the plan extras (ADR-017), the preset structure
// (ADR-018), and N steps and error.phase in the B003 tasks (D-82, ADR-019).
//
//   cd projects && node --test test/video/composition.test.js
const test = require("node:test");
const assert = require("node:assert/strict");

const structure = require("../../video/chainStructure");
const concat = require("../../video/operations/concat");
const chain = require("../../video/chain");
const plans = require("../../video/plan");
const { registry } = require("../../video/operations");
const { createComposition } = require("../../video/composition");
const {
  applyCompositionPlanExtras,
} = require("../../video/planExtrasComposition");
const { createTasks } = require("../../video/tasks");
const { createLocks } = require("../../video/locks");
const { VideoError } = require("../../video/errors");
const { createStorage, createUsers, silentLog } = require("./fakes");
const {
  createCollection,
  createTaskBus,
  createFakeQuota,
} = require("./task-fakes");

const OWNER = "64b000000000000000000001";
const PROJECT = "64b0000000000000000000aa";
const A = "64b0000000000000000000c1";
const B = "64b0000000000000000000c2";
const C = "64b0000000000000000000c3";
const MIN = 60_000;

const step = (operation, parameters = {}) => ({
  operation,
  version: 1,
  parameters,
});
const clip = (videoId, steps = []) => ({ videoId, steps });
const concatOf = (...clips) => step("concat", { clips });

function video(id, meta = {}, extra = {}) {
  return {
    _id: id,
    project_id: PROJECT,
    owner_id: OWNER,
    original_name: `${id}.mp4`,
    status: "completed",
    storage: { original_key: `${PROJECT}/video_src/${id}.mp4` },
    meta: {
      container: "mp4",
      video_codec: "h264",
      audio_codec: "aac",
      width: 1280,
      height: 720,
      rotation: 0,
      display_width: 1280,
      display_height: 720,
      fps_num: 30,
      fps_den: 1,
      duration_ms: 20_000,
      size_bytes: 1_000_000,
      ...meta,
    },
    ...extra,
  };
}

// A: odd 1281×721 at 30 fps without audio; B: vertical 1080×1920 at 25 fps
// with audio; C: rotated (display 720×1280) with audio.
const VIDEOS = {
  [A]: video(A, {
    audio_codec: null,
    width: 1281,
    height: 721,
    display_width: 1281,
    display_height: 721,
  }),
  [B]: video(B, {
    width: 1080,
    height: 1920,
    display_width: 1080,
    display_height: 1920,
    fps_num: 25,
    duration_ms: 35_000,
  }),
  [C]: video(C, {
    rotation: 90,
    display_width: 720,
    display_height: 1280,
    duration_ms: 10_000,
  }),
};

function fakeVideoModel(videos = VIDEOS) {
  return {
    find: (query) => ({
      lean: async () =>
        query._id.$in.map((id) => videos[String(id)]).filter(Boolean),
    }),
  };
}

function setup(videos = VIDEOS) {
  const resolved = [];
  const watermarks = {
    resolve: async (project, parameters, options) => {
      resolved.push({ parameters, options });
      return {
        watermarkId: "64b0000000000000000000ee",
        width: 100,
        height: 40,
      };
    },
  };
  return {
    resolved,
    comp: createComposition({
      Video: fakeVideoModel(videos),
      registry,
      watermarks,
    }),
  };
}

const project = { _id: PROJECT, user_id: OWNER };
const run = (comp, steps, profile = "free") =>
  comp.validateConcat({ project, callerId: OWNER, profile, steps });

async function rejects(promise, status, code, details) {
  await assert.rejects(promise, (err) => {
    assert.ok(err instanceof VideoError, err.message);
    assert.equal(err.status, status);
    assert.equal(err.code, code);
    if (details) assert.deepEqual(err.details, details);
    return true;
  });
}

// ---- phase 1: structure (D-78, D-79, D-85) --------------------------------

test("INVALID_CHAIN rules of D-79 with their addresses", () => {
  const check = (steps, options) => structure.checkStructure(steps, options);
  assert.deepEqual(check([]), {
    code: "INVALID_CHAIN",
    details: { rule: "empty_chain" },
  });
  assert.deepEqual(check(undefined).details.rule, "empty_chain");
  assert.deepEqual(
    check([step("trim"), step("convert"), step("speed")]).details,
    {
      rule: "convert_not_last",
      index: 1,
    },
  );
  assert.deepEqual(check([concatOf(clip(A), clip(B)), concatOf()]).details, {
    rule: "multiple_concat",
    index: 1,
  });
  assert.deepEqual(check([concatOf(clip(A, [concatOf()]), clip(B))]).details, {
    rule: "multiple_concat",
    index: 0,
    clipIndex: 0,
    stepIndex: 0,
  });
  assert.deepEqual(check([step("trim"), concatOf(clip(A), clip(B))]).details, {
    rule: "concat_not_first",
    index: 1,
  });
  assert.deepEqual(
    check([concatOf(clip(A), clip(B, [step("speed"), step("convert")]))])
      .details,
    { rule: "convert_not_last", index: 0, clipIndex: 1, stepIndex: 1 },
  );
  assert.deepEqual(check([step("trim"), step("extract_frames")]).details, {
    rule: "frame_extraction",
    index: 1,
  });
  assert.deepEqual(
    check([concatOf(clip(A, [step("extract_frames")]), clip(B))]).details,
    { rule: "frame_extraction", index: 0, clipIndex: 0, stepIndex: 0 },
  );
  // D-85: a preset with a concat.
  assert.deepEqual(check([concatOf(clip(A), clip(B))], { preset: true }), {
    code: "INVALID_CHAIN",
    details: { rule: "concat_in_preset", index: 0 },
  });
  // A valid chain, a valid composition and a final convert.
  assert.equal(check([step("trim"), step("adjust"), step("convert")]), null);
  assert.equal(
    check([concatOf(clip(A, [step("trim")]), clip(B)), step("watermark")]),
    null,
  );
});

test("CHAIN_TOO_LONG with 11 steps counting sub-chains, concat and final steps (NFR-023, CHAIN-008)", () => {
  assert.equal(structure.checkStructure(Array(10).fill(step("trim"))), null);
  assert.deepEqual(structure.checkStructure(Array(11).fill(step("trim"))), {
    code: "CHAIN_TOO_LONG",
    details: { total: 11, limit: 10 },
  });
  // 3 + 4 in the clips + concat + 3 final steps = 11.
  const composed = [
    concatOf(
      clip(A, [step("trim"), step("speed"), step("filter")]),
      clip(B, [step("trim"), step("speed"), step("filter"), step("adjust")]),
    ),
    step("watermark"),
    step("adjust"),
    step("orient"),
  ];
  assert.equal(structure.countSteps(composed), 11);
  assert.equal(structure.checkStructure(composed).code, "CHAIN_TOO_LONG");
  // CHAIN-009 example: (V1 + filter) + (V2 + remove audio) + (V3 + speed) → concat + watermark = 5.
  assert.equal(
    structure.countSteps([
      concatOf(
        clip(A, [step("filter")]),
        clip(B, [step("remove_audio")]),
        clip(C, [step("speed")]),
      ),
      step("watermark"),
    ]),
    5,
  );
});

// ---- concat operation (ADD 4.8) -------------------------------------------

test("concat: INSUFFICIENT_INPUTS, TOO_MANY_INPUTS 10/50 counting repetitions, cost 1 + clip steps", () => {
  assert.deepEqual(concat.checkClips({ clips: [clip(A)] }, "free"), {
    code: "INSUFFICIENT_INPUTS",
    min: 2,
  });
  assert.equal(
    concat.checkClips({ clips: Array(10).fill(clip(A)) }, "free"),
    null,
  );
  assert.deepEqual(
    concat.checkClips({ clips: Array(11).fill(clip(A)) }, "free"),
    {
      code: "TOO_MANY_INPUTS",
      limit: 10,
    },
  );
  assert.equal(
    concat.checkClips({ clips: Array(50).fill(clip(A)) }, "premium"),
    null,
  );
  assert.equal(
    concat.checkClips({ clips: Array(51).fill(clip(A)) }, "premium").code,
    "TOO_MANY_INPUTS",
  );
  assert.equal(
    concat.checkClips({ clips: [clip(A), { videoId: B }] }, "free").code,
    "INVALID_REQUEST",
  );
  // A concat without the server _clips is refused (ADR-016).
  assert.deepEqual(concat.validate({ clips: [clip(A), clip(B)] }, {}, "free"), [
    { code: "INVALID_REQUEST", field: "clips" },
  ]);
  const steps = [concatOf(clip(A, [step("trim"), step("speed")]), clip(B))];
  assert.equal(chain.chainCost(steps, registry), 3);
  assert.equal(concat.copyable().video, false);
});

// ---- phases 2 and 3 with a concat (D-80, D-81) ----------------------------

test("concat estimate: first clip at the output of its sub-chain, odd dimensions, audio of any clip, sum of durations (CONCAT-004/008/012)", async () => {
  const { comp } = setup();
  const result = await run(comp, [
    concatOf(clip(A, [step("speed", { factor: 2 })]), clip(B), clip(A)),
  ]);
  assert.equal(result.valid, true, JSON.stringify(result));
  assert.equal(result.cost, 2);
  assert.equal(result.totalSteps, 2);
  assert.deepEqual(
    [
      result.output.width,
      result.output.height,
      result.output.fpsNum,
      result.output.fpsDen,
    ],
    [1280, 720, 30, 1],
  );
  assert.equal(result.output.durationMs, 10_000 + 35_000 + 20_000);
  // Only the second clip has audio: the result has audio (RN6).
  assert.equal(result.output.audioCodec, "aac");
});

test("concat: rotated first clip uses display dimensions; a resize in its sub-chain sets the result (Q-ADD-13, CONCAT-012)", async () => {
  const { comp } = setup();
  const rotated = await run(comp, [concatOf(clip(C), clip(B))]);
  assert.deepEqual([rotated.output.width, rotated.output.height], [720, 1280]);
  const resized = await run(comp, [
    concatOf(clip(B, [step("resize", { width: 480, height: 854 })]), clip(C)),
  ]);
  assert.equal(resized.valid, true, JSON.stringify(resized));
  assert.deepEqual([resized.output.width, resized.output.height], [480, 854]);
  assert.equal(resized.output.fpsNum, 25);
});

test("no clip with audio → result without audio (RN7)", async () => {
  const { comp } = setup();
  const result = await run(comp, [concatOf(clip(A), clip(A))]);
  assert.equal(result.output.audioCodec, null);
});

test("clip errors carry videoId and the first clipIndex where the video appears (D-80)", async () => {
  const missing = "64b0000000000000000000ff";
  await rejects(
    run(setup().comp, [concatOf(clip(B), clip(missing), clip(missing))]),
    404,
    "NOT_FOUND",
    { videoId: missing, clipIndex: 1 },
  );
  const notReady = { ...VIDEOS, [B]: { ...VIDEOS[B], status: "processing" } };
  await rejects(
    run(setup(notReady).comp, [concatOf(clip(A), clip(B))]),
    409,
    "RESOURCE_NOT_READY",
    { videoId: B, clipIndex: 1 },
  );
  const webm = { ...VIDEOS, [B]: video(B, { container: "webm" }) };
  await rejects(
    run(setup(webm).comp, [concatOf(clip(A), clip(B))]),
    422,
    "UNSUPPORTED_FORMAT",
    { videoId: B, clipIndex: 1 },
  );
  const long = { ...VIDEOS, [B]: video(B, { duration_ms: 6 * MIN }) };
  await rejects(
    run(setup(long).comp, [concatOf(clip(A), clip(B))]),
    422,
    "LIMIT_EXCEEDED",
  );
});

test("a step error inside a clip has {index: 0, clipIndex, stepIndex} (D-80)", async () => {
  const result = await run(setup().comp, [
    concatOf(
      clip(A),
      clip(B, [
        step("trim", { startMs: 0, endMs: 1000 }),
        step("speed", { factor: 9 }),
      ]),
    ),
  ]);
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    {
      index: 0,
      clipIndex: 1,
      stepIndex: 1,
      errors: [
        {
          code: "SPEED_FACTOR_OUT_OF_RANGE",
          field: "factor",
          min: 0.25,
          max: 4,
        },
      ],
    },
  ]);
});

test("LIMIT_EXCEEDED of the concat sum counting repetitions, of a clip output, and of the result (D-81, CONCAT-007)", async () => {
  const { comp } = setup();
  // 35 s × 9 = 315 s > 5 min on the sum.
  await rejects(
    run(comp, [concatOf(...Array(9).fill(clip(B)))]),
    422,
    "LIMIT_EXCEEDED",
    {
      total: 315_000,
      limit: 5 * MIN,
    },
  );
  // Premium: 60 min; one clip slowed to 0.25× (35 s → 140 s) is fine.
  assert.equal(
    (
      await run(
        comp,
        [concatOf(clip(B, [step("speed", { factor: 0.25 })]), clip(A))],
        "premium",
      )
    ).valid,
    true,
  );
  // Three clips slowed to 0.25× (140 s each): 420 s on the sum. The clip
  // outputs are below 5 min, so the sum of the concat is what fails.
  await rejects(
    run(comp, [
      concatOf(...Array(3).fill(clip(B, [step("speed", { factor: 0.25 })]))),
    ]),
    422,
    "LIMIT_EXCEEDED",
    { total: 420_000, limit: 5 * MIN },
  );
  // Final step above the limit: 90 s at 0.25× = 360 s (phase 3, result).
  await rejects(
    run(comp, [
      concatOf(clip(B), clip(B), clip(A)),
      step("speed", { factor: 0.25 }),
    ]),
    422,
    "LIMIT_EXCEEDED",
    { total: 360_000, limit: 5 * MIN },
  );
});

test("intermediate outputs are not limited (D-81): a clip slowed down then trimmed is accepted", async () => {
  const long = { ...VIDEOS, [B]: video(B, { duration_ms: 4 * MIN }) };
  const result = await run(setup(long).comp, [
    concatOf(
      clip(B, [
        step("speed", { factor: 0.5 }),
        step("trim", { startMs: 0, endMs: MIN }),
      ]),
      clip(A),
    ),
  ]);
  assert.equal(result.valid, true, JSON.stringify(result));
});

test("_clips is written by the server over the client's; watermarks in clips and final steps get the server _mark (ADR-010/016, V13)", async () => {
  const { comp, resolved } = setup();
  const mark = {
    type: "text",
    text: "B008",
    position: { preset: "center" },
    scale: 0.1,
    opacity: 0.5,
    _mark: { width: 1, height: 1 },
  };
  const steps = [
    concatOf(clip(A, [step("watermark", { ...mark })]), clip(B)),
    step("watermark", { ...mark }),
  ];
  steps[0].parameters._clips = [
    { output: { durationMs: 1 } },
    { output: { durationMs: 1 } },
  ];
  const result = await run(comp, steps);
  assert.equal(result.valid, true, JSON.stringify(result));
  assert.equal(steps[0].parameters._clips[0].output.durationMs, 20_000);
  assert.equal(resolved.length, 2);
  assert.ok(resolved.every((r) => r.options.store === false));
  assert.deepEqual(
    steps[0].parameters.clips[0].steps[0].parameters._mark.width,
    100,
  );
});

test("submitConcat passes one input per occurrence to the B003 acceptance (CONCAT-001, V1)", async () => {
  const calls = [];
  const tasks = {
    submit: async (args) => (
      calls.push(args),
      { taskId: "t", status: "queued" }
    ),
  };
  const { comp } = setup();
  const answer = await comp.submitConcat({
    tasks,
    project,
    callerId: OWNER,
    profile: "free",
    steps: [concatOf(clip(A), clip(B), clip(A))],
    correlationId: "corr",
  });
  assert.deepEqual(answer, { taskId: "t", status: "queued" });
  assert.deepEqual(
    calls[0].inputVideos.map((v) => v._id),
    [A, B, A],
  );
});

// ---- chains without concat: phase order (D-80, checkpoint of stage 2) -----

test("without concat: invalid parameters that would also exceed the limit go to B003 (INVALID_STEP_PARAMS), not LIMIT_EXCEEDED", async () => {
  const { comp } = setup();
  const long = video(B, { duration_ms: 4 * MIN });
  // factor 0.1 is out of range and would also give 40 min: phase 2 fails first.
  assert.equal(
    await comp.precheckChain({
      video: long,
      profile: "free",
      steps: [step("speed", { factor: 0.1 })],
    }),
    null,
  );
  // The same request in the B003 acceptance answers INVALID_STEP_PARAMS.
  const ctx = tasksSetup();
  await rejects(
    ctx.tasks.submit({
      project,
      callerId: OWNER,
      inputVideos: [long],
      steps: [step("speed", { factor: 0.1 })],
      correlationId: "c",
    }),
    422,
    "INVALID_STEP_PARAMS",
  );
  // Valid parameters above the limit: LIMIT_EXCEEDED {total, limit}.
  const limit = await comp.precheckChain({
    video: long,
    profile: "free",
    steps: [step("speed", { factor: 0.5 })],
  });
  assert.equal(limit.code, "LIMIT_EXCEEDED");
  assert.deepEqual(limit.details, { total: 8 * MIN, limit: 5 * MIN });
  assert.equal(
    await comp.precheckChain({
      video: long,
      profile: "premium",
      steps: [step("speed", { factor: 0.5 })],
    }),
    null,
  );
  // Structure first: convert not last.
  const broken = await comp.precheckChain({
    video: long,
    profile: "free",
    steps: [step("convert", { target: "mov" }), step("trim")],
  });
  assert.deepEqual(
    [broken.code, broken.details.rule],
    ["INVALID_CHAIN", "convert_not_last"],
  );
  // Unknown video: B003 answers.
  assert.equal(
    await comp.precheckChain({
      video: null,
      profile: "free",
      steps: [step("speed", { factor: 2 })],
    }),
    null,
  );
});

// ---- presets (ADR-018, D-83, D-85) ----------------------------------------

test("preset structure: concat_in_preset, unknown operation or version, server fields removed", () => {
  const { comp } = setup();
  assert.throws(
    () => comp.presetStructure([concatOf(clip(A), clip(B))]),
    (err) =>
      err.code === "INVALID_CHAIN" &&
      err.details.rule === "concat_in_preset" &&
      err.details.index === 0,
  );
  assert.throws(
    () =>
      comp.presetStructure([
        step("trim"),
        { operation: "blur", version: 1, parameters: {} },
      ]),
    (err) =>
      err.code === "INVALID_STEP_PARAMS" &&
      err.details.index === 1 &&
      err.details.errors[0].field === "operation",
  );
  assert.throws(
    () =>
      comp.presetStructure([{ operation: "trim", version: 9, parameters: {} }]),
    (err) =>
      err.code === "INVALID_STEP_PARAMS" &&
      err.details.errors[0].field === "version",
  );
  assert.throws(
    () => comp.presetStructure(Array(11).fill(step("trim"))),
    (err) => err.code === "CHAIN_TOO_LONG",
  );
  assert.deepEqual(
    comp.presetStructure([
      step("watermark", {
        type: "image",
        watermarkId: "x",
        _mark: { width: 1 },
      }),
      step("speed", { factor: 2, _input: { fpsNum: 1 } }),
    ]),
    [
      step("watermark", { type: "image", watermarkId: "x" }),
      step("speed", { factor: 2 }),
    ],
  );
});

// ---- plan extras (ADR-017, V3, V4, V14) ------------------------------------

async function planFor(steps, videos = VIDEOS) {
  const { comp } = setup(videos);
  const evaluated = await comp.evaluateConcat({
    project,
    callerId: OWNER,
    profile: "free",
    steps,
    store: false,
  });
  assert.equal(evaluated.stepError, null);
  const decided = plans.decide(
    steps,
    evaluated.inputVideos,
    evaluated.finalProps,
    registry,
  );
  const plan = plans.buildPlan({
    taskId: "64b0000000000000000000dd",
    ownerId: OWNER,
    projectId: PROJECT,
    steps,
    inputs: evaluated.inputVideos,
    decided,
  });
  applyCompositionPlanExtras(
    plan,
    steps,
    chain.propsFromMeta(evaluated.inputVideos[0].meta),
    registry,
  );
  return plan;
}

test("composition plan: distinct files, occurrences, target, audio of the second clip, step input fps and filter entry in a clip", async () => {
  const plan = await planFor([
    concatOf(
      clip(A, [
        step("speed", { factor: 2 }),
        step("filter", { filter: "sepia" }),
      ]),
      clip(B),
      clip(A),
    ),
  ]);
  assert.deepEqual(
    plan.inputs.map((i) => i.videoId),
    [A, B],
  );
  assert.deepEqual(
    plan.composition.clips.map((c) => c.file),
    [0, 1, 0],
  );
  assert.deepEqual(plan.composition.target, {
    width: 1280,
    height: 720,
    fpsNum: 30,
    fpsDen: 1,
  });
  assert.equal(plan.composition.audio, "concat");
  assert.equal(plan.output.audio.mode, "encode");
  assert.equal(plan.output.video.mode, "encode");
  assert.equal(plan.expectedDurationMs, 10_000 + 35_000 + 20_000);
  const [speed, filter] = plan.composition.clips[0].steps;
  assert.deepEqual(speed.input, { fpsNum: 30, fpsDen: 1 });
  assert.equal(filter.filter.id, "sepia");
  assert.deepEqual(
    plan.composition.clips.map((c) => c.output.hasAudio),
    [false, true, false],
  );
  assert.equal(plan.keyframeCopy, undefined);
});

test("composition plan: a final remove_audio leaves no audio; an AVI final convert asks for the preview in the same invocation", async () => {
  const silent = await planFor([
    concatOf(clip(A), clip(B)),
    step("remove_audio"),
  ]);
  assert.equal(silent.output.audio.mode, "none");
  assert.equal(silent.composition.audio, "none");
  const avi = await planFor([
    concatOf(clip(A), clip(B)),
    step("convert", { target: "avi" }),
  ]);
  assert.equal(avi.output.container, "avi");
  assert.deepEqual(avi.convert, { previewInSameInvocation: true });
  assert.ok(avi.targets.preview);
});

test("chains without concat: AVI final convert gets previewInSameInvocation, MOV does not (V5)", () => {
  const base = VIDEOS[B];
  for (const [target, flag] of [
    ["avi", true],
    ["mov", undefined],
  ]) {
    const steps = [
      step("adjust", {
        brightness: 1.2,
        contrastFactor: 1,
        saturationFactor: 1,
      }),
      step("convert", { target }),
    ];
    const props = chain.propsFromMeta(base.meta);
    const checked = chain.validateChain(steps, props, "free", registry);
    assert.equal(checked.error, null, JSON.stringify(checked.error));
    const decided = plans.decide(steps, [base], checked.props, registry);
    const plan = plans.buildPlan({
      taskId: "64b0000000000000000000de",
      ownerId: OWNER,
      projectId: PROJECT,
      steps,
      inputs: [base],
      decided,
    });
    applyCompositionPlanExtras(plan, steps, props, registry);
    assert.equal(plan.composition, undefined);
    assert.equal(plan.convert?.previewInSameInvocation, flag);
  }
});

// ---- B003 tasks: N steps and error.phase (V1, V6, D-82) --------------------

function tasksSetup() {
  const VideoTask = createCollection();
  const Video = createCollection();
  const Lock = createCollection({ unique: ["project_id"] });
  const bus = createTaskBus();
  const tasks = createTasks({
    VideoTask,
    Video,
    locks: createLocks({ Lock }),
    quota: createFakeQuota(),
    bus,
    users: createUsers({ [OWNER]: "free" }),
    storage: createStorage(),
    registry,
    log: silentLog,
  });
  return { VideoTask, Video, bus, tasks };
}

test("a concat task has totalSteps = cost = N, kind concat and source ids with repetitions (C2, CHAIN-012)", async () => {
  const { comp } = setup();
  const ctx = tasksSetup();
  const steps = [
    concatOf(clip(A, [step("speed", { factor: 2 })]), clip(B), clip(A)),
    step("adjust", { brightness: 1.2, contrastFactor: 1, saturationFactor: 1 }),
  ];
  const { taskId } = await comp.submitConcat({
    tasks: ctx.tasks,
    project,
    callerId: OWNER,
    profile: "free",
    steps,
    correlationId: "c",
  });
  const task = ctx.VideoTask.docs.get(taskId);
  assert.deepEqual(
    [task.kind, task.cost, task.total_steps, task.reserved_credits],
    ["concat", 3, 3, 3],
  );
  assert.deepEqual(task.input_video_ids, [A, B, A]);
  assert.deepEqual(
    task.plan.inputs.map((i) => i.videoId),
    [A, B],
  );
  assert.equal(ctx.bus.operations.at(-1).totalSteps, 3);
  assert.equal(chain.stepFromProgress(50, 3), 2);
});

test("a failed reply with phase stores error.phase, the GET shows it and the event carries it; without phase nothing changes (D-82, ADR-019)", async () => {
  const ctx = tasksSetup();
  const submitted = async () =>
    (
      await ctx.tasks.submit({
        project,
        callerId: OWNER,
        inputVideos: [VIDEOS[B]],
        steps: [step("speed", { factor: 2 })],
        correlationId: "c",
      })
    ).taskId;
  for (const phase of ["download", "encode", "upload"]) {
    const taskId = await submitted();
    await ctx.tasks.handleReply({
      operation: "task.run",
      taskId,
      status: "failed",
      error: { code: "PROCESSING_ERROR", message: "x", phase },
    });
    const stored = ctx.VideoTask.docs.get(taskId);
    assert.deepEqual(stored.error, {
      code: "PROCESSING_ERROR",
      message: stored.error.message,
      phase,
    });
    const view = await ctx.tasks.get({ projectId: PROJECT, taskId });
    assert.equal(view.error.phase, phase);
    assert.deepEqual(ctx.bus.ws.at(-1).error, {
      code: "PROCESSING_ERROR",
      phase,
    });
    assert.equal(stored.refund.state, "done");
  }
  const taskId = await submitted();
  await ctx.tasks.handleReply({
    operation: "task.run",
    taskId,
    status: "failed",
    error: { code: "PROCESSING_ERROR", message: "x" },
  });
  assert.equal(ctx.VideoTask.docs.get(taskId).error.phase, undefined);
  assert.deepEqual(ctx.bus.ws.at(-1).error, { code: "PROCESSING_ERROR" });
  assert.equal(
    (await ctx.tasks.get({ projectId: PROJECT, taskId })).error.phase,
    undefined,
  );
});
