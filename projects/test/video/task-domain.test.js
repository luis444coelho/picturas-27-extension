// Unit tests of the domain modules of B003: chain (T-01, D-40), plan (T-01,
// T-05, T-06), quota (T-04, V8), locks (T-03) and the operation registry (D-37).
//
//   cd projects && node --test test/video/task-domain.test.js
const test = require("node:test");
const assert = require("node:assert/strict");

const chain = require("../../video/chain");
const plans = require("../../video/plan");
const { createQuota, EXHAUSTED_BODY } = require("../../video/quota");
const { createLocks } = require("../../video/locks");
const { createRegistry } = require("../../video/operations");
const testReencode = require("../../video/operations/test_reencode");
const { createCollection } = require("./task-fakes");

const meta = (overrides = {}) => ({
  container: "mp4",
  video_codec: "h264",
  audio_codec: "aac",
  width: 1920,
  height: 1080,
  rotation: 0,
  display_width: 1920,
  display_height: 1080,
  fps_num: 25,
  fps_den: 1,
  duration_ms: 10_000,
  size_bytes: 1000,
  ...overrides,
});
const video = (m = {}, extra = {}) => ({
  _id: "64b0000000000000000000c1",
  owner_id: "64b000000000000000000001",
  storage: { original_key: "64b0000000000000000000aa/video_src/x.mp4" },
  meta: meta(m),
  ...extra,
});
const STEP = { operation: "test_reencode", version: 1, parameters: {} };

// A copyable operation, like "remove audio" will be (B004): keeps the video.
const keepsVideo = {
  name: "keeps_video",
  versions: [1],
  cost: () => 1,
  validate: () => [],
  estimate: (p) => ({ ...p, audioCodec: null }),
  copyable: () => ({ video: true, audio: false }),
};
const registry = createRegistry([testReencode, keepsVideo]);

// ---- registry ---------------------------------------------------------------

test("test_reencode only exists with VIDEO_TEST_OPERATIONS=1 (D-37)", () => {
  const { execFileSync } = require("child_process");
  const names = (env) =>
    execFileSync(
      process.execPath,
      [
        "-e",
        "console.log(require('./video/operations').registry.names().join(','))",
      ],
      { cwd: `${__dirname}/../..`, env: { PATH: process.env.PATH, ...env } },
    )
      .toString()
      .trim();
  assert.equal(names({}), "");
  assert.equal(names({ VIDEO_TEST_OPERATIONS: "1" }), "test_reencode");
});

// ---- chain --------------------------------------------------------------------

test("propsFromMeta maps the stored meta to camelCase properties", () => {
  const props = chain.propsFromMeta(meta({ audio_codec: null }));
  assert.equal(props.videoCodec, "h264");
  assert.equal(props.audioCodec, null);
  assert.equal(props.displayWidth, 1920);
  assert.equal(props.durationMs, 10_000);
});

test("kind and cost: single, chain, concat; 1 credit per step (QUOTA-008)", () => {
  assert.equal(chain.taskKind([STEP]), "single");
  assert.equal(chain.taskKind([STEP, STEP]), "chain");
  assert.equal(chain.taskKind([{ operation: "concat" }]), "concat");
  assert.equal(chain.chainCost([STEP, STEP, STEP], registry), 3);
});

test("cost of an operation may count inner steps (concat, ADD T-01)", () => {
  const concat = {
    name: "concat",
    versions: [1],
    cost: (params, costOf) =>
      1 + params.clips.reduce((n, c) => n + costOf(c.steps), 0),
  };
  const reg = createRegistry([testReencode, concat]);
  const steps = [
    {
      operation: "concat",
      version: 1,
      parameters: { clips: [{ steps: [STEP] }, { steps: [STEP, STEP] }] },
    },
  ];
  assert.equal(chain.chainCost(steps, reg), 4);
});

test("validateChain feeds each step with the previous estimate and stops at the first error", () => {
  const seen = [];
  const spy = {
    name: "spy",
    versions: [1],
    validate: (params, props) => {
      seen.push(props.audioCodec);
      return params.bad ? [{ code: "INVALID_STEP_PARAMS", field: "bad" }] : [];
    },
    estimate: (p) => ({ ...p, audioCodec: null }),
  };
  const reg = createRegistry([spy]);
  const props = chain.propsFromMeta(meta());
  const steps = [
    { operation: "spy", version: 1, parameters: {} },
    { operation: "spy", version: 1, parameters: {} },
    { operation: "spy", version: 1, parameters: { bad: 1 } },
    { operation: "spy", version: 1, parameters: {} },
  ];
  const result = chain.validateChain(steps, props, "free", reg);
  assert.deepEqual(seen, ["aac", null, null]);
  assert.deepEqual(result.error, {
    index: 2,
    errors: [{ code: "INVALID_STEP_PARAMS", field: "bad" }],
  });
});

