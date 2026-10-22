// B005 domain and application contracts, persisted and reproducible (run in
// the projects container, which has sharp and the DejaVu fonts):
// node --test test/video/visual-edits.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const sharp = require("sharp");
const { registry } = require("../../video/operations");
const chain = require("../../video/chain");
const plans = require("../../video/plan");
const { applyPlanExtras } = require("../../video/planExtras");
const { applyVisualPlanExtras } = require("../../video/planExtrasVisual");
const { markBox, boundsError } = require("../../video/watermarkGeometry");
const { createFrameCache } = require("../../video/frameCache");
const { createWatermarks } = require("../../video/watermarks");
const { createWatermarkCleanup } = require("../../video/watermarkCleanup");
const { readRawBody } = require("../../video/rawBody");
const preview = require("../../video/preview");
const catalog = require("../../video/filters.json");
const { createTasks } = require("../../video/tasks");
const { createLocks } = require("../../video/locks");
const { createCollection, createTaskBus, createFakeQuota } = require("./task-fakes");
const { createStorage, createUsers, silentLog } = require("./fakes");

const OWNER = "64b000000000000000000001",
  PROJECT = "64b0000000000000000000aa",
  VIDEO = "64b0000000000000000000c1",
  MARK = "64b0000000000000000000d1";
const source = (meta = {}) => ({
  _id: VIDEO,
  owner_id: OWNER,
  project_id: PROJECT,
  original_name: "source.mp4",
  status: "completed",
  meta: {
    container: "mp4",
    video_codec: "h264",
    audio_codec: "aac",
    width: 1280,
    height: 720,
    display_width: 1280,
    display_height: 720,
    rotation: 0,
    fps_num: 25,
    fps_den: 1,
    duration_ms: 30000,
    size_bytes: 1000,
    ...meta,
  },
  storage: { original_key: `${PROJECT}/video_src/${VIDEO}.mp4` },
});
const step = (operation, parameters = {}) => ({ operation, version: 1, parameters });
const props = (meta) => chain.propsFromMeta(source(meta).meta);
const codes = (errors) => errors.map((e) => e.code);
const validate = (operation, parameters, meta, profile = "free") =>
  registry.get(operation).validate(parameters, props(meta), profile);
const wm = (parameters) => ({
  type: "image",
  watermarkId: MARK,
  position: { preset: "bottom-right" },
  scale: 0.2,
  opacity: 0.4,
  _mark: { watermarkId: MARK, width: 200, height: 100 },
  ...parameters,
});

// ---- adjust (ADJUST-001 to 007) -------------------------------------------

const neutral = { brightness: 1, contrastFactor: 1, saturationFactor: 1 };
for (const [parameters, expected] of [
  [{ ...neutral, brightness: 1.3 }, []],
  [{ ...neutral, contrastFactor: 0.8 }, []],
  [{ ...neutral, saturationFactor: 0 }, []],
  [{ ...neutral, brightness: 0.15 }, []],
  [{ ...neutral, brightness: 0.1 + 0.05 }, []],
  [{ brightness: 2, contrastFactor: 0, saturationFactor: 2 }, []],
  [{ ...neutral, brightness: 2.5 }, [{ code: "INVALID_ADJUST_PARAMS", field: "brightness", min: 0, max: 2, step: 0.05 }]],
  [{ ...neutral, contrastFactor: -0.05 }, [{ code: "INVALID_ADJUST_PARAMS", field: "contrastFactor", min: 0, max: 2, step: 0.05 }]],
  [{ ...neutral, saturationFactor: 0.07 }, [{ code: "INVALID_ADJUST_PARAMS", field: "saturationFactor", min: 0, max: 2, step: 0.05 }]],
  [{ brightness: 1, contrastFactor: 1 }, [{ code: "INVALID_ADJUST_PARAMS", field: "saturationFactor", min: 0, max: 2, step: 0.05 }]],
  [{ ...neutral, brightness: "1.2" }, [{ code: "INVALID_ADJUST_PARAMS", field: "brightness", min: 0, max: 2, step: 0.05 }]],
  [neutral, [{ code: "NO_CHANGES" }]],
  [{ ...neutral, brightness: 1.0000000001 }, [{ code: "NO_CHANGES" }]],
])
  test(`adjust validates ${JSON.stringify(parameters)}`, () =>
    assert.deepEqual(validate("adjust", parameters), expected));

test("adjust keeps resolution, fps, duration and audio; odd sizes lose 1 px (Q-ADD-25)", () => {
  const op = registry.get("adjust");
  const out = op.estimate(props({ width: 1281, height: 721, display_width: 1281, display_height: 721 }));
  assert.deepEqual([out.width, out.height, out.fpsNum, out.durationMs, out.audioCodec, out.container], [1280, 720, 25, 30000, "aac", "mp4"]);
  assert.deepEqual(op.copyable(), { video: false, audio: true });
});

