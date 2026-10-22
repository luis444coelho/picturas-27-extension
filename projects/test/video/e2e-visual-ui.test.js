// B005 browser check of D-66: with a B004 task active, a B005 request from
// the new panel shows the server error in the interface. Runs on the host with
// Node 22 (global WebSocket) and any Chromium, driven through the DevTools
// protocol without new dependencies. Explicitly opt in:
// VIDEO_UI_URL=https://localhost:8080 VIDEO_UI_BROWSER=<chromium binary> \
// VIDEO_E2E_FIXTURES=<dir with quad.mp4 and long.mp4> NODE_TLS_REJECT_UNAUTHORIZED=0 \
// node --test projects/test/video/e2e-visual-ui.test.js
// Own user/project are deleted through the API in after(); the maintenance
// routine of B003 removes the videos and objects of the deleted project.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const BASE = process.env.VIDEO_UI_URL,
  BROWSER = process.env.VIDEO_UI_BROWSER,
  FIXTURES = process.env.VIDEO_E2E_FIXTURES,
  SHOTS = process.env.VIDEO_UI_SCREENSHOTS;
const skip = !BASE || !BROWSER || !FIXTURES ? "set VIDEO_UI_URL, VIDEO_UI_BROWSER and VIDEO_E2E_FIXTURES" : false;
const PORT = 9300 + Math.floor(Math.random() * 500);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const state = {};

