const test = require("node:test");
const assert = require("node:assert/strict");
const { registry } = require("../../video/operations");
const chain = require("../../video/chain");
const plans = require("../../video/plan");
const { applyConvertPlanExtras, annotateConvertValidation, throwConvertStepError } = require("../../video/convertPlanExtras");

const source = (container, videoCodec, audioCodec, width = 320, height = 240) => ({
  _id: "64b0000000000000000000c1",
  owner_id: "64b000000000000000000001",
  project_id: "64b0000000000000000000aa",
  storage: { original_key: "64b0000000000000000000aa/video_src/64b0000000000000000000c1.mp4" },
  meta: { container, video_codec: videoCodec, audio_codec: audioCodec, width, height,
    display_width: width, display_height: height, rotation: 0, fps_num: 25,
    fps_den: 1, duration_ms: 2000, size_bytes: 1000 },
});
const step = (target) => [{ operation: "convert", version: 1, parameters: { target } }];
function decide(input, target) {
  const steps = step(target);
  const final = registry.get("convert").estimate(chain.propsFromMeta(input.meta), { target });
  return plans.decide(steps, [input], final, registry);
}

test("CONVERT-004 rejects same or unsupported target", () => {
  const op = registry.get("convert");
  const props = chain.propsFromMeta(source("mp4", "h264", "aac").meta);
  assert.deepEqual(op.validate({ target: "mp4" }, props).map((x) => x.code), ["SAME_FORMAT"]);
  for (const params of [{ target: "webm" }, { target: "mov", codec: "h265" }, {}])
    assert.deepEqual(op.validate(params, props).map((x) => x.code), ["UNSUPPORTED_TARGET_FORMAT"]);
  class VideoError extends Error {
    constructor(status, code) { super(code); this.status = status; this.code = code; }
  }
  for (const code of ["SAME_FORMAT", "UNSUPPORTED_TARGET_FORMAT"])
    assert.throws(() => throwConvertStepError(step("mp4"), { errors: [{ code }] }, VideoError),
      (error) => error.status === 422 && error.code === code);
  assert.equal(op.cost(), 1);
});

test("T-05 matrix and AVI quality: six paths, stream modes, +genpts", () => {
  for (const [input, target, modes, codecs, genpts] of [
    [source("mp4", "h264", "aac"), "mov", ["copy", "copy"], ["h264", "aac"], false],
    [source("mp4", "h264", "aac"), "avi", ["encode", "encode"], ["mpeg4", "mp3"], false],
    [source("mov", "h264", "aac"), "mp4", ["copy", "copy"], ["h264", "aac"], false],
    [source("mov", "h264", "aac"), "avi", ["encode", "encode"], ["mpeg4", "mp3"], false],
    [source("avi", "h264", "mp3"), "mp4", ["copy", "encode"], ["h264", "aac"], true],
    [source("avi", "h264", "mp3"), "mov", ["copy", "encode"], ["h264", "aac"], true],
  ]) {
    const d = decide(input, target);
    assert.deepEqual([d.decisions.video.mode, d.decisions.audio.mode], modes);
    assert.deepEqual([d.output.videoCodec, d.output.audioCodec], codecs);
    assert.equal(d.decisions.genpts, genpts);
    if (target === "avi") {
      assert.equal(d.decisions.video.quality, 3);
      assert.equal(d.decisions.audio.bitrate, "192k");
    }
    annotateConvertValidation(d, step(target));
    assert.deepEqual([d.output.videoMode, d.output.audioMode], modes);
    const p = plans.buildPlan({ taskId: "64b0000000000000000000d1", ownerId: input.owner_id,
      projectId: input.project_id, steps: step(target), inputs: [input], decided: d });
    applyConvertPlanExtras(p, step(target));
    assert.equal(p.convert.previewInSameInvocation, target === "avi");
    if (target === "avi") assert.ok(p.targets.preview);
  }
});

test("CONVERT-007 odd dimensions crop only on recoding; silent has no audio", () => {
  const odd = source("mp4", "h264", "aac", 321, 241);
  assert.deepEqual([decide(odd, "mov").output.width, decide(odd, "mov").output.height], [321, 241]);
  assert.deepEqual([decide(odd, "avi").output.width, decide(odd, "avi").output.height], [320, 240]);
  assert.equal(decide(source("mp4", "h264", null), "avi").decisions.audio.mode, "none");
});

test("D-72 annotates only conversion validation; B004/B005 outputs retain keys", () => {
  const decided = { output: { container: "mp4" }, decisions: { video: { mode: "encode" }, audio: { mode: "copy" } } };
  for (const operation of ["trim", "adjust", "filter", "resize", "orient", "watermark"])
    annotateConvertValidation(decided, [{ operation, version: 1, parameters: {} }]);
  assert.deepEqual(decided.output, { container: "mp4" });
  annotateConvertValidation(decided, step("mov"));
  assert.deepEqual(decided.output, { container: "mp4", videoMode: "encode", audioMode: "copy" });
});
