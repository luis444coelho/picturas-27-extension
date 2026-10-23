const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");
const { browserFrame, MAX_JPEG_BYTES } = require("../../video/browserFrame");

test("browser frame keeps the stored frame when no JPEG is supplied", async () => {
  const first = await sharp({ create: { width: 640, height: 360, channels: 3, background: "blue" } }).jpeg().toBuffer();
  assert.equal(await browserFrame(undefined, first), first);
});

test("browser JPEG is checked and normalized to the trusted frame geometry", async () => {
  const first = await sharp({ create: { width: 640, height: 360, channels: 3, background: "blue" } }).jpeg().toBuffer();
  const selected = await sharp({ create: { width: 320, height: 180, channels: 3, background: "red" } }).jpeg().toBuffer();
  const result = await browserFrame(selected.toString("base64"), first);
  const metadata = await sharp(result).metadata();
  assert.equal(metadata.width, 640);
  assert.equal(metadata.height, 360);
  const pixel = await sharp(result).raw().toBuffer();
  assert.ok(pixel[0] > pixel[2], "the selected red frame was used");
});

test("browser frame rejects another image type, excessive size and wrong geometry", async () => {
  const first = await sharp({ create: { width: 640, height: 360, channels: 3, background: "blue" } }).jpeg().toBuffer();
  const png = await sharp({ create: { width: 640, height: 360, channels: 3, background: "red" } }).png().toBuffer();
  const portrait = await sharp({ create: { width: 180, height: 320, channels: 3, background: "red" } }).jpeg().toBuffer();
  for (const input of [png.toString("base64"), portrait.toString("base64"), "a".repeat(MAX_JPEG_BYTES * 2)]) {
    await assert.rejects(browserFrame(input, first), (error) => error.status === 422 && error.details.field === "frameJpeg");
  }
});
