const reencodedProps = require("./reencodedProps");

// UC-VID-011 (ADD 4.6): clockwise rotation before the mirrors (RN3), from the
// presentation orientation; the identity gives NO_CHANGES (RN4, Q-ADD-24).
const ROTATIONS = [0, 90, 180, 270];

module.exports = {
  name: "orient",
  versions: [1],
  cost: () => 1,
  validate(parameters) {
    const { rotation = 0, flipH = false, flipV = false } = parameters;
    if (!ROTATIONS.includes(rotation))
      return [
        { code: "INVALID_ORIENT_PARAMS", field: "rotation", allowed: ROTATIONS },
      ];
    if (typeof flipH !== "boolean")
      return [{ code: "INVALID_ORIENT_PARAMS", field: "flipH" }];
    if (typeof flipV !== "boolean")
      return [{ code: "INVALID_ORIENT_PARAMS", field: "flipV" }];
    const identity =
      (rotation === 0 && !flipH && !flipV) ||
      (rotation === 180 && flipH && flipV);
    if (identity) return [{ code: "NO_CHANGES" }];
    return [];
  },
  estimate(inputProps, { rotation = 0 }) {
    const props = reencodedProps(inputProps);
    if (rotation !== 90 && rotation !== 270) return props;
    return {
      ...props,
      width: props.height,
      height: props.width,
      displayWidth: props.displayHeight,
      displayHeight: props.displayWidth,
    };
  },
  copyable: () => ({ video: false, audio: true }),
};
