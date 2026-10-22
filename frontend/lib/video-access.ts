import { api } from "./axios";
import type { VideoTarget } from "./videos";

// Information and download of a video (UC-VID-006, UC-VID-007; ADD 4.1, 4.2).

export type VideoInfoAttribute =
  "duration" | "resolution" | "format" | "size" | "fps";

export interface VideoRecipeStep {
  operation: string;
  version: number;
  parameters: Record<string, unknown>;
}

export interface VideoInfo {
  id: string;
  originalName: string;
  status: "queued" | "processing" | "completed" | "failed";
  // The fields below only come for completed videos.
  mimeType?: string;
  meta?: {
    container?: string;
    videoCodec?: string;
    // null means the video has no audio.
    audioCodec?: string | null;
    displayWidth?: number;
    displayHeight?: number;
    durationMs?: number;
    sizeBytes?: number;
    fpsNum?: number;
    fpsDen?: number;
  };
  // Attributes without metadata, shown as "Indisponível" (INFO-009).
  unavailable?: VideoInfoAttribute[];
  // A null name is a source that no longer exists (INFO-008).
  sources?: { id: string; originalName: string | null }[];
  recipe?: VideoRecipeStep[];
  downloadFileName?: string;
  createdAt?: string;
}

export interface VideoDownload {
  url: string;
  fileName: string;
  expiresAt: string;
}

// Same path and share handling as lib/videos.ts.
function videoPath({ uid, pid, ownerId, shareId }: VideoTarget, id: string) {
  const pathUid = shareId ? (ownerId ?? uid) : uid;
  return `/projects/${pathUid}/${pid}/videos/${id}`;
}

function requestConfig({ token, shareId }: VideoTarget) {
  return {
    headers: { Authorization: `Bearer ${token}` },
    params: shareId ? { share: shareId } : undefined,
  };
}

export const fetchVideoInfo = async (target: VideoTarget, videoId: string) => {
  const response = await api.get<VideoInfo>(
    videoPath(target, videoId),
    requestConfig(target),
  );
  return response.data;
};

// Called only on confirmation: the 15 minutes start here (ADD 4.1).
export const requestVideoDownload = async (
  target: VideoTarget,
  videoId: string,
) => {
  const response = await api.get<VideoDownload>(
    `${videoPath(target, videoId)}/download`,
    requestConfig(target),
  );
  return response.data;
};

// An anchor with href, not a blob, so the browser streams the file and can
// resume it (DOWNLOAD-007). The download attribute gives the suggested name:
// /s3-video/ has the same origin as the frontend (D-29, D-34).
export function startDownload({ url, fileName }: VideoDownload) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
