"use client";

import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VideoTarget } from "@/lib/videos";
import {
  FILTERS,
  type FilterId,
  filterStep,
} from "@/lib/video-visual";
import {
  fetchFilterThumbnails,
  fetchVideoPreview,
} from "@/lib/video-visual-api";
import { useVideoEditValidation, type VideoEditSession } from "./use-video-edit";
import { useVideoPreview } from "./use-video-preview";
import { VideoPreviewImage } from "./video-preview-image";
import { VideoVisualValidation } from "./video-visual-validation";
import { initialParam, simpleSource, useReportStep, type OperationConfigProps } from "./operation-config";

// UC-VID-009: grid of the six catalog filters with thumbnails of the first
// frame (FILTER-002), single selection (FILTER-003) and preview (FILTER-004).
// Configuration of the filter (D-87, ADR-020), also used by the compositions.
export function FilterConfig({
  target,
  source,
  initial,
  disabled,
  chainValidation,
  onStepChange,
  renderActions,
}: OperationConfigProps) {
  const videoId = source.videoId;
  const [filter, setFilter] = useState<FilterId | null>(initialParam<FilterId | null>(initial, "filter", null));
  const thumbnails = useQuery({
    queryKey: ["videoFilterThumbnails", target.pid, target.shareId, videoId],
    queryFn: () => fetchFilterThumbnails(target, videoId),
    staleTime: 5 * 60 * 1000,
  });
  const step = filter ? filterStep(filter) : null;
  const preview = useVideoPreview(target, videoId, step, (t, v, s) => fetchVideoPreview(t, v, [...source.previewSteps, s]), 0);
  const ownValidation = useVideoEditValidation(target, videoId, chainValidation ? null : step);
  const validation = chainValidation ?? ownValidation;
  useReportStep(step, onStepChange);
  const thumbOf = (id: FilterId) => thumbnails.data?.find((t) => t.filter === id);
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Filtros">
        {FILTERS.map(({ id, label }) => {
          const thumb = thumbOf(id);
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={filter === id}
              disabled={disabled}
              onClick={() => setFilter(id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md border p-1 text-xs",
                filter === id ? "border-primary ring-2 ring-primary" : "border-border",
              )}
            >
              <div className="flex h-16 w-full items-center justify-center overflow-hidden rounded bg-muted">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`data:${thumb.contentType};base64,${thumb.data}`}
                    alt={label}
                    className="h-full w-auto"
                  />
                ) : thumbnails.isLoading ? (
                  <LoaderCircle className="animate-spin" />
                ) : null}
              </div>
              {label}
            </button>
          );
        })}
      </div>
      {thumbnails.isError && (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível carregar as miniaturas dos filtros.
        </p>
      )}
      {step && <VideoPreviewImage preview={preview} alt="Primeiro fotograma com o filtro" />}
      <VideoVisualValidation validation={validation} />
      {renderActions({ step, validation, busy: disabled, beforeSubmit: () => undefined })}
    </div>
  );
}

export function VideoFilterPanel({
  target,
  videoId,
  session,
}: {
  target: VideoTarget;
  videoId: string;
  session: VideoEditSession;
}) {
  return (
    <FilterConfig
      target={target}
      source={simpleSource(videoId, {})}
      disabled={session.busy}
      renderActions={({ step, validation }) => (
        <Button
          disabled={!step || !validation.valid || session.busy}
          onClick={() => {
            if (step) void session.submit(step);
          }}
        >
          Aplicar filtro · 1 crédito
        </Button>
      )}
    />
  );
}
