// Shared rules of the B005 operations: decimal steps checked with a tolerance,
// since values such as 0.15 have no exact binary representation (ADD 4.3).
const TOLERANCE = 1e-6;

const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

function onStep(value, step) {
  const units = value / step;
  return Math.abs(units - Math.round(units)) < TOLERANCE;
}

// Value on the step grid, used by the preview and the worker alike.
function normalize(value, step) {
  return Math.round(value / step) * step;
}

function inRange(value, min, max) {
  return (
    isNumber(value) && value >= min - TOLERANCE && value <= max + TOLERANCE
  );
}

module.exports = { TOLERANCE, isNumber, onStep, normalize, inRange };