// ---- filter (FILTER-001, 005) ---------------------------------------------

test("filter catalog: exactly the six filters of the MVP, matrix or invert (D-58)", () => {
  assert.deepEqual(catalog.map((e) => e.id), ["bw", "sepia", "negative", "vintage", "cold", "warm"]);
  assert.deepEqual(catalog.map((e) => e.label), ["Preto e Branco", "Sépia", "Negativo", "Vintage", "Frio", "Quente"]);
  for (const entry of catalog) {
    if (entry.type === "invert") continue;
    assert.equal(entry.type, "matrix");
    assert.equal(entry.matrix.length, 3);
    for (const row of entry.matrix) assert.equal(row.length, 3);
  }
  assert.deepEqual(catalog[0].matrix[0], [0.299, 0.587, 0.114]);
  assert.deepEqual(catalog[1].matrix, [[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]]);
});

for (const filter of catalog.map((e) => e.id))
  test(`filter accepts ${filter}`, () => assert.deepEqual(validate("filter", { filter }), []));
for (const parameters of [{ filter: "cartoon" }, {}, { filter: 3 }])
  test(`filter rejects ${JSON.stringify(parameters)}`, () =>
    assert.deepEqual(codes(validate("filter", parameters)), ["INVALID_FILTER"]));

// ---- resize (RESIZE-006 to 008) -------------------------------------------

for (const [parameters, meta, profile, expected] of [
  [{ width: 854, height: 480 }, {}, "free", []],
  [{ width: 1920, height: 1080 }, {}, "free", []],
  [{ width: 1080, height: 1920 }, {}, "free", []],
  [{ width: 2560, height: 1440 }, {}, "free", [{ code: "INVALID_RESIZE_PARAMS", field: "width", limit: { width: 1920, height: 1080 } }]],
  [{ width: 1440, height: 2560 }, {}, "free", [{ code: "INVALID_RESIZE_PARAMS", field: "height", limit: { width: 1920, height: 1080 } }]],
  [{ width: 1920, height: 1200 }, {}, "free", [{ code: "INVALID_RESIZE_PARAMS", field: "height", limit: { width: 1920, height: 1080 } }]],
  [{ width: 2560, height: 1440 }, {}, "premium", []],
  [{ width: 3840, height: 2160 }, {}, "premium", []],
  [{ width: 4096, height: 2160 }, {}, "premium", [{ code: "INVALID_RESIZE_PARAMS", field: "width", limit: { width: 3840, height: 2160 } }]],
  [{ width: 853, height: 480 }, {}, "free", [{ code: "INVALID_RESIZE_PARAMS", field: "width", rule: "even" }]],
  [{ width: 126, height: 480 }, {}, "free", [{ code: "INVALID_RESIZE_PARAMS", field: "width", limit: 128 }]],
  [{ width: 640.5, height: 360 }, {}, "free", [{ code: "INVALID_RESIZE_PARAMS", field: "width", rule: "integer" }]],
  [{ width: 640 }, {}, "free", [{ code: "INVALID_RESIZE_PARAMS", field: "height", rule: "integer" }]],
  [{ width: 1280, height: 720 }, {}, "free", [{ code: "NO_CHANGES" }]],
  [{ width: 720, height: 1280 }, { rotation: 90, display_width: 720, display_height: 1280 }, "free", [{ code: "NO_CHANGES" }]],
  [{ width: 1280, height: 720 }, { rotation: 90, display_width: 720, display_height: 1280 }, "free", []],
])
  test(`resize ${profile} ${JSON.stringify(parameters)} on ${JSON.stringify(meta)}`, () =>
    assert.deepEqual(validate("resize", parameters, meta, profile), expected));

test("resize estimate: exact dimensions and rotation 0 (RESIZE-008/009)", () => {
  const out = registry.get("resize").estimate(props({ rotation: 90, display_width: 720, display_height: 1280 }), { width: 854, height: 480 });
  assert.deepEqual([out.width, out.height, out.displayWidth, out.displayHeight, out.rotation, out.durationMs, out.fpsNum], [854, 480, 854, 480, 0, 30000, 25]);
});

// ---- orient (ORIENT-001 to 008, Q-ADD-24) -----------------------------------

for (const rotation of [0, 90, 180, 270])
  for (const flipH of [false, true])
    for (const flipV of [false, true]) {
      const identity = (rotation === 0 && !flipH && !flipV) || (rotation === 180 && flipH && flipV);
      test(`orient ${rotation} H=${flipH} V=${flipV}`, () => {
        assert.deepEqual(validate("orient", { rotation, flipH, flipV }), identity ? [{ code: "NO_CHANGES" }] : []);
        const out = registry.get("orient").estimate(props({ width: 1281, height: 721, display_width: 1281, display_height: 721 }), { rotation, flipH, flipV });
        assert.deepEqual([out.displayWidth, out.displayHeight, out.rotation], rotation % 180 ? [720, 1280, 0] : [1280, 720, 0]);
      });
    }
