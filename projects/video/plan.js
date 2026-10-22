const formats = require("./formats");
const encoding = require("./encoding");
const display = require("./display");
const { parseKey } = require("./storage");
const { propsFromMeta } = require("./chain");

// Execution plan (ADD T-01, T-05): decided here, executed by the worker, which
// does not decide again. Per stream: copy when the source codec is the output
// codec of the matrix and no step changes the stream; otherwise encode.

const EVEN_CROP = (n) => n - (n % 2);

function outputContainer(steps, registry) {
  const last = steps[steps.length - 1];
  const op = registry.get(last.operation);
  return op.outputContainer?.(last.parameters || {}) || "mp4"; // working format (DQ-013)
}

function streamKept(steps, registry, inputProps, kind) {
  let props = inputProps;
  for (const step of steps) {
    const op = registry.get(step.operation);
    if (!op.copyable(props, step.parameters || {})[kind]) return false;
    props = op.estimate(props, step.parameters || {});
  }
  return true;
}

// Properties of the result: the estimate of the last step plus the effects of
// the encoding (rotation applied by autorotate, even dimensions, codecs).
function outputProps(finalProps, decisions) {
  const props = { ...finalProps, container: decisions.container };
  const out = formats.OUTPUT_CODECS[decisions.container];

  if (decisions.video.mode === "encode") {
    props.videoCodec = out.video;
    props.width = EVEN_CROP(finalProps.displayWidth);
    props.height = EVEN_CROP(finalProps.displayHeight);
    props.rotation = 0;
    props.displayWidth = props.width;
    props.displayHeight = props.height;
  }
  if (decisions.audio.mode === "none") props.audioCodec = null;
  else if (decisions.audio.mode === "encode") props.audioCodec = out.audio;
  props.sizeBytes = null; // known only after FFmpeg (RN3 of UC-VID-007)
  return props;
}

// Decisions that do not depend on the task id. inputs are video documents.
function decide(steps, inputs, finalProps, registry) {
  const source = inputs[0];
  const inputProps = propsFromMeta(source.meta);
  const container = outputContainer(steps, registry);
  const out = formats.OUTPUT_CODECS[container];

  const copyVideo =
    inputs.length === 1 &&
    inputProps.videoCodec === out.video &&
    streamKept(steps, registry, inputProps, "video");

  let audio;
  if (inputProps.audioCodec === null || finalProps.audioCodec === null) {
    audio = { mode: "none" };
  } else if (
    inputs.length === 1 &&
    inputProps.audioCodec === out.audio &&
    streamKept(steps, registry, inputProps, "audio")
  ) {
    audio = { mode: "copy" };
  } else {
    audio = { mode: "encode", ...encoding.audioEncoding(out.audio) };
  }

  const video = copyVideo
    ? { mode: "copy" }
    : { mode: "encode", ...encoding.videoEncoding(out.video), evenCrop: true };

  const decisions = {
    container,
    video,
    audio,
    faststart: encoding.faststart(container),
    // AVIs often lack complete timestamps when copied (ADD T-05).
    genpts: copyVideo && inputProps.container === "avi",
  };
  return { decisions, output: outputProps(finalProps, decisions) };
}

// Preview copy of the result (ADD T-06): an encoded result is H.264 yuv420p and
// plays as it is; a copied video stream may keep a profile the browser does not
// play, which only FFprobe on the result tells, so the worker gets the browser
// profile as data and the plan to apply when the result does not match it.
function previewOf(decisions, output) {
  if (decisions.container === "mp4" && decisions.video.mode === "encode")
    return null;

  const audio = output.audioCodec;
  const whenCompatible = formats.previewPlan(
    decisions.container,
    formats.BROWSER_PROFILE.videoCodec,
    audio,
    formats.BROWSER_PROFILE.pixFmt,
  );
  const whenIncompatible = formats.previewPlan(
    decisions.container,
    output.videoCodec,
    audio,
    null,
  );
  return {
    browserProfile: formats.BROWSER_PROFILE,
    whenCompatible,
    whenIncompatible,
  };
}

// Full plan sent in the task.run message and stored in the task (ADR-004).
// Result keys derive from the task id, which is also the result video id (ADR-005).
function buildPlan({ taskId, ownerId, projectId, steps, inputs, decided }) {
  const { decisions, output } = decided;
  const id = String(taskId);
  const target = (stage, name) => ({
    userId: String(ownerId),
    projectId: String(projectId),
    stage,
    name,
  });
  const extension = formats.CONTAINERS[decisions.container].extension;
  const preview = previewOf(decisions, output);

  const targets = {
    original: {
      ...target("video_out", `${id}${extension}`),
      contentType: formats.CONTAINERS[decisions.container].mimeType,
    },
    thumb: target("video_thumb", `${id}.thumb.jpg`),
    firstFrame: target("video_thumb", `${id}.frame0.jpg`),
  };
  if (preview) targets.preview = target("video_preview", `${id}.mp4`);

  return {
    inputs: inputs.map((video) => ({
      videoId: String(video._id),
      container: video.meta.container,
      source: parseKey(video.owner_id, video.storage.original_key),
    })),
    steps: steps.map((s) => ({
      operation: s.operation,
      version: s.version,
      parameters: s.parameters || {},
    })),
    output: decisions,
    expectedDurationMs: output.durationMs,
    thumbnail: {
      atMs: display.thumbnailAtMs(output.durationMs),
      maxWidth: display.THUMBNAIL_MAX_WIDTH,
    },
    firstFrameMaxWidth: display.FIRST_FRAME_MAX_WIDTH,
    preview,
    targets,
  };
}

module.exports = { decide, buildPlan, outputProps };
