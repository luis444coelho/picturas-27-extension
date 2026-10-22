const reencodedProps = require("./reencodedProps");

module.exports = {
  name: "speed",
  versions: [1],
  cost: () => 1,
  validate({ factor }) {
    if (typeof factor !== "number" || !Number.isFinite(factor) || factor <= 0)
      return [{ code: "INVALID_SPEED_FACTOR", field: "factor" }];
    if (factor < 0.25 || factor > 4)
      return [
        {
          code: "SPEED_FACTOR_OUT_OF_RANGE",
          field: "factor",
          min: 0.25,
          max: 4,
        },
      ];
    if (factor === 1) return [{ code: "NO_CHANGES", field: "factor" }];
    return [];
  },
  estimate(inputProps, { factor }) {
    return {
      ...reencodedProps(inputProps),
      durationMs: Math.round(inputProps.durationMs / factor),
    };
  },
  copyable: () => ({ video: false, audio: false }),
};
