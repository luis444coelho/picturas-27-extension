const mongoose = require("mongoose");

// Video chain presets (ADD 4.9, CHAIN-014, D-83): owned by one user, never
// shared, without concat. A new collection, so the image presets (preset.js)
// and their dialog never see video chains (rule 2.6).
const stepSchema = new mongoose.Schema(
  {
    operation: { type: String, required: true },
    version: { type: Number, required: true },
    parameters: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const videoPresetSchema = new mongoose.Schema(
  {
    owner_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    // Lower-case name: unique per owner regardless of case (D-83).
    name_key: { type: String, required: true },
    steps: { type: [stepSchema], default: [] },
  },
  { timestamps: true, minimize: false },
);

videoPresetSchema.index({ owner_id: 1, name_key: 1 }, { unique: true });

module.exports = mongoose.model("videoPreset", videoPresetSchema);
