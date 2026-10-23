var express = require("express");
var router = express.Router();

const axios = require("axios");
const crypto = require("crypto");
const https = require("https");
const fs = require("fs");

const { checkVideoToken } = require("../auth/videoAuth");

// Video router of the gateway (ADD T-00, T-10). Mounted on /projects before the
// existing router; it only answers /:user/:project/videos… and lets every
// other request through.
const key = fs.readFileSync(__dirname + "/../certs/selfsigned.key");
const cert = fs.readFileSync(__dirname + "/../certs/selfsigned.crt");

const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // (NOTE: this will disable client verification)
  cert: cert,
  key: key,
});

const projectsURL = "https://projects:9001/";
const VIDEOS = "/:user/:project/videos";

// Own axios instance: the interceptor adds X-Correlation-Id and X-Caller-Id to
// every call, so a new route cannot forget them (ADD T-10).
const projects = axios.create({ baseURL: projectsURL, httpsAgent });
projects.interceptors.request.use((config) => {
  const req = config.videoRequest;
  if (req) {
    config.headers["X-Correlation-Id"] = req.correlationId;
    config.headers["X-Caller-Id"] = req.authUserId;
    config.headers["Authorization"] = req.headers["authorization"];
  }
  return config;
});

// Codes for answers of reused middlewares that are not in the video error
// format (shareAuth, enforcePresenceLimit) (D-21, D-23).
const STATUS_CODES = {
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "INVALID_STATE",
  410: "SHARE_LINK_REVOKED",
  429: "TOO_MANY_EDITORS",
};

function errorResponse(req, status, data) {
  if (data && typeof data === "object" && data.error?.code) {
    return { ...data, correlationId: data.correlationId || req.correlationId };
  }
  const code = STATUS_CODES[status] || "INTERNAL_ERROR";
  const message = typeof data === "string" ? data : data?.message || code;
  return {
    error: { code, message, details: {} },
    correlationId: req.correlationId,
  };
}

function log(level, event, req, fields = {}) {
  const line = {
    level,
    event,
    service: "api_gateway",
    time: new Date().toISOString(),
    correlationId: req.correlationId,
    userId: req.authUserId,
    resource: req.originalUrl.split("?")[0],
    ...fields,
  };
  (level === "error" ? console.error : console.log)(JSON.stringify(line));
}

function forward(method) {
  return async (req, res) => {
    try {
      const resp = await projects.request({
        method,
        url: req.originalUrl.replace(/^\/projects\//, "").split("?")[0],
        params: req.query.share ? { share: req.query.share } : undefined,
        data: method === "post" ? req.body : undefined,
        videoRequest: req,
      });
      if (resp.status === 204) return res.status(204).end();
      return res.status(resp.status).json(resp.data);
    } catch (err) {
      const status = err.response?.status || 502;
      if (status >= 500)
        log("error", "video.gateway.upstream_error", req, {
          status,
          message: err.message,
        });
      return res
        .status(status)
        .json(errorResponse(req, status, err.response?.data));
    }
  };
}

router.use(VIDEOS, (req, res, next) => {
  req.correlationId = crypto.randomUUID();
  next();
});

// B003 (NFR-002, ADD T-10): one log line per video request, with the same
// correlationId the projects service and the worker log.
router.use(VIDEOS, (req, res, next) => {
  res.on("finish", () =>
    log("info", "video.gateway.request", req, {
      method: req.method,
      status: res.statusCode,
    }),
  );
  next();
});

router.post(`${VIDEOS}/uploads`, checkVideoToken, forward("post"));
router.get(VIDEOS, checkVideoToken, forward("get"));
router.post(
  `${VIDEOS}/:video/upload/complete`,
  checkVideoToken,
  forward("post"),
);
router.delete(`${VIDEOS}/:video/upload`, checkVideoToken, forward("delete"));
router.get(`${VIDEOS}/:video/playback`, checkVideoToken, forward("get"));
router.get(`${VIDEOS}/:video`, checkVideoToken, forward("get"));
router.get(`${VIDEOS}/:video/download`, checkVideoToken, forward("get"));

// Video tasks (B003; ADD T-01, T-03).
router.post(`${VIDEOS}/validate`, checkVideoToken, forward("post"));
router.post(`${VIDEOS}/:video/operations`, checkVideoToken, forward("post"));
// B008 (ADD 4.8, D-78): chains whose first step is a concat, without :video.
router.post(`${VIDEOS}/operations`, checkVideoToken, forward("post"));
// B008 revision (ADR-020): validation with the input properties of every step.
router.post(`${VIDEOS}/chain/validate`, checkVideoToken, forward("post"));
router.get(`${VIDEOS}/tasks/:taskId`, checkVideoToken, forward("get"));
router.delete(`${VIDEOS}/tasks/:taskId`, checkVideoToken, forward("delete"));

module.exports = router;
