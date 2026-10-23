"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { formatTimecode } from "@/lib/video-edit";
import type { VideoFrameSelection } from "./use-video-frame-selection";

export function VideoPreviewFrameSlider({
  selection,
  disabled,
}: {
  selection: VideoFrameSelection;
  disabled: boolean;
}) {
  if (!selection.enabled) return null;
  const max = Math.max(0, Math.floor((selection.durationMs - 100) / 100) * 100);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between gap-2 text-sm">
        <Label htmlFor="video-preview-moment">Momento da pré-visualização</Label>
        <span className="tabular-nums">{formatTimecode(selection.atMs)}</span>
      </div>
      <Slider
        id="video-preview-moment"
        min={0}
        max={max}
        step={100}
        value={[selection.atMs]}
        disabled={disabled || max === 0}
        onValueChange={([value]) => selection.setAtMs(value)}
        aria-label="Momento da pré-visualização"
      />
      {selection.error && <p role="alert" className="text-sm text-destructive">{selection.error}</p>}
    </div>
  );
}
