import { api } from "./axios";
import { videoErrorMessage, type VideoTarget } from "./videos";
import type { VideoRecipeStep } from "./video-access";
import { TASK_ERROR_MESSAGES, type VideoTaskUpdate } from "./video-task-state";

// Video tasks (ADD T-01, T-03): submission, real-time validation, state and
// cancellation. Mounted by the operation panels of B004 onwards (D-47).

export interface VideoTaskAccepted {
  taskId: string;
  status: "queued";
}

export interface VideoValidation {
  valid: boolean;
  cost: number | null;
  totalSteps: number;
  output: Record<string, unknown> | null;
  errors: { index: number; errors: { code: string; field?: string }[] }[];
}

export interface VideoTaskView extends VideoTaskUpdate {
  kind: "single" | "chain" | "concat";
  cost: number;
  createdAt: string;
  updatedAt: string;
}

// Same path and share handling as lib/videos.ts.
function videosPath({ uid, pid, ownerId, shareId }: VideoTarget) {
  const pathUid = shareId ? (ownerId ?? uid) : uid;
  return `/projects/${pathUid}/${pid}/videos`;
}

function requestConfig({ token, shareId }: VideoTarget) {
  return {
    headers: { Authorization: `Bearer ${token}` },
    params: shareId ? { share: shareId } : undefined,
  };
}

export const submitVideoOperation = async (
  target: VideoTarget,
  videoId: string,
  steps: VideoRecipeStep[],
) => {
  const response = await api.post<VideoTaskAccepted>(
    `${videosPath(target)}/${videoId}/operations`,
    { steps },
    requestConfig(target),
  );
  return response.data;
};

export const validateVideoSteps = async (
  target: VideoTarget,
  videoId: string,
  steps: VideoRecipeStep[],
) => {
  const response = await api.post<VideoValidation>(
    `${videosPath(target)}/validate`,
    { videoId, steps },
    requestConfig(target),
  );
  return response.data;
};

export const fetchVideoTask = async (target: VideoTarget, taskId: string) => {
  const response = await api.get<VideoTaskView>(
    `${videosPath(target)}/tasks/${taskId}`,
    requestConfig(target),
  );
  return response.data;
};

export const cancelVideoTask = async (target: VideoTarget, taskId: string) => {
  const response = await api.delete<VideoTaskView>(
    `${videosPath(target)}/tasks/${taskId}`,
    requestConfig(target),
  );
  return response.data;
};

// The validation is called with debounce, not on every control movement (ADD T-01).
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  waitMs = 300,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  };
}

export function videoTaskErrorMessage(code: string | null | undefined) {
  return (code && TASK_ERROR_MESSAGES[code]) || videoErrorMessage(code);
}
