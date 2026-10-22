const reencodedProps = require("./reencodedProps");

module.exports = {
  name: "trim",
  versions: [1],
  cost: () => 1,
  validate(parameters, inputProps) {
    for (const field of ["startMs", "endMs"]) {
      if (!Number.isInteger(parameters[field]))
        return [{ code: "INVALID_INTERVAL", field }];
    }
    for (const field of ["startMs", "endMs"]) {
      if (parameters[field] < 0 || parameters[field] > inputProps.durationMs)
        return [
          { code: "OUT_OF_BOUNDS", field, durationMs: inputProps.durationMs },
        ];
    }
    if (parameters.startMs >= parameters.endMs)
      return [{ code: "INVALID_INTERVAL", field: "endMs" }];
    const minDurationMs = Math.ceil(
      (1000 * inputProps.fpsDen) / inputProps.fpsNum,
    );
    if (parameters.endMs - parameters.startMs < minDurationMs)
      return [{ code: "INVALID_INTERVAL", field: "endMs", minDurationMs }];
    return [];
  },
  estimate(inputProps, parameters) {
    return {
      ...reencodedProps(inputProps),
      durationMs: parameters.endMs - parameters.startMs,
    };
  },
  copyable: () => ({ video: false, audio: false }),
};
