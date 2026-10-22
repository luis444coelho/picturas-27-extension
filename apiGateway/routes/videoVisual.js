var express = require("express");
var router = express.Router();

const axios = require("axios");
const https = require("https");
const fs = require("fs");

const { checkVideoToken } = require("../auth/videoAuth");
const { readRawBody } = require("./videoRawBody");

// Gateway routes of the B005 visual edits (ADD T-07, 4.4, D-60, D-62). Mounted
// after the B001 video router, whose middlewares give every request its
// correlationId and log line; the forward() there only carries JSON, so the
// image answers and the raw image upload have their own forwarding here.
const key = fs.readFileSync(__dirname + "/../certs/selfsigned.key");
const cert = fs.readFileSync(__dirname + "/../certs/selfsigned.crt");
const httpsAgent = new https.Agent({ rejectUnauthorized: false, cert, key });

const projects = axios.create({
  baseURL: "https://projects:9001/",
  httpsAgent,
  maxBodyLength: Infinity,
});
projects.interceptors.request.use((config) => {
  const req = config.videoRequest;
  if (req) {
    config.headers["X-Correlation-Id"] = req.correlationId;
    config.headers["X-Caller-Id"] = req.authUserId;
    config.headers["Authorization"] = req.headers["authorization"];
  }
  return config;
});

const VIDEOS = "/:user/:project/videos";
const IMAGE_TYPES = ["image/png", "image/jpeg"];
const MAX_BYTES = 1024 * 1024; // D-60

function errorBody(req, status, data) {
  let body = data;
  if (Buffer.isBuffer(data) || data instanceof ArrayBuffer) {
    try {
      body = JSON.parse(Buffer.from(data).toString("utf8"));
    } catch {
      body = null;
    }
  }
  if (body && typeof body === "object" && body.error?.code)
    return { ...body, correlationId: body.correlationId || req.correlationId };
  const code = status === 403 ? "FORBIDDEN" : status === 404 ? "NOT_FOUND" : "INTERNAL_ERROR";
  return { error: { code, message: code, details: {} }, correlationId: req.correlationId };
}

function forward(method, { binary = false } = {}) {
  return async (req, res) => {
    try {
      const raw = Buffer.isBuffer(req.body);
      const resp = await projects.request({
        method,
        url: req.originalUrl.replace(/^\/projects\//, "").split("?")[0],
        params: req.query.share ? { share: req.query.share } : undefined,
        data: method === "post" ? req.body : undefined,
        headers: raw ? { "Content-Type": req.headers["content-type"] } : undefined,
        responseType: binary ? "arraybuffer" : "json",
        videoRequest: req,
      });
      if (!binary) return res.status(resp.status).json(resp.data);
      for (const header of ["content-type", "cache-control", "x-output-width", "x-output-height"]) {
        if (resp.headers[header]) res.set(header, resp.headers[header]);
      }
      return res.status(resp.status).send(Buffer.from(resp.data));
    } catch (err) {
      const status = err.response?.status || 502;
      if (status >= 500)
        console.error(
          JSON.stringify({
            level: "error",
            event: "video.gateway.upstream_error",
            service: "api_gateway",
            time: new Date().toISOString(),
            correlationId: req.correlationId,
            status,
            message: err.message,
          }),
        );
      return res.status(status).json(errorBody(req, status, err.response?.data));
    }
  };
}

const parseImage = readRawBody({ types: IMAGE_TYPES, limit: MAX_BYTES });
const readImage = (req, res, next) =>
  parseImage(req, res, (err) => {
    if (!err) return next();
    return res.status(422).json({
      error: {
        code: "INVALID_WATERMARK_CONTENT",
        message: "A imagem da marca de água excede 1 MB ou não é legível.",
        details: { field: "file", reason: "too_large", maxBytes: MAX_BYTES },
      },
      correlationId: req.correlationId,
    });
  });

router.post(`${VIDEOS}/watermarks`, checkVideoToken, readImage, forward("post"));
router.post(`${VIDEOS}/:video/preview`, checkVideoToken, forward("post", { binary: true }));
router.post(`${VIDEOS}/:video/watermark-preview`, checkVideoToken, forward("post", { binary: true }));
router.get(`${VIDEOS}/:video/filters/thumbnails`, checkVideoToken, forward("get"));

module.exports = router;
