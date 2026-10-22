// End-to-end tests of "create a project from a video" (UC-VID-000 FA6, D-30)
// against the running stack, through nginx. Same setup as e2e.test.js:
//
//   VIDEO_E2E_URL=https://localhost:8080 VIDEO_E2E_FIXTURES=<dir> \
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node --test test/video/e2e-project.test.js
//
// It runs the same calls as frontend/lib/video-project.ts: POST /projects/:user
// with no images, then the B001 upload flow into the new project.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const BASE = process.env.VIDEO_E2E_URL;
const FIXTURES = process.env.VIDEO_E2E_FIXTURES;
const MONGO =
  process.env.VIDEO_E2E_MONGO || "mongodb://localhost:27018/project";
const skip =
  !BASE || !FIXTURES ? "set VIDEO_E2E_URL and VIDEO_E2E_FIXTURES" : false;

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

async function register(type) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const r = await api("POST", "/users", {
    body: {
      name: `e2e ${type}`,
      email: `e2e-project-${type}-${stamp}@test.local`,
      password: "e2e-password",
      type,
    },
  });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  return { id: r.json.user._id, token: r.json.jwt };
}

// Step 1 of FA6: the existing route, with a name and no images.
async function createEmptyProject(user, name) {
  const r = await api("POST", `/projects/${user.id}`, {
    token: user.token,
    body: { name },
  });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  return r.json._id;
}

async function getProject(user, projectId) {
  const r = await api("GET", `/projects/${user.id}/${projectId}`, {
    token: user.token,
  });
  assert.equal(r.status, 200);
  return r.json;
}

async function listVideos(user, projectId) {
  const r = await api("GET", `/projects/${user.id}/${projectId}/videos`, {
    token: user.token,
  });
  assert.equal(r.status, 200);
  return r.json.videos;
}

async function requestUpload(user, projectId, fileName, mimeType, sizeBytes) {
  return api("POST", `/projects/${user.id}/${projectId}/videos/uploads`, {
    token: user.token,
    body: { fileName, mimeType, sizeBytes },
  });
}

async function waitForVideo(videoId, gone = false) {
  const Video = require("../../models/video");
  for (let i = 0; i < 300; i++) {
    const doc = await Video.findById(videoId).lean();
    if (gone ? !doc : doc && doc.status === "completed") return doc;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`video ${videoId} did not reach the expected state`);
}

test.describe("UC-VID-000 FA6 — create a project from a video", { skip }, () => {
  let user;

  test.before(async () => {
    await mongoose.connect(MONGO);
    user = await register("free");
  });

  test.after(() => mongoose.disconnect());

  test("an empty project receives the video, which is listed as completed", async () => {
    const projectId = await createEmptyProject(user, "Projeto de vídeo");
    assert.equal((await getProject(user, projectId)).imgs.length, 0);

    const data = fs.readFileSync(path.join(FIXTURES, "ok.mov"));
    const ticket = await requestUpload(
      user,
      projectId,
      "ok.mov",
      "video/quicktime",
      data.length,
    );
    assert.equal(ticket.status, 201, JSON.stringify(ticket.json));
    const put = await fetch(ticket.json.upload.url, {
      method: "PUT",
      headers: ticket.json.upload.headers,
      body: data,
    });
    assert.equal(put.status, 200);
    const done = await api(
      "POST",
      `/projects/${user.id}/${projectId}/videos/${ticket.json.videoId}/upload/complete`,
      { token: user.token },
    );
    assert.equal(done.status, 202);

    await waitForVideo(ticket.json.videoId);
    const videos = await listVideos(user, projectId);
    assert.equal(videos.length, 1);
    assert.equal(videos[0].id, ticket.json.videoId);
    assert.equal(videos[0].originalName, "ok.mov");
    assert.ok(videos[0].durationMs > 0);
    assert.match(videos[0].thumbnailUrl, /\/s3-video\//);

    // The project is still image-free and the video does not touch it.
    const project = await getProject(user, projectId);
    assert.equal(project.imgs.length, 0);
    assert.equal(project.name, "Projeto de vídeo");
  });

  test("a cancelled upload leaves the project created and empty", async () => {
    const projectId = await createEmptyProject(user, "Cancelado");
    const ticket = await requestUpload(
      user,
      projectId,
      "ok.mp4",
      "video/mp4",
      1024,
    );
    assert.equal(ticket.status, 201);
    const cancel = await api(
      "DELETE",
      `/projects/${user.id}/${projectId}/videos/${ticket.json.videoId}/upload`,
      { token: user.token },
    );
    assert.equal(cancel.status, 204);

    await waitForVideo(ticket.json.videoId, true);
    assert.deepEqual(await listVideos(user, projectId), []);
    assert.equal((await getProject(user, projectId)).imgs.length, 0);
  });

  test("a rejected video leaves the project created and empty, and another one can be uploaded", async () => {
    const projectId = await createEmptyProject(user, "Rejeitado");
    const bad = fs.readFileSync(path.join(FIXTURES, "hevc.mp4"));
    const ticket = await requestUpload(
      user,
      projectId,
      "hevc.mp4",
      "video/mp4",
      bad.length,
    );
    await fetch(ticket.json.upload.url, {
      method: "PUT",
      headers: ticket.json.upload.headers,
      body: bad,
    });
    await api(
      "POST",
      `/projects/${user.id}/${projectId}/videos/${ticket.json.videoId}/upload/complete`,
      { token: user.token },
    );
    await waitForVideo(ticket.json.videoId, true);
    assert.deepEqual(await listVideos(user, projectId), []);
    assert.equal((await getProject(user, projectId)).imgs.length, 0);

    // The project stays usable: a second, valid video goes in.
    const good = fs.readFileSync(path.join(FIXTURES, "ok.mp4"));
    const again = await requestUpload(
      user,
      projectId,
      "ok.mp4",
      "video/mp4",
      good.length,
    );
    assert.equal(again.status, 201);
    await fetch(again.json.upload.url, {
      method: "PUT",
      headers: again.json.upload.headers,
      body: good,
    });
    await api(
      "POST",
      `/projects/${user.id}/${projectId}/videos/${again.json.videoId}/upload/complete`,
      { token: user.token },
    );
    await waitForVideo(again.json.videoId);
    assert.equal((await listVideos(user, projectId)).length, 1);
  });
});
