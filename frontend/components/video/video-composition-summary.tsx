"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "@/providers/session-provider";
import { formatDuration } from "@/lib/videos";
import { quotaWarning } from "@/lib/video-chain";
import { VideoTaskProgress } from "./video-task-progress";
import { VideoTaskPhase } from "./video-task-phase";
import type { Composition } from "./use-composition";

// Cost, estimates, warnings, execution and progress of a composition
// (CHAIN-009, CONCAT-004, CONCAT-012, DQ-025, D-82).
export function VideoCompositionSummary({
  composition,
  cost,
  ready,
  showResolution,
  hint,
}: {
  composition: Composition;
  cost: number;
  ready: boolean;
  showResolution: boolean;
  hint?: string | null;
}) {
  const session = useSession();
  const output = composition.result?.output as
    Record<string, number> | null | undefined;
  const warning = quotaWarning(
    session.user.type,
    session.user.remaining_operations,
    cost,
  );
  const credits = `${cost} ${cost === 1 ? "crédito" : "créditos"}`;
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div aria-live="polite" className="flex flex-col gap-1">
        <p>
          Custo:{" "}
          {session.user.type === "premium"
            ? `${credits} (sem débito no Premium)`
            : credits}
        </p>
        {output?.durationMs !== undefined && (
          <p>Duração estimada: {formatDuration(output.durationMs)}</p>
        )}
        {showResolution && output?.width !== undefined && (
          <p>
            Resultado: {output.width}×{output.height} a{" "}
            {Math.round((output.fpsNum / output.fpsDen) * 100) / 100} fps
          </p>
        )}
        {composition.pending && <p>A validar…</p>}
      </div>
      {hint && <p className="text-muted-foreground">{hint}</p>}
      {warning && <p className="text-amber-600">{warning}</p>}
      {composition.requestError && (
        <p role="alert" className="text-destructive">
          {composition.requestError}
        </p>
      )}
      {composition.submitError && (
        <p role="alert" className="text-destructive">
          {composition.submitError}
        </p>
      )}
      <Button
        type="button"
        disabled={!ready || !composition.valid || composition.busy}
        onClick={() => void composition.submit()}
      >
        Executar · {credits}
      </Button>
      {composition.tracking.task && (
        <div className="flex flex-col gap-1">
          <VideoTaskProgress
            task={composition.tracking.task}
            canCancel
            onCancel={composition.tracking.cancel}
          />
          <VideoTaskPhase task={composition.tracking.task} />
          {composition.tracking.task.status === "completed" && (
            <p>O novo vídeo está na galeria do projeto.</p>
          )}
        </div>
      )}
    </div>
  );
}
