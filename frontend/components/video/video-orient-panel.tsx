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
import { initialParam, simpleSource, useReportStep, type OperationConfigProps } from "./operation-config";

const ROTATIONS: Rotation[] = [90, 180, 270];

// UC-VID-011: clockwise rotation buttons and mirror switches, rotation before
// the mirrors (ORIENT-004), with the final dimensions (ORIENT-005).
// Configuration of the rotation and mirrors (D-87, ADR-020), also used by the compositions.
export function OrientConfig({
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
  const [values, setValues] = useState<OrientValues>({
    rotation: initialParam<Rotation>(initial, "rotation", 0),
    flipH: initialParam(initial, "flipH", false),
    flipV: initialParam(initial, "flipV", false),
  });
  const step = orientStep(values);
  const preview = useVideoPreview(target, videoId, step, (t, v, s) => fetchVideoPreview(t, v, [...source.previewSteps, s]), 0);
  const ownValidation = useVideoEditValidation(target, videoId, chainValidation ? null : step);
  const validation = chainValidation ?? ownValidation;
  useReportStep(step, onStepChange);
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
            disabled={disabled}
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
            disabled={disabled}
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
      {renderActions({ step, validation, busy: disabled, beforeSubmit: () => undefined })}
    </div>
  );
}

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
  return (
    <OrientConfig
      target={target}
      source={simpleSource(videoId, { displayWidth: sourceWidth, displayHeight: sourceHeight })}
      disabled={session.busy}
      renderActions={({ step, validation }) => (
        <Button
          disabled={!validation.valid || session.busy}
          onClick={() => {
            if (step) void session.submit(step);
          }}
        >
          Aplicar orientação · 1 crédito
        </Button>
      )}
    />
  );
}
