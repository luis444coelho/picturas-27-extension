const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Video = require("../../models/video");
const { suggestedFileName } = require("../../video/fileName");

const id = () => new mongoose.Types.ObjectId();
function video(overrides = {}) {
  return new Video({
    project_id: id(),
    owner_id: id(),
    created_by: id(),
    original_name: "Quando Tu Entras Em Campo - SC Braga.mp4",
    mime_type: "video/x-msvideo",
    status: "completed",
    storage: { original_key: "project/video_out/result.avi" },
    meta: { container: "avi" },
    source_video_ids: [id()],
    recipe: [{ operation: "convert", version: 1, parameters: { target: "avi" } }],
    task_id: id(),
    ...overrides,
  });
}

test("new task result uses the stored container extension without operation suffix", async () => {
  const doc = video();
  await doc.validate();
  assert.equal(doc.original_name, "Quando Tu Entras Em Campo - SC Braga.avi");
  assert.equal(suggestedFileName(doc), "Quando Tu Entras Em Campo - SC Braga_convert.avi");
  await doc.validate();
  assert.equal(doc.original_name, "Quando Tu Entras Em Campo - SC Braga.avi");
});

test("MOV result and two-step download retain one suffix per operation", async () => {
  const doc = video({
    meta: { container: "mov" },
    recipe: [
      { operation: "trim", version: 1, parameters: {} },
      { operation: "convert", version: 1, parameters: { target: "mov" } },
    ],
  });
  await doc.validate();
  assert.equal(doc.original_name, "Quando Tu Entras Em Campo - SC Braga.mov");
  assert.equal(suggestedFileName(doc), "Quando Tu Entras Em Campo - SC Braga_trim_convert.mov");
});

test("trim and filter downloads keep their single operation suffix", async () => {
  for (const operation of ["trim", "filter"]) {
    const doc = video({
      meta: { container: "mp4" },
      recipe: [{ operation, version: 1, parameters: {} }],
    });
    await doc.validate();
    assert.equal(doc.original_name, "Quando Tu Entras Em Campo - SC Braga.mp4");
    assert.equal(suggestedFileName(doc), `Quando Tu Entras Em Campo - SC Braga_${operation}.mp4`);
  }
});

test("ingested original without task_id keeps its supplied name", async () => {
  const doc = video({ task_id: null });
  await doc.validate();
  assert.equal(doc.original_name, "Quando Tu Entras Em Campo - SC Braga.mp4");
});

test("existing result is not renamed during validation", async () => {
  const doc = video();
  doc.$isNew = false;
  await doc.validate();
  assert.equal(doc.original_name, "Quando Tu Entras Em Campo - SC Braga.mp4");
});
