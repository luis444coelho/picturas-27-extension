const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Project = require("../controllers/project");
const Video = require("../models/video");
const VideoWatermark = require("../models/videoWatermark");
const {
  checkSharePermission,
  requireEditPermission,
} = require("../middleware/shareAuth");
const enforcePresenceLimit = require("../middleware/enforcePresenceLimit");
const { getCallerId } = require("../utils/caller");

const users = require("../video/users");
const chain = require("../video/chain");
const preview = require("../video/preview");
const storage = require("../video/storage");
const { markBox } = require("../video/watermarkGeometry");
const { createFrameCache } = require("../video/frameCache");
const { browserFrame } = require("../video/browserFrame");
const log = require("../video/log");
const files = require("../video/visualStorage");
const { registry } = require("../video/operations");
const { tasks } = require("../video/taskModule");
const { createWatermarks } = require("../video/watermarks");
const { createComposition } = require("../video/composition");
const { VideoError, sendError } = require("../video/errors");

// Router of the chains and concats of B008 (ADD 4.8, 4.9, ADR-016). Mounted
// after the B005 router (which writes the top-level _mark) and before the B001
// video router, which it does not change:
// - chains with a concat use the routes without :video and are answered here;
// - chains without a concat get phases 1 and 3 here, in the order of D-80, and
//   go on untouched to B003, which runs phase 2 and the acceptance.
const router = express.Router();

const VIDEOS = "/:user/:project/videos";
const cache = createFrameCache();
const marks = createWatermarks({ VideoWatermark, files, cache });
const composition = createComposition({
  Video,
  registry,
  watermarks: marks,
});

