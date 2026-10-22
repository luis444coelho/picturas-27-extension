import test from "node:test";
import assert from "node:assert/strict";
import { conversionTargets, convertStep, conversionVerdict, conversionError } from "../lib/video-convert.ts";

test("CONVERT-001/010: destinations exclude current format", () => {
  assert.deepEqual(conversionTargets("mov"), ["mp4", "avi"]);
  assert.deepEqual(convertStep("avi"), { operation: "convert", version: 1, parameters: { target: "avi" } });
});

test("CONVERT-003: panel mode follows validation videoMode/audioMode", () => {
  const output = { container: "mov", videoCodec: "h264", audioCodec: "aac",
    videoMode: "copy", audioMode: "copy" };
  assert.match(conversionVerdict(output)?.mode ?? "", /^Cópia direta/);
  assert.match(conversionVerdict({ ...output, audioMode: "encode" })?.mode ?? "", /^Recodificação/);
  assert.match(conversionVerdict({ ...output, videoMode: "encode", audioMode: "none", audioCodec: null })?.mode ?? "", /^Recodificação/);
  assert.equal(conversionVerdict({ ...output, videoMode: undefined }), null);
  assert.match(conversionError("SAME_FORMAT"), /diferente/);
  assert.match(conversionError("UNSUPPORTED_TARGET_FORMAT"), /não suportado/);
});
