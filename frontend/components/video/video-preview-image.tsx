"use client";

import { LoaderCircle } from "lucide-react";
import type { VideoPreviewState } from "./use-video-preview";

// First-frame preview of a visual edit (ADD T-07), with its final dimensions.
export function VideoPreviewImage({
  preview,
  alt,
  width,
  height,
}: {
  preview: VideoPreviewState;
  alt: string;
  width?: number | null;
  height?: number | null;
}) {
  const shownWidth = width ?? preview.width;
  const shownHeight = height ?? preview.height;
  return (
    <div className="flex flex-col gap-1">
      <div className="relative flex min-h-40 items-center justify-center rounded-md bg-muted">
        {preview.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview.url} alt={alt} className="max-h-[40vh] w-auto rounded-md" />
        )}
        {preview.pending && (
          <LoaderCircle className="absolute animate-spin" aria-label="A gerar pré-visualização" />
        )}
      </div>
      {preview.error && (
        <p role="alert" className="text-sm text-destructive">
          {preview.error}
        </p>
      )}
      {shownWidth && shownHeight && (
        <p className="text-xs text-muted-foreground">
          Dimensões finais: {shownWidth}×{shownHeight}
        </p>
      )}
    </div>
  );
}