async function api(method, route, token, body, headers = {}) {
  const response = await fetch(`${BASE}/api-gateway${route}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: response.status, data };
}
async function until(fn, label, timeout = 120000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const result = await fn();
    if (result) return result;
    await sleep(250);
  }
  throw new Error(`timeout: ${label}`);
}
async function upload(user, name) {
  const data = fs.readFileSync(path.join(FIXTURES, name));
  const route = `/projects/${user.id}/${state.project}/videos`;
  const r = await api("POST", `${route}/uploads`, user.token, { fileName: name, mimeType: "video/mp4", sizeBytes: data.length });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const put = await fetch(r.data.upload.url, { method: "PUT", headers: { "Content-Type": "video/mp4" }, body: data });
  assert.equal(put.status, 200);
  assert.equal((await api("POST", `${route}/${r.data.videoId}/upload/complete`, user.token)).status, 202);
  await until(async () => {
    // The gallery lists only completed videos; the information gives failures.
    const list = await api("GET", route, user.token);
    if (list.data.videos.some((v) => v.id === r.data.videoId)) return true;
    const info = await api("GET", `${route}/${r.data.videoId}`, user.token);
    if (info.data?.status === "failed") throw new Error(`ingest failed: ${name}`);
    return false;
  }, `ingest ${name}`);
  return r.data.videoId;
}

// Minimal DevTools protocol client over the global WebSocket of Node 22.
async function devtools() {
  const list = await until(async () => {
    try {
      return await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    } catch {
      return null;
    }
  }, "devtools endpoint", 30000);
  const page = list.find((t) => t.type === "page");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let id = 0;
  const pending = new Map();
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      id += 1;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  return { socket, send, evaluate };
}

// Clicks the first visible element whose text (or title/aria-label) matches.
const click = (selector, text) => `(() => {
  const items = [...document.querySelectorAll(${JSON.stringify(selector)})];
  const found = items.find((el) => [el.innerText, el.title, el.getAttribute("aria-label")]
    .some((value) => (value || "").includes(${JSON.stringify(text)})) && !el.disabled);
  if (!found) return false;
  found.click();
  return true;
})()`;

test.describe("B005 browser: D-66", { skip, timeout: 300000 }, () => {
  test.before(async () => {
    const email = `b005-ui-${Date.now()}-${Math.random().toString(16).slice(2)}@test.local`;
    const r = await api("POST", "/users", null, { name: "B005 UI test", email, password: "b005-test-password", type: "premium" });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    state.user = { id: r.data.user._id, token: r.data.jwt, doc: r.data.user };
    const p = await api("POST", `/projects/${state.user.id}`, state.user.token, { name: "B005 UI test" });
    assert.equal(p.status, 201);
    state.project = p.data._id;
    state.quad = await upload(state.user, "quad.mp4");
    state.long = await upload(state.user, "long.mp4");
    state.profile = fs.mkdtempSync(path.join(os.tmpdir(), "b005-ui-profile-"));
    state.browser = spawn(BROWSER, [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${state.profile}`,
      "--ignore-certificate-errors",
      "--no-first-run",
      "--window-size=1400,1000",
      "about:blank",
    ], { stdio: "ignore" });
  });

  test.after(async () => {
    try {
      state.cdp?.socket.close();
      state.browser?.kill();
      if (state.b004) await api("DELETE", `/projects/${state.user.id}/${state.project}/videos/tasks/${state.b004}`, state.user.token);
      if (state.project) {
        const info = await api("GET", `/projects/${state.user.id}/${state.project}`, state.user.token);
        const removed = await api("DELETE", `/projects/${state.user.id}/${state.project}`, state.user.token, null, { "X-Project-Version": String(info.data?.version ?? 0) });
        console.log("B005 UI cleanup: project", removed.status);
      }
      if (state.user) console.log("B005 UI cleanup: user", (await api("DELETE", `/users/${state.user.id}`, state.user.token)).status);
    } finally {
      if (state.profile) fs.rmSync(state.profile, { recursive: true, force: true });
    }
  });

  const startB004 = async () => {
    const started = await api("POST", `/projects/${state.user.id}/${state.project}/videos/${state.long}/operations`, state.user.token, {
      steps: [{ operation: "speed", version: 1, parameters: { factor: 0.25 } }],
    });
    assert.equal(started.status, 202, JSON.stringify(started.data));
    state.b004 = started.data.taskId;
    return started.data.taskId;
  };
  const stopB004 = async () => {
    await api("DELETE", `/projects/${state.user.id}/${state.project}/videos/tasks/${state.b004}`, state.user.token);
    await until(async () => {
      const task = await api("GET", `/projects/${state.user.id}/${state.project}/videos/tasks/${state.b004}`, state.user.token);
      return ["completed", "failed", "cancelled"].includes(task.data.status);
    }, "B004 task finished");
    state.b004 = null;
  };
  const applyEnabled = `[...document.querySelectorAll("button")].some((b) => b.innerText.includes("Aplicar filtro") && !b.disabled)`;
  // Opens the project, the video, the B005 filters panel and selects a filter.
  async function openFilterPanel(blockSocket) {
    if (!state.cdp) {
      state.cdp = await devtools();
      await state.cdp.send("Page.enable");
      await state.cdp.send("Network.enable");
    }
    const { send, evaluate } = state.cdp;
    await send("Network.setBlockedURLs", { urls: blockSocket ? ["*socket.io*"] : [] });
    // setBlockedURLs stops socket.io polling; the WebSocket transport is
    // refused before any page script runs, so no task event reaches the page.
    if (blockSocket && !state.socketBlocked) {
      await send("Page.addScriptToEvaluateOnNewDocument", {
        source: "window.WebSocket = class { constructor() { throw new Error('blocked by the B005 test'); } };",
      });
      state.socketBlocked = true;
    }
    await send("Page.navigate", { url: `${BASE}/login` });
    await sleep(1500);
    const doc = state.user.doc;
    const session = {
      user: { _id: doc._id, name: doc.name, email: doc.email, type: doc.type, operations: doc.operations, remaining_operations: doc.remaining_operations },
      token: state.user.token,
    };
    await evaluate(`localStorage.setItem("session", ${JSON.stringify(JSON.stringify(session))}); sessionStorage.clear(); true`);
    await send("Page.navigate", { url: `${BASE}/dashboard/${state.project}` });
    await until(() => evaluate(click("button", "Vídeos do projeto")), "videos button", 60000);
    await until(() => evaluate(click("button", "quad.mp4")), "gallery item", 60000);
    await until(() => evaluate(click("button", "Filtros")), "B005 filters button", 60000);
    await until(() => evaluate(click("[role=radio]", "Preto e Branco")), "filter choice", 30000);
    await until(() => evaluate(applyEnabled), "enabled apply button (validation passed)", 30000);
  }
  async function screenshot(name) {
    if (!SHOTS) return;
    const shot = await state.cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(SHOTS, name), Buffer.from(shot.data, "base64"));
  }

  test("with the WebSocket connected, the B005 panel is disabled while a B004 task is active", async () => {
    await openFilterPanel(false);
    await startB004();
    await until(async () => !(await state.cdp.evaluate(applyEnabled)), "B005 apply disabled by the project task event", 15000);
    await screenshot("b005-d66-busy.png");
    await stopB004();
    await until(() => state.cdp.evaluate(applyEnabled), "B005 apply enabled again after the B004 task ends", 30000);
  });

  test("without task events (WebSocket blocked), a B005 request during a B004 task shows TASK_ALREADY_ACTIVE with the support code", async () => {
    const { evaluate } = state.cdp;
    await openFilterPanel(true);
    await startB004();
    assert.equal(await evaluate(applyEnabled), true, "no event reached the page");
    assert.equal(await evaluate(click("button", "Aplicar filtro")), true);
    const shown = await until(
      () => evaluate(`(() => { const t = document.body.innerText; const i = t.indexOf("Este projeto já tem uma tarefa de vídeo em curso"); return i >= 0 ? t.slice(i, i + 200) : null; })()`),
      "server error in the interface",
      30000,
    ).catch(async (err) => {
      console.log("B005 UI page text:", JSON.stringify((await evaluate("document.body.innerText")).slice(-1500)));
      await screenshot("b005-d66-failure.png");
      throw err;
    });
    assert.match(shown, /Este projeto já tem uma tarefa de vídeo em curso/);
    assert.match(shown, /Código de suporte: [0-9a-f-]{36}/);
    console.log("B005 UI shown:", JSON.stringify(shown));
    await screenshot("b005-d66-error.png");
    const task = await api("GET", `/projects/${state.user.id}/${state.project}/videos/tasks/${state.b004}`, state.user.token);
    assert.ok(["queued", "processing"].includes(task.data.status), "the B004 task was still active");
    await stopB004();
  });
});
