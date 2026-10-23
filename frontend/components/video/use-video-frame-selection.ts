"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchVideoInfo } from "@/lib/video-access";
import { fetchVideoPlayback } from "@/lib/videos";
import type { VideoTarget } from "@/lib/videos";
import type { ConfigSource } from "./operation-config";

const MAX_WIDTH = 1280; // Same cap as the stored first frame (ADD T-07).
const MAX_JPEG_BYTES = 2 * 1024 * 1024;

interface CapturedFrame {
  atMs: number;
  jpeg?: string;
  error?: string;
}

// Only a step whose input is the original can use its playback timeline.
// A detached video element keeps the player in the workspace untouched.
export function useVideoFrameSelection(target: VideoTarget, source: ConfigSource) {
  const [atMs, setAtMs] = useState(0);
  const [captured, setCaptured] = useState<CapturedFrame | null>(null);
  const info = useQuery({
    queryKey: ["videoInfo", target.pid, target.shareId, source.videoId],
    queryFn: () => fetchVideoInfo(target, source.videoId),
    enabled: source.isSource && !source.inputProps.durationMs,
  });
  const durationMs = source.inputProps.durationMs ?? info.data?.meta?.durationMs ?? 0;
  const playback = useQuery({
    queryKey: ["videoFramePlayback", target.pid, target.shareId, source.videoId],
    queryFn: () => fetchVideoPlayback(target, source.videoId),
    enabled: source.isSource && atMs > 0,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (!source.isSource || atMs === 0 || !playback.data?.url) return;
    let disposed = false;
    let video: HTMLVideoElement | null = null;
    const fail = () => {
      if (!disposed)
        setCaptured({ atMs, error: "Não foi possível obter este fotograma do vídeo." });
    };
    const timer = window.setTimeout(() => {
      video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;
      video.addEventListener("error", fail);
      video.addEventListener("loadedmetadata", () => {
        if (disposed || !video) return;
        video.currentTime = Math.min(atMs / 1000, Math.max(0, video.duration - 0.05));
      });
      video.addEventListener("seeked", () => {
        if (disposed || !video) return;
        const capture = () => {
          if (disposed || !video) return;
          try {
            const width = Math.min(MAX_WIDTH, video.videoWidth);
            if (!width || !video.videoHeight) throw new Error("no frame");
            const height = Math.max(
              2,
              2 * Math.round((video.videoHeight * width) / video.videoWidth / 2),
            );
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext("2d");
            if (!context) throw new Error("no canvas");
            context.drawImage(video, 0, 0, width, height);
            const jpeg = canvas.toDataURL("image/jpeg", 0.82).split(",")[1];
            if (!jpeg || Math.ceil((jpeg.length * 3) / 4) > MAX_JPEG_BYTES)
              throw new Error("large frame");
            setCaptured({ atMs, jpeg });
          } catch {
            fail();
          }
        };
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) capture();
        else video.addEventListener("loadeddata", capture, { once: true });
      });
      video.src = playback.data.url;
      video.load();
    }, 250);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      if (video) {
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [source.isSource, atMs, playback.data?.url]);

  return {
    enabled: source.isSource,
    atMs,
    setAtMs,
    durationMs,
    jpeg: atMs > 0 && captured?.atMs === atMs ? captured.jpeg : undefined,
    error:
      atMs > 0 && captured?.atMs === atMs
        ? captured.error
        : playback.isError
          ? "Não foi possível carregar o vídeo para escolher o fotograma."
          : undefined,
    pending:
      atMs > 0 &&
      !playback.isError &&
      !(captured?.atMs === atMs && (captured.jpeg || captured.error)),
  };
}

export type VideoFrameSelection = ReturnType<typeof useVideoFrameSelection>;
