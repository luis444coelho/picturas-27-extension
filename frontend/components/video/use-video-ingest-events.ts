"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/providers/session-provider";
import { useGetSocket } from "@/lib/queries/projects";

export interface VideoIngestUpdate {
  projectId: string;
  videoId: string;
  status: "processing" | "completed" | "failed";
  error?: { code: string };
}

// Listens to video-ingest-update (D-14). The socket is the one the project page
// already opened (same query key), which joined the user and project rooms.
export function useVideoIngestEvents(
  projectId: string,
  onUpdate: (update: VideoIngestUpdate) => void,
) {
  const session = useSession();
  const socket = useGetSocket(session.token);
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket.data) return;

    const handler = (update: VideoIngestUpdate) => {
      if (update.projectId !== projectId) return;
      if (update.status === "completed")
        qc.invalidateQueries({ queryKey: ["projectVideos", projectId] });
      onUpdate(update);
    };

    socket.data.on("video-ingest-update", handler);
    return () => {
      socket.data?.off("video-ingest-update", handler);
    };
  }, [socket.data, projectId, qc, onUpdate]);
}
