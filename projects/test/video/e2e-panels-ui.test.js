// B008 revision (D-87, ADR-020): the simple edit of the nine video operations
// must look and behave as before the extraction of their configuration
// components. Captures, in a real browser (any Chromium, DevTools protocol, no
// new dependencies), the normalized DOM of every panel before and after one
// interaction, and either writes it (first run, against the baseline frontend
// of origin/main) or compares it with what was written (run on the current
// frontend). Also checks the three actions of B008. Runs on the host with
// Node 22. Explicitly opt in:
// VIDEO_UI_URL=https://localhost:8080 VIDEO_UI_BROWSER=<chromium binary> \
// VIDEO_E2E_FIXTURES=<dir with wide.mp4> VIDEO_UI_SNAPSHOTS=<dir> \
// [VIDEO_UI_RECORD=1] NODE_TLS_REJECT_UNAUTHORIZED=0 \
// node --test projects/test/video/e2e-panels-ui.test.js
// The own user and project are deleted through the API in after().
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const BASE = process.env.VIDEO_UI_URL,
  BROWSER = process.env.VIDEO_UI_BROWSER,
  FIXTURES = process.env.VIDEO_E2E_FIXTURES,
  SNAPSHOTS = process.env.VIDEO_UI_SNAPSHOTS,
  RECORD = process.env.VIDEO_UI_RECORD === "1";
