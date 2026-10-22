// Upload limits per profile (RN4, NFR-008), in base 1024 (D-22).
const MB = 1024 ** 2;
const GB = 1024 ** 3;
const MINUTE_MS = 60 * 1000;

const LIMITS = {
  free: { maxBytes: 200 * MB, maxDurationMs: 5 * MINUTE_MS },
  premium: { maxBytes: 2 * GB, maxDurationMs: 60 * MINUTE_MS },
};

// null for anonymous or unknown profiles, which have no access to video (RN1).
function limitsFor(userType) {
  return LIMITS[userType] || null;
}

function checkSize(sizeBytes, limits) {
  if (sizeBytes > limits.maxBytes) {
    return {
      code: "LIMIT_EXCEEDED",
      details: { field: "size", limit: limits.maxBytes, total: sizeBytes },
    };
  }
  return null;
}

function checkDuration(durationMs, limits) {
  if (durationMs > limits.maxDurationMs) {
    return {
      code: "LIMIT_EXCEEDED",
      details: {
        field: "duration",
        limit: limits.maxDurationMs,
        total: durationMs,
      },
    };
  }
  return null;
}

module.exports = { LIMITS, limitsFor, checkSize, checkDuration };
