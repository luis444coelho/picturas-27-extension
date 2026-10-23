"use client";

import { useState } from "react";
import type { ProjectVideo, VideoTarget } from "@/lib/videos";
import { chainCost } from "@/lib/video-chain";
import { useVideoInfo } from "./video-info-panel";
import { useComposition } from "./use-composition";
import { VideoCompositionSummary } from "./video-composition-summary";
import {
  VideoOperationChain,
  withDraft,
  type StepDraft,
  type StepItem,
} from "./video-operation-chain";
import type { StepInputProps } from "@/lib/video-chain";

// "Aplicar várias operações" (UC-VID-014 without a concat): a sequence of
// operations on one video, in an explicit order that can change, with no
// fixed number of steps (D-86), one credit per step for the Registered user,
// one task and one final video; the original stays as it is.
export function VideoMultiOperations({
  target,
  video,
}: {
  target: VideoTarget;
  video: ProjectVideo;
}) {
  const info = useVideoInfo(target, video.id);
  const [items, setItems] = useState<StepItem[]>([]);
  const [draft, setDraft] = useState<StepDraft | null>(null);
  const steps = withDraft(items, draft);
  const composition = useComposition(target, video.id, steps, steps.length > 0);
  const inputs = composition.result?.inputs;
  const meta: StepInputProps | undefined = info.data?.meta;

  // Properties at the input of step k: the video itself for the first step,
  // then the estimates of the server (CHAIN-003); unknown while validating.
  const inputOf = (k: number): StepInputProps | null => {
    if (k === 0) return meta ?? null;
    if (!inputs) return null;
    return (k < inputs.steps.length ? inputs.steps[k] : inputs.output) ?? null;
  };

  return (
    <div className="flex flex-col gap-4">
      <VideoOperationChain
        target={target}
        title={`Operações sobre ${video.originalName}`}
        items={items}
        onChange={setItems}
        onDraft={setDraft}
        composition={composition}
        addressOf={(index) => ({ index })}
        sourceOf={(k) => {
          const inputProps = inputOf(k);
          return inputProps
            ? {
                videoId: video.id,
                inputProps,
                isSource: k === 0,
                previewSteps: items.slice(0, k).map((item) => item.step),
              }
            : null;
        }}
        allowConvert
        disabled={composition.busy}
      />
      <VideoCompositionSummary
        composition={composition}
        cost={chainCost(items.map((item) => item.step))}
        ready={items.length > 0 && draft === null}
        showResolution={false}
        hint={items.length === 0 ? "Acrescenta pelo menos uma operação." : null}
      />
    </div>
  );
}
