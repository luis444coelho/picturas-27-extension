// State of a video task on the client (ADD T-03, D-40, D-47). No imports, so
// Node can test it with type stripping.

export type VideoTaskStatus =
  "queued" | "processing" | "completed" | "failed" | "cancelled";

export interface VideoTaskState {
  taskId: string;
  status: VideoTaskStatus;
  step: number;
  totalSteps: number;
  progress: number;
  resultVideoId?: string;
  error?: { code: string; message?: string };
}

// Payload of video-task-update and body of GET …/videos/tasks/:taskId.
export interface VideoTaskUpdate extends Partial<VideoTaskState> {
  taskId: string;
  projectId?: string;
  status: VideoTaskStatus;
}

const FINAL: VideoTaskStatus[] = ["completed", "failed", "cancelled"];

export function isFinalStatus(status: VideoTaskStatus): boolean {
  return FINAL.includes(status);
}

// Applies an event or a GET answer. Events of another task are ignored, and so
// are events that arrive after the task is known to be finished: progress
// events reach the wsGateway without going through the projects service
// (ADD T-03).
export function applyTaskUpdate(
  state: VideoTaskState | null,
  update: VideoTaskUpdate,
): VideoTaskState | null {
  if (state && state.taskId !== update.taskId) return state;
  if (state && isFinalStatus(state.status)) return state;

  const base: VideoTaskState = state ?? {
    taskId: update.taskId,
    status: update.status,
    step: 1,
    totalSteps: 1,
    progress: 0,
  };
  const next: VideoTaskState = {
    ...base,
    status: update.status,
    step: update.step ?? base.step,
    totalSteps: update.totalSteps ?? base.totalSteps,
    progress: update.progress ?? base.progress,
  };
  if (update.status === "completed") next.progress = 100;
  if (update.resultVideoId) next.resultVideoId = update.resultVideoId;
  if (update.error) next.error = update.error;
  return next;
}

// "Passo k de N" (TASK-008, D-40).
export function stepLabel(step: number, totalSteps: number): string {
  return `Passo ${step} de ${totalSteps}`;
}

export const TASK_STATUS_LABELS: Record<VideoTaskStatus, string> = {
  queued: "Em fila",
  processing: "A processar",
  completed: "Concluída",
  failed: "Falhou",
  cancelled: "Cancelada",
};

// Messages of the codes added by B003 (D-42, D-44).
export const TASK_ERROR_MESSAGES: Record<string, string> = {
  INVALID_STEP_PARAMS:
    "Os parâmetros da operação não são válidos. Corrige o passo indicado.",
  TASK_ALREADY_ACTIVE:
    "Este projeto já tem uma tarefa de vídeo em curso. Espera que termine ou cancela-a.",
  TASK_NOT_ACTIVE: "A tarefa já terminou e não pode ser cancelada.",
  QUOTA_EXCEEDED:
    "Atingiste o limite diário de operações. Tenta amanhã ou passa a Premium.",
};

// Key of the task being followed in a project, kept in sessionStorage so the
// state is recovered with GET after a page reload (ADD T-03).
export function taskStorageKey(projectId: string): string {
  return `picturas.videoTask.${projectId}`;
}
