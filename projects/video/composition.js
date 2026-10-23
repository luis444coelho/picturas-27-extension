const mongoose = require("mongoose");

const formats = require("./formats");
const encoding = require("./encoding");
const profiles = require("./profiles");
const chain = require("./chain");
const plans = require("./plan");
const limits = require("./compositionLimits");
const structure = require("./chainStructure");
const { VideoError } = require("./errors");

// Chains and concats (ADD 4.8, 4.9, ADR-016): validation in three phases,
// structure → steps → limits (D-80), the server-written _clips of the concat,
// and the acceptance of chains with a concat, which use the routes without
// :video (D-78). The acceptance itself is the one of B003 (tasks.submit).
const CONCAT_CODES = [
  "INVALID_REQUEST",
  "INSUFFICIENT_INPUTS",
  "TOO_MANY_INPUTS",
  "LIMIT_EXCEEDED",
];

const isConcatChain = (steps) =>
  Array.isArray(steps) && steps[0]?.operation === "concat";

const hasConcat = (steps) =>
  Array.isArray(steps) && steps.some((step) => step?.operation === "concat");

// Structure errors are 422 with their own code (INVALID_CHAIN, CHAIN_TOO_LONG).
function fail(found) {
  return new VideoError(422, found.code, found.details);
}

// The watermark steps of a chain: in every clip and, on the routes without
// :video, also on the top level (the B005 middleware only sees the top level
// of the routes with :video, V13).
function watermarkSteps(steps, { topLevel }) {
  const out = [];
  steps.forEach((step, index) => {
    if (topLevel && step?.operation === "watermark") out.push(step);
    if (index === 0 && step?.operation === "concat")
      structure
        .clipsOf(step)
        .forEach((clip) =>
          structure
            .clipSteps(clip)
            .forEach(
              (inner) => inner?.operation === "watermark" && out.push(inner),
            ),
        );
  });
  return out.filter(
    (step) =>
      step.parameters !== null &&
      typeof step.parameters === "object" &&
      !Array.isArray(step.parameters),
  );
}

