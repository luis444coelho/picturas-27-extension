const formats = require("./formats");
const encoding = require("./encoding");

// ADR-007/008 and D-54: add data to the B003 plan, preserving its decisions.
function applyPlanExtras(plan, steps, inputProps, registry) {
  let props = inputProps;
  const effects = steps.map((step, index) => {
    const op = registry.get(step.operation);
    plan.steps[index].input = { fpsNum: props.fpsNum, fpsDen: props.fpsDen };
    const copyable = op.copyable(props, step.parameters || {});
    props = op.estimate(props, step.parameters || {});
    return copyable;
  });
  const trims = steps.flatMap((step, index) =>
    step.operation === "trim" ? [index] : [],
  );
  if (
    trims.length !== 1 ||
    inputProps.videoCodec !== formats.OUTPUT_CODECS.mp4.video
  )
    return plan;
  const dropStep = trims[0];
  if (!effects.every((effect, index) => index === dropStep || effect.video))
    return plan;

  const { startMs: atMs, endMs } = steps[dropStep].parameters;
  const audioCodec = formats.OUTPUT_CODECS.mp4.audio;
  const audio =
    plan.output.audio.mode === "none"
      ? { mode: "none" }
      : inputProps.audioCodec === audioCodec &&
          effects.every((effect, index) => index === dropStep || effect.audio)
        ? { mode: "copy" }
        : { mode: "encode", ...encoding.audioEncoding(audioCodec) };
  const previewAudio = audio.mode === "none" ? null : audioCodec;
  const preview = {
    browserProfile: formats.BROWSER_PROFILE,
    whenCompatible: formats.previewPlan(
      "mp4",
      inputProps.videoCodec,
      previewAudio,
      formats.BROWSER_PROFILE.pixFmt,
    ),
    whenIncompatible: formats.previewPlan(
      "mp4",
      inputProps.videoCodec,
      previewAudio,
      null,
    ),
  };
  plan.keyframeCopy = {
    atMs,
    endMs,
    video: { mode: "copy", genpts: inputProps.container === "avi" },
    audio,
    preview,
    dropStep,
  };
  if (
    !plan.targets.preview &&
    (preview.whenCompatible || preview.whenIncompatible)
  ) {
    const original = plan.targets.original;
    plan.targets.preview = {
      userId: original.userId,
      projectId: original.projectId,
      stage: "video_preview",
      name: original.name.replace(/\.[^.]+$/, ".mp4"),
    };
  }
  return plan;
}

module.exports = { applyPlanExtras };
