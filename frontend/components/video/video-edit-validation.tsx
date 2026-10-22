"use client";

import { stepErrorMessage } from "@/lib/video-edit";
import type { useVideoEditValidation } from "./use-video-edit";

export function VideoEditValidation({
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
      {validation.errors.map((error, index) => (
        <p key={index} className="text-destructive" role="alert">
          {error.field && (
            <span>
              {error.field === "startMs"
                ? "Início"
                : error.field === "endMs"
                  ? "Fim"
                  : "Fator"}
              :{" "}
            </span>
          )}
          {stepErrorMessage(error.code, error)}
        </p>
      ))}
    </div>
  );
}
