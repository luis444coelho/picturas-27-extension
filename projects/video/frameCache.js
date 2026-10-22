// Small in-memory cache bounded in size and time, least recently used first
// out (ADD T-07, D-64: 100 entries, 10 min). A Map keeps insertion order.
function createFrameCache({ max = 100, ttlMs = 10 * 60 * 1000, now = Date.now } = {}) {
  const entries = new Map();
  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (now() - entry.at > ttlMs) {
        entries.delete(key);
        return undefined;
      }
      entries.delete(key);
      entries.set(key, entry);
      return entry.value;
    },
    set(key, value) {
      entries.delete(key);
      entries.set(key, { value, at: now() });
      while (entries.size > max) entries.delete(entries.keys().next().value);
    },
    get size() {
      return entries.size;
    },
  };
}

module.exports = { createFrameCache };
