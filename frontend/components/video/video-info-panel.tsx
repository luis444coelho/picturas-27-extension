"use client";

import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { VideoTarget, videoErrorCode, videoErrorMessage } from "@/lib/videos";
import { VideoInfo, fetchVideoInfo } from "@/lib/video-access";
import {
  UNAVAILABLE,
  formatFileSize,
  formatFps,
  formatPreciseDuration,
  formatResolution,
  formatVideoFormat,
} from "@/lib/video-format";

const STATUS_LABELS: Record<VideoInfo["status"], string> = {
  queued: "Em fila",
  processing: "Em processamento",
  completed: "Concluído",
  failed: "Falhou",
};

export function useVideoInfo(target: VideoTarget, videoId: string) {
  return useQuery({
    queryKey: ["videoInfo", target.pid, target.shareId, videoId],
    queryFn: () => fetchVideoInfo(target, videoId),
  });
}

// Values of the panel; an attribute without metadata is "Indisponível" (INFO-009).
export function infoRows(info: VideoInfo) {
  const m = info.meta ?? {};
  const missing = new Set(info.unavailable ?? []);
  const value = (attribute: string, format: () => string) =>
    missing.has(attribute as never) ? UNAVAILABLE : format();

  return [
    {
      label: "Duração",
      value: value("duration", () => formatPreciseDuration(m.durationMs!)),
    },
    {
      label: "Resolução",
      value: value("resolution", () =>
        formatResolution(m.displayWidth!, m.displayHeight!),
      ),
    },
    {
      label: "Formato",
      value: value("format", () =>
        formatVideoFormat(m.container!, m.videoCodec!, m.audioCodec ?? null),
      ),
    },
    {
      label: "Tamanho",
      value: value("size", () => formatFileSize(m.sizeBytes!)),
    },
    {
      label: "Taxa de fotogramas",
      value: value("fps", () => formatFps(m.fpsNum!, m.fpsDen!)),
    },
  ];
}

function formatParameters(parameters: Record<string, unknown>) {
  return Object.entries(parameters)
    .map(([name, value]) => `${name}: ${JSON.stringify(value)}`)
    .join(", ");
}

// Information panel (UC-VID-007): technical metadata read from the stored
// record, provenance and applied steps (FA1). No task, no quota (INFO-007).
export function VideoInfoPanel({
  target,
  videoId,
}: {
  target: VideoTarget;
  videoId: string;
}) {
  const info = useVideoInfo(target, videoId);

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
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Estado</dt>
        <dd>{STATUS_LABELS[data.status] ?? data.status}</dd>
      </dl>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <dt className="text-muted-foreground">Nome</dt>
        <dd className="break-all">{data.originalName}</dd>
        {infoRows(data).map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>

      {data.sources && data.sources.length > 0 && (
        <section className="flex flex-col gap-1">
          <h3 className="font-medium">Proveniência</h3>
          <ul className="list-disc pl-5">
            {data.sources.map((source) => (
              <li key={source.id}>
                {source.originalName ?? (
                  <span className="text-muted-foreground">Vídeo removido</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.recipe && data.recipe.length > 0 && (
        <section className="flex flex-col gap-1">
          <h3 className="font-medium">Passos aplicados</h3>
          <ol className="list-decimal pl-5">
            {data.recipe.map((step, index) => (
              <li key={index}>
                {step.operation}
                {Object.keys(step.parameters).length > 0 && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({formatParameters(step.parameters)})
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
