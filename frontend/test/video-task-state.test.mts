// Unit tests of the client state of a video task (ADD T-03, D-40, D-47).
//
//   node --experimental-strip-types --test test/video-task-state.test.mts
import test from "node:test";
import assert from "node:assert/strict";
import {
  applyTaskUpdate,
  isFinalStatus,
  stepLabel,
  TASK_ERROR_MESSAGES,
  TASK_STATUS_LABELS,
  taskStorageKey,
} from "../lib/video-task-state.ts";

test("queued → processing → completed, with step and progress (TASK-002, TASK-008)", () => {
  let state = applyTaskUpdate(null, { taskId: "t1", status: "queued" });
  assert.deepEqual(state, {
    taskId: "t1",
    status: "queued",
    step: 1,
    totalSteps: 1,
    progress: 0,
  });
  state = applyTaskUpdate(state, {
    taskId: "t1",
    status: "processing",
    step: 3,
    totalSteps: 4,
    progress: 60,
  });
  assert.equal(state?.step, 3);
  assert.equal(state?.totalSteps, 4);
  assert.equal(state?.progress, 60);
  state = applyTaskUpdate(state, {
    taskId: "t1",
    status: "completed",
    resultVideoId: "v9",
  });
  assert.equal(state?.status, "completed");
  assert.equal(state?.progress, 100);
  assert.equal(state?.resultVideoId, "v9");
});

test("events after the task is known to be finished are ignored (ADD T-03)", () => {
  const cancelled = applyTaskUpdate(null, {
    taskId: "t1",
    status: "cancelled",
  });
  const late = applyTaskUpdate(cancelled, {
    taskId: "t1",
    status: "processing",
    progress: 80,
  });
  assert.equal(late?.status, "cancelled");
  assert.equal(late?.progress, 0);
});

test("events of another task are ignored", () => {
  const state = applyTaskUpdate(null, { taskId: "t1", status: "queued" });
  assert.equal(
    applyTaskUpdate(state, { taskId: "t2", status: "failed" }),
    state,
  );
});

test("failed keeps the error code", () => {
  const state = applyTaskUpdate(null, {
    taskId: "t1",
    status: "failed",
    error: { code: "PROCESSING_ERROR" },
  });
  assert.deepEqual(state?.error, { code: "PROCESSING_ERROR" });
  assert.equal(isFinalStatus("failed"), true);
  assert.equal(isFinalStatus("processing"), false);
});

test("labels and messages of the new codes (D-40, D-44)", () => {
  assert.equal(stepLabel(3, 4), "Passo 3 de 4");
  assert.equal(TASK_STATUS_LABELS.queued, "Em fila");
  for (const code of [
    "INVALID_STEP_PARAMS",
    "TASK_ALREADY_ACTIVE",
    "TASK_NOT_ACTIVE",
    "QUOTA_EXCEEDED",
  ]) {
    assert.ok(TASK_ERROR_MESSAGES[code], code);
  }
  assert.equal(taskStorageKey("p1"), "picturas.videoTask.p1");
});
