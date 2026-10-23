import type { VideoRecipeStep } from "./video-access";

// B008 chains and concats (UC-VID-013, UC-VID-014, ADD 4.8, 4.9). Values and
// helpers of the editor, without runtime imports, so they run in the Node
// tests; the API calls are in video-chain-api.ts. The rules belong to the
// projects service: the editor only counts, moves and explains.

export interface VideoClip {
  videoId: string;
  steps: VideoRecipeStep[];
}

export type ChainOperation =
  | "trim"
  | "remove_audio"
  | "speed"
  | "watermark"
  | "adjust"
  | "filter"
  | "resize"
  | "orient"
  | "convert";

// Eligible operations of a step, besides the concat (CHAIN-002, RN2).
export const CHAIN_OPERATIONS: { id: ChainOperation; label: string }[] = [
  { id: "trim", label: "Recortar" },
  { id: "remove_audio", label: "Remover áudio" },
  { id: "speed", label: "Velocidade" },
  { id: "watermark", label: "Marca de água" },
  { id: "adjust", label: "Ajustar imagem" },
  { id: "filter", label: "Filtro" },
  { id: "resize", label: "Redimensionar" },
  { id: "orient", label: "Rodar e espelhar" },
  { id: "convert", label: "Converter formato" },
];

export const MAX_STEPS = 10; // NFR-023
export const MAX_CLIPS: Record<string, number> = { free: 10, premium: 50 };
export const MIN_CLIPS = 2;
export const FREE_DAILY_OPERATIONS = 5; // DQ-025

export function operationLabel(operation: string): string {
  if (operation === "concat") return "Juntar vídeos";
  return CHAIN_OPERATIONS.find((op) => op.id === operation)?.label ?? operation;
}

export const concatStep = (clips: VideoClip[]): VideoRecipeStep => ({
  operation: "concat",
  version: 1,
  parameters: {
    clips: clips.map((c) => ({ videoId: c.videoId, steps: c.steps })),
  },
});

export function isConcatChain(steps: VideoRecipeStep[]): boolean {
  return steps[0]?.operation === "concat";
}

export function clipsOf(step: VideoRecipeStep | undefined): VideoClip[] {
  const clips = step?.parameters?.clips;
  return Array.isArray(clips) ? (clips as VideoClip[]) : [];
}

// N: top-level steps (the concat counts 1) plus the steps of every clip; it
// is also the cost in credits (UC-VID-014 RN5, RN7, CHAIN-009).
export function countSteps(steps: VideoRecipeStep[]): number {
  return steps.reduce(
    (total, step) =>
      total +
      1 +
      (step.operation === "concat"
        ? clipsOf(step).reduce((sum, clip) => sum + clip.steps.length, 0)
        : 0),
    0,
  );
}

export const chainCost = countSteps;

export function canAddStep(steps: VideoRecipeStep[]): boolean {
  return countSteps(steps) < MAX_STEPS; // CHAIN-008
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  )
    return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function removeItem<T>(items: T[], index: number): T[] {
  return items.filter((_, i) => i !== index);
}

// Adding a concat to a chain: the video of the editor becomes clip 1 and its
// steps move into the sub-chain of that clip (D-78).
export function withConcat(
  videoId: string,
  steps: VideoRecipeStep[],
): VideoRecipeStep[] {
  return [concatStep([{ videoId, steps }])];
}

export function canSubmitConcat(steps: VideoRecipeStep[]): boolean {
  return !isConcatChain(steps) || clipsOf(steps[0]).length >= MIN_CLIPS;
}

// A preset is a chain without concat (CHAIN-014, D-85); the server fields are
// never stored (D-83, D-84).
export function canSaveAsPreset(steps: VideoRecipeStep[]): boolean {
  return steps.length > 0 && !steps.some((step) => step.operation === "concat");
}

