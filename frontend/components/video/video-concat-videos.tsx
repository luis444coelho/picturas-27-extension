"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchProjectVideos,
  formatDuration,
  type VideoTarget,
} from "@/lib/videos";
import { concatStep, MIN_CLIPS } from "@/lib/video-chain";
import { useComposition } from "./use-composition";
import { VideoCompositionSummary } from "./video-composition-summary";
import { SortableList } from "./video-chain-step-list";
import { VideoClipPicker } from "./video-clip-picker";
import { newKey } from "./video-operation-chain";

// "Juntar vídeos" (UC-VID-013): two or more videos of the project, repeated if
// wanted, in the user's order, with no operations and no fixed number of
// videos (D-86); resolution, fps and audio normalized like the concat (ADD
// 4.8); one credit in total (DQ-014); one final video, the originals intact.
export function VideoConcatVideos({ target }: { target: VideoTarget }) {
  const videos = useQuery({
    queryKey: ["projectVideos", target.pid, target.ownerId, target.shareId],
    queryFn: () => fetchProjectVideos(target),
  });
  const byId = new Map((videos.data ?? []).map((v) => [v.id, v]));
  const [clips, setClips] = useState<{ key: string; videoId: string }[]>([]);
  const ready = clips.length >= MIN_CLIPS;
  const steps = [
    concatStep(clips.map((clip) => ({ videoId: clip.videoId, steps: [] }))),
  ];
  const composition = useComposition(target, null, steps, ready);
  const total = clips.reduce(
    (sum, clip) => sum + (byId.get(clip.videoId)?.durationMs ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-4 text-sm">
      <section className="flex flex-col gap-2">
        <h3 className="font-medium">Linha temporal ({clips.length} vídeos)</h3>
        {clips.length === 0 && (
          <p className="text-muted-foreground">
            Escolhe os vídeos pela ordem em que os queres juntar.
          </p>
        )}
        <SortableList
          items={clips}
          disabled={composition.busy}
          onChange={setClips}
          render={(clip, clipIndex) => {
            const source = byId.get(clip.videoId);
            return (
              <div className="flex flex-col gap-1">
                <span className="truncate">
                  {clipIndex + 1}. {source?.originalName ?? clip.videoId}
                  {source ? ` · ${formatDuration(source.durationMs)}` : ""}
                </span>
                {composition.errorsAt({ clipIndex }).map((message, i) => (
                  <p key={i} role="alert" className="text-destructive">
                    {message}
                  </p>
                ))}
              </div>
            );
          }}
        />
        {clips.length > 0 && <p>Duração total: {formatDuration(total)}</p>}
        <VideoClipPicker
          videos={videos.data ?? []}
          loading={videos.isLoading}
          disabled={composition.busy}
          onPick={(picked) =>
            setClips((current) => [
              ...current,
              { key: newKey(), videoId: picked.id },
            ])
          }
        />
      </section>
      <VideoCompositionSummary
        composition={composition}
        cost={1}
        ready={ready}
        showResolution
        hint={ready ? null : "Escolhe pelo menos dois vídeos para juntar."}
      />
    </div>
  );
}
