"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VideoTarget } from "@/lib/videos";
import {
  formatTimecode,
  predictedSpeedMs,
  SPEED_PRESETS,
  speedStep,
} from "@/lib/video-edit";
import {
  useVideoEditValidation,
  type VideoEditSession,
} from "./use-video-edit";
import { VideoEditValidation } from "./video-edit-validation";
import {
  initialParam,
  simpleSource,
  useReportStep,
  type OperationConfigProps,
} from "./operation-config";

// Configuration of the speed (D-87, ADR-020).
export function SpeedConfig({
  target,
  source,
  initial,
  disabled,
  chainValidation,
  onStepChange,
  renderActions,
}: OperationConfigProps) {
  const durationMs = source.inputProps.durationMs ?? 0;
  const [value, setValue] = useState(
    String(initialParam(initial, "factor", 2)),
  );
  const factor = value.trim() ? Number(value) : NaN;
  const step = Number.isFinite(factor) ? speedStep(factor) : null;
  const ownValidation = useVideoEditValidation(
    target,
    source.videoId,
    chainValidation ? null : step,
  );
  const validation = chainValidation ?? ownValidation;
  useReportStep(step, onStepChange);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {SPEED_PRESETS.map((preset) => (
          <Button
            key={preset}
            size="sm"
            variant={factor === preset ? "default" : "outline"}
            disabled={disabled}
            onClick={() => setValue(String(preset))}
          >
            {preset}×
          </Button>
        ))}
      </div>
      <Label htmlFor="speed-factor">Fator de velocidade (0.25× a 4×)</Label>
      <Input
        id="speed-factor"
        type="number"
        step="any"
        min="0.25"
        max="4"
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
      />
      {!step && (
        <p role="alert" className="text-sm text-destructive">
          Indica um fator numérico.
        </p>
      )}
      {Number.isFinite(factor) && factor > 0 && (
        <p className="text-sm">
          Duração prevista:{" "}
          {formatTimecode(predictedSpeedMs(durationMs, factor))}
        </p>
      )}
      <VideoEditValidation validation={validation} />
      {renderActions({
        step,
        validation,
        busy: disabled,
        beforeSubmit: () => undefined,
      })}
    </div>
  );
}

export function VideoSpeedPanel({
  target,
  videoId,
  durationMs,
  session,
}: {
  target: VideoTarget;
  videoId: string;
  durationMs: number;
  session: VideoEditSession;
}) {
  return (
    <SpeedConfig
      target={target}
      source={simpleSource(videoId, { durationMs })}
      disabled={session.busy}
      renderActions={({ step, validation }) => (
        <Button
          disabled={!step || !validation.valid || session.busy}
          onClick={() => {
            if (step) void session.submit(step);
          }}
        >
          Alterar velocidade · 1 crédito
        </Button>
      )}
    />
  );
}
