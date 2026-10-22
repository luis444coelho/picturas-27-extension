const Video = require("../models/video");
const amqp = require("./amqp");
const storage = require("./storage");
const users = require("./users");
const log = require("./log");
const { createIngest } = require("./ingest");

// Wiring of the video module of the projects service.
const ingest = createIngest({ Video, storage, bus: amqp, users, log });

function start() {
  amqp.onReply(ingest.handleReply);
  amqp.start();
}

module.exports = { ingest, start };