const skip =
  !BASE || !BROWSER || !FIXTURES || !SNAPSHOTS
    ? "set VIDEO_UI_URL, VIDEO_UI_BROWSER, VIDEO_E2E_FIXTURES and VIDEO_UI_SNAPSHOTS"
    : false;
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
async function until(fn, label, timeout = 60000) {
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
  const r = await api("POST", `${route}/uploads`, user.token, {
    fileName: name,
    mimeType: "video/mp4",
    sizeBytes: data.length,
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const put = await fetch(r.data.upload.url, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: data,
  });
  assert.equal(put.status, 200);
  assert.equal(
    (
      await api(
        "POST",
        `${route}/${r.data.videoId}/upload/complete`,
        user.token,
      )
    ).status,
    202,
  );
  await until(
    async () => {
      const list = await api("GET", route, user.token);
      return list.data.videos.some((v) => v.id === r.data.videoId);
    },
    `ingest ${name}`,
    120000,
  );
  return r.data.videoId;
}

// Minimal DevTools protocol client over the global WebSocket of Node 22.
async function devtools() {
  const list = await until(
    async () => {
      try {
        return await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      } catch {
        return null;
      }
    },
    "devtools endpoint",
    30000,
  );
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
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  return { socket, send, evaluate };
}

// Clicks the first visible, enabled element whose text, title or aria-label matches.
const click = (selector, text, scope = "document") => `(() => {
  const root = ${scope};
  if (!root) return false;
  const items = [...root.querySelectorAll(${JSON.stringify(selector)})];
  const found = items.find((el) => [el.innerText, el.title, el.getAttribute("aria-label")]
    .some((value) => (value || "").trim() === ${JSON.stringify(text)} || (value || "").includes(${JSON.stringify(text)})) && !el.disabled);
  if (!found) return false;
  found.click();
  return true;
})()`;
// Visible dialogs above the "Vídeos" dialog and the player dialog of the
// project page.
const PANEL_DIALOGS = `[...document.querySelectorAll('[role=dialog],[role=alertdialog]')].filter((d) => d.getClientRects().length > 0 && !d.innerText.includes("Carrega e reproduz os vídeos deste projeto") && !d.innerText.includes("Leitor integrado do projeto"))`;
const DIALOG = `${PANEL_DIALOGS}.filter((d) => d.getAttribute("role") === "dialog").pop()`;
// Sets the value of a React-controlled input or select inside the dialog.
const setValue = (selector, value) => `(() => {
  const el = ${DIALOG}?.querySelector(${JSON.stringify(selector)});
  if (!el) return false;
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
  return true;
})()`;
// Normalized DOM of the dialog: tags, classes, roles, states, values and
// texts; without generated ids, image or video sources and inline styles.
const SNAPSHOT = `(() => {
  const dialog = ${DIALOG};
  if (!dialog) return null;
  const DROP = new Set(["id", "src", "srcset", "style", "aria-controls", "aria-labelledby", "aria-describedby", "data-radix-collection-item", "tabindex"]);
  const walk = (node) => {
    if (node.nodeType === 3) {
      const text = node.textContent.replace(/\\s+/g, " ").trim();
      return text ? text : null;
    }
    if (node.nodeType !== 1) return null;
    const attrs = {};
    for (const a of node.attributes) if (!DROP.has(a.name)) attrs[a.name] = a.value;
    if ("value" in node && ["INPUT", "SELECT", "TEXTAREA"].includes(node.tagName) && node.type !== "file") attrs[":value"] = node.value;
    if ("disabled" in node) attrs[":disabled"] = String(node.disabled);
    const children = [...node.childNodes].map(walk).filter((c) => c !== null);
    return { tag: node.tagName.toLowerCase(), attrs, children };
  };
  return walk(dialog);
})()`;
const SETTLED = `(() => {
  const dialog = ${DIALOG};
  if (!dialog) return false;
  const text = dialog.innerText;
  return !text.includes("A validar") && !text.includes("A carregar") && !dialog.querySelector(".animate-spin");
})()`;

// One step to the right on the first slider of the dialog (keyboard of Radix).
const sliderRight = `(() => {
  const thumb = ${DIALOG}?.querySelector("[role=slider]");
  if (!thumb) return false;
  thumb.focus();
  thumb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  return true;
})()`;

// The nine panels of the simple edit: the button of the player, then one
// interaction with the controls of the panel.
const PANELS = [
  {
    id: "trim",
    button: "Recortar",
    act: [setValue("#trim-start", "00:00:00.500")],
  },
  {
    id: "remove_audio",
    button: "Remover áudio",
    act: [click("button", "Remover áudio · 1 crédito", DIALOG)],
    alert: true,
  },
  { id: "speed", button: "Velocidade", act: [click("button", "0.5×", DIALOG)] },
  {
    id: "watermark",
    button: "Marca de água",
    act: [setValue("#watermark-text", "B008")],
  },
  { id: "adjust", button: "Ajustar", act: [sliderRight] },
  {
    id: "filter",
    button: "Filtros",
    act: [click("[role=radio]", "Sépia", DIALOG)],
  },
  {
    id: "resize",
    button: "Redimensionar",
    act: [click("button", "480p", DIALOG)],
  },
  {
    id: "orient",
    button: "Rodar / espelhar",
    act: [click("button", "90°", DIALOG)],
  },
  {
    id: "convert",
    button: "Converter formato",
    act: [setValue("#video-convert-target", "avi")],
  },
];

test.describe(
  "B008 browser: simple edit of the nine panels and the three actions",
  { skip, timeout: 600000 },
  () => {
    test.before(async () => {
      const email = `b008-ui-${Date.now()}-${Math.random().toString(16).slice(2)}@test.local`;
      const r = await api("POST", "/users", null, {
        name: "B008 UI test",
        email,
        password: "b008-test-password",
        type: "premium",
      });
      assert.equal(r.status, 201, JSON.stringify(r.data));
      state.user = { id: r.data.user._id, token: r.data.jwt, doc: r.data.user };
      const p = await api(
        "POST",
        `/projects/${state.user.id}`,
        state.user.token,
        { name: "B008 UI test" },
      );
      assert.equal(p.status, 201);
      state.project = p.data._id;
      state.video = await upload(state.user, "wide.mp4");
      state.profile = fs.mkdtempSync(
        path.join(os.tmpdir(), "b008-ui-profile-"),
      );
      state.browser = spawn(
        BROWSER,
        [
          "--headless=new",
          `--remote-debugging-port=${PORT}`,
          `--user-data-dir=${state.profile}`,
          "--ignore-certificate-errors",
          "--no-first-run",
          "--window-size=1400,1000",
          "about:blank",
        ],
        { stdio: "ignore" },
      );
      state.cdp = await devtools();
      await state.cdp.send("Page.enable");
    });

    test.after(async () => {
      try {
        state.cdp?.socket.close();
        state.browser?.kill();
        if (state.project) {
          const info = await api(
            "GET",
            `/projects/${state.user.id}/${state.project}`,
            state.user.token,
          );
          const removed = await api(
            "DELETE",
            `/projects/${state.user.id}/${state.project}`,
            state.user.token,
            null,
            {
              "X-Project-Version": String(info.data?.version ?? 0),
            },
          );
          console.log("B008 UI cleanup: project", removed.status);
        }
        if (state.user)
          console.log(
            "B008 UI cleanup: user",
            (await api("DELETE", `/users/${state.user.id}`, state.user.token))
              .status,
          );
      } finally {
        if (state.profile)
          fs.rmSync(state.profile, { recursive: true, force: true });
      }
    });

    // Opens the project page with the session of the test user and the player of the video.
    async function openPlayer() {
      const { send, evaluate } = state.cdp;
      await send("Page.navigate", { url: `${BASE}/login` });
      await sleep(1500);
      const doc = state.user.doc;
      const session = {
        user: {
          _id: doc._id,
          name: doc.name,
          email: doc.email,
          type: doc.type,
          operations: doc.operations,
          remaining_operations: doc.remaining_operations,
        },
        token: state.user.token,
      };
      await evaluate(
        `localStorage.setItem("session", ${JSON.stringify(JSON.stringify(session))}); sessionStorage.clear(); true`,
      );
      await send("Page.navigate", {
        url: `${BASE}/dashboard/${state.project}`,
      });
      await until(
        () => evaluate(click("button", "Vídeos do projeto")),
        "videos button",
      );
      await until(() => evaluate(click("button", "wide.mp4")), "gallery item");
      await until(
        () =>
          evaluate(
            `[...document.querySelectorAll("button")].some((b) => b.innerText.trim() === "Recortar")`,
          ),
        "player actions",
      );
    }
    // Closes the dialogs above the "Vídeos" dialog, where the player lives.
    async function closeDialogs() {
      const { send, evaluate } = state.cdp;
      const count = () => evaluate(`${PANEL_DIALOGS}.length`);
      for (let i = 0; i < 5 && (await count()) > 0; i += 1) {
        await send("Input.dispatchKeyEvent", {
          type: "keyDown",
          key: "Escape",
          code: "Escape",
          windowsVirtualKeyCode: 27,
        });
        await send("Input.dispatchKeyEvent", {
          type: "keyUp",
          key: "Escape",
          code: "Escape",
          windowsVirtualKeyCode: 27,
        });
        await sleep(300);
      }
    }
    async function settledSnapshot(label) {
      const { evaluate } = state.cdp;
      await until(() => evaluate(SETTLED), `${label} settled`, 30000);
      await sleep(600);
      await until(() => evaluate(SETTLED), `${label} settled again`, 30000);
      return evaluate(SNAPSHOT);
    }

    for (const panel of PANELS) {
      test(`simple panel "${panel.id}": same DOM before and after one interaction`, async () => {
        const { evaluate } = state.cdp;
        if (!state.opened) {
          await openPlayer();
          state.opened = true;
        }
        await closeDialogs();
        await until(
          () => evaluate(click("button", panel.button)),
          `${panel.id} button`,
        );
        await until(() => evaluate(`Boolean(${DIALOG})`), `${panel.id} dialog`);
        const snapshot = {
          initial: await settledSnapshot(`${panel.id} initial`),
        };
        for (const action of panel.act)
          assert.ok(await evaluate(action), `${panel.id} action`);
        if (panel.alert) {
          await until(
            () =>
              evaluate(`Boolean(document.querySelector('[role=alertdialog]'))`),
            "confirmation",
          );
          snapshot.after = await evaluate(
            SNAPSHOT.replace(
              DIALOG,
              `document.querySelector('[role=alertdialog]')`,
            ),
          );
        } else {
          snapshot.after = await settledSnapshot(`${panel.id} after`);
        }
        const file = path.join(SNAPSHOTS, `${panel.id}.json`);
        if (RECORD) {
          fs.writeFileSync(file, JSON.stringify(snapshot, null, 2));
          return;
        }
        const baseline = JSON.parse(fs.readFileSync(file, "utf8"));
        assert.deepEqual(
          snapshot,
          baseline,
          `${panel.id}: the simple edit changed`,
        );
      });
    }

    test(
      "the three actions of B008 are on the page and open their own dialogs",
      { skip: RECORD ? "baseline run" : false },
      async () => {
        const { evaluate } = state.cdp;
        await closeDialogs();
        assert.ok(
          await until(
            () => evaluate(click("button", "Aplicar várias operações")),
            "multi button",
          ),
        );
        await until(
          () =>
            evaluate(`${DIALOG}?.innerText.includes("Acrescentar operação")`),
          "multi dialog",
        );
        await closeDialogs();
        await until(
          () => evaluate(click("button", "Juntar vídeos")),
          "concat button",
        );
        await until(
          () => evaluate(`${DIALOG}?.innerText.includes("Linha temporal")`),
          "concat dialog",
        );
        assert.equal(
          await evaluate(
            `${DIALOG}.innerText.includes("Acrescentar operação")`,
          ),
          false,
          "no operations in Juntar vídeos",
        );
        await closeDialogs();
        await until(
          () => evaluate(click("button", "Movie Maker")),
          "movie maker button",
        );
        await until(
          () =>
            evaluate(
              `${DIALOG}?.innerText.includes("Operações depois da junção")`,
            ),
          "movie maker dialog",
        );
      },
    );
  },
);

// D-91/D-92: the configuration components now live in the project workspace.
// Run this case with --test-name-pattern="UI workspace"; the historical B008
// snapshot cases above remain available for the old baseline.
test(
  "UI workspace: nine configurations, three compositions and image switch",
  { skip, timeout: 600000 },
  async () => {
    const workspace = {};
    try {
      const email = `ui-workspace-${Date.now()}-${Math.random().toString(16).slice(2)}@test.local`;
      const user = await api("POST", "/users", null, {
        name: "UI workspace test", email, password: "ui-workspace-password", type: "free",
      });
      assert.equal(user.status, 201, JSON.stringify(user.data));
      workspace.user = { id: user.data.user._id, token: user.data.jwt, doc: user.data.user };
      const project = await api("POST", `/projects/${workspace.user.id}`, workspace.user.token, { name: "UI workspace test" });
      assert.equal(project.status, 201);
      workspace.project = project.data._id;
      state.project = workspace.project;
      workspace.video = await upload(workspace.user, "wide.mp4");
      workspace.profile = fs.mkdtempSync(path.join(os.tmpdir(), "ui-workspace-profile-"));
      workspace.browser = spawn(BROWSER, [
        "--headless=new", `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${workspace.profile}`, "--ignore-certificate-errors",
        "--no-first-run", "--window-size=1280,720", "about:blank",
      ], { stdio: "ignore" });
      workspace.cdp = await devtools();
      const { send, evaluate } = workspace.cdp;
      await send("Page.enable");
      await send("Page.navigate", { url: `${BASE}/login` });
      await sleep(1200);
      const doc = workspace.user.doc;
      const session = { user: {
        _id: doc._id, name: doc.name, email: doc.email, type: doc.type,
        operations: doc.operations, remaining_operations: doc.remaining_operations,
      }, token: workspace.user.token };
      await evaluate(`localStorage.setItem("session", ${JSON.stringify(JSON.stringify(session))}); true`);
      await send("Page.navigate", { url: `${BASE}/dashboard/${workspace.project}` });
      await until(() => evaluate(`Boolean(document.querySelector('.video-workspace-root'))`), "video workspace");
      await until(() => evaluate(`Boolean(document.querySelector('[aria-label="Ferramentas de vídeo"]'))`), "tools");
      assert.equal(await evaluate(`document.querySelector('.video-workspace-root')?.dataset.active`), "true");
      assert.equal(await evaluate(`[...document.querySelectorAll('button')].filter((button) => button.innerText.includes('New Project')).length`), 1, "one project button");
      assert.ok(await evaluate(click("button", "New Project")), "open project dialog");
      await until(() => evaluate(`Boolean(document.querySelector('[role=dialog]'))`), "project dialog");
      assert.ok(await evaluate(`document.querySelector('[role=tab][aria-selected=true]')?.innerText === 'Imagem'`), "image selected by default");
      assert.ok(await evaluate(`Boolean(document.querySelector('#project-name'))`), "existing image fields");
      assert.ok(await evaluate(click("[role=tab]", "Vídeo")), "choose video");
      await until(() => evaluate(`Boolean(document.querySelector('#video-project-name'))`), "D-30 form in the same dialog");
      assert.equal(await evaluate(`document.querySelectorAll('[role=dialog]').length`), 1, "no second video dialog");
      assert.equal(await evaluate(`[...document.querySelectorAll('button')].filter((button) => button.innerText.includes('Novo projeto com vídeo')).length`), 0, "no intermediate video button");
      assert.ok(await evaluate(`document.querySelector('[role=dialog]')?.innerText.includes('Limite do teu perfil')`), "profile limit shown");
      await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
      await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
      assert.ok(await evaluate(`document.querySelector('.video-workspace-root button')?.innerText.includes('Adicionar vídeo')`), "add video button");
      assert.ok(await evaluate(`Boolean(document.querySelector('.video-workspace-root button svg'))`), "add video icon");

      const region = `document.querySelector('[role=region][aria-label^="Parâmetros:"]')`;
      const actions = {
        trim: "Recortar", remove_audio: "Remover áudio", speed: "Velocidade",
        watermark: "Marca de água", adjust: "Ajustar imagem", filter: "Filtro",
        resize: "Redimensionar", orient: "Rodar e espelhar", convert: "Converter formato",
      };
      assert.ok(await evaluate(click("button", "Ajustar imagem", `document.querySelector('[aria-label="Ferramentas de vídeo"]')`)), "adjust slider panel");
      await until(() => evaluate(`Boolean(document.querySelector('[aria-label="Momento da pré-visualização"]'))`), "original frame slider");
      await until(() => evaluate(`Number(document.querySelector('[aria-label="Momento da pré-visualização"] [role=slider]')?.getAttribute('aria-valuemax')) > 0`), "slider duration");
      const firstPreview = await until(() => evaluate(`${region}?.querySelector('img[alt="Pré-visualização com o ajuste"]')?.src`), "first frame preview");
      const firstBytes = await evaluate(`(async () => [...new Uint8Array(await (await fetch(${JSON.stringify(firstPreview)})).arrayBuffer())].reduce((sum, byte) => (sum + byte) >>> 0, 0))()`);
      await evaluate(`document.querySelector('[aria-label="Momento da pré-visualização"] [role=slider]').focus()`);
      await send("Input.dispatchKeyEvent", { type: "keyDown", key: "End", code: "End", windowsVirtualKeyCode: 35 });
      await send("Input.dispatchKeyEvent", { type: "keyUp", key: "End", code: "End", windowsVirtualKeyCode: 35 });
      await until(() => evaluate(`Number(document.querySelector('[aria-label="Momento da pré-visualização"] [role=slider]')?.getAttribute('aria-valuenow')) > 0`), "seeked frame");
      await until(() => evaluate(`Boolean(${region}?.querySelector('img[alt="Pré-visualização com o ajuste"]')?.src && ${region}.querySelector('img[alt="Pré-visualização com o ajuste"]').src !== ${JSON.stringify(firstPreview)})`), "selected frame preview");
      const selectedBytes = await evaluate(`(async () => [...new Uint8Array(await (await fetch(${region}.querySelector('img[alt="Pré-visualização com o ajuste"]').src)).arrayBuffer())].reduce((sum, byte) => (sum + byte) >>> 0, 0))()`);
      assert.notEqual(selectedBytes, firstBytes, "the selected moment changes the preview JPEG");
      assert.equal(await evaluate(`${region}?.innerText.includes('Não foi possível obter este fotograma')`), false, "selected frame has no capture error");
      for (const panel of PANELS) {
        assert.ok(await until(() => evaluate(click("button", actions[panel.id], `document.querySelector('[aria-label="Ferramentas de vídeo"]')`)), `${panel.id} choice`));
        await until(() => evaluate(`Boolean(${region} && !${region}.innerText.includes('A validar') && !${region}.innerText.includes('A carregar'))`), `${panel.id} ready`);
        assert.ok(await evaluate(`Boolean(${region}.querySelector('button'))`), `${panel.id} controls`);
        const adapted = panel.id === "adjust"
          ? [`(() => { const thumb = ${region}?.querySelector('#adjust-brightness [role=slider]'); if (!thumb) return false; thumb.focus(); thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); return true; })()`]
          : panel.act.map((action) => action.replaceAll(DIALOG, region));
        for (const action of adapted) assert.ok(await evaluate(action), `${panel.id} interaction`);
        if (["watermark", "adjust", "filter", "resize", "orient"].includes(panel.id)) {
          await until(() => evaluate(`Boolean(${region}?.querySelector('[aria-label="Momento da pré-visualização"]'))`), `${panel.id} frame slider`);
        } else {
          assert.equal(await evaluate(`Boolean(${region}?.querySelector('[aria-label="Momento da pré-visualização"]'))`), false, `${panel.id} has no frame slider`);
        }
        if (panel.alert) {
          await until(() => evaluate(`Boolean(document.querySelector('[role=alertdialog]'))`), "audio confirmation");
          await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
          await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
        }
      }
      for (const label of ["Aplicar várias operações", "Juntar vídeos", "Movie Maker"]) {
        assert.ok(await evaluate(click("button", label, `document.querySelector('[aria-label="Ferramentas de vídeo"]')`)), label);
        await until(() => evaluate(`${region}?.innerText.includes(${JSON.stringify(label)})`), `${label} region`);
      }
      await until(() => evaluate(`Boolean(${region}?.querySelector('button img'))`), "movie maker clip picker");
      assert.ok(await evaluate(`(() => { const button = ${region}?.querySelector('button:has(img)'); if (!button) return false; button.click(); return true; })()`), "add movie maker clip");
      await until(() => evaluate(`${region}?.innerText.includes('Operações do vídeo 1')`), "clip operations");
      for (const operation of ["adjust", "filter", "resize", "orient", "watermark"]) {
        assert.ok(await evaluate(`(() => { const select = ${region}?.querySelector('select'); if (!select) return false; select.value = ${JSON.stringify(operation)}; select.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`), `select clip ${operation}`);
        assert.ok(await evaluate(click("button", "Acrescentar operação", region)), `configure first clip ${operation}`);
        if (operation === "filter") assert.ok(await evaluate(click("[role=radio]", "Sépia", DIALOG)), "select clip filter");
        if (operation === "watermark") assert.ok(await evaluate(setValue("#watermark-text", "Teste")), "set clip watermark");
        await until(() => evaluate(`Boolean(${DIALOG}?.querySelector('[aria-label="Momento da pré-visualização"]'))`), `movie maker ${operation} frame slider`);
        const sliderGeometry = await evaluate(`(() => { const dialog = ${DIALOG}; const slider = dialog?.querySelector('[aria-label="Momento da pré-visualização"]'); if (!slider) return null; const rect = slider.getBoundingClientRect(); return { top: rect.top, bottom: rect.bottom, viewport: innerHeight, dialogScroll: dialog.scrollHeight, dialogHeight: dialog.clientHeight }; })()`);
        assert.ok(sliderGeometry?.top >= 0 && sliderGeometry.bottom <= sliderGeometry.viewport, `${operation} slider visible without scrolling: ${JSON.stringify(sliderGeometry)}`);
        await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
        await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
        await until(() => evaluate(`!${DIALOG}`), `close clip ${operation} dialog`);
      }
      assert.ok(await evaluate(`(() => { const button = ${region}?.querySelector('button:has(img)'); if (!button) return false; button.click(); return true; })()`), "add second movie maker clip");
      const secondClip = `([...${region}.querySelectorAll('h3')].find((heading) => heading.innerText === 'Operações do vídeo 2')?.closest('section'))`;
      await until(() => evaluate(`Boolean(${secondClip})`), "second clip operations");
      assert.ok(await evaluate(`(() => { const select = ${secondClip}?.querySelector('select'); if (!select) return false; select.value = 'adjust'; select.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`), "select second clip adjustment");
      assert.ok(await evaluate(click("button", "Acrescentar operação", secondClip)), "configure second clip first step");
      await until(() => evaluate(`Boolean(${DIALOG}?.querySelector('[aria-label="Momento da pré-visualização"]'))`), "second clip frame slider");
      await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
      await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
      assert.ok(await evaluate(`[...document.querySelectorAll('[aria-label="Ferramentas de vídeo"] button')].filter((button) => button.querySelector('svg')).length >= 12`), "icons for all operations");
      assert.ok(await evaluate(`Boolean([...document.querySelectorAll('[aria-label="Ferramentas de vídeo"] button')].find((button) => button.innerText.includes('Marca de água'))?.querySelector('svg.lucide-droplet'))`), "watermark uses Droplet");
      const videoRoute = `/projects/${workspace.user.id}/${workspace.project}/videos`;
      const trimmed = await api("POST", `${videoRoute}/${workspace.video}/operations`, workspace.user.token, {
        steps: [{ operation: "trim", version: 1, parameters: { startMs: 0, endMs: 2000 } }],
      });
      assert.equal(trimmed.status, 202, JSON.stringify(trimmed.data));
      const trimTask = await until(async () => {
        const response = await api("GET", `${videoRoute}/tasks/${trimmed.data.taskId}`, workspace.user.token);
        return ["completed", "failed"].includes(response.data.status) ? response.data : null;
      }, "trim result", 120000);
      assert.equal(trimTask.status, "completed", JSON.stringify(trimTask));
      await until(() => evaluate(`document.body.innerText.includes('Abrir resultado')`), "result offered without reload", 20000);
      assert.ok(await evaluate(`document.querySelector('button[aria-current=true]')?.getAttribute('aria-label')?.includes('Original')`), "original stays selected");
      assert.ok(await evaluate(click("button", "Abrir resultado")), "open result");
      await until(() => evaluate(`document.querySelector('button[aria-current=true]')?.getAttribute('aria-label')?.includes('Recortado')`), "result selected");
      assert.equal(await evaluate(`document.body.innerText.includes('Abrir resultado')`), false, "result banner dismissed on opening");
      const joined = await api("POST", `${videoRoute}/operations`, workspace.user.token, {
        steps: [{ operation: "concat", version: 1, parameters: { clips: [
          { videoId: workspace.video, steps: [] }, { videoId: workspace.video, steps: [] },
        ] } }],
      });
      assert.equal(joined.status, 202, JSON.stringify(joined.data));
      const joinTask = await until(async () => {
        const response = await api("GET", `${videoRoute}/tasks/${joined.data.taskId}`, workspace.user.token);
        return ["completed", "failed"].includes(response.data.status) ? response.data : null;
      }, "join result", 120000);
      assert.equal(joinTask.status, "completed", JSON.stringify(joinTask));
      await until(() => evaluate(`document.body.innerText.includes('Abrir resultado')`), "joined result banner");
      assert.ok(await evaluate(`Boolean(document.querySelector('[style*="video-task-countdown"]'))`), "ten-second countdown line");
      await until(() => evaluate(`!document.body.innerText.includes('Abrir resultado')`), "joined banner auto-dismisses", 15000);
      const movie = await api("POST", `${videoRoute}/operations`, workspace.user.token, {
        steps: [{ operation: "concat", version: 1, parameters: { clips: [
          { videoId: workspace.video, steps: [{ operation: "trim", version: 1, parameters: { startMs: 0, endMs: 2000 } }] },
          { videoId: workspace.video, steps: [] },
        ] } }],
      });
      assert.equal(movie.status, 202, JSON.stringify(movie.data));
      const movieTask = await until(async () => {
        const response = await api("GET", `${videoRoute}/tasks/${movie.data.taskId}`, workspace.user.token);
        return ["completed", "failed"].includes(response.data.status) ? response.data : null;
      }, "movie maker result", 120000);
      assert.equal(movieTask.status, "completed", JSON.stringify(movieTask));
      const lineage = await api("GET", `${videoRoute}/lineage`, workspace.user.token);
      assert.equal(lineage.status, 200, JSON.stringify(lineage.data));
      assert.deepEqual(lineage.data.videos.find((video) => video.id === trimTask.resultVideoId).sourceVideoIds, [workspace.video]);
      assert.deepEqual(lineage.data.videos.find((video) => video.id === joinTask.resultVideoId).sourceVideoIds, [workspace.video, workspace.video]);
      assert.equal(lineage.data.videos.find((video) => video.id === movieTask.resultVideoId).hasClipOperations, true);
      const expectedRemaining = workspace.user.doc.remaining_operations - 4;
      await until(() => evaluate(`(() => {
        const counter = [...document.querySelectorAll('span')].find((item) => item.innerText === 'Operações diárias restantes');
        return counter?.parentElement?.innerText.includes(${JSON.stringify(String(expectedRemaining))});
      })()`), "video quota counter", 15000);
      await send("Page.reload");
      await until(() => evaluate(`document.body.innerText.includes('Junção de 2 clips')`), "join mini group");
      assert.ok(await evaluate(`document.body.innerText.includes('Mini grupo · Movie Maker')`), "movie maker mini group");
      assert.ok(await evaluate(`document.body.innerText.includes('V1 · Recortado')`), "trim version");
      const image = fs.readFileSync(path.join(FIXTURES, "image.png"));
      const beforeImage = await api("GET", `/projects/${workspace.user.id}/${workspace.project}`, workspace.user.token);
      const form = new FormData();
      form.append("image", new Blob([image], { type: "image/png" }), "ui-workspace-image.png");
      const imageUpload = await fetch(`${BASE}/api-gateway/projects/${workspace.user.id}/${workspace.project}/img`, {
        method: "POST",
        headers: { Authorization: `Bearer ${workspace.user.token}`, "X-Project-Version": String(beforeImage.data.version) },
        body: form,
      });
      assert.equal(imageUpload.status, 204, await imageUpload.text());
      await until(async () => (await api("GET", `/projects/${workspace.user.id}/${workspace.project}`, workspace.user.token)).data.imgs.length === 1, "image saved");
      assert.ok(await evaluate(click("button", "Imagens", `document.querySelector('[aria-label="Tipo de recurso"]')`)));
      await until(() => evaluate(`!document.querySelector('.video-workspace-root')`), "image view");
      await send("Page.reload");
      await until(() => evaluate(`document.body.innerText.includes('To start editing, select an image from the grid.')`), "image grid", 15000);
      assert.ok(await evaluate(`[...document.querySelectorAll('button')].some((button) => button.innerText.trim() === 'Apply')`), "image Apply stays present");
      const imageRoute = `/projects/${workspace.user.id}/${workspace.project}`;
      const toolVersion = await api("GET", imageRoute, workspace.user.token);
      const tool = await api("POST", `${imageRoute}/tool`, workspace.user.token,
        { procedure: "brightness", params: { brightness: 0.5 } },
        { "X-Project-Version": String(toolVersion.data.version) });
      assert.equal(tool.status, 201, JSON.stringify(tool.data));
      const processVersion = await api("GET", imageRoute, workspace.user.token);
      const process = await api("POST", `${imageRoute}/process`, workspace.user.token,
        {}, { "X-Project-Version": String(processVersion.data.version) });
      assert.equal(process.status, 201, JSON.stringify(process.data));
      const imageResult = await until(async () => {
        const response = await api("GET", `${imageRoute}/process/url`, workspace.user.token);
        return response.status === 200 && response.data?.imgs?.length ? response.data : null;
      }, "image processing result", 120000);
      assert.ok(imageResult.imgs[0].url, "image result downloadable");
      assert.ok(await evaluate(click("button", "Vídeos", `document.querySelector('[aria-label="Tipo de recurso"]')`)));
      await until(() => evaluate(`Boolean(document.querySelector('.video-workspace-root'))`), "return to videos");
    } finally {
      workspace.cdp?.socket.close();
      workspace.browser?.kill();
      if (workspace.project && workspace.user) {
        const info = await api("GET", `/projects/${workspace.user.id}/${workspace.project}`, workspace.user.token);
        await api("DELETE", `/projects/${workspace.user.id}/${workspace.project}`, workspace.user.token, null, { "X-Project-Version": String(info.data?.version ?? 0) });
      }
      if (workspace.user) await api("DELETE", `/users/${workspace.user.id}`, workspace.user.token);
      if (workspace.profile) fs.rmSync(workspace.profile, { recursive: true, force: true });
    }
  },
);
