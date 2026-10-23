// Stable error codes and the {error: {code, message, details}, correlationId}
// response shape of the video routes (ERROR-001, ADD T-10, D-14, D-21).
const MESSAGES = {
  UNAUTHENTICATED: "Sessão inválida ou expirada. Inicia sessão novamente.",
  FORBIDDEN: "Não tens permissão para esta operação de vídeo.",
  NOT_FOUND: "O vídeo ou o projeto não existe.",
  INVALID_STATE: "O carregamento já não pode ser confirmado nem cancelado.",
  INVALID_REQUEST: "Pedido inválido. Verifica os dados enviados.",
  RESOURCE_NOT_READY:
    "O vídeo ainda está a ser processado. Tenta novamente quando estiver concluído.",
  RESOURCE_UNAVAILABLE:
    "O ficheiro do vídeo não está disponível. Tenta novamente mais tarde.",
  UNSUPPORTED_FORMAT: "Só são suportados vídeos MP4, MOV e AVI.",
  INVALID_CODEC:
    "Os codecs do vídeo não são suportados. Converte-o para H.264/AAC (ou MPEG-4/MP3 em AVI) e tenta novamente.",
  LIMIT_EXCEEDED:
    "O vídeo excede o limite de tamanho ou de duração do teu perfil.",
  CORRUPTED_FILE: "O ficheiro de vídeo está corrompido ou incompleto.",
  UPLOAD_ABORTED:
    "A transferência do vídeo não foi concluída. Tenta carregar novamente.",
  PROCESSING_ERROR:
    "Ocorreu um erro ao processar o vídeo. Tenta novamente mais tarde.",
  INTERNAL_ERROR: "Ocorreu um erro interno. Tenta novamente mais tarde.",
  INVALID_STEP_PARAMS:
    "Os parâmetros da operação não são válidos. Corrige o passo indicado e tenta novamente.",
  TASK_ALREADY_ACTIVE:
    "Este projeto já tem uma tarefa de vídeo em curso. Espera que termine ou cancela-a.",
  TASK_NOT_ACTIVE: "A tarefa já terminou e não pode ser cancelada.",
  QUOTA_EXCEEDED:
    "Atingiste o limite diário de operações. Tenta amanhã ou passa a Premium.",
  INSUFFICIENT_INPUTS: "Escolhe pelo menos dois vídeos para juntar.",
  TOO_MANY_INPUTS:
    "A junção tem mais vídeos do que o teu perfil permite. Remove alguns clips.",
  INVALID_CHAIN:
    "A cadeia de operações não é válida. Corrige a regra indicada e tenta novamente.",
  CHAIN_TOO_LONG:
    "Uma cadeia pode ter no máximo 10 passos. Remove alguns passos.",
  PRESET_NAME_TAKEN:
    "Já tens uma predefinição com esse nome. Escolhe outro nome.",
};

class VideoError extends Error {
  constructor(status, code, details = {}) {
    super(MESSAGES[code] || code);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function errorBody(code, details, correlationId) {
  return {
    error: { code, message: MESSAGES[code] || code, details: details || {} },
    correlationId: correlationId || null,
  };
}

function sendError(res, err, correlationId) {
  if (err instanceof VideoError) {
    return res
      .status(err.status)
      .json(errorBody(err.code, err.details, correlationId));
  }
  return res.status(500).json(errorBody("INTERNAL_ERROR", {}, correlationId));
}

module.exports = { VideoError, MESSAGES, errorBody, sendError };
