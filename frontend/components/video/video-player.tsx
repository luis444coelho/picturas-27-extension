"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import {
  ProjectVideo,
  VideoTarget,
  fetchVideoPlayback,
  videoErrorCode,
  videoErrorMessage,
} from "@/lib/videos";
import { VideoActions } from "./video-actions";

// Integrated player (UPLOAD-015, RN6): the native controls give play, pause,
// seek, volume and full screen. The server picks the MP4 preview copy when
// there is one (UPLOAD-017). Playback does not use quota.
export function VideoPlayer({
  target,
  video,
}: {
  target: VideoTarget;
  video: ProjectVideo;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resumeAt = useRef<number | null>(null);
  const renewals = useRef(0);

  const load = async () => {
    try {
      const playback = await fetchVideoPlayback(target, video.id);
      setError(null);
      setUrl(playback.url);
    } catch (err) {
      setError(videoErrorMessage(videoErrorCode(err)));
    }
  };

  useEffect(() => {
    setUrl(null);
    renewals.current = 0;
    resumeAt.current = null;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id]);

  // The URL is valid for 15 min (NFR-017). Seeking later sends a new Range
  // request that storage refuses; ask for a new URL and resume at the same time.
  const onError = () => {
    if (renewals.current >= 3) {
      setError(videoErrorMessage("INTERNAL_ERROR"));
      return;
    }
    renewals.current += 1;
    resumeAt.current = ref.current?.currentTime ?? 0;
    load();
  };

  const onLoadedMetadata = () => {
    if (ref.current && resumeAt.current !== null) {
      ref.current.currentTime = resumeAt.current;
      resumeAt.current = null;
      ref.current.play().catch(() => undefined);
    }
  };

  if (error) return <p className="text-sm text-destructive">{error}</p>;

  if (!url) {
    return (
      <div className="flex justify-center p-4">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <video
        ref={ref}
        key={url}
        src={url}
        controls
        playsInline
        preload="metadata"
        className="w-full max-h-[60vh] bg-black rounded-md"
        onError={onError}
        onLoadedMetadata={onLoadedMetadata}
      />
      <p className="text-sm font-medium truncate">{video.originalName}</p>
      <VideoActions target={target} video={video} />
    </div>
  );
}
