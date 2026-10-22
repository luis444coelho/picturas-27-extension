// Unit tests of the video information and download (UC-VID-006, UC-VID-007;
// ADD 4.1, 4.2), with the storage, the model and the log faked.
//
//   cd projects && node --test test/video/access.test.js
const test = require("node:test");
const assert = require("node:assert/strict");

const { suggestedFileName } = require("../../video/fileName");
const { createAccess, unavailableAttributes } = require("../../video/access");
const { VideoError } = require("../../video/errors");

const OWNER = "64b000000000000000000001";
const PROJECT = "64b000000000000000000002";
const CALLER = "64b000000000000000000003";
const NOW = Date.parse("2026-10-22T12:00:00.000Z");

const FULL_META = {
  container: "mov",
  video_codec: "h264",
  audio_codec: "aac",
  width: 1920,
  height: 1080,
  rotation: 90,
  display_width: 1080,
  display_height: 1920,
  fps_num: 30000,
  fps_den: 1001,
  duration_ms: 45200,
  size_bytes: 157286400,
  bitrate: 8000000,
};

function makeVideo(overrides = {}) {
  return {
    _id: "64b0000000000000000000aa",
    project_id: PROJECT,
    owner_id: OWNER,
    created_by: OWNER,
    original_name: "ferias.mov",
    mime_type: "video/quicktime",
    status: "completed",
    storage: {
      original_key: `${PROJECT}/video_src/64b0000000000000000000aa.mov`,
      preview_key: `${PROJECT}/video_preview/64b0000000000000000000aa.mp4`,
      thumb_key: `${PROJECT}/video_thumb/64b0000000000000000000aa.thumb.jpg`,
    },
    meta: { ...FULL_META },
    source_video_ids: [],
    recipe: [],
    createdAt: new Date("2026-10-22T10:00:00.000Z"),
    ...overrides,
  };
}

function setup({ objects = null, stored = [] } = {}) {
  const calls = { head: [], url: [], find: [] };
  const logs = [];
  const Video = {
    find(filter, projection) {
      calls.find.push({ filter, projection });
      const ids = filter._id.$in.map(String);
      return {
        lean: async () =>
          stored
            .filter((v) => ids.includes(String(v._id)))
            .map((v) => ({ _id: v._id, original_name: v.original_name })),
      };
    },
  };
  const storage = {
    URL_EXPIRES: 900,
    parseKey(ownerId, key) {
      const [projectId, stage, name] = key.split("/");
      return { userId: String(ownerId), projectId, stage, name };
    },
    async head(target) {
      calls.head.push(target);
      const key = `${target.projectId}/${target.stage}/${target.name}`;
      if (objects && !objects.includes(key)) return null;
      return { contentLength: 1, contentType: "video/quicktime" };
    },
    async publicReadUrl(target) {
      calls.url.push(target);
      return `https://localhost:8080/s3-video/user-${target.userId}/${target.projectId}/${target.stage}/${target.name}?Signature=SECRET`;
    },
  };
  const log = {
    info: (event, fields) => logs.push({ level: "info", event, fields }),
    warn: (event, fields) => logs.push({ level: "warn", event, fields }),
    error: (event, fields) => logs.push({ level: "error", event, fields }),
  };
  const access = createAccess({ Video, storage, log, now: () => NOW });
  return { access, calls, logs };
}

// --- Suggested name (DOWNLOAD-005, 006; D-35) ---

test.describe("suggestedFileName", () => {
  test("original: name unchanged, extension of the stored container", () => {
    assert.equal(
      suggestedFileName({
        original_name: "ferias.mp4",
        recipe: [],
        meta: { container: "mp4" },
      }),
      "ferias.mp4",
    );
  });

  test("trim result of ferias.mp4 → ferias_trim.mp4 (DOWNLOAD-005 example)", () => {
    assert.equal(
      suggestedFileName({
        original_name: "ferias.mp4",
        recipe: [{ operation: "trim", version: 1, parameters: {} }],
        meta: { container: "mp4" },
      }),
      "ferias_trim.mp4",
    );
  });

  test("chain: operations in order joined by _ (D-35)", () => {
    assert.equal(
      suggestedFileName({
        original_name: "ferias.mp4",
        recipe: [
          { operation: "trim", version: 1, parameters: {} },
          { operation: "filter", version: 1, parameters: {} },
        ],
        meta: { container: "mp4" },
      }),
      "ferias_trim_filter.mp4",
    );
  });

  test("join: base of the result, concat in the suffix (D-35)", () => {
    assert.equal(
      suggestedFileName({
        original_name: "ferias.mp4",
        recipe: [{ operation: "concat", version: 1, parameters: {} }],
        meta: { container: "mp4" },
      }),
      "ferias_concat.mp4",
    );
  });

  test("AVI original keeps .avi, never the MP4 preview extension (DOWNLOAD-006)", () => {
    assert.equal(
      suggestedFileName({
        original_name: "clip.avi",
        recipe: [],
        meta: { container: "avi" },
      }),
      "clip.avi",
    );
  });

  test("extension comes from the container, not from the name's case", () => {
    assert.equal(
      suggestedFileName({
        original_name: "Clip.MOV",
        recipe: [],
        meta: { container: "mov" },
      }),
      "Clip.mov",
    );
  });

  test("accents and spaces are kept", () => {
    assert.equal(
      suggestedFileName({
        original_name: "Férias São João.mp4",
        recipe: [],
        meta: { container: "mp4" },
      }),
      "Férias São João.mp4",
    );
  });

  test("dots inside the name: only the last extension is replaced", () => {
    assert.equal(
      suggestedFileName({
        original_name: "v1.2.final.mp4",
        recipe: [{ operation: "trim", version: 1, parameters: {} }],
        meta: { container: "mp4" },
      }),
      "v1.2.final_trim.mp4",
    );
  });

  test("without a container, the original extension is kept in lower case", () => {
    assert.equal(
      suggestedFileName({ original_name: "clip.AVI", recipe: [], meta: {} }),
      "clip.avi",
    );
  });
});

