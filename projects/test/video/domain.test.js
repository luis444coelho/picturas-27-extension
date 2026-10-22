const test = require("node:test");
const assert = require("node:assert/strict");

const formats = require("../../video/formats");
const profiles = require("../../video/profiles");
const display = require("../../video/display");

test("containerFromUpload accepts only matching extension and MIME (UPLOAD-003/020)", () => {
  assert.equal(formats.containerFromUpload("a.mp4", "video/mp4"), "mp4");
  assert.equal(formats.containerFromUpload("A.MOV", "video/quicktime"), "mov");
  assert.equal(formats.containerFromUpload("c.avi", "video/x-msvideo"), "avi");
  assert.equal(formats.containerFromUpload("c.mkv", "video/x-matroska"), null);
  assert.equal(formats.containerFromUpload("c.webm", "video/webm"), null);
  assert.equal(formats.containerFromUpload("c.mp4", "video/quicktime"), null);
  assert.equal(formats.containerFromUpload("noext", "video/mp4"), null);
});

test("containerFromProbe tells MP4 from MOV by the QuickTime brand", () => {
  assert.equal(
    formats.containerFromProbe("mov,mp4,m4a,3gp,3g2,mj2", "isom"),
    "mp4",
  );
  assert.equal(
    formats.containerFromProbe("mov,mp4,m4a,3gp,3g2,mj2", "qt  "),
    "mov",
  );
  assert.equal(formats.containerFromProbe("avi", undefined), "avi");
  assert.equal(formats.containerFromProbe("matroska,webm", undefined), null);
});

test("validateStreams applies the codec matrix per container (UPLOAD-009/010)", () => {
  assert.equal(formats.validateStreams("mp4", "h264", "aac"), null);
  assert.equal(formats.validateStreams("mp4", "h264", null), null);
  assert.equal(formats.validateStreams("avi", "mpeg4", "mp3"), null);
  assert.equal(formats.validateStreams("avi", "h264", "aac"), null);

  assert.deepEqual(formats.validateStreams("mp4", "hevc", "aac"), {
    code: "INVALID_CODEC",
    details: { stream: "video", codec: "hevc" },
  });
  assert.equal(
    formats.validateStreams("mov", "vp9", null).code,
    "INVALID_CODEC",
  );
  assert.equal(
    formats.validateStreams("avi", "mjpeg", null).code,
    "INVALID_CODEC",
  );
  assert.deepEqual(formats.validateStreams("mov", "h264", "mp3"), {
    code: "INVALID_CODEC",
    details: { stream: "audio", codec: "mp3" },
  });
});

test("validateStreams rejects a file without video stream as INVALID_CODEC (D-24)", () => {
  assert.deepEqual(formats.validateStreams("mp4", null, "aac"), {
    code: "INVALID_CODEC",
    details: { stream: "video", codec: null },
  });
});

test("previewPlan follows T-06 and Q-ADD-20", () => {
  // Browser-compatible MP4: no copy.
  assert.equal(formats.previewPlan("mp4", "h264", "aac", "yuv420p"), null);
  // MP4 High 10 / 4:2:2: re-encoded copy.
  assert.deepEqual(formats.previewPlan("mp4", "h264", "aac", "yuv420p10le"), {
    video: "libx264",
    audio: "copy",
    genpts: false,
  });
  assert.equal(
    formats.previewPlan("mp4", "h264", null, "yuv422p").video,
    "libx264",
  );
  // MOV H.264/AAC: remux.
  assert.deepEqual(formats.previewPlan("mov", "h264", "aac", "yuv420p"), {
    video: "copy",
    audio: "copy",
    genpts: false,
  });
  // AVI H.264/MP3: copy video with genpts, re-encode audio.
  assert.deepEqual(formats.previewPlan("avi", "h264", "mp3", "yuv420p"), {
    video: "copy",
    audio: "aac",
    genpts: true,
  });
  // AVI MPEG-4 Part 2 without audio: re-encode video.
  assert.deepEqual(formats.previewPlan("avi", "mpeg4", null, "yuv420p"), {
    video: "libx264",
    audio: null,
    genpts: false,
  });
});

test("profile limits are inclusive and in base 1024 (RN4, D-22)", () => {
  const free = profiles.limitsFor("free");
  const premium = profiles.limitsFor("premium");
  assert.equal(free.maxBytes, 200 * 1024 * 1024);
  assert.equal(premium.maxBytes, 2 * 1024 * 1024 * 1024);
  assert.equal(profiles.limitsFor("anonymous"), null);
  assert.equal(profiles.limitsFor(undefined), null);

  assert.equal(profiles.checkSize(free.maxBytes, free), null);
  assert.deepEqual(profiles.checkSize(free.maxBytes + 1, free), {
    code: "LIMIT_EXCEEDED",
    details: { field: "size", limit: free.maxBytes, total: free.maxBytes + 1 },
  });
  assert.equal(profiles.checkDuration(5 * 60 * 1000, free), null);
  assert.equal(
    profiles.checkDuration(5 * 60 * 1000 + 1, free).details.field,
    "duration",
  );
  assert.equal(profiles.checkDuration(60 * 60 * 1000, premium), null);
  assert.equal(profiles.checkDuration(315000, free).code, "LIMIT_EXCEEDED");
});

test("display dimensions swap for 90/270 rotation (UPLOAD-013, Q-ADD-13)", () => {
  assert.deepEqual(display.displayDimensions(1920, 1080, 90), {
    displayWidth: 1080,
    displayHeight: 1920,
  });
  assert.deepEqual(display.displayDimensions(1920, 1080, 270), {
    displayWidth: 1080,
    displayHeight: 1920,
  });
  assert.deepEqual(display.displayDimensions(1920, 1080, 180), {
    displayWidth: 1920,
    displayHeight: 1080,
  });
  assert.deepEqual(display.displayDimensions(1920, 1080, 0), {
    displayWidth: 1920,
    displayHeight: 1080,
  });
});

test("thumbnail at 1 s, or frame 0 below 1 s (UPLOAD-014, Q-ADD-22)", () => {
  assert.equal(display.thumbnailAtMs(60000), 1000);
  assert.equal(display.thumbnailAtMs(1000), 1000);
  assert.equal(display.thumbnailAtMs(500), 0);
});
