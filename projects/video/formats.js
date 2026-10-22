// Single source of the video format matrix (DQ-002, ADD T-05) and of the
// preview-copy plan (ADD T-06, Q-ADD-20). The worker has no copy of these rules.
const CONTAINERS = {
  mp4: {
    extension: ".mp4",
    mimeType: "video/mp4",
    video: ["h264"],
    audio: ["aac"],
  },
  mov: {
    extension: ".mov",
    mimeType: "video/quicktime",
    video: ["h264"],
    audio: ["aac"],
  },
  avi: {
    extension: ".avi",
    mimeType: "video/x-msvideo",
    video: ["h264", "mpeg4"],
    audio: ["aac", "mp3"],
  },
};

function extensionOf(fileName) {
  const dot = String(fileName || "").lastIndexOf(".");
  return dot < 0 ? "" : String(fileName).slice(dot).toLowerCase();
}

// Container declared by the client: extension and MIME type must both point to
// the same container of the matrix (UPLOAD-003, UPLOAD-020).
function containerFromUpload(fileName, mimeType) {
  const extension = extensionOf(fileName);
  const entry = Object.entries(CONTAINERS).find(
    ([, c]) => c.extension === extension && c.mimeType === mimeType,
  );
  return entry ? entry[0] : null;
}

// Container detected by FFprobe. MP4 and MOV share the same demuxer, so the
// QuickTime major brand ("qt  ") tells them apart.
function containerFromProbe(formatName, majorBrand) {
  const names = String(formatName || "").split(",");
  if (names.includes("avi")) return "avi";
  if (names.includes("mov") || names.includes("mp4")) {
    return String(majorBrand || "").trim() === "qt" ? "mov" : "mp4";
  }
  return null;
}

// Returns null when the streams are admitted for the container, or an
// INVALID_CODEC error description (UPLOAD-009, UPLOAD-010).
function validateStreams(container, videoCodec, audioCodec) {
  const entry = CONTAINERS[container];
  if (!entry.video.includes(videoCodec)) {
    return {
      code: "INVALID_CODEC",
      details: { stream: "video", codec: videoCodec || null },
    };
  }
  if (audioCodec !== null && !entry.audio.includes(audioCodec)) {
    return {
      code: "INVALID_CODEC",
      details: { stream: "audio", codec: audioCodec },
    };
  }
  return null;
}

// Browsers only play 8-bit 4:2:0 H.264 reliably (ADD T-06).
function isBrowserCompatible(videoCodec, pixFmt) {
  return videoCodec === "h264" && pixFmt === "yuv420p";
}

// Preview copy plan: null when the original plays in the browser as it is.
function previewPlan(container, videoCodec, audioCodec, pixFmt) {
  const compatible = isBrowserCompatible(videoCodec, pixFmt);
  if (container === "mp4" && compatible) return null;

  const video = compatible ? "copy" : "libx264";
  let audio = null;
  if (audioCodec === "aac") audio = "copy";
  else if (audioCodec !== null) audio = "aac";

  return { video, audio, genpts: container === "avi" && video === "copy" };
}

module.exports = {
  CONTAINERS,
  extensionOf,
  containerFromUpload,
  containerFromProbe,
  validateStreams,
  isBrowserCompatible,
  previewPlan,
};

// B003: output codecs of each container (ADD T-05, "Saída") and the browser
// profile of isBrowserCompatible as data, for the worker to check a result whose
// video stream was copied (ADD T-06). Added by B003 without changing the above.
module.exports.OUTPUT_CODECS = {
  mp4: { video: "h264", audio: "aac" },
  mov: { video: "h264", audio: "aac" },
  avi: { video: "mpeg4", audio: "mp3" },
};
module.exports.BROWSER_PROFILE = { videoCodec: "h264", pixFmt: "yuv420p" };
