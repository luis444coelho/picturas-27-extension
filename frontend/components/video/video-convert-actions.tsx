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
import {
  initialParam,
  simpleSource,
  useReportStep,
  type ConfigActions,
  type OperationConfigProps,
} from "./operation-config";

interface ConvertActions extends ConfigActions {
  verdict: ReturnType<typeof conversionVerdict>;
}

// Configuration of the conversion (D-87, ADR-020), also used by the
// compositions, where the source is the estimated input of the last step and
// the copy/encode verdict (ADR-014) only exists for an isolated conversion.
export function ConvertConfig({
  target,
  source: config,
  initial,
  disabled,
  chainValidation,
  onStepChange,
  renderActions,
}: OperationConfigProps<ConvertActions>) {
  const videoId = config.videoId;
  const source = config.inputProps.container as VideoContainer;
  const videoCodec = config.inputProps.videoCodec ?? "";
  const audioCodec = config.inputProps.audioCodec ?? null;
  const destinations = conversionTargets(source);
  const [destination, setDestination] = useState<VideoContainer>(
    initialParam(initial, "target", destinations[0]),
  );
  const step = convertStep(destination);
  const ownValidation = useVideoEditValidation(
    target,
    videoId,
    chainValidation ? null : step,
  );
  const validation = chainValidation ?? ownValidation;
  useReportStep(step, onStepChange);
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
          disabled={disabled}
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
      {renderActions({
        step,
        validation,
        busy: disabled,
        beforeSubmit: () => undefined,
        verdict,
      })}
    </div>
  );
}

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
  return (
    <ConvertConfig
      target={target}
      source={simpleSource(videoId, {
        container: source,
        videoCodec,
        audioCodec,
      })}
      disabled={session.busy}
      renderActions={({ step, validation, verdict }) => (
        <Button
          disabled={!validation.valid || !verdict || session.busy}
          onClick={() => {
            if (step) void session.submit(step);
          }}
        >
          Converter · 1 crédito
        </Button>
      )}
    />
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
