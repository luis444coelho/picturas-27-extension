const { MAX_STEPS } = require("./compositionLimits");

// Phase 1 of the chain validation (ADD 4.9, D-78, D-79, D-80, D-85): the
// structure of the chain, before any read. Pure: no videos, no registry.
const FRAME_EXTRACTION = "extract_frames"; // reserved name (D-05, D-06, D-79)
const SERVER_FIELDS = ["_mark", "_input", "_clips"];

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const operationOf = (step) =>
  isPlainObject(step) && typeof step.operation === "string"
    ? step.operation
    : null;

// Clips of a concat step; malformed clips are reported by the concat itself.
function clipsOf(step) {
  const clips = isPlainObject(step?.parameters) ? step.parameters.clips : null;
  return Array.isArray(clips) ? clips : [];
}

function clipSteps(clip) {
  return isPlainObject(clip) && Array.isArray(clip.steps) ? clip.steps : [];
}

// N: top-level steps (the concat counts 1) plus the steps of every clip
// (UC-VID-014 RN5, CHAIN-008, CHAIN-009).
function countSteps(steps) {
  if (!Array.isArray(steps)) return 0;
  return steps.reduce(
    (total, step) =>
      total +
      1 +
      (operationOf(step) === "concat"
        ? clipsOf(step).reduce((sum, clip) => sum + clipSteps(clip).length, 0)
        : 0),
    0,
  );
}

function invalid(rule, at = {}) {
  return { code: "INVALID_CHAIN", details: { rule, ...at } };
}

// Every step with its address: {index} on the top level, {index, clipIndex,
// stepIndex} inside a clip (D-80).
function addressed(steps) {
  const out = [];
  steps.forEach((step, index) => {
    out.push({ step, at: { index } });
    if (operationOf(step) !== "concat") return;
    clipsOf(step).forEach((clip, clipIndex) =>
      clipSteps(clip).forEach((inner, stepIndex) =>
        out.push({ step: inner, at: { index, clipIndex, stepIndex } }),
      ),
    );
  });
  return out;
}

// null when the structure is valid, otherwise {code, details} (422).
function checkStructure(steps, { preset = false } = {}) {
  if (!Array.isArray(steps) || steps.length === 0)
    return invalid("empty_chain");

  const all = addressed(steps);
  const inClip = ({ at }) => at.clipIndex !== undefined;

  const frames = all.find(({ step }) => operationOf(step) === FRAME_EXTRACTION);
  if (frames) return invalid("frame_extraction", frames.at);

  const concats = all.filter(({ step }) => operationOf(step) === "concat");
  if (preset && concats.length)
    return invalid("concat_in_preset", concats[0].at);
  const nested = concats.find(inClip);
  if (nested) return invalid("multiple_concat", nested.at);
  if (concats.length > 1) return invalid("multiple_concat", concats[1].at);
  if (concats.length === 1 && concats[0].at.index !== 0)
    return invalid("concat_not_first", concats[0].at);

  const misplaced = all.find(
    ({ step, at }) =>
      operationOf(step) === "convert" &&
      (inClip({ at }) || at.index !== steps.length - 1),
  );
  if (misplaced) return invalid("convert_not_last", misplaced.at);

  const total = countSteps(steps);
  if (total > MAX_STEPS)
    return { code: "CHAIN_TOO_LONG", details: { total, limit: MAX_STEPS } };
  return null;
}

// Unknown operation or version, or parameters that are not an object, for
// steps that cannot be validated against a video (presets, ADR-018).
function checkKnown(steps, registry) {
  for (const { step, at } of addressed(steps)) {
    const op = registry.get(operationOf(step));
    const field = !op
      ? "operation"
      : !Number.isInteger(step.version) || !op.versions.includes(step.version)
        ? "version"
        : step.parameters !== undefined && !isPlainObject(step.parameters)
          ? "parameters"
          : null;
    if (field)
      return {
        code: "INVALID_STEP_PARAMS",
        details: { ...at, errors: [{ code: "INVALID_STEP_PARAMS", field }] },
      };
  }
  return null;
}

// Steps as stored in a preset: {operation, version, parameters} without the
// fields the server writes (D-83, D-84).
function withoutServerFields(steps) {
  return steps.map((step) => {
    const parameters = { ...(step.parameters || {}) };
    for (const field of SERVER_FIELDS) delete parameters[field];
    return { operation: step.operation, version: step.version, parameters };
  });
}

module.exports = {
  FRAME_EXTRACTION,
  countSteps,
  checkStructure,
  checkKnown,
  withoutServerFields,
  clipsOf,
  clipSteps,
};
