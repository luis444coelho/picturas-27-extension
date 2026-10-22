"use client";

import { fieldLabel, visualStepErrorMessage } from "@/lib/video-visual";
import type { useVideoEditValidation } from "./use-video-edit";

export function VideoVisualValidation({
  validation,
}: {
  validation: ReturnType<typeof useVideoEditValidation>;
}) {
  return (
    <div className="text-sm" aria-live="polite">
      {validation.pending && <p>A validar…</p>}
      {validation.error && (
        <p className="text-destructive" role="alert">
          {validation.error}
        </p>
      )}
      {validation.errors.map((error, index) => {
        const label = fieldLabel(error.field);
        return (
          <p key={index} className="text-destructive" role="alert">
            {label && <span>{label}: </span>}
            {visualStepErrorMessage(error.code, error)}
          </p>
        );
      })}
    </div>
  );
}
