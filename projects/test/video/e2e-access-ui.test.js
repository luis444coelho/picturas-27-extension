// Browser end-to-end tests of UC-VID-006 (download) and UC-VID-007
// (information panel) against the running stack. Checks D-34: the file is
// downloaded (not opened in the browser's player) with the suggested name,
// accents included. Opt-in: needs playwright-core and its Chromium, which are
// not dependencies of the repository.
//
//   VIDEO_E2E_URL=https://localhost:8080 VIDEO_E2E_FIXTURES=<dir> \
//   VIDEO_E2E_PLAYWRIGHT=<path to node_modules/playwright-core> \
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node --test test/video/e2e-access-ui.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const BASE = process.env.VIDEO_E2E_URL;
const FIXTURES = process.env.VIDEO_E2E_FIXTURES;
const PLAYWRIGHT = process.env.VIDEO_E2E_PLAYWRIGHT;
const SHOTS = process.env.VIDEO_E2E_SCREENSHOTS;
const skip =
  !BASE || !FIXTURES || !PLAYWRIGHT
    ? "set VIDEO_E2E_URL, VIDEO_E2E_FIXTURES and VIDEO_E2E_PLAYWRIGHT"
    : false;
const MIME = { ".mp4": "video/mp4", ".avi": "video/x-msvideo" };

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

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

