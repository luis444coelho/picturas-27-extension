// Test operation of D-37: re-encodes the video in the working format with no
// filters, so the whole task flow (acceptance, progress, cancellation, quota)
// can be verified before the real operations arrive (B004+). Registered only
// with VIDEO_TEST_OPERATIONS=1, which docker-compose.yaml does not set.
module.exports = {
  name: "test_reencode",
  versions: [1],

  cost() {
    return 1;
  },

  validate(parameters) {
    return Object.keys(parameters).map((field) => ({
      code: "INVALID_STEP_PARAMS",
      field,
    }));
  },

  // The step itself changes nothing; the effects of encoding (rotation applied,
  // even dimensions, working format) are added by the plan (plan.js).
  estimate(inputProps) {
    return { ...inputProps };
  },

  copyable() {
    return { video: false, audio: false };
  },
};
