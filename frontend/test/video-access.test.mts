// Unit tests of the video information formatters (UC-VID-007 RN4, ADD 4.2),
// with the examples of the ERS acceptance criteria.
//
//   node --experimental-strip-types --test test/video-access.test.mts
import test from "node:test";
import assert from "node:assert/strict";
import {
  codecLabel,
  formatFileSize,
  formatFps,
  formatPreciseDuration,
  formatResolution,
  formatVideoFormat,
} from "../lib/video-format.ts";

test("duration hh:mm:ss.mmm: 45.2 s → 00:00:45.200 (INFO-002)", () => {
  assert.equal(formatPreciseDuration(45200), "00:00:45.200");
});

test("duration with hours, minutes and milliseconds", () => {
  assert.equal(formatPreciseDuration(3_723_045), "01:02:03.045");
  assert.equal(formatPreciseDuration(0), "00:00:00.000");
  assert.equal(formatPreciseDuration(59_999), "00:00:59.999");
});

test("display resolution: 1920 × 1080 px, and 1080 × 1920 px for a 90° tag (INFO-003)", () => {
  assert.equal(formatResolution(1920, 1080), "1920 × 1080 px");
  assert.equal(formatResolution(1080, 1920), "1080 × 1920 px");
});

test("format: MOV (H.264 / AAC) (INFO-004)", () => {
  assert.equal(formatVideoFormat("mov", "h264", "aac"), "MOV (H.264 / AAC)");
});

test("format without audio: MP4 (H.264 / sem áudio) (INFO-004)", () => {
  assert.equal(
    formatVideoFormat("mp4", "h264", null),
    "MP4 (H.264 / sem áudio)",
  );
});

test("format of an AVI with MPEG-4 and MP3", () => {
  assert.equal(formatVideoFormat("avi", "mpeg4", "mp3"), "AVI (MPEG-4 / MP3)");
});

test("unknown codec is shown in upper case", () => {
  assert.equal(codecLabel("vp9"), "VP9");
});

test("size: 157 286 400 bytes → 150.00 MB (INFO-005)", () => {
  assert.equal(formatFileSize(157_286_400), "150.00 MB");
});

test("size: GB from 1024³ bytes, MB just below (INFO-005)", () => {
  assert.equal(formatFileSize(1024 ** 3), "1.00 GB");
  assert.equal(formatFileSize(1024 ** 3 - 1), "1024.00 MB");
  assert.equal(formatFileSize(2 * 1024 ** 3), "2.00 GB");
});

test("fps: 30000/1001 → 29.97 fps (INFO-006)", () => {
  assert.equal(formatFps(30000, 1001), "29.97 fps");
  assert.equal(formatFps(25, 1), "25.00 fps");
});
