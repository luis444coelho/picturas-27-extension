const test = require("node:test");
const assert = require("node:assert/strict");

const { createIngest } = require("../../video/ingest");
const { VideoError } = require("../../video/errors");
const {
  createVideoModel,
  createStorage,
  createBus,
  createUsers,
  silentLog,
} = require("./fakes");

const OWNER = "64b000000000000000000001";
const PROJECT = "64b0000000000000000000aa";
const GUEST = "64b000000000000000000002";
const ANON = "64b000000000000000000003";
const PREMIUM = "64b000000000000000000004";
const MB = 1024 * 1024;

function setup(options = {}) {
  const Video = createVideoModel();
  const storage = createStorage(options.storage);
  const bus = createBus(options.bus);
  const users = createUsers({
    [OWNER]: "free",
    [GUEST]: "free",
    [ANON]: "anonymous",
    [PREMIUM]: "premium",
  });
  const ingest = createIngest({ Video, storage, bus, users, log: silentLog });
  return { Video, storage, bus, ingest };
}

async function upload(ctx, overrides = {}) {
  return ctx.ingest.requestUpload({
    ownerId: OWNER,
    projectId: PROJECT,
    callerId: OWNER,
    fileName: "férias.mp4",
    mimeType: "video/mp4",
    sizeBytes: 10 * MB,
    correlationId: "corr-1",
    ...overrides,
  });
}

async function rejects(promise, status, code) {
  await assert.rejects(promise, (err) => {
    assert.ok(err instanceof VideoError, `expected VideoError, got ${err}`);
    assert.equal(err.status, status);
    assert.equal(err.code, code);
    return true;
  });
}

const PROBE_META = {
  formatName: "mov,mp4,m4a,3gp,3g2,mj2",
  majorBrand: "isom",
  videoCodec: "h264",
  audioCodec: "aac",
  width: 1920,
  height: 1080,
  rotation: 90,
  fpsNum: 30,
  fpsDen: 1,
  durationMs: 60000,
  sizeBytes: 10 * MB,
  bitrate: 1400000,
};

function probeReply(videoId, meta = {}, stream = { pixFmt: "yuv420p" }) {
  return {
    operation: "ingest.probe",
    videoId,
    correlationId: "corr-1",
    status: "success",
    output: { meta: { ...PROBE_META, ...meta }, stream },
  };
}

async function uploadedAndConfirmed(ctx, overrides = {}) {
  const ticket = await upload(ctx, overrides);
  ctx.storage.headResult = {
    contentLength: overrides.sizeBytes ?? 10 * MB,
    contentType: "video/mp4",
  };
  const video = ctx.Video.docs.get(ticket.videoId);
  await ctx.ingest.completeUpload({
    video,
    callerId: overrides.callerId ?? OWNER,
    correlationId: "corr-1",
  });
  return ticket.videoId;
}

// --- requestUpload ---------------------------------------------------------

