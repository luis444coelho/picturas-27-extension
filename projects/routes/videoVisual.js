const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
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
const { get_image_internal_url } = require("../utils/imageStorage");

const storage = require("../video/storage");
const users = require("../video/users");
const log = require("../video/log");
const chain = require("../video/chain");
const preview = require("../video/preview");
const files = require("../video/visualStorage");
const { registry } = require("../video/operations");
const { createFrameCache } = require("../video/frameCache");
const { browserFrame } = require("../video/browserFrame");
const { createWatermarks, MAX_BYTES } = require("../video/watermarks");
const { markBox } = require("../video/watermarkGeometry");
const { VideoError, sendError } = require("../video/errors");
const { readRawBody } = require("../video/rawBody");

// Router of the B005 visual edits (ADD T-07, 4.3 to 4.6, UC-VID-004). Mounted
// before the B001 video router, which it does not change: it answers only its
// own routes and, on the validation and acceptance routes, writes the server
// dimensions of the watermarks before passing the request on (ADR-010).
const router = express.Router();

const VIDEOS = "/:user/:project/videos";
const cache = createFrameCache(); // T-07, D-64: 100 entries, 10 min
const marks = createWatermarks({ VideoWatermark, files, cache });

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

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

// Same checks as the B001 router (T-07: videoAuth, edit permission, no anonymous).
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

const loadVideo = wrap(async (req, res, next) => {
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
  req.video = video;
  next();
});

const canEdit = [
  checkSharePermission,
  requireEditPermission,
  enforcePresenceLimit,
  loadProject,
  rejectAnonymous,
];

// ---- ADR-010: server dimensions of the watermark before validation --------

// The authorization of canEdit without answering: a request that fails it is
// passed on untouched (apart from _mark) and the B001 router refuses it.
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
  return { project: found, callerId };
}

const watermarkSteps = (steps) =>
  (Array.isArray(steps) ? steps : []).filter(
    (step) =>
      isPlainObject(step) &&
      step.operation === "watermark" &&
      isPlainObject(step.parameters),
  );

// Texts are stored only on acceptance; validation measures them in memory.
const resolveMarks = (store) =>
  wrap(async (req, res, next) => {
    const steps = watermarkSteps(req.body?.steps);
    for (const step of steps) delete step.parameters._mark;
    if (!steps.length) return next();
    const context = await silentContext(req);
    if (!context) return next();
    for (const step of steps) {
      const mark = await marks.resolve(context.project, step.parameters, {
        store,
        callerId: context.callerId,
      });
      if (mark) step.parameters._mark = mark;
    }
    next();
  });

router.post(`${VIDEOS}/validate`, resolveMarks(false));
router.post(`${VIDEOS}/:video/operations`, resolveMarks(true));

// ---- previews (ADD T-07) ---------------------------------------------------

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

const stepError = (index, errors) =>
  new VideoError(422, "INVALID_STEP_PARAMS", { index, errors });

// Static steps validated like on acceptance; NO_CHANGES still previews (the
// unchanged frame) and the other operations are ignored (T-07).
function staticSteps(steps, inputProps, profile) {
  if (!chain.isStepList(steps))
    throw new VideoError(422, "INVALID_REQUEST", { field: "steps" });
  let props = inputProps;
  const applied = [];
  for (const [index, step] of steps.entries()) {
    if (!isPlainObject(step) || !preview.STATIC.includes(step.operation))
      continue;
    const op = registry.get(step.operation);
    if (!Number.isInteger(step.version) || !op.versions.includes(step.version))
      throw stepError(index, [
        {
          code: "INVALID_STEP_PARAMS",
          field: "version",
          supportedVersions: op.versions,
        },
      ]);
    if (step.parameters !== undefined && !isPlainObject(step.parameters))
      throw stepError(index, [
        { code: "INVALID_STEP_PARAMS", field: "parameters" },
      ]);
    const parameters = step.parameters || {};
    const errors = (op.validate(parameters, props, profile) || []).filter(
      (error) => error.code !== "NO_CHANGES",
    );
    if (errors.length) throw stepError(index, errors);
    applied.push({ operation: step.operation, parameters });
    props = op.estimate(props, parameters);
  }
  return { applied, props };
}

