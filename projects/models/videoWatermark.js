const mongoose = require("mongoose");

// Watermark images of a project (D-60): uploaded or copied from the gallery
// (kind "image") or rendered from a text (kind "text", one record per text).
// The PNG lives in the owner's bucket at <project>/video_src/wm-<_id>.png.
const videoWatermarkSchema = new mongoose.Schema(
  {
    project_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    created_by: { type: mongoose.Schema.Types.ObjectId },
    kind: { type: String, enum: ["image", "text"], required: true },
    text_hash: { type: String },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { timestamps: true, collection: "video_watermarks" },
);

videoWatermarkSchema.index(
  { project_id: 1, text_hash: 1 },
  { unique: true, partialFilterExpression: { kind: "text" } },
);

module.exports = mongoose.model("videoWatermark", videoWatermarkSchema);
