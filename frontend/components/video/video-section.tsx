"use client";

import { useState } from "react";
import Link from "next/link";
import { Film } from "lucide-react";
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
import { useCanEditProject } from "@/providers/project-provider";
import { ProjectVideo } from "@/lib/videos";
import { useVideoTarget } from "./use-video-target";
import { VideoUpload } from "./video-upload";
import { VideoGallery } from "./video-gallery";
import { VideoPlayer } from "./video-player";
import { VideoConcatAction } from "./video-chain-actions";

// Video entry point of the project page (D-16): upload for users with edit
// permission, gallery and integrated player for everyone with access.
export function VideoSection() {
  const session = useSession();
  const canEdit = useCanEditProject();
  const target = useVideoTarget();
  const [selected, setSelected] = useState<ProjectVideo | null>(null);
  const isAnonymous = session.user.type === "anonymous";

  return (
    <Dialog onOpenChange={(open) => !open && setSelected(null)}>
      <DialogTrigger asChild>
        <Button variant="outline" title="Vídeos do projeto">
          <Film /> Vídeos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vídeos</DialogTitle>
          <DialogDescription>
            Carrega e reproduz os vídeos deste projeto.
          </DialogDescription>
        </DialogHeader>

        {isAnonymous ? (
          // Anonymous users have no access to video (AUTH-002, RN1).
          <div className="flex flex-col gap-3 text-sm">
            <p>
              Os vídeos estão disponíveis para utilizadores registados e
              Premium.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/login">Iniciar sessão</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/register">Criar conta</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {canEdit && <VideoUpload target={target} />}
            {canEdit && <VideoConcatAction target={target} />}
            {selected && <VideoPlayer target={target} video={selected} />}
            <VideoGallery
              target={target}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
