"use client";

import { Button } from "@/components/ui/button";
import { formatDuration, type ProjectVideo } from "@/lib/videos";

// Videos of the project that can be added as clips (UC-VID-013 steps 1 and 2):
// thumbnail, name and duration; the same video can be added again (FA2).
export function VideoClipPicker({
  videos,
  loading,
  disabled,
  onPick,
}: {
  videos: ProjectVideo[];
  loading: boolean;
  disabled: boolean;
  onPick: (video: ProjectVideo) => void;
}) {
  if (loading) return <p>A carregar os vídeos do projeto…</p>;
  if (!videos.length) return <p>O projeto ainda não tem vídeos concluídos.</p>;
  return (
    <div className="flex flex-col gap-1">
      <p className="font-medium">Acrescentar clip</p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {videos.map((video) => (
          <li key={video.id}>
            <Button
              type="button"
              variant="outline"
              className="flex h-auto w-full flex-col items-start gap-1 p-2"
              disabled={disabled}
              onClick={() => onPick(video)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={video.thumbnailUrl}
                alt=""
                className="aspect-video w-full rounded object-cover"
              />
              <span className="w-full truncate text-left text-xs">
                {video.originalName}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDuration(video.durationMs)}
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
