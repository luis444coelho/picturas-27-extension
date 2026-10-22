// In-memory fakes for the video tasks of B003: a small Mongo-like collection
// (enough of find/updateOne/deleteMany/distinct for tasks.js and
// maintenance.js), the AMQP bus with video_control, and the quota.
const mongoose = require("mongoose");

const key = (value) => String(value);

// ObjectIds become hex strings: structuredClone would turn them into plain objects.
function normalize(value) {
  if (value == null || value instanceof Date) return value;
  if (value._bsontype === "ObjectId" || value._bsontype === "ObjectID")
    return value.toHexString();
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, normalize(v)]),
    );
  return value;
}

function getPath(doc, path) {
  return path
    .split(".")
    .reduce((value, k) => (value == null ? undefined : value[k]), doc);
}

function setPath(doc, path, value) {
  const keys = path.split(".");
  let target = doc;
  for (const k of keys.slice(0, -1)) {
    if (target[k] == null) target[k] = {};
    target = target[k];
  }
  target[keys[keys.length - 1]] = value;
}

const comparable = (v) => (v instanceof Date ? v.getTime() : v);
const same = (a, b) =>
  a instanceof Date || b instanceof Date
    ? comparable(a) === comparable(b)
    : a === b || (a != null && b != null && key(a) === key(b));

function matchCondition(value, cond) {
  if (
    cond &&
    typeof cond === "object" &&
    !(cond instanceof Date) &&
    !Array.isArray(cond) &&
    !cond._bsontype
  ) {
    return Object.entries(cond).every(([op, arg]) => {
      switch (op) {
        case "$in":
          return arg.some((a) => same(value, a));
        case "$ne":
          return !same(value, arg);
        case "$lt":
          return value != null && comparable(value) < comparable(arg);
        case "$exists":
          return arg ? value !== undefined : value === undefined;
        default:
          throw new Error(`fake: unsupported operator ${op}`);
      }
    });
  }
  if (cond === null) return value == null;
  return same(value, cond);
}

const matches = (doc, filter = {}) =>
  Object.entries(normalize(filter)).every(([path, cond]) =>
    matchCondition(getPath(doc, path), cond),
  );

function createCollection({ unique = [], now = () => new Date() } = {}) {
  const docs = new Map();
  const clone = (d) => (d ? structuredClone(d) : d);
  const query = (result) => ({ lean: async () => clone(result) });

  return {
    docs,
    all: () => [...docs.values()].map(clone),
    async create(doc) {
      const stored = normalize(structuredClone(normalize(doc)));
      stored._id = stored._id ?? new mongoose.Types.ObjectId();
      stored._id = key(stored._id);
      for (const field of unique) {
        if ([...docs.values()].some((d) => same(d[field], stored[field]))) {
          const err = new Error("E11000 duplicate key");
          err.code = 11000;
          throw err;
        }
      }
      if (docs.has(stored._id)) {
        const err = new Error("E11000 duplicate key");
        err.code = 11000;
        throw err;
      }
      stored.createdAt = stored.createdAt ?? now();
      stored.updatedAt = now();
      docs.set(stored._id, stored);
      return clone(stored);
    },
    find(filter) {
      return query([...docs.values()].filter((d) => matches(d, filter)));
    },
    findOne(filter) {
      return query([...docs.values()].find((d) => matches(d, filter)) || null);
    },
    findById(id) {
      return query(docs.get(key(id)) || null);
    },
    async updateOne(filter, update) {
      const doc = [...docs.values()].find((d) => matches(d, filter));
      if (!doc) return { modifiedCount: 0 };
      for (const [path, value] of Object.entries(update.$set || {}))
        setPath(doc, path, normalize(value));
      doc.updatedAt = now();
      return { modifiedCount: 1 };
    },
    async deleteOne(filter) {
      const doc = [...docs.values()].find((d) => matches(d, filter));
      if (!doc) return { deletedCount: 0 };
      docs.delete(key(doc._id));
      return { deletedCount: 1 };
    },
    async deleteMany(filter) {
      let deletedCount = 0;
      for (const doc of [...docs.values()]) {
        if (matches(doc, filter)) {
          docs.delete(key(doc._id));
          deletedCount += 1;
        }
      }
      return { deletedCount };
    },
    async distinct(field) {
      const values = new Map();
      for (const doc of docs.values()) {
        const v = getPath(doc, field);
        if (v != null) values.set(key(v), v);
      }
      return [...values.values()];
    },
  };
}

function createTaskBus({ failPublish = false, failControl = false } = {}) {
  return {
    operations: [],
    ws: [],
    control: [],
    async publishOperation(message) {
      if (failPublish) throw new Error("rabbit down");
      this.operations.push(structuredClone(message));
    },
    async publishWs(message) {
      this.ws.push(structuredClone(message));
    },
    async publishControl(message) {
      if (failControl) throw new Error("rabbit down");
      this.control.push(structuredClone(message));
    },
  };
}

// Quota of the users service, with the same outcomes as quota.js.
function createFakeQuota({
  credits = {},
  failReserve = false,
  failRefund = false,
} = {}) {
  const quota = {
    credits: { ...credits },
    reserves: [],
    refunds: [],
    failRefund,
    async reserve(runnerId, n) {
      quota.reserves.push([key(runnerId), n]);
      if (failReserve) throw new Error("users down");
      const left = quota.credits[key(runnerId)] ?? 5;
      if (left < n) return false;
      quota.credits[key(runnerId)] = left - n;
      return true;
    },
    async refund(runnerId, k) {
      if (quota.failRefund) throw new Error("users down");
      quota.refunds.push([key(runnerId), k]);
      quota.credits[key(runnerId)] = (quota.credits[key(runnerId)] ?? 5) + k;
    },
    async remaining(runnerId) {
      return quota.credits[key(runnerId)] ?? 5;
    },
  };
  return quota;
}

module.exports = { createCollection, createTaskBus, createFakeQuota };
