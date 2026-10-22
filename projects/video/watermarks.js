const crypto = require("crypto");
const mongoose = require("mongoose");
const sharp = require("sharp");
const { createFrameCache } = require("./frameCache");
const { VideoError, MESSAGES } = require("./errors");

// Watermark marks (D-59 to D-61, ADR-010). Texts are rendered here with sharp
// (pango, DejaVu Sans already in the image) and overlaid by the worker as
// images, so measurement, preview and result share one PNG.
MESSAGES.INVALID_WATERMARK_CONTENT =
  "A marca de água está vazia ou a imagem não é um PNG ou JPEG válido.";

const TEXT_FONT = "DejaVu Sans";
const TEXT_DPI = 1000; // large render, always reduced by the overlay scale
const TEXT_MAX = 100;
const MAX_BYTES = 1024 * 1024; // D-60: nginx default body limit
const MAX_SIDE = 4096;
const FORMATS = ["png", "jpeg"];

const escapeMarkup = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const markName = (id) => `wm-${id}.png`;

function createWatermarks({ VideoWatermark, files, cache = createFrameCache() }) {
  const hashOf = (text) =>
    crypto.createHash("sha256").update(`v1|${TEXT_FONT}|${TEXT_DPI}|${text}`).digest("hex");

  async function renderText(text) {
    const hash = hashOf(text);
    const cached = cache.get(`text:${hash}`);
    if (cached) return cached;
    const png = await sharp({
      text: {
        text: `<span foreground="white">${escapeMarkup(text)}</span>`,
        font: TEXT_FONT,
        dpi: TEXT_DPI,
        rgba: true,
      },
    })
      .png()
      .toBuffer();
    const { width, height } = await sharp(png).metadata();
    const rendered = { hash, png, width, height };
    cache.set(`text:${hash}`, rendered);
    return rendered;
  }

  const target = (project, id) => ({
    userId: String(project.user_id),
    projectId: String(project._id),
    stage: "video_src",
    name: markName(id),
  });

  // One record per project and text; the PNG is written before the record is
  // visible to the cleanup, and a concurrent duplicate reuses the winner.
  async function storeText(project, rendered, callerId) {
    const found = await VideoWatermark.findOne({
      project_id: project._id,
      kind: "text",
      text_hash: rendered.hash,
    }).lean();
    if (found) return found;
    const id = new mongoose.Types.ObjectId();
    await files.writeBytes(target(project, id), rendered.png, "image/png");
    try {
      const created = await VideoWatermark.create({
        _id: id,
        project_id: project._id,
        owner_id: project.user_id,
        created_by: callerId,
        kind: "text",
        text_hash: rendered.hash,
        width: rendered.width,
        height: rendered.height,
      });
      return created.toObject();
    } catch (err) {
      if (err.code !== 11000) throw err;
      return VideoWatermark.findOne({
        project_id: project._id,
        kind: "text",
        text_hash: rendered.hash,
      }).lean();
    }
  }

  // parameters._mark for a watermark step, or null when the content is
  // missing or not found (the operation then answers INVALID_WATERMARK_CONTENT).
  async function resolve(project, parameters, { store, callerId }) {
    if (parameters.type === "text") {
      const text = typeof parameters.text === "string" ? parameters.text.trim() : "";
      if (!text || text.length > TEXT_MAX) return null;
      const rendered = await renderText(text);
      if (!store) return { width: rendered.width, height: rendered.height };
      const record = await storeText(project, rendered, callerId);
      return { watermarkId: String(record._id), width: record.width, height: record.height };
    }
    if (parameters.type === "image") {
      if (!mongoose.isValidObjectId(parameters.watermarkId)) return null;
      const record = await VideoWatermark.findOne({
        _id: parameters.watermarkId,
        project_id: project._id,
        kind: "image",
      }).lean();
      if (!record) return null;
      return { watermarkId: String(record._id), width: record.width, height: record.height };
    }
    return null;
  }

  // PNG bytes of a resolved mark, for the watermark preview (D-62).
  async function markPng(project, parameters) {
    if (parameters.type === "text")
      return (await renderText(parameters.text.trim())).png;
    const key = `mark:${parameters.watermarkId}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const png = await files.readBytes(target(project, parameters.watermarkId));
    cache.set(key, png);
    return png;
  }

  // POST …/videos/watermarks (D-60): PNG or JPEG up to 4096 px, stored
  // normalized as an RGBA PNG. The 1 MB limit is for local files, which pass
  // nginx; gallery images are read inside the services.
  async function createFromImage(project, buffer, callerId, { maxBytes = MAX_BYTES } = {}) {
    const invalid = (reason) =>
      new VideoError(422, "INVALID_WATERMARK_CONTENT", {
        field: "file",
        reason,
        maxBytes,
        maxSide: MAX_SIDE,
      });
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw invalid("empty");
    if (maxBytes && buffer.length > maxBytes) throw invalid("too_large");
    let meta;
    try {
      meta = await sharp(buffer).metadata();
    } catch {
      throw invalid("unreadable");
    }
    if (!FORMATS.includes(meta.format)) throw invalid("format");
    if (meta.width > MAX_SIDE || meta.height > MAX_SIDE) throw invalid("dimensions");
    let png;
    try {
      png = await sharp(buffer).rotate().ensureAlpha().png().toBuffer();
    } catch {
      throw invalid("unreadable");
    }
    const { width, height } = await sharp(png).metadata();
    const id = new mongoose.Types.ObjectId();
    await files.writeBytes(target(project, id), png, "image/png");
    const record = await VideoWatermark.create({
      _id: id,
      project_id: project._id,
      owner_id: project.user_id,
      created_by: callerId,
      kind: "image",
      width,
      height,
    });
    return { watermarkId: String(record._id), width, height };
  }

  return { renderText, resolve, markPng, createFromImage, target, MAX_BYTES };
}

module.exports = { createWatermarks, markName, MAX_BYTES, TEXT_MAX };
