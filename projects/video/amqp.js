const amqp = require("amqplib");
const log = require("./log");

// AMQP module of the video flow (ADD T-03, D-08): one persistent connection,
// publishes to video_operations_queue and video_ws_queue and consumes
// video_project_queue with manual ack, only after the handler has stored the
// effect. It does not reuse utils/rabbit_mq.js, which acks before the async
// work ends and opens a connection per message. B003 extends it by addition.
const EXCHANGE = "picturas";
const QUEUES = {
  operations: "video_operations_queue",
  replies: "video_project_queue",
  ws: "video_ws_queue",
};
const RECONNECT_MS = 5000;
const REDELIVER_DELAY_MS = 5000;

const url = () =>
  `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASS}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;

let connection = null;
let channel = null;
let replyHandler = null;
let connecting = null;
let retry = null;

// One pending reconnection at a time, whoever asks for it (D-28).
function scheduleStart() {
  if (retry) return;
  retry = setTimeout(() => {
    retry = null;
    start();
  }, RECONNECT_MS);
}

async function connect() {
  const conn = await amqp.connect(url());
  connection = conn;
  conn.on("error", (err) =>
    log.error("video.amqp.connection_error", { message: err.message }),
  );
  conn.on("close", () => {
    if (connection === conn) {
      connection = null;
      channel = null;
    }
    log.warn("video.amqp.connection_closed", {});
    scheduleStart();
  });

  try {
    await setUp(conn);
  } catch (err) {
    // Half-open connection: closing it schedules the reconnection.
    conn.close().catch(() => undefined);
    throw err;
  }
  log.info("video.amqp.connected", {});
}

async function setUp(conn) {
  channel = await conn.createConfirmChannel();
  // A channel closed by the broker leaves the connection open: close it, so
  // the "close" handler above reconnects (D-28).
  channel.on("close", () => conn.close().catch(() => undefined));
  await channel.assertExchange(EXCHANGE, "direct", { durable: true });

  // The queues are declared in rabbitMQ/definitions.json with their arguments;
  // checkQueue avoids redeclaring them with different arguments.
  await channel.checkQueue(QUEUES.operations);
  await channel.checkQueue(QUEUES.replies);
  await channel.checkQueue(QUEUES.ws);

  if (replyHandler) await consumeReplies();
}

async function consumeReplies() {
  await channel.prefetch(1);
  await channel.consume(
    QUEUES.replies,
    async (msg) => {
      if (msg === null) return;
      const ch = channel;

      let body;
      try {
        body = JSON.parse(msg.content.toString());
      } catch (err) {
        log.error("video.amqp.invalid_reply", { message: err.message });
        ch.ack(msg);
        return;
      }

      try {
        await replyHandler(body, msg.properties.headers || {});
        ch.ack(msg);
      } catch (err) {
        // Effect not stored: give the message back after a pause.
        log.error("video.amqp.reply_failed", {
          correlationId: body.correlationId,
          videoId: body.videoId,
          message: err.message,
        });
        setTimeout(() => {
          try {
            ch.nack(msg, false, true);
          } catch (_) {
            // Channel already closed: the broker redelivers the message.
          }
        }, REDELIVER_DELAY_MS);
      }
    },
    { noAck: false },
  );
}

function start() {
  if (connecting) return connecting;
  connecting = connect()
    .catch((err) => {
      log.error("video.amqp.connect_failed", { message: err.message });
      scheduleStart();
    })
    .finally(() => {
      connecting = null;
    });
  return connecting;
}

function onReply(handler) {
  replyHandler = handler;
  if (channel)
    consumeReplies().catch((err) =>
      log.error("video.amqp.consume_failed", { message: err.message }),
    );
}

async function publish(queue, message) {
  if (!channel) throw new Error("RabbitMQ channel not available");
  channel.publish(EXCHANGE, queue, Buffer.from(JSON.stringify(message)), {
    persistent: true,
    contentType: "application/json",
  });
  await channel.waitForConfirms();
}

module.exports = {
  QUEUES,
  start,
  onReply,
  publishOperation: (message) => publish(QUEUES.operations, message),
  publishWs: (message) => publish(QUEUES.ws, message),
};

// B003 (ADD T-03, ADR-003): cancellations go to the fanout exchange
// video_control, declared in rabbitMQ/definitions.json. Added at the end of the
// module, without changing the code above.
const CONTROL_EXCHANGE = "video_control";

module.exports.CONTROL_EXCHANGE = CONTROL_EXCHANGE;
module.exports.publishControl = async (message) => {
  if (!channel) throw new Error("RabbitMQ channel not available");
  channel.publish(CONTROL_EXCHANGE, "", Buffer.from(JSON.stringify(message)), {
    contentType: "application/json",
  });
  await channel.waitForConfirms();
};
