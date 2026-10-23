"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoTarget } from "@/lib/videos";
import type { VideoRecipeStep } from "@/lib/video-access";
import { isFinalStatus } from "@/lib/video-task-state";
import type { StepAddress } from "@/lib/video-chain";
import {
  submitChain,
  validateChainWithInputs,
  type ChainErrorEntry,
  type ChainValidation,
} from "@/lib/video-chain-api";
import { useVideoTask } from "./use-video-task";
import { requestError, stepMessage } from "./composition-messages";
import type { ConfigValidation } from "./operation-config";

// State of a composition (the three B008 flows): real-time validation of the
// whole chain with the input properties of every step (…/chain/validate,
// debounced, the newest answer wins), submission in one task and following
// of the task (B003). videoId is null for chains with a concat (D-78).
export function useComposition(
  target: VideoTarget,
  videoId: string | null,
  steps: VideoRecipeStep[],
  ready: boolean,
) {
  const tracking = useVideoTask(target);
  const key = JSON.stringify([target.pid, videoId, steps]);
  const [state, setState] = useState<{
    key: string;
    result?: ChainValidation;
    error?: { message: string; at: StepAddress | null };
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const locked = useRef(false);

  useEffect(() => {
    if (!ready) return;
    let disposed = false;
    const timer = setTimeout(() => {
      validateChainWithInputs(target, videoId, steps).then(
        (result) => !disposed && setState({ key, result }),
        (cause) => !disposed && setState({ key, error: requestError(cause) }),
      );
    }, 300);
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
    // key includes every request argument; object identities change on render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);

  const current = ready && state?.key === key ? state : null;
  const errors: ChainErrorEntry[] = current?.result?.errors ?? [];
  const busy =
    submitting ||
    Boolean(tracking.task && !isFinalStatus(tracking.task.status));

  const sameAddress = (a: StepAddress, b: StepAddress) =>
    a.index === b.index &&
    a.clipIndex === b.clipIndex &&
    a.stepIndex === b.stepIndex;

  // Errors of one step or clip, from the step errors (200) or the request error (422).
  function errorsAt(address: StepAddress): string[] {
    const entry = errors.find((e) => sameAddress(e, address));
    if (entry) return entry.errors.map(stepMessage);
    const at = current?.error?.at;
    return at && sameAddress(at, address) && current?.error
      ? [current.error.message]
      : [];
  }

  // Validation of one step for its configuration component (ADR-020).
  function validationAt(address: StepAddress): ConfigValidation {
    const entry = errors.find((e) => sameAddress(e, address));
    const at = current?.error?.at;
    const failedHere = Boolean(at && sameAddress(at, address));
    return {
      valid: Boolean(current?.result && !entry),
      pending: ready && !current,
      output: current?.result?.output ?? undefined,
      error: failedHere ? current?.error?.message : undefined,
      errors: entry?.errors ?? [],
    };
  }

  const submit = async () => {
    if (busy || locked.current) return;
    locked.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const accepted = await submitChain(target, videoId, steps);
      tracking.follow(accepted.taskId);
    } catch (cause) {
      setSubmitError(requestError(cause).message);
    } finally {
      locked.current = false;
      setSubmitting(false);
    }
  };

  return {
    result: current?.result ?? null,
    requestError:
      current?.error && !current.error.at ? current.error.message : null,
    pending: ready && !current,
    valid: Boolean(current?.result?.valid),
    errorsAt,
    validationAt,
    submit,
    submitError,
    busy,
    tracking,
  };
}

export type Composition = ReturnType<typeof useComposition>;