test("requestUpload creates a queued record and a signed PUT URL (D-11, D-15)", async () => {
  const ctx = setup();
  const ticket = await upload(ctx);

  const doc = ctx.Video.docs.get(ticket.videoId);
  assert.equal(doc.status, "queued");
  assert.equal(doc.original_name, "férias.mp4");
  assert.equal(
    doc.storage.original_key,
    `${PROJECT}/video_src/${ticket.videoId}.mp4`,
  );
  assert.equal(doc.meta.size_bytes, 10 * MB);
  assert.equal(String(doc.owner_id), OWNER);
  assert.deepEqual(doc.source_video_ids, undefined ?? doc.source_video_ids);
  assert.equal(ticket.upload.method, "PUT");
  assert.equal(ticket.upload.headers["Content-Type"], "video/mp4");
  assert.equal(ticket.upload.expiresIn, 900);
  assert.match(ticket.upload.url, /\/s3-video\/user-64b0+1\//);
  assert.deepEqual(ctx.storage.buckets, [OWNER]);
});

test("requestUpload uses the owner's bucket when a guest uploads", async () => {
  const ctx = setup();
  const ticket = await upload(ctx, { callerId: GUEST });
  const doc = ctx.Video.docs.get(ticket.videoId);
  assert.equal(String(doc.owner_id), OWNER);
  assert.equal(String(doc.created_by), GUEST);
  assert.match(ticket.upload.url, new RegExp(`user-${OWNER}/`));
});

test("requestUpload refuses anonymous users (AUTH-002)", async () => {
  const ctx = setup();
  await rejects(upload(ctx, { callerId: ANON }), 403, "FORBIDDEN");
  assert.equal(ctx.Video.docs.size, 0);
});

test("requestUpload refuses formats outside the matrix (UPLOAD-003/020)", async () => {
  const ctx = setup();
  await rejects(
    upload(ctx, { fileName: "a.mkv", mimeType: "video/x-matroska" }),
    422,
    "UNSUPPORTED_FORMAT",
  );
  await rejects(
    upload(ctx, { fileName: "a.mp4", mimeType: "video/webm" }),
    422,
    "UNSUPPORTED_FORMAT",
  );
  assert.equal(ctx.Video.docs.size, 0);
});

test("requestUpload applies the size limit of the caller's profile (UPLOAD-004)", async () => {
  const ctx = setup();
  await rejects(upload(ctx, { sizeBytes: 250 * MB }), 422, "LIMIT_EXCEEDED");
  const ticket = await upload(ctx, { callerId: PREMIUM, sizeBytes: 250 * MB });
  assert.ok(ticket.videoId);
  await rejects(
    upload(ctx, { callerId: PREMIUM, sizeBytes: 2 * 1024 * MB + 1 }),
    422,
    "LIMIT_EXCEEDED",
  );
});

test("requestUpload validates the request body (D-23)", async () => {
  const ctx = setup();
  await rejects(upload(ctx, { fileName: "" }), 422, "INVALID_REQUEST");
  await rejects(upload(ctx, { sizeBytes: "10" }), 422, "INVALID_REQUEST");
  await rejects(upload(ctx, { sizeBytes: 0 }), 422, "INVALID_REQUEST");
});

test("requestUpload removes the record when the URL cannot be issued", async () => {
  const ctx = setup({ storage: { failWriteUrl: true } });
  await assert.rejects(upload(ctx));
  assert.equal(ctx.Video.docs.size, 0);
});

// --- completeUpload / cancelUpload -----------------------------------------

test("completeUpload checks the object, moves to processing and publishes ingest.probe", async () => {
  const ctx = setup();
  const ticket = await upload(ctx);
  ctx.storage.headResult = { contentLength: 10 * MB, contentType: "video/mp4" };

  const result = await ctx.ingest.completeUpload({
    video: ctx.Video.docs.get(ticket.videoId),
    callerId: OWNER,
    correlationId: "corr-1",
  });

  assert.deepEqual(result, { videoId: ticket.videoId, status: "processing" });
  assert.equal(ctx.Video.docs.get(ticket.videoId).status, "processing");
  assert.equal(ctx.bus.operations.length, 1);
  const msg = ctx.bus.operations[0];
  assert.equal(msg.operation, "ingest.probe");
  assert.equal(msg.videoId, ticket.videoId);
  assert.equal(msg.correlationId, "corr-1");
  assert.deepEqual(msg.source, {
    userId: OWNER,
    projectId: PROJECT,
    stage: "video_src",
    name: `${ticket.videoId}.mp4`,
  });
  assert.deepEqual(
    ctx.bus.ws.map((e) => [e.event, e.status, e.videoId]),
    [["video-ingest-update", "processing", ticket.videoId]],
  );
  // The WS event carries only ids and status (T-03).
  assert.equal(ctx.bus.ws[0].originalName, undefined);
});

test("completeUpload is only for the uploader and only in queued", async () => {
  const ctx = setup();
  const ticket = await upload(ctx);
  ctx.storage.headResult = { contentLength: 10 * MB };
  const video = ctx.Video.docs.get(ticket.videoId);

  await rejects(
    ctx.ingest.completeUpload({ video, callerId: GUEST }),
    403,
    "FORBIDDEN",
  );
  await ctx.ingest.completeUpload({ video, callerId: OWNER });
  await rejects(
    ctx.ingest.completeUpload({
      video: ctx.Video.docs.get(ticket.videoId),
      callerId: OWNER,
    }),
    409,
    "INVALID_STATE",
  );
});

test("completeUpload without object purges the record (UPLOAD_ABORTED)", async () => {
  const ctx = setup();
  const ticket = await upload(ctx);
  ctx.storage.headResult = null;
  await rejects(
    ctx.ingest.completeUpload({
      video: ctx.Video.docs.get(ticket.videoId),
      callerId: OWNER,
    }),
    422,
    "UPLOAD_ABORTED",
  );
  assert.equal(ctx.Video.docs.size, 0);
  assert.equal(ctx.bus.operations.length, 0);
});

test("completeUpload purges a partial upload (size differs from declared)", async () => {
  const ctx = setup();
  const ticket = await upload(ctx);
  ctx.storage.headResult = { contentLength: 5 * MB };
  await rejects(
    ctx.ingest.completeUpload({
      video: ctx.Video.docs.get(ticket.videoId),
      callerId: OWNER,
    }),
    422,
    "UPLOAD_ABORTED",
  );
  assert.equal(ctx.Video.docs.size, 0);
  assert.deepEqual(ctx.storage.removed, [
    `${PROJECT}/video_src/${ticket.videoId}.mp4`,
  ]);
});

test("completeUpload rejects a real size above the profile limit", async () => {
  const ctx = setup();
  const ticket = await upload(ctx);
  ctx.storage.headResult = { contentLength: 201 * MB };
  await rejects(
    ctx.ingest.completeUpload({
      video: ctx.Video.docs.get(ticket.videoId),
      callerId: OWNER,
    }),
    422,
    "LIMIT_EXCEEDED",
  );
  assert.equal(ctx.Video.docs.size, 0);
  assert.equal(ctx.storage.removed.length, 1);
});

test("completeUpload fails and cleans up when the probe cannot be published", async () => {
  const ctx = setup({ bus: { failPublish: true } });
  const ticket = await upload(ctx);
  ctx.storage.headResult = { contentLength: 10 * MB };
  await rejects(
    ctx.ingest.completeUpload({
      video: ctx.Video.docs.get(ticket.videoId),
      callerId: OWNER,
    }),
    502,
    "INTERNAL_ERROR",
  );
  assert.equal(ctx.Video.docs.size, 0);
  assert.equal(ctx.bus.ws.at(-1).status, "failed");
});

test("cancelUpload removes the object and the record (UPLOAD-006, FA2)", async () => {
  const ctx = setup();
  const ticket = await upload(ctx);
  await ctx.ingest.cancelUpload({
    video: ctx.Video.docs.get(ticket.videoId),
    callerId: OWNER,
  });
  assert.equal(ctx.Video.docs.size, 0);
  assert.deepEqual(ctx.storage.removed, [
    `${PROJECT}/video_src/${ticket.videoId}.mp4`,
  ]);
});

test("cancelUpload is refused to others and after the confirmation", async () => {
  const ctx = setup();
  const ticket = await upload(ctx);
  await rejects(
    ctx.ingest.cancelUpload({
      video: ctx.Video.docs.get(ticket.videoId),
      callerId: GUEST,
    }),
    403,
    "FORBIDDEN",
  );

  const id = await uploadedAndConfirmed(ctx);
  await rejects(
    ctx.ingest.cancelUpload({ video: ctx.Video.docs.get(id), callerId: OWNER }),
    409,
    "INVALID_STATE",
  );
});

// --- worker replies ----------------------------------------------------------

test("probe reply stores metadata with display dimensions and publishes ingest.derive", async () => {
  const ctx = setup();
  const id = await uploadedAndConfirmed(ctx);

  await ctx.ingest.handleReply(probeReply(id), {});

  const doc = ctx.Video.docs.get(id);
  assert.equal(doc.status, "processing");
  assert.deepEqual(
    [
      doc.meta.container,
      doc.meta.width,
      doc.meta.height,
      doc.meta.rotation,
      doc.meta.display_width,
      doc.meta.display_height,
    ],
    ["mp4", 1920, 1080, 90, 1080, 1920],
  );
  assert.equal(doc.meta.audio_codec, "aac");
  assert.equal(doc.mime_type, "video/mp4");

  const derive = ctx.bus.operations.at(-1);
  assert.equal(derive.operation, "ingest.derive");
  assert.deepEqual(derive.plan, {
    thumbnailAtMs: 1000,
    thumbnailMaxWidth: 320,
    firstFrameMaxWidth: 1280,
    preview: null,
  });
  assert.equal(derive.targets.preview, undefined);
  assert.deepEqual(derive.targets.thumb, {
    stage: "video_thumb",
    name: `${id}.thumb.jpg`,
    userId: OWNER,
    projectId: PROJECT,
  });
});

test("probe reply of a MOV asks for a preview copy and sets the MIME from the container", async () => {
  const ctx = setup();
  const id = await uploadedAndConfirmed(ctx, {
    fileName: "a.mov",
    mimeType: "video/quicktime",
  });
  await ctx.ingest.handleReply(
    probeReply(id, { majorBrand: "qt  ", audioCodec: null, durationMs: 500 }),
    {},
  );

  const derive = ctx.bus.operations.at(-1);
  assert.deepEqual(derive.plan.preview, {
    video: "copy",
    audio: null,
    genpts: false,
  });
  assert.equal(derive.plan.thumbnailAtMs, 0);
  assert.deepEqual(derive.targets.preview, {
    stage: "video_preview",
    name: `${id}.mp4`,
    userId: OWNER,
    projectId: PROJECT,
  });
  const doc = ctx.Video.docs.get(id);
  assert.equal(doc.mime_type, "video/quicktime");
  assert.equal(doc.meta.audio_codec, null);
});

test("probe reply of a 10-bit MP4 asks for a re-encoded preview copy (Q-ADD-20)", async () => {
  const ctx = setup();
  const id = await uploadedAndConfirmed(ctx);
  await ctx.ingest.handleReply(
    probeReply(id, {}, { pixFmt: "yuv420p10le" }),
    {},
  );
  assert.equal(ctx.bus.operations.at(-1).plan.preview.video, "libx264");
});

for (const [name, meta, code] of [
  ["HEVC", { videoCodec: "hevc" }, "INVALID_CODEC"],
  ["no video stream (D-24)", { videoCodec: null }, "INVALID_CODEC"],
  ["duration over 5 min", { durationMs: 315000 }, "LIMIT_EXCEEDED"],
  ["unknown container", { formatName: "matroska,webm" }, "UNSUPPORTED_FORMAT"],
]) {
  test(`probe reply with ${name} fails with ${code} and leaves nothing behind`, async () => {
    const ctx = setup();
    const id = await uploadedAndConfirmed(ctx);
    await ctx.ingest.handleReply(probeReply(id, meta), {});

    assert.equal(ctx.Video.docs.size, 0);
    assert.deepEqual(ctx.storage.removed, [`${PROJECT}/video_src/${id}.mp4`]);
    const last = ctx.bus.ws.at(-1);
    assert.equal(last.status, "failed");
    assert.equal(last.error.code, code);
    assert.equal(
      ctx.bus.operations.filter((m) => m.operation === "ingest.derive").length,
      0,
    );
  });
}

test("a premium uploader may send videos up to 60 min", async () => {
  const ctx = setup();
  const id = await uploadedAndConfirmed(ctx, { callerId: PREMIUM });
  await ctx.ingest.handleReply(
    probeReply(id, { durationMs: 59 * 60 * 1000 }),
    {},
  );
  assert.equal(ctx.bus.operations.at(-1).operation, "ingest.derive");
});

test("probe error CORRUPTED_FILE fails the ingestion", async () => {
  const ctx = setup();
  const id = await uploadedAndConfirmed(ctx);
  await ctx.ingest.handleReply(
    {
      operation: "ingest.probe",
      videoId: id,
      status: "error",
      error: { code: "CORRUPTED_FILE", message: "moov atom not found" },
    },
    {},
  );
  assert.equal(ctx.Video.docs.size, 0);
  assert.equal(ctx.bus.ws.at(-1).error.code, "CORRUPTED_FILE");
});

test("derive reply completes the video and notifies the client", async () => {
  const ctx = setup();
  const id = await uploadedAndConfirmed(ctx);
  await ctx.ingest.handleReply(probeReply(id), {});
  await ctx.ingest.handleReply(
    {
      operation: "ingest.derive",
      videoId: id,
      status: "success",
      previewRequested: false,
      output: {
        thumbKey: `${PROJECT}/video_thumb/${id}.thumb.jpg`,
        firstFrameKey: `${PROJECT}/video_thumb/${id}.frame0.jpg`,
      },
    },
    {},
  );

  const doc = ctx.Video.docs.get(id);
  assert.equal(doc.status, "completed");
  assert.equal(doc.storage.thumb_key, `${PROJECT}/video_thumb/${id}.thumb.jpg`);
  assert.equal(doc.storage.preview_key, undefined);
  assert.equal(ctx.bus.ws.at(-1).status, "completed");
});

test("derive reply without the requested preview copy fails (integrity I2)", async () => {
  const ctx = setup();
  const id = await uploadedAndConfirmed(ctx);
  await ctx.ingest.handleReply(probeReply(id), {});
  await ctx.ingest.handleReply(
    {
      operation: "ingest.derive",
      videoId: id,
      status: "success",
      previewRequested: true,
      output: { thumbKey: "t", firstFrameKey: "f" },
    },
    {},
  );
  assert.equal(ctx.Video.docs.size, 0);
  assert.equal(ctx.bus.ws.at(-1).error.code, "PROCESSING_ERROR");
});

test("derive error removes the objects already written", async () => {
  const ctx = setup();
  const id = await uploadedAndConfirmed(ctx);
  await ctx.ingest.handleReply(probeReply(id), {});
  await ctx.ingest.handleReply(
    {
      operation: "ingest.derive",
      videoId: id,
      status: "error",
      error: { code: "PROCESSING_ERROR", message: "x" },
      output: { thumbKey: `${PROJECT}/video_thumb/${id}.thumb.jpg` },
    },
    {},
  );
  assert.equal(ctx.Video.docs.size, 0);
  assert.ok(
    ctx.storage.removed.includes(`${PROJECT}/video_thumb/${id}.thumb.jpg`),
  );
});

test("replies are idempotent: a redelivered probe or derive changes nothing", async () => {
  const ctx = setup();
  const id = await uploadedAndConfirmed(ctx);
  await ctx.ingest.handleReply(probeReply(id), {});
  await ctx.ingest.handleReply(probeReply(id, { durationMs: 999999999 }), {});
  assert.equal(
    ctx.bus.operations.filter((m) => m.operation === "ingest.derive").length,
    1,
  );
  assert.equal(ctx.Video.docs.get(id).meta.duration_ms, 60000);

  const derive = {
    operation: "ingest.derive",
    videoId: id,
    status: "success",
    previewRequested: false,
    output: { thumbKey: "a", firstFrameKey: "b" },
  };
  await ctx.ingest.handleReply(derive, {});
  const events = ctx.bus.ws.length;
  await ctx.ingest.handleReply(
    { ...derive, output: { thumbKey: "x", firstFrameKey: "y" } },
    {},
  );
  assert.equal(ctx.Video.docs.get(id).storage.thumb_key, "a");
  assert.equal(ctx.bus.ws.length, events);
});

test("a dead-lettered request fails the ingestion (T-03)", async () => {
  const ctx = setup();
  const id = await uploadedAndConfirmed(ctx);
  const request = ctx.bus.operations[0];
  await ctx.ingest.handleReply(request, {
    "x-death": [{ reason: "delivery_limit" }],
  });
  assert.equal(ctx.Video.docs.size, 0);
  assert.equal(ctx.bus.ws.at(-1).error.code, "PROCESSING_ERROR");
});

test("a dead-lettered request is recognised without the x-death header", async () => {
  const ctx = setup();
  const id = await uploadedAndConfirmed(ctx);
  await ctx.ingest.handleReply(ctx.bus.operations[0], {});
  assert.equal(ctx.Video.docs.has(id), false);
});

test("replies for unknown, queued or completed videos are ignored", async () => {
  const ctx = setup();
  await ctx.ingest.handleReply(probeReply("64b0000000000000000000ff"), {});
  await ctx.ingest.handleReply({ videoId: "not-an-id" }, {});
  const ticket = await upload(ctx);
  await ctx.ingest.handleReply(probeReply(ticket.videoId), {});
  assert.equal(ctx.Video.docs.get(ticket.videoId).status, "queued");
  assert.equal(ctx.bus.operations.length, 0);
});

test("an interrupted cleanup is finished on the next reply", async () => {
  const ctx = setup();
  const id = await uploadedAndConfirmed(ctx);
  ctx.Video.docs.get(id).status = "failed";
  await ctx.ingest.handleReply(probeReply(id), {});
  assert.equal(ctx.Video.docs.size, 0);
  assert.equal(ctx.storage.removed.length, 1);
});
