"use client";

import type { VideoEditSession } from "./use-video-edit";
import { VideoTaskProgress } from "./video-task-progress";

export function VideoEditStatus({ session }: { session: VideoEditSession }) {
  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      {session.error && (
        <p className="text-sm text-destructive" role="alert">
          {session.error}
        </p>
      )}
      {session.task && (
        <VideoTaskProgress
          task={session.task}
          canCancel
          onCancel={session.cancel}
        />
      )}
      {session.task?.status === "completed" && (
        <p className="text-sm">O novo vídeo está na galeria do projeto.</p>
      )}
    </div>
  );
}
