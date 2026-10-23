const limits = require("../compositionLimits");
const formats = require("../formats");

// Concat (ADD 4.8, T-01, ADR-016): one step whose clips carry their own
// sub-chains. The properties of each clip at the output of its sub-chain are
// written by the server in parameters._clips, over anything the client sent,
// because validate/estimate only receive the parameters (ADR-010 pattern).
const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const even = (n) => n - (n % 2);

// Shape and minimum of the clips (CONCAT-005; no maximum, D-86), without
// the clip properties: used before the videos are read.
function checkClips(parameters) {
  const clips = parameters?.clips;
  if (!Array.isArray(clips)) return { code: "INVALID_REQUEST", field: "clips" };
  const bad = clips.findIndex(
    (clip) =>
      !isPlainObject(clip) ||
      typeof clip.videoId !== "string" ||
      !Array.isArray(clip.steps),
  );
  if (bad !== -1)
    return { code: "INVALID_REQUEST", field: "clips", clipIndex: bad };
  if (clips.length < limits.MIN_CLIPS)
    return { code: "INSUFFICIENT_INPUTS", min: limits.MIN_CLIPS };
  return null;
}

function known(parameters) {
  const clips = parameters._clips;
  return Array.isArray(clips) &&
    clips.length === parameters.clips?.length &&
    clips.every((clip) => isPlainObject(clip?.output))
    ? clips
    : null;
}

module.exports = {
  name: "concat",
  versions: [1],
  checkClips,
  // The concat counts 1, plus the steps inside every clip (DQ-014, CHAIN-009).
  cost: (parameters, inner) =>
    1 +
    (parameters.clips || []).reduce(
      (total, clip) => total + inner(clip.steps || []),
      0,
    ),

  validate(parameters, inputProps, profile) {
    const shape = checkClips(parameters, profile);
    if (shape) return [shape];
    const clips = known(parameters);
    if (!clips) return [{ code: "INVALID_REQUEST", field: "clips" }];
    // Total duration counting every occurrence (CONCAT-007, NFR-024, D-81).
    const total = clips.reduce((sum, clip) => sum + clip.output.durationMs, 0);
    const limit = limits.maxDurationMs(profile);
    if (limit !== null && total > limit)
      return [{ code: "LIMIT_EXCEEDED", total, limit }];
    return [];
  },

  // Sum of the durations; resolution and fps of the first clip at the output
  // of its sub-chain, in display dimensions, rounded down to even (CONCAT-004,
  // CONCAT-008, CONCAT-012, Q-ADD-13, Q-ADD-25); audio if any clip has audio
  // (UC-VID-013 RN6, RN7).
  estimate(inputProps, parameters) {
    const clips = known(parameters) || [];
    const first = clips[0]?.output || inputProps;
    const width = even(first.displayWidth);
    const height = even(first.displayHeight);
    const codecs = formats.OUTPUT_CODECS.mp4;
    return {
      ...first,
      container: "mp4",
      videoCodec: codecs.video,
      audioCodec: clips.some((clip) => clip.output.audioCodec !== null)
        ? codecs.audio
        : null,
      width,
      height,
      displayWidth: width,
      displayHeight: height,
      rotation: 0,
      fpsNum: first.fpsNum,
      fpsDen: first.fpsDen,
      durationMs: clips.reduce((sum, clip) => sum + clip.output.durationMs, 0),
      sizeBytes: null,
    };
  },

  copyable: () => ({ video: false, audio: false }),
};
