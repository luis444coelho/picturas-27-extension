"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { VideoTarget } from "@/lib/videos";
import {
  isOrientIdentity,
  orientedSize,
  orientStep,
  type OrientValues,
  type Rotation,
} from "@/lib/video-visual";
import {
  fetchVideoPreview,
} from "@/lib/video-visual-api";
import { useVideoEditValidation, type VideoEditSession } from "./use-video-edit";
import { useVideoPreview } from "./use-video-preview";
import { VideoPreviewImage } from "./video-preview-image";
import { VideoVisualValidation } from "./video-visual-validation";

const ROTATIONS: Rotation[] = [90, 180, 270];

// UC-VID-011: clockwise rotation buttons and mirror switches, rotation before
// the mirrors (ORIENT-004), with the final dimensions (ORIENT-005).
export function VideoOrientPanel({
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
  const [values, setValues] = useState<OrientValues>({ rotation: 0, flipH: false, flipV: false });
  const step = orientStep(values);
  const preview = useVideoPreview(target, videoId, step, (t, v, s) => fetchVideoPreview(t, v, [s]), 0);
  const validation = useVideoEditValidation(target, videoId, step);
  const size = orientedSize(values, sourceWidth, sourceHeight);
  return (
    <div className="flex flex-col gap-3">
      <VideoPreviewImage preview={preview} alt="Primeiro fotograma orientado" width={size.width} height={size.height} />
      <div className="flex flex-wrap gap-2">
        {ROTATIONS.map((rotation) => (
          <Button
            key={rotation}
            size="sm"
            variant={values.rotation === rotation ? "default" : "outline"}
            aria-pressed={values.rotation === rotation}
            disabled={session.busy}
            onClick={() =>
              setValues((current) => ({
                ...current,
                rotation: current.rotation === rotation ? 0 : rotation,
              }))
            }
          >
            {rotation}°
          </Button>
        ))}
      </div>
      {(["flipH", "flipV"] as const).map((field) => (
        <div key={field} className="flex items-center gap-2">
          <Checkbox
            id={`orient-${field}`}
            checked={values[field]}
            disabled={session.busy}
            onCheckedChange={(checked) =>
              setValues((current) => ({ ...current, [field]: checked === true }))
            }
          />
          <Label htmlFor={`orient-${field}`}>
            {field === "flipH" ? "Espelho horizontal" : "Espelho vertical"}
          </Label>
        </div>
      ))}
      {isOrientIdentity(values) && (
        <p className="text-sm text-muted-foreground">
          Escolhe uma rotação ou um espelho que altere o vídeo.
        </p>
      )}
      <VideoVisualValidation validation={validation} />
      <Button
        disabled={!validation.valid || session.busy}
        onClick={() => void session.submit(step)}
      >
        Aplicar orientação · 1 crédito
      </Button>
    </div>
  );
}
