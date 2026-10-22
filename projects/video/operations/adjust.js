const reencodedProps = require("./reencodedProps");
const { onStep, inRange, normalize } = require("./visualSteps");

// UC-VID-008 (ADD 4.3): factors in [0, 2], step 0.05, neutral 1 (DQ-020).
const FIELDS = ["brightness", "contrastFactor", "saturationFactor"];
const MIN = 0;
const MAX = 2;
const STEP = 0.05;

module.exports = {
  name: "adjust",
  versions: [1],
  cost: () => 1,
  validate(parameters) {
    for (const field of FIELDS) {
      const value = parameters[field];
      if (!inRange(value, MIN, MAX) || !onStep(value, STEP))
        return [
          {
            code: "INVALID_ADJUST_PARAMS",
            field,
            min: MIN,
            max: MAX,
            step: STEP,
          },
        ];
    }
    if (FIELDS.every((field) => normalize(parameters[field], STEP) === 1))
      return [{ code: "NO_CHANGES" }];
    return [];
  },
  estimate: (inputProps) => reencodedProps(inputProps),
  copyable: () => ({ video: false, audio: true }),
};
