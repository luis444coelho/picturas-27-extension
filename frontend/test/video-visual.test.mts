// Persistent B005 UI utility suite, without a browser.
// node --test test/video-visual.test.mts (Node with native type stripping).
import test from "node:test";
import assert from "node:assert/strict";
import {
  adjustStep,
  filterStep,
  FILTERS,
  isAcceptedWatermarkFile,
  isOrientIdentity,
  lockedHeight,
  lockedWidth,
  nearestEven,
  NEUTRAL_ADJUST,
  orientedSize,
  orientStep,
  presetSize,
  resizeStep,
  resizeWarnings,
  visualStepErrorMessage,
  fieldLabel,
  WATERMARK_MAX_BYTES,
  watermarkStep,
} from "../lib/video-visual.ts";

test("RESIZE-002: 1920×1080 with width 1000 gives height 562 (nearest even)", () => {
  assert.equal(lockedHeight(1000, 1920, 1080), 562);
  assert.equal(lockedWidth(720, 1920, 1080), 1280);
  assert.equal(nearestEven(853.33), 854);
  assert.equal(nearestEven(562.5), 562);
  assert.equal(nearestEven(563.9), 564);
});
for (const [preset, w, h, expected] of [
  [720, 1920, 1080, { width: 1280, height: 720 }],
  [480, 1920, 1080, { width: 854, height: 480 }],
  [1080, 1280, 720, { width: 1920, height: 1080 }],
  [360, 1920, 1080, { width: 640, height: 360 }],
  [720, 1080, 1920, { width: 720, height: 1280 }],
] as const)
  test(`D-64 preset ${preset}p on ${w}×${h}`, () =>
    assert.deepEqual(presetSize(preset, w, h), expected));

test("RESIZE-004/005: distortion and enlargement warnings", () => {
  assert.deepEqual(resizeWarnings(1280, 720, 1920, 1080), { distorted: false, enlarged: false });
  assert.deepEqual(resizeWarnings(1280, 1280, 1920, 1080), { distorted: true, enlarged: true });
  assert.deepEqual(resizeWarnings(1920, 1080, 1280, 720), { distorted: false, enlarged: true });
});

test("ORIENT-005: final dimensions and identity (Q-ADD-24)", () => {
  assert.deepEqual(orientedSize({ rotation: 270, flipH: false, flipV: false }, 1920, 1080), { width: 1080, height: 1920 });
  assert.deepEqual(orientedSize({ rotation: 90, flipH: true, flipV: false }, 1281, 721), { width: 720, height: 1280 });
  assert.deepEqual(orientedSize({ rotation: 180, flipH: false, flipV: false }, 1280, 720), { width: 1280, height: 720 });
  assert.equal(isOrientIdentity({ rotation: 0, flipH: false, flipV: false }), true);
  assert.equal(isOrientIdentity({ rotation: 180, flipH: true, flipV: true }), true);
  assert.equal(isOrientIdentity({ rotation: 0, flipH: true, flipV: false }), false);
});

test("steps follow the D-50 contract {operation, version, parameters}", () => {
  assert.deepEqual(adjustStep(NEUTRAL_ADJUST), { operation: "adjust", version: 1, parameters: { brightness: 1, contrastFactor: 1, saturationFactor: 1 } });
  assert.deepEqual(filterStep("vintage"), { operation: "filter", version: 1, parameters: { filter: "vintage" } });
  assert.deepEqual(resizeStep(854, 480), { operation: "resize", version: 1, parameters: { width: 854, height: 480 } });
  assert.deepEqual(orientStep({ rotation: 90, flipH: true, flipV: false }).parameters, { rotation: 90, flipH: true, flipV: false });
  assert.deepEqual(FILTERS.map((f) => f.id), ["bw", "sepia", "negative", "vintage", "cold", "warm"]);
});

test("WATERMARK-001/002/007: text or image, empty content gives no step, no _mark from the client", () => {
  const base = { position: { preset: "bottom-right" as const }, scale: 0.2, opacity: 0.4, watermarkId: null, text: "" };
  assert.equal(watermarkStep({ ...base, type: "text", text: "   " }), null);
  assert.equal(watermarkStep({ ...base, type: "image" }), null);
  const text = watermarkStep({ ...base, type: "text", text: "© PictuRAS 2026" });
  assert.deepEqual(text?.parameters, { type: "text", text: "© PictuRAS 2026", position: { preset: "bottom-right" }, scale: 0.2, opacity: 0.4 });
  const image = watermarkStep({ ...base, type: "image", watermarkId: "abc", position: { x: 10, y: 20 } });
  assert.deepEqual(image?.parameters, { type: "image", watermarkId: "abc", position: { x: 10, y: 20 }, scale: 0.2, opacity: 0.4 });
  assert.equal("_mark" in (image?.parameters ?? {}), false);
});

test("D-60: local files PNG or JPEG up to 1 MB", () => {
  const file = (type: string, size: number) => ({ type, size }) as File;
  assert.equal(isAcceptedWatermarkFile(file("image/png", 10)), true);
  assert.equal(isAcceptedWatermarkFile(file("image/jpeg", WATERMARK_MAX_BYTES)), true);
  assert.equal(isAcceptedWatermarkFile(file("image/png", WATERMARK_MAX_BYTES + 1)), false);
  assert.equal(isAcceptedWatermarkFile(file("image/gif", 10)), false);
  assert.equal(isAcceptedWatermarkFile(file("image/png", 0)), false);
});

test("messages name the incorrect control (ADJUST-006, RESIZE-006, WATERMARK-007/008)", () => {
  assert.equal(fieldLabel("brightness"), "Brilho");
  assert.equal(fieldLabel("position.x"), "X");
  assert.match(visualStepErrorMessage("INVALID_RESIZE_PARAMS", { limit: { width: 1920, height: 1080 } }), /1920×1080/);
  assert.match(visualStepErrorMessage("INVALID_RESIZE_PARAMS", { limit: 128 }), /128/);
  assert.match(visualStepErrorMessage("INVALID_RESIZE_PARAMS", { rule: "even" }), /pares/);
  assert.match(visualStepErrorMessage("INVALID_WATERMARK_CONTENT", { field: "text" }), /texto/);
  assert.match(visualStepErrorMessage("WATERMARK_OUT_OF_BOUNDS"), /dentro do quadro/);
  assert.match(visualStepErrorMessage("INVALID_FILTER"), /catálogo/);
  assert.match(visualStepErrorMessage("NO_CHANGES"), /não alteram/);
});
