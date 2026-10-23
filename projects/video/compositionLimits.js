const profiles = require("./profiles");

// Composition limits (D-86): no fixed number of steps per chain nor of clips
// per concat, for any profile. What remains: at least two clips in a concat
// (CONCAT-005) and the duration limit of the profile for the result of a
// concat or chain (UC-VID-013 RN3, UC-VID-014 exception 5, D-81).
const MIN_CLIPS = 2;

function maxDurationMs(profile) {
  return profiles.limitsFor(profile)?.maxDurationMs ?? null;
}

module.exports = { MIN_CLIPS, maxDurationMs };
