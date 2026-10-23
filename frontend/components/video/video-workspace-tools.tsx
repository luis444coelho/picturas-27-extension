"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Clapperboard,
  Combine,
  Droplet,
  FileVideo,
  Gauge,
  Layers3,
  Palette,
  RotateCw,
  Scaling,
  Scissors,
  SlidersHorizontal,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import { useCanEditProject } from "@/providers/project-provider";
import { useSession } from "@/providers/session-provider";
import { isFinalStatus } from "@/lib/video-task-state";
import { isVideoContainer } from "@/lib/video-convert";
import { operationLabel, type ChainOperation } from "@/lib/video-chain";
import type { ProjectVideo, VideoTarget } from "@/lib/videos";
import { fetchVideoInfo } from "@/lib/video-access";
import { simpleSource } from "./operation-config";
import { useVideoEditSession } from "./use-video-edit";
import { VideoTrimPanel } from "./video-trim-panel";
import { VideoSpeedPanel } from "./video-speed-panel";
import { VideoRemoveAudioPanel } from "./video-remove-audio-panel";
import { VideoAdjustPanel } from "./video-adjust-panel";
import { VideoFilterPanel } from "./video-filter-panel";
import { VideoResizePanel } from "./video-resize-panel";
import { VideoOrientPanel } from "./video-orient-panel";
import { VideoWatermarkPanel } from "./video-watermark-panel";
import { ConvertConfig } from "./video-convert-actions";
import { VideoMultiOperations } from "./video-multi-operations";
import { VideoConcatVideos } from "./video-concat-videos";
import { VideoMovieMaker } from "./video-movie-maker";

type Action = ChainOperation | "multi" | "concat" | "movie";
const groups: { title: string; actions: Action[] }[] = [
  { title: "Tempo e áudio", actions: ["trim", "speed", "remove_audio"] },
  { title: "Imagem", actions: ["adjust", "filter", "resize", "orient"] },
  { title: "Sobreposição", actions: ["watermark"] },
  { title: "Formato", actions: ["convert"] },
  { title: "Composição", actions: ["multi", "concat", "movie"] },
];
const specialLabels: Record<string, string> = {
  multi: "Aplicar várias operações",
  concat: "Juntar vídeos",
  movie: "Movie Maker",
};
const actionIcons: Record<Action, LucideIcon> = {
  trim: Scissors,
  speed: Gauge,
  remove_audio: VolumeX,
  adjust: SlidersHorizontal,
  filter: Palette,
  resize: Scaling,
  orient: RotateCw,
  watermark: Droplet,
  convert: FileVideo,
  multi: Layers3,
  concat: Combine,
  movie: Clapperboard,
};