// --- Information (INFO-001 to 009) ---

test.describe("unavailableAttributes", () => {
  test("full metadata: nothing missing", () => {
    assert.deepEqual(unavailableAttributes(FULL_META), []);
  });

  test("audio_codec null is 'no audio', not missing (T-00)", () => {
    assert.deepEqual(
      unavailableAttributes({ ...FULL_META, audio_codec: null }),
      [],
    );
  });

  test("each missing field marks its attribute", () => {
    const meta = { ...FULL_META };
    delete meta.fps_den;
    delete meta.audio_codec;
    delete meta.display_height;
    assert.deepEqual(unavailableAttributes(meta), [
      "resolution",
      "format",
      "fps",
    ]);
  });

  test("no meta at all: every attribute missing", () => {
    assert.deepEqual(unavailableAttributes(undefined), [
      "duration",
      "resolution",
      "format",
      "size",
      "fps",
    ]);
  });
});

test.describe("getInfo", () => {
  test("completed video: persisted metadata, display resolution, download name", async () => {
    const { access, logs, calls } = setup();
    const info = await access.getInfo(makeVideo(), { correlationId: "c-1" });

    assert.deepEqual(info, {
      id: "64b0000000000000000000aa",
      originalName: "ferias.mov",
      status: "completed",
      mimeType: "video/quicktime",
      meta: {
        container: "mov",
        videoCodec: "h264",
        audioCodec: "aac",
        displayWidth: 1080,
        displayHeight: 1920,
        durationMs: 45200,
        sizeBytes: 157286400,
        fpsNum: 30000,
        fpsDen: 1001,
      },
      unavailable: [],
      sources: [],
      recipe: [],
      downloadFileName: "ferias.mov",
      createdAt: new Date("2026-10-22T10:00:00.000Z"),
    });
    assert.equal(logs.length, 0);
    assert.equal(calls.find.length, 0, "no lookup without sources");
  });

  test("coded dimensions are not exposed, only display ones (Q-ADD-13)", async () => {
    const { access } = setup();
    const info = await access.getInfo(makeVideo(), { correlationId: "c" });
    assert.equal(info.meta.width, undefined);
    assert.equal(info.meta.height, undefined);
  });

  test("not completed: only the state (ADD 4.2)", async () => {
    const { access } = setup();
    const info = await access.getInfo(makeVideo({ status: "processing" }), {
      correlationId: "c",
    });
    assert.deepEqual(info, {
      id: "64b0000000000000000000aa",
      originalName: "ferias.mov",
      status: "processing",
    });
  });

  test("missing metadata → unavailable list and METADATA_UNAVAILABLE with correlationId (INFO-009)", async () => {
    const { access, logs } = setup();
    const meta = { ...FULL_META };
    delete meta.fps_num;
    const info = await access.getInfo(makeVideo({ meta }), {
      correlationId: "corr-9",
    });

    assert.deepEqual(info.unavailable, ["fps"]);
    assert.deepEqual(logs, [
      {
        level: "warn",
        event: "METADATA_UNAVAILABLE",
        fields: {
          correlationId: "corr-9",
          videoId: "64b0000000000000000000aa",
          attributes: ["fps"],
        },
      },
    ]);
  });

  test("provenance in order; a removed source has a null name (INFO-008)", async () => {
    const kept = { _id: "64b0000000000000000000b1", original_name: "a.mp4" };
    const { access } = setup({ stored: [kept] });
    const info = await access.getInfo(
      makeVideo({
        source_video_ids: ["64b0000000000000000000b2", kept._id],
        recipe: [
          { operation: "trim", version: 1, parameters: { startMs: 0 } },
          { operation: "filter", version: 1 },
        ],
      }),
      { correlationId: "c" },
    );

    assert.deepEqual(info.sources, [
      { id: "64b0000000000000000000b2", originalName: null },
      { id: "64b0000000000000000000b1", originalName: "a.mp4" },
    ]);
    assert.deepEqual(info.recipe, [
      { operation: "trim", version: 1, parameters: { startMs: 0 } },
      { operation: "filter", version: 1, parameters: {} },
    ]);
    assert.equal(info.downloadFileName, "ferias_trim_filter.mov");
  });

  test("no storage access for the information panel (INFO-007, ADD 4.2)", async () => {
    const { access, calls } = setup();
    await access.getInfo(makeVideo(), { correlationId: "c" });
    assert.equal(calls.head.length, 0);
    assert.equal(calls.url.length, 0);
  });
});

