const catalog = require("./filters.json");
const { markBox } = require("./watermarkGeometry");

// ADR-011 (D-63): step data of the B005 operations that estimate/copyable do
// not express, added after buildPlan() and applyPlanExtras() without touching
// the fields they set. The worker receives the catalog entry of the filter
// (ADD T-07: no copy of the catalog in the worker) and where to read the mark.
function applyVisualPlanExtras(plan, steps, inputProps, registry) {
  if (!steps.some((step) => ["filter", "watermark"].includes(step.operation)))
    return plan;
  const original = plan.targets.original;
  let props = inputProps;
  steps.forEach((step, index) => {
    const op = registry.get(step.operation);
    const parameters = step.parameters || {};
    if (step.operation === "filter") {
      const { id, type, matrix } = catalog.find((e) => e.id === parameters.filter);
      plan.steps[index].filter = type === "matrix" ? { id, type, matrix } : { id, type };
    }
    if (step.operation === "watermark") {
      const box = markBox(parameters, props);
      const watermarkId = String(parameters._mark.watermarkId);
      plan.steps[index].mark = {
        watermarkId,
        source: {
          userId: original.userId,
          projectId: original.projectId,
          stage: "video_src",
          name: `wm-${watermarkId}.png`,
        },
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        opacity: parameters.opacity,
      };
    }
    props = op.estimate(props, parameters);
  });
  return plan;
}

module.exports = { applyVisualPlanExtras };
