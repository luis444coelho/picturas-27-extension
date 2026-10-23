"use client";

import { useEffect, type ReactNode } from "react";
import type { VideoRecipeStep } from "@/lib/video-access";
import type { VideoTarget } from "@/lib/videos";
import type { useVideoEditValidation } from "./use-video-edit";

// Contract of the configuration components extracted from the simple edit
// panels of B004, B005 and B007 (D-87, ADR-020). The same component serves the
// simple edit (which keeps its own submission) and the compositions of B008,
// so both show the same controls, defaults, ranges and validations.

import type { StepInputProps } from "@/lib/video-chain";

export type { StepInputProps };

export interface ConfigSource {
  videoId: string; // video of the chain (first clip after a concat)
  inputProps: StepInputProps;
  isSource: boolean; // the step receives the original video (D-89)
  previewSteps: VideoRecipeStep[]; // static steps before it (ADD T-07)
}

export type ConfigValidation = ReturnType<typeof useVideoEditValidation>;

export interface ConfigActions {
  step: VideoRecipeStep | null;
  validation: ConfigValidation;
  busy: boolean;
  beforeSubmit: () => void;
}

export interface OperationConfigProps<A extends ConfigActions = ConfigActions> {
  target: VideoTarget;
  source: ConfigSource;
  initial?: VideoRecipeStep | null;
  disabled: boolean;
  // Inside a composition, the validation of the step comes from the chain;
  // the simple edit validates the step on its own (useVideoEditValidation).
  chainValidation?: ConfigValidation;
  onStepChange?: (step: VideoRecipeStep | null) => void;
  // The submission of the simple panel, or "Guardar passo" of a composition,
  // rendered where the panel had its button.
  renderActions: (actions: A) => ReactNode;
}

export function simpleSource(
  videoId: string,
  inputProps: StepInputProps,
): ConfigSource {
  return { videoId, inputProps, isSource: true, previewSteps: [] };
}

// Initial value of a parameter when editing a step of a composition.
export function initialParam<T>(
  initial: VideoRecipeStep | null | undefined,
  key: string,
  fallback: T,
): T {
  const value = initial?.parameters?.[key];
  return value === undefined ? fallback : (value as T);
}

// Reports the step built by the form to the composition (no-op in the simple edit).
export function useReportStep(
  step: VideoRecipeStep | null,
  onStepChange?: (step: VideoRecipeStep | null) => void,
) {
  const key = JSON.stringify(step);
  useEffect(() => {
    onStepChange?.(step);
    // key identifies the step; the object identity changes on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
