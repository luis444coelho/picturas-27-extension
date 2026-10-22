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
  fetchVideoPreview,
  NEUTRAL_ADJUST,
} from "@/lib/video-visual";
import { useVideoEditValidation, type VideoEditSession } from "./use-video-edit";
import { useVideoPreview } from "./use-video-preview";
import { VideoPreviewImage } from "./video-preview-image";
import { VideoVisualValidation } from "./video-visual-validation";

const CONTROLS: { field: keyof AdjustValues; label: string }[] = [
  { field: "brightness", label: "Brilho" },
  { field: "contrastFactor", label: "Contraste" },
  { field: "saturationFactor", label: "Saturação" },
];

// UC-VID-008: three sliders in [0, 2] with step 0.05, neutral 1.0 (ADJUST-004)
// and "Repor" (ADJUST-010); the toolbar image tools are not used.
export function VideoAdjustPanel({
  target,
  videoId,
  session,
}: {
  target: VideoTarget;
  videoId: string;
  session: VideoEditSession;
}) {
  const [values, setValues] = useState<AdjustValues>(NEUTRAL_ADJUST);
  const step = adjustStep(values);
  const preview = useVideoPreview(target, videoId, step, (t, v, s) => fetchVideoPreview(t, v, [s]));
  const validation = useVideoEditValidation(target, videoId, step);
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
            disabled={session.busy}
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
        disabled={session.busy || neutral}
        onClick={() => setValues(NEUTRAL_ADJUST)}
      >
        Repor
      </Button>
      <VideoVisualValidation validation={validation} />
      <Button
        disabled={!validation.valid || session.busy}
        onClick={() => void session.submit(step)}
      >
        Aplicar ajuste · 1 crédito
      </Button>
    </div>
  );
}
