const crypto = require("crypto");
const mongoose = require("mongoose");
const formats = require("./formats");
const profiles = require("./profiles");
const display = require("./display");
const { VideoError } = require("./errors");

// Ingestion orchestrator (UC-VID-000; ADR-001, ADR-002). The upload goes straight
// to storage with a presigned PUT; the confirmation starts two trips to the
// worker: ingest.probe (metadata), then ingest.derive (thumbnail, frame 0 and
// MP4 preview copy when needed). Ports are injected for testing.
function createIngest({ Video, storage, bus, users, log }) {
  async function requireLimits(userId) {
    const type = await users.getUserType(String(userId));
    const limits = profiles.limitsFor(type);
    if (!limits) throw new VideoError(403, "FORBIDDEN");
    return limits;
  }

  function messageBase(video, correlationId) {
    return {
      messageId: crypto.randomUUID(),
      correlationId,
      timestamp: new Date().toISOString(),
      videoId: String(video._id),
      source: storage.parseKey(video.owner_id, video.storage.original_key),
    };
  }

  async function notify(video, status, correlationId, code) {
    const event = {
      event: "video-ingest-update",
      correlationId,
      userId: String(video.created_by),
      projectId: String(video.project_id),
      videoId: String(video._id),
      status,
    };
    if (code) event.error = { code };

    try {
      await bus.publishWs(event);
    } catch (err) {
      // A lost notification does not undo the stored state; the gallery reloads it.
      log.error("video.ingest.notify_failed", {
        correlationId,
        videoId: event.videoId,
        message: err.message,
      });
    }
  }

  function videoKeys(video) {
    return [
      video.storage?.original_key,
      video.storage?.preview_key,
      video.storage?.thumb_key,
      video.storage?.first_frame_key,
    ].filter(Boolean);
  }

  // Objects first, then the record, so no object is left without a record
  // that points to it (I7).
  async function purge(video, extraKeys = []) {
    const keys = new Set([...videoKeys(video), ...extraKeys]);
    for (const key of keys) {
      await storage.remove(storage.parseKey(video.owner_id, key));
    }
    await Video.deleteOne({ _id: video._id });
  }

  // D-12: failed is short-lived. Store it, tell the client, then clean up.
  async function fail(video, code, details, correlationId, extraKeys = []) {
    await Video.updateOne(
      { _id: video._id, status: { $in: ["queued", "processing"] } },
      { $set: { status: "failed" } },
    );
    log.warn("video.ingest.failed", {
      correlationId,
      videoId: String(video._id),
      userId: String(video.created_by),
      code,
      details,
    });
    await notify(video, "failed", correlationId, code);
    await purge(video, extraKeys);
  }

  async function requestUpload({
    ownerId,
    projectId,
    callerId,
    fileName,
    mimeType,
    sizeBytes,
    correlationId,
  }) {
    if (
      typeof fileName !== "string" ||
      fileName.trim() === "" ||
      typeof mimeType !== "string"
    ) {
      throw new VideoError(422, "INVALID_REQUEST", { field: "fileName" });
    }
    if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
      throw new VideoError(422, "INVALID_REQUEST", { field: "sizeBytes" });
    }

    const limits = await requireLimits(callerId);

    const container = formats.containerFromUpload(fileName, mimeType);
    if (!container) {
      throw new VideoError(422, "UNSUPPORTED_FORMAT", {
        extension: formats.extensionOf(fileName),
        mimeType,
      });
    }

    const sizeError = profiles.checkSize(sizeBytes, limits);
    if (sizeError) throw new VideoError(422, sizeError.code, sizeError.details);

    const videoId = new mongoose.Types.ObjectId();
    const name = `${videoId}${formats.CONTAINERS[container].extension}`;
    const target = {
      userId: String(ownerId),
      projectId: String(projectId),
      stage: "video_src",
      name,
    };

    await storage.ensureBucket(ownerId);

    // queued = waiting for the upload (D-15). The declared size is kept in
    // meta.size_bytes until the probe replaces it with the real one.
    const video = await Video.create({
      _id: videoId,
      project_id: projectId,
      owner_id: ownerId,
      created_by: callerId,
      original_name: fileName.trim(),
      mime_type: mimeType,
      status: "queued",
      storage: {
        original_key: storage.objectKey(projectId, "video_src", name),
      },
      meta: { size_bytes: sizeBytes },
    });

    let url;
    try {
      url = await storage.publicWriteUrl(target, mimeType);
    } catch (err) {
      await Video.deleteOne({ _id: videoId });
      throw err;
    }
    log.info("video.upload.url_issued", {
      correlationId,
      videoId: String(videoId),
      userId: String(callerId),
    });

    return {
      videoId: String(video._id),
      upload: {
        url,
        method: "PUT",
        headers: { "Content-Type": mimeType },
        expiresIn: storage.URL_EXPIRES,
      },
    };
  }

  function requireUploader(video, callerId) {
    if (String(video.created_by) !== String(callerId))
      throw new VideoError(403, "FORBIDDEN");
    if (video.status !== "queued")
      throw new VideoError(409, "INVALID_STATE", { status: video.status });
  }

  async function completeUpload({ video, callerId, correlationId }) {
    requireUploader(video, callerId);

    const source = storage.parseKey(video.owner_id, video.storage.original_key);
    const head = await storage.head(source);
    if (!head) {
      await purge(video);
      throw new VideoError(422, "UPLOAD_ABORTED");
    }

    const limits = await requireLimits(callerId);
    const sizeError = profiles.checkSize(head.contentLength, limits);
    if (sizeError) {
      await purge(video);
      throw new VideoError(422, sizeError.code, sizeError.details);
    }
    if (head.contentLength !== video.meta?.size_bytes) {
      await purge(video);
      throw new VideoError(422, "UPLOAD_ABORTED", {
        declared: video.meta?.size_bytes,
        received: head.contentLength,
      });
    }

    const moved = await Video.updateOne(
      { _id: video._id, status: "queued" },
      { $set: { status: "processing" } },
    );
    if (moved.modifiedCount !== 1) throw new VideoError(409, "INVALID_STATE");

    try {
      await bus.publishOperation({
        ...messageBase(video, correlationId),
        operation: "ingest.probe",
      });
    } catch (err) {
      log.error("video.ingest.publish_failed", {
        correlationId,
        videoId: String(video._id),
        message: err.message,
      });
      await fail(video, "INTERNAL_ERROR", {}, correlationId);
      throw new VideoError(502, "INTERNAL_ERROR");
    }

    log.info("video.upload.completed", {
      correlationId,
      videoId: String(video._id),
      userId: String(callerId),
    });
    await notify(video, "processing", correlationId);
    return { videoId: String(video._id), status: "processing" };
  }

  async function cancelUpload({ video, callerId, correlationId }) {
    requireUploader(video, callerId);
    await purge(video);
    log.info("video.upload.cancelled", {
      correlationId,
      videoId: String(video._id),
      userId: String(callerId),
    });
  }

  async function handleProbe(video, reply) {
    const correlationId = reply.correlationId;
    if (video.meta?.container) return; // redelivered reply, already handled

    if (reply.status !== "success") {
      const code =
        reply.error?.code === "CORRUPTED_FILE"
          ? "CORRUPTED_FILE"
          : "PROCESSING_ERROR";
      log.error("video.ingest.probe_error", {
        correlationId,
        videoId: String(video._id),
        cause: reply.error?.message,
      });
      return fail(video, code, {}, correlationId);
    }

    const probed = reply.output.meta;
    const stream = reply.output.stream || {};

    const container = formats.containerFromProbe(
      probed.formatName,
      probed.majorBrand,
    );
    if (!container)
      return fail(
        video,
        "UNSUPPORTED_FORMAT",
        { formatName: probed.formatName },
        correlationId,
      );

    const audioCodec = probed.audioCodec ?? null;
    const codecError = formats.validateStreams(
      container,
      probed.videoCodec,
      audioCodec,
    );
    if (codecError)
      return fail(video, codecError.code, codecError.details, correlationId);

    const limits = profiles.limitsFor(
      await users.getUserType(String(video.created_by)),
    );
    if (!limits) return fail(video, "FORBIDDEN", {}, correlationId);

    const limitError =
      profiles.checkDuration(probed.durationMs, limits) ||
      profiles.checkSize(probed.sizeBytes, limits);
    if (limitError)
      return fail(video, limitError.code, limitError.details, correlationId);

    const { displayWidth, displayHeight } = display.displayDimensions(
      probed.width,
      probed.height,
      probed.rotation,
    );
    const meta = {
      container,
      video_codec: probed.videoCodec,
      audio_codec: audioCodec,
      width: probed.width,
      height: probed.height,
      rotation: probed.rotation,
      display_width: displayWidth,
      display_height: displayHeight,
      fps_num: probed.fpsNum,
      fps_den: probed.fpsDen,
      duration_ms: probed.durationMs,
      size_bytes: probed.sizeBytes,
      bitrate: probed.bitrate,
    };

    const stored = await Video.updateOne(
      {
        _id: video._id,
        status: "processing",
        "meta.container": { $exists: false },
      },
      { $set: { meta, mime_type: formats.CONTAINERS[container].mimeType } },
    );
    if (stored.modifiedCount !== 1) return;

    const id = String(video._id);
    const preview = formats.previewPlan(
      container,
      probed.videoCodec,
      audioCodec,
      stream.pixFmt,
    );
    const targets = {
      thumb: { stage: "video_thumb", name: `${id}.thumb.jpg` },
      firstFrame: { stage: "video_thumb", name: `${id}.frame0.jpg` },
    };
    if (preview)
      targets.preview = { stage: "video_preview", name: `${id}.mp4` };

    for (const target of Object.values(targets)) {
      target.userId = String(video.owner_id);
      target.projectId = String(video.project_id);
    }

    await bus.publishOperation({
      ...messageBase(video, correlationId),
      operation: "ingest.derive",
      plan: {
        thumbnailAtMs: display.thumbnailAtMs(probed.durationMs),
        thumbnailMaxWidth: display.THUMBNAIL_MAX_WIDTH,
        firstFrameMaxWidth: display.FIRST_FRAME_MAX_WIDTH,
        preview,
      },
      targets,
    });
  }

  async function handleDerive(video, reply) {
    const correlationId = reply.correlationId;
    if (video.storage?.thumb_key) return; // redelivered reply, already handled

    const output = reply.output || {};
    const written = [
      output.thumbKey,
      output.firstFrameKey,
      output.previewKey,
    ].filter(Boolean);

    if (reply.status !== "success") {
      log.error("video.ingest.derive_error", {
        correlationId,
        videoId: String(video._id),
        cause: reply.error?.message,
      });
      return fail(video, "PROCESSING_ERROR", {}, correlationId, written);
    }

    // Integrity between object and metadata (I1, I2).
    if (
      !output.thumbKey ||
      !output.firstFrameKey ||
      Boolean(output.previewKey) !== Boolean(reply.previewRequested)
    ) {
      return fail(
        video,
        "PROCESSING_ERROR",
        { reason: "missing_outputs" },
        correlationId,
        written,
      );
    }

    const set = {
      status: "completed",
      "storage.thumb_key": output.thumbKey,
      "storage.first_frame_key": output.firstFrameKey,
    };
    if (output.previewKey) set["storage.preview_key"] = output.previewKey;

    const stored = await Video.updateOne(
      {
        _id: video._id,
        status: "processing",
        "storage.thumb_key": { $exists: false },
      },
      { $set: set },
    );
    if (stored.modifiedCount !== 1) return;

    log.info("video.ingest.completed", {
      correlationId,
      videoId: String(video._id),
      userId: String(video.created_by),
    });
    await notify(video, "completed", correlationId);
  }

  // Replies from the worker on video_project_queue. Idempotent: replies for
  // videos that are gone or no longer processing are ignored.
  async function handleReply(reply, headers = {}) {
    if (!reply || !mongoose.isValidObjectId(reply.videoId)) {
      log.warn("video.ingest.unknown_reply", {
        correlationId: reply?.correlationId,
      });
      return;
    }

    const video = await Video.findById(reply.videoId).lean();
    if (!video) return;

    // A previous cleanup was interrupted (storage unavailable): finish it.
    if (video.status === "failed") return purge(video);
    if (video.status !== "processing") return;

    // Request dead-lettered after the delivery limit (ADD T-03): it carries the
    // x-death header and, being a request, has no status field.
    if (headers["x-death"] || !("status" in reply)) {
      log.error("video.ingest.dead_lettered", {
        correlationId: reply.correlationId,
        videoId: reply.videoId,
      });
      return fail(
        video,
        "PROCESSING_ERROR",
        { reason: "delivery_limit" },
        reply.correlationId,
      );
    }

    if (reply.operation === "ingest.probe") return handleProbe(video, reply);
    if (reply.operation === "ingest.derive") return handleDerive(video, reply);
    log.warn("video.ingest.unknown_operation", {
      correlationId: reply.correlationId,
      operation: reply.operation,
    });
  }

  return { requestUpload, completeUpload, cancelUpload, handleReply };
}

module.exports = { createIngest };
