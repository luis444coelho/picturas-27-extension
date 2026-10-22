"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { VideoTarget } from "@/lib/videos";
import { removeAudioStep } from "@/lib/video-edit";
import {
  useVideoEditValidation,
  type VideoEditSession,
} from "./use-video-edit";
import { VideoEditValidation } from "./video-edit-validation";

export function VideoRemoveAudioPanel({
  target,
  videoId,
  session,
}: {
  target: VideoTarget;
  videoId: string;
  session: VideoEditSession;
}) {
  const step = removeAudioStep();
  const validation = useVideoEditValidation(target, videoId, step);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        Cria um vídeo novo sem nenhuma faixa de áudio. O original mantém-se.
      </p>
      <VideoEditValidation validation={validation} />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button disabled={!validation.valid || session.busy}>
            Remover áudio · 1 crédito
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção do áudio</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as faixas de áudio serão removidas do novo vídeo. O original
              mantém-se. Confirmas a operação?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!validation.valid || session.busy}
              onClick={() => void session.submit(step)}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
