"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Dropzone from "react-dropzone";
import { Film, LoaderCircle, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/providers/session-provider";
import { useAddProject } from "@/lib/mutations/projects";
import { getErrorMessage } from "@/lib/error-messages";
import {
  ACCEPTED_VIDEO_TYPES,
  UploadAbortedError,
  VIDEO_LIMITS,
  cancelVideoUpload,
  completeVideoUpload,
  formatSize,
  isAcceptedVideoFile,
  putVideoFile,
  requestVideoUpload,
  videoErrorCode,
  videoErrorMessage,
} from "@/lib/videos";
import { createVideoProject } from "@/lib/video-project";
import {
  VideoIngestUpdate,
  useVideoIngestEvents,
} from "./use-video-ingest-events";

type Phase = "idle" | "uploading";

const ACCEPT = Object.fromEntries(
  Object.entries(ACCEPTED_VIDEO_TYPES).map(([ext, mime]) => [mime, [ext]]),
);

const EMPTY_PROJECT_NOTE =
  "O projeto foi criado sem vídeo. Podes carregar outro vídeo na janela Vídeos.";

// "New project with video" of the dashboard (UC-VID-000 FA6, D-30): creates an
// empty project, uploads the video with the B001 flow and opens the project.
// Anonymous users have no access to video (RN1).
export function NewVideoProjectDialog() {
  const session = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const addProject = useAddProject(session.user._id, session.token);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  // The ingestion ends after the project opens; keep listening (D-32).
  const [watched, setWatched] = useState<{
    projectId: string;
    videoId: string;
  } | null>(null);

  const limits =
    session.user.type === "premium" ? VIDEO_LIMITS.premium : VIDEO_LIMITS.free;

  const onIngestUpdate = useCallback(
    (update: VideoIngestUpdate) => {
      if (update.videoId !== watched?.videoId) return;
      if (update.status === "failed") {
        toast({
          title: "Carregamento de vídeo",
          description: `${videoErrorMessage(update.error?.code)} ${EMPTY_PROJECT_NOTE}`,
          variant: "destructive",
        });
      }
      if (update.status !== "processing") setWatched(null);
    },
    [toast, watched],
  );
  useVideoIngestEvents(watched?.projectId ?? "", onIngestUpdate);

  if (session.user.type === "anonymous") return null;

  const reset = () => {
    setName("");
    setFile(null);
    setPhase("idle");
    setProgress(0);
    abortRef.current = null;
  };

  const showError = (code: string) =>
    toast({
      title: "Carregamento de vídeo",
      description: videoErrorMessage(code),
      variant: "destructive",
    });

  const select = (files: File[]) => {
    const chosen = files[0];
    if (!chosen) return;
    if (!isAcceptedVideoFile(chosen)) return showError("UNSUPPORTED_FORMAT");
    if (chosen.size > limits.maxBytes) return showError("LIMIT_EXCEEDED");
    setFile(chosen);
  };

  const create = async () => {
    if (!file || name.trim() === "") return;
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("uploading");
    setProgress(0);

    try {
      const result = await createVideoProject(
        {
          createProject: (projectName) =>
            addProject.mutateAsync({
              uid: session.user._id,
              token: session.token,
              name: projectName,
            }),
          requestUpload: requestVideoUpload,
          putFile: putVideoFile,
          completeUpload: completeVideoUpload,
          cancelUpload: cancelVideoUpload,
          errorCode: videoErrorCode,
          isAborted: (error) => error instanceof UploadAbortedError,
        },
        {
          uid: session.user._id,
          token: session.token,
          name,
          file,
          onProgress: setProgress,
          signal: controller.signal,
        },
      );

      if (result.outcome === "uploaded") {
        setWatched({ projectId: result.projectId, videoId: result.videoId });
        toast({
          title: "Projeto criado",
          description:
            "O vídeo está a ser validado e preparado. Aparece no projeto quando estiver pronto.",
        });
      } else if (result.outcome === "cancelled") {
        toast({
          title: "Carregamento cancelado",
          description: EMPTY_PROJECT_NOTE,
        });
      } else {
        toast({
          title: "Carregamento de vídeo",
          description: `${videoErrorMessage(result.errorCode)} ${EMPTY_PROJECT_NOTE}`,
          variant: "destructive",
        });
      }
      setOpen(false);
      reset();
      router.push(`/dashboard/${result.projectId}`);
    } catch (error) {
      // The project was not created.
      const { title, description } = getErrorMessage("project-create", error);
      toast({ title, description, variant: "destructive" });
      setPhase("idle");
      setProgress(0);
    }
  };

  const busy = phase === "uploading";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="inline-flex" variant="outline">
          <Film /> Novo projeto com vídeo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo projeto com vídeo</DialogTitle>
          <DialogDescription>
            Formatos MP4, MOV e AVI. Limite do teu perfil: {limits.label}.
          </DialogDescription>
        </DialogHeader>

        <Label htmlFor="video-project-name">Nome do projeto</Label>
        <Input
          id="video-project-name"
          placeholder="Nome do projeto"
          value={name}
          disabled={busy}
          onChange={(e) => setName(e.target.value)}
        />

        {!file ? (
          <Dropzone
            onDrop={select}
            // Files outside ACCEPT never reach onDrop (Exception 1).
            onDropRejected={() => showError("UNSUPPORTED_FORMAT")}
            accept={ACCEPT}
            multiple={false}
          >
            {({ getRootProps, getInputProps, isDragActive }) => (
              <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-sm cursor-pointer ${
                  isDragActive ? "border-primary bg-primary/5" : "border-muted"
                }`}
              >
                <input {...getInputProps()} aria-label="Vídeo" />
                <Upload className="size-5" />
                <span>Arrasta um vídeo para aqui ou clica para escolher</span>
              </div>
            )}
          </Dropzone>
        ) : (
          <div className="flex flex-col gap-2 rounded-md border p-3 text-sm">
            <div className="flex justify-between items-center gap-2">
              <span className="truncate font-medium">{file.name}</span>
              <span className="text-muted-foreground shrink-0">
                {formatSize(file.size)}
              </span>
              {!busy && (
                <Button
                  variant="ghost"
                  size="icon"
                  title="Remover vídeo"
                  onClick={() => setFile(null)}
                >
                  <X />
                </Button>
              )}
            </div>
            {busy && (
              <>
                <Progress value={progress} />
                <div className="flex justify-between items-center">
                  <span>{progress}%</span>
                  <Button
                    variant="outline"
                    onClick={() => abortRef.current?.abort()}
                  >
                    Cancelar carregamento
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={create}
            disabled={busy || !file || name.trim() === ""}
            className="inline-flex items-center gap-1"
          >
            <span>Criar</span>
            {busy && <LoaderCircle className="size-[1em] animate-spin" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