test("orient rejects 45° and non-boolean mirrors; rotation 0 with a mirror is accepted", () => {
  assert.deepEqual(codes(validate("orient", { rotation: 45 })), ["INVALID_ORIENT_PARAMS"]);
  assert.deepEqual(validate("orient", { rotation: 0, flipH: "yes" }), [{ code: "INVALID_ORIENT_PARAMS", field: "flipH" }]);
  assert.deepEqual(validate("orient", { rotation: 0, flipH: true }), []);
  assert.deepEqual(validate("orient", {}), [{ code: "NO_CHANGES" }]);
});

// ---- watermark (WATERMARK-004 to 008, D-61) ---------------------------------

test("watermark geometry: width = scale × frame width, height from the mark, 3% margin", () => {
  const p = props();
  assert.deepEqual(markBox(wm(), p), { x: 1002, y: 570, width: 256, height: 128, frameWidth: 1280, frameHeight: 720 });
  const at = (preset) => {
    const box = markBox(wm({ position: { preset } }), p);
    return [box.x, box.y];
  };
  assert.deepEqual(at("top-left"), [22, 22]);
  assert.deepEqual(at("top-right"), [1002, 22]);
  assert.deepEqual(at("bottom-left"), [22, 570]);
  assert.deepEqual(at("center"), [512, 296]);
  assert.deepEqual(markBox(wm({ position: { x: 10, y: 20 } }), p).x, 10);
});

for (const [parameters, expected] of [
  [{}, []],
  [{ type: "text", text: "© PictuRAS 2026", watermarkId: undefined, _mark: { width: 300, height: 30 } }, []],
  [{ scale: 0.05 }, []],
  [{ scale: 0.5, opacity: 1, position: { preset: "top-left" } }, []],
  [{ opacity: 0.1 }, []],
  [{ type: "video" }, [{ code: "INVALID_WATERMARK_PARAMS", field: "type", allowed: ["text", "image"] }]],
  [{ type: "text", text: "   ", _mark: { width: 1, height: 1 } }, [{ code: "INVALID_WATERMARK_CONTENT", field: "text" }]],
  [{ type: "text", text: "x".repeat(101), _mark: { width: 1, height: 1 } }, [{ code: "INVALID_WATERMARK_PARAMS", field: "text", max: 100 }]],
  [{ type: "text", text: "ok", _mark: undefined }, [{ code: "INVALID_WATERMARK_CONTENT", field: "text" }]],
  [{ watermarkId: undefined }, [{ code: "INVALID_WATERMARK_CONTENT", field: "watermarkId" }]],
  [{ _mark: undefined }, [{ code: "INVALID_WATERMARK_CONTENT", field: "watermarkId" }]],
  [{ _mark: { watermarkId: "other", width: 2, height: 1 } }, [{ code: "INVALID_WATERMARK_CONTENT", field: "watermarkId" }]],
  [{ scale: 0.04 }, [{ code: "INVALID_WATERMARK_PARAMS", field: "scale", min: 0.05, max: 0.5, step: 0.01 }]],
  [{ scale: 0.505 }, [{ code: "INVALID_WATERMARK_PARAMS", field: "scale", min: 0.05, max: 0.5, step: 0.01 }]],
  [{ opacity: 0.05 }, [{ code: "INVALID_WATERMARK_PARAMS", field: "opacity", min: 0.1, max: 1, step: 0.01 }]],
  [{ position: { preset: "middle" } }, [{ code: "INVALID_WATERMARK_PARAMS", field: "position", presets: ["top-left", "top-right", "bottom-left", "bottom-right", "center"] }]],
  [{ position: { x: 1.5, y: 0 } }, [{ code: "INVALID_WATERMARK_PARAMS", field: "position", presets: ["top-left", "top-right", "bottom-left", "bottom-right", "center"] }]],
  [{ position: { x: 1300, y: 0 } }, [{ code: "WATERMARK_OUT_OF_BOUNDS", field: "position.x", limit: { min: 0, max: 1024 } }]],
  [{ position: { x: 1024, y: 592 } }, []],
  [{ position: { x: 0, y: 593 } }, [{ code: "WATERMARK_OUT_OF_BOUNDS", field: "position.y", limit: { min: 0, max: 592 } }]],
  [{ position: { x: -1, y: 0 } }, [{ code: "WATERMARK_OUT_OF_BOUNDS", field: "position.x", limit: { min: 0, max: 1024 } }]],
  [{ scale: 0.5, _mark: { watermarkId: MARK, width: 100, height: 300 } }, [{ code: "WATERMARK_OUT_OF_BOUNDS", field: "scale" }]],
  [{ scale: 0.5, position: { x: 0, y: 0 }, _mark: { watermarkId: MARK, width: 100, height: 300 } }, [{ code: "WATERMARK_OUT_OF_BOUNDS", field: "scale" }]],
])
  test(`watermark validates ${JSON.stringify(parameters)}`, () =>
    assert.deepEqual(validate("watermark", wm(parameters)), expected));