// --- Download (DOWNLOAD-001 to 009) ---

test.describe("issueDownload", () => {
  test("completed: {url, fileName, expiresAt} for the original, 15 min", async () => {
    const { access, calls } = setup();
    const result = await access.issueDownload(makeVideo(), {
      callerId: CALLER,
      correlationId: "c-1",
    });

    assert.equal(result.fileName, "ferias.mov");
    assert.equal(result.expiresAt, "2026-10-22T12:15:00.000Z");
    assert.match(result.url, /\/s3-video\/.*\/video_src\//);
    assert.deepEqual(calls.url, [
      {
        userId: OWNER,
        projectId: PROJECT,
        stage: "video_src",
        name: "64b0000000000000000000aa.mov",
      },
    ]);
  });

  test("never the preview copy, even when there is one (DOWNLOAD-006)", async () => {
    const { access, calls } = setup();
    await access.issueDownload(makeVideo(), {
      callerId: CALLER,
      correlationId: "c",
    });
    assert.equal(calls.head[0].stage, "video_src");
    assert.ok(calls.url.every((t) => t.stage !== "video_preview"));
  });

  test("issuance logged with correlationId, user and resource, without the URL (DOWNLOAD-009, T-10)", async () => {
    const { access, logs } = setup();
    await access.issueDownload(makeVideo(), {
      callerId: CALLER,
      correlationId: "corr-1",
    });

    assert.deepEqual(logs, [
      {
        level: "info",
        event: "video.download.issued",
        fields: {
          correlationId: "corr-1",
          userId: CALLER,
          videoId: "64b0000000000000000000aa",
          projectId: PROJECT,
        },
      },
    ]);
    assert.ok(!JSON.stringify(logs).includes("Signature"));
  });

  for (const status of ["queued", "processing", "failed"]) {
    test(`${status} → 409 RESOURCE_NOT_READY, no URL (DOWNLOAD-003)`, async () => {
      const { access, calls, logs } = setup();
      await assert.rejects(
        access.issueDownload(makeVideo({ status }), {
          callerId: CALLER,
          correlationId: "c",
        }),
        (err) =>
          err instanceof VideoError &&
          err.status === 409 &&
          err.code === "RESOURCE_NOT_READY",
      );
      assert.equal(calls.url.length, 0);
      assert.equal(logs.length, 0);
    });
  }

  test("object missing → 404 RESOURCE_UNAVAILABLE, logged, no URL", async () => {
    const { access, calls, logs } = setup({ objects: [] });
    await assert.rejects(
      access.issueDownload(makeVideo(), {
        callerId: CALLER,
        correlationId: "corr-4",
      }),
      (err) =>
        err instanceof VideoError &&
        err.status === 404 &&
        err.code === "RESOURCE_UNAVAILABLE",
    );
    assert.equal(calls.url.length, 0);
    assert.equal(logs.length, 1);
    assert.equal(logs[0].level, "error");
    assert.equal(logs[0].event, "video.download.unavailable");
    assert.equal(logs[0].fields.correlationId, "corr-4");
  });

  test("each request gives a new URL with a new expiry (DOWNLOAD-008)", async () => {
    let clock = NOW;
    const access = createAccess({
      Video: {},
      storage: {
        URL_EXPIRES: 900,
        parseKey: (ownerId, key) => {
          const [projectId, stage, name] = key.split("/");
          return { userId: String(ownerId), projectId, stage, name };
        },
        head: async () => ({ contentLength: 1 }),
        publicReadUrl: async () => `https://x/s3-video/a?t=${clock}`,
      },
      log: { info() {}, warn() {}, error() {} },
      now: () => clock,
    });
    const ctx = { callerId: CALLER, correlationId: "c" };

    const first = await access.issueDownload(makeVideo(), ctx);
    clock += 16 * 60 * 1000;
    const second = await access.issueDownload(makeVideo(), ctx);

    assert.notEqual(first.url, second.url);
    assert.equal(
      Date.parse(second.expiresAt) - Date.parse(first.expiresAt),
      16 * 60 * 1000,
    );
  });
});

// --- No task and no quota (DOWNLOAD-004, INFO-007, QUOTA-008) ---

test("the access module does not depend on quota, tasks, the bus or the users service", () => {
  const source = require("fs").readFileSync(
    require.resolve("../../video/access"),
    "utf8",
  );
  for (const forbidden of ["quota", "amqp", "VideoTask", "users", "axios"]) {
    assert.ok(
      !new RegExp(`require\\([^)]*${forbidden}`, "i").test(source),
      `access.js must not require ${forbidden}`,
    );
  }
});
