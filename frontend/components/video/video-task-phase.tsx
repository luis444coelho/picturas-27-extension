"use client";

import { phaseMessage } from "@/lib/video-chain";
import type { VideoTaskState } from "@/lib/video-task-state";

// Phase of a failed task (D-82, ADR-019), next to the B003 progress, which
// shows only the error code (UC-VID-014 exception 7).
export function VideoTaskPhase({ task }: { task: VideoTaskState }) {
  if (task.status !== "failed") return null;
  const phase = (task.error as { phase?: string } | undefined)?.phase;
  const message = phaseMessage(phase);
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}
