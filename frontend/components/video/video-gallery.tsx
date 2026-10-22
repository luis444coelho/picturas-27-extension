"use client";

import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import {
  ProjectVideo,
  VideoTarget,
  fetchProjectVideos,
  formatDuration,
} from "@/lib/videos";

// Gallery of the project videos (UC-VID-000 step 7, D-17): only completed
// videos, with thumbnail, file name and duration.
export function VideoGallery({
  target,
  selectedId,
  onSelect,
}: {
  target: VideoTarget;
  selectedId: string | null;
  onSelect: (video: ProjectVideo) => void;
}) {
  const videos = useQuery({
    queryKey: ["projectVideos", target.pid, target.ownerId, target.shareId],
    queryFn: () => fetchProjectVideos(target),
    // Thumbnail URLs are valid for 15 min (NFR-017): refresh before they expire.
    refetchInterval: 10 * 60 * 1000,
  });

  if (videos.isLoading) {
    return (
      <div className="flex justify-center p-4">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }

  if (videos.isError) {
    return (
      <p className="text-sm text-destructive">
        Não foi possível carregar os vídeos do projeto.
      </p>
    );
  }

  if (!videos.data || videos.data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Este projeto ainda não tem vídeos.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {videos.data.map((video) => (
        <li key={video.id}>
          <button
            type="button"
            onClick={() => onSelect(video)}
            className={`w-full text-left rounded-md border overflow-hidden hover:border-primary ${
              selectedId === video.id
                ? "border-primary ring-2 ring-primary"
                : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={video.thumbnailUrl}
              alt=""
              className="w-full aspect-video object-cover bg-muted"
            />
            <div className="p-2 text-xs flex justify-between gap-2">
              <span className="truncate">{video.originalName}</span>
              <span className="text-muted-foreground shrink-0">
                {formatDuration(video.durationMs)}
              </span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
