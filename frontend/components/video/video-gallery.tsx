"use client";

import type { ProjectVideo } from "@/lib/videos";
import { formatDuration } from "@/lib/videos";
import {
  buildVideoFamilies,
  videoOperationLabel,
  type VideoLineageRecord,
  type VideoVersion,
} from "@/lib/video-lineage";

export function VideoGallery({
  videos,
  lineage,
  selectedId,
  onSelect,
}: {
  videos: ProjectVideo[];
  lineage: VideoLineageRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const byId = new Map(videos.map((video) => [video.id, video]));
  const families = buildVideoFamilies(videos, lineage);

  const renderNode = (node: VideoVersion, depth: number): React.ReactNode => {
    const { video, lineage: info } = node;
    const sources = info.sourceVideoIds;
    const composite = sources.length > 1;
    const movie =
      composite && (info.hasClipOperations || info.operations.length > 1);
    const label = composite
      ? `${movie ? "Movie Maker" : "Junção"} de ${sources.length} clips`
      : !info.isResult
        ? "Original"
        : `V${node.version || 1} · ${videoOperationLabel(info.operations)}`;
    const sourceText =
      info.isResult && sources.length === 0
        ? "Origem indisponível"
        : sources.length === 1
          ? `Origem: ${byId.get(sources[0])?.originalName ?? "Origem removida"}`
          : null;
    return (
      <li
        key={video.id}
        className="min-w-0"
        style={{ paddingLeft: Math.min(depth, 5) * 12 }}
      >
        <button
          type="button"
          onClick={() => onSelect(video.id)}
          aria-current={selectedId === video.id ? "true" : undefined}
          aria-label={`${label}: ${video.originalName}`}
          title={video.originalName}
          className={`w-full rounded-md border p-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-primary ${
            selectedId === video.id
              ? "border-primary bg-primary/10 ring-2 ring-primary"
              : "hover:border-primary"
          }`}
        >
          <span className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={video.thumbnailUrl}
              alt=""
              className="h-12 w-16 shrink-0 rounded object-contain bg-black"
            />
            <span className="font-medium">{label}</span>
          </span>
          <span className="block break-all text-xs">{video.originalName}</span>
          <span className="block text-xs text-muted-foreground">
            {formatDuration(video.durationMs)} ·{" "}
            {(
              info.container ??
              video.mimeType.split("/").pop() ??
              "?"
            ).toUpperCase()}
          </span>
          {sourceText && (
            <span className="block text-xs text-muted-foreground">
              {sourceText}
            </span>
          )}
        </button>
        {composite && (
          <details className="mt-1 text-xs text-muted-foreground">
            <summary className="cursor-pointer">Fontes pela ordem</summary>
            <ol className="list-decimal pl-5">
              {sources.map((id, index) => (
                <li key={`${id}-${index}`}>
                  {byId.get(id)?.originalName ?? "Origem removida"}
                </li>
              ))}
            </ol>
          </details>
        )}
        {node.relatedCompositions.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Incluído em {node.relatedCompositions.length}{" "}
            {node.relatedCompositions.length === 1 ? "junção" : "junções"}
          </p>
        )}
        {node.children.length > 0 && (
          <ul className="mt-1 space-y-1">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav aria-label="Vídeos e versões" className="space-y-2">
      {families.map(({ root, composite }) => (
        <details key={root.video.id} open className="rounded-md border p-2">
          <summary className="cursor-pointer text-sm font-semibold">
            {composite
              ? `Mini grupo · ${root.lineage.hasClipOperations || root.lineage.operations.length > 1 ? "Movie Maker" : "Junção"}`
              : root.lineage.isResult
                ? "Resultado sem origem disponível"
                : "Original"}
            : {root.video.originalName}
          </summary>
          <ul className="mt-2 space-y-1">{renderNode(root, 0)}</ul>
        </details>
      ))}
    </nav>
  );
}
