// Large transfers through nginx /s3-video/ (UPLOAD-005, T-08, D-11). Opt-in,
// because it moves hundreds of MB:
//
//   VIDEO_E2E_URL=https://localhost:8080 VIDEO_E2E_LARGE=1 \
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node --test test/video/e2e-large.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const mongoose = require("mongoose");

const BASE = process.env.VIDEO_E2E_URL;
const MONGO =
  process.env.VIDEO_E2E_MONGO || "mongodb://localhost:27018/project";
const skip =
  !BASE || !process.env.VIDEO_E2E_LARGE
    ? "set VIDEO_E2E_URL and VIDEO_E2E_LARGE"
    : false;
const MB = 1024 * 1024;

async function api(method, url, { token, body } = {}) {
  const resp = await fetch(`${BASE}/api-gateway${url}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await resp.text();
  return { status: resp.status, json: text ? JSON.parse(text) : null };
}

test.describe("large uploads", { skip }, () => {
  let user;
  let project;
  let Video;

  test.before(async () => {
    await mongoose.connect(MONGO);
    Video = require("../../models/video");
    const stamp = Date.now();
    const r = await api("POST", "/users", {
      body: {
        name: "e2e large",
        email: `e2e-large-${stamp}@test.local`,
        password: "e2e-password",
        type: "free",
      },
    });
    user = { id: r.json.user._id, token: r.json.jwt };
    project = (
      await api("POST", `/projects/${user.id}`, {
        token: user.token,
        body: { name: "large" },
      })
    ).json._id;
  });

  test.after(() => mongoose.disconnect());

  test("150 MB goes through /s3-video/ in streaming; a non-video body ends as CORRUPTED_FILE and is purged", async () => {
    const size = 150 * MB;
    const data = crypto.randomBytes(size);
    const ticket = await api(
      "POST",
      `/projects/${user.id}/${project}/videos/uploads`,
      {
        token: user.token,
        body: { fileName: "noise.mp4", mimeType: "video/mp4", sizeBytes: size },
      },
    );
    assert.equal(ticket.status, 201);

    const started = performance.now();
    const put = await fetch(ticket.json.upload.url, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4" },
      body: data,
    });
    const seconds = (performance.now() - started) / 1000;
    assert.equal(put.status, 200);
    console.log(
      `PUT 150 MB through /s3-video/: ${seconds.toFixed(1)} s (${(150 / seconds).toFixed(0)} MB/s)`,
    );

    const done = await api(
      "POST",
      `/projects/${user.id}/${project}/videos/${ticket.json.videoId}/upload/complete`,
      {
        token: user.token,
      },
    );
    assert.equal(done.status, 202);

    // The worker downloads 150 MB, FFprobe refuses it, and the cleanup runs.
    let doc = await Video.findById(ticket.json.videoId).lean();
    for (let i = 0; i < 300 && doc; i++) {
      await new Promise((r) => setTimeout(r, 200));
      doc = await Video.findById(ticket.json.videoId).lean();
    }
    assert.equal(doc, null, "the corrupted upload must be purged");
  });

  test("nginx refuses bodies above 2 GB on /s3-video/ with 413", async () => {
    const ticket = await api(
      "POST",
      `/projects/${user.id}/${project}/videos/uploads`,
      {
        token: user.token,
        body: {
          fileName: "big.mp4",
          mimeType: "video/mp4",
          sizeBytes: 100 * MB,
        },
      },
    );
    const url = new URL(ticket.json.upload.url);
    const status = await new Promise((resolve, reject) => {
      const req = require("https").request(
        {
          host: url.hostname,
          port: url.port,
          path: url.pathname + url.search,
          method: "PUT",
          rejectUnauthorized: false,
          headers: {
            "Content-Type": "video/mp4",
            "Content-Length": String(2 * 1024 * MB + 1),
          },
        },
        (res) => resolve(res.statusCode),
      );
      req.on("error", reject);
      req.write(Buffer.alloc(1024));
      setTimeout(() => req.destroy(), 5000);
    });
    assert.equal(status, 413);
    await api(
      "DELETE",
      `/projects/${user.id}/${project}/videos/${ticket.json.videoId}/upload`,
      { token: user.token },
    );
  });
});
