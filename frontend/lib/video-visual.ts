import type { VideoRecipeStep } from "./video-access";

// B005 visual edits (UC-VID-004, UC-VID-008 to 011). UI values and helpers
// without imports at runtime, so they run in the Node tests; the API calls
// are in video-visual-api.ts. Validation is owned by the projects service.

// ---- steps ------------------------------------------------------------------

export const ADJUST_STEP = 0.05;
export const NEUTRAL_ADJUST = {
  brightness: 1,
  contrastFactor: 1,
  saturationFactor: 1,
};
export type AdjustValues = typeof NEUTRAL_ADJUST;

export const adjustStep = (values: AdjustValues): VideoRecipeStep => ({
  operation: "adjust",
  version: 1,
  parameters: { ...values },
});

export type FilterId = "bw" | "sepia" | "negative" | "vintage" | "cold" | "warm";
export const FILTERS: { id: FilterId; label: string }[] = [
  { id: "bw", label: "Preto e Branco" },
  { id: "sepia", label: "Sépia" },
  { id: "negative", label: "Negativo" },
  { id: "vintage", label: "Vintage" },
  { id: "cold", label: "Frio" },
  { id: "warm", label: "Quente" },
];
export const filterStep = (filter: FilterId): VideoRecipeStep => ({
  operation: "filter",
  version: 1,
  parameters: { filter },
});

export const resizeStep = (width: number, height: number): VideoRecipeStep => ({
  operation: "resize",
  version: 1,
  parameters: { width, height },
});

export type Rotation = 0 | 90 | 180 | 270;
export interface OrientValues {
  rotation: Rotation;
  flipH: boolean;
  flipV: boolean;
}
export const orientStep = (values: OrientValues): VideoRecipeStep => ({
  operation: "orient",
  version: 1,
  parameters: { ...values },
});

export type WatermarkPreset =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";
export const WATERMARK_PRESETS: { id: WatermarkPreset; label: string }[] = [
  { id: "top-left", label: "Canto superior esquerdo" },
  { id: "top-right", label: "Canto superior direito" },
  { id: "bottom-left", label: "Canto inferior esquerdo" },
  { id: "bottom-right", label: "Canto inferior direito" },
  { id: "center", label: "Centro" },
];
export const WATERMARK_TEXT_MAX = 100;
export const WATERMARK_MAX_BYTES = 1024 * 1024;
export type WatermarkPosition = { preset: WatermarkPreset } | { x: number; y: number };
export interface WatermarkValues {
  type: "text" | "image";
  text: string;
  watermarkId: string | null;
  position: WatermarkPosition;
  scale: number;
  opacity: number;
}
export function watermarkStep(values: WatermarkValues): VideoRecipeStep | null {
  const common = {
    position: values.position,
    scale: values.scale,
    opacity: values.opacity,
  };
  if (values.type === "text") {
    if (!values.text.trim()) return null;
    return {
      operation: "watermark",
      version: 1,
      parameters: { type: "text", text: values.text, ...common },
    };
  }
  if (!values.watermarkId) return null;
  return {
    operation: "watermark",
    version: 1,
    parameters: { type: "image", watermarkId: values.watermarkId, ...common },
  };
}

// ---- resize panel (ADD 4.5, D-64) -------------------------------------------

export const RESIZE_PRESETS = [1080, 720, 480, 360];
export const RESIZE_MIN = 128;

// Nearest even integer (RESIZE-002: 1000 for 1920×1080 gives 562).
export function nearestEven(value: number): number {
  const lower = Math.floor(value / 2) * 2;
  return value - lower <= 1 ? lower : lower + 2;
}

export function lockedHeight(width: number, sourceW: number, sourceH: number) {
  return nearestEven((width * sourceH) / sourceW);
}
export function lockedWidth(height: number, sourceW: number, sourceH: number) {
  return nearestEven((height * sourceW) / sourceH);
}

