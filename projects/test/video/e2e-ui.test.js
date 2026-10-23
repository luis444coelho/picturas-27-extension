// Browser end-to-end tests of D-30 (create a project from a video, UC-VID-000
// FA6) and D-31 (completed videos in the main area of the project, steps 7
// and 8), against the running stack. Opt-in: needs playwright-core and its
// Chromium, which are not dependencies of the repository.
//
//   VIDEO_E2E_URL=https://localhost:8080 VIDEO_E2E_FIXTURES=<dir> \
//   VIDEO_E2E_PLAYWRIGHT=<path to node_modules/playwright-core> \
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node --test test/video/e2e-ui.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const BASE = process.env.VIDEO_E2E_URL;
const FIXTURES = process.env.VIDEO_E2E_FIXTURES;
const PLAYWRIGHT = process.env.VIDEO_E2E_PLAYWRIGHT;
const SHOTS = process.env.VIDEO_E2E_SCREENSHOTS;
const MONGO =
  process.env.VIDEO_E2E_MONGO || "mongodb://localhost:27018/project";
const skip =
  !BASE || !FIXTURES || !PLAYWRIGHT
    ? "set VIDEO_E2E_URL, VIDEO_E2E_FIXTURES and VIDEO_E2E_PLAYWRIGHT"
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

async function shot(page, name) {
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
}

