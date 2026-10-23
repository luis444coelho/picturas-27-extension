"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useSession } from "@/providers/session-provider";
import {
  fetchProjectVideos,
  formatDuration,
  videoErrorCode,
  type ProjectVideo,
  type VideoApiError,
  type VideoTarget,
} from "@/lib/videos";
import type { VideoRecipeStep } from "@/lib/video-access";
import { stepErrorMessage } from "@/lib/video-edit";
import { visualStepErrorMessage } from "@/lib/video-visual";
import { conversionError } from "@/lib/video-convert";
import { videoTaskErrorMessage } from "@/lib/video-tasks";
import { isFinalStatus } from "@/lib/video-task-state";
import {
  addressLabel,
  canAddStep,
  canSaveAsPreset,
  canSubmitConcat,
  chainCost,
  chainErrorMessage,
  CHAIN_OPERATIONS,
  concatStep,
  countSteps,
  MAX_CLIPS,
  MAX_STEPS,
  operationLabel,
  quotaWarning,
  type ChainOperation,
  type StepAddress,
} from "@/lib/video-chain";
import {
  submitChain,
  validateChain,
  type ChainErrorEntry,
  type ChainValidation,
} from "@/lib/video-chain-api";
import { useVideoTask } from "./use-video-task";
import { VideoTaskProgress } from "./video-task-progress";
import { SortableList } from "./video-chain-step-list";
import { VideoChainStepForm } from "./video-chain-step-form";
import { VideoClipPicker } from "./video-clip-picker";
import { VideoChainPresets } from "./video-chain-presets";
import { VideoTaskPhase } from "./video-task-phase";

// Chain editor (UC-VID-014) and concat timeline (UC-VID-013): compose, order
// and configure the steps, see the cost and the estimates of the server, save
// and load presets, run the chain in one task and follow it. With a concat,
// every clip has its own sub-chain and the other steps apply to the result
// (FA1, D-78).
interface StepItem {
  key: string;
  step: VideoRecipeStep;
}
interface ClipItem {
  key: string;
  videoId: string;
  steps: StepItem[];
}
interface ChainState {
  clips: ClipItem[] | null; // null: no concat
  steps: StepItem[]; // steps of the chain, or final steps with a concat
}
// Where the editor adds steps or loads a preset: the chain, or one clip.
type ListId = "main" | number;

let counter = 0;
const newKey = () => `k${(counter += 1)}`;
const items = (steps: VideoRecipeStep[]): StepItem[] =>
  steps.map((step) => ({ key: newKey(), step }));

function toSteps({ clips, steps }: ChainState): VideoRecipeStep[] {
  const plain = steps.map((item) => item.step);
  if (!clips) return plain;
  return [
    concatStep(
      clips.map((clip) => ({
        videoId: clip.videoId,
        steps: clip.steps.map((i) => i.step),
      })),
    ),
    ...plain,
  ];
}

const GENERIC_STEP = "Os parâmetros da operação não são válidos.";

// Messages of the operation libraries of B004, B005 and B007, then the codes
// of the chain (D-79, D-80).
function stepMessage(error: {
  code: string;
  field?: string;
  [key: string]: unknown;
}) {
  const chainMessage = chainErrorMessage(error.code, error);
  if (chainMessage) return chainMessage;
  if (["SAME_FORMAT", "UNSUPPORTED_TARGET_FORMAT"].includes(error.code))
    return conversionError(error.code);
  if (error.code !== "NO_CHANGES" || error.field === "factor") {
    const basic = stepErrorMessage(error.code, error);
    if (basic !== GENERIC_STEP) return basic;
  }
  return visualStepErrorMessage(error.code, error);
}

function requestError(cause: unknown): {
  message: string;
  at: StepAddress | null;
} {
  const data = axios.isAxiosError(cause)
    ? (cause.response?.data as VideoApiError | undefined)
    : undefined;
  const code = data?.error.code ?? videoErrorCode(cause);
  const details = (data?.error.details ?? {}) as Record<string, unknown>;
  const errors = Array.isArray(details.errors)
    ? (details.errors as { code: string }[])
    : null;
  const message =
    (errors?.[0] && stepMessage(errors[0])) ||
    (code && chainErrorMessage(code, details)) ||
    videoTaskErrorMessage(code);
  const at = details as StepAddress;
  const support = data?.correlationId
    ? ` Código de suporte: ${data.correlationId}`
    : "";
  return {
    message: `${message}${support}`,
    at: at.index !== undefined || at.clipIndex !== undefined ? at : null,
  };
}