export function VideoWorkspaceTools({
  target,
  video,
}: {
  target: VideoTarget;
  video: ProjectVideo | null;
}) {
  const [action, setAction] = useState<Action | null>(null);
  const canEdit = useCanEditProject();
  const user = useSession();
  const allowed = canEdit && user.user.type !== "anonymous";
  const info = useQuery({
    queryKey: ["videoInfo", target.pid, target.shareId, video?.id ?? ""],
    queryFn: () => fetchVideoInfo(target, video!.id),
    enabled: Boolean(video),
  });
  const session = useVideoEditSession(target, video?.id ?? "");
  const meta = info.data?.meta;
  const busy = Boolean(session.task && !isFinalStatus(session.task.status));
  const choose = (next: Action) => {
    session.clearError();
    setAction(next);
  };
  const label = (item: Action) => specialLabels[item] ?? operationLabel(item);

  return (
    <section
      aria-label="Ferramentas de vídeo"
      className="flex min-w-0 flex-col gap-3"
    >
      <h2 className="text-lg font-semibold">Ferramentas de vídeo</h2>
      {!allowed && (
        <p className="text-sm text-muted-foreground">
          Não tens permissão para editar vídeos neste projeto.
        </p>
      )}
      {allowed &&
        groups.map((group) => (
          <div key={group.title} className="rounded-md border p-2">
            <h3 className="mb-2 text-sm font-medium">{group.title}</h3>
            <div className="flex flex-wrap gap-1">
              {group.actions.map((item) => {
                const Icon = actionIcons[item];
                const needsVideo = item !== "concat" && item !== "movie";
                const noAudio =
                  item === "remove_audio" && meta?.audioCodec === null;
                const disabled = (needsVideo && !video) || noAudio;
                return (
                  <Button
                    key={item}
                    type="button"
                    size="sm"
                    variant={action === item ? "default" : "outline"}
                    disabled={disabled}
                    title={
                      noAudio
                        ? "Este vídeo não tem áudio"
                        : needsVideo && !video
                          ? "Seleciona um vídeo"
                          : undefined
                    }
                    onClick={() => choose(item)}
                  >
                    <Icon aria-hidden="true" />
                    {label(item)}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      {allowed && action && (
        <div
          role="region"
          aria-label={`Parâmetros: ${label(action)}`}
          className="min-w-0 rounded-md border p-3"
        >
          <h3 className="mb-2 font-semibold">{label(action)}</h3>
          {busy && (
            <p className="mb-2 text-sm text-amber-700" role="status">
              Há uma tarefa de vídeo em curso. Espera que termine ou cancela-a
              no progresso do projeto.
            </p>
          )}
          {video &&
            info.isLoading &&
            action !== "concat" &&
            action !== "movie" && <p>A carregar informações…</p>}
          {video &&
            info.isError &&
            action !== "concat" &&
            action !== "movie" && (
              <p role="alert">
                Não foi possível carregar os dados deste vídeo.
              </p>
            )}
          {video && action === "trim" && meta?.durationMs !== undefined && (
            <VideoTrimPanel
              target={target}
              videoId={video.id}
              durationMs={meta.durationMs}
              session={session}
            />
          )}
          {video && action === "speed" && meta?.durationMs !== undefined && (
            <VideoSpeedPanel
              target={target}
              videoId={video.id}
              durationMs={meta.durationMs}
              session={session}
            />
          )}
          {video && action === "remove_audio" && meta?.audioCodec !== null && (
            <VideoRemoveAudioPanel
              target={target}
              videoId={video.id}
              session={session}
            />
          )}
          {video && action === "adjust" && (
            <VideoAdjustPanel
              target={target}
              videoId={video.id}
              session={session}
            />
          )}
          {video && action === "filter" && (
            <VideoFilterPanel
              target={target}
              videoId={video.id}
              session={session}
            />
          )}
          {video && action === "watermark" && (
            <VideoWatermarkPanel
              target={target}
              videoId={video.id}
              session={session}
            />
          )}
          {video &&
            action === "resize" &&
            meta?.displayWidth &&
            meta?.displayHeight && (
              <VideoResizePanel
                target={target}
                videoId={video.id}
                sourceWidth={meta.displayWidth}
                sourceHeight={meta.displayHeight}
                session={session}
              />
            )}
          {video &&
            action === "orient" &&
            meta?.displayWidth &&
            meta?.displayHeight && (
              <VideoOrientPanel
                target={target}
                videoId={video.id}
                sourceWidth={meta.displayWidth}
                sourceHeight={meta.displayHeight}
                session={session}
              />
            )}
          {video &&
            action === "convert" &&
            meta?.container &&
            isVideoContainer(meta.container) &&
            meta.videoCodec && (
              <ConvertConfig
                target={target}
                source={simpleSource(video.id, {
                  container: meta.container,
                  videoCodec: meta.videoCodec,
                  audioCodec: meta.audioCodec ?? null,
                })}
                disabled={session.busy}
                renderActions={({ step, validation, verdict }) => (
                  <Button
                    disabled={
                      !step || !validation.valid || !verdict || session.busy
                    }
                    onClick={() => {
                      if (step) void session.submit(step);
                    }}
                  >
                    Converter · 1 crédito
                  </Button>
                )}
              />
            )}
          {video && action === "multi" && (
            <VideoMultiOperations
              key={video.id}
              target={target}
              video={video}
            />
          )}
          {action === "concat" && <VideoConcatVideos target={target} />}
          {action === "movie" && <VideoMovieMaker target={target} />}
        </div>
      )}
    </section>
  );
}
