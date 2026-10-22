"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCanEditProject } from "@/providers/project-provider";
import { useSession } from "@/providers/session-provider";
import {
  type ProjectVideo,
  type VideoTarget,
  videoErrorCode,
  videoErrorMessage,
} from "@/lib/videos";
import { useVideoInfo } from "./video-info-panel";
import { useVideoEditSession } from "./use-video-edit";
import { VideoEditStatus } from "./video-edit-status";
import { VideoTrimPanel } from "./video-trim-panel";
import { VideoSpeedPanel } from "./video-speed-panel";
import { VideoRemoveAudioPanel } from "./video-remove-audio-panel";

type Operation = "trim" | "remove_audio" | "speed";
const TITLES: Record<Operation, string> = {
  trim: "Recortar vídeo",
  remove_audio: "Remover áudio",
  speed: "Alterar velocidade",
};

function EditableVideoActions({
  target,
  video,
}: {
  target: VideoTarget;
  video: ProjectVideo;
}) {
  const info = useVideoInfo(target, video.id);
  const session = useVideoEditSession(target, video.id);
  const [operation, setOperation] = useState<Operation | null>(null);
  const durationMs = info.data?.meta?.durationMs;
  const open = operation !== null;
  const select = (next: Operation) => {
    session.clearError();
    setOperation(next);
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => select("trim")}>
          Recortar
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={info.data?.meta?.audioCodec === null}
          title={
            info.data?.meta?.audioCodec === null
              ? "Este vídeo não tem áudio"
              : undefined
          }
          onClick={() => select("remove_audio")}
        >
          Remover áudio
        </Button>
        <Button size="sm" variant="outline" onClick={() => select("speed")}>
          Velocidade
        </Button>
      </div>
      {info.data?.meta?.audioCodec === null && (
        <p className="text-xs text-muted-foreground">
          Este vídeo não tem áudio.
        </p>
      )}
      {!open && <VideoEditStatus session={session} />}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) setOperation(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{operation && TITLES[operation]}</DialogTitle>
            <DialogDescription>
              Cria um vídeo novo. O original mantém-se.
            </DialogDescription>
          </DialogHeader>
          {info.isLoading && <p>A carregar informações…</p>}
          {info.isError && (
            <p role="alert" className="text-destructive">
              {videoErrorMessage(videoErrorCode(info.error))}
            </p>
          )}
          {operation === "trim" && durationMs !== undefined && (
            <VideoTrimPanel
              key={video.id}
              target={target}
              videoId={video.id}
              durationMs={durationMs}
              session={session}
            />
          )}
          {operation === "speed" && durationMs !== undefined && (
            <VideoSpeedPanel
              target={target}
              videoId={video.id}
              durationMs={durationMs}
              session={session}
            />
          )}
          {operation === "remove_audio" && (
            <VideoRemoveAudioPanel
              target={target}
              videoId={video.id}
              session={session}
            />
          )}
          <VideoEditStatus session={session} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function VideoEditActions(props: {
  target: VideoTarget;
  video: ProjectVideo;
}) {
  const canEdit = useCanEditProject();
  const session = useSession();
  if (!canEdit || session.user.type === "anonymous") return null;
  return <EditableVideoActions key={props.video.id} {...props} />;
}
