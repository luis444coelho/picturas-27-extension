"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import type { VideoRecipeStep } from "@/lib/video-access";
import {
  type VideoApiError,
  type VideoTarget,
  videoErrorCode,
} from "@/lib/videos";
import {
  submitVideoOperation,
  validateVideoSteps,
  videoTaskErrorMessage,
  type VideoValidation,
} from "@/lib/video-tasks";
import { isFinalStatus } from "@/lib/video-task-state";
import { stepErrorMessage } from "@/lib/video-edit";
import { useVideoTask } from "./use-video-task";

function errorText(error: unknown) {
  const data = axios.isAxiosError(error)
    ? (error.response?.data as VideoApiError | undefined)
    : undefined;
  const details = data?.error.details;
  const errors = details?.errors;
  const first = Array.isArray(errors)
    ? (errors[0] as { code?: string } | undefined)
    : undefined;
  const message = first?.code
    ? stepErrorMessage(first.code, first)
    : videoTaskErrorMessage(videoErrorCode(error));
  return data?.correlationId
    ? `${message} Código de suporte: ${data.correlationId}`
    : message;
}

// Mounted once per player, outside the operation dialog, so closing a panel
// does not lose the B003 task subscription or its completion invalidation.
export function useVideoEditSession(target: VideoTarget, videoId: string) {
  const tracking = useVideoTask(target);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);
  const busy =
    submitting ||
    Boolean(tracking.task && !isFinalStatus(tracking.task.status));
  const submit = async (step: VideoRecipeStep) => {
    if (busy || locked.current) return;
    locked.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const accepted = await submitVideoOperation(target, videoId, [step]);
      tracking.follow(accepted.taskId);
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      locked.current = false;
      setSubmitting(false);
    }
  };
  return { ...tracking, submit, busy, error, clearError: () => setError(null) };
}

export type VideoEditSession = ReturnType<typeof useVideoEditSession>;

// The serialized step is also the response identity: an old validation result
// cannot enable submission after the controls, video, or target have changed.
export function useVideoEditValidation(
  target: VideoTarget,
  videoId: string,
  step: VideoRecipeStep | null,
) {
  const key = JSON.stringify([target, videoId, step]);
  const [result, setResult] = useState<{
    key: string;
    validation?: VideoValidation;
    error?: string;
  } | null>(null);
  useEffect(() => {
    if (!step) return;
    let disposed = false;
    const timer = setTimeout(() => {
      validateVideoSteps(target, videoId, [step]).then(
        (validation) => {
          if (!disposed) setResult({ key, validation });
        },
        (cause) => {
          if (!disposed) setResult({ key, error: errorText(cause) });
        },
      );
    }, 300);
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
    // key includes every request argument; object identities change on render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const current = result?.key === key ? result : null;
  const errors =
    current?.validation?.errors.flatMap((item) => item.errors) ?? [];
  return {
    valid: Boolean(step && current?.validation?.valid),
    pending: Boolean(step && !current),
    output: current?.validation?.output,
    error: current?.error,
    errors,
  };
}
