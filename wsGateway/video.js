const { read_rabbit_msg } = require("./utils/rabbit_mq.js");

// Video events (ADD T-00, T-03). Consumes video_ws_queue and emits once to the
// room of the user who started the work and to the project room, which the
// existing index.js already manages. Events carry only ids, status and error
// codes, never file names or URLs (accepted risk of the project room, T-03).
module.exports = function (io) {
  read_rabbit_msg("video_ws_queue", (msg) => {
    let content;
    try {
      content = JSON.parse(msg.content.toString());
    } catch (e) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "video.ws.invalid_message",
          service: "ws_gateway",
        }),
      );
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
  });
};
