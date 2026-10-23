const formats = require("./formats");
const encoding = require("./encoding");
const { applyVisualPlanExtras } = require("./planExtrasVisual");

// ADR-008/011/017 pattern: data of the concat and of the chains that end in an
// AVI conversion, added after the B003 plan and the B004/B005/B007 extras,
// before the task is persisted. The worker decides nothing.
const even = (n) => n - (n % 2);

// Plan steps of a sub-chain with the data the worker needs for each step:
// input fps of every step (speed, D-52; computed for the top level by
// planExtras.js) and the filter/watermark extras (planExtrasVisual.js),
// applied to a partial plan without changing those modules (V4, V14).
function clipPlanSteps(clip, input, original, registry) {
  const steps = clip.steps.map((step) => ({
    operation: step.operation,
    version: step.version,
    parameters: step.parameters || {},
  }));
  let props = input;
  steps.forEach((step) => {
    step.input = { fpsNum: props.fpsNum, fpsDen: props.fpsDen };
    props = registry.get(step.operation).estimate(props, step.parameters);
  });
  applyVisualPlanExtras(
    { steps, targets: { original } },
    clip.steps,
    input,
    registry,
  );
  return steps;
}

// A chain of several steps that ends in an AVI conversion makes the AVI and
// its MP4 preview in one invocation, like the isolated conversion (ADR-013,
// T-06); applyConvertPlanExtras only handles a single convert step (V4).
function applyChainConvertExtras(plan, steps) {
  if (
    steps.length > 1 &&
    steps[steps.length - 1].operation === "convert" &&
    plan.output.container === "avi" &&
    plan.targets.preview
  )
    plan.convert = { previewInSameInvocation: true };
  return plan;
}

function applyCompositionPlanExtras(plan, steps, inputProps, registry) {
  if (steps[0]?.operation !== "concat")
    return applyChainConvertExtras(plan, steps);

  const parameters = steps[0].parameters;
  const known = parameters._clips;
  const concat = registry.get("concat").estimate(inputProps, parameters);

  // One input per distinct video; the occurrences point to it (ADD 4.8: a
  // repeated clip is downloaded once and passed as several -i inputs).
  const files = [];
  const fileOf = new Map();
  plan.inputs.forEach((input) => {
    if (!fileOf.has(input.videoId)) {
      fileOf.set(input.videoId, files.length);
      files.push(input);
    }
  });

  const original = plan.targets.original;
  const clips = parameters.clips.map((clip, clipIndex) => {
    const { input, output } = known[clipIndex];
    return {
      file: fileOf.get(clip.videoId),
      steps: clipPlanSteps(clip, input, original, registry),
      input: {
        fpsNum: input.fpsNum,
        fpsDen: input.fpsDen,
        durationMs: input.durationMs,
        hasAudio: input.audioCodec !== null,
      },
      output: {
        durationMs: output.durationMs,
        hasAudio: output.audioCodec !== null,
      },
    };
  });

  // B003 decides the audio from the first input only (V3): a concat has audio
  // when any clip has audio at the output of its sub-chain (UC-VID-013 RN6),
  // unless a final step removes it.
  const finalProps = steps.reduce(
    (props, step) =>
      registry.get(step.operation).estimate(props, step.parameters || {}),
    inputProps,
  );
  if (finalProps.audioCodec !== null && plan.output.audio.mode === "none") {
    const codec = formats.OUTPUT_CODECS[plan.output.container].audio;
    plan.output.audio = { mode: "encode", ...encoding.audioEncoding(codec) };
  }

  plan.inputs = files;
  plan.composition = {
    clips,
    target: {
      width: even(concat.displayWidth),
      height: even(concat.displayHeight),
      fpsNum: concat.fpsNum,
      fpsDen: concat.fpsDen,
    },
    audio:
      concat.audioCodec !== null && plan.output.audio.mode !== "none"
        ? "concat"
        : "none",
  };
  return applyChainConvertExtras(plan, steps);
}

module.exports = { applyCompositionPlanExtras, applyChainConvertExtras };
