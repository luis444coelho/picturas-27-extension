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
