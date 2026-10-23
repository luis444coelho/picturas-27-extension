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
import {
  simpleSource,
  useReportStep,
  type OperationConfigProps,
} from "./operation-config";

// Configuration of the removal of audio (D-87, ADR-020): no controls; the
// confirmation of AUDIO-004 stays with the submission of the simple panel.
export function RemoveAudioConfig({
  target,
  source,
  disabled,
  chainValidation,
  onStepChange,
  renderActions,
}: OperationConfigProps) {
  const step = removeAudioStep();
  const ownValidation = useVideoEditValidation(
    target,
    source.videoId,
    chainValidation ? null : step,
  );
  const validation = chainValidation ?? ownValidation;
  useReportStep(step, onStepChange);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        Cria um vídeo novo sem nenhuma faixa de áudio. O original mantém-se.
      </p>
      <VideoEditValidation validation={validation} />
      {renderActions({
        step,
        validation,
        busy: disabled,
        beforeSubmit: () => undefined,
      })}
    </div>
  );
}

export function VideoRemoveAudioPanel({
  target,
  videoId,
  session,
}: {
  target: VideoTarget;
  videoId: string;
  session: VideoEditSession;
}) {
  return (
    <RemoveAudioConfig
      target={target}
      source={simpleSource(videoId, {})}
      disabled={session.busy}
      renderActions={({ step, validation }) => (
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
                Todas as faixas de áudio serão removidas do novo vídeo. O
                original mantém-se. Confirmas a operação?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction
                disabled={!validation.valid || session.busy}
                onClick={() => {
                  if (step) void session.submit(step);
                }}
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    />
  );
}
