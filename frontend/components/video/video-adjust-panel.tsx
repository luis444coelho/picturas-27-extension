"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { VideoTarget } from "@/lib/videos";
import {
  ADJUST_STEP,
  adjustStep,
  type AdjustValues,
  NEUTRAL_ADJUST,
} from "@/lib/video-visual";
import {
  fetchVideoPreview,
} from "@/lib/video-visual-api";
import { useVideoEditValidation, type VideoEditSession } from "./use-video-edit";
import { useVideoPreview } from "./use-video-preview";
import { VideoPreviewImage } from "./video-preview-image";
import { VideoVisualValidation } from "./video-visual-validation";
import { initialParam, simpleSource, useReportStep, type OperationConfigProps } from "./operation-config";

const CONTROLS: { field: keyof AdjustValues; label: string }[] = [
  { field: "brightness", label: "Brilho" },
  { field: "contrastFactor", label: "Contraste" },
  { field: "saturationFactor", label: "Saturação" },
];

// UC-VID-008: three sliders in [0, 2] with step 0.05, neutral 1.0 (ADJUST-004)
// and "Repor" (ADJUST-010); the toolbar image tools are not used.
// Configuration of the adjustment (D-87, ADR-020), also used by the compositions.
export function AdjustConfig({
  target,
  source,
  initial,
  disabled,
  chainValidation,
  onStepChange,
  renderActions,
}: OperationConfigProps) {
  const videoId = source.videoId;
  const [values, setValues] = useState<AdjustValues>({
    brightness: initialParam(initial, "brightness", NEUTRAL_ADJUST.brightness),
    contrastFactor: initialParam(initial, "contrastFactor", NEUTRAL_ADJUST.contrastFactor),
    saturationFactor: initialParam(initial, "saturationFactor", NEUTRAL_ADJUST.saturationFactor),
  });
  const step = adjustStep(values);
  const preview = useVideoPreview(target, videoId, step, (t, v, s) => fetchVideoPreview(t, v, [...source.previewSteps, s]));
  const ownValidation = useVideoEditValidation(target, videoId, chainValidation ? null : step);
  const validation = chainValidation ?? ownValidation;
  useReportStep(step, onStepChange);
  const neutral = CONTROLS.every(({ field }) => values[field] === 1);
  return (
    <div className="flex flex-col gap-3">
      <VideoPreviewImage preview={preview} alt="Primeiro fotograma com o ajuste" />
      {CONTROLS.map(({ field, label }) => (
        <div key={field} className="flex flex-col gap-1">
          <div className="flex justify-between">
            <Label htmlFor={`adjust-${field}`}>{label}</Label>
            <span className="text-sm tabular-nums">{values[field].toFixed(2)}</span>
          </div>
          <Slider
            id={`adjust-${field}`}
            min={0}
            max={2}
            step={ADJUST_STEP}
            value={[values[field]]}
            disabled={disabled}
            onValueChange={([value]) =>
              setValues((current) => ({
                ...current,
                [field]: Math.round(value / ADJUST_STEP) * ADJUST_STEP,
              }))
            }
          />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        disabled={disabled || neutral}
        onClick={() => setValues(NEUTRAL_ADJUST)}
      >
        Repor
      </Button>
      <VideoVisualValidation validation={validation} />
      {renderActions({ step, validation, busy: disabled, beforeSubmit: () => undefined })}
    </div>
  );
}

export function VideoAdjustPanel({
  target,
  videoId,
  session,
}: {
  target: VideoTarget;
  videoId: string;
  session: VideoEditSession;
}) {
  return (
    <AdjustConfig
      target={target}
      source={simpleSource(videoId, {})}
      disabled={session.busy}
      renderActions={({ step, validation }) => (
        <Button
          disabled={!validation.valid || session.busy}
          onClick={() => {
            if (step) void session.submit(step);
          }}
        >
          Aplicar ajuste · 1 crédito
        </Button>
      )}
    />
  );
}
