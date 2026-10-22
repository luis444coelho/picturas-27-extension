// Working-format estimates (T-02, Q-ADD-25); actual metadata come from FFprobe.
module.exports = function reencodedProps(inputProps) {
  const width = inputProps.displayWidth - (inputProps.displayWidth % 2);
  const height = inputProps.displayHeight - (inputProps.displayHeight % 2);
  return {
    ...inputProps,
    container: "mp4",
    videoCodec: "h264",
    audioCodec: inputProps.audioCodec === null ? null : "aac",
    width,
    height,
    displayWidth: width,
    displayHeight: height,
    rotation: 0,
    sizeBytes: null,
  };
};
