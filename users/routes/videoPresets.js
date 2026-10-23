var express = require("express");
var router = express.Router();

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../controllers/user");
const VideoPreset = require("../models/videoPreset");

// Video chain presets (ADD 4.9, CHAIN-014, D-83, ADR-018). The gateway checks
// the JWT (videoAuth) and the structure of the steps (projects service) before
// calling these routes; here: owner, anonymous, unique name and CRUD. Errors in
// the {error: {code, message, details}} shape of the video routes (ADD T-10).
const NAME_MAX = 50;
const STEPS_MAX = 10;

const MESSAGES = {
  UNAUTHENTICATED: "Sessão inválida ou expirada. Inicia sessão novamente.",
  FORBIDDEN: "Não tens permissão para gerir predefinições de vídeo.",
  NOT_FOUND: "A predefinição não existe.",
  INVALID_REQUEST: "Pedido inválido. Verifica os dados enviados.",
  PRESET_NAME_TAKEN:
    "Já tens uma predefinição com esse nome. Escolhe outro nome.",
  INTERNAL_ERROR: "Ocorreu um erro interno. Tenta novamente mais tarde.",
};

function sendError(res, status, code, details = {}) {
  return res.status(status).json({
    error: { code, message: MESSAGES[code] || code, details },
  });
}

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

// Owner of the path with a valid JWT; anonymous users have no presets (RN1).
async function requireOwner(req, res, next) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ")
      ? header.slice("Bearer ".length)
      : null;
    if (!token) return sendError(res, 401, "UNAUTHENTICATED");
    if (!mongoose.isValidObjectId(req.params.user))
      return sendError(res, 404, "NOT_FOUND");

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      return sendError(res, 401, "UNAUTHENTICATED");
    }
    if (String(payload?.id) !== req.params.user)
      return sendError(res, 403, "FORBIDDEN");

    const user = await User.getOne(req.params.user);
    if (!user) return sendError(res, 404, "NOT_FOUND");
    if (user.type === "anonymous") return sendError(res, 403, "FORBIDDEN");
    req.ownerId = user._id;
    return next();
  } catch (err) {
    console.error("video presets: auth error", err.message);
    return sendError(res, 500, "INTERNAL_ERROR");
  }
}

// Trimmed name of 1 to 50 characters (D-83), or null.
function cleanName(name) {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= NAME_MAX ? trimmed : null;
}

// Steps already checked by the projects service (ADR-018); only their shape here.
function cleanSteps(steps) {
  if (!Array.isArray(steps) || steps.length < 1 || steps.length > STEPS_MAX)
    return null;
  const ok = steps.every(
    (step) =>
      isPlainObject(step) &&
      typeof step.operation === "string" &&
      Number.isInteger(step.version) &&
      (step.parameters === undefined || isPlainObject(step.parameters)),
  );
  return ok
    ? steps.map((step) => ({
        operation: step.operation,
        version: step.version,
        parameters: step.parameters || {},
      }))
    : null;
}

function view(preset) {
  return {
    id: String(preset._id),
    name: preset.name,
    steps: preset.steps,
    createdAt: preset.createdAt,
    updatedAt: preset.updatedAt,
  };
}

const PATH = "/users/:user/video-presets";

router.get(PATH, requireOwner, async (req, res) => {
  try {
    const presets = await VideoPreset.find({ owner_id: req.ownerId })
      .sort({ name_key: 1 })
      .lean();
    return res.status(200).json(presets.map(view));
  } catch (err) {
    console.error("video presets: list error", err.message);
    return sendError(res, 500, "INTERNAL_ERROR");
  }
});

router.post(PATH, requireOwner, async (req, res) => {
  const name = cleanName(req.body?.name);
  if (!name) return sendError(res, 422, "INVALID_REQUEST", { field: "name" });
  const steps = cleanSteps(req.body?.steps);
  if (!steps) return sendError(res, 422, "INVALID_REQUEST", { field: "steps" });
  try {
    const created = await VideoPreset.create({
      owner_id: req.ownerId,
      name,
      name_key: name.toLowerCase(),
      steps,
    });
    return res.status(201).json(view(created.toObject()));
  } catch (err) {
    if (err?.code === 11000)
      return sendError(res, 409, "PRESET_NAME_TAKEN", { name });
    console.error("video presets: create error", err.message);
    return sendError(res, 500, "INTERNAL_ERROR");
  }
});

// Name and/or steps, like PATCH /users/:user/presets/:presetId (D-83).
router.patch(`${PATH}/:id`, requireOwner, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return sendError(res, 404, "NOT_FOUND");
  const patch = {};
  if (req.body?.name !== undefined) {
    const name = cleanName(req.body.name);
    if (!name) return sendError(res, 422, "INVALID_REQUEST", { field: "name" });
    patch.name = name;
    patch.name_key = name.toLowerCase();
  }
  if (req.body?.steps !== undefined) {
    const steps = cleanSteps(req.body.steps);
    if (!steps)
      return sendError(res, 422, "INVALID_REQUEST", { field: "steps" });
    patch.steps = steps;
  }
  if (!Object.keys(patch).length)
    return sendError(res, 422, "INVALID_REQUEST", { field: "name" });
  try {
    const updated = await VideoPreset.findOneAndUpdate(
      { _id: req.params.id, owner_id: req.ownerId },
      { $set: patch },
      { new: true, runValidators: true },
    ).lean();
    if (!updated) return sendError(res, 404, "NOT_FOUND");
    return res.status(200).json(view(updated));
  } catch (err) {
    if (err?.code === 11000)
      return sendError(res, 409, "PRESET_NAME_TAKEN", { name: patch.name });
    console.error("video presets: update error", err.message);
    return sendError(res, 500, "INTERNAL_ERROR");
  }
});

router.delete(`${PATH}/:id`, requireOwner, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return sendError(res, 404, "NOT_FOUND");
  try {
    const result = await VideoPreset.deleteOne({
      _id: req.params.id,
      owner_id: req.ownerId,
    });
    if (result.deletedCount !== 1) return sendError(res, 404, "NOT_FOUND");
    return res.sendStatus(204);
  } catch (err) {
    console.error("video presets: delete error", err.message);
    return sendError(res, 500, "INTERNAL_ERROR");
  }
});

module.exports = router;
