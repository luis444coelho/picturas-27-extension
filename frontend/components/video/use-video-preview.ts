"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import type { VideoRecipeStep } from "@/lib/video-access";
import type { VideoApiError, VideoTarget } from "@/lib/videos";
import type { PreviewImage } from "@/lib/video-visual";
import { fieldLabel, visualStepErrorMessage } from "@/lib/video-visual";

type Fetcher = (
  target: VideoTarget,
  videoId: string,
  step: VideoRecipeStep,
) => Promise<PreviewImage>;

// Errors of a preview answered as a blob: the JSON body must be read first.
async function previewError(cause: unknown): Promise<string> {
  if (!axios.isAxiosError(cause)) return "Não foi possível gerar a pré-visualização.";
  let data: VideoApiError | undefined;
  const raw = cause.response?.data;
  try {
    data = raw instanceof Blob ? JSON.parse(await raw.text()) : raw;
  } catch {
    data = undefined;
  }
  const first = (data?.error.details?.errors as { code?: string; field?: string }[] | undefined)?.[0];
  if (first?.code) {
    const label = fieldLabel(first.field);
    const message = visualStepErrorMessage(first.code, first);
    return label ? `${label}: ${message}` : message;
  }
  return "Não foi possível gerar a pré-visualização.";
}

// Static preview of the first frame (ADD T-07): debounced, the newest request
// wins, and the object URL is released when replaced or unmounted.
export function useVideoPreview(
  target: VideoTarget,
  videoId: string,
  step: VideoRecipeStep | null,
  fetcher: Fetcher,
  delayMs = 200,
) {
  const key = JSON.stringify([target, videoId, step]);
  const [state, setState] = useState<{
    key: string;
    url?: string;
    width?: number | null;
    height?: number | null;
    error?: string;
  } | null>(null);
  useEffect(() => {
    if (!step) return;
    let disposed = false;
    let url: string | undefined;
    const timer = setTimeout(() => {
      fetcher(target, videoId, step).then(
        (image) => {
          if (disposed) return;
          url = URL.createObjectURL(image.blob);
          setState({ key, url, width: image.width, height: image.height });
        },
        async (cause) => {
          const error = await previewError(cause);
          if (!disposed) setState({ key, error });
        },
      );
    }, delayMs);
    return () => {
      disposed = true;
      clearTimeout(timer);
      if (url) URL.revokeObjectURL(url);
    };
    // key includes every request argument; object identities change on render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const current = state?.key === key ? state : null;
  return {
    url: current?.url,
    width: current?.width ?? null,
    height: current?.height ?? null,
    error: current?.error,
    pending: Boolean(step && !current),
  };
}

export type VideoPreviewState = ReturnType<typeof useVideoPreview>;
