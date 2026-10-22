// Default encoding of the results of video operations (ADD T-02, D-39):
// libx264 + aac, yuv420p, +faststart for MP4 and MOV. The mpeg4 and MP3
// settings of AVI outputs belong to B007, which builds the conversion (D-39).
const VIDEO = {
  h264: { codec: "libx264", preset: "veryfast", crf: 23, pixFmt: "yuv420p" },
};

const AUDIO = {
  aac: { codec: "aac", bitrate: "128k" },
};

const FASTSTART_CONTAINERS = ["mp4", "mov"];

function videoEncoding(codec) {
  if (!VIDEO[codec]) throw new Error(`no video encoding for ${codec}`);
  return { ...VIDEO[codec] };
}

function audioEncoding(codec) {
  if (!AUDIO[codec]) throw new Error(`no audio encoding for ${codec}`);
  return { ...AUDIO[codec] };
}

module.exports = {
  videoEncoding,
  audioEncoding,
  faststart: (container) => FASTSTART_CONTAINERS.includes(container),
};