export function withoutServerFields(
  steps: VideoRecipeStep[],
): VideoRecipeStep[] {
  return steps.map((step) => {
    const { _mark, _input, _clips, ...parameters } = step.parameters ?? {};
    void _mark;
    void _input;
    void _clips;
    return { operation: step.operation, version: step.version, parameters };
  });
}

// ---- errors (D-79, D-80, D-82, D-85) ----------------------------------------

export const RULE_MESSAGES: Record<string, string> = {
  empty_chain: "Acrescenta pelo menos um passo à cadeia.",
  convert_not_last:
    "A conversão de formato só pode ser o último passo da cadeia.",
  multiple_concat:
    "Uma cadeia só pode ter uma junção, e nunca dentro de um clip.",
  frame_extraction:
    "A extração de fotogramas não pode fazer parte de uma cadeia.",
  concat_not_first: "A junção tem de ser o primeiro passo da cadeia.",
  concat_in_preset:
    "Uma cadeia com junção não pode ser guardada como predefinição.",
};

export interface StepAddress {
  index?: number;
  clipIndex?: number;
  stepIndex?: number;
}

export function addressLabel({
  index,
  clipIndex,
  stepIndex,
}: StepAddress): string {
  if (clipIndex !== undefined && stepIndex !== undefined)
    return `Clip ${clipIndex + 1}, passo ${stepIndex + 1}`;
  if (clipIndex !== undefined) return `Clip ${clipIndex + 1}`;
  if (index !== undefined) return `Passo ${index + 1}`;
  return "";
}

const minutes = (ms: unknown) => `${Math.round((Number(ms) || 0) / 60000)} min`;

export function chainErrorMessage(
  code: string,
  details: Record<string, unknown> = {},
): string | null {
  switch (code) {
    case "INVALID_CHAIN":
      return (
        RULE_MESSAGES[String(details.rule)] ??
        "A cadeia de operações não é válida."
      );
    case "CHAIN_TOO_LONG":
      return `Uma cadeia pode ter no máximo ${details.limit ?? MAX_STEPS} passos (tem ${details.total}).`;
    case "INSUFFICIENT_INPUTS":
      return "Escolhe pelo menos dois vídeos para juntar.";
    case "TOO_MANY_INPUTS":
      return `O teu perfil permite juntar no máximo ${details.limit} vídeos.`;
    case "LIMIT_EXCEEDED":
      return details.total !== undefined && details.limit !== undefined
        ? `A duração (${minutes(details.total)}) excede o limite do teu perfil (${minutes(details.limit)}).`
        : "Um dos vídeos excede o limite de tamanho ou de duração do teu perfil.";
    case "PRESET_NAME_TAKEN":
      return "Já tens uma predefinição com esse nome.";
    default:
      return null;
  }
}

export const PHASE_LABELS: Record<string, string> = {
  download: "ao descarregar os vídeos",
  encode: "ao codificar o vídeo",
  upload: "ao enviar o resultado",
};

export function phaseMessage(phase: string | null | undefined): string | null {
  return phase && PHASE_LABELS[phase]
    ? `A tarefa falhou ${PHASE_LABELS[phase]}.`
    : null;
}

// Warning before confirming (DQ-025, ADD 4.9 risks): a Registered user has 5
// operations a day; the server decides with QUOTA_EXCEEDED.
export function quotaWarning(
  type: string,
  remaining: number | null | undefined,
  cost: number,
): string | null {
  if (type !== "free") return null;
  if (cost > FREE_DAILY_OPERATIONS)
    return `Esta cadeia custa ${cost} créditos e o teu perfil tem ${FREE_DAILY_OPERATIONS} por dia: reduz os passos ou passa a Premium.`;
  if (typeof remaining === "number" && cost > remaining)
    return `Esta cadeia custa ${cost} créditos e restam-te ${remaining} hoje.`;
  return null;
}

export const PRESET_NAME_MAX = 50;

export function cleanPresetName(name: string): string | null {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= PRESET_NAME_MAX
    ? trimmed
    : null;
}
