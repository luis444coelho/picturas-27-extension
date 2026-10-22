const mongoose = require("mongoose");

// Active-task slot of a project (ADD T-03, NFR-021): at most one document per
// project, enforced by the unique index on project_id. It lives outside the
// project document, so updateIfVersion cannot reset it. Only video tasks hold
// it (D-38); there is no holder_kind "batch" (D-06).
const videoProjectLockSchema = new mongoose.Schema(
  {
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    holder_kind: { type: String, enum: ["task"], required: true },
    holder_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "video_project_locks",
  },
);

videoProjectLockSchema.index({ createdAt: 1 });

module.exports = mongoose.model("videoProjectLock", videoProjectLockSchema);
