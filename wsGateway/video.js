const amqp = require("amqplib");

// Video events (ADD T-00, T-03). Consumes video_ws_queue and emits once to the
// room of the user who started the work and to the project room, which the
// existing index.js already manages. Events carry only ids, status and error
// codes, never file names or URLs (accepted risk of the project room, T-03).
//
// Own connection that reconnects after a RabbitMQ restart (D-28), like
// projects/video/amqp.js; utils/rabbit_mq.js does not, and stays as it is.
const QUEUE = "video_ws_queue";
const RECONNECT_MS = 5000;

const url = () =>
  `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASS}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;

function log(level, event, fields = {}) {
  console.log(
    JSON.stringify({
      level,
      event,
      service: "ws_gateway",
      time: new Date().toISOString(),
      ...fields,
    }),
  );
}

function emit(io, msg) {
  let content;
  try {
    content = JSON.parse(msg.content.toString());
  } catch (e) {
    log("error", "video.ws.invalid_message");
    return;
  }

  if (content.event === "video-ingest-update") {
    const { userId, projectId, videoId, status, error } = content;
    if (!userId || !projectId || !videoId) return;

    const payload = { projectId, videoId, status };
    if (error?.code) payload.error = { code: error.code };

    io.to([userId, `project:${projectId}`]).emit(
      "video-ingest-update",
      payload,
    );
  }
}

module.exports = function (io) {
  let retry = null;

  const reconnect = () => {
    if (retry) return;
    retry = setTimeout(() => {
      retry = null;
      start();
    }, RECONNECT_MS);
  };

  async function connect() {
    const connection = await amqp.connect(url());
    connection.on("error", (err) =>
      log("error", "video.ws.connection_error", { message: err.message }),
    );
    connection.on("close", () => {
      log("warn", "video.ws.connection_closed");
      reconnect();
    });

    const channel = await connection.createChannel();
    // A channel closed by the broker leaves the connection open: close it,
    // so the "close" handler above reconnects.
    channel.on("close", () => connection.close().catch(() => undefined));

    // Declared in rabbitMQ/definitions.json with its arguments.
    await channel.checkQueue(QUEUE);
    await channel.consume(
      QUEUE,
      (msg) => {
        if (msg === null) return;
        emit(io, msg);
        channel.ack(msg);
      },
      { noAck: false },
    );
    log("info", "video.ws.connected");
  }

  function start() {
    connect().catch((err) => {
      log("error", "video.ws.connect_failed", { message: err.message });
      reconnect();
    });
  }

  start();
};
