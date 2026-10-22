"use client";

import { Lock, Unlock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VideoTarget } from "@/lib/videos";
import {
  fetchVideoPreview,
  lockedHeight,
  lockedWidth,
  presetSize,
  RESIZE_MIN,
  RESIZE_PRESETS,
  resizeStep,
  resizeWarnings,
} from "@/lib/video-visual";
import { useVideoEditValidation, type VideoEditSession } from "./use-video-edit";
import { useVideoPreview } from "./use-video-preview";
import { VideoPreviewImage } from "./video-preview-image";
import { VideoVisualValidation } from "./video-visual-validation";

// UC-VID-010: presentation dimensions (RESIZE-001), proportion lock with even
// rounding (RESIZE-002), presets (RESIZE-003, D-64) and the distortion and
// enlargement warnings (RESIZE-004/005). resize-tool.tsx is not used.
export function VideoResizePanel({
  target,
  videoId,
  sourceWidth,
  sourceHeight,
  session,
}: {
  target: VideoTarget;
  videoId: string;
  sourceWidth: number;
  sourceHeight: number;
  session: VideoEditSession;
}) {
  const [locked, setLocked] = useState(true);
  const [width, setWidth] = useState(String(sourceWidth));
  const [height, setHeight] = useState(String(sourceHeight));
  const w = Number(width);
  const h = Number(height);
  const numeric = Number.isInteger(w) && Number.isInteger(h) && w > 0 && h > 0;
  const step = numeric ? resizeStep(w, h) : null;
  const preview = useVideoPreview(target, videoId, step, (t, v, s) => fetchVideoPreview(t, v, [s]));
  const validation = useVideoEditValidation(target, videoId, step);
  const warnings = numeric ? resizeWarnings(w, h, sourceWidth, sourceHeight) : null;
  const setBoth = (next: { width: number; height: number }) => {
    setWidth(String(next.width));
    setHeight(String(next.height));
  };
  return (
    <div className="flex flex-col gap-3">
      <VideoPreviewImage preview={preview} alt="Primeiro fotograma redimensionado" width={numeric ? w : null} height={numeric ? h : null} />
      <p className="text-xs text-muted-foreground">
        Dimensões atuais: {sourceWidth}×{sourceHeight}
      </p>
      <div className="flex flex-wrap gap-2">
        {RESIZE_PRESETS.map((preset) => (
          <Button
            key={preset}
            size="sm"
            variant="outline"
            disabled={session.busy}
            onClick={() => {
              setLocked(true);
              setBoth(presetSize(preset, sourceWidth, sourceHeight));
            }}
          >
            {preset}p
          </Button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="resize-width">Largura (px)</Label>
          <Input
            id="resize-width"
            type="number"
            min={RESIZE_MIN}
            step={2}
            value={width}
            disabled={session.busy}
            onChange={(event) => {
              setWidth(event.target.value);
              const value = Number(event.target.value);
              if (locked && value > 0) setHeight(String(lockedHeight(value, sourceWidth, sourceHeight)));
            }}
          />
        </div>
        <Button
          size="icon"
          variant={locked ? "default" : "outline"}
          aria-label={locked ? "Desbloquear proporção" : "Bloquear proporção"}
          aria-pressed={locked}
          disabled={session.busy}
          onClick={() => {
            if (!locked) setHeight(String(lockedHeight(w, sourceWidth, sourceHeight)));
            setLocked(!locked);
          }}
        >
          {locked ? <Lock /> : <Unlock />}
        </Button>
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="resize-height">Altura (px)</Label>
          <Input
            id="resize-height"
            type="number"
            min={RESIZE_MIN}
            step={2}
            value={height}
            disabled={session.busy}
            onChange={(event) => {
              setHeight(event.target.value);
              const value = Number(event.target.value);
              if (locked && value > 0) setWidth(String(lockedWidth(value, sourceWidth, sourceHeight)));
            }}
          />
        </div>
      </div>
      {!numeric && (
        <p role="alert" className="text-sm text-destructive">
          Indica a largura e a altura em píxeis inteiros.
        </p>
      )}
      {warnings?.distorted && (
        <p role="status" className="text-sm text-amber-600">
          A proporção difere da original: a imagem ficará distorcida.
        </p>
      )}
      {warnings?.enlarged && (
        <p role="status" className="text-sm text-amber-600">
          As dimensões são superiores às do original: o vídeo será ampliado.
        </p>
      )}
      <VideoVisualValidation validation={validation} />
      <Button
        disabled={!step || !validation.valid || session.busy}
        onClick={() => {
          if (step) void session.submit(step);
        }}
      >
        Redimensionar · 1 crédito
      </Button>
    </div>
  );
}