test("WATERMARK-008: X of 1300 on a 1280×720 video is outside the frame", () => {
  const box = markBox(wm({ position: { x: 1300, y: 0 } }), props());
  assert.equal(boundsError(wm({ position: { x: 1300, y: 0 } }), box)[0].code, "WATERMARK_OUT_OF_BOUNDS");
});

// ---- plan extras (ADR-011) and acceptance -----------------------------------

function build(s, meta = {}) {
  const input = source(meta);
  const p = chain.propsFromMeta(input.meta);
  const checked = chain.validateChain([s], p, "free", registry);
  assert.equal(checked.error, null, JSON.stringify(checked.error));
  const decided = plans.decide([s], [input], checked.props, registry);
  const plan = plans.buildPlan({ taskId: "task", ownerId: OWNER, projectId: PROJECT, steps: [s], inputs: [input], decided });
  applyPlanExtras(plan, [s], p, registry);
  const before = structuredClone(plan);
  applyVisualPlanExtras(plan, [s], p, registry);
  for (const key of ["output", "preview", "targets", "inputs", "expectedDurationMs", "thumbnail"])
    assert.deepEqual(plan[key], before[key], `ADR-011 keeps ${key}`);
  return { plan, before };
}

test("ADR-011: the filter step carries the catalog entry; other fields unchanged", () => {
  const { plan } = build(step("filter", { filter: "sepia" }));
  assert.deepEqual(plan.steps[0].filter, { id: "sepia", type: "matrix", matrix: catalog[1].matrix });
  assert.deepEqual(build(step("filter", { filter: "negative" })).plan.steps[0].filter, { id: "negative", type: "invert" });
  assert.deepEqual(plan.output.audio, { mode: "copy" }, "AAC is copied");
  assert.equal(plan.output.video.mode, "encode");
  assert.equal(plan.output.video.crf, 23, "D-39");
  assert.equal(plan.output.video.preset, "veryfast", "D-39");
});

test("ADR-011: the watermark step carries the source and box; MP3 is encoded to AAC", () => {
  const { plan } = build(step("watermark", wm()), { container: "avi", audio_codec: "mp3" });
  assert.deepEqual(plan.steps[0].mark, {
    watermarkId: MARK,
    source: { userId: OWNER, projectId: PROJECT, stage: "video_src", name: `wm-${MARK}.png` },
    x: 1002,
    y: 570,
    width: 256,
    height: 128,
    opacity: 0.4,
  });
  assert.equal(plan.output.audio.mode, "encode");
  assert.equal(plan.output.audio.codec, "aac");
  assert.equal(plan.output.container, "mp4");
});

test("ADR-011: no visual steps leaves the plan untouched; adjust/resize/orient need no extras", () => {
  for (const s of [
    step("trim", { startMs: 0, endMs: 1000 }),
    step("adjust", { ...neutral, brightness: 1.5 }),
    step("resize", { width: 640, height: 360 }),
    step("orient", { rotation: 90 }),
  ]) {
    const { plan, before } = build(s);
    assert.deepEqual(plan, before);
  }
});

function setup() {
  const VideoTask = createCollection(),
    Video = createCollection(),
    Lock = createCollection({ unique: ["project_id"] }),
    bus = createTaskBus(),
    quota = createFakeQuota();
  const tasks = createTasks({
    VideoTask,
    Video,
    locks: createLocks({ Lock }),
    quota,
    bus,
    users: createUsers({ [OWNER]: "free" }),
    storage: createStorage(),
    registry,
    log: silentLog,
  });
  const submit = (s) =>
    tasks.submit({ project: { _id: PROJECT, user_id: OWNER }, callerId: OWNER, inputVideos: [source()], steps: [s], correlationId: "b005-test" });
  return { VideoTask, bus, quota, tasks, submit };
}

test("acceptance: invalid visual steps create no task, quota reservation or publication", async () => {
  const ctx = setup();
  for (const s of [
    step("adjust", neutral),
    step("filter", { filter: "cartoon" }),
    step("resize", { width: 2560, height: 1440 }),
    step("orient", { rotation: 180, flipH: true, flipV: true }),
    step("watermark", wm({ position: { x: 1300, y: 0 } })),
    step("watermark", wm({ _mark: undefined })),
  ])
    await assert.rejects(ctx.submit(s), { status: 422, code: "INVALID_STEP_PARAMS" });
  assert.equal(ctx.VideoTask.all().length, 0);
  assert.equal(ctx.quota.reserves.length, 0);
  assert.equal(ctx.bus.operations.length, 0);
});

