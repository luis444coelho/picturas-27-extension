// ADR-008/011 pattern: conversion-only instructions added after the generic
// plan, before the task is persisted. The worker does not hold the T-05 matrix.
function applyConvertPlanExtras(plan, steps) {
  if (steps.length !== 1 || steps[0].operation !== "convert") return plan;
  plan.convert = {
    previewInSameInvocation: plan.output.container === "avi",
  };
  return plan;
}

// CONVERT-003, D-72: annotate only conversion validation output. B004/B005
// responses remain identical, including their keys.
function annotateConvertValidation(decided, steps) {
  if (steps.length !== 1 || steps[0].operation !== "convert") return;
  decided.output.videoMode = decided.decisions.video.mode;
  decided.output.audioMode = decided.decisions.audio.mode;
}

function throwConvertStepError(steps, stepError, VideoError) {
  if (steps?.length !== 1 || steps[0]?.operation !== "convert" || !stepError)
    return;
  const code = stepError.errors[0]?.code;
  if (["SAME_FORMAT", "UNSUPPORTED_TARGET_FORMAT"].includes(code))
    throw new VideoError(422, code, stepError);
}

module.exports = {
  applyConvertPlanExtras,
  annotateConvertValidation,
  throwConvertStepError,
};