function createComposition({ Video, registry, watermarks }) {
  // _mark of the server over anything the client sent (ADR-010, D-84).
  async function resolveMarks(project, callerId, steps, { store, topLevel }) {
    for (const step of watermarkSteps(steps, { topLevel })) {
      delete step.parameters._mark;
      const mark = await watermarks.resolve(project, step.parameters, {
        store,
        callerId,
      });
      if (mark) step.parameters._mark = mark;
    }
  }

  // Steps 4 and 5 of the acceptance for every clip, reported on the first
  // occurrence of the video (ADD 4.8, D-80).
  async function loadClips(project, clips, profile) {
    const ids = [...new Set(clips.map((clip) => clip.videoId))];
    const valid = ids.filter((id) => mongoose.isValidObjectId(id));
    const found = await Video.find({
      _id: { $in: valid },
      project_id: project._id,
    }).lean();
    const byId = new Map(found.map((video) => [String(video._id), video]));
    const profileLimits = profiles.limitsFor(profile);

    return clips.map((clip, clipIndex) => {
      const at = { videoId: clip.videoId, clipIndex };
      const video = byId.get(clip.videoId);
      if (!video) throw new VideoError(404, "NOT_FOUND", at);
      if (video.status !== "completed")
        throw new VideoError(409, "RESOURCE_NOT_READY", at);
      const meta = video.meta || {};
      if (!formats.CONTAINERS[meta.container])
        throw new VideoError(422, "UNSUPPORTED_FORMAT", at);
      const codecError = formats.validateStreams(
        meta.container,
        meta.video_codec,
        meta.audio_codec ?? null,
      );
      if (codecError)
        throw new VideoError(422, codecError.code, {
          ...codecError.details,
          ...at,
        });
      const limitError =
        profiles.checkSize(meta.size_bytes, profileLimits) ||
        profiles.checkDuration(meta.duration_ms, profileLimits);
      if (limitError)
        throw new VideoError(422, limitError.code, {
          ...limitError.details,
          ...at,
        });
      return video;
    });
  }

  // Phases 1 to 3 of a chain whose first step is a concat. Returns
  // {stepError} for errors of a step (200 on validate, 422 on acceptance),
  // throws VideoError for everything else.
  async function evaluateConcat({ project, callerId, profile, steps, store }) {
    // Phase 1: structure.
    const broken = structure.checkStructure(steps);
    if (broken) throw fail(broken);
    const parameters = steps[0].parameters || {};
    const shape = registry.get("concat").checkClips(parameters, profile);
    if (shape) {
      const { code, ...details } = shape;
      throw new VideoError(422, code, details);
    }

    const clips = parameters.clips;
    const videos = await loadClips(project, clips, profile);
    await resolveMarks(project, callerId, steps, { store, topLevel: true });

    // Phase 2: steps; every sub-chain from the properties of its clip, then
    // the concat and the final steps (CHAIN-003, CHAIN-005, CHAIN-006).
    const known = [];
    for (const [clipIndex, clip] of clips.entries()) {
      const input = chain.propsFromMeta(videos[clipIndex].meta);
      const checked = chain.validateChain(clip.steps, input, profile, registry);
      if (checked.error)
        return {
          stepError: {
            index: 0,
            clipIndex,
            stepIndex: checked.error.index,
            errors: checked.error.errors,
          },
        };
      known.push({ videoId: clip.videoId, input, output: checked.props });
    }
    parameters._clips = known;
    steps[0].parameters = parameters;

    const first = chain.propsFromMeta(videos[0].meta);
    const checked = chain.validateChain(steps, first, profile, registry);
    if (checked.error) {
      const own = checked.error.errors[0];
      // Errors of the concat itself keep their own code (CONCAT-005 to 007).
      if (checked.error.index === 0 && CONCAT_CODES.includes(own?.code)) {
        const { code, ...details } = own;
        throw new VideoError(422, code, details);
      }
      return { stepError: checked.error };
    }

    // Phase 3: limits of every clip and of the result (D-81).
    const limit = limits.maxDurationMs(profile);
    if (limit !== null) {
      const long = known.findIndex((clip) => clip.output.durationMs > limit);
      if (long !== -1)
        throw new VideoError(422, "LIMIT_EXCEEDED", {
          total: known[long].output.durationMs,
          limit,
          clipIndex: long,
        });
      if (checked.props.durationMs > limit)
        throw new VideoError(422, "LIMIT_EXCEEDED", {
          total: checked.props.durationMs,
          limit,
        });
    }

    const cost = chain.chainCost(steps, registry);
    return {
      stepError: null,
      inputVideos: videos,
      finalProps: checked.props,
      cost,
      totalSteps: cost,
    };
  }

  // Output properties shown by the editor (CONCAT-004, CONCAT-012): the plan
  // decisions of B003, with the audio of any clip, not only of the first (V3).
  function concatOutput(steps, inputVideos, finalProps) {
    const { decisions, output } = plans.decide(
      steps,
      inputVideos,
      finalProps,
      registry,
    );
    if (finalProps.audioCodec !== null && decisions.audio.mode === "none") {
      const codec = formats.OUTPUT_CODECS[decisions.container].audio;
      return plans.outputProps(finalProps, {
        ...decisions,
        audio: { mode: "encode", ...encoding.audioEncoding(codec) },
      });
    }
    return output;
  }

  async function validateConcat({ project, callerId, profile, steps }) {
    const result = await evaluateConcat({
      project,
      callerId,
      profile,
      steps,
      store: false,
    });
    if (result.stepError)
      return {
        valid: false,
        cost: null,
        totalSteps: structure.countSteps(steps),
        output: null,
        errors: [result.stepError],
      };
    return {
      valid: true,
      cost: result.cost,
      totalSteps: result.totalSteps,
      output: concatOutput(steps, result.inputVideos, result.finalProps),
      errors: [],
    };
  }

  // POST …/videos/operations without :video: the acceptance of B003 with one
  // input per clip occurrence, so source_video_ids keeps the order and the
  // repetitions (CONCAT-001, V1).
  async function submitConcat({
    tasks,
    project,
    callerId,
    profile,
    steps,
    correlationId,
  }) {
    const result = await evaluateConcat({
      project,
      callerId,
      profile,
      steps,
      store: true,
    });
    if (result.stepError)
      throw new VideoError(422, "INVALID_STEP_PARAMS", result.stepError);
    return tasks.submit({
      project,
      callerId,
      inputVideos: result.inputVideos,
      steps,
      correlationId,
    });
  }

  // Phases 1 to 3 of a chain without concat, in memory, before the B003
  // router (ADR-016, checkpoint of stage 2): returns the error to answer, or
  // null to pass the request on. When phase 2 fails, B003 answers with its own
  // INVALID_STEP_PARAMS.
  async function precheckChain({ video, profile, steps }) {
    const broken = structure.checkStructure(steps);
    if (broken) return fail(broken);
    if (!video || video.status !== "completed" || !video.meta) return null;

    const input = chain.propsFromMeta(video.meta);
    const checked = chain.validateChain(steps, input, profile, registry);
    if (checked.error) return null;

    const limit = limits.maxDurationMs(profile);
    if (limit !== null && checked.props.durationMs > limit)
      return new VideoError(422, "LIMIT_EXCEEDED", {
        total: checked.props.durationMs,
        limit,
      });
    return null;
  }

  // Internal structure check of the presets (ADR-018, D-83, D-85).
  function presetStructure(steps) {
    const broken =
      structure.checkStructure(steps, { preset: true }) ||
      structure.checkKnown(steps, registry);
    if (broken) throw fail(broken);
    return structure.withoutServerFields(steps);
  }

  return {
    isConcatChain,
    hasConcat,
    evaluateConcat,
    validateConcat,
    submitConcat,
    precheckChain,
    presetStructure,
  };
}

module.exports = { createComposition, isConcatChain, hasConcat };