test("acceptance: one credit, plan with extras persisted before publication, recipe keeps _mark", async () => {
  const ctx = setup();
  const { taskId } = await ctx.submit(step("watermark", wm()));
  const stored = ctx.VideoTask.docs.get(taskId);
  assert.equal(stored.cost, 1);
  assert.deepEqual(ctx.quota.reserves, [[OWNER, 1]], "one credit reserved for a free user");
  assert.equal(stored.plan.steps[0].mark.watermarkId, MARK);
  assert.deepEqual(ctx.bus.operations[0].plan, stored.plan);
  assert.equal(stored.steps[0].parameters._mark.watermarkId, MARK);
  const original = structuredClone(stored.plan);
  await ctx.tasks.publish(stored);
  assert.deepEqual(ctx.bus.operations[1].plan, original, "republication sends the same plan (ADR-004)");
});

// ---- frame cache (T-07, D-64) -----------------------------------------------

test("frame cache: least recently used out at 100 entries and expiry after 10 min", () => {
  let clock = 0;
  const cache = createFrameCache({ now: () => clock });
  for (let i = 0; i < 100; i += 1) cache.set(i, i);
  assert.equal(cache.get(0), 0);
  cache.set(100, 100);
  assert.equal(cache.size, 100);
  assert.equal(cache.get(1), undefined, "least recently used removed");
  assert.equal(cache.get(0), 0, "recently read kept");
  clock = 10 * 60 * 1000 + 1;
  assert.equal(cache.get(0), undefined, "expired");
});

// ---- sharp preview (T-07) ----------------------------------------------------

// 320×240 frame with red, green, blue and white quadrants.
async function quadFrame(width = 320, height = 240) {
  const half = (color) => ({ create: { width: width / 2, height: height / 2, channels: 3, background: color } });
  const base = sharp({ create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } } });
  const tile = async (color) => sharp(half(color)).png().toBuffer();
  return base
    .composite([
      { input: await tile({ r: 255, g: 0, b: 0 }), left: 0, top: 0 },
      { input: await tile({ r: 0, g: 255, b: 0 }), left: width / 2, top: 0 },
      { input: await tile({ r: 0, g: 0, b: 255 }), left: 0, top: height / 2 },
      { input: await tile({ r: 255, g: 255, b: 255 }), left: width / 2, top: height / 2 },
    ])
    .png()
    .toBuffer();
}
async function pixels(jpeg) {
  const { data, info } = await sharp(jpeg).raw().toBuffer({ resolveWithObject: true });
  const at = (x, y) => [...data.subarray((y * info.width + x) * 3, (y * info.width + x) * 3 + 3)];
  const q = (fx, fy) => at(Math.floor(info.width * fx), Math.floor(info.height * fy));
  return { info, tl: q(0.25, 0.25), tr: q(0.75, 0.25), bl: q(0.25, 0.75), br: q(0.75, 0.75) };
}
const near = (a, b, t = 40) => a.every((v, i) => Math.abs(v - b[i]) <= t);
const COLORS = { tl: [255, 0, 0], tr: [0, 255, 0], bl: [0, 0, 255], br: [255, 255, 255] };
function oriented(rotation, flipH, flipV) {
  let g = [["tl", "tr"], ["bl", "br"]];
  for (let i = 0; i < rotation / 90; i += 1) g = [[g[1][0], g[0][0]], [g[1][1], g[0][1]]];
  if (flipH) g = g.map((row) => [...row].reverse());
  if (flipV) g = [...g].reverse();
  return { tl: g[0][0], tr: g[0][1], bl: g[1][0], br: g[1][1] };
}

test("sharp orientation: rotation before mirrors in two passes, the 16 sets (ORIENT-004/005)", async () => {
  const frame = await quadFrame();
  for (const rotation of [0, 90, 180, 270])
    for (const flipH of [false, true])
      for (const flipV of [false, true]) {
        const out = await pixels(await preview.render(frame, [step("orient", { rotation, flipH, flipV })]));
        assert.deepEqual([out.info.width, out.info.height], rotation % 180 ? [240, 320] : [320, 240]);
        const layout = oriented(rotation, flipH, flipV);
        for (const q of ["tl", "tr", "bl", "br"])
          assert.ok(near(out[q], COLORS[layout[q]]), `${rotation} ${flipH} ${flipV} ${q}: ${out[q]}`);
      }
});

