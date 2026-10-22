// B004 UI values; operation validation remains owned by the projects service.
export const SPEED_PRESETS = [0.25, 0.5, 0.75, 1.25, 1.5, 2, 4];

export function parseTimecode(value: string): number | null {
  const match = /^(\d{2,}):([0-5]\d):([0-5]\d)\.(\d{3})$/.exec(value);
  if (!match) return null;
  const ms =
    ((Number(match[1]) * 60 + Number(match[2])) * 60 + Number(match[3])) *
      1000 +
    Number(match[4]);
  return Number.isSafeInteger(ms) ? ms : null;
}

export function formatTimecode(ms: number): string {
  const value = Math.max(0, Math.round(ms));
  const hours = Math.floor(value / 3600000);
  const minutes = Math.floor(value / 60000) % 60;
  const seconds = Math.floor(value / 1000) % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(value % 1000).padStart(3, "0")}`;
}

export const trimStep = (startMs: number, endMs: number) => ({
  operation: "trim",
  version: 1,
  parameters: { startMs, endMs },
});
export const removeAudioStep = () => ({
  operation: "remove_audio",
  version: 1,
  parameters: {},
});
export const speedStep = (factor: number) => ({
  operation: "speed",
  version: 1,
  parameters: { factor },
});
export const predictedTrimMs = (startMs: number, endMs: number) =>
  endMs - startMs;
export const predictedSpeedMs = (durationMs: number, factor: number) =>
  Math.round(durationMs / factor);

export function stepErrorMessage(
  code: string,
  details: Record<string, unknown> = {},
): string {
  switch (code) {
    case "INVALID_INTERVAL":
      return details.minDurationMs
        ? `O intervalo deve ter pelo menos ${details.minDurationMs} ms.`
        : "Indica um início anterior ao fim e instantes válidos.";
    case "OUT_OF_BOUNDS":
      return `O instante deve estar entre zero e ${formatTimecode(Number(details.durationMs) || 0)}.`;
    case "NO_AUDIO_STREAM":
      return "Este vídeo não tem áudio.";
    case "INVALID_SPEED_FACTOR":
      return "Indica um fator de velocidade numérico e positivo.";
    case "SPEED_FACTOR_OUT_OF_RANGE":
      return "O fator deve estar entre 0.25× e 4×.";
    case "NO_CHANGES":
      return "O fator 1× não altera a velocidade. Escolhe outro valor.";
    default:
      return "Os parâmetros da operação não são válidos.";
  }
}
