const formats = require("../formats");

// ADD 4.7, T-05: the matrix lives only in projects. The worker receives the
// codec and copy decisions in the plan.
module.exports = {
  name: "convert",
  versions: [1],
  cost: () => 1,

  validate(parameters, inputProps) {
    const target = parameters.target;
    if (
      !Object.hasOwn(formats.OUTPUT_CODECS, target) ||
      Object.keys(parameters).some((key) => key !== "target")
    )
      return [{ code: "UNSUPPORTED_TARGET_FORMAT", field: "target" }];
    if (target === inputProps.container)
      return [{ code: "SAME_FORMAT", field: "target" }];
    return [];
  },

  estimate(inputProps, parameters) {
    const codecs = formats.OUTPUT_CODECS[parameters.target];
    return {
      ...inputProps,
      container: parameters.target,
      videoCodec: codecs.video,
      audioCodec: inputProps.audioCodec === null ? null : codecs.audio,
    };
  },

  copyable: () => ({ video: true, audio: true }),
  outputContainer: (parameters) => parameters.target,
};
