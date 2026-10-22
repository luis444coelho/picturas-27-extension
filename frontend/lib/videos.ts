import axios from "axios";
import { api } from "./axios";

// Video API of UC-VID-000 (ADR-001): ask for a presigned PUT URL, send the file
// straight to storage, confirm, then the ingestion runs in the background.

export interface ProjectVideo {
  id: string;
  originalName: string;
  mimeType: string;
  durationMs: number;
  displayWidth: number;
  displayHeight: number;
  createdAt: string;
  thumbnailUrl: string;
}

export interface VideoUploadTicket {
  videoId: string;
  upload: {
    url: string;
    method: "PUT";
    headers: Record<string, string>;
    expiresIn: number;
  };
}

export interface VideoPlayback {
  url: string;
  mimeType: string;
  expiresIn: number;
}

export interface VideoApiError {
  error: { code: string; message: string; details: Record<string, unknown> };
  correlationId: string | null;
}

export interface VideoTarget {
  uid: string;
  pid: string;
  token: string;
  ownerId?: string;
  shareId?: string;
}

// Accepted on the client before any transfer (UPLOAD-003, UPLOAD-020).
export const ACCEPTED_VIDEO_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
};

// Limits shown to the user (UC-VID-000 step 1); the server enforces them (D-22).
export const VIDEO_LIMITS = {
  free: {
    maxBytes: 200 * 1024 ** 2,
    maxDurationMin: 5,
    label: "200 MB e 5 minutos",
  },
  premium: {
    maxBytes: 2 * 1024 ** 3,
    maxDurationMin: 60,
    label: "2 GB e 60 minutos",
  },
} as const;

export function isAcceptedVideoFile(file: File): boolean {
  const dot = file.name.lastIndexOf(".");
  const extension = dot < 0 ? "" : file.name.slice(dot).toLowerCase();
  return (
    ACCEPTED_VIDEO_TYPES[extension] !== undefined &&
    ACCEPTED_VIDEO_TYPES[extension] === file.type
  );
}

function videosPath({ uid, pid, ownerId, shareId }: VideoTarget) {
  const pathUid = shareId ? (ownerId ?? uid) : uid;
  return `/projects/${pathUid}/${pid}/videos`;
}

function requestConfig({ token, shareId }: VideoTarget) {
  return {
    headers: { Authorization: `Bearer ${token}` },
    params: shareId ? { share: shareId } : undefined,
  };
}

export const requestVideoUpload = async (target: VideoTarget, file: File) => {
  const response = await api.post<VideoUploadTicket>(
    `${videosPath(target)}/uploads`,
    { fileName: file.name, mimeType: file.type, sizeBytes: file.size },
    requestConfig(target),
  );
  return response.data;
};

export const completeVideoUpload = async (
  target: VideoTarget,
  videoId: string,
) => {
  const response = await api.post<{ videoId: string; status: string }>(
    `${videosPath(target)}/${videoId}/upload/complete`,
    {},
    requestConfig(target),
  );
  return response.data;
};

export const cancelVideoUpload = async (
  target: VideoTarget,
  videoId: string,
) => {
  await api.delete(
    `${videosPath(target)}/${videoId}/upload`,
    requestConfig(target),
  );
};

export const fetchProjectVideos = async (target: VideoTarget) => {
  const response = await api.get<{ videos: ProjectVideo[] }>(
    videosPath(target),
    requestConfig(target),
  );
  return response.data.videos;
};

export const fetchVideoPlayback = async (
  target: VideoTarget,
  videoId: string,
) => {
  const response = await api.get<VideoPlayback>(
    `${videosPath(target)}/${videoId}/playback`,
    requestConfig(target),
  );
  return response.data;
};

export class UploadAbortedError extends Error {
  constructor() {
    super("Upload aborted");
  }
}

// XMLHttpRequest instead of fetch: it reports upload progress and can be
// aborted (UPLOAD-006, UPLOAD-018). The Content-Type must be the signed one.
export function putVideoFile(
  ticket: VideoUploadTicket,
  file: File,
  onProgress: (percent: number) => void,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let lastPercent = 0;

    xhr.open(ticket.upload.method, ticket.upload.url);
    Object.entries(ticket.upload.headers).forEach(([name, value]) =>
      xhr.setRequestHeader(name, value),
    );

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.min(
        100,
        Math.floor((event.loaded / event.total) * 100),
      );
      if (percent > lastPercent) {
        lastPercent = percent;
        onProgress(percent);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`Storage answered ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.onabort = () => reject(new UploadAbortedError());

    signal.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}

export function videoErrorCode(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as VideoApiError | undefined;
    return data?.error?.code ?? null;
  }
  return null;
}

// Messages per stable code (ERROR-001, D-14, D-21).
const VIDEO_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: "A tua sessão expirou. Inicia sessão novamente.",
  FORBIDDEN: "Não tens permissão para carregar ou ver vídeos neste projeto.",
  NOT_FOUND: "O vídeo já não existe.",
  INVALID_STATE: "Este carregamento já não pode ser alterado.",
  INVALID_REQUEST: "O pedido de carregamento é inválido.",
  RESOURCE_NOT_READY: "O vídeo ainda está a ser processado.",
  UNSUPPORTED_FORMAT: "Só são suportados vídeos MP4, MOV e AVI.",
  INVALID_CODEC:
    "Os codecs do vídeo não são suportados. Converte-o para H.264/AAC e tenta novamente.",
  LIMIT_EXCEEDED:
    "O vídeo excede o limite de tamanho ou de duração do teu perfil.",
  CORRUPTED_FILE: "O ficheiro de vídeo está corrompido ou incompleto.",
  UPLOAD_ABORTED: "A transferência não foi concluída. Tenta novamente.",
  PROCESSING_ERROR:
    "Ocorreu um erro ao processar o vídeo. Tenta novamente mais tarde.",
  SHARE_LINK_REVOKED: "O link de partilha foi revogado.",
  TOO_MANY_EDITORS: "Há demasiados editores ativos neste projeto.",
  INTERNAL_ERROR: "Ocorreu um erro interno. Tenta novamente mais tarde.",
};

export function videoErrorMessage(code: string | null | undefined): string {
  return (
    (code && VIDEO_ERROR_MESSAGES[code]) || VIDEO_ERROR_MESSAGES.INTERNAL_ERROR
  );
}

export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatSize(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}