test("step from progress: 4 steps at 0/24/25/60/99/100 % (D-40, TASK-008)", () => {
  const steps = [0, 24, 25, 60, 99, 100].map((p) =>
    chain.stepFromProgress(p, 4),
  );
  assert.deepEqual(steps, [1, 1, 2, 3, 4, 4]);
  assert.equal(chain.stepFromProgress(50, 1), 1);
});

// ---- plan -----------------------------------------------------------------------

function decide(steps, m = {}, extra = {}) {
  const inputs = [video(m, extra)];
  const props = chain.validateChain(
    steps,
    chain.propsFromMeta(inputs[0].meta),
    "free",
    registry,
  ).props;
  return plans.decide(steps, inputs, props, registry);
}

test("encode: rotation applied and odd dimensions cropped to even in the estimate (T-02, Q-ADD-25)", () => {
  const { decisions, output } = decide([STEP], {
    width: 1921,
    height: 1081,
    rotation: 90,
    display_width: 1081,
    display_height: 1921,
  });
  assert.equal(decisions.video.mode, "encode");
  assert.equal(decisions.video.evenCrop, true);
  assert.deepEqual(
    [output.width, output.height, output.rotation],
    [1080, 1920, 0],
  );
  assert.equal(output.videoCodec, "h264");
  assert.equal(output.sizeBytes, null);
});

test("audio: none without audio, encode when a step changes it (T-05)", () => {
  assert.equal(
    decide([STEP], { audio_codec: null }).decisions.audio.mode,
    "none",
  );
  assert.equal(decide([STEP]).decisions.audio.mode, "encode");
  assert.equal(
    decide([STEP], { audio_codec: "mp3", container: "avi" }).decisions.audio
      .codec,
    "aac",
  );
});

test("copy only when the source codec is the output codec and no step changes the stream (T-05)", () => {
  assert.equal(
    decide([{ ...STEP, operation: "keeps_video" }]).decisions.video.mode,
    "copy",
  );
  // MPEG-4 Part 2 in AVI → MP4 needs H.264: encode.
  assert.equal(
    decide([{ ...STEP, operation: "keeps_video" }], {
      container: "avi",
      video_codec: "mpeg4",
    }).decisions.video.mode,
    "encode",
  );
  // Any step that changes the video forces the encoding (NFR-013: once per chain).
  assert.equal(
    decide([{ ...STEP, operation: "keeps_video" }, STEP]).decisions.video.mode,
    "encode",
  );
});

test("genpts only for a copied AVI video (T-05)", () => {
  const avi = { container: "avi", video_codec: "h264", audio_codec: "mp3" };
  assert.equal(
    decide([{ ...STEP, operation: "keeps_video" }], avi).decisions.genpts,
    true,
  );
  assert.equal(decide([STEP], avi).decisions.genpts, false);
});

test("buildPlan: targets keyed by the task id in the owner's bucket; preview only when the video is copied (ADR-005, T-06)", () => {
  const steps = [STEP];
  const inputs = [video()];
  const decided = decide(steps);
  const plan = plans.buildPlan({
    taskId: "64b000000000000000000001",
    ownerId: "64b000000000000000000001",
    projectId: "64b0000000000000000000aa",
    steps,
    inputs,
    decided,
  });
  assert.equal(plan.targets.original.stage, "video_out");
  assert.equal(plan.targets.original.contentType, "video/mp4");
  assert.equal(plan.targets.thumb.name.endsWith(".thumb.jpg"), true);
  assert.equal(plan.targets.preview, undefined);
  assert.equal(plan.preview, null);
  assert.deepEqual(plan.inputs[0].source, {
    userId: "64b000000000000000000001",
    projectId: "64b0000000000000000000aa",
    stage: "video_src",
    name: "x.mp4",
  });
  assert.deepEqual(plan.thumbnail, { atMs: 1000, maxWidth: 320 });
  assert.equal(plan.firstFrameMaxWidth, 1280);

  const copied = plans.buildPlan({
    taskId: "64b000000000000000000002",
    ownerId: "64b000000000000000000001",
    projectId: "64b0000000000000000000aa",
    steps: [{ ...STEP, operation: "keeps_video" }],
    inputs,
    decided: decide([{ ...STEP, operation: "keeps_video" }]),
  });
  assert.deepEqual(copied.preview.browserProfile, {
    videoCodec: "h264",
    pixFmt: "yuv420p",
  });
  assert.equal(copied.preview.whenCompatible, null);
  assert.equal(copied.preview.whenIncompatible.video, "libx264");
  assert.equal(copied.targets.preview.stage, "video_preview");
});

