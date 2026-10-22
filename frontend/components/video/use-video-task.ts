"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/providers/session-provider";
import { useGetSocket } from "@/lib/queries/projects";
import type { VideoTarget } from "@/lib/videos";
import { cancelVideoTask, fetchVideoTask } from "@/lib/video-tasks";
import {
  applyTaskUpdate,
  isFinalStatus,
  taskStorageKey,
  type VideoTaskState,
  type VideoTaskUpdate,
} from "@/lib/video-task-state";

function readStoredTask(projectId: string): string | null {
  try {
    return sessionStorage.getItem(taskStorageKey(projectId));
  } catch {
    return null;
  }
}

function storeTask(projectId: string, taskId: string | null) {
  try {
    if (taskId) sessionStorage.setItem(taskStorageKey(projectId), taskId);
    else sessionStorage.removeItem(taskStorageKey(projectId));
  } catch {
    // Storage blocked: the task is still followed while the page is open.
  }
}

// Follows one video task of a project (ADD T-03, D-47): video-task-update on
// the socket the project page already opened, and GET to recover the state
// after a reload. Not mounted by B003; the operation panels of B004 use it.
export function useVideoTask(target: VideoTarget) {
  const projectId = target.pid;
  const session = useSession();
  const socket = useGetSocket(session.token);
  const qc = useQueryClient();
  const [task, setTask] = useState<VideoTaskState | null>(null);

  const apply = useCallback(
    (update: VideoTaskUpdate) => {
      setTask((current) => applyTaskUpdate(current, update));
      if (isFinalStatus(update.status)) {
        storeTask(projectId, null);
        if (update.status === "completed")
          qc.invalidateQueries({ queryKey: ["projectVideos", projectId] });
      }
    },
    [projectId, qc],
  );

  // Start following a task accepted by POST …/operations.
  const follow = useCallback(
    (taskId: string) => {
      storeTask(projectId, taskId);
      setTask(null);
      apply({ taskId, status: "queued" });
    },
    [projectId, apply],
  );

  // Recovery after a reload.
  useEffect(() => {
    const taskId = readStoredTask(projectId);
    if (!taskId) return;
    fetchVideoTask(target, taskId)
      .then(apply)
      .catch(() => storeTask(projectId, null));
    // The target object changes on every render; the project id is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!socket.data) return;
    const handler = (update: VideoTaskUpdate) => {
      if (update.projectId !== projectId) return;
      apply(update);
    };
    socket.data.on("video-task-update", handler);
    return () => {
      socket.data?.off("video-task-update", handler);
    };
  }, [socket.data, projectId, apply]);

  const cancel = useCallback(async () => {
    if (!task) return;
    apply(await cancelVideoTask(target, task.taskId));
  }, [task, target, apply]);

  return { task, follow, cancel };
}
