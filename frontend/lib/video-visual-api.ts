import { api } from "./axios";
import type { VideoTarget } from "./videos";
import type { VideoRecipeStep } from "./video-access";
import type { FilterId } from "./video-visual";

// B005 API calls: static previews (ADD T-07), filter thumbnails (4.4),
// watermark images (D-60) and the watermark preview (D-62).

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

export interface FilterThumbnail {
  filter: FilterId;
  label: string;
  contentType: string;
  data: string;
}

export interface PreviewImage {
  blob: Blob;
  width: number | null;
  height: number | null;
}

async function previewRequest(path: string, target: VideoTarget, steps: VideoRecipeStep[], frameJpeg?: string) {
  const response = await api.post<Blob>(path, { steps, ...(frameJpeg ? { frameJpeg } : {}) }, {
    ...requestConfig(target),
    responseType: "blob",
  });
  const width = Number(response.headers["x-output-width"]);
  const height = Number(response.headers["x-output-height"]);
  return {
    blob: response.data,
    width: Number.isFinite(width) && width > 0 ? width : null,
    height: Number.isFinite(height) && height > 0 ? height : null,
  } satisfies PreviewImage;
}

export const fetchVideoPreview = (
  target: VideoTarget,
  videoId: string,
  steps: VideoRecipeStep[],
  frameJpeg?: string,
) => previewRequest(`${videosPath(target)}/${videoId}/preview`, target, steps, frameJpeg);

export const fetchWatermarkPreview = (
  target: VideoTarget,
  videoId: string,
  step: VideoRecipeStep,
  frameJpeg?: string,
) =>
  previewRequest(`${videosPath(target)}/${videoId}/watermark-preview`, target, [step], frameJpeg);

export const fetchFilterThumbnails = async (target: VideoTarget, videoId: string) => {
  const response = await api.get<{ thumbnails: FilterThumbnail[] }>(
    `${videosPath(target)}/${videoId}/filters/thumbnails`,
    requestConfig(target),
  );
  return response.data.thumbnails;
};

export interface WatermarkImage {
  watermarkId: string;
  width: number;
  height: number;
}

export const uploadWatermarkFile = async (target: VideoTarget, file: File) => {
  const config = requestConfig(target);
  const response = await api.post<WatermarkImage>(`${videosPath(target)}/watermarks`, file, {
    ...config,
    headers: { ...config.headers, "Content-Type": file.type },
  });
  return response.data;
};

export const copyWatermarkFromGallery = async (target: VideoTarget, imageId: string) => {
  const response = await api.post<WatermarkImage>(
    `${videosPath(target)}/watermarks`,
    { imageId },
    requestConfig(target),
  );
  return response.data;
};
