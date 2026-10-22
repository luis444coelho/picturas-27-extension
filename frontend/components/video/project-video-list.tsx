"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Film } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "@/providers/session-provider";
import { ProjectVideo, fetchProjectVideos, formatDuration } from "@/lib/videos";
import { useVideoTarget } from "./use-video-target";
import { useVideoIngestEvents } from "./use-video-ingest-events";
import { VideoPlayer } from "./video-player";

const ignoreUpdate = () => undefined;

// Completed videos in the main area of the project, next to the images
// (UC-VID-000 steps 7 and 8, D-31). The "Vídeos" window stays the upload
// point. The list only shows when the project has completed videos (D-32).
export function ProjectVideoList() {
  const session = useSession();
  const target = useVideoTarget();
  const [selected, setSelected] = useState<ProjectVideo | null>(null);
  const isAnonymous = session.user.type === "anonymous";

  const videos = useQuery({
    // Same key as the gallery of the "Vídeos" window.
    queryKey: ["projectVideos", target.pid, target.ownerId, target.shareId],
    queryFn: () => fetchProjectVideos(target),
    // Anonymous users have no access to video (RN1).
    enabled: !isAnonymous,
    // Thumbnail URLs are valid for 15 min (NFR-017): refresh before they expire.
    refetchInterval: 10 * 60 * 1000,
  });

  // A completed ingestion refreshes the list (video-ingest-update, D-14).
  useVideoIngestEvents(target.pid, ignoreUpdate);

  if (isAnonymous || !videos.data || videos.data.length === 0) return null;

  return (
    <Dialog
      open={selected !== null}
      onOpenChange={(open) => !open && setSelected(null)}
    >
      <aside
        aria-label="Vídeos do projeto"
        className="w-40 md:w-48 xl:w-56 shrink-0 border-l border-sidebar-border overflow-y-auto overflow-x-hidden flex flex-col gap-2 p-2"
      >
        <h2 className="pt-2 text-sm text-gray-500 text-center">Vídeos</h2>
        <ul className="flex flex-col gap-2">
          {videos.data.map((video) => (
            <li key={video.id}>
              <button
                type="button"
                onClick={() => setSelected(video)}
                title={video.originalName}
                className="w-full text-left rounded-md border overflow-hidden hover:border-primary"
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={video.thumbnailUrl}
                    alt=""
                    className="w-full aspect-video object-cover bg-muted"
                  />
                  <span className="absolute top-1 left-1 rounded bg-black/70 p-1 text-white">
                    <Film className="size-3" aria-label="Vídeo" />
                  </span>
                  <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-xs text-white">
                    {formatDuration(video.durationMs)}
                  </span>
                </div>
                <p className="p-2 text-xs truncate">{video.originalName}</p>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vídeo</DialogTitle>
          <DialogDescription>Leitor integrado do projeto.</DialogDescription>
        </DialogHeader>
        {selected && <VideoPlayer target={target} video={selected} />}
      </DialogContent>
    </Dialog>
  );
}
