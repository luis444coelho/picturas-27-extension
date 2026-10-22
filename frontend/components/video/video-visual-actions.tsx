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
import { VideoWatermarkPanel } from "./video-watermark-panel";
import { VideoAdjustPanel } from "./video-adjust-panel";
import { VideoFilterPanel } from "./video-filter-panel";
import { VideoResizePanel } from "./video-resize-panel";
import { VideoOrientPanel } from "./video-orient-panel";

// B005 operations, next to the B004 ones (video-edit-actions.tsx, unchanged).
type Operation = "watermark" | "adjust" | "filter" | "resize" | "orient";
const OPERATIONS: { id: Operation; button: string; title: string }[] = [
  { id: "watermark", button: "Marca de água", title: "Aplicar marca de água" },
  { id: "adjust", button: "Ajustar", title: "Ajustar brilho, contraste e saturação" },
  { id: "filter", button: "Filtros", title: "Aplicar filtro" },
  { id: "resize", button: "Redimensionar", title: "Redimensionar vídeo" },
  { id: "orient", button: "Rodar / espelhar", title: "Rodar ou espelhar vídeo" },
];

function EditableVisualActions({
  target,
  video,
}: {
  target: VideoTarget;
  video: ProjectVideo;
}) {
  const info = useVideoInfo(target, video.id);
  const session = useVideoEditSession(target, video.id);
  const [operation, setOperation] = useState<Operation | null>(null);
  const meta = info.data?.meta;
  const width = meta?.displayWidth;
  const height = meta?.displayHeight;
  const select = (next: Operation) => {
    session.clearError();
    setOperation(next);
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {OPERATIONS.map(({ id, button }) => (
          <Button key={id} size="sm" variant="outline" onClick={() => select(id)}>
            {button}
          </Button>
        ))}
      </div>
      {operation === null && <VideoEditStatus session={session} />}
      <Dialog
        open={operation !== null}
        onOpenChange={(value) => {
          if (!value) setOperation(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{OPERATIONS.find((o) => o.id === operation)?.title}</DialogTitle>
            <DialogDescription>Cria um vídeo novo. O original mantém-se.</DialogDescription>
          </DialogHeader>
          {info.isLoading && <p>A carregar informações…</p>}
          {info.isError && (
            <p role="alert" className="text-destructive">
              {videoErrorMessage(videoErrorCode(info.error))}
            </p>
          )}
          {operation === "watermark" && (
            <VideoWatermarkPanel target={target} videoId={video.id} session={session} />
          )}
          {operation === "adjust" && (
            <VideoAdjustPanel target={target} videoId={video.id} session={session} />
          )}
          {operation === "filter" && (
            <VideoFilterPanel target={target} videoId={video.id} session={session} />
          )}
          {operation === "resize" && width && height && (
            <VideoResizePanel
              target={target}
              videoId={video.id}
              sourceWidth={width}
              sourceHeight={height}
              session={session}
            />
          )}
          {operation === "orient" && width && height && (
            <VideoOrientPanel
              target={target}
              videoId={video.id}
              sourceWidth={width}
              sourceHeight={height}
              session={session}
            />
          )}
          <VideoEditStatus session={session} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function VideoVisualActions(props: { target: VideoTarget; video: ProjectVideo }) {
  const canEdit = useCanEditProject();
  const session = useSession();
  if (!canEdit || session.user.type === "anonymous") return null;
  return <EditableVisualActions key={props.video.id} {...props} />;
}
