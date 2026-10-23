// B008 chain editor utilities, without a browser (UC-VID-013, UC-VID-014).
// node --test test/video-chain.test.mts (Node with native type stripping).
import test from "node:test";
import assert from "node:assert/strict";
import {
  addressLabel,
  canAddStep,
  canSaveAsPreset,
  canSubmitConcat,
  chainCost,
  chainErrorMessage,
  CHAIN_OPERATIONS,
  cleanPresetName,
  concatStep,
  countSteps,
  isConcatChain,
  moveItem,
  phaseMessage,
  quotaWarning,
  removeItem,
  RULE_MESSAGES,
  withConcat,
  withoutServerFields,
} from "../lib/video-chain.ts";

const step = (operation: string, parameters: Record<string, unknown> = {}) => ({
  operation,
  version: 1,
  parameters,
});

test("nine eligible operations besides the concat, no frame extraction (CHAIN-002)", () => {
  assert.equal(CHAIN_OPERATIONS.length, 9);
  assert.ok(!CHAIN_OPERATIONS.some((op) => (op.id as string) === "extract_frames"));
});

test("N counts sub-chains, concat and final steps; cost = N (CHAIN-009)", () => {
  const chain = [
    concatStep([
      { videoId: "a", steps: [step("filter")] },
      { videoId: "b", steps: [step("remove_audio")] },
      { videoId: "c", steps: [step("speed")] },
    ]),
    step("watermark"),
  ];
  assert.equal(countSteps(chain), 5);
  assert.equal(chainCost(chain), 5);
  assert.equal(isConcatChain(chain), true);
  assert.equal(canAddStep(Array(9).fill(step("trim"))), true);
  assert.equal(canAddStep(Array(10).fill(step("trim"))), false);
});

test("move, remove and add a concat (CHAIN-004, CHAIN-015, D-78)", () => {
  assert.deepEqual(moveItem(["v1", "v2", "v3"], 2, 0), ["v3", "v1", "v2"]);
  assert.deepEqual(moveItem(["v1", "v2"], 0, 5), ["v1", "v2"]);
  assert.deepEqual(removeItem(["v1", "v2", "v3"], 1), ["v1", "v3"]);
  const moved = withConcat("v1", [step("trim")]);
  assert.equal(moved.length, 1);
  assert.deepEqual(moved[0].parameters.clips, [{ videoId: "v1", steps: [step("trim")] }]);
  assert.equal(canSubmitConcat(moved), false);
  assert.equal(
    canSubmitConcat([concatStep([{ videoId: "v1", steps: [] }, { videoId: "v1", steps: [] }])]),
    true,
  );
});

test("presets: only chains without concat; server fields removed; name 1 to 50 (D-83, D-85)", () => {
  assert.equal(canSaveAsPreset([]), false);
  assert.equal(canSaveAsPreset([step("trim")]), true);
  assert.equal(canSaveAsPreset([concatStep([]), step("trim")]), false);
  assert.deepEqual(withoutServerFields([step("watermark", { type: "text", _mark: { width: 1 } })]), [
    step("watermark", { type: "text" }),
  ]);
  assert.equal(cleanPresetName("  720p + marca  "), "720p + marca");
  assert.equal(cleanPresetName("   "), null);
  assert.equal(cleanPresetName("x".repeat(51)), null);
});

test("messages of the rules, codes and addresses (D-79, D-80, D-85)", () => {
  for (const rule of ["empty_chain", "convert_not_last", "multiple_concat", "frame_extraction", "concat_not_first", "concat_in_preset"])
    assert.equal(chainErrorMessage("INVALID_CHAIN", { rule }), RULE_MESSAGES[rule]);
  assert.match(chainErrorMessage("CHAIN_TOO_LONG", { total: 11, limit: 10 })!, /10 passos \(tem 11\)/);
  assert.match(chainErrorMessage("TOO_MANY_INPUTS", { limit: 10 })!, /10 vídeos/);
  assert.match(chainErrorMessage("LIMIT_EXCEEDED", { total: 360000, limit: 300000 })!, /6 min.*5 min/);
  assert.equal(chainErrorMessage("UNKNOWN"), null);
  assert.equal(addressLabel({ index: 0, clipIndex: 1, stepIndex: 2 }), "Clip 2, passo 3");
  assert.equal(addressLabel({ clipIndex: 0 }), "Clip 1");
  assert.equal(addressLabel({ index: 3 }), "Passo 4");
});

test("phase of a failed task and quota warning of the Registered profile (D-82, DQ-025)", () => {
  assert.equal(phaseMessage("download"), "A tarefa falhou ao descarregar os vídeos.");
  assert.equal(phaseMessage("encode"), "A tarefa falhou ao codificar o vídeo.");
  assert.equal(phaseMessage("upload"), "A tarefa falhou ao enviar o resultado.");
  assert.equal(phaseMessage(undefined), null);
  assert.match(quotaWarning("free", 5, 6)!, /6 créditos/);
  assert.match(quotaWarning("free", 2, 3)!, /restam-te 2/);
  assert.equal(quotaWarning("free", 5, 3), null);
  assert.equal(quotaWarning("premium", 0, 10), null);
});
