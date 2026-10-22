// Persistent B004 UI utility suite, without a browser.
// node --test test/video-edit.test.mts (Node with native type stripping).
import test from "node:test";
import assert from "node:assert/strict";
import {
  parseTimecode,
  formatTimecode,
  trimStep,
  removeAudioStep,
  speedStep,
  predictedTrimMs,
  predictedSpeedMs,
  SPEED_PRESETS,
  stepErrorMessage,
} from "../lib/video-edit.ts";
for (const ms of [
  0, 1, 999, 1000, 10500, 59999, 60000, 3600000, 3723045, 360000000,
])
  test(`timecode roundtrip ${ms}`, () =>
    assert.equal(parseTimecode(formatTimecode(ms)), ms));
for (const text of [
  "",
  "00:60:00.000",
  "00:00:60.000",
  "00:00:01",
  "-01:00:00.000",
  "00:00:01.0000",
  " 00:00:01.000",
  "999999999999:00:00.000",
])
  test(`invalid timecode ${JSON.stringify(text)}`, () =>
    assert.equal(parseTimecode(text), null));
test("steps use parameters, version 1 and integer milliseconds", () => {
  assert.deepEqual(trimStep(10500, 45000), {
    operation: "trim",
    version: 1,
    parameters: { startMs: 10500, endMs: 45000 },
  });
  assert.deepEqual(removeAudioStep(), {
    operation: "remove_audio",
    version: 1,
    parameters: {},
  });
  assert.deepEqual(speedStep(1.75), {
    operation: "speed",
    version: 1,
    parameters: { factor: 1.75 },
  });
});
test("duration previews and speed presets match decisions", () => {
  assert.equal(predictedTrimMs(10000, 35000), 25000);
  assert.equal(predictedSpeedMs(10000, 0.25), 40000);
  assert.equal(predictedSpeedMs(10000, 4), 2500);
  assert.deepEqual(SPEED_PRESETS, [0.25, 0.5, 0.75, 1.25, 1.5, 2, 4]);
  assert.equal(SPEED_PRESETS.includes(1), false);
});
for (const code of [
  "INVALID_INTERVAL",
  "OUT_OF_BOUNDS",
  "NO_AUDIO_STREAM",
  "INVALID_SPEED_FACTOR",
  "SPEED_FACTOR_OUT_OF_RANGE",
  "NO_CHANGES",
  "UNKNOWN",
])
  test(`message ${code}`, () =>
    assert.ok(
      stepErrorMessage(code, { minDurationMs: 34, durationMs: 10000 }).length >
        5,
    ));
