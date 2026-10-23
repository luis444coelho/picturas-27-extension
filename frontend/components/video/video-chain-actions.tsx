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
import type { ProjectVideo, VideoTarget } from "@/lib/videos";
import { VideoChainEditor } from "./video-chain-editor";

// Entry points of B008 (UC-VID-013, UC-VID-014): "Encadear operações" on the
// player and "Juntar vídeos" in the videos of the project, for users who can
// edit and are not anonymous, like the actions of B004 to B007.
function ChainDialog({
  title,
  label,
  target,
  video,
  startWithConcat,
}: {
  title: string;
  label: string;
  target: VideoTarget;
  video: ProjectVideo | null;
  startWithConcat: boolean;
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
            <DialogDescription>
              Cria um vídeo novo numa única tarefa. Os vídeos de origem
              mantêm-se.
            </DialogDescription>
          </DialogHeader>
          {open && (
            <VideoChainEditor
              target={target}
              video={video}
              startWithConcat={startWithConcat}
            />
          )}
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

export function VideoChainActions({
  target,
  video,
}: {
  target: VideoTarget;
  video: ProjectVideo;
}) {
  if (!useCanCompose()) return null;
  return (
    <ChainDialog
      key={video.id}
      title="Encadear operações"
      label="Encadear operações"
      target={target}
      video={video}
      startWithConcat={false}
    />
  );
}

export function VideoConcatAction({ target }: { target: VideoTarget }) {
  if (!useCanCompose()) return null;
  return (
    <ChainDialog
      title="Juntar vídeos"
      label="Juntar vídeos"
      target={target}
      video={null}
      startWithConcat
    />
  );
}
