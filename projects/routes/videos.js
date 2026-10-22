const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Project = require("../controllers/project");
const Video = require("../models/video");
const {
  checkSharePermission,
  requireEditPermission,
} = require("../middleware/shareAuth");
const enforcePresenceLimit = require("../middleware/enforcePresenceLimit");
const { getCallerId } = require("../utils/caller");

const { ingest } = require("../video");
const storage = require("../video/storage");
const users = require("../video/users");
const log = require("../video/log");
const { VideoError, sendError } = require("../video/errors");

// Video router of the projects service (ADD T-00). Mounted before the existing
// router; it only answers /:user/:project/videos… and lets every other request
// through. No requireProjectVersion: video routes do not change the project.
const router = express.Router();

const VIDEOS = "/:user/:project/videos";

router.use(VIDEOS, (req, res, next) => {
  req.correlationId = req.headers["x-correlation-id"] || crypto.randomUUID();
  next();
});

const wrap = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (err) {
    if (!(err instanceof VideoError)) {
      log.error("video.route.error", {
        correlationId: req.correlationId,
        path: req.route?.path,
        message: err.message,
      });
    }
    sendError(res, err, req.correlationId);
  }
};

// checkSharePermission only validates share links; the owner path is checked here.
const loadProject = wrap(async (req, res, next) => {
  const { user, project } = req.params;
  if (!mongoose.isValidObjectId(user) || !mongoose.isValidObjectId(project)) {
    throw new VideoError(404, "NOT_FOUND");
  }

  const found = await Project.getOne(user, project);
  if (!found) throw new VideoError(404, "NOT_FOUND");

  req.videoProject = found;
  next();
});

// Video is only for registered and premium users (AUTH-002, RN1).
const rejectAnonymous = wrap(async (req, res, next) => {
  const callerId = getCallerId(req);
  if (!callerId || !mongoose.isValidObjectId(callerId))
    throw new VideoError(403, "FORBIDDEN");

  const type = await users.getUserType(callerId);
  if (type !== "free" && type !== "premium")
    throw new VideoError(403, "FORBIDDEN");

  req.callerId = callerId;
  next();
});

const loadVideo = wrap(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.video))
    throw new VideoError(404, "NOT_FOUND");

  const video = await Video.findOne({
    _id: req.params.video,
    project_id: req.videoProject._id,
  }).lean();
  if (!video) throw new VideoError(404, "NOT_FOUND");

  req.video = video;
  next();
});

const canRead = [checkSharePermission, loadProject, rejectAnonymous];
const canEdit = [
  checkSharePermission,
  requireEditPermission,
  enforcePresenceLimit,
  loadProject,
  rejectAnonymous,
];

// Routes with fixed segments come before the /:video routes.
router.post(
  `${VIDEOS}/uploads`,
  ...canEdit,
  wrap(async (req, res) => {
    const result = await ingest.requestUpload({
      ownerId: req.videoProject.user_id,
      projectId: req.videoProject._id,
      callerId: req.callerId,
      fileName: req.body?.fileName,
      mimeType: req.body?.mimeType,
      sizeBytes: req.body?.sizeBytes,
      correlationId: req.correlationId,
    });
    res.status(201).json(result);
  }),
);

router.get(
  VIDEOS,
  ...canRead,
  wrap(async (req, res) => {
    const videos = await Video.find({
      project_id: req.videoProject._id,
      status: "completed",
    })
      .sort({ createdAt: -1 })
      .lean();

    const items = await Promise.all(
      videos.map(async (video) => ({
        id: String(video._id),
        originalName: video.original_name,
        mimeType: video.mime_type,
        durationMs: video.meta?.duration_ms,
        displayWidth: video.meta?.display_width,
        displayHeight: video.meta?.display_height,
        createdAt: video.createdAt,
        thumbnailUrl: await storage.publicReadUrl(
          storage.parseKey(video.owner_id, video.storage.thumb_key),
          "image/jpeg",
        ),
      })),
    );

    res.status(200).json({ videos: items });
  }),
);

router.post(
  `${VIDEOS}/:video/upload/complete`,
  ...canEdit,
  loadVideo,
  wrap(async (req, res) => {
    const result = await ingest.completeUpload({
      video: req.video,
      callerId: req.callerId,
      correlationId: req.correlationId,
    });
    res.status(202).json(result);
  }),
);

router.delete(
  `${VIDEOS}/:video/upload`,
  ...canEdit,
  loadVideo,
  wrap(async (req, res) => {
    await ingest.cancelUpload({
      video: req.video,
      callerId: req.callerId,
      correlationId: req.correlationId,
    });
    res.status(204).end();
  }),
);

// The player uses the MP4 preview copy when there is one, the original otherwise (UPLOAD-017).
router.get(
  `${VIDEOS}/:video/playback`,
  ...canRead,
  loadVideo,
  wrap(async (req, res) => {
    const video = req.video;
    if (video.status !== "completed")
      throw new VideoError(409, "RESOURCE_NOT_READY");

    const key = video.storage.preview_key || video.storage.original_key;
    const mimeType = video.storage.preview_key ? "video/mp4" : video.mime_type;
    const url = await storage.publicReadUrl(
      storage.parseKey(video.owner_id, key),
      mimeType,
    );

    res.status(200).json({ url, mimeType, expiresIn: storage.URL_EXPIRES });
  }),
);

module.exports = router;
