"use client";

import { Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSession } from "@/providers/session-provider";
import { VideoTarget } from "@/lib/videos";
import { VideoInfo } from "@/lib/video-access";
import { VideoInfoPanel } from "./video-info-panel";
import { VideoDownloadDialog } from "./video-download-dialog";

// "Informações" and "Descarregar" of a video, in the gallery and in the player
// (UC-VID-006 FA1, UC-VID-007 FA3). Hidden for anonymous users (RN1);
// "Descarregar" is disabled until the video is completed (DOWNLOAD-003).
export function VideoActions({
  target,
  video,
  status = "completed",
}: {
  target: VideoTarget;
  video: { id: string; originalName: string };
  status?: VideoInfo["status"];
}) {
  const session = useSession();
  if (session.user.type === "anonymous") return null;

  const isReady = status === "completed";

  return (
    <div className="flex gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" title="Informações do vídeo">
            <Info /> Informações
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Informações</DialogTitle>
            <DialogDescription className="break-all">
              {video.originalName}
            </DialogDescription>
          </DialogHeader>
          <VideoInfoPanel target={target} videoId={video.id} />
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!isReady}
            title={
              isReady
                ? "Descarregar o vídeo"
                : "RESOURCE_NOT_READY: o vídeo ainda não está concluído"
            }
          >
            <Download /> Descarregar
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Descarregar vídeo</DialogTitle>
            <DialogDescription>
              O ficheiro é descarregado no formato em que está guardado.
            </DialogDescription>
          </DialogHeader>
          <VideoDownloadDialog target={target} videoId={video.id} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
