// Unit tests of the "create a project from a video" flow (UC-VID-000 FA6,
// D-30). No test runner in the frontend: Node runs them with type stripping.
//
//   node --experimental-strip-types --test test/video-project.test.mts
import test from "node:test";
import assert from "node:assert/strict";
import {
  createVideoProject,
  type VideoProjectSteps,
} from "../lib/video-project.ts";

class AxiosLikeError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}
class AbortedError extends Error {}

const file = { name: "clip.mp4", type: "video/mp4", size: 1024 } as File;

function fakeSteps(overrides: Partial<VideoProjectSteps> = {}) {
  const calls: string[] = [];
  const steps: VideoProjectSteps = {
    createProject: async (name) => {
      calls.push(`create:${name}`);
      return { _id: "p1" };
    },
    requestUpload: async (target, f) => {
      calls.push(`ticket:${target.uid}/${target.pid}:${f.name}`);
      return {
        videoId: "v1",
        upload: { url: "u", method: "PUT", headers: {}, expiresIn: 900 },
      };
    },
    putFile: async (_ticket, _f, onProgress) => {
      calls.push("put");
      onProgress(50);
      onProgress(100);
    },
    completeUpload: async (_target, videoId) => {
      calls.push(`complete:${videoId}`);
    },
    cancelUpload: async (_target, videoId) => {
      calls.push(`cancel:${videoId}`);
    },
    errorCode: (error) =>
      error instanceof AxiosLikeError ? error.code : null,
    isAborted: (error) => error instanceof AbortedError,
    ...overrides,
  };
  return { steps, calls };
}

function input(signal = new AbortController().signal) {
  const progress: number[] = [];
  return {
    progress,
    value: {
      uid: "u1",
      token: "t",
      name: "  Férias  ",
      file,
      onProgress: (p: number) => progress.push(p),
      signal,
    },
  };
}

test("creates an empty project, uploads the video into it and confirms (FA6)", async () => {
  const { steps, calls } = fakeSteps();
  const { value, progress } = input();

  const result = await createVideoProject(steps, value);

  assert.deepEqual(result, {
    projectId: "p1",
    videoId: "v1",
    outcome: "uploaded",
  });
  assert.deepEqual(calls, [
    "create:Férias",
    "ticket:u1/p1:clip.mp4",
    "put",
    "complete:v1",
  ]);
  assert.deepEqual(progress, [50, 100]);
});

test("an error creating the project is thrown and nothing is uploaded", async () => {
  const { steps, calls } = fakeSteps({
    createProject: async () => {
      throw new AxiosLikeError("INTERNAL_ERROR");
    },
  });

  await assert.rejects(createVideoProject(steps, input().value));
  assert.deepEqual(calls, []);
});

test("a refused upload request keeps the project, empty, with the API code", async () => {
  const { steps, calls } = fakeSteps({
    requestUpload: async () => {
      throw new AxiosLikeError("LIMIT_EXCEEDED");
    },
  });

  const result = await createVideoProject(steps, input().value);

  assert.deepEqual(result, {
    projectId: "p1",
    videoId: null,
    outcome: "failed",
    errorCode: "LIMIT_EXCEEDED",
  });
  assert.deepEqual(calls, ["create:Férias"]);
});

test("cancelling during the transfer cancels the queued video and keeps the project", async () => {
  const { steps, calls } = fakeSteps({
    putFile: async () => {
      throw new AbortedError();
    },
  });

  const result = await createVideoProject(steps, input().value);

  assert.deepEqual(result, {
    projectId: "p1",
    videoId: "v1",
    outcome: "cancelled",
  });
  assert.deepEqual(calls, [
    "create:Férias",
    "ticket:u1/p1:clip.mp4",
    "cancel:v1",
  ]);
});

test("cancelling before the transfer starts cancels the queued video", async () => {
  const controller = new AbortController();
  const { steps, calls } = fakeSteps({
    requestUpload: async () => {
      controller.abort();
      return {
        videoId: "v1",
        upload: { url: "u", method: "PUT", headers: {}, expiresIn: 900 },
      };
    },
  });

  const result = await createVideoProject(steps, input(controller.signal).value);

  assert.equal(result.outcome, "cancelled");
  assert.deepEqual(calls, ["create:Férias", "cancel:v1"]);
});

test("a storage or network failure becomes UPLOAD_ABORTED and the video is cancelled", async () => {
  const { steps, calls } = fakeSteps({
    putFile: async () => {
      throw new Error("Storage answered 500");
    },
  });

  const result = await createVideoProject(steps, input().value);

  assert.deepEqual(result, {
    projectId: "p1",
    videoId: "v1",
    outcome: "failed",
    errorCode: "UPLOAD_ABORTED",
  });
  assert.ok(calls.includes("cancel:v1"));
});

test("a refused confirmation keeps its code and does not cancel (the server cleans up)", async () => {
  const { steps, calls } = fakeSteps({
    completeUpload: async () => {
      throw new AxiosLikeError("UPLOAD_ABORTED");
    },
  });

  const result = await createVideoProject(steps, input().value);

  assert.equal(result.outcome, "failed");
  assert.equal(
    result.outcome === "failed" ? result.errorCode : null,
    "UPLOAD_ABORTED",
  );
  assert.ok(!calls.includes("cancel:v1"));
});

test("a failing cancel does not hide the outcome", async () => {
  const { steps } = fakeSteps({
    putFile: async () => {
      throw new AbortedError();
    },
    cancelUpload: async () => {
      throw new Error("gone");
    },
  });

  const result = await createVideoProject(steps, input().value);
  assert.equal(result.outcome, "cancelled");
});
