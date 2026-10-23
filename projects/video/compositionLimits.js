const profiles = require("./profiles");

// Composition limits per profile (NFR-014, NFR-022, NFR-023, NFR-024, DQ-015):
// clips per concat counting every occurrence (UC-VID-013 RN2, FA2) and steps
// per chain counting sub-chains, concat and final steps (UC-VID-014 RN5).
const MAX_CLIPS = { free: 10, premium: 50 };
const MIN_CLIPS = 2;
const MAX_STEPS = 10;

function maxClips(profile) {
  return MAX_CLIPS[profile] ?? null;
}

// The result of a concat or chain has the duration limit of any video of the
// profile (UC-VID-013 RN3, UC-VID-014 exception 5).
function maxDurationMs(profile) {
  return profiles.limitsFor(profile)?.maxDurationMs ?? null;
}

module.exports = { MAX_CLIPS, MIN_CLIPS, MAX_STEPS, maxClips, maxDurationMs };