test("sharp adjust and filters follow the FFmpeg formulas (T-07 table)", async () => {
  const frame = await quadFrame();
  const grey = await pixels(await preview.render(frame, [step("adjust", { ...neutral, saturationFactor: 0 })]));
  for (const q of ["tl", "tr", "bl", "br"]) assert.ok(Math.max(...grey[q]) - Math.min(...grey[q]) <= 3, `${q}: ${grey[q]}`);
  const dark = await pixels(await preview.render(frame, [step("adjust", { ...neutral, brightness: 0.5 })]));
  assert.ok(near(dark.br, [128, 128, 128], 4) && near(dark.tl, [128, 0, 0], 6), JSON.stringify(dark));
  // D-67/ADR-012: contrast through the pivot 128 and saturation mixed with
  // the BT.601 luma (PIL ImageEnhance.Color), as the worker does in RGB.
  const contrast = await pixels(await preview.render(frame, [step("adjust", { ...neutral, contrastFactor: 0.6 })]));
  assert.ok(near(contrast.tl, [204, 51, 51], 4) && near(contrast.br, [204, 204, 204], 4), JSON.stringify(contrast));
  const half = await pixels(await preview.render(frame, [step("adjust", { ...neutral, saturationFactor: 0.5 })]));
  assert.ok(near(half.tl, [166, 38, 38], 4) && near(half.br, [255, 255, 255], 3), JSON.stringify(half));
  const sepia = await pixels(await preview.render(frame, [step("filter", { filter: "sepia" })]));
  assert.ok(near(sepia.tl, [100, 89, 69], 6), `${sepia.tl}`);
  const negative = await pixels(await preview.render(frame, [step("filter", { filter: "negative" })]));
  assert.ok(near(negative.tl, [0, 255, 255], 6) && near(negative.br, [0, 0, 0], 6));
  const bw = await pixels(await preview.render(frame, [step("filter", { filter: "bw" })]));
  assert.ok(near(bw.tl, [76, 76, 76], 4), `${bw.tl}`);
});

test("sharp resize: target proportion only, at most 1280 px, never enlarging the frame", async () => {
  const frame = await quadFrame();
  const check = async (parameters, size) => {
    const out = await pixels(await preview.render(frame, [step("resize", parameters)]));
    assert.deepEqual([out.info.width, out.info.height], size);
  };
  await check({ width: 1920, height: 1080 }, [320, 180]);
  await check({ width: 160, height: 120 }, [160, 120]);
  await check({ width: 240, height: 320 }, [240, 320]);
});

test("sharp preview ignores the non-static steps and thumbnails are the six filters at 160 px", async () => {
  const frame = await quadFrame();
  const ignored = await pixels(await preview.render(frame, [step("trim", { startMs: 0, endMs: 1 }), step("watermark", wm()), step("speed", { factor: 2 })]));
  assert.deepEqual([ignored.info.width, ignored.info.height], [320, 240]);
  assert.ok(near(ignored.tl, COLORS.tl));
  const thumbs = await preview.thumbnails(frame);
  assert.deepEqual(thumbs.map((t) => t.filter), catalog.map((e) => e.id));
  for (const thumb of thumbs) {
    const meta = await sharp(Buffer.from(thumb.data, "base64")).metadata();
    assert.deepEqual([meta.format, meta.width, meta.height], ["jpeg", 160, 120]);
  }
});

test("watermark preview: same box as the worker, scaled to the reduced frame, with opacity", async () => {
  const frame = await quadFrame(640, 360);
  const mark = await sharp({ create: { width: 40, height: 20, channels: 4, background: { r: 255, g: 0, b: 255, alpha: 1 } } }).png().toBuffer();
  const p = { displayWidth: 1280, displayHeight: 720 };
  const parameters = wm({ position: { x: 1000, y: 600 }, scale: 0.1, _mark: { watermarkId: MARK, width: 40, height: 20 } });
  const box = markBox(parameters, p);
  assert.deepEqual([box.width, box.height], [128, 64]);
  const opaque = await sharp(await preview.watermark(frame, mark, box, 1)).raw().toBuffer({ resolveWithObject: true });
  const px = (img, x, y) => [...img.data.subarray((y * img.info.width + x) * 3, (y * img.info.width + x) * 3 + 3)];
  assert.ok(near(px(opaque, 532, 316), [255, 0, 255], 20), `${px(opaque, 532, 316)}`);
  assert.ok(near(px(opaque, 490, 290), [255, 255, 255], 20), "outside the mark");
  const half = await sharp(await preview.watermark(frame, mark, box, 0.5)).raw().toBuffer({ resolveWithObject: true });
  assert.ok(near(px(half, 532, 316), [255, 128, 255], 20), `${px(half, 532, 316)}`);
});

// ---- watermark marks (D-59, D-60, D-65) --------------------------------------

