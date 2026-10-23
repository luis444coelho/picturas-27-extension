"use client";

import { useState, type ReactNode } from "react";
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
import type { ProjectVideo, VideoTarget } from "@/lib/videos";
import { VideoMultiOperations } from "./video-multi-operations";
import { VideoConcatVideos } from "./video-concat-videos";
import { VideoMovieMaker } from "./video-movie-maker";

// The three independent actions of B008 (revision): "Aplicar várias
// operações" on the player, "Juntar vídeos" and "Movie Maker" in the videos
// of the project; for users who can edit and are not anonymous (RN1).
function ActionDialog({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description: string;
  children: () => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {open && children()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function useCanCompose() {
  const canEdit = useCanEditProject();
  const session = useSession();
  return canEdit && session.user.type !== "anonymous";
}

export function VideoMultiOperationsAction({
  target,
  video,
}: {
  target: VideoTarget;
  video: ProjectVideo;
}) {
  if (!useCanCompose()) return null;
  return (
    <ActionDialog
      key={video.id}
      label="Aplicar várias operações"
      title="Aplicar várias operações"
      description="Aplica uma sequência de operações a este vídeo numa só tarefa. O original mantém-se."
    >
      {() => <VideoMultiOperations target={target} video={video} />}
    </ActionDialog>
  );
}

export function VideoCompositionActions({ target }: { target: VideoTarget }) {
  if (!useCanCompose()) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <ActionDialog
        label="Juntar vídeos"
        title="Juntar vídeos"
        description="Junta vídeos do projeto pela ordem escolhida num só vídeo. Os originais mantêm-se."
      >
        {() => <VideoConcatVideos target={target} />}
      </ActionDialog>
      <ActionDialog
        label="Movie Maker"
        title="Movie Maker"
        description="Cada vídeo tem as suas operações, os resultados são juntos e o vídeo final pode receber novas operações. Os originais mantêm-se."
      >
        {() => <VideoMovieMaker target={target} />}
      </ActionDialog>
    </div>
  );
}
