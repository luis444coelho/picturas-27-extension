import type { VideoTarget, VideoUploadTicket } from "./videos";

// Create a project from a video (UC-VID-000 FA6, D-30): an empty project is
// created first, then the video goes through the B001 upload flow. The steps
// are injected so the flow is tested without a browser.
export interface VideoProjectSteps {
  createProject: (name: string) => Promise<{ _id: string }>;
  requestUpload: (
    target: VideoTarget,
    file: File,
  ) => Promise<VideoUploadTicket>;
  putFile: (
    ticket: VideoUploadTicket,
    file: File,
    onProgress: (percent: number) => void,
    signal: AbortSignal,
  ) => Promise<void>;
  completeUpload: (target: VideoTarget, videoId: string) => Promise<unknown>;
  cancelUpload: (target: VideoTarget, videoId: string) => Promise<void>;
  // Stable code of an API error, or null for storage and network errors.
  errorCode: (error: unknown) => string | null;
  isAborted: (error: unknown) => boolean;
}

export type VideoProjectResult =
  | { projectId: string; videoId: string; outcome: "uploaded" }
  | { projectId: string; videoId: string | null; outcome: "cancelled" }
  | {
      projectId: string;
      videoId: string | null;
      outcome: "failed";
      errorCode: string;
    };

// "uploaded" means the transfer was confirmed (202); the ingestion result
// arrives later by video-ingest-update. Errors creating the project are
// thrown: then there is no project. Any later error keeps the project, empty.
export async function createVideoProject(
  steps: VideoProjectSteps,
  input: {
    uid: string;
    token: string;
    name: string;
    file: File;
    onProgress: (percent: number) => void;
    signal: AbortSignal;
  },
): Promise<VideoProjectResult> {
  const project = await steps.createProject(input.name.trim());
  const target: VideoTarget = {
    uid: input.uid,
    pid: project._id,
    token: input.token,
    ownerId: input.uid,
  };
  let videoId: string | null = null;

  try {
    const ticket = await steps.requestUpload(target, input.file);
    videoId = ticket.videoId;
    if (input.signal.aborted) throw new CancelledBeforeTransfer();
    await steps.putFile(ticket, input.file, input.onProgress, input.signal);
    await steps.completeUpload(target, videoId);
    return { projectId: project._id, videoId, outcome: "uploaded" };
  } catch (error) {
    const code =
      error instanceof CancelledBeforeTransfer ? null : steps.errorCode(error);
    // Errors before the confirmation leave a queued record behind: cancel it.
    if (videoId && code === null) {
      await steps.cancelUpload(target, videoId).catch(() => undefined);
    }
    if (error instanceof CancelledBeforeTransfer || steps.isAborted(error)) {
      return { projectId: project._id, videoId, outcome: "cancelled" };
    }
    return {
      projectId: project._id,
      videoId,
      outcome: "failed",
      errorCode: code ?? "UPLOAD_ABORTED",
    };
  }
}

class CancelledBeforeTransfer extends Error {}
