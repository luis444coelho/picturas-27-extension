"use client";

import { Lock, Unlock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VideoTarget } from "@/lib/videos";
import {
  lockedHeight,
  lockedWidth,
  presetSize,
  RESIZE_MIN,
  RESIZE_PRESETS,
  resizeStep,
  resizeWarnings,
} from "@/lib/video-visual";
import {
  fetchVideoPreview,
} from "@/lib/video-visual-api";
import { useVideoEditValidation, type VideoEditSession } from "./use-video-edit";
import { useVideoPreview } from "./use-video-preview";
import { VideoPreviewImage } from "./video-preview-image";
import { VideoPreviewFrameSlider } from "./video-preview-frame-slider";
import { useVideoFrameSelection } from "./use-video-frame-selection";
import { VideoVisualValidation } from "./video-visual-validation";
import { initialParam, simpleSource, useReportStep, type OperationConfigProps } from "./operation-config";

// UC-VID-010: presentation dimensions (RESIZE-001), proportion lock with even
// rounding (RESIZE-002), presets (RESIZE-003, D-64) and the distortion and
// enlargement warnings (RESIZE-004/005). resize-tool.tsx is not used.
// Configuration of the resize (D-87, ADR-020), also used by the compositions.
export function ResizeConfig({
  target,
  source,
  initial,
  disabled,
  chainValidation,
  onStepChange,
  renderActions,
}: OperationConfigProps) {
  const videoId = source.videoId;
  const sourceWidth = source.inputProps.displayWidth ?? 0;
  const sourceHeight = source.inputProps.displayHeight ?? 0;
  const [locked, setLocked] = useState(true);
  const [width, setWidth] = useState(String(initialParam(initial, "width", sourceWidth)));
  const [height, setHeight] = useState(String(initialParam(initial, "height", sourceHeight)));
  const w = Number(width);
  const h = Number(height);
  const numeric = Number.isInteger(w) && Number.isInteger(h) && w > 0 && h > 0;
  const step = numeric ? resizeStep(w, h) : null;
  const frame = useVideoFrameSelection(target, source);
  const preview = useVideoPreview(target, videoId, step, (t, v, s, jpeg) => fetchVideoPreview(t, v, [...source.previewSteps, s], jpeg), 200, frame);
  const ownValidation = useVideoEditValidation(target, videoId, chainValidation ? null : step);
  const validation = chainValidation ?? ownValidation;
  useReportStep(step, onStepChange);
  const warnings = numeric ? resizeWarnings(w, h, sourceWidth, sourceHeight) : null;
  const setBoth = (next: { width: number; height: number }) => {
    setWidth(String(next.width));
    setHeight(String(next.height));
  };
  return (
    <div className="flex flex-col gap-3">
      <VideoPreviewImage preview={preview} alt="Pré-visualização redimensionada" width={numeric ? w : null} height={numeric ? h : null} />
      <VideoPreviewFrameSlider selection={frame} disabled={disabled} />
      <p className="text-xs text-muted-foreground">
        Dimensões atuais: {sourceWidth}×{sourceHeight}
      </p>
      <div className="flex flex-wrap gap-2">
        {RESIZE_PRESETS.map((preset) => (
          <Button
            key={preset}
            size="sm"
            variant="outline"
            disabled={disabled}
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
            disabled={disabled}
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
          disabled={disabled}
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
            disabled={disabled}
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
      {renderActions({ step, validation, busy: disabled, beforeSubmit: () => undefined })}
    </div>
  );
}

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
  return (
    <ResizeConfig
      target={target}
      source={simpleSource(videoId, { displayWidth: sourceWidth, displayHeight: sourceHeight })}
      disabled={session.busy}
      renderActions={({ step, validation }) => (
        <Button
          disabled={!step || !validation.valid || session.busy}
          onClick={() => {
            if (step) void session.submit(step);
          }}
        >
          Redimensionar · 1 crédito
        </Button>
      )}
    />
  );
}
