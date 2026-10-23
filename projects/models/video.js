const mongoose = require("mongoose");
const formats = require("../video/formats");

// Video resources live in their own collection, apart from project.imgs (ADD T-00).
// queued/processing/failed only apply to ingestion; failed is short-lived (D-12).
const recipeStepSchema = new mongoose.Schema(
  {
    operation: { type: String, required: true },
    version: { type: Number, required: true },
    parameters: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const videoSchema = new mongoose.Schema(
  {
    project_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, required: true },
    original_name: { type: String, required: true },
    mime_type: { type: String, required: true },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      required: true,
    },
    storage: {
      original_key: { type: String, required: true },
      preview_key: { type: String },
      thumb_key: { type: String },
      first_frame_key: { type: String },
    },
    meta: {
      container: { type: String },
      video_codec: { type: String },
      // null means the video has no audio; absent means it was not obtained.
      audio_codec: { type: String, default: undefined },
      width: { type: Number },
      height: { type: Number },
      rotation: { type: Number },
      display_width: { type: Number },
      display_height: { type: Number },
      fps_num: { type: Number },
      fps_den: { type: Number },
      duration_ms: { type: Number },
      size_bytes: { type: Number },
      bitrate: { type: Number },
    },
    source_video_ids: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    recipe: { type: [recipeStepSchema], default: [] },
    task_id: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true, minimize: false },
);

videoSchema.index({ project_id: 1, status: 1, createdAt: -1 });
videoSchema.index({ status: 1, updatedAt: 1 });

// Result names reflect the stored container; ingestion and saved records keep theirs (D-75).
videoSchema.pre("validate", function () {
  if (!this.isNew || !this.task_id) return;
  const extension = formats.CONTAINERS[this.meta?.container]?.extension;
  if (!extension || !this.original_name) return;
  const name = this.original_name;
  const dot = name.lastIndexOf(".");
  this.original_name = `${dot > 0 ? name.slice(0, dot) : name}${extension}`;
});

module.exports = mongoose.model("video", videoSchema);