// POST …/videos/:video/preview {steps}: image bytes, nothing stored, no task
// and no quota. The dimensions of the result come from the estimate.
router.post(
  `${VIDEOS}/:video/preview`,
  ...canEdit,
  loadVideo,
  wrap(async (req, res) => {
    const { applied, props } = staticSteps(
      req.body?.steps,
      chain.propsFromMeta(req.video.meta),
      req.callerType,
    );
    const frame = await browserFrame(req.body?.frameJpeg, await firstFrame(req.video));
    const image = await preview.render(frame, applied);
    res
      .status(200)
      .set("Cache-Control", "no-store")
      .set("X-Output-Width", String(props.displayWidth))
      .set("X-Output-Height", String(props.displayHeight))
      .type("image/jpeg")
      .send(image);
  }),
);

// GET …/videos/:video/filters/thumbnails (ADD 4.4, FILTER-002).
router.get(
  `${VIDEOS}/:video/filters/thumbnails`,
  ...canEdit,
  loadVideo,
  wrap(async (req, res) => {
    const key = `thumbs:${req.video._id}:${req.video.storage.first_frame_key}`;
    let thumbnails = cache.get(key);
    if (!thumbnails) {
      thumbnails = await preview.thumbnails(await firstFrame(req.video));
      cache.set(key, thumbnails);
    }
    res.status(200).json({ thumbnails });
  }),
);

// POST …/videos/:video/watermark-preview {steps: [watermark]} (D-62).
router.post(
  `${VIDEOS}/:video/watermark-preview`,
  ...canEdit,
  loadVideo,
  wrap(async (req, res) => {
    const steps = req.body?.steps;
    const [step] = watermarkSteps(steps);
    if (!Array.isArray(steps) || steps.length !== 1 || !step)
      throw new VideoError(422, "INVALID_REQUEST", { field: "steps" });
    const op = registry.get("watermark");
    if (!op.versions.includes(step.version))
      throw stepError(0, [
        {
          code: "INVALID_STEP_PARAMS",
          field: "version",
          supportedVersions: op.versions,
        },
      ]);
    const parameters = { ...step.parameters };
    delete parameters._mark;
    const mark = await marks.resolve(req.videoProject, parameters, {
      store: false,
    });
    if (mark) parameters._mark = mark;
    const props = chain.propsFromMeta(req.video.meta);
    const errors = op.validate(parameters, props) || [];
    if (errors.length) throw stepError(0, errors);
    const frame = await browserFrame(req.body?.frameJpeg, await firstFrame(req.video));
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

// ---- watermark images (D-60) ----------------------------------------------

const IMAGE_TYPES = ["image/png", "image/jpeg"];
const parseImage = readRawBody({ types: IMAGE_TYPES, limit: MAX_BYTES });

// A body over the limit answers in the video error format, not as a 413 page.
const readImage = (req, res, next) =>
  parseImage(req, res, (err) => {
    if (!err) return next();
    sendError(
      res,
      new VideoError(422, "INVALID_WATERMARK_CONTENT", {
        field: "file",
        reason: err.type === "entity.too.large" ? "too_large" : "unreadable",
        maxBytes: MAX_BYTES,
      }),
      req.correlationId,
    );
  });

async function galleryImage(project, imageId) {
  const img = (project.imgs || []).find((i) => String(i._id) === imageId);
  if (!img)
    throw new VideoError(422, "INVALID_WATERMARK_CONTENT", {
      field: "imageId",
    });
  const resp = await get_image_internal_url(
    String(project.user_id),
    String(project._id),
    "src",
    img.og_img_key,
  );
  const file = await axios.get(resp.data.url, { responseType: "arraybuffer" });
  return Buffer.from(file.data);
}

// POST …/videos/watermarks: a local PNG/JPEG (body image/png or image/jpeg,
// up to 1 MB) or {imageId} of an image of the project gallery (FA1).
router.post(
  `${VIDEOS}/watermarks`,
  readImage,
  ...canEdit,
  wrap(async (req, res) => {
    let result;
    if (Buffer.isBuffer(req.body)) {
      result = await marks.createFromImage(
        req.videoProject,
        req.body,
        req.callerId,
      );
    } else if (typeof req.body?.imageId === "string") {
      const buffer = await galleryImage(req.videoProject, req.body.imageId);
      result = await marks.createFromImage(
        req.videoProject,
        buffer,
        req.callerId,
        { maxBytes: null },
      );
    } else {
      throw new VideoError(422, "INVALID_WATERMARK_CONTENT", {
        field: "file",
      });
    }
    log.info("video.watermark.created", {
      correlationId: req.correlationId,
      projectId: String(req.videoProject._id),
      watermarkId: result.watermarkId,
    });
    res.status(201).json(result);
  }),
);

module.exports = router;
