"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoTarget, videoErrorCode, videoErrorMessage } from "@/lib/videos";
import { requestVideoDownload, startDownload } from "@/lib/video-access";
import {
  UNAVAILABLE,
  formatFileSize,
  formatVideoFormat,
} from "@/lib/video-format";
import { useVideoInfo } from "./video-info-panel";

// The two moments of UC-VID-006 (ADD 4.1): first the suggested name, format
// and size from the information endpoint; the signed URL is only requested on
// confirmation. Asking again after it expires gives a new URL (DOWNLOAD-008).
export function VideoDownloadDialog({
  target,
  videoId,
}: {
  target: VideoTarget;
  videoId: string;
}) {
  const info = useVideoInfo(target, videoId);
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setIsRequesting(true);
    setError(null);
    try {
      startDownload(await requestVideoDownload(target, videoId));
      setHasStarted(true);
    } catch (err) {
      setError(videoErrorMessage(videoErrorCode(err)));
    } finally {
      setIsRequesting(false);
    }
  };

  if (info.isLoading) {
    return (
      <div className="flex justify-center p-4">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }

  if (info.isError || !info.data) {
    return (
      <p className="text-sm text-destructive">
        {videoErrorMessage(videoErrorCode(info.error))}
      </p>
    );
  }

  const data = info.data;
  if (data.status !== "completed") {
    return (
      <p className="text-sm text-muted-foreground">
        {videoErrorMessage("RESOURCE_NOT_READY")}
      </p>
    );
  }

  const m = data.meta ?? {};
  const missing = new Set(data.unavailable ?? []);

  return (
    <div className="flex flex-col gap-4 text-sm">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <dt className="text-muted-foreground">Nome do ficheiro</dt>
        <dd className="break-all">{data.downloadFileName}</dd>
        <dt className="text-muted-foreground">Formato</dt>
        <dd>
          {missing.has("format")
            ? UNAVAILABLE
            : formatVideoFormat(
                m.container!,
                m.videoCodec!,
                m.audioCodec ?? null,
              )}
        </dd>
        <dt className="text-muted-foreground">Tamanho</dt>
        <dd>
          {missing.has("size") ? UNAVAILABLE : formatFileSize(m.sizeBytes!)}
        </dd>
      </dl>

      {error && <p className="text-destructive">{error}</p>}
      {hasStarted && !error && (
        <p className="text-muted-foreground">
          O descarregamento começou. Se não arrancar, tenta novamente.
        </p>
      )}

      <Button onClick={confirm} disabled={isRequesting} className="self-end">
        {isRequesting ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <Download />
        )}
        Descarregar
      </Button>
    </div>
  );
}
