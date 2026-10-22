// Validation, cost and shape of a chain of steps {operation, version,
// parameters} (ADD T-01, COM-006). An isolated operation is a chain of one step.

// Video properties (inputProps / estimate) from the meta stored in videos.
function propsFromMeta(meta) {
  return {
    container: meta.container,
    videoCodec: meta.video_codec,
    audioCodec: meta.audio_codec ?? null,
    width: meta.width,
    height: meta.height,
    rotation: meta.rotation || 0,
    displayWidth: meta.display_width,
    displayHeight: meta.display_height,
    fpsNum: meta.fps_num,
    fpsDen: meta.fps_den,
    durationMs: meta.duration_ms,
    sizeBytes: meta.size_bytes,
  };
}

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

// Shape of the request body: a non-empty array of steps (INVALID_REQUEST, D-42).
function isStepList(steps) {
  return Array.isArray(steps) && steps.length > 0;
}

// Errors of one step that do not depend on the operation: unknown operation or
// version, malformed parameters (INVALID_STEP_PARAMS, D-42).
function shapeErrors(step, registry) {
  if (!isPlainObject(step) || typeof step.operation !== "string")
    return [{ code: "INVALID_STEP_PARAMS", field: "operation" }];

  const op = registry.get(step.operation);
  if (!op) return [{ code: "INVALID_STEP_PARAMS", field: "operation" }];

  if (!Number.isInteger(step.version) || !op.versions.includes(step.version))
    return [
      {
        code: "INVALID_STEP_PARAMS",
        field: "version",
        supportedVersions: op.versions,
      },
    ];

  if (step.parameters !== undefined && !isPlainObject(step.parameters))
    return [{ code: "INVALID_STEP_PARAMS", field: "parameters" }];

  return [];
}

// Validates the steps in order, each one against the estimate of the previous
// one (CHAIN-003). Stops at the first step with errors and reports its index.
function validateChain(steps, inputProps, profile, registry) {
  let props = inputProps;
  const estimates = [];

  for (const [index, step] of steps.entries()) {
    let errors = shapeErrors(step, registry);
    const op = errors.length ? null : registry.get(step.operation);
    const parameters = step?.parameters || {};

    if (op) errors = op.validate(parameters, props, profile) || [];
    if (errors.length) return { error: { index, errors }, props, estimates };

    props = op.estimate(props, parameters);
    estimates.push(props);
  }

  return { error: null, props, estimates };
}

// 1 credit per operation; an operation may count its own inner steps, as the
// concat does with the steps of each clip (QUOTA-008, ADD T-01).
function chainCost(steps, registry) {
  return steps.reduce((total, step) => {
    const op = registry.get(step.operation);
    return (
      total +
      op.cost(step.parameters || {}, (inner) => chainCost(inner, registry))
    );
  }, 0);
}

function taskKind(steps) {
  if (steps.some((step) => step.operation === "concat")) return "concat";
  return steps.length > 1 ? "chain" : "single";
}

// Current step derived from the overall progress, since every step runs in a
// single filtergraph (D-40, Q-ADD-16).
function stepFromProgress(progress, totalSteps) {
  return Math.min(
    totalSteps,
    Math.floor((Math.max(0, progress) / 100) * totalSteps) + 1,
  );
}

module.exports = {
  propsFromMeta,
  isStepList,
  validateChain,
  chainCost,
  taskKind,
  stepFromProgress,
};