export function VideoChainEditor({
  target,
  video,
  startWithConcat,
}: {
  target: VideoTarget;
  video: ProjectVideo | null;
  startWithConcat: boolean;
}) {
  const session = useSession();
  const tracking = useVideoTask(target);
  const [state, setState] = useState<ChainState>(() =>
    startWithConcat
      ? {
          clips: video ? [{ key: newKey(), videoId: video.id, steps: [] }] : [],
          steps: [],
        }
      : { clips: null, steps: [] },
  );
  const [editing, setEditing] = useState<{
    list: ListId;
    index: number | null;
    operation: ChainOperation;
  } | null>(null);
  const [adding, setAdding] = useState<ChainOperation>("trim");
  const [addTo, setAddTo] = useState<ListId>("main");
  const [validation, setValidation] = useState<{
    key: string;
    result?: ChainValidation;
    error?: { message: string; at: StepAddress | null };
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const locked = useRef(false);

  const videos = useQuery({
    queryKey: ["projectVideos", target.pid, target.ownerId, target.shareId],
    queryFn: () => fetchProjectVideos(target),
  });
  const byId = useMemo(
    () => new Map((videos.data ?? []).map((v) => [v.id, v])),
    [videos.data],
  );

  const steps = toSteps(state);
  const total = countSteps(steps);
  const cost = chainCost(steps);
  const ready = steps.length > 0 && canSubmitConcat(steps);
  const key = JSON.stringify([target.pid, video?.id ?? null, steps]);
  const busy =
    submitting ||
    Boolean(tracking.task && !isFinalStatus(tracking.task.status));

  // Real-time validation with debounce; an old answer never counts (ADD T-01).
  useEffect(() => {
    if (!ready) return;
    let disposed = false;
    const timer = setTimeout(() => {
      validateChain(target, video?.id ?? null, steps).then(
        (result) => !disposed && setValidation({ key, result }),
        (cause) =>
          !disposed && setValidation({ key, error: requestError(cause) }),
      );
    }, 300);
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
    // key includes every request argument; object identities change on render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);
  const current = ready && validation?.key === key ? validation : null;
  const valid = Boolean(current?.result?.valid);
  const output = current?.result?.output as
    Record<string, number> | null | undefined;
  const stepErrors: ChainErrorEntry[] = current?.result?.errors ?? [];

  const errorFor = (address: StepAddress): string | null => {
    const entry = stepErrors.find(
      (e) =>
        e.index === address.index &&
        e.clipIndex === address.clipIndex &&
        e.stepIndex === address.stepIndex,
    );
    if (entry) return entry.errors.map(stepMessage).join(" ");
    const at = current?.error?.at;
    if (
      at &&
      at.index === address.index &&
      at.clipIndex === address.clipIndex &&
      at.stepIndex === address.stepIndex
    )
      return current?.error?.message ?? null;
    return null;
  };

  // ---- editing ---------------------------------------------------------

  const listOf = (list: ListId): StepItem[] =>
    list === "main" ? state.steps : (state.clips?.[list]?.steps ?? []);

  const setList = (list: ListId, next: StepItem[]) =>
    setState((s) =>
      list === "main"
        ? { ...s, steps: next }
        : {
            ...s,
            clips: (s.clips ?? []).map((clip, i) =>
              i === list ? { ...clip, steps: next } : clip,
            ),
          },
    );

  const saveStep = (step: VideoRecipeStep) => {
    if (!editing) return;
    const list = listOf(editing.list);
    const next =
      editing.index === null
        ? [...list, { key: newKey(), step }]
        : list.map((item, i) =>
            i === editing.index ? { ...item, step } : item,
          );
    setList(editing.list, next);
    setEditing(null);
  };

  const addConcat = () =>
    setState((s) => ({
      clips: [
        { key: newKey(), videoId: video?.id ?? "", steps: s.steps },
      ].filter((c) => c.videoId),
      steps: [],
    }));

  const addClip = (picked: ProjectVideo) =>
    setState((s) => ({
      ...s,
      clips: [
        ...(s.clips ?? []),
        { key: newKey(), videoId: picked.id, steps: [] },
      ],
    }));

  const loadPreset = (list: ListId, presetSteps: VideoRecipeStep[]) => {
    if (
      listOf(list).length &&
      !window.confirm("Substituir os passos desta lista pelos da predefinição?")
    )
      return;
    setList(list, items(presetSteps));
  };

  const submit = async () => {
    if (busy || locked.current) return;
    locked.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const accepted = await submitChain(target, video?.id ?? null, steps);
      tracking.follow(accepted.taskId);
    } catch (cause) {
      setSubmitError(requestError(cause).message);
    } finally {
      locked.current = false;
      setSubmitting(false);
    }
  };

  // ---- rendering ---------------------------------------------------------

  const stepRow = (list: ListId) =>
    function renderStep(item: StepItem, index: number) {
      const address: StepAddress =
        list === "main"
          ? { index: state.clips ? index + 1 : index }
          : { index: 0, clipIndex: list, stepIndex: index };
      const error = errorFor(address);
      return (
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span>
              {index + 1}. {operationLabel(item.step.operation)}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() =>
                setEditing({
                  list,
                  index,
                  operation: item.step.operation as ChainOperation,
                })
              }
            >
              Configurar
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
        </div>
      );
    };

  const maxClips = MAX_CLIPS[session.user.type] ?? MAX_CLIPS.free;
  const warning = quotaWarning(
    session.user.type,
    session.user.remaining_operations,
    cost,
  );
  const topError =
    current?.error && !current.error.at ? current.error.message : null;
  const lists: { id: ListId; label: string }[] = [
    { id: "main", label: state.clips ? "Passos depois da junção" : "Cadeia" },
    ...(state.clips ?? []).map((clip, i) => ({
      id: i as ListId,
      label: `Clip ${i + 1}: ${byId.get(clip.videoId)?.originalName ?? clip.videoId}`,
    })),
  ];

  return (
    <div className="flex flex-col gap-4 text-sm">
      {state.clips && (
        <section className="flex flex-col gap-2">
          <h3 className="font-medium">
            Linha temporal ({state.clips.length} de {maxClips} clips)
          </h3>
          <SortableList
            items={state.clips}
            disabled={busy}
            onChange={(clips) => setState((s) => ({ ...s, clips }))}
            render={(clip, clipIndex) => {
              const source = byId.get(clip.videoId);
              const error = errorFor({ clipIndex });
              return (
                <div className="flex flex-col gap-1">
                  <span className="truncate">
                    {source?.originalName ?? clip.videoId}
                    {source ? ` · ${formatDuration(source.durationMs)}` : ""}
                  </span>
                  {error && (
                    <p role="alert" className="text-destructive">
                      {error}
                    </p>
                  )}
                  <SortableList
                    items={clip.steps}
                    disabled={busy}
                    onChange={(next) => setList(clipIndex, next)}
                    render={stepRow(clipIndex)}
                  />
                </div>
              );
            }}
          />
          <VideoClipPicker
            videos={videos.data ?? []}
            loading={videos.isLoading}
            disabled={busy || state.clips.length >= maxClips}
            onPick={addClip}
          />
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="font-medium">{lists[0].label}</h3>
        <SortableList
          items={state.steps}
          disabled={busy}
          onChange={(next) => setList("main", next)}
          render={stepRow("main")}
        />
      </section>

      {editing ? (
        <VideoChainStepForm
          key={`${editing.list}-${editing.index}-${editing.operation}`}
          operation={editing.operation}
          initial={
            editing.index === null
              ? undefined
              : listOf(editing.list)[editing.index]?.step
          }
          target={target}
          onSave={saveStep}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            Operação
            <select
              className="rounded-md border bg-background p-2"
              value={adding}
              onChange={(e) => setAdding(e.target.value as ChainOperation)}
            >
              {CHAIN_OPERATIONS.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.label}
                </option>
              ))}
            </select>
          </label>
          {state.clips && (
            <label className="flex flex-col gap-1">
              Em
              <select
                className="rounded-md border bg-background p-2"
                value={String(addTo)}
                onChange={(e) =>
                  setAddTo(
                    e.target.value === "main" ? "main" : Number(e.target.value),
                  )
                }
              >
                {lists.map((l) => (
                  <option key={String(l.id)} value={String(l.id)}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={busy || !canAddStep(steps)}
            onClick={() =>
              setEditing({
                list: state.clips ? addTo : "main",
                index: null,
                operation: adding,
              })
            }
          >
            Acrescentar passo
          </Button>
          {!state.clips && video && (
            <Button
              type="button"
              variant="outline"
              disabled={busy || !canAddStep(steps)}
              onClick={addConcat}
            >
              Acrescentar junção
            </Button>
          )}
        </div>
      )}

      <VideoChainPresets
        lists={lists}
        canSave={canSaveAsPreset(state.clips ? [] : steps)}
        currentSteps={state.clips ? [] : steps}
        onLoad={loadPreset}
        disabled={busy}
      />

      <div aria-live="polite" className="flex flex-col gap-1">
        <p>
          {total} de {MAX_STEPS} passos · {cost}{" "}
          {cost === 1 ? "crédito" : "créditos"}
        </p>
        {output?.durationMs !== undefined && (
          <p>Duração estimada: {formatDuration(output.durationMs)}</p>
        )}
        {state.clips && output?.width !== undefined && (
          <p>
            Resultado: {output.width}×{output.height} a{" "}
            {Math.round((output.fpsNum / output.fpsDen) * 100) / 100} fps
          </p>
        )}
        {ready && !current && <p>A validar…</p>}
      </div>
      {state.clips && state.clips.length < 2 && (
        <p>Escolhe pelo menos dois vídeos para juntar.</p>
      )}
      {warning && <p className="text-amber-600">{warning}</p>}
      {topError && (
        <p role="alert" className="text-destructive">
          {topError}
        </p>
      )}
      {submitError && (
        <p role="alert" className="text-destructive">
          {submitError}
        </p>
      )}
      <Button
        type="button"
        disabled={!valid || busy}
        onClick={() => void submit()}
      >
        Executar · {cost} {cost === 1 ? "crédito" : "créditos"}
      </Button>
      {tracking.task && (
        <div className="flex flex-col gap-1">
          <VideoTaskProgress
            task={tracking.task}
            canCancel
            onCancel={tracking.cancel}
          />
          <VideoTaskPhase task={tracking.task} />
        </div>
      )}
    </div>
  );
}
