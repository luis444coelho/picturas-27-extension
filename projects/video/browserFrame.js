const sharp = require("sharp");
const { VideoError } = require("./errors");

const MAX_JPEG_BYTES = 2 * 1024 * 1024;
const MAX_WIDTH = 1280;
const MAX_HEIGHT = 4096;

function invalid(reason) {
  return new VideoError(422, "INVALID_REQUEST", {
    field: "frameJpeg",
    reason,
  });
}

// The browser supplies pixels only. The stored first frame defines the trusted
// presentation geometry; no caller-supplied dimensions or video identity are
// used to place a watermark or to validate an operation.
async function browserFrame(frameJpeg, firstFrame) {
  if (frameJpeg === undefined) return firstFrame;
  if (
    typeof frameJpeg !== "string" ||
    frameJpeg.length === 0 ||
    frameJpeg.length > Math.ceil((MAX_JPEG_BYTES * 4) / 3) + 4 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(frameJpeg)
  )
    throw invalid("type_or_size");

  const bytes = Buffer.from(frameJpeg, "base64");
  if (bytes.length === 0 || bytes.length > MAX_JPEG_BYTES)
    throw invalid("type_or_size");

  let received;
  try {
    received = await sharp(bytes, { failOn: "error" }).metadata();
  } catch {
    throw invalid("unreadable");
  }
  if (
    received.format !== "jpeg" ||
    !received.width ||
    !received.height ||
    received.width > MAX_WIDTH ||
    received.height > MAX_HEIGHT
  )
    throw invalid("type_or_dimensions");

  const trusted = await sharp(firstFrame).metadata();
  const receivedRatio = received.width / received.height;
  const trustedRatio = trusted.width / trusted.height;
  if (Math.abs(receivedRatio / trustedRatio - 1) > 0.03)
    throw invalid("geometry");

  if (received.width === trusted.width && received.height === trusted.height)
    return bytes;
  return sharp(bytes)
    .resize(trusted.width, trusted.height, { fit: "fill" })
    .jpeg({ quality: 85 })
    .toBuffer();
}

module.exports = { browserFrame, MAX_JPEG_BYTES };