test.describe("UC-VID-006 and UC-VID-007 in the browser", { skip }, () => {
  let browser;
  let page;
  let user;
  let projectId;
  const files = {};

  async function ingest(fixtureName, as) {
    const data = fs.readFileSync(path.join(FIXTURES, fixtureName));
    const url = `/projects/${user.id}/${projectId}/videos`;
    const ticket = await api("POST", `${url}/uploads`, {
      token: user.token,
      body: {
        fileName: as,
        mimeType: MIME[path.extname(fixtureName)],
        sizeBytes: data.length,
      },
    });
    assert.equal(ticket.status, 201, JSON.stringify(ticket.json));
    const put = await fetch(ticket.json.upload.url, {
      method: "PUT",
      headers: ticket.json.upload.headers,
      body: data,
    });
    assert.equal(put.status, 200);
    const videoId = ticket.json.videoId;
    await api("POST", `${url}/${videoId}/upload/complete`, {
      token: user.token,
    });
    for (let i = 0; i < 120; i++) {
      const info = await api("GET", `${url}/${videoId}`, { token: user.token });
      if (info.json?.status === "completed") return data;
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`ingestion of ${fixtureName} did not complete`);
  }

  test.before(async () => {
    const { chromium } = require(PLAYWRIGHT);
    browser = await chromium.launch();
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      acceptDownloads: true,
      viewport: { width: 1440, height: 900 },
    });
    page = await context.newPage();

    // Sign up through the UI, as in e2e-ui.test.js (B001 Stage 5 report).
    const email = `e2e-ui-${Date.now()}@test.local`;
    await page.goto(`${BASE}/register`);
    await page.fill("#first-name", "e2e");
    await page.fill("#last-name", "access");
    await page.fill("#email", email);
    await page.fill("#password", "e2e-password");
    await page.fill("#confirm-password", "e2e-password");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    const session = JSON.parse(
      await page.evaluate(() => localStorage.getItem("session")),
    );
    user = { id: session.user._id, token: session.token };

    const project = await api("POST", `/projects/${user.id}`, {
      token: user.token,
      body: { name: "e2e acesso UI" },
    });
    projectId = project.json._id;
    files.avi = await ingest("ok.avi", "Férias São João.avi");
    files.mp4 = await ingest("ok.mp4", "rodado.mp4");
  });

  test.after(async () => {
    await browser?.close();
  });

  async function openPlayer(name) {
    await page.goto(`${BASE}/dashboard/${projectId}`);
    const list = page.getByRole("complementary", { name: "Vídeos do projeto" });
    const item = list.getByRole("button", { name: new RegExp(name) });
    await item.waitFor({ timeout: 30000 });
    await item.click();
    const player = page.getByRole("dialog");
    await player.locator("video").waitFor();
    return player;
  }

  async function panelValues(dialog) {
    return dialog
      .locator("dl")
      .first()
      .evaluate((dl) => {
        const out = {};
        const terms = dl.querySelectorAll("dt");
        terms.forEach((dt) => {
          out[dt.textContent.trim()] = dt.nextElementSibling.textContent.trim();
        });
        return out;
      });
  }

  test("information panel from the player: formatted values of the AVI (INFO-001 to 006)", async () => {
    const player = await openPlayer("Férias São João");
    await player.getByRole("button", { name: "Informações" }).click();
    const panel = page.getByRole("dialog", { name: "Informações" });
    await panel.getByText("Taxa de fotogramas").waitFor();
    await shot(page, "b002-info-avi");

    const values = await panelValues(panel);
    assert.equal(values["Nome"], "Férias São João.avi");
    assert.match(values["Duração"], /^00:00:0\d\.\d{3}$/);
    assert.equal(values["Resolução"], "320 × 240 px");
    assert.equal(values["Formato"], "AVI (MPEG-4 / MP3)");
    assert.equal(
      values["Tamanho"],
      `${(files.avi.length / 1024 ** 2).toFixed(2)} MB`,
    );
    assert.equal(values["Taxa de fotogramas"], "25.00 fps");
    await page.keyboard.press("Escape");
  });

  test("information panel: display resolution of a video tagged 90° (INFO-003)", async () => {
    const player = await openPlayer("rodado");
    await player.getByRole("button", { name: "Informações" }).click();
    const panel = page.getByRole("dialog", { name: "Informações" });
    await panel.getByText("Resolução").waitFor();
    const values = await panelValues(panel);
    assert.equal(values["Resolução"], "360 × 640 px");
    assert.equal(values["Formato"], "MP4 (H.264 / AAC)");
    assert.equal(values["Taxa de fotogramas"], "30.00 fps");
    await page.keyboard.press("Escape");
  });

  test("D-34: the file is downloaded, not opened, with the accented suggested name and the same bytes (DOWNLOAD-005, 006)", async () => {
    const player = await openPlayer("Férias São João");
    await player.getByRole("button", { name: "Descarregar" }).click();
    const dialog = page.getByRole("dialog", { name: "Descarregar vídeo" });

    // First moment: name, format and size, no URL yet (ADD 4.1).
    await dialog.getByText("Férias São João.avi").waitFor();
    const values = await panelValues(dialog);
    assert.equal(values["Nome do ficheiro"], "Férias São João.avi");
    assert.equal(values["Formato"], "AVI (MPEG-4 / MP3)");
    await shot(page, "b002-download-dialog");

    const urlBefore = page.url();
    const pages = page.context().pages().length;
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      dialog.getByRole("button", { name: "Descarregar" }).click(),
    ]);

    assert.equal(download.suggestedFilename(), "Férias São João.avi");
    assert.match(download.url(), /\/s3-video\/.*\/video_src\/.*\.avi\?/);
    const saved = await download.path();
    assert.equal(sha256(fs.readFileSync(saved)), sha256(files.avi));

    // Not opened: same page, no new tab.
    assert.equal(page.url(), urlBefore);
    assert.equal(page.context().pages().length, pages);
    await dialog.getByText("O descarregamento começou").waitFor();
    await shot(page, "b002-download-started");
    await page.keyboard.press("Escape");
  });

  test("actions also in the gallery of the 'Vídeos' window (UC-VID-006 FA1, UC-VID-007 FA3)", async () => {
    await page.goto(`${BASE}/dashboard/${projectId}`);
    await page.getByRole("button", { name: "Vídeos" }).first().click();
    const window = page.getByRole("dialog", { name: "Vídeos" });
    await window.getByText("Férias São João.avi").waitFor({ timeout: 30000 });
    const actions = window.getByRole("button", { name: "Informações" });
    assert.equal(await actions.count(), 2);
    assert.equal(
      await window.getByRole("button", { name: "Descarregar" }).count(),
      2,
    );
    await shot(page, "b002-gallery");
  });
});