function fakeModel() {
  const docs = new Map();
  const match = (doc, q) =>
    Object.entries(q).every(([k, v]) => {
      if (v && typeof v === "object" && "$lt" in v) return doc[k] < v.$lt;
      if (v && typeof v === "object" && "$gt" in v) return String(doc[k]) > String(v.$gt);
      return String(doc[k]) === String(v);
    });
  const query = (result) => ({ lean: async () => result, sort: () => query(result), limit: (n) => query(result.slice(0, n)) });
  return {
    docs,
    findOne: (q) => query([...docs.values()].find((d) => match(d, q)) || null),
    find: (q) => query([...docs.values()].filter((d) => match(d, q)).sort((a, b) => (String(a._id) < String(b._id) ? -1 : 1))),
    async create(doc) {
      if (doc.kind === "text" && [...docs.values()].some((d) => d.kind === "text" && String(d.project_id) === String(doc.project_id) && d.text_hash === doc.text_hash))
        throw Object.assign(new Error("dup"), { code: 11000 });
      const stored = { createdAt: new Date(), ...doc };
      docs.set(String(doc._id), stored);
      return { ...stored, toObject: () => stored };
    },
    async deleteOne(q) {
      docs.delete(String(q._id));
    },
    async exists(q) {
      return [...docs.values()].some((d) => match(d, q)) ? { _id: 1 } : null;
    },
  };
}
const project = { _id: PROJECT, user_id: OWNER };
function marksSetup() {
  const VideoWatermark = fakeModel();
  const writes = [];
  const files = { writeBytes: async (target, buffer, type) => writes.push({ target, buffer, type }), readBytes: async () => writes[0].buffer };
  return { VideoWatermark, writes, marks: createWatermarks({ VideoWatermark, files }) };
}

test("D-59: text rendered with sharp (DejaVu Sans), white on transparent", async () => {
  const { marks } = marksSetup();
  const rendered = await marks.renderText("© PictuRAS 2026 <&>");
  assert.ok(rendered.width > rendered.height && rendered.height > 0);
  const { data, info } = await sharp(rendered.png).raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.channels, 4);
  let opaque = 0;
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 200) { opaque += 1; assert.ok(data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200); }
  assert.ok(opaque > 0);
});

test("ADR-010: validation measures the text without storing; acceptance stores it once (D-65)", async () => {
  const { marks, writes, VideoWatermark } = marksSetup();
  const measured = await marks.resolve(project, { type: "text", text: "  Olá  " }, { store: false });
  assert.equal(measured.watermarkId, undefined);
  assert.equal(writes.length, 0);
  const first = await marks.resolve(project, { type: "text", text: "Olá" }, { store: true, callerId: OWNER });
  const second = await marks.resolve(project, { type: "text", text: " Olá" }, { store: true, callerId: OWNER });
  assert.equal(first.watermarkId, second.watermarkId, "one record per project and text, PNG reused");
  assert.deepEqual([first.width, first.height], [measured.width, measured.height]);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].target.name, `wm-${first.watermarkId}.png`);
  assert.equal(writes[0].target.stage, "video_src");
  assert.equal(VideoWatermark.docs.size, 1);
  assert.equal(await marks.resolve(project, { type: "text", text: "" }, { store: true }), null);
  assert.equal(await marks.resolve(project, { type: "text", text: "x".repeat(101) }, { store: true }), null);
  assert.equal(await marks.resolve(project, { type: "image", watermarkId: "not-an-id" }, { store: false }), null);
  assert.equal(await marks.resolve(project, { type: "image", watermarkId: MARK }, { store: false }), null);
});

test("D-60: images are PNG or JPEG up to 1 MB and 4096 px, stored as RGBA PNG", async () => {
  const { marks, writes, VideoWatermark } = marksSetup();
  const jpeg = await sharp({ create: { width: 120, height: 60, channels: 3, background: "#0a0" } }).jpeg().toBuffer();
  const created = await marks.createFromImage(project, jpeg, OWNER);
  assert.deepEqual([created.width, created.height], [120, 60]);
  const stored = await sharp(writes[0].buffer).metadata();
  assert.deepEqual([stored.format, stored.channels, writes[0].type], ["png", 4, "image/png"]);
  const resolved = await marks.resolve(project, { type: "image", watermarkId: created.watermarkId }, { store: false });
  assert.deepEqual(resolved, created);
  assert.equal(await marks.resolve({ _id: "64b0000000000000000000ff" }, { type: "image", watermarkId: created.watermarkId }, { store: false }), null, "other project");
  const reason = async (buffer, options) => {
    try {
      await marks.createFromImage(project, buffer, OWNER, options);
      return "accepted";
    } catch (err) {
      assert.equal(err.code, "INVALID_WATERMARK_CONTENT");
      return err.details.reason;
    }
  };
  assert.equal(await reason(Buffer.alloc(0)), "empty");
  assert.equal(await reason(Buffer.from("not an image")), "unreadable");
  assert.equal(await reason(await sharp({ create: { width: 10, height: 10, channels: 3, background: "#fff" } }).gif().toBuffer()), "format");
  assert.equal(await reason(await sharp({ create: { width: 4097, height: 2, channels: 3, background: "#fff" } }).png().toBuffer()), "dimensions");
  const big = await sharp(Buffer.alloc(700 * 700 * 3, 0).map(() => Math.floor(Math.random() * 256)), { raw: { width: 700, height: 700, channels: 3 } }).png().toBuffer();
  assert.ok(big.length > 1024 * 1024);
  assert.equal(await reason(big), "too_large");
  assert.equal(await reason(big, { maxBytes: null }), "accepted", "gallery images have no byte limit");
  assert.equal(VideoWatermark.docs.size, 2);
});

