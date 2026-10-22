const reencodedProps = require("./reencodedProps");
const { onStep, inRange } = require("./visualSteps");
const { PRESETS, markBox, boundsError } = require("../watermarkGeometry");

// UC-VID-004 (Q-ADD-12, D-59 to D-61). The mark's own dimensions come from the
// server in parameters._mark (ADR-010); a value sent by the client never stays.
const TEXT_MAX = 100;
const SCALE = { min: 0.05, max: 0.5, step: 0.01 };
const OPACITY = { min: 0.1, max: 1, step: 0.01 };

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const params = (field, details = {}) => [
  { code: "INVALID_WATERMARK_PARAMS", field, ...details },
];
const content = (field) => [{ code: "INVALID_WATERMARK_CONTENT", field }];

function validMark(mark) {
  return (
    isPlainObject(mark) &&
    Number.isInteger(mark.width) &&
    Number.isInteger(mark.height) &&
    mark.width > 0 &&
    mark.height > 0
  );
}

function validPosition(position) {
  if (!isPlainObject(position)) return false;
  if (position.preset !== undefined) return PRESETS.includes(position.preset);
  return Number.isInteger(position.x) && Number.isInteger(position.y);
}

module.exports = {
  name: "watermark",
  versions: [1],
  cost: () => 1,
  validate(parameters, inputProps) {
    const { type } = parameters;
    if (type !== "text" && type !== "image")
      return params("type", { allowed: ["text", "image"] });
    if (type === "text") {
      const text = typeof parameters.text === "string" ? parameters.text.trim() : "";
      if (!text) return content("text");
      if (text.length > TEXT_MAX) return params("text", { max: TEXT_MAX });
      if (!validMark(parameters._mark)) return content("text");
    } else {
      if (typeof parameters.watermarkId !== "string") return content("watermarkId");
      const mark = parameters._mark;
      if (!validMark(mark) || String(mark.watermarkId) !== parameters.watermarkId)
        return content("watermarkId");
    }
    for (const [field, range] of [
      ["scale", SCALE],
      ["opacity", OPACITY],
    ]) {
      const value = parameters[field];
      if (!inRange(value, range.min, range.max) || !onStep(value, range.step))
        return params(field, range);
    }
    if (!validPosition(parameters.position))
      return params("position", { presets: PRESETS });
    return boundsError(parameters, markBox(parameters, inputProps));
  },
  estimate: (inputProps) => reencodedProps(inputProps),
  copyable: () => ({ video: false, audio: true }),
};
