---
unit: 001-video-lifecycle
bolt: 001-video-lifecycle
stage: design
status: complete
updated: 2026-10-21T16:19:54Z
---

# Technical Design - Ciclo de vida do vídeo (ingestão e visualização)

Fontes, por ordem de precedência: `docs/add.md` (ADD v1.1, mestre), `docs/specsDuvidas.md` (D-01 a D-14), `bolt.md` e ST-VID-000, `docs/requirements/`, `docs/use-cases/`. Base: `ddd-01-domain-model.md`. Não se leu código (restrição do estágio); os nomes de ficheiros existentes vêm do ADD (2.1, T-00 a T-10).

Os pontos que as fontes não decidiam foram registados em `docs/specsDuvidas.md` como D-15 a D-22 e aceites pela equipa no checkpoint do Estágio 2; o desenho cita-os como (D-xx).

## Architecture Pattern

**Extensão por acréscimo da arquitetura de microserviços existente (regra 2.6), com portas e adaptadores dentro do código novo.**

- O vídeo vive em módulos novos ao lado dos de imagem: router novo no gateway e no serviço de projetos, módulo `projects/video/`, módulo de vídeo no `imageStorageService`, worker `Tools/video/`, módulo `wsGateway/video.js`, filas próprias. As únicas alterações em ficheiros existentes são **pontos de ligação acrescentados** (uma linha `app.use`/`require`, entradas em `definitions.json`, um serviço e um volume no `docker-compose.yaml`, um `location` e um `log_format` no `nginx.conf`), sem tocar nas linhas que já existem.
- Dentro do serviço de projetos, a lógica de domínio (`formats.js`, `profiles.js`, `ingest.js`) não conhece Express nem AMQP: recebe as portas (repositório Mongoose, cliente do storage, barramento, notificador) por parâmetro. Assim pode ser testada com *mocks* (coding-standards: "mock external boundaries").
- **Orquestração assíncrona por mensagens** (padrão do T-03): o serviço de projetos é o orquestrador e o dono das regras; o worker executa e devolve factos. A ingestão faz duas idas ao worker (D-13).

