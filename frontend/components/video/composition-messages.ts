import axios from "axios";
import { videoErrorCode, type VideoApiError } from "@/lib/videos";
import { stepErrorMessage } from "@/lib/video-edit";
import { visualStepErrorMessage } from "@/lib/video-visual";
import { conversionError } from "@/lib/video-convert";
import { videoTaskErrorMessage } from "@/lib/video-tasks";
import { chainErrorMessage, type StepAddress } from "@/lib/video-chain";

// Messages of the compositions: the codes of each operation with the messages
// of the simple edit (B004, B005, B007), then the codes of the chain (D-79, D-80).
const GENERIC_STEP = "Os parâmetros da operação não são válidos.";

export type StepErrorDetails = {
  code: string;
  field?: string;
  [key: string]: unknown;
};

export function stepMessage(error: StepErrorDetails): string {
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

// Error of a request: message (with the support code) and the step it points to.
export function requestError(cause: unknown): {
  message: string;
  at: StepAddress | null;
} {
  const data = axios.isAxiosError(cause)
    ? (cause.response?.data as VideoApiError | undefined)
    : undefined;
  const code = data?.error.code ?? videoErrorCode(cause);
  const details = (data?.error.details ?? {}) as Record<string, unknown>;
  const errors = Array.isArray(details.errors)
    ? (details.errors as StepErrorDetails[])
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