// ---- quota (V8) -----------------------------------------------------------------

function fakeHttp(answers) {
  const calls = [];
  return {
    calls,
    async get(url) {
      calls.push(["GET", url]);
      return answers.shift();
    },
    async post(url) {
      calls.push(["POST", url]);
      return answers.shift();
    },
  };
}

test("reserve: 200 → true; 701 with the exhausted body → false; 701 internal error → throws (V8)", async () => {
  const http = fakeHttp([
    { status: 200, data: true },
    { status: 701, data: EXHAUSTED_BODY },
    { status: 701, data: "Error acquiring user's information." },
    { status: 404, data: "Error acquiring user's information." },
  ]);
  const quota = createQuota({ http, usersUrl: "https://users:10001/" });
  assert.equal(await quota.reserve("u1", 3), true);
  assert.equal(await quota.reserve("u1", 3), false);
  await assert.rejects(quota.reserve("u1", 3), /701/);
  await assert.rejects(quota.reserve("u1", 3), /404/);
  assert.deepEqual(http.calls[0], ["GET", "https://users:10001/u1/process/3"]);
});

test("refund and remaining use the existing endpoints (T-04)", async () => {
  const http = fakeHttp([
    { status: 200, data: true },
    { status: 200, data: { remaining_operations: 2 } },
    { status: 701, data: "x" },
  ]);
  const quota = createQuota({ http, usersUrl: "https://users:10001/" });
  await quota.refund("u1", 4);
  assert.equal(await quota.remaining("u1"), 2);
  await assert.rejects(quota.refund("u1", 1), /701/);
  assert.deepEqual(http.calls.slice(0, 2), [
    ["POST", "https://users:10001/u1/process/refund/4"],
    ["GET", "https://users:10001/u1"],
  ]);
});

test("reservations of the same runner run one at a time; other runners do not wait (T-04)", async () => {
  let running = 0;
  let maxRunning = 0;
  const order = [];
  const http = {
    async get(url) {
      running += 1;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((r) => setTimeout(r, 20));
      order.push(url);
      running -= 1;
      return { status: 200, data: true };
    },
  };
  const quota = createQuota({ http, usersUrl: "" });
  await Promise.all([
    quota.reserve("a", 1),
    quota.reserve("a", 2),
    quota.reserve("a", 3),
  ]);
  assert.equal(maxRunning, 1);
  assert.deepEqual(order, ["a/process/1", "a/process/2", "a/process/3"]);

  maxRunning = 0;
  await Promise.all([quota.reserve("a", 1), quota.reserve("b", 1)]);
  assert.equal(maxRunning, 2);
});

test("a failed reservation does not block the next one of the same runner", async () => {
  const http = fakeHttp([
    { status: 500, data: "" },
    { status: 200, data: true },
  ]);
  const quota = createQuota({ http, usersUrl: "" });
  const [first, second] = await Promise.allSettled([
    quota.reserve("a", 1),
    quota.reserve("a", 1),
  ]);
  assert.equal(first.status, "rejected");
  assert.equal(second.value, true);
});

// ---- locks ------------------------------------------------------------------------

test("slot: one per project; release only by its holder (NFR-021, T-03)", async () => {
  const Lock = createCollection({ unique: ["project_id"] });
  const locks = createLocks({ Lock });
  assert.equal(await locks.acquire("p1", "t1"), true);
  assert.equal(await locks.acquire("p1", "t2"), false);
  assert.equal(await locks.acquire("p2", "t3"), true);
  assert.equal(String(await locks.holderOf("p1")), "t1");

  await locks.release("p1", "t2");
  assert.equal(String(await locks.holderOf("p1")), "t1");
  await locks.release("p1", "t1");
  assert.equal(await locks.holderOf("p1"), null);
  assert.equal(await locks.acquire("p1", "t4"), true);
});
