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
import { formatVideoFormat } from "@/lib/video-format";
import {
  convertStep,
  conversionError,
  conversionTargets,
  conversionVerdict,
  isVideoContainer,
  type VideoContainer,
} from "@/lib/video-convert";
import { useVideoInfo } from "./video-info-panel";
import {
  useVideoEditSession,
  useVideoEditValidation,
  type VideoEditSession,
} from "./use-video-edit";
import { VideoEditStatus } from "./video-edit-status";

function ConvertPanel({
  target,
  videoId,
  source,
  videoCodec,
  audioCodec,
  session,
}: {
  target: VideoTarget;
  videoId: string;
  source: VideoContainer;
  videoCodec: string;
  audioCodec: string | null;
  session: VideoEditSession;
}) {
  const destinations = conversionTargets(source);
  const [destination, setDestination] = useState<VideoContainer>(
    destinations[0],
  );
  const step = convertStep(destination);
  const validation = useVideoEditValidation(target, videoId, step);
  const verdict = validation.valid
    ? conversionVerdict(validation.output ?? null)
    : null;
  return (
    <div className="flex flex-col gap-4 text-sm">
      <p>Formato atual: {formatVideoFormat(source, videoCodec, audioCodec)}</p>
      <label className="flex flex-col gap-1" htmlFor="video-convert-target">
        Formato de saída
        <select
          id="video-convert-target"
          className="rounded-md border bg-background p-2"
          value={destination}
          disabled={session.busy}
          onChange={(event) =>
            setDestination(event.target.value as VideoContainer)
          }
        >
          {destinations.map((item) => (
            <option key={item} value={item}>
              {item.toUpperCase()}
            </option>
          ))}
        </select>
      </label>
      {validation.pending && <p aria-live="polite">A validar…</p>}
      {validation.error && (
        <p role="alert" className="text-destructive">
          {validation.error}
        </p>
      )}
      {validation.errors.map((error, index) => (
        <p key={index} role="alert" className="text-destructive">
          {conversionError(error.code)}
        </p>
      ))}
      {verdict && (
        <div aria-live="polite">
          <p>Saída: {verdict.format}</p>
          <p>{verdict.mode}</p>
        </div>
      )}
      <Button
        disabled={!validation.valid || !verdict || session.busy}
        onClick={() => void session.submit(step)}
      >
        Converter · 1 crédito
      </Button>
    </div>
  );
}

function EditableConvertActions({
  target,
  video,
}: {
  target: VideoTarget;
  video: ProjectVideo;
}) {
  const info = useVideoInfo(target, video.id);
  const session = useVideoEditSession(target, video.id);
  const [open, setOpen] = useState(false);
  const meta = info.data?.meta;
  const source = meta?.container;
  const ready = source && isVideoContainer(source) && meta?.videoCodec;
  return (
    <div className="flex flex-col gap-2">
      <div>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Converter formato
        </Button>
      </div>
      {!open && <VideoEditStatus session={session} />}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Converter formato</DialogTitle>
            <DialogDescription>
              Cria um vídeo novo. O original mantém-se.
            </DialogDescription>
          </DialogHeader>
          {info.isLoading && <p>A carregar informações…</p>}
          {info.isError && (
            <p role="alert" className="text-destructive">
              Não foi possível obter os dados do vídeo.
            </p>
          )}
          {ready && (
            <ConvertPanel
              target={target}
              videoId={video.id}
              source={source}
              videoCodec={meta.videoCodec!}
              audioCodec={meta.audioCodec ?? null}
              session={session}
            />
          )}
          {!info.isLoading && !info.isError && !ready && (
            <p role="alert">Formato ou codec do vídeo indisponível.</p>
          )}
          <VideoEditStatus session={session} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function VideoConvertActions(props: {
  target: VideoTarget;
  video: ProjectVideo;
}) {
  const canEdit = useCanEditProject();
  const session = useSession();
  if (!canEdit || session.user.type === "anonymous") return null;
  return <EditableConvertActions key={props.video.id} {...props} />;
}