test.describe("D-30 and D-31 in the browser", { skip }, () => {
  let browser;
  let page;
  let user;
  let Video;

  test.before(async () => {
    await mongoose.connect(MONGO);
    Video = require("../../models/video");
    const { chromium } = require(PLAYWRIGHT);
    browser = await chromium.launch();
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1440, height: 900 },
    });
    page = await context.newPage();

    // Sign up through the UI: the existing login of users created with
    // POST /users answers 701 in this stack (see the Stage 5 report).
    const email = `e2e-ui-${Date.now()}@test.local`;
    await page.goto(`${BASE}/register`);
    await page.fill("#first-name", "e2e");
    await page.fill("#last-name", "ui");
    await page.fill("#email", email);
    await page.fill("#password", "e2e-password");
    await page.fill("#confirm-password", "e2e-password");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    const session = JSON.parse(
      await page.evaluate(() => localStorage.getItem("session")),
    );
    assert.equal(session.user.type, "free");
    user = { id: session.user._id, token: session.token };
  });

  test.after(async () => {
    await browser?.close();
    await mongoose.disconnect();
  });

  async function openNewVideoProject(name, files) {
    await page.goto(`${BASE}/dashboard`);
    await page.getByRole("button", { name: "New Project" }).click();
    await page.getByRole("tab", { name: "Vídeo" }).click();
    await page.getByRole("button", { name: "Novo projeto com vídeo" }).click();
    const dialog = page.getByRole("dialog").last();
    await dialog.getByLabel("Nome do projeto").fill(name);
    await dialog.locator('input[type="file"]').setInputFiles(files);
    return dialog;
  }

  function projectIdOf(url) {
    return new URL(url).pathname.split("/").pop();
  }

  test("D-30: creates the project from a MOV, opens it and shows the video next to the images (D-31)", async () => {
    const dialog = await openNewVideoProject(
      "UI vídeo",
      path.join(FIXTURES, "ok.mov"),
    );
    await dialog.getByText("ok.mov").waitFor();
    await shot(page, "d30-dialog");
    await dialog.getByRole("button", { name: "Criar" }).click();

    await page.waitForURL(/\/dashboard\/[0-9a-f]{24}/);
    const projectId = projectIdOf(page.url());
    const list = page.getByRole("complementary", { name: "Vídeos do projeto" });
    const item = list.getByRole("button", { name: /ok\.mov/ });
    await item.waitFor({ timeout: 60000 });

    // Thumbnail loaded, video icon and formatted duration (step 7).
    const loaded = await list
      .locator("img")
      .first()
      .evaluate((img) => img.complete && img.naturalWidth > 0);
    assert.ok(loaded, "the thumbnail must load through /s3-video/");
    await list.getByLabel("Vídeo").first().waitFor();
    assert.match(await item.innerText(), /\d+:\d{2}/);
    await shot(page, "d31-project");

    // The project has no images (D-30).
    const project = await api("GET", `/projects/${user.id}/${projectId}`, {
      token: user.token,
    });
    assert.equal(project.json.imgs.length, 0);
    assert.equal(project.json.name, "UI vídeo");

    // Step 8: the integrated player opens and loads the video.
    await item.click();
    const player = page.getByRole("dialog").locator("video");
    await player.waitFor();
    await page.waitForFunction(
      () => (document.querySelector("[role=dialog] video")?.readyState ?? 0) >= 1,
      null,
      { timeout: 30000 },
    );
    assert.equal(await player.getAttribute("controls"), "");
    await shot(page, "d31-player");
    await page.keyboard.press("Escape");
  });

  test("D-31: a video uploaded elsewhere shows up without reloading, by video-ingest-update", async () => {
    const projectId = (
      await api("POST", `/projects/${user.id}`, {
        token: user.token,
        body: { name: "UI evento" },
      })
    ).json._id;
    await page.goto(`${BASE}/dashboard/${projectId}`);
    await page.getByRole("heading", { name: "UI evento" }).waitFor();
    const list = page.getByRole("complementary", { name: "Vídeos do projeto" });
    assert.equal(await list.count(), 0, "no list while there are no videos");

    // Upload through the API while the page stays open.
    const data = fs.readFileSync(path.join(FIXTURES, "ok.mp4"));
    const ticket = await api(
      "POST",
      `/projects/${user.id}/${projectId}/videos/uploads`,
      {
        token: user.token,
        body: { fileName: "evento.mp4", mimeType: "video/mp4", sizeBytes: data.length },
      },
    );
    await fetch(ticket.json.upload.url, {
      method: "PUT",
      headers: ticket.json.upload.headers,
      body: data,
    });
    await api(
      "POST",
      `/projects/${user.id}/${projectId}/videos/${ticket.json.videoId}/upload/complete`,
      { token: user.token },
    );

    // The list refreshes every 10 min otherwise; 30 s proves the event.
    await list
      .getByRole("button", { name: /evento\.mp4/ })
      .waitFor({ timeout: 30000 });
  });

  test("D-30: cancelling the transfer opens the project created and empty", async () => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: 512 * 1024,
    });

    const dialog = await openNewVideoProject("UI cancelado", {
      name: "grande.mp4",
      mimeType: "video/mp4",
      buffer: Buffer.alloc(20 * MB, 7),
    });
    await dialog.getByRole("button", { name: "Criar" }).click();
    await dialog.getByText(/^[1-9]\d?%$/).waitFor({ timeout: 30000 });
    await shot(page, "d30-progress");
    await dialog.getByRole("button", { name: "Cancelar carregamento" }).click();

    await page.waitForURL(/\/dashboard\/[0-9a-f]{24}/);
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
    await page.getByText("Carregamento cancelado").first().waitFor();
    const projectId = projectIdOf(page.url());

    const project = await api("GET", `/projects/${user.id}/${projectId}`, {
      token: user.token,
    });
    assert.equal(project.status, 200);
    assert.equal(project.json.imgs.length, 0);
    let left = 1;
    for (let i = 0; i < 50 && left; i++) {
      left = await Video.countDocuments({ project_id: projectId });
      if (left) await new Promise((r) => setTimeout(r, 200));
    }
    assert.equal(left, 0, "the cancelled video must not stay in videos");
  });

  test("D-30: a video rejected by the ingestion is reported after the project opens, which stays empty", async () => {
    const dialog = await openNewVideoProject(
      "UI rejeitado",
      path.join(FIXTURES, "hevc.mp4"),
    );
    await dialog.getByRole("button", { name: "Criar" }).click();
    await page.waitForURL(/\/dashboard\/[0-9a-f]{24}/);
    const projectId = projectIdOf(page.url());

    await page
      .getByText(/Os codecs do vídeo não são suportados/)
      .first()
      .waitFor({ timeout: 60000 });
    await shot(page, "d30-rejected");
    assert.equal(
      await page.getByRole("complementary", { name: "Vídeos do projeto" }).count(),
      0,
    );
    const project = await api("GET", `/projects/${user.id}/${projectId}`, {
      token: user.token,
    });
    assert.equal(project.json.imgs.length, 0);
  });

  test("D-30: the client blocks an unsupported format before creating anything", async () => {
    const before = await api("GET", `/projects/${user.id}`, {
      token: user.token,
    });
    const dialog = await openNewVideoProject("UI mkv", {
      name: "clip.mkv",
      mimeType: "video/x-matroska",
      buffer: Buffer.alloc(1024),
    });
    await page.getByText(/Só são suportados vídeos MP4, MOV e AVI/).first().waitFor();
    assert.ok(await dialog.getByRole("button", { name: "Criar" }).isDisabled());
    const after = await api("GET", `/projects/${user.id}`, {
      token: user.token,
    });
    assert.equal(after.json.length, before.json.length);
  });

  test("the Vídeos window stays the upload point: it rejects an MKV and uploads an MP4 that shows up in the main area", async () => {
    const projectId = (
      await api("POST", `/projects/${user.id}`, {
        token: user.token,
        body: { name: "UI janela" },
      })
    ).json._id;
    await page.goto(`${BASE}/dashboard/${projectId}`);
    await page.getByRole("button", { name: "Vídeos" }).first().click();
    const dialog = page.getByRole("dialog");
    const input = dialog.locator('input[type="file"]');

    await input.setInputFiles({
      name: "clip.mkv",
      mimeType: "video/x-matroska",
      buffer: Buffer.alloc(1024),
    });
    await page.getByText(/Só são suportados vídeos MP4, MOV e AVI/).first().waitFor();

    await input.setInputFiles(path.join(FIXTURES, "ok.mp4"));
    await dialog.getByRole("button", { name: "Carregar" }).click();
    await page.getByText("Vídeo carregado").first().waitFor({ timeout: 60000 });
    await page.keyboard.press("Escape");
    await page
      .getByRole("complementary", { name: "Vídeos do projeto" })
      .getByRole("button", { name: /ok\.mp4/ })
      .waitFor();
    await shot(page, "b001-window");
  });
});
