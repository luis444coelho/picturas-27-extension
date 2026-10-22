const sharp = require("sharp");
const catalog = require("./filters.json");
const { normalize } = require("./operations/visualSteps");

// Static previews with sharp (ADD T-07, NFR-015). sharp applies operations in
// a fixed internal order and repeated calls replace each other, so every sharp
// operation runs in a pass of its own over raw bytes.
const STATIC = ["adjust", "filter", "resize", "orient"];
const MAX_WIDTH = 1280;
const QUALITY = 85; // D-64
const THUMB_WIDTH = 160; // D-64

const raw = (image) =>
  sharp(image.data, {
    raw: {
      width: image.info.width,
      height: image.info.height,
      channels: image.info.channels,
    },
  });

const pass = async (image, apply) =>
  apply(raw(image)).raw().toBuffer({ resolveWithObject: true });

async function decode(buffer) {
  return sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
}

// Passes of one step, in the order of the FFmpeg filters of the worker.
function passesOf(step, image) {
  const p = step.parameters || {};
  switch (step.operation) {
    case "adjust": {
      const passes = [];
      const brightness = normalize(p.brightness, 0.05);
      const contrast = normalize(p.contrastFactor, 0.05);
      const saturation = normalize(p.saturationFactor, 0.05);
      if (brightness !== 1) passes.push((s) => s.linear(brightness, 0));
      if (contrast !== 1)
        passes.push((s) => s.linear(contrast, 128 * (1 - contrast)));
      if (saturation !== 1) passes.push((s) => s.modulate({ saturation }));
      return passes;
    }
    case "filter": {
      const entry = catalog.find((e) => e.id === p.filter);
      return [entry.type === "invert" ? (s) => s.negate({ alpha: false }) : (s) => s.recomb(entry.matrix)];
    }
    case "resize": {
      // Only the target proportion, never enlarging the reduced frame (T-07).
      const width = Math.min(image.info.width, p.width, MAX_WIDTH);
      const height = Math.max(1, Math.round((width * p.height) / p.width));
      return [(s) => s.resize(width, height, { fit: "fill" })];
    }
    case "orient": {
      const passes = [];
      if (p.rotation) passes.push((s) => s.rotate(p.rotation));
      if (p.flipH || p.flipV)
        passes.push((s) => {
          let next = s;
          if (p.flipH) next = next.flop();
          if (p.flipV) next = next.flip();
          return next;
        });
      return passes;
    }
    default:
      return [];
  }
}

async function applySteps(image, steps) {
  let current = image;
  for (const step of steps) {
    for (const apply of passesOf(step, current)) current = await pass(current, apply);
  }
  return current;
}

async function encode(image) {
  return raw(image).jpeg({ quality: QUALITY }).toBuffer();
}

// Bytes of the first frame with the static steps applied (the others ignored).
async function render(frame, steps) {
  const image = await applySteps(await decode(frame), steps.filter((s) => STATIC.includes(s.operation)));
  return encode(image);
}

// FILTER-002: the six catalog filters on the reduced first frame, in one answer.
async function thumbnails(frame) {
  const small = await pass(await decode(frame), (s) => s.resize({ width: THUMB_WIDTH }));
  const result = [];
  for (const entry of catalog) {
    const image = await applySteps(small, [
      { operation: "filter", parameters: { filter: entry.id } },
    ]);
    result.push({
      filter: entry.id,
      label: entry.label,
      contentType: "image/jpeg",
      data: (await encode(image)).toString("base64"),
    });
  }
  return result;
}

// D-62: the mark composed on the first frame with the same box as the worker.
// The frame is the presentation frame reduced to at most 1280 px (T-07).
async function watermark(frame, markPng, box, opacity) {
  const image = await decode(frame);
  const k = image.info.width / box.frameWidth;
  const width = Math.max(1, Math.min(image.info.width, Math.round(box.width * k)));
  const height = Math.max(1, Math.min(image.info.height, Math.round(box.height * k)));
  const left = Math.min(Math.max(0, Math.round(box.x * k)), image.info.width - width);
  const top = Math.min(Math.max(0, Math.round(box.y * k)), image.info.height - height);
  const mark = await sharp(markPng)
    .ensureAlpha()
    .resize(width, height, { fit: "fill" })
    .linear([1, 1, 1, opacity], [0, 0, 0, 0])
    .png()
    .toBuffer();
  return raw(image)
    .composite([{ input: mark, left, top }])
    .jpeg({ quality: QUALITY })
    .toBuffer();
}

module.exports = { STATIC, MAX_WIDTH, render, thumbnails, watermark, applySteps, decode };
