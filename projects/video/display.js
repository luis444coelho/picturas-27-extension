// Display dimensions: the coded dimensions with the rotation tag applied (Q-ADD-13).
function displayDimensions(width, height, rotation) {
  if (rotation === 90 || rotation === 270)
    return { displayWidth: height, displayHeight: width };
  return { displayWidth: width, displayHeight: height };
}

// Thumbnail at 00:00:01, or frame 0 for videos shorter than 1 s (UPLOAD-014, Q-ADD-22).
function thumbnailAtMs(durationMs) {
  return durationMs >= 1000 ? 1000 : 0;
}

const FIRST_FRAME_MAX_WIDTH = 1280;
const THUMBNAIL_MAX_WIDTH = 320;

module.exports = {
  displayDimensions,
  thumbnailAtMs,
  FIRST_FRAME_MAX_WIDTH,
  THUMBNAIL_MAX_WIDTH,
};