// D-64: a preset applies to the smaller presentation dimension, so "720p" is
// 720×1280 for a portrait video; for landscape it is the height (RESIZE-003).
export function presetSize(preset: number, sourceW: number, sourceH: number) {
  if (sourceW >= sourceH)
    return { width: lockedWidth(preset, sourceW, sourceH), height: preset };
  return { width: preset, height: lockedHeight(preset, sourceW, sourceH) };
}

export function resizeWarnings(
  width: number,
  height: number,
  sourceW: number,
  sourceH: number,
) {
  return {
    distorted: Math.abs(width / height - sourceW / sourceH) > 0.01,
    enlarged: width > sourceW || height > sourceH,
  };
}

// ---- orientation panel -------------------------------------------------------

export function orientedSize(values: OrientValues, sourceW: number, sourceH: number) {
  const even = (n: number) => n - (n % 2);
  const swap = values.rotation === 90 || values.rotation === 270;
  return swap
    ? { width: even(sourceH), height: even(sourceW) }
    : { width: even(sourceW), height: even(sourceH) };
}

export const isOrientIdentity = ({ rotation, flipH, flipV }: OrientValues) =>
  (rotation === 0 && !flipH && !flipV) || (rotation === 180 && flipH && flipV);

export function isAcceptedWatermarkFile(file: File) {
  return (
    (file.type === "image/png" || file.type === "image/jpeg") &&
    file.size > 0 &&
    file.size <= WATERMARK_MAX_BYTES
  );
}

// ---- messages ---------------------------------------------------------------

const FIELD_LABELS: Record<string, string> = {
  brightness: "Brilho",
  contrastFactor: "Contraste",
  saturationFactor: "Saturação",
  filter: "Filtro",
  width: "Largura",
  height: "Altura",
  rotation: "Rotação",
  flipH: "Espelho horizontal",
  flipV: "Espelho vertical",
  type: "Tipo",
  text: "Texto",
  watermarkId: "Imagem",
  imageId: "Imagem",
  file: "Ficheiro",
  scale: "Escala",
  opacity: "Opacidade",
  position: "Posição",
  "position.x": "X",
  "position.y": "Y",
};

export const fieldLabel = (field?: string) => (field ? FIELD_LABELS[field] ?? field : null);

export function visualStepErrorMessage(
  code: string,
  details: Record<string, unknown> = {},
): string {
  switch (code) {
    case "INVALID_ADJUST_PARAMS":
      return "O valor deve estar entre 0.00 e 2.00, em passos de 0.05.";
    case "INVALID_FILTER":
      return "Escolhe um dos filtros do catálogo.";
    case "INVALID_RESIZE_PARAMS": {
      const limit = details.limit as { width?: number; height?: number } | number | undefined;
      if (typeof limit === "number") return `O valor mínimo é ${limit} px.`;
      if (limit && typeof limit === "object")
        return `O teto do teu perfil é ${limit.width}×${limit.height}.`;
      if (details.rule === "even") return "As dimensões têm de ser números pares.";
      return "Indica dimensões inteiras.";
    }
    case "INVALID_ORIENT_PARAMS":
      return "Escolhe uma rotação de 0°, 90°, 180° ou 270°.";
    case "INVALID_WATERMARK_CONTENT":
      return details.field === "text"
        ? "Escreve o texto da marca de água."
        : "Escolhe uma imagem PNG ou JPEG válida (até 1 MB).";
    case "INVALID_WATERMARK_PARAMS":
      if (details.field === "text")
        return `O texto tem no máximo ${WATERMARK_TEXT_MAX} caracteres.`;
      if (details.field === "scale") return "A escala deve estar entre 5% e 50%.";
      if (details.field === "opacity") return "A opacidade deve estar entre 10% e 100%.";
      return "Os parâmetros da marca de água não são válidos.";
    case "WATERMARK_OUT_OF_BOUNDS":
      return "A marca de água tem de ficar inteira dentro do quadro do vídeo.";
    case "NO_CHANGES":
      return "Estes valores não alteram o vídeo. Escolhe outros.";
    default:
      return "Os parâmetros da operação não são válidos.";
  }
}
