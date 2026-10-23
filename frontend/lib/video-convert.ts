import type { VideoRecipeStep } from "./video-access";
import { formatVideoFormat } from "./video-format";

export const VIDEO_CONTAINERS = ["mp4", "mov", "avi"] as const;
export type VideoContainer = (typeof VIDEO_CONTAINERS)[number];

export function isVideoContainer(value: string): value is VideoContainer {
  return VIDEO_CONTAINERS.some((container) => container === value);
}

export function conversionTargets(source: VideoContainer): VideoContainer[] {
  return VIDEO_CONTAINERS.filter((container) => container !== source);
}

export function convertStep(target: VideoContainer): VideoRecipeStep {
  return { operation: "convert", version: 1, parameters: { target } };
}

// The output codecs and stream modes come from /videos/validate, not from a
// duplicate of the T-05 matrix in the browser (CONVERT-003, D-72).
export function conversionVerdict(output: Record<string, unknown> | null): {
  format: string;
  mode: string;
} | null {
  if (
    !output ||
    typeof output.container !== "string" ||
    typeof output.videoCodec !== "string" ||
    (typeof output.audioCodec !== "string" && output.audioCodec !== null)
  )
    return null;
  const videoMode = output.videoMode;
  const audioMode = output.audioMode;
  if (
    (videoMode !== "copy" && videoMode !== "encode") ||
    (audioMode !== "copy" && audioMode !== "encode" && audioMode !== "none")
  )
    return null;
  const direct = videoMode === "copy" && audioMode !== "encode";
  const detail =
    videoMode !== audioMode && audioMode !== "none"
      ? ` (vídeo: ${videoMode === "copy" ? "cópia" : "recodificação"}; áudio: ${audioMode === "copy" ? "cópia" : "recodificação"})`
      : "";
  return {
    format: formatVideoFormat(
      output.container,
      output.videoCodec,
      output.audioCodec,
    ),
    mode: `${direct ? "Cópia direta (sem perda de qualidade)" : "Recodificação"}${detail}`,
  };
}

export function conversionError(code: string): string {
  if (code === "SAME_FORMAT") return "Escolhe um formato diferente do atual.";
  if (code === "UNSUPPORTED_TARGET_FORMAT")
    return "Formato de saída não suportado.";
  return "Os parâmetros da conversão não são válidos.";
}
