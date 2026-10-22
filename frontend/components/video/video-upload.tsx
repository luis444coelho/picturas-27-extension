"use client";

import { useCallback, useRef, useState } from "react";
import Dropzone from "react-dropzone";
import { LoaderCircle, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/providers/session-provider";
import {
  ACCEPTED_VIDEO_TYPES,
  UploadAbortedError,
  VIDEO_LIMITS,
  VideoTarget,
  cancelVideoUpload,
  completeVideoUpload,
  formatSize,
  isAcceptedVideoFile,
  putVideoFile,
  requestVideoUpload,
  videoErrorCode,
  videoErrorMessage,
} from "@/lib/videos";
import {
  VideoIngestUpdate,
  useVideoIngestEvents,
} from "./use-video-ingest-events";

type Phase = "idle" | "selected" | "uploading" | "processing";

const ACCEPT = Object.fromEntries(
  Object.entries(ACCEPTED_VIDEO_TYPES).map(([ext, mime]) => [mime, [ext]]),
);

// Upload of UC-VID-000: select or drop (UPLOAD-001/002), client-side checks
// (UPLOAD-003/020), progress and cancel (UPLOAD-006/018), then the ingestion
// result arrives by WebSocket.
export function VideoUpload({ target }: { target: VideoTarget }) {
  const session = useSession();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const videoIdRef = useRef<string | null>(null);

  const limits =
    session.user.type === "premium" ? VIDEO_LIMITS.premium : VIDEO_LIMITS.free;

  const reset = () => {
    setFile(null);
    setPhase("idle");
    setProgress(0);
    abortRef.current = null;
    videoIdRef.current = null;
  };

  const showError = useCallback(
    (code: string | null) =>
      toast({
        title: "Carregamento de vídeo",
        description: videoErrorMessage(code),
        variant: "destructive",
      }),
    [toast],
  );

  const onIngestUpdate = useCallback(
    (update: VideoIngestUpdate) => {
      if (update.videoId !== videoIdRef.current) return;
      if (update.status === "completed") {
        toast({
          title: "Vídeo carregado",
          description: "O vídeo já está disponível no projeto.",
        });
        reset();
      } else if (update.status === "failed") {
        showError(update.error?.code ?? null);
        reset();
      }
    },
    [toast, showError],
  );
  useVideoIngestEvents(target.pid, onIngestUpdate);

  const select = (files: File[]) => {
    const chosen = files[0];
    if (!chosen) return;
    if (!isAcceptedVideoFile(chosen)) return showError("UNSUPPORTED_FORMAT");
    if (chosen.size > limits.maxBytes) return showError("LIMIT_EXCEEDED");
    setFile(chosen);
    setPhase("selected");
  };

  const start = async () => {
    if (!file) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("uploading");
    setProgress(0);

    try {
      const ticket = await requestVideoUpload(target, file);
      videoIdRef.current = ticket.videoId;
      await putVideoFile(ticket, file, setProgress, controller.signal);
      setPhase("processing");
      await completeVideoUpload(target, ticket.videoId);
    } catch (error) {
      const videoId = videoIdRef.current;
      if (videoId && phaseNeedsCancel(error)) {
        await cancelVideoUpload(target, videoId).catch(() => undefined);
      }
      if (!(error instanceof UploadAbortedError)) {
        showError(
          videoErrorCode(error) ?? (axiosLess(error) ? "UPLOAD_ABORTED" : null),
        );
      }
      reset();
    }
  };

  const cancel = () => abortRef.current?.abort();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Formatos MP4, MOV e AVI. Limite do teu perfil: {limits.label}.
      </p>

      {phase === "idle" && (
        <Dropzone onDrop={select} accept={ACCEPT} multiple={false}>
          {({ getRootProps, getInputProps, isDragActive }) => (
            <div
              {...getRootProps()}
              className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-sm cursor-pointer ${
                isDragActive ? "border-primary bg-primary/5" : "border-muted"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="size-5" />
              <span>Arrasta um vídeo para aqui ou clica para escolher</span>
            </div>
          )}
        </Dropzone>
      )}

      {file && phase !== "idle" && (
        <div className="flex flex-col gap-2 rounded-md border p-3 text-sm">
          <div className="flex justify-between gap-2">
            <span className="truncate font-medium">{file.name}</span>
            <span className="text-muted-foreground">
              {formatSize(file.size)}
            </span>
          </div>

          {phase === "selected" && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={reset}>
                <X /> Remover
              </Button>
              <Button onClick={start}>
                <Upload /> Carregar
              </Button>
            </div>
          )}

          {phase === "uploading" && (
            <>
              <Progress value={progress} />
              <div className="flex justify-between items-center">
                <span>{progress}%</span>
                <Button variant="outline" onClick={cancel}>
                  Cancelar carregamento
                </Button>
              </div>
            </>
          )}

          {phase === "processing" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> A validar e
              preparar o vídeo…
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Errors before the confirmation leave a queued record behind: cancel it.
function phaseNeedsCancel(error: unknown) {
  return videoErrorCode(error) === null;
}

// Storage and network errors come from XMLHttpRequest, not from axios.
function axiosLess(error: unknown) {
  return error instanceof Error && !("isAxiosError" in error);
}
