var express = require("express");
var router = express.Router();

const axios = require("axios");
const crypto = require("crypto");
const https = require("https");
const fs = require("fs");

const { checkVideoToken } = require("../auth/videoAuth");

// Video chain presets (ADD 4.9, ADR-018). Mounted on /users before the existing
// router, which does not change; it only answers /:user/video-presets… and
// lets every other request through. On POST and PATCH with steps, the
// structure is checked by the projects service (one implementation of the
// chain rules, T-01) before the users service stores the preset.
const key = fs.readFileSync(__dirname + "/../certs/selfsigned.key");
const cert = fs.readFileSync(__dirname + "/../certs/selfsigned.crt");
const httpsAgent = new https.Agent({ rejectUnauthorized: false, cert, key });

const usersURL = "https://users:10001/";
const projectsURL = "https://projects:9001/";
const PRESETS = "/:user/video-presets";

function errorBody(req, status, data) {
  if (data && typeof data === "object" && data.error?.code)
    return { ...data, correlationId: data.correlationId || req.correlationId };
  const code = status === 404 ? "NOT_FOUND" : "INTERNAL_ERROR";
  return {
    error: { code, message: code, details: {} },
    correlationId: req.correlationId,
  };
}

function fail(req, res, err) {
  const status = err.response?.status || 502;
  if (status >= 500)
    console.error(
      JSON.stringify({
        level: "error",
        event: "video.gateway.presets_upstream_error",
        service: "api_gateway",
        correlationId: req.correlationId,
        status,
        message: err.message,
      }),
    );
  return res.status(status).json(errorBody(req, status, err.response?.data));
}

// Steps without concat, frame extraction or server fields (D-79, D-83, D-85).
async function checkedSteps(req) {
  const resp = await axios.post(
    projectsURL + "video/chain-structure",
    { steps: req.body?.steps, preset: true },
    { httpsAgent, headers: { "X-Correlation-Id": req.correlationId } },
  );
  return resp.data.steps;
}

function forward(method) {
  return async (req, res) => {
    try {
      let data;
      if (method === "post" || method === "patch") {
        data = { ...(req.body || {}) };
        if (method === "post" || req.body?.steps !== undefined)
          data.steps = await checkedSteps(req);
      }
      const resp = await axios.request({
        method,
        url:
          usersURL +
          req.originalUrl.replace(/^\/users\//, "users/").split("?")[0],
        data,
        httpsAgent,
        headers: { Authorization: req.headers["authorization"] },
      });
      if (resp.status === 204) return res.status(204).end();
      return res.status(resp.status).json(resp.data);
    } catch (err) {
      return fail(req, res, err);
    }
  };
}

router.use(PRESETS, (req, res, next) => {
  req.correlationId = crypto.randomUUID();
  next();
});

router.get(PRESETS, checkVideoToken, forward("get"));
router.post(PRESETS, checkVideoToken, forward("post"));
router.patch(`${PRESETS}/:id`, checkVideoToken, forward("patch"));
router.delete(`${PRESETS}/:id`, checkVideoToken, forward("delete"));

module.exports = router;
