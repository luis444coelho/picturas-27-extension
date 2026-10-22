"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchVideoPlayback,
  videoErrorCode,
  videoErrorMessage,
  type VideoTarget,
} from "@/lib/videos";
import {
  formatTimecode,
  parseTimecode,
  predictedTrimMs,
  trimStep,
} from "@/lib/video-edit";
import {
  useVideoEditValidation,
  type VideoEditSession,
} from "./use-video-edit";
import { VideoEditValidation } from "./video-edit-validation";

export function VideoTrimPanel({
  target,
  videoId,
  durationMs,
  session,
}: {
  target: VideoTarget;
  videoId: string;
  durationMs: number;
  session: VideoEditSession;
}) {
  const [start, setStart] = useState(formatTimecode(0));
  const [end, setEnd] = useState(formatTimecode(durationMs));
  const [url, setUrl] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [looping, setLooping] = useState(false);
  const player = useRef<HTMLVideoElement>(null);
  const resumeAt = useRef(0);
  const renewals = useRef(0);
  const startMs = parseTimecode(start),
    endMs = parseTimecode(end);
  const intervalValid =
    startMs !== null &&
    endMs !== null &&
    startMs < endMs &&
    endMs <= durationMs;
  const step = intervalValid ? trimStep(startMs, endMs) : null;
  const validation = useVideoEditValidation(target, videoId, step);

  useEffect(() => {
    let disposed = false;
    fetchVideoPlayback(target, videoId).then(
      (playback) => {
        if (!disposed) setUrl(playback.url);
      },
      (error) => {
        if (!disposed)
          setPlaybackError(videoErrorMessage(videoErrorCode(error)));
      },
    );
    return () => {
      disposed = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  useEffect(() => {
    if (!looping || !intervalValid) return;
    let frame = 0;
    const tick = () => {
      const video = player.current;
      if (video && (video.currentTime * 1000 >= endMs || video.ended)) {
        video.currentTime = startMs / 1000;
        video.play().catch(() => setLooping(false));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [looping, intervalValid, startMs, endMs]);

  const stop = () => {
    setLooping(false);
    player.current?.pause();
  };
  const mark = (field: "start" | "end") => {
    stop();
    const value = formatTimecode(
      Math.min(
        durationMs,
        Math.round((player.current?.currentTime ?? 0) * 1000),
      ),
    );
    if (field === "start") setStart(value);
    else setEnd(value);
  };
  const toggleLoop = () => {
    if (looping) {
      stop();
      return;
    }
    if (!intervalValid || !player.current) return;
    player.current.currentTime = startMs / 1000;
    setLooping(true);
    player.current.play().catch(() => setLooping(false));
  };
  const renew = async () => {
    if (renewals.current++ >= 3) {
      setPlaybackError("Não foi possível reproduzir o vídeo.");
      return;
    }
    resumeAt.current = player.current?.currentTime ?? 0;
    try {
      setUrl((await fetchVideoPlayback(target, videoId)).url);
    } catch (error) {
      setPlaybackError(videoErrorMessage(videoErrorCode(error)));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {url && (
        <video
          ref={player}
          src={url}
          controls
          playsInline
          preload="metadata"
          className="w-full max-h-[35vh] bg-black rounded-md"
          onError={renew}
          onLoadedMetadata={() => {
            if (player.current) player.current.currentTime = resumeAt.current;
          }}
        />
      )}
      {playbackError && (
        <p role="alert" className="text-sm text-destructive">
          {playbackError}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="trim-start">Início (hh:mm:ss.mmm)</Label>
          <Input
            id="trim-start"
            value={start}
            disabled={session.busy}
            onChange={(e) => {
              stop();
              setStart(e.target.value);
            }}
          />
          <Button
            variant="outline"
            disabled={session.busy || !url}
            onClick={() => mark("start")}
          >
            Definir início
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="trim-end">Fim (hh:mm:ss.mmm)</Label>
          <Input
            id="trim-end"
            value={end}
            disabled={session.busy}
            onChange={(e) => {
              stop();
              setEnd(e.target.value);
            }}
          />
          <Button
            variant="outline"
            disabled={session.busy || !url}
            onClick={() => mark("end")}
          >
            Definir fim
          </Button>
        </div>
      </div>
      {!intervalValid && (
        <p role="alert" className="text-sm text-destructive">
          Indica um intervalo válido entre 00:00:00.000 e{" "}
          {formatTimecode(durationMs)}.
        </p>
      )}
      {intervalValid && (
        <p className="text-sm">
          Duração prevista: {formatTimecode(predictedTrimMs(startMs, endMs))}
        </p>
      )}
      <VideoEditValidation validation={validation} />
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={!intervalValid || !url}
          onClick={toggleLoop}
        >
          {looping ? "Parar pré-visualização" : "Pré-visualizar corte"}
        </Button>
        <Button
          disabled={!step || !validation.valid || session.busy}
          onClick={() => {
            stop();
            if (step) void session.submit(step);
          }}
        >
          Recortar · 1 crédito
        </Button>
      </div>
    </div>
  );
}
