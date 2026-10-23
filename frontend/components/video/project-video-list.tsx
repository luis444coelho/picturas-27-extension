"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  useCanEditProject,
  useProjectInfo,
} from "@/providers/project-provider";
import { useSession } from "@/providers/session-provider";
import { fetchProjectVideos } from "@/lib/videos";
import { fetchVideoLineage } from "@/lib/video-lineage";
import { isFinalStatus } from "@/lib/video-task-state";
import { useVideoTarget } from "./use-video-target";
import { useVideoIngestEvents } from "./use-video-ingest-events";
import { useVideoTask } from "./use-video-task";
import { VideoTaskProgress } from "./video-task-progress";
import { VideoGallery } from "./video-gallery";
import { VideoPlayer } from "./video-player";
import { VideoUpload } from "./video-upload";
import { VideoWorkspaceTools } from "./video-workspace-tools";

const ignoreUpdate = () => undefined;

// The page already mounts this component beside the image area (D-31).
// The workspace covers that area by CSS when videos are selected, keeping
// page.tsx and its image JSX untouched (D-91/D-92).
export function ProjectVideoList() {
  const session = useSession();
  const target = useVideoTarget();
  const project = useProjectInfo();
  const canEdit = useCanEditProject();
  const search = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [mobileTab, setMobileTab] = useState<"versions" | "reader" | "tools">(
    "reader",
  );
  const anonymous = session.user.type === "anonymous";
  const videos = useQuery({
    queryKey: ["projectVideos", target.pid, target.ownerId, target.shareId],
    queryFn: () => fetchProjectVideos(target),
    enabled: !anonymous,
    refetchInterval: 10 * 60 * 1000,
  });
  const lineage = useQuery({
    queryKey: [
      "videoLineage",
      target.pid,
      target.ownerId,
      target.shareId,
      (videos.data ?? []).map((video) => video.id).join(","),
    ],
    queryFn: () => fetchVideoLineage(target),
    enabled: !anonymous && Boolean(videos.data?.length),
  });
  const task = useVideoTask(target);
  useVideoIngestEvents(target.pid, ignoreUpdate);

  useEffect(() => {
    if (selectedId === null && videos.data?.length) {
      setSelectedId(videos.data[0].id);
    }
  }, [selectedId, videos.data]);

  const preference = search.get("resource");
  const active =
    preference === "videos" ||
    (preference !== "images" && project.imgs.length === 0);
  if (!active) return null;

  const selected = videos.data?.find((item) => item.id === selectedId) ?? null;
  const completed =
    task.task?.status === "completed" ? task.task.resultVideoId : null;
  const resultReady = Boolean(
    completed && videos.data?.some((item) => item.id === completed),
  );
  const canUpload = !anonymous && canEdit;

  return (
    <>
      <style>{`div:has(> .video-workspace-root[data-active="true"]) > :not(.video-workspace-root):not(style) { display: none !important; }`}</style>
      <div
        data-active="true"
        className="video-workspace-root flex min-w-0 flex-1 flex-col overflow-hidden bg-background"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
          <div>
            <h2 className="font-semibold">Vídeos do projeto</h2>
            <p className="text-xs text-muted-foreground">
              Seleciona um vídeo para ver e editar as suas versões.
            </p>
          </div>
          {canUpload && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUpload((value) => !value)}
            >
              Adicionar vídeo
            </Button>
          )}
        </div>
        {canUpload && (
          <div className={showUpload ? "border-b p-3" : "hidden"}>
            <VideoUpload target={target} />
          </div>
        )}
        {task.task && (
          <div
            className="border-b bg-muted/30 p-3"
            role="status"
            aria-live="polite"
          >
            <VideoTaskProgress
              task={task.task}
              canCancel={!isFinalStatus(task.task.status)}
              onCancel={task.cancel}
            />
            {resultReady && (
              <Button
                className="mt-2"
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedId(completed!);
                  setMobileTab("reader");
                }}
              >
                Abrir resultado
              </Button>
            )}
          </div>
        )}
        {anonymous ? (
          <p className="p-4 text-sm">
            Os vídeos estão disponíveis para utilizadores registados e Premium.
          </p>
        ) : videos.isLoading ? (
          <p className="p-4 text-sm" role="status">
            A carregar vídeos…
          </p>
        ) : videos.isError ? (
          <div className="p-4 text-sm" role="alert">
            Não foi possível carregar os vídeos.{" "}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void videos.refetch()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : videos.data?.length && lineage.isLoading ? (
          <p className="p-4 text-sm" role="status">
            A carregar versões…
          </p>
        ) : videos.data?.length && lineage.isError ? (
          <div className="p-4 text-sm" role="alert">
            Não foi possível carregar as versões.{" "}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void lineage.refetch()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : !videos.data?.length ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <p>Adiciona imagens ou vídeos para começar.</p>
            <p className="text-sm text-muted-foreground">
              Escolhe «Imagens» para adicionar imagens ou «Adicionar vídeo» para
              carregar um vídeo.
            </p>
          </div>
        ) : (
          <>
            <div
              className="flex gap-1 border-b p-2 lg:hidden"
              aria-label="Secções do vídeo"
            >
              {(["versions", "reader", "tools"] as const).map((tab) => (
                <Button
                  key={tab}
                  type="button"
                  size="sm"
                  variant={mobileTab === tab ? "default" : "outline"}
                  onClick={() => setMobileTab(tab)}
                >
                  {
                    {
                      versions: "Versões",
                      reader: "Leitor",
                      tools: "Ferramentas",
                    }[tab]
                  }
                </Button>
              ))}
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(14rem,22%)_minmax(0,1fr)_minmax(18rem,30%)]">
              <aside
                className={`${mobileTab === "versions" ? "block" : "hidden"} min-h-0 overflow-y-auto border-r p-3 lg:block`}
                aria-label="Vídeos e versões"
              >
                <VideoGallery
                  videos={videos.data}
                  lineage={lineage.data ?? []}
                  selectedId={selectedId}
                  onSelect={(id) => {
                    setSelectedId(id);
                    setMobileTab("reader");
                  }}
                />
              </aside>
              <main
                className={`${mobileTab === "reader" ? "block" : "hidden"} min-h-0 overflow-y-auto p-3 lg:block`}
              >
                {selected ? (
                  <VideoPlayer target={target} video={selected} />
                ) : (
                  <p role="status">
                    O vídeo selecionado deixou de estar disponível. Escolhe
                    outra versão.
                  </p>
                )}
              </main>
              <aside
                className={`${mobileTab === "tools" ? "block" : "hidden"} min-h-0 overflow-y-auto border-l p-3 lg:block`}
              >
                <VideoWorkspaceTools
                  key={selectedId ?? "none"}
                  target={target}
                  video={selected}
                />
              </aside>
            </div>
          </>
        )}
      </div>
    </>
  );
}
