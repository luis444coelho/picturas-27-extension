const express = require("express");
const {
  getReadUrl,
  getWriteUrl,
  headObject,
} = require("../services/videoUrls");
const createBucket = require("../services/createBucket");
const deleteFile = require("../services/deleteFile");
const videoStages = require("../utils/videoStages");

// Internal video module of the storage service (ADD T-08, D-08). Only reachable
// inside the Docker network; nginx does not route to it.
const router = express.Router();
router.use(express.json());

const DEFAULT_EXPIRES = 900;
const MAX_EXPIRES = 7 * 24 * 60 * 60;
const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/;

function readTarget(source) {
  const { userId, projectId, stage, name } = source || {};

  for (const value of [userId, projectId, name]) {
    if (
      typeof value !== "string" ||
      !SAFE_SEGMENT.test(value) ||
      value.startsWith(".")
    ) {
      return {
        error: "userId, projectId e name têm de ser identificadores simples.",
      };
    }
  }

  if (!videoStages.includes(stage)) {
    return { error: `O estágio deve ser ${videoStages.join(", ")}.` };
  }

  return { target: { userId, projectId, stage, name } };
}

function readExpires(value) {
  if (value === undefined) return DEFAULT_EXPIRES;
  const expires = Number(value);
  if (!Number.isInteger(expires) || expires <= 0 || expires > MAX_EXPIRES)
    return null;
  return expires;
}

router.post("/url/get", async (req, res) => {
  const { target, error } = readTarget(req.body);
  if (error) return res.status(400).json({ error });

  const expires = readExpires(req.body.expires);
  if (expires === null)
    return res.status(400).json({ error: "expires inválido." });

  try {
    const url = await getReadUrl({
      ...target,
      expires,
      isPublic: req.body.public === true,
      responseContentType: req.body.responseContentType,
    });
    res.status(200).json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/url/put", async (req, res) => {
  const { target, error } = readTarget(req.body);
  if (error) return res.status(400).json({ error });

  const expires = readExpires(req.body.expires);
  if (expires === null)
    return res.status(400).json({ error: "expires inválido." });

  if (
    typeof req.body.contentType !== "string" ||
    req.body.contentType.length === 0
  ) {
    return res.status(400).json({ error: "contentType é obrigatório." });
  }

  try {
    const url = await getWriteUrl({
      ...target,
      expires,
      isPublic: req.body.public === true,
      contentType: req.body.contentType,
    });
    res.status(200).json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.head("/object/:userId/:projectId/:stage/:name", async (req, res) => {
  const { target, error } = readTarget(req.params);
  if (error) return res.status(400).end();

  try {
    const head = await headObject(target);
    if (!head) return res.status(404).end();

    res.set("Content-Length", String(head.contentLength));
    if (head.contentType) res.set("Content-Type", head.contentType);
    res.status(200).end();
  } catch (err) {
    res.status(500).end();
  }
});

router.delete("/object/:userId/:projectId/:stage/:name", async (req, res) => {
  const { target, error } = readTarget(req.params);
  if (error) return res.status(400).json({ error });

  try {
    await deleteFile(
      target.userId,
      target.projectId,
      target.stage,
      target.name,
    );
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/bucket/:userId", async (req, res) => {
  if (!SAFE_SEGMENT.test(req.params.userId)) {
    return res.status(400).json({ error: "userId inválido." });
  }

  try {
    await createBucket(`user-${req.params.userId}`);
    res.status(200).json({ bucket: `user-${req.params.userId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
