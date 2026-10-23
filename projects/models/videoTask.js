const mongoose = require("mongoose");

// Video task (ADD T-03). Its _id is the holder_id of the project's active-task
// slot and becomes the _id of the result video (ADR-005). Besides the fields of
// T-03 it keeps refund, plan, published_at and status_changed_at (ADR-004, D-41,
// D-45). No batch fields (D-06).
const STATUSES = ["queued", "processing", "completed", "failed", "cancelled"];
const ACTIVE_STATUSES = ["queued", "processing"];

const stepSchema = new mongoose.Schema(
  {
    operation: { type: String, required: true },
    version: { type: Number, required: true },
    parameters: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const errorSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    message: { type: String },
    phase: { type: String }, // D-82, ADR-019: download | encode | upload
  },
  { _id: false },
);

const videoTaskSchema = new mongoose.Schema(
  {
    project_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    runner_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    kind: { type: String, enum: ["single", "chain", "concat"], required: true },
    steps: { type: [stepSchema], default: [] },
    input_video_ids: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    status: { type: String, enum: STATUSES, required: true },
    step: { type: Number, default: 1 },
    total_steps: { type: Number, required: true },
    progress: { type: Number, default: 0 },
    cost: { type: Number, required: true },
    reserved_credits: { type: Number, required: true },
    refund: {
      state: {
        type: String,
        enum: ["none", "pending", "done"],
        default: "none",
      },
      at: { type: Date, default: null },
    },
    correlation_id: { type: String },
    result_video_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    error: { type: errorSchema, default: null },
    plan: { type: mongoose.Schema.Types.Mixed },
    published_at: { type: Date, default: null },
    status_changed_at: { type: Date, required: true },
  },
  { timestamps: true, minimize: false },
);

videoTaskSchema.index({ project_id: 1, status: 1 });
videoTaskSchema.index({ status: 1, status_changed_at: 1 });
videoTaskSchema.index({ status: 1, published_at: 1 });
videoTaskSchema.index({ "refund.state": 1, updatedAt: 1 });

module.exports = mongoose.model("videoTask", videoTaskSchema);
module.exports.STATUSES = STATUSES;
module.exports.ACTIVE_STATUSES = ACTIVE_STATUSES;
