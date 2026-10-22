"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { videoErrorCode, type VideoApiError } from "@/lib/videos";
import { videoTaskErrorMessage } from "@/lib/video-tasks";
import {
  isFinalStatus,
  stepLabel,
  TASK_STATUS_LABELS,
  type VideoTaskState,
} from "@/lib/video-task-state";
import axios from "axios";

interface VideoTaskProgressProps {
  task: VideoTaskState;
  // Only whoever submitted the task can cancel it (TASK-004).
  canCancel: boolean;
  onCancel: () => Promise<void>;
}

// Progress, "Passo k de N" and Cancel of a video task (ADD T-03, D-40, D-47).
// Built by B003 and mounted by the operation panels of B004.
export function VideoTaskProgress({
  task,
  canCancel,
  onCancel,
}: VideoTaskProgressProps) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<{
    message: string;
    correlationId: string | null;
  } | null>(null);
  const active = !isFinalStatus(task.status);

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      await onCancel();
    } catch (error) {
      const data = axios.isAxiosError(error)
        ? (error.response?.data as VideoApiError | undefined)
        : undefined;
      setCancelError({
        message: videoTaskErrorMessage(videoErrorCode(error)),
        correlationId: data?.correlationId ?? null,
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <div className="flex items-center justify-between text-sm">
        <span>{TASK_STATUS_LABELS[task.status]}</span>
        {active && (
          <span className="text-muted-foreground">
            {stepLabel(task.step, task.totalSteps)} · {task.progress}%
          </span>
        )}
      </div>
      <Progress value={task.progress} />

      {task.status === "failed" && task.error && (
        <p className="text-sm text-destructive">
          {videoTaskErrorMessage(task.error.code)}
        </p>
      )}
      {cancelError && (
        <p className="text-sm text-destructive">
          {cancelError.message}
          {cancelError.correlationId && (
            <span className="block text-xs text-muted-foreground">
              Código de suporte: {cancelError.correlationId}
            </span>
          )}
        </p>
      )}

      {active && canCancel && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={cancelling}
        >
          Cancelar
        </Button>
      )}
    </div>
  );
}
