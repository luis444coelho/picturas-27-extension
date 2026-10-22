const axios = require("axios");

const Video = require("../models/video");
const VideoTask = require("../models/videoTask");
const VideoProjectLock = require("../models/videoProjectLock");
const Project = require("../models/project");
const { httpsAgent } = require("../utils/httpsAgent");

const amqp = require("./amqp");
const storage = require("./storage");
const users = require("./users");
const log = require("./log");
const { ingest } = require("./index");
const { registry } = require("./operations");
const { createLocks } = require("./locks");
const { createQuota } = require("./quota");
const { createTasks, OPERATION } = require("./tasks");
const { createMaintenance } = require("./maintenance");

// Wiring of the video tasks of B003. The router and start() share one instance,
// so the per-runner reservation queue (ADD T-04) is the same everywhere.
const USERS_MS = process.env.USERS_MS || "https://users:10001/";

const locks = createLocks({ Lock: VideoProjectLock });
const quota = createQuota({ http: axios, usersUrl: USERS_MS, httpsAgent });
const tasks = createTasks({
  VideoTask,
  Video,
  locks,
  quota,
  bus: amqp,
  users,
  storage,
  registry,
  log,
});
const maintenance = createMaintenance({
  VideoTask,
  Video,
  Lock: VideoProjectLock,
  Project,
  tasks,
  storage,
  log,
});

// video_project_queue has a single consumer (amqp.js) with a single handler:
// task messages go to the tasks, everything else to the ingestion of B001.
function dispatch(body, headers) {
  if (body?.operation === OPERATION) return tasks.handleReply(body, headers);
  return ingest.handleReply(body, headers);
}

// Called right after require("./video").start(), while the AMQP connection is
// still being opened, so the consumer is created once, with this handler.
function start() {
  amqp.onReply(dispatch);
  // The slot relies on the unique index on project_id: make sure it exists.
  VideoProjectLock.init().catch((err) =>
    log.error("video.tasks.lock_index_failed", { message: err.message }),
  );
  maintenance.start();
  log.info("video.tasks.started", {
    operations: registry.names(),
  });
}

module.exports = { tasks, maintenance, start, dispatch };
