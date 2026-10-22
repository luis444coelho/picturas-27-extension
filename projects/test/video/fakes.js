// In-memory fakes of the ingestion ports (Mongoose model, storage, bus, users).

function getPath(doc, path) {
  return path
    .split(".")
    .reduce((value, key) => (value == null ? undefined : value[key]), doc);
}

function matches(doc, filter) {
  return Object.entries(filter).every(([path, expected]) => {
    const value = getPath(doc, path);
    if (
      expected &&
      typeof expected === "object" &&
      !Array.isArray(expected) &&
      !expected._bsontype
    ) {
      if ("$exists" in expected)
        return expected.$exists ? value !== undefined : value === undefined;
      if ("$in" in expected) return expected.$in.includes(value);
    }
    return String(value) === String(expected);
  });
}

function setPath(doc, path, value) {
  const keys = path.split(".");
  let target = doc;
  for (const key of keys.slice(0, -1)) {
    if (target[key] == null) target[key] = {};
    target = target[key];
  }
  target[keys[keys.length - 1]] = value;
}

function createVideoModel() {
  const docs = new Map();
  const clone = (doc) => (doc ? structuredClone(doc) : doc);

  return {
    docs,
    async create(doc) {
      const stored = structuredClone({ ...doc, _id: String(doc._id) });
      docs.set(String(doc._id), stored);
      return clone(stored);
    },
    findById(id) {
      return { lean: async () => clone(docs.get(String(id)) || null) };
    },
    async updateOne(filter, update) {
      const doc = docs.get(String(filter._id));
      if (!doc || !matches(doc, filter)) return { modifiedCount: 0 };
      for (const [path, value] of Object.entries(update.$set || {}))
        setPath(doc, path, structuredClone(value));
      return { modifiedCount: 1 };
    },
    async deleteOne(filter) {
      return { deletedCount: docs.delete(String(filter._id)) ? 1 : 0 };
    },
  };
}

function createStorage({ head = null, failWriteUrl = false } = {}) {
  const real = require("../../video/storage");
  const storage = {
    removed: [],
    buckets: [],
    headResult: head,
    URL_EXPIRES: real.URL_EXPIRES,
    objectKey: real.objectKey,
    parseKey: real.parseKey,
    async ensureBucket(ownerId) {
      storage.buckets.push(String(ownerId));
    },
    async publicWriteUrl(target, contentType) {
      if (failWriteUrl) throw new Error("storage down");
      return `https://localhost:8080/s3-video/user-${target.userId}/${target.projectId}/${target.stage}/${target.name}?ct=${contentType}`;
    },
    async head() {
      return storage.headResult;
    },
    async remove(target) {
      storage.removed.push(
        `${target.projectId}/${target.stage}/${target.name}`,
      );
    },
  };
  return storage;
}

function createBus({ failPublish = false } = {}) {
  return {
    operations: [],
    ws: [],
    async publishOperation(message) {
      if (failPublish) throw new Error("rabbit down");
      this.operations.push(message);
    },
    async publishWs(message) {
      this.ws.push(message);
    },
  };
}

function createUsers(types) {
  return { getUserType: async (id) => types[String(id)] ?? null };
}

const silentLog = { info() {}, warn() {}, error() {} };

module.exports = {
  createVideoModel,
  createStorage,
  createBus,
  createUsers,
  silentLog,
};
