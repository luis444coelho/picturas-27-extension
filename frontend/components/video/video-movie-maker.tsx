"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  fetchProjectVideos,
  formatDuration,
  type VideoTarget,
} from "@/lib/videos";
import {
  chainCost,
  concatStep,
  MIN_CLIPS,
  type StepInputProps,
} from "@/lib/video-chain";
import { useComposition } from "./use-composition";
import { VideoCompositionSummary } from "./video-composition-summary";
import { SortableList } from "./video-chain-step-list";
import { VideoClipPicker } from "./video-clip-picker";
import {
  newKey,
  VideoOperationChain,
  withDraft,
  type StepDraft,
  type StepItem,
} from "./video-operation-chain";

// Movie Maker (UC-VID-014 FA1, D-78): N videos, each with its own chain of
// operations (possibly empty), joined in the user's order, then a chain on
// the joined result:
//   ((V1 × F…) + (V2 × F…) + … + (Vn × F…)) × F…
// The concat works on the results of the chains (_clips, ADR-016), the whole
// composition is one task, only the final video is added to the project and
// the originals stay as they are. No fixed number of videos or steps (D-86).
interface ClipItem {
  key: string;
  videoId: string;
  steps: StepItem[];
}
type ListId = number | "finals";

export function VideoMovieMaker({ target }: { target: VideoTarget }) {
  const videos = useQuery({
    queryKey: ["projectVideos", target.pid, target.ownerId, target.shareId],
    queryFn: () => fetchProjectVideos(target),
  });
  const byId = new Map((videos.data ?? []).map((v) => [v.id, v]));
  const [clips, setClips] = useState<ClipItem[]>([]);
  const [finals, setFinals] = useState<StepItem[]>([]);
  const [draft, setDraft] = useState<{ list: ListId; draft: StepDraft } | null>(
    null,
  );

  const listItems = (list: ListId) =>
    list === "finals" ? finals : (clips[list]?.steps ?? []);
  const draftOf = (list: ListId) =>
    draft && draft.list === list ? draft.draft : null;
  const ready = clips.length >= MIN_CLIPS;
  const steps = [
    concatStep(
      clips.map((clip, i) => ({
        videoId: clip.videoId,
        steps: withDraft(clip.steps, draftOf(i)),
      })),
    ),
    ...withDraft(finals, draftOf("finals")),
  ];
  const composition = useComposition(target, null, steps, ready);
  const inputs = composition.result?.inputs;
  const saved = [
    concatStep(
      clips.map((clip) => ({
        videoId: clip.videoId,
        steps: clip.steps.map((item) => item.step),
      })),
    ),
    ...finals.map((item) => item.step),
  ];

  // Input of step k of clip i: the video itself for the first step, then the
  // estimates of the server (CHAIN-003); the clip output after its last step.
  const clipInput = (i: number, k: number): StepInputProps | null => {
    const video = byId.get(clips[i].videoId);
    if (k === 0 && video)
      return {
        durationMs: video.durationMs,
        displayWidth: video.displayWidth,
        displayHeight: video.displayHeight,
      };
    if (!inputs) return null;
    return (
      (k < (inputs.clips[i]?.length ?? 0)
        ? inputs.clips[i][k]
        : inputs.clipOutputs[i]) ?? null
    );
  };
  // Input of the final step k: after the concat (step 0 of the top level).
  const finalInput = (k: number): StepInputProps | null => {
    if (!inputs) return null;
    return (
      (k + 1 < inputs.steps.length ? inputs.steps[k + 1] : inputs.output) ??
      null
    );
  };
  const updateClip = (i: number, next: StepItem[]) =>
    setClips((current) =>
      current.map((clip, j) => (j === i ? { ...clip, steps: next } : clip)),
    );

  return (
    <div className="flex flex-col gap-4 text-sm">
      <section className="flex flex-col gap-2">
        <h3 className="font-medium">
          Vídeos e as suas operações ({clips.length})
        </h3>
        {clips.length === 0 && (
          <p className="text-muted-foreground">
            Acrescenta os vídeos da composição; cada um tem a sua própria cadeia
            de operações.
          </p>
        )}
        <SortableList
          items={clips}
          disabled={composition.busy || draft !== null}
          onChange={setClips}
          render={(clip, i) => {
            const source = byId.get(clip.videoId);
            return (
              <div className="flex flex-col gap-2 rounded-md bg-muted/30 p-2">
                <span className="truncate font-medium">
                  Vídeo {i + 1}: {source?.originalName ?? clip.videoId}
                  {source ? ` · ${formatDuration(source.durationMs)}` : ""}
                </span>
                {composition.errorsAt({ clipIndex: i }).map((message, j) => (
                  <p key={j} role="alert" className="text-destructive">
                    {message}
                  </p>
                ))}
                <VideoOperationChain
                  target={target}
                  title={`Operações do vídeo ${i + 1}`}
                  items={clip.steps}
                  onChange={(next) => updateClip(i, next)}
                  onDraft={(next) =>
                    setDraft(next ? { list: i, draft: next } : null)
                  }
                  composition={composition}
                  addressOf={(k) => ({ index: 0, clipIndex: i, stepIndex: k })}
                  sourceOf={(k) => {
                    const inputProps = clipInput(i, k);
                    return inputProps
                      ? {
                          videoId: clip.videoId,
                          inputProps,
                          isSource: k === 0,
                          previewSteps: clip.steps
                            .slice(0, k)
                            .map((item) => item.step),
                        }
                      : null;
                  }}
                  allowConvert={false}
                  disabled={composition.busy}
                />
              </div>
            );
          }}
        />
        <VideoClipPicker
          videos={videos.data ?? []}
          loading={videos.isLoading}
          disabled={composition.busy || draft !== null}
          onPick={(picked) =>
            setClips((current) => [
              ...current,
              { key: newKey(), videoId: picked.id, steps: [] },
            ])
          }
        />
      </section>

      <section className="flex flex-col gap-2 rounded-md border p-3">
        <VideoOperationChain
          target={target}
          title="Operações depois da junção"
          items={finals}
          onChange={setFinals}
          onDraft={(next) =>
            setDraft(next ? { list: "finals", draft: next } : null)
          }
          composition={composition}
          addressOf={(k) => ({ index: k + 1 })}
          sourceOf={(k) => {
            const inputProps = finalInput(k);
            return inputProps && clips[0]
              ? {
                  videoId: clips[0].videoId,
                  inputProps,
                  isSource: false,
                  previewSteps: [
                    ...clips[0].steps.map((item) => item.step),
                    ...finals.slice(0, k).map((item) => item.step),
                  ],
                }
              : null;
          }}
          allowConvert
          disabled={composition.busy || !ready}
        />
        {!ready && (
          <p className="text-muted-foreground">
            As operações depois da junção ficam disponíveis com pelo menos dois
            vídeos.
          </p>
        )}
      </section>

      <VideoCompositionSummary
        composition={composition}
        cost={chainCost(saved)}
        ready={ready && draft === null}
        showResolution
        hint={ready ? null : "Acrescenta pelo menos dois vídeos."}
      />
      {clips.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          className="self-start"
          disabled={composition.busy}
          onClick={() => {
            if (window.confirm("Recomeçar a composição?")) {
              setClips([]);
              setFinals([]);
            }
          }}
        >
          Recomeçar
        </Button>
      )}
    </div>
  );
}
