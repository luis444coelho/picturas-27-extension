const reencodedProps = require("./reencodedProps");

// UC-VID-010 (ADD 4.5): presentation dimensions (Q-ADD-13), even integers
// >= 128 within the profile ceiling, compared larger x smaller (RN3).
const MIN = 128;
const CEILINGS = {
  free: { width: 1920, height: 1080 },
  premium: { width: 3840, height: 2160 },
};

function error(field, details) {
  return [{ code: "INVALID_RESIZE_PARAMS", field, ...details }];
}

module.exports = {
  name: "resize",
  versions: [1],
  cost: () => 1,
  validate(parameters, inputProps, profile) {
    for (const field of ["width", "height"]) {
      const value = parameters[field];
      if (!Number.isInteger(value)) return error(field, { rule: "integer" });
      if (value < MIN) return error(field, { limit: MIN });
      if (value % 2 !== 0) return error(field, { rule: "even" });
    }
    const { width, height } = parameters;
    const ceiling = CEILINGS[profile] || CEILINGS.free;
    const [larger, smaller] = width >= height ? ["width", "height"] : ["height", "width"];
    if (parameters[larger] > ceiling.width)
      return error(larger, { limit: ceiling });
    if (parameters[smaller] > ceiling.height)
      return error(smaller, { limit: ceiling });
    if (
      width === inputProps.displayWidth &&
      height === inputProps.displayHeight
    )
      return [{ code: "NO_CHANGES" }];
    return [];
  },
  estimate(inputProps, { width, height }) {
    return {
      ...reencodedProps(inputProps),
      width,
      height,
      displayWidth: width,
      displayHeight: height,
      rotation: 0,
    };
  },
  copyable: () => ({ video: false, audio: true }),
};
