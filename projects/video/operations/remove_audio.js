const reencodedProps = require("./reencodedProps");
const formats = require("../formats");

module.exports = {
  name: "remove_audio",
  versions: [1],
  cost: () => 1,
  validate(parameters, inputProps) {
    return inputProps.audioCodec === null ? [{ code: "NO_AUDIO_STREAM" }] : [];
  },
  estimate(inputProps) {
    const props =
      inputProps.videoCodec === formats.OUTPUT_CODECS.mp4.video
        ? { ...inputProps }
        : reencodedProps(inputProps);
    return { ...props, container: "mp4", audioCodec: null, sizeBytes: null };
  },
  copyable: () => ({ video: true, audio: false }),
};