## Layer Structure

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Presentation                                                             │
│  frontend: components/video/* (upload, galeria, leitor), lib/videos.ts   │
│  apiGateway: routes/videos.js + auth/videoAuth.js (401/403, correlação)  │
│  projects: routes/videos.js (permissões, validação de pedido, HTTP)      │
│  wsGateway: video.js (video_ws_queue → video-ingest-update)              │
├──────────────────────────────────────────────────────────────────────────┤
│ Application                                                              │
│  projects/video/ingest.js: pedir URL, confirmar, cancelar, tratar        │
│    respostas do worker (probe/derive/dead-letter), compensar, notificar  │
├──────────────────────────────────────────────────────────────────────────┤
│ Domain                                                                   │
│  projects/video/formats.js (matriz, compatibilidade, plano da cópia)     │
│  projects/video/profiles.js (limites por perfil)                         │
│  projects/video/display.js (dimensões de apresentação, instante miniat.) │
│  projects/video/errors.js (ErroVideo, códigos estáveis)                  │
├──────────────────────────────────────────────────────────────────────────┤
│ Infrastructure                                                           │
│  projects/models/video.js (Mongoose, coleção videos)                     │
│  projects/video/amqp.js (video_operations_queue / video_project_queue /  │
│    video_ws_queue, ack manual)                                           │
│  projects/video/storage.js (cliente HTTP do módulo de vídeo do storage)  │
│  projects/video/users.js (GET users:/:user/type)                         │
│  imageStorageService: utils/videoStages.js, services/videoUrls.js,       │
│    route/video.js                                                        │
│  Tools/video/ (worker FFprobe/FFmpeg), rabbitMQ/definitions.json,        │
│  nginx /s3-video/, docker-compose (serviço video, volume video_tmp)      │
└──────────────────────────────────────────────────────────────────────────┘
```

### Componentes e ficheiros

**Novos:**

1. `projects/models/video.js`: esquema do T-00 sem `batch_id` (D-06).
2. `projects/video/formats.js`: matriz T-05 e compatibilidade com o navegador (T-06).
3. `projects/video/profiles.js`: limites por perfil.
4. `projects/video/display.js`: dimensões de apresentação e instante da miniatura.
5. `projects/video/errors.js`: ErroVideo e os códigos.
6. `projects/video/log.js`: linhas JSON (T-10).
7. `projects/video/amqp.js`: módulo AMQP (T-03, D-08).
8. `projects/video/storage.js`: cliente do `route/video.js`.
9. `projects/video/users.js`: tipo de perfil.
10. `projects/video/ingest.js`: orquestrador.
11. `projects/routes/videos.js`: router de vídeo do serviço de projetos.
12. `apiGateway/routes/videos.js`: router de vídeo do gateway.
13. `apiGateway/auth/videoAuth.js`: autenticação de vídeo no gateway.
14. `imageStorageService/utils/videoStages.js`: `video_src`, `video_out`, `video_preview` e `video_thumb`, sem `video_zip`.
15. `imageStorageService/services/videoUrls.js`
16. `imageStorageService/route/video.js`
17. `wsGateway/video.js`
18. Worker `Tools/video/`:
    - `Dockerfile`
    - `requirements.txt` (só `requests==2.32.3`)
    - `config.py` (`VIDEO_STORAGE_URL`)
    - `video_msg.py`
    - `video_rabbit.py` (subclasse de `Rabbit_MQ`)
    - `storage.py`
    - `ingest.py`
    - `video.py` (ponto de entrada)
19. Frontend:
    - `frontend/lib/videos.ts`
    - `frontend/components/video/video-upload.tsx`
    - `frontend/components/video/video-gallery.tsx`
    - `frontend/components/video/video-player.tsx`
    - `frontend/components/video/use-video-ingest-events.ts`

**Pontos de ligação acrescentados (sem alterar linhas existentes):**

1. Gateway: uma linha `app.use("/projects", videoRoutes)` antes da linha do router `/projects` existente.
2. Serviço de projetos:
   - uma linha `app.use("/", videoRoutes)` antes do router existente;
   - um `require("./video/amqp").start()` no arranque.
3. `imageStorageService/server.js`: uma linha `app.use("/video", videoRoutes)`.
4. `wsGateway/index.js`: uma linha no fim, `require("./video")(io)`.
5. `rabbitMQ/definitions.json`: três filas e três *bindings* novos.
6. `docker-compose.yaml`: o serviço `video` e o volume `video_tmp`.
7. `nginx/nginx.conf`:
   - o `log_format video_s3` no bloco `http`;
   - o `location /s3-video/`.
8. Frontend: o ponto de montagem do UI de vídeo (D-16).

## API Design

Todas as rotas públicas passam pelo gateway em `/api-gateway/projects/:user/:project/videos…`, com `videoAuth`, `X-Correlation-Id` e `X-Caller-Id` (T-00, T-10). No serviço de projetos, o router de vídeo só responde a `/:user/:project/videos…` e deixa passar o resto. As rotas com segmento fixo (`uploads`) são declaradas antes das rotas `/:video` (como em T-03).

### Rotas públicas (gateway → serviço de projetos)

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/projects/:user/:project/videos/uploads` | POST | Corpo `{fileName, mimeType, sizeBytes}`. Permissão: edição (`checkSharePermission` + `requireEditPermission` + `enforcePresenceLimit`); `anonymous` → 403. Valida: extensão e MIME na matriz (`UNSUPPORTED_FORMAT`), `sizeBytes` ≤ limite do perfil do executor (`LIMIT_EXCEEDED`, `details: {field: "size", limit, total}`) (D-11, UPLOAD-003/004/020) | **201** `{videoId, upload: {url, method: "PUT", headers: {"Content-Type": mimeType}, expiresIn: 900}}`. Cria o registo em `videos` com `status: queued` e `storage.original_key = <projectId>/video_src/<videoId>.<ext>` (D-15). O URL é público, pelo `location /s3-video/`, e tem o `Content-Type` assinado |
| `/projects/:user/:project/videos/:video/upload/complete` | POST | Sem corpo. Permissão: edição. Só quem carregou (`created_by` = executor), senão 403. O estado tem de ser `queued`, senão 409 `INVALID_STATE` (D-21) | **202** `{videoId, status: "processing"}`. Faz `headObject` ao original: se não existe → `UPLOAD_ABORTED`; se o tamanho real for diferente de `sizeBytes` ou passar o limite → apaga e responde `LIMIT_EXCEEDED`/`UPLOAD_ABORTED`. Depois passa `queued → processing` e publica `ingest.probe` (D-11, D-13) |
| `/projects/:user/:project/videos/:video/upload` | DELETE | Cancelamento (FA2). Permissão: edição. Só `created_by`, e só em `queued` (senão 409) | **204**. Apaga o objeto, se existir, e o registo. O cliente aborta o PUT antes de chamar esta rota; o S3 não guarda objetos de PUT incompletos (D-15) |
| `/projects/:user/:project/videos` | GET | Permissão: leitura (`checkSharePermission`); `anonymous` → 403 | **200** `{videos: [{id, originalName, durationMs, displayWidth, displayHeight, mimeType, createdAt, thumbnailUrl}]}`. Só vídeos `completed` (COM-002). `thumbnailUrl` é um GET público de 900 s (D-17) |
| `/projects/:user/:project/videos/:video/playback` | GET | Permissão: leitura; `anonymous` → 403. Vídeo inexistente ou de outro projeto → 404; não `completed` → 409 `RESOURCE_NOT_READY` (T-03) | **200** `{url, mimeType, expiresIn: 900}`. É um GET público, *inline*, de `preview_key` se existir, senão de `original_key` (T-06, UPLOAD-017). O `mimeType` é `video/mp4` quando usa a cópia (D-17) |

**Não pertencem à B001:** `GET …/videos/:video` (informações, B002/4.2); `GET …/videos/:video/download` (B002/4.1); rotas de tarefas e operações (B003+).

### Rotas internas do `imageStorageService` (`/video`, só rede interna; T-08, D-08)

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/video/url/put` | POST | `{userId, projectId, stage, name, contentType, expires, public}`. O `stage` é validado contra `videoStages.js` | `{url}`. Com `public: true`, o *host* é reescrito para `/s3-video/` (D-11); com `public: false`, o URL é interno (`seaweedfs`) e serve o worker |
| `/video/url/get` | POST | `{userId, projectId, stage, name, expires, public, responseContentType?}` | `{url}` |
| `/video/object/:userId/:projectId/:stage/:name` | HEAD | — | 200 com `Content-Length` e `Content-Type`, ou 404 (`headObject`) |
| `/video/object/:userId/:projectId/:stage/:name` | DELETE | — | 204 (reutiliza `services/deleteFile.js`) |
| `/video/bucket/:userId` | POST | — | 200/201 (reutiliza `services/createBucket.js`; idempotente) |

O bucket é sempre `user-<ownerId>`, o do dono do projeto, mesmo quando é um convidado com edição a carregar (T-00). As chaves seguem o formato existente `<projectId>/<stage>/<uuid>.<ext>` (ADD 2.1), com o `videoId` como UUID: `video_src/<videoId>.<ext>`, `video_preview/<videoId>.mp4`, `video_thumb/<videoId>.thumb.jpg` e `video_thumb/<videoId>.frame0.jpg`.

### Contrato de mensagens AMQP (`video_msg`, T-02/T-10)

Os campos comuns seguem os nomes do `tool_msg.py`: `messageId`, `correlationId` (rastreio, T-10), `timestamp`, `status`, `output`, `error`, `metadata.processingTime`. Na ingestão não há `VideoTask`; a associação faz-se por `videoId` e `operation`.

| Mensagem | Fila | Corpo |
|----------|------|-------|
| Pedido `ingest.probe` | `video_operations_queue` | `{messageId, correlationId, timestamp, operation: "ingest.probe", videoId, source: {userId: ownerId, projectId, stage: "video_src", name}}` |
| Resposta `ingest.probe` | `video_project_queue` | `{…, operation: "ingest.probe", videoId, status: "success" \| "error", output: {meta: {container, videoCodec, audioCodec, width, height, rotation, fpsNum, fpsDen, durationMs, sizeBytes, bitrate}, stream: {pixFmt, bitDepth, chroma, profile}}, error: {code: "CORRUPTED_FILE" \| "PROCESSING_ERROR", message}}` |
| Pedido `ingest.derive` | `video_operations_queue` | `{…, operation: "ingest.derive", videoId, source, plan: {thumbnailAtMs, firstFrameMaxWidth: 1280, preview: null \| {video: "copy" \| "libx264", audio: "copy" \| "aac" \| null, genpts: bool}}, targets: {thumb, firstFrame, preview?}}`. O plano vem de `formats.js`; o worker não decide nada (T-05, D-13) |
| Resposta `ingest.derive` | `video_project_queue` | `{…, operation: "ingest.derive", videoId, status, output: {thumbKey, firstFrameKey, previewKey?}, error}` |
| *Dead-letter* | `video_project_queue` | O pedido original, com o cabeçalho `x-death`, depois de 2 entregas falhadas (T-03) → `failed` + compensação |
| Evento | `video_ws_queue` | `{event: "video-ingest-update", userId: createdBy, projectId, videoId, status, error?: {code}}`. Só identificadores e estado (risco aceite do T-03) (D-14) |

### Evento WebSocket

`video-ingest-update` (D-14): o `wsGateway/video.js` emite-o com `io.to([userRoom, "project:<id>"])`, como o T-03. Payload: `{projectId, videoId, status: "processing" \| "completed" \| "failed", error?: {code}}`.

### Sequência da ingestão

```text
FE ──POST uploads──▶ GW(videoAuth) ──▶ PR: valida perfil/formato/tamanho, cria video(queued), pede URL PUT público
FE ──PUT ficheiro (XHR, progresso, abort)──▶ nginx /s3-video/ ──▶ SeaweedFS
FE ──POST upload/complete──▶ PR: headObject, queued→processing, publica ingest.probe ─▶ WS processing
Worker: URL GET interno → descarrega → ffprobe (+ contagem de pacotes) → responde
PR: valida codecs/duração (formats/profiles) ── erro → failed → WS → compensa (apaga objetos + registo)
    └─ ok → grava meta (+ display) → plano da cópia → publica ingest.derive
Worker: descarrega → miniatura, fotograma 0, cópia (se plano) → URLs PUT internos → envia → responde
PR: grava chaves, verifica I1/I2 → completed → WS completed
FE: atualiza a galeria (GET videos) → leitor (GET playback) → <video controls>
```

## Data Persistence

| Table | Columns | Relationships |
|-------|---------|---------------|
| `videos` (MongoDB do serviço de projetos; Mongoose, `timestamps: true`) | `_id` ObjectId (= `videoId`); `project_id` ObjectId; `owner_id` ObjectId; `created_by` ObjectId; `original_name` String; `mime_type` String (`video/mp4`, `video/quicktime`, `video/x-msvideo`); `status` enum `queued \| processing \| completed \| failed`; `storage: {original_key, preview_key, thumb_key, first_frame_key}`; `meta: {container, video_codec, audio_codec (null = sem áudio), width, height, rotation, display_width, display_height, fps_num, fps_den, duration_ms, size_bytes, bitrate}`; `source_video_ids` [ObjectId] (`[]`); `recipe` [{operation, version, parameters}] (`[]`); `task_id` ObjectId (`null`); `createdAt`, `updatedAt` | `project_id` → projeto (baseline, sem chave estrangeira; projetos apagados ficam para a rotina da Q-ADD-14, B003); `owner_id` → dono do projeto e bucket; `created_by` → executor. Sem `batch_id` (D-06) |

**Índices:** `{project_id: 1, status: 1, createdAt: -1}` (galeria) e `{status: 1, updatedAt: 1}` (para a rotina de limpeza da B003, D-15).

**Escritas condicionais** (idempotência e T-03):

- `updateOne({_id, status: "queued"}, {$set: {status: "processing"}})` na confirmação;
- `updateOne({_id, status: "processing", meta: {$exists: false}}, …)` na resposta `probe`;
- `updateOne({_id, status: "processing", "storage.thumb_key": {$exists: false}}, …)` na resposta `derive`.

Uma resposta reentregue que não corresponde ao estado esperado é confirmada e ignorada.

**Sem migrações:** a coleção é nova e o documento do projeto não é tocado (T-00).

**Filas (`rabbitMQ/definitions.json`, D-08):**

- `video_operations_queue`, `durable`, com os argumentos:
  - `x-queue-type: quorum`
  - `x-delivery-limit: 1`
  - `x-consumer-timeout: 10800000` (o valor de exemplo do ADD, T-03) (D-18)
  - `x-dead-letter-exchange: picturas`
  - `x-dead-letter-routing-key: video_project_queue`
- `video_project_queue` e `video_ws_queue`, `durable`.
- *Bindings* na exchange `picturas`, com *routing key* igual ao nome da fila.
- A exchange `video_control` é da B003.

## Security Design

| Concern | Approach |
|---------|----------|
| Authentication | `videoAuth` no gateway: o JWT é validado com o segredo partilhado (mesma lógica do `auth.checkToken`). Se faltar, for inválido ou tiver expirado → **401** (AUTH-001, NFR-001). |
| Authorization | Gateway: utilizador do token ≠ `:user` sem `?share=` → **403**. Serviço de projetos: `checkSharePermission` (leitura) nas rotas de consulta; mais `requireEditPermission` e `enforcePresenceLimit` nas de carregamento (AUTH-003, STORAGE-003); tipo do executor por `GET users:/:user/type` com o `X-Caller-Id` → `anonymous` **403** (AUTH-002). Confirmar e cancelar exigem ainda `created_by` = executor. |
| Integridade das chaves | O cliente nunca escolhe a chave nem o bucket: o servidor deriva-os do `videoId` e do dono do projeto. O `Content-Type` vai assinado no PUT. A confirmação verifica a existência e o tamanho com `headObject`. |
| URLs temporários | URLs pré-assinados de 900 s (NFR-017) para o PUT do carregamento, o GET da reprodução e as miniaturas. Os URLs internos do worker não saem da rede Docker. |
| Credenciais em logs | O `location /s3-video/` usa o `log_format video_s3`, com `$uri` em vez de `$request_uri`, para a assinatura não ficar nos logs (T-10). Os logs do código novo nunca incluem JWT nem URLs assinados. |
| Fuga pelo WebSocket | Os eventos levam só identificadores, estado e código de erro, sem nomes nem URLs (risco aceite do T-03). |
| Data Encryption | TLS terminado no nginx (baseline); encriptação em repouso do SeaweedFS (baseline, data-stack). Nada de novo. |
| Quota | Nenhuma rota de ingestão chama `process/:n` nem `refund` (RN2, ST-VID-000 AC6). |

## NFR Implementation

| Requirement | Design Approach |
|-------------|-----------------|
| UPLOAD-005 (*streaming*) e NFR-016 | PUT direto do navegador para o SeaweedFS pelo nginx (`proxy_request_buffering off`, `client_max_body_size 2g`); os dados não atravessam o gateway nem o serviço de projetos (D-11). |
| UPLOAD-018 (progresso 0–100 %) e UPLOAD-006 (cancelar) | O frontend envia com `XMLHttpRequest` (`upload.onprogress`, valores monótonos) e cancela com `xhr.abort()` seguido de `DELETE …/upload`. |
| NFR-008 (limites) | São verificados três vezes: tamanho declarado no pedido do URL; tamanho real no `headObject` da confirmação; duração depois do FFprobe, no serviço de projetos. O nginx corta acima de 2 GB. Unidade dos limites (D-22). |
| NFR-003 (matriz) | `formats.js` é a única fonte: extensão e MIME no pedido do URL, codecs depois do FFprobe, plano da cópia (T-05, T-06, D-13). |
| NFR-010 (Docker) | Worker em `python:3.11-slim` com `apt-get install ffmpeg` e o `Tools/utils/requirements.txt` partilhado; arranca com `docker compose up`. |
| NFR-011 (filas independentes) | Filas de vídeo próprias. O worker reutiliza `Tools/utils/rabbit_mq.py` e `env.py` sem os alterar: a subclasse `video_rabbit.py` redefine a declaração da fila (com os argumentos *quorum*) e o consumo (`auto_ack=False`, `prefetch_count=1`). Não usa o `tool_msg.py`. |
| Fiabilidade (NFR-007, I7) | `ack` manual no worker (só depois de publicar a resposta) e no `amqp.js` (só depois de gravar no MongoDB). Reentrega → recomeça do zero e limpa `/tmp/video/<videoId>/`. *Dead-letter* ao fim de 2 entregas → `failed` + compensação. A compensação apaga os objetos de `video_src`, `video_preview` e `video_thumb` e depois o registo, por esta ordem, para não ficarem objetos sem registo que os encontre. |
| Deteção de ficheiros corrompidos (UPLOAD-012) | `ffprobe -show_streams -show_format` e uma segunda passagem `ffprobe -count_packets` sobre a stream de vídeo, que lê todos os pacotes sem descodificar: deteta cabeçalhos ilegíveis e corpos truncados. Qualquer erro → `CORRUPTED_FILE`. Será verificado no Estágio 5 com ficheiros de referência truncados. |
| Metadados (UPLOAD-013/019, Q-ADD-13) | A rotação vem do `displaymatrix` (`side_data_list`) ou da etiqueta `rotate`, normalizada para 0/90/180/270. `display_*` é calculado em `display.js`, no serviço de projetos. |
| Miniatura e fotograma 0 (UPLOAD-014, T-07, Q-ADD-22) | Miniatura: `-ss <thumbnailAtMs>` com `thumbnailAtMs = durationMs ≥ 1000 ? 1000 : 0`, um fotograma, JPEG; dimensão e qualidade (D-20). Fotograma 0: `-frames:v 1 -vf scale='min(1280,iw)':-2`. A rotação é aplicada pelo *autorotate* do FFmpeg nos dois. |
| Cópia MP4 (UPLOAD-016, T-06, Q-ADD-20) | Plano em `formats.js`. É necessária se o contentor for MOV ou AVI, ou se for MP4 com vídeo que não é H.264 8 bits `yuv420p`. Vídeo H.264 compatível → `copy`; caso contrário → `libx264 -pix_fmt yuv420p` com corte para dimensões pares (T-02). Áudio AAC → `copy`; MP3 → `aac`; sem áudio → nada. Sempre `-map 0:V:0 -map 0:a:0? -sn -dn -movflags +faststart`, e `-fflags +genpts` quando a origem é AVI com cópia do vídeo (T-05). Parâmetros de codificação (D-19). |
| Desempenho | A segunda ida volta a descarregar o original, porque o temporário de uma réplica não é partilhado (consequência aceite da D-13). Transferências por blocos com `process_data_events(time_limit=0)` entre blocos, e PUT com `Content-Length` (T-03). Réplicas do worker (D-18). |
| Observabilidade (NFR-002, ERROR-002) | Linhas JSON em `stdout` com `{level, correlationId, videoId, userId, resource, event}` no gateway, no serviço de projetos e no worker. A causa técnica (fim do `stderr` do FFmpeg/FFprobe) fica só nos logs. |

## Error Handling

Formato único `{error: {code, message, details}, correlationId}` (ERROR-001, T-10). As mensagens ao utilizador estão em português e trazem uma instrução corretiva.

| Error Type | Code | Response |
|------------|------|----------|
| JWT em falta, inválido ou expirado | `UNAUTHENTICATED` (D-21) | 401 |
| Utilizador do caminho, `anonymous`, sem permissão ou não é quem carregou | `FORBIDDEN` (D-21) | 403 |
| Vídeo inexistente ou de outro projeto | `NOT_FOUND` (D-21) | 404 |
| Vídeo ainda não `completed` (reprodução) | `RESOURCE_NOT_READY` (T-03) | 409 |
| Confirmar ou cancelar fora de `queued` | `INVALID_STATE` (D-21) | 409 |
| Extensão, MIME ou contentor fora da matriz | `UNSUPPORTED_FORMAT` | 422 no pedido de URL (COM-005); na ingestão, via `video-ingest-update` |
| Codec fora da matriz | `INVALID_CODEC` (UPLOAD-009) | Via `video-ingest-update`, `failed` |
| Tamanho ou duração acima do perfil | `LIMIT_EXCEEDED`, `details: {field, limit, total}` | 422 (URL/confirmação) ou via WS (duração) |
| Ficheiro corrompido ou truncado | `CORRUPTED_FILE` (D-14) | Via WS, `failed` |
| Transferência interrompida, objeto em falta ou tamanho diferente do declarado | `UPLOAD_ABORTED` (D-14) | 422 na confirmação |
| Erro interno do FFmpeg ou *dead-letter* | `PROCESSING_ERROR` (D-21) | Via WS, `failed` |
| Falha de infraestrutura (Mongo, storage, AMQP) nas rotas | `INTERNAL_ERROR` (D-21) | 500/502, sem detalhes técnicos |

Depois de qualquer `failed`, o serviço de projetos (1) grava `failed`, (2) publica `video-ingest-update` com o código, (3) apaga os objetos e o registo e (4) só então faz `ack` (D-12).

## External Dependencies

| Service | Purpose | Integration |
|---------|---------|-------------|
| Serviço de utilizadores (baseline) | Tipo do executor (`anonymous`, `free`, `premium`) | REST `GET users:/:user/type`, sem alterações |
| `imageStorageService` + SeaweedFS 4.47 | Objetos e URLs pré-assinados | REST interno `/video/*` (novo); o `services/s3Client.js` (`aws-sdk` v2) é reutilizado (Q-ADD-19) |
| RabbitMQ 4.0.5 | Pedidos e respostas do worker e eventos WS | AMQP 0-9-1: `amqp.js` (Node) e `pika==1.3.2` (worker) |
| FFmpeg/FFprobe 5.1 (Debian 12) | Inspeção, miniatura, fotograma 0 e cópia | `subprocess` no worker (ADD secção 6) |
| `requests==2.32.3` | HTTP do worker (URLs, GET/PUT) | Já existe no projeto (ADD secção 6) |
| Socket.IO (wsGateway) | `video-ingest-update` | Consome `video_ws_queue` |
| nginx | `/s3-video/` para o PUT e o GET públicos | `location` e `log_format` novos |
| Frontend: `react-dropzone`, `@tanstack/react-query`, `socket.io-client`, Radix `progress`/`dialog` | Arrastar e largar, pedidos, eventos, UI | Bibliotecas já existentes, usadas em componentes novos; sem dependências novas |

**Sem dependências novas** além das do ADD (secção 6: FFmpeg no Dockerfile do worker). O `archiver` não entra (D-06).

## Verificações a fazer no Estágio 4 (dependem do código existente)

1. Como o `getPresignedUrl.js` e o `location /s3/` fazem a reescrita do *host* e passam o cabeçalho `Host`, para que a assinatura do PUT e do GET em `/s3-video/` seja aceite pelo SeaweedFS.
2. Se o SeaweedFS 4.47 aceita PUT pré-assinado com `Content-Type` assinado vindo do navegador e se devolve `Content-Length` no `HEAD`.
3. Os nomes e a forma de montagem de `checkSharePermission`, `requireEditPermission`, `enforcePresenceLimit` e do segredo JWT, e o padrão de *routing key* das filas existentes em `definitions.json`.
4. Como o frontend obtém o socket (`useGetSocket`) e o tipo do utilizador, para os reutilizar sem alterar ficheiros.