// ---- cleanup (D-60 with the team's change, D-65) ------------------------------

test("cleanup removes marks of deleted projects and unreferenced marks older than 24 h only", async () => {
  const now = new Date("2026-10-23T12:00:00Z");
  const old = new Date(now.getTime() - 25 * 3600 * 1000);
  const recent = new Date(now.getTime() - 23 * 3600 * 1000);
  const VideoWatermark = fakeModel();
  const id = (n) => `64b0000000000000000000e${n}`;
  for (const [n, projectId, createdAt] of [
    [1, PROJECT, old],
    [2, PROJECT, old],
    [3, PROJECT, old],
    [4, PROJECT, recent],
    [5, "64b0000000000000000000ab", old],
    [6, PROJECT, old],
  ])
    VideoWatermark.docs.set(id(n), { _id: id(n), project_id: projectId, owner_id: OWNER, kind: "image", createdAt });
  const refs = { task: new Set([id(1)]), recipe: new Set([id(2)]), mark: new Set([id(6)]) };
  const flat = (q) => JSON.stringify(q);
  const removed = [];
  const cleanup = createWatermarkCleanup({
    VideoWatermark,
    VideoTask: { exists: async (q) => ([...refs.task].some((r) => flat(q).includes(r)) ? {} : null) },
    Video: { exists: async (q) => ([...refs.recipe, ...refs.mark].some((r) => flat(q).includes(r)) ? {} : null) },
    Project: { exists: async (q) => (String(q._id) === PROJECT ? {} : null) },
    storage: { remove: async (target) => removed.push(target) },
    log: silentLog,
    now: () => now,
  });
  assert.equal(await cleanup.runOnce(), 2);
  assert.deepEqual([...VideoWatermark.docs.keys()].sort(), [id(1), id(2), id(4), id(6)]);
  assert.deepEqual(removed.map((t) => t.name).sort(), [`wm-${id(3)}.png`, `wm-${id(5)}.png`]);
  assert.ok(removed.every((t) => t.stage === "video_src" && t.userId === OWNER));
});

test("cleanup reference query covers the plan, the task steps and the recipes", async () => {
  const seen = [];
  const cleanup = createWatermarkCleanup({
    VideoWatermark: {},
    VideoTask: { exists: async (q) => (seen.push(q), null) },
    Video: { exists: async (q) => (seen.push(q), null) },
    Project: {},
    storage: {},
    log: silentLog,
  });
  assert.equal(await cleanup.referenced({ _id: new mongoose.Types.ObjectId(MARK) }), false);
  const text = JSON.stringify(seen);
  for (const field of ["plan.steps.mark.watermarkId", "steps.parameters._mark.watermarkId", "recipe.parameters.watermarkId", "recipe.parameters._mark.watermarkId"])
    assert.ok(text.includes(field), field);
});

// ---- raw body (desvio 2: Express 4.16) ---------------------------------------

test("raw body reader: only image types, limit enforced by Content-Length and stream", async () => {
  const { PassThrough } = require("node:stream");
  const run = (headers, chunks) =>
    new Promise((resolve) => {
      const req = new PassThrough();
      req.headers = headers;
      readRawBody({ types: ["image/png"], limit: 10 })(req, {}, (err) => resolve({ err, body: req.body }));
      for (const c of chunks) req.write(c);
      req.end();
    });
  assert.deepEqual((await run({ "content-type": "image/png" }, [Buffer.from("12345")])).body, Buffer.from("12345"));
  assert.equal((await run({ "content-type": "image/png", "content-length": "11" }, [])).err.type, "entity.too.large");
  assert.equal((await run({ "content-type": "image/png" }, [Buffer.alloc(6), Buffer.alloc(6)])).err.type, "entity.too.large");
  assert.equal((await run({ "content-type": "application/json" }, [])).body, undefined);
});
