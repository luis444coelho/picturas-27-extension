const { suggestedFileName } = require("./fileName");
const { VideoError } = require("./errors");

// Read access to a video (UC-VID-006, UC-VID-007; ADD 4.1, 4.2): information
// panel and download URL. Neither creates a task, publishes a message nor
// touches the quota (DOWNLOAD-004, INFO-007, QUOTA-008). Ports are injected
// for testing.

// Attributes of the information panel and the metadata each one needs. An
// audio_codec of null means "no audio", not a missing value (ADD T-00).
const ATTRIBUTES = {
  duration: ["duration_ms"],
  resolution: ["display_width", "display_height"],
  format: ["container", "video_codec", "audio_codec"],
  size: ["size_bytes"],
  fps: ["fps_num", "fps_den"],
};

function unavailableAttributes(meta) {
  const m = meta || {};
  return Object.entries(ATTRIBUTES)
    .filter(([, fields]) => fields.some((field) => m[field] === undefined))
    .map(([attribute]) => attribute);
}

function publicMeta(meta) {
  const m = meta || {};
  return {
    container: m.container,
    videoCodec: m.video_codec,
    audioCodec: m.audio_codec,
    displayWidth: m.display_width,
    displayHeight: m.display_height,
    durationMs: m.duration_ms,
    sizeBytes: m.size_bytes,
    fpsNum: m.fps_num,
    fpsDen: m.fps_den,
  };
}

function createAccess({ Video, storage, log, now = () => Date.now() }) {
  // Provenance names, in order; a source that no longer exists has a null
  // name and is shown as "Vídeo removido" (INFO-008).
  async function resolveSources(video) {
    const ids = video.source_video_ids || [];
    if (ids.length === 0) return [];

    const found = await Video.find(
      { _id: { $in: ids } },
      { original_name: 1 },
    ).lean();
    const names = new Map(found.map((v) => [String(v._id), v.original_name]));

    return ids.map((id) => ({
      id: String(id),
      originalName: names.get(String(id)) ?? null,
    }));
  }

  // Only the state for a video that is not completed (ADD 4.2).
  async function getInfo(video, { correlationId }) {
    const base = {
      id: String(video._id),
      originalName: video.original_name,
      status: video.status,
    };
    if (video.status !== "completed") return base;

    const unavailable = unavailableAttributes(video.meta);
    if (unavailable.length > 0) {
      log.warn("METADATA_UNAVAILABLE", {
        correlationId,
        videoId: base.id,
        attributes: unavailable,
      });
    }

    return {
      ...base,
      mimeType: video.mime_type,
      meta: publicMeta(video.meta),
      unavailable,
      sources: await resolveSources(video),
      recipe: (video.recipe || []).map(
        ({ operation, version, parameters }) => ({
          operation,
          version,
          parameters: parameters ?? {},
        }),
      ),
      downloadFileName: suggestedFileName(video),
      createdAt: video.createdAt,
    };
  }

  // URL valid for 15 min to the stored file, never to the preview copy
  // (DOWNLOAD-002, 006). The suggested name goes in the anchor's download
  // attribute, not in the URL (D-29, D-34).
  async function issueDownload(video, { callerId, correlationId }) {
    const videoId = String(video._id);
    if (video.status !== "completed")
      throw new VideoError(409, "RESOURCE_NOT_READY");

    const target = storage.parseKey(video.owner_id, video.storage.original_key);
    const head = await storage.head(target);
    if (!head) {
      log.error("video.download.unavailable", {
        correlationId,
        userId: callerId,
        videoId,
        key: video.storage.original_key,
      });
      throw new VideoError(404, "RESOURCE_UNAVAILABLE");
    }

    const issuedAt = now();
    const url = await storage.publicReadUrl(target);

    // The URL carries its signature: it is never logged (T-10).
    log.info("video.download.issued", {
      correlationId,
      userId: callerId,
      videoId,
      projectId: String(video.project_id),
    });

    return {
      url,
      fileName: suggestedFileName(video),
      expiresAt: new Date(issuedAt + storage.URL_EXPIRES * 1000).toISOString(),
    };
  }

  return { getInfo, issueDownload };
}

module.exports = { createAccess, unavailableAttributes };