router.use(VIDEOS, (req, res, next) => {
  if (!req.correlationId)
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

// Same checks as the B001 router (edit permission, no anonymous).
const loadProject = wrap(async (req, res, next) => {
  const { user, project } = req.params;
  if (!mongoose.isValidObjectId(user) || !mongoose.isValidObjectId(project))
    throw new VideoError(404, "NOT_FOUND");
  const found = await Project.getOne(user, project);
  if (!found) throw new VideoError(404, "NOT_FOUND");
  req.videoProject = found;
  next();
});

const rejectAnonymous = wrap(async (req, res, next) => {
  const callerId = getCallerId(req);
  if (!callerId || !mongoose.isValidObjectId(callerId))
    throw new VideoError(403, "FORBIDDEN");
  const type = await users.getUserType(callerId);
  if (type !== "free" && type !== "premium")
    throw new VideoError(403, "FORBIDDEN");
  req.callerId = callerId;
  req.callerType = type;
  next();
});

const canEdit = [
  checkSharePermission,
  requireEditPermission,
  enforcePresenceLimit,
  loadProject,
  rejectAnonymous,
];

// The authorization of canEdit without answering (ADR-010 pattern): a request
// that fails it goes on untouched and the B001 router refuses it.
async function silentContext(req) {
  const { user, project } = req.params;
  if (!mongoose.isValidObjectId(user) || !mongoose.isValidObjectId(project))
    return null;
  const shareId = req.query.share;
  if (shareId) {
    if (!req.headers.authorization?.startsWith("Bearer ")) return null;
    const shared = await Project.getOneByShareId(shareId);
    const link = (shared?.sharedLinks || []).find((l) => l.id === shareId);
    if (!link || link.revoked || link.permission !== "edit") return null;
    if (String(shared.user_id) !== user || String(shared._id) !== project)
      return null;
  }
  const found = await Project.getOne(user, project);
  if (!found) return null;
  const callerId = getCallerId(req);
  if (!callerId || !mongoose.isValidObjectId(callerId)) return null;
  const type = await users.getUserType(callerId);
  if (type !== "free" && type !== "premium") return null;
  return { project: found, callerId, profile: type };
}

const wrongRoute = () =>
  new VideoError(422, "INVALID_REQUEST", { field: "steps" });

// Chain without concat on one video: phases 1 and 3 before B003 (D-80).
async function precheck(req, videoId) {
  const steps = req.body?.steps;
  if (!Array.isArray(steps)) return null; // B003 answers INVALID_REQUEST
  const context = await silentContext(req);
  if (!context) return null;
  // Structure first (D-80): empty_chain (CHAIN-007) and concat_not_first
  // before the route check of D-78.
  const broken = composition.structureError(steps);
  if (broken) return broken;
  if (videoId === undefined || composition.hasConcat(steps))
    return wrongRoute(); // D-78
  const video = mongoose.isValidObjectId(videoId)
    ? await Video.findOne({
        _id: videoId,
        project_id: context.project._id,
      }).lean()
    : null;
  return composition.precheckChain({ video, profile: context.profile, steps });
}

// POST …/videos/validate: with a concat and without videoId, answered here;
// otherwise prechecked and passed on to B003.
router.post(
  `${VIDEOS}/validate`,
  wrap(async (req, res, next) => {
    const steps = req.body?.steps;
    if (req.body?.videoId === undefined && composition.isConcatChain(steps))
      return next("route");
    const error = await precheck(req, req.body?.videoId);
    if (error) throw error;
    next("router");
  }),
);
router.post(
  `${VIDEOS}/validate`,
  ...canEdit,
  wrap(async (req, res) => {
    const result = await composition.validateConcat({
      project: req.videoProject,
      callerId: req.callerId,
      profile: req.callerType,
      steps: req.body.steps,
    });
    res.status(200).json(result);
  }),
);

// POST …/videos/:video/operations: prechecked and passed on to B003.
router.post(
  `${VIDEOS}/:video/operations`,
  wrap(async (req, res, next) => {
    const error = await precheck(req, req.params.video);
    if (error) throw error;
    next("router");
  }),
);

// POST …/videos/operations (ADD 4.8, D-78): chains whose first step is a concat.
router.post(
  `${VIDEOS}/operations`,
  ...canEdit,
  wrap(async (req, res) => {
    const steps = req.body?.steps;
    if (!composition.isConcatChain(steps))
      throw (
        (Array.isArray(steps) && composition.structureError(steps)) ||
        wrongRoute()
      );
    const result = await composition.submitConcat({
      tasks,
      project: req.videoProject,
      callerId: req.callerId,
      profile: req.callerType,
      steps,
      correlationId: req.correlationId,
    });
    res.status(202).json(result);
  }),
);

// POST …/videos/chain/validate (revision of B008, ADR-020): the answer of
// …/validate plus the properties at the input of every step.
router.post(
  `${VIDEOS}/chain/validate`,
  ...canEdit,
  wrap(async (req, res) => {
    const steps = req.body?.steps;
    if (!Array.isArray(steps))
      throw new VideoError(422, "INVALID_REQUEST", { field: "steps" });
    let video = null;
    if (req.body?.videoId !== undefined) {
      if (!mongoose.isValidObjectId(req.body.videoId))
        throw new VideoError(422, "INVALID_REQUEST", { field: "videoId" });
      video = await Video.findOne({
        _id: req.body.videoId,
        project_id: req.videoProject._id,
      }).lean();
      if (!video) throw new VideoError(404, "NOT_FOUND");
    }
    const result = await composition.validateWithInputs({
      tasks,
      project: req.videoProject,
      callerId: req.callerId,
      profile: req.callerType,
      steps,
      video,
    });
    res.status(200).json(result);
  }),
);

// First frame of a video for the previews (ADD T-07), as in the B005 router.
async function firstFrame(video) {
  const key = `frame:${video._id}:${video.storage.first_frame_key}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const frame = await files.readBytes(
    storage.parseKey(video.owner_id, video.storage.first_frame_key),
  );
  cache.set(key, frame);
  return frame;
}

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const stepError = (index, errors) =>
  new VideoError(422, "INVALID_STEP_PARAMS", { index, errors });

// POST …/videos/:video/chain/watermark-preview {steps: [...previous, watermark]}
// (D-89, preflight V17): the static steps before the mark are applied to frame
// 0 and the mark is placed with the properties estimated after them. The
// …/watermark-preview of B005 takes one step on the original and is unchanged.
router.post(
  `${VIDEOS}/:video/chain/watermark-preview`,
  ...canEdit,
  wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.video))
      throw new VideoError(404, "NOT_FOUND");
    const video = await Video.findOne({
      _id: req.params.video,
      project_id: req.videoProject._id,
    }).lean();
    if (!video) throw new VideoError(404, "NOT_FOUND");
    if (video.status !== "completed" || !video.storage?.first_frame_key)
      throw new VideoError(409, "RESOURCE_NOT_READY", {
        videoId: String(video._id),
      });
    const steps = req.body?.steps;
    const mark = Array.isArray(steps) ? steps[steps.length - 1] : null;
    if (
      !isPlainObject(mark) ||
      mark.operation !== "watermark" ||
      !isPlainObject(mark.parameters)
    )
      throw new VideoError(422, "INVALID_REQUEST", { field: "steps" });

    let props = chain.propsFromMeta(video.meta);
    const applied = [];
    for (const [index, step] of steps.slice(0, -1).entries()) {
      if (!isPlainObject(step) || !preview.STATIC.includes(step.operation))
        continue;
      const op = registry.get(step.operation);
      const parameters = isPlainObject(step.parameters) ? step.parameters : {};
      const errors = (
        op.validate(parameters, props, req.callerType) || []
      ).filter((error) => error.code !== "NO_CHANGES");
      if (errors.length) throw stepError(index, errors);
      applied.push({ operation: step.operation, parameters });
      props = op.estimate(props, parameters);
    }

    const parameters = { ...mark.parameters };
    delete parameters._mark;
    const resolved = await marks.resolve(req.videoProject, parameters, {
      store: false,
    });
    if (resolved) parameters._mark = resolved;
    const errors = registry.get("watermark").validate(parameters, props) || [];
    if (errors.length) throw stepError(steps.length - 1, errors);

    const sourceFrame = await browserFrame(req.body?.frameJpeg, await firstFrame(video));
    const frame = await preview.render(sourceFrame, applied);
    const image = await preview.watermark(
      frame,
      await marks.markPng(req.videoProject, parameters),
      markBox(parameters, props),
      parameters.opacity,
    );
    res
      .status(200)
      .set("Cache-Control", "no-store")
      .type("image/jpeg")
      .send(image);
  }),
);

// Internal structure check of the video presets (ADR-018): called by the
// gateway on the internal network only; no reads, no writes.
router.post(
  "/video/chain-structure",
  wrap(async (req, res) => {
    const steps = composition.presetStructure(req.body?.steps);
    res.status(200).json({ steps });
  }),
);

module.exports = router;
