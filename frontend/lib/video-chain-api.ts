import { api } from "./axios";
import type { VideoTarget } from "./videos";
import type { VideoRecipeStep } from "./video-access";
import type { VideoTaskAccepted, VideoValidation } from "./video-tasks";
import type { PreviewImage } from "./video-visual-api";
import type { StepInputProps } from "./video-chain";

// API of the chains, concats and video presets of B008 (ADD 4.8, 4.9, D-78,
// D-83). Same path and share handling as lib/video-tasks.ts.
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

export interface ChainErrorEntry {
  index: number;
  clipIndex?: number;
  stepIndex?: number;
  errors: { code: string; field?: string; [key: string]: unknown }[];
}

export interface ChainValidation extends Omit<VideoValidation, "errors"> {
  errors: ChainErrorEntry[];
  // Properties at the input of every step (…/chain/validate, revision of B008).
  inputs?: {
    steps: (StepInputProps | null)[];
    clips: (StepInputProps | null)[][];
    clipOutputs: (StepInputProps | null)[];
    output: StepInputProps | null;
  };
}

const isConcat = (steps: VideoRecipeStep[]) => steps[0]?.operation === "concat";

// With a concat, the routes without :video and without videoId (D-78).
export const validateChain = async (
  target: VideoTarget,
  videoId: string | null,
  steps: VideoRecipeStep[],
) => {
  const body = isConcat(steps) ? { steps } : { videoId, steps };
  const response = await api.post<ChainValidation>(
    `${videosPath(target)}/validate`,
    body,
    requestConfig(target),
  );
  return response.data;
};

// Validation with the input properties of every step, for the configuration
// components of the compositions (ADR-020, CHAIN-003).
export const validateChainWithInputs = async (
  target: VideoTarget,
  videoId: string | null,
  steps: VideoRecipeStep[],
) => {
  const body = isConcat(steps) ? { steps } : { videoId, steps };
  const response = await api.post<ChainValidation>(
    `${videosPath(target)}/chain/validate`,
    body,
    requestConfig(target),
  );
  return response.data;
};

// Watermark preview after the static steps of a chain (D-89).
export const fetchChainWatermarkPreview = async (
  target: VideoTarget,
  videoId: string,
  steps: VideoRecipeStep[],
): Promise<PreviewImage> => {
  const response = await api.post<Blob>(
    `${videosPath(target)}/${videoId}/chain/watermark-preview`,
    { steps },
    { ...requestConfig(target), responseType: "blob" },
  );
  return { blob: response.data, width: null, height: null };
};

export const submitChain = async (
  target: VideoTarget,
  videoId: string | null,
  steps: VideoRecipeStep[],
) => {
  const path = isConcat(steps)
    ? `${videosPath(target)}/operations`
    : `${videosPath(target)}/${videoId}/operations`;
  const response = await api.post<VideoTaskAccepted>(
    path,
    { steps },
    requestConfig(target),
  );
  return response.data;
};

// ---- video presets (CHAIN-014, D-83) ----------------------------------------

export interface VideoPreset {
  id: string;
  name: string;
  steps: VideoRecipeStep[];
  createdAt: string;
  updatedAt: string;
}

const presetsPath = (uid: string) => `/users/${uid}/video-presets`;
const auth = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const listVideoPresets = async (uid: string, token: string) =>
  (await api.get<VideoPreset[]>(presetsPath(uid), auth(token))).data;

export const createVideoPreset = async (
  uid: string,
  token: string,
  name: string,
  steps: VideoRecipeStep[],
) =>
  (await api.post<VideoPreset>(presetsPath(uid), { name, steps }, auth(token)))
    .data;

export const updateVideoPreset = async (
  uid: string,
  token: string,
  id: string,
  patch: { name?: string; steps?: VideoRecipeStep[] },
) =>
  (
    await api.patch<VideoPreset>(
      `${presetsPath(uid)}/${id}`,
      patch,
      auth(token),
    )
  ).data;

export const deleteVideoPreset = async (
  uid: string,
  token: string,
  id: string,
) => {
  await api.delete(`${presetsPath(uid)}/${id}`, auth(token));
};
