---
unit: 001-video-lifecycle
bolt: 003-video-task-foundation
stage: design
status: complete
updated: 2026-10-22T15:39:16Z
---

# Technical Design - Tarefas de vídeo, quota e executor de cadeias

Fontes, por ordem de precedência: `docs/add.md` (ADD v1.1, mestre), `docs/specsDuvidas.md` (D-01 a D-43), `memory-bank/standards/decision-index.md` (ADR-001, ADR-002), `bolt.md` e ST-VID-COM-001, `docs/requirements/`, `docs/use-cases/`. Base: `ddd-01-domain-model.md`. Os componentes da B001 e da B002 que este bolt estende são descritos a partir dos seus artefactos (`ddd-02-technical-design.md` e `ddd-03-test-report.md` da B001, `implementation-walkthrough.md` da B002). Não se leu código (restrição do estágio); o que depende do código está em "Verificações a fazer no Estágio 4".

Os pontos que as fontes não decidiam foram registados em `docs/specsDuvidas.md` como D-44 a D-47 e respondidos pela equipa no checkpoint do Estágio 2; o desenho cita-os como (D-xx).

## Architecture Pattern

**O mesmo da B001: extensão por acréscimo (regra 2.6), com portas e adaptadores no código novo e orquestração assíncrona por mensagens.**

- O serviço de projetos é o orquestrador e o dono das regras (registo de operações, plano, lugar, quota, máquina de estados). O worker executa o plano e devolve factos (T-01, T-02, ADR-002).
- **Regra 2.6 também para o código das B001 e B002:** as linhas existentes não mudam. Este bolt acrescenta ficheiros novos e, nos ficheiros da B001/B002, só linhas novas: rotas novas no fim dos routers de vídeo, códigos novos no fim do `MESSAGES` de `projects/video/errors.js` (D-42, como a B002 fez com `RESOURCE_UNAVAILABLE`), um ramo novo no despacho de mensagens do `amqp.js` e do worker, e um tipo de evento novo no `wsGateway/video.js`, quando o código não tiver já um ponto de extensão (ver "Verificações", V1 a V3).
- A lógica nova (`chain.js`, `plan.js`, `tasks.js`, `quota.js`, `maintenance.js`) recebe as portas por parâmetro, como o `ingest.js` e o `access.js`, para ser testada com *mocks* (coding-standards).
- Uma operação isolada é uma cadeia de um passo: não há caminho próprio para operações isoladas (T-01, T-02).

## Layer Structure

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Presentation                                                             │
│  apiGateway/routes/videos.js (+ rotas de validação, operações, tarefas)  │
│  projects/routes/videos.js (+ as mesmas rotas, permissões, HTTP)         │
│  wsGateway/video.js (+ video-task-update)                                │
│  frontend (D-47): lib/video-tasks.ts, hook e painel de tarefa            │
├──────────────────────────────────────────────────────────────────────────┤
│ Application                                                              │
│  projects/video/tasks.js: aceitar (11 passos), consultar, cancelar,      │
│    tratar respostas (started/completed/failed/cancelled/dead-letter)     │
│  projects/video/maintenance.js: rotina da Q-ADD-14 (D-41)                │
├──────────────────────────────────────────────────────────────────────────┤
│ Domain                                                                   │
│  projects/video/operations/ (registo; test_reencode só com a variável)   │
│  projects/video/chain.js (validar cadeia, custo, kind, totalSteps)       │
│  projects/video/plan.js (plano de execução; usa formats.js, T-05)        │
│  projects/video/encoding.js (codificação por omissão, D-39)              │
│  projects/video/errors.js (+ códigos novos no fim do MESSAGES)           │
├──────────────────────────────────────────────────────────────────────────┤
│ Infrastructure                                                           │
│  projects/models/videoTask.js, projects/models/videoProjectLock.js       │
│  projects/video/locks.js (aquisição e libertação do lugar)               │
│  projects/video/quota.js (process/:n, refund/:k, fila por runner)        │
│  projects/video/taskBus.js (publicar tarefa e cancelamento; respostas)   │
│  rabbitMQ/definitions.json (+ exchange video_control)                    │
│  Tools/video/: task.py, executor.py, control.py, ops/                    │
└──────────────────────────────────────────────────────────────────────────┘
```

### Componentes e ficheiros

**Novos, no serviço de projetos:**

1. `projects/models/videoTask.js`: modelo `VideoTask` (coleção `videotasks`).
2. `projects/models/videoProjectLock.js`: coleção `video_project_locks`.
3. `projects/video/operations/index.js`: registo. Carrega os módulos de operação e só regista a `test_reencode` quando `VIDEO_TEST_OPERATIONS=1` (D-37).
4. `projects/video/operations/test_reencode.js`: operação de teste da D-37.
5. `projects/video/chain.js`: `validateChain(steps, inputProps, profile)`, `chainCost(steps)`, `taskKind(steps)`, `totalSteps(steps)`.
6. `projects/video/plan.js`: plano de execução (T-01, T-05).
7. `projects/video/encoding.js`: parâmetros de codificação por omissão (D-39).
8. `projects/video/locks.js`: `acquire(projectId, holderId)`, `release(projectId, holderId)`.
9. `projects/video/quota.js`: `reserve(runnerId, n)`, `refund(runnerId, k)`, `remaining(runnerId)`; fila de promessas por `runnerId` (T-04).
10. `projects/video/taskBus.js`: publicação das tarefas e dos cancelamentos e registo do tratamento das respostas de tarefa, sobre o `amqp.js` da B001 (V1).
11. `projects/video/tasks.js`: aplicação (aceitação, consulta, cancelamento, respostas).
12. `projects/video/maintenance.js`: rotina periódica (D-41, D-15).

**Novos, no worker `Tools/video/`:**

1. `task.py`: tratamento de uma mensagem `task.run` (descarregar, executar, enviar, responder).
2. `executor.py`: construção do comando FFmpeg a partir do plano (um único `-filter_complex`) e leitura do progresso.
3. `control.py`: canal de controlo (fila exclusiva ligada a `video_control`) e conjunto de `taskId` cancelados com TTL.
4. `ops/__init__.py`: registo de operações do worker; `ops/test_reencode.py`, registada só com `VIDEO_TEST_OPERATIONS=1` (D-37).

**Novos, no frontend (D-47):** `frontend/lib/video-tasks.ts`, `frontend/components/video/use-video-task.ts` e `frontend/components/video/video-task-progress.tsx`.

**Linhas acrescentadas em ficheiros existentes (sem alterar as que lá estão):**

1. `projects/routes/videos.js` e `apiGateway/routes/videos.js`: as quatro rotas novas.
2. `projects/video/errors.js`: os códigos novos no fim do `MESSAGES` (D-42, D-44).
3. `projects/video/amqp.js`: um ramo novo no despacho das respostas e, se não existir, uma função de publicação numa exchange (V1).
4. `Tools/video/video.py`: um ramo novo no despacho para `task.run` (V2).
5. `wsGateway/video.js`: o evento `video-task-update` (V3).
6. Arranque do serviço de projetos: uma linha `require("./video/maintenance").start()`, ao lado da linha do `amqp.js` da B001.
7. `rabbitMQ/definitions.json`: a exchange `video_control`.
8. `docker-compose.yaml`: nada (a `VIDEO_TEST_OPERATIONS` não é definida lá, D-37).

## API Design

Todas as rotas passam pelo gateway em `/api-gateway/projects/:user/:project/videos…`, com `videoAuth`, `X-Correlation-Id` e `X-Caller-Id` (T-00, T-10). O gateway só as reencaminha e normaliza os erros, como nas rotas da B001 e da B002. As rotas de tarefa (`tasks/:taskId`) ficam antes de qualquer rota `/videos/:video/:x` com segundo segmento variável (T-03; V4).

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/projects/:user/:project/videos/validate` | POST | `{videoId, steps}`. Autorização da pré-visualização (T-01, T-07): `videoAuth`, edição (`checkSharePermission` + `requireEditPermission` + `enforcePresenceLimit`), recusa do `anonymous` | **200** `{valid, cost, totalSteps, output: PropriedadesVideo, errors: [{index, errors: [{code, field?, …}]}]}`. Os `inputProps` são lidos de `videos.meta`, nunca do cliente. Sem tarefa, sem quota, sem filas. Responde em ≤ 1 s (D-43). Erros do pedido (sem `steps` válido, vídeo inexistente ou por concluir) usam os mesmos códigos da aceitação |
| `/projects/:user/:project/videos/:video/operations` | POST | `{steps}` (contrato T-01). Os 11 passos do T-03, por esta ordem (ver "Aceitação") | **202** `{taskId, status: "queued"}` em ≤ 1 s (TASK-001, NFR-005). Erros: 401/403 (`videoAuth`), 403/410/429 (permissões, D-23), 403 `FORBIDDEN` (`anonymous`), 404 `NOT_FOUND`, 409 `RESOURCE_NOT_READY`, 422 `UNSUPPORTED_FORMAT`/`LIMIT_EXCEEDED`/`INVALID_REQUEST`/`INVALID_STEP_PARAMS`, 409 `TASK_ALREADY_ACTIVE` `{taskId}` (D-44), 429 `QUOTA_EXCEEDED` `{cost, remaining}` (D-44) |
| `/projects/:user/:project/videos/tasks/:taskId` | GET | Permissão de leitura (`checkSharePermission`), recusa do `anonymous` (T-03). A tarefa tem de ser do projeto, senão 404 | **200** `{taskId, status, kind, step, totalSteps, progress, cost, resultVideoId?, error?: {code, message}, createdAt, updatedAt}` (TASK-002, TASK-006, TASK-008) |
| `/projects/:user/:project/videos/tasks/:taskId` | DELETE | Permissão de edição. Só o `runner_id` (senão 403 `FORBIDDEN`); só em `queued` ou `processing` (senão 409 `TASK_NOT_ACTIVE`, D-42/D-44) (TASK-004) | **200** com o mesmo corpo do GET, já em `cancelled`. O FFmpeg é interrompido de forma assíncrona (ver "Cancelamento") |

A rota de junção sem `:video` (`POST …/videos/operations`, 4.8) é da B008, que acrescenta o `concat` ao registo; o `tasks.js` já aceita uma lista de entradas, por isso a B008 só acrescenta a rota.

### Aceitação (T-03, passos 1 a 11)

1. `videoAuth` no gateway (401/403).
2. `checkSharePermission`, `requireEditPermission`, `enforcePresenceLimit` (403/410/429).
3. Tipo do executor com o `X-Caller-Id` (`projects/video/users.js` da B001): `anonymous` → 403.
4. Vídeo de entrada do projeto (`NOT_FOUND`) e `completed` (`RESOURCE_NOT_READY`).
5. Formato e limites do perfil sobre `videos.meta`, com o `formats.js` e o `profiles.js` da B001 (`UNSUPPORTED_FORMAT`, `INVALID_CODEC`, `LIMIT_EXCEEDED`).
6. Forma do corpo (`INVALID_REQUEST {field: "steps"}`) e `validateChain`: operação e versão conhecidas e `validate` de cada passo, com o `estimate` do passo anterior como entrada (`INVALID_STEP_PARAMS {index, errors}`, D-42). Custo com `chainCost`.
7. Plano com `plan.js`.
8. `holderId = new ObjectId()`; `locks.acquire(projectId, holderId)` → `TASK_ALREADY_ACTIVE` se ocupado (D-38: só tarefas de vídeo).
9. Registado: `quota.reserve(runnerId, cost)`; 701 de quota esgotada → `locks.release`, depois `remaining` lido do `GET users:/:user` (`remaining_operations`) e 429 `QUOTA_EXCEEDED {cost, remaining}`; 701 de erro interno do serviço de utilizadores → `locks.release` e `INTERNAL_ERROR`, sem reserva (V8). Premium: nenhuma chamada (QUOTA-005).
10. `VideoTask.create({_id: holderId, status: "queued", …, plan, published_at: null})`; `taskBus.publishTask(mensagem)` com confirmação do *broker*; depois `published_at = agora`. Se a publicação falhar, a tarefa fica `queued` sem `published_at` e a rotina republica-a (D-41).
11. 202 `{taskId, status: "queued"}`; evento `video-task-update` `queued`.

Os erros dos passos 1 a 9 não criam tarefa nem consomem quota. As reservas do mesmo `runnerId` passam por uma fila de promessas em memória (T-04). Os passos 3 a 7 também servem o `validate` (que para no 7).

### Contrato de mensagens AMQP (`task.run`)

Campos comuns da B001 (`messageId`, `correlationId`, `timestamp`, `status`, `output`, `error`, `metadata`), com `operation: "task.run"` e `taskId` (T-02, T-10). A associação resposta ↔ tarefa faz-se pelo `taskId`.

| Mensagem | Fila / exchange | Corpo |
|----------|-----------------|-------|
| Pedido `task.run` | `video_operations_queue` | `{messageId, correlationId, timestamp, operation: "task.run", taskId, userId: runnerId, projectId, totalSteps, plan}`. O `plan` leva as entradas (`videoId` e chave em `video_src`), os passos, as decisões por stream, a codificação, a duração esperada e os destinos (ver "Plano de execução"). Nenhum URL: o worker pede-os quando precisa (T-08) |
| Cancelamento | exchange *fanout* `video_control` | `{taskId, correlationId}` |
| Resposta `started` | `video_project_queue` | `{…, operation: "task.run", taskId, status: "started", metadata: {redelivered}}` |
| Resposta `completed` | `video_project_queue` | `{…, status: "completed", output: {meta (mesma forma do `ingest.probe`), keys: {original, thumb, firstFrame, preview?}}, metadata: {processingTime}}` |
| Resposta `failed` | `video_project_queue` | `{…, status: "failed", error: {code: "PROCESSING_ERROR" \| "RESOURCE_UNAVAILABLE", message}}`. `RESOURCE_UNAVAILABLE` (B002) quando um original não existe no storage |
| Resposta `cancelled` | `video_project_queue` | `{…, status: "cancelled"}` |
| *Dead-letter* | `video_project_queue` | O pedido `task.run` original com `x-death`, depois de duas entregas (T-03) |
| Progresso | `video_ws_queue` | `{event: "video-task-update", userId, projectId, taskId, status: "processing", step, totalSteps, progress}` |

### Evento WebSocket

`video-task-update`, emitido pelo `wsGateway/video.js` com `io.to([salaDoExecutor, "project:<id>"])` (T-03). Payload: `{projectId, taskId, status, step, totalSteps, progress, resultVideoId?, error?: {code}}`. Só identificadores, estado e progresso (risco aceite da sala do projeto).

### Sequência de uma tarefa

```text
FE ──POST operations──▶ GW ──▶ PR: passos 2–9 → VideoTask(queued) → publica task.run → 202
Worker: consome (prefetch 1) → cancelado? descarta e responde cancelled
        → responde started → pede URL GET → descarrega por blocos → ffmpeg -filter_complex … -progress pipe:1
        → ciclo 0,5 s: process_data_events (heartbeats, cancelamentos) + progresso ≥ 1×/s → video_ws_queue
        → FFprobe ao resultado, miniatura, fotograma 0, cópia (se o plano pedir) → pede URLs PUT → envia
        → responde completed → ack
PR: completed → cria o Vídeo de resultado → liberta o lugar → video-task-update → ack
FE ──DELETE tasks/:id──▶ PR: cancelled + devolução + video_control + liberta o lugar → 200
Worker: recebe {taskId} no canal de controlo → termina o ffmpeg → apaga /tmp/video/<taskId>/ → responde cancelled → ack
```

## Data Persistence

| Table | Columns | Relationships |
|-------|---------|---------------|
| `videotasks` (Mongoose `VideoTask`, `timestamps: true`) | `_id` ObjectId (= `holder_id` do lugar); `project_id`; `owner_id`; `runner_id`; `kind` enum `single \| chain \| concat`; `steps` [{operation, version, parameters}]; `input_video_ids` [ObjectId]; `status` enum `queued \| processing \| completed \| failed \| cancelled`; `step`; `total_steps`; `progress`; `cost`; `reserved_credits`; `refund` `{state: none \| pending \| done, at}` (D-45); `correlation_id`; `result_video_id`; `error` `{code, message}`; `plan` (Mixed, para republicar); `published_at`; `status_changed_at` | `project_id` → projeto; `input_video_ids` e `result_video_id` → `videos`. Sem `batch_id` nem `batch_item` (D-06) |
| `video_project_locks` | `_id`; `project_id` (índice **único**); `holder_kind` enum `task`; `holder_id`; `createdAt` | `holder_id` → `videotasks._id`. Sem `holder_kind: "batch"` (D-06) |
| `videos` (B001, sem alterações ao esquema) | Resultado: `_id` = `_id` da tarefa; `status: completed`; `source_video_ids` = `input_video_ids`; `recipe` = `steps`; `task_id`; `created_by` = `runner_id`; `owner_id`; `original_name` da primeira origem (D-35); `mime_type` do contentor; `meta` do FFprobe (com `display_*` calculado pelo `display.js`); `storage` com as chaves do resultado | — |

**Campos acrescentados à lista do ADD (T-03):** `refund`, `plan`, `published_at` e `status_changed_at`, que a D-41 e a D-45 precisam. O modelo é novo, por isso não há regra 2.6 a cumprir aqui.

**`_id` do resultado igual ao da tarefa:** uma tarefa produz no máximo um vídeo, as chaves no storage seguem a convenção da B001 (`<projectId>/<estágio>/<videoId>.<ext>`) e são conhecidas desde a aceitação (o reprocessamento escreve no mesmo sítio, T-03), e uma resposta `completed` reentregue que volte a criar o vídeo falha com chave duplicada, o que a torna idempotente.

**Chaves do resultado:** `video_out/<taskId>.mp4`, `video_thumb/<taskId>.thumb.jpg`, `video_thumb/<taskId>.frame0.jpg` e, se for preciso, `video_preview/<taskId>.mp4`, no bucket `user-<ownerId>`.

**Índices:**

- `videotasks`: `{project_id: 1, status: 1}`; `{status: 1, status_changed_at: 1}` (tarefas paradas); `{status: 1, published_at: 1}` (por publicar); `{"refund.state": 1, updatedAt: 1}` (devoluções pendentes).
- `video_project_locks`: `{project_id: 1}` único; `{createdAt: 1}` (lugares órfãos).

**Escritas condicionais (idempotência, T1 a T3):**

- `started`: `{_id, status: {$in: ["queued", "processing"]}}` → `processing`, `progress: 0`, `step: 1`, `status_changed_at`.
- `completed`, `failed`, `cancelled` (pedido HTTP ou rotina): `{_id, status: {$in: ["queued", "processing"]}}` → estado final; nos dois últimos, `refund.state: "pending"` quando `reserved_credits > 0`, na mesma escrita. Só quem ganha a transição aplica os efeitos.
- Devolução: `{_id, "refund.state": "pending"}` → `done`, depois da chamada `refund/:k` (D-45).
- Lugar: `deleteOne({project_id, holder_id})`.

**Filas (`rabbitMQ/definitions.json`):** acrescenta-se a exchange `video_control` (`type: fanout`, `durable: true`). Cada réplica do worker declara em tempo de execução a sua fila exclusiva (nome gerado pelo servidor, `exclusive`, `auto_delete`) e liga-a à exchange; essa fila não fica em `definitions.json`. A `video_operations_queue` não muda (D-08, D-18).

## Plano de execução e executor (T-01, T-02, T-05)

**Registo (projetos).** Cada módulo exporta `{name, versions, validate(parameters, inputProps, profile), estimate(inputProps, parameters), cost, copyable(inputProps, parameters)}`. Uma operação ou versão desconhecida dá um erro no índice do passo (D-42). A `test_reencode` (v1, `parameters: {}`, custo 1) não altera as propriedades, exceto a rotação: a recodificação aplica a etiqueta de rotação aos píxeis (*autorotate*), pelo que o `estimate` devolve as dimensões de apresentação, `rotation: 0` e as dimensões ímpares arredondadas ao par (T-02); `copyable` → `{video: false, audio: false}`.

**Plano (`plan.js`).** Para cada stream:

- vídeo: `copy` se o codec de origem é o de saída da matriz para o contentor de saída e nenhum passo o altera (`copyable`); senão `encode` com a codificação por omissão;
- áudio: `none` sem áudio; `copy` nas mesmas condições; senão `encode`.

O plano leva ainda:

- `inputs: [{videoId, stage: "video_src", name, container}]`;
- `steps`;
- `output: {container: "mp4", video: {mode, codec: "libx264", pixFmt: "yuv420p", preset: "veryfast", crf: 23, evenCrop}, audio: {mode, codec: "aac", bitrate: "128k"}, faststart: true, genpts}` (D-39, T-02, T-05);
- `expectedDurationMs`, do `estimate` do último passo (para a percentagem);
- `targets` (as chaves do resultado);
- `preview`: `null` quando o vídeo é recodificado (o resultado é H.264 `yuv420p`, compatível); quando o vídeo é copiado, o critério de compatibilidade do `formats.js` como dados (codec e `pixFmt` esperados) e o plano da cópia, para o worker o aplicar ao FFprobe do resultado sem ter regras próprias (T-06). Na B003, com a `test_reencode`, o vídeo é sempre recodificado; o caminho da cópia é exercitado a partir da B004.

**Executor (worker).** `executor.py` monta:

```text
ffmpeg -hide_banner -nostdin -y [-fflags +genpts] -i <in0>
  -filter_complex "[0:V:0]<filtros de vídeo dos passos>[,crop=trunc(iw/2)*2:trunc(ih/2)*2][v];[0:a:0]<filtros de áudio>[a]"
  -map "[v]" [-map "[a]"] -sn -dn
  -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart
  -progress pipe:1 -nostats <taskId>.mp4
```

- Sem filtros num ramo, usa-se `null`/`anull`.
- Uma stream copiada não entra no grafo (`-map 0:V:0 -c:v copy`).
- Cada `ops/<op>.py` só traduz `parameters` em filtros (`video_filters`, `audio_filters`); a `test_reencode` devolve listas vazias.
- Uma única invocação de codificação por tarefa (NFR-013), registada no log com o comando, sem URLs.

**Progresso.** `progress = min(99, floor(out_time_us / (expectedDurationMs × 1000) × 100))` durante a codificação, e 100 só na resposta `completed`. O valor é monótono dentro de uma entrega (máximo dos valores lidos). `step = min(totalSteps, floor(progress / 100 × totalSteps) + 1)` (D-40). O ciclo de 0,5 s publica um evento sempre que passou 1 s desde o último, mesmo sem dados novos (repete o valor). Por isso a cadência ≥ 1×/s vale também durante o descarregamento (0) e o envio (99) (NFR-009).

**Ciclo do worker (uma só *thread*, T-03).** Repete as voltas descritas no ADD:

1. `process_data_events(time_limit=0.5)`;
2. leitura sem bloqueio do `-progress` com `selectors`;
3. verificação do conjunto de cancelados;
4. no fim, envio e `ack`.

Descarregamento e envio por blocos, com `process_data_events(time_limit=0)` entre blocos e o PUT com corpo de tamanho conhecido (a correção do `_PumpingFile` da B001). A miniatura, o fotograma 0 e o FFprobe reutilizam as funções do `ingest.py` por `import`, sem o alterar (V2).

**Reentrega.** Com `redelivered=true`, o worker apaga `/tmp/video/<taskId>/` e recomeça do zero; as chaves de saída são as mesmas (T-03).

## Cancelamento (T-03)

1. **Serviço de projetos (`DELETE`):** transição condicional para `cancelled` com `refund.state: pending`. Depois publica `{taskId}` em `video_control`, chama `refund/:k` e marca `done`, liberta o lugar, emite `video-task-update` e responde 200.
2. **Worker:** o canal de controlo junta o `taskId` a um conjunto com TTL de **4 h**. O valor fica acima do maior tempo que uma tarefa pode esperar na fila, que a D-41 limita a 3 h 10 min: depois disso, a tarefa é fechada pela rotina.
   - Tarefa a correr: `terminate()`, `kill()` ao fim de 5 s se não sair, apaga os temporários, responde `cancelled` e faz `ack`.
   - Tarefa ainda na fila: é descartada quando é consumida (`cancelled` + `ack`).
3. **Resposta tardia:** um `completed` de uma tarefa já `cancelled` ou `failed` leva o serviço de projetos a apagar os objetos do resultado (`targets`) do storage e a não criar vídeo (T-03, NFR-007).
4. **Cancelamento perdido num reinício do worker:** se chegar `started` de uma tarefa já `cancelled`, o serviço de projetos volta a publicar `{taskId}` em `video_control`. Isto reduz o risco aceite do T-03 (conjunto em memória) sem mudar o contrato.

## Respostas do worker (`tasks.js`, via `taskBus`)

| Mensagem | Efeito (idempotente; `ack` só no fim) |
|----------|---------------------------------------|
| `started` | `queued/processing → processing` (`step: 1`, `progress: 0`); `video-task-update`. Se a tarefa já for `cancelled`, volta a publicar o cancelamento. Se for outro estado final, ignora |
| `completed` | 1. Transição para `completed` (`progress: 100`, `result_video_id = _id`). 2. Se ganhou a transição, ou se a tarefa já estava `completed` (reentrega): cria o Vídeo de resultado (`E11000` = já criado), liberta o lugar e emite `video-task-update`. 3. Se a tarefa estava `cancelled` ou `failed`: apaga os objetos do resultado |
| `failed` | Transição para `failed` com `error` e `refund: pending` → devolução → `done` → liberta o lugar → `video-task-update` |
| `cancelled` | A tarefa já é `cancelled`: confirma e regista no log |
| *Dead-letter* (`x-death`, `operation: "task.run"`) | Como `failed`, com `PROCESSING_ERROR` (NFR-007); publica também o cancelamento, para o caso de ainda haver um FFmpeg vivo |

O worker limpa `/tmp/video/<taskId>/` em todos os casos de fim (sucesso, falha, cancelamento), e a pasta é também limpa no recomeço de uma reentrega (ERROR-003).

## Rotina de manutenção (`maintenance.js`, Q-ADD-14, D-41, D-15)

Arranca com o serviço de projetos (`setInterval`). Cada volta é protegida contra sobreposição (não começa enquanto a anterior corre). As escritas são condicionais, pelo que duas réplicas do serviço de projetos podem corrê-la ao mesmo tempo (V7).

| Período | Passo | Critério | Ação |
|---------|-------|----------|------|
| 60 s | Lugares órfãos | `createdAt` com mais de 60 s e sem `videotasks._id = holder_id` | `deleteOne({project_id, holder_id})` |
| 60 s | Tarefas por publicar | `queued`, `published_at: null`, `createdAt` com mais de 60 s | Republicar a mensagem a partir do `plan` guardado; marcar `published_at` |
| 60 s | Tarefas paradas | `queued` ou `processing` com `status_changed_at` (ou `published_at`) com mais de 3 h 10 min | `failed` com `PROCESSING_ERROR` e `refund: pending`; cancelamento em `video_control`; devolução; liberta o lugar; `video-task-update` |
| 60 s | Devoluções pendentes | `refund.state: pending` há mais de 60 s | `refund/:k` e `done` (D-45) |
| 60 s | Carregamentos abandonados (D-15) | `videos` com `status: queued` e `updatedAt` com mais de 1 200 s | Apaga o objeto em `video_src` (se existir) e o registo, por esta ordem |
| 10 min | Projetos apagados | `project_id` de `videos`, `videotasks` e `video_project_locks` sem documento de projeto | Fecha as tarefas ativas (D-46); apaga os objetos de cada vídeo (original, cópia, miniatura, fotograma 0), depois os vídeos, as tarefas e os lugares |

Cada ação é registada no log com o `correlationId` da tarefa ou do vídeo (ou um id próprio da volta).

## Security Design

| Concern | Approach |
|---------|----------|
| Authentication | `videoAuth` da B001 em todas as rotas novas (401). |
| Authorization | Submeter e validar exigem edição; consultar uma tarefa exige leitura; cancelar exige edição e `runner_id` = executor (403). O `anonymous` é recusado (403). A tarefa tem de pertencer ao `:project` do caminho (404), para não se poder ler ou cancelar a tarefa de outro projeto com uma permissão válida noutro. |
| Entradas do cliente | Só `videoId` e `steps`. As propriedades de entrada vêm sempre de `videos.meta`, e as chaves, os buckets e o plano são calculados no servidor (T-01). |
| Quota | O executor da quota é o `X-Caller-Id` (QUOTA-006), nunca o dono do projeto. O Premium não chama a reserva. |
| WebSocket | Os eventos levam só identificadores, estado, progresso e código de erro (risco aceite do T-03). |
| Logs | JSON em `stdout`, com `correlationId` e `taskId`. Sem JWT nem URLs assinados (a redação da B001 é reutilizada no worker e no serviço de projetos). A causa técnica (fim do `stderr` do FFmpeg) só nos logs (ERROR-002). |
| Operação de teste | A `test_reencode` só existe com `VIDEO_TEST_OPERATIONS=1`, que não fica no `docker-compose.yaml` (D-37); sem a variável, a operação é desconhecida (422). |

## NFR Implementation

| Requirement | Design Approach |
|-------------|-----------------|
| NFR-005 / TASK-001 (≤ 1 s) | A aceitação faz duas chamadas ao serviço de utilizadores (tipo e reserva), leituras indexadas e uma publicação com confirmação; nenhuma chamada ao storage nem ao worker. Medido nos testes. |
| NFR-006 (assíncrono) | Todo o processamento corre no worker; o pedido HTTP termina na publicação. |
| NFR-007 / ERROR-003 | `ack` manual nos dois lados; reentrega → recomeço do zero; *dead-letter* → `failed` com devolução; resultados tardios apagados; temporários limpos em todos os fins; rotina para o que sobra. |
| NFR-009 | Progresso ≥ 1×/s em todas as fases da entrega, monótono dentro da entrega. |
| NFR-011 (verificação) | Só as filas de vídeo e a exchange `video_control`; `Tools/utils/` e as filas de imagem sem alterações (verificado com `git diff` e `rabbitmqctl`). |
| NFR-013 | Um único `-filter_complex` e uma única invocação de codificação por tarefa; verificado no log do worker. |
| NFR-018 | Saída MP4 `libx264`/`aac`, `yuv420p`, `+faststart` (D-39); verificado com o FFprobe do resultado. |
| NFR-021 | Índice único em `video_project_locks.project_id`; 409 antes de reservar. |
| NFR-002 / ERROR-002 | `correlationId` gerado no gateway, gravado na tarefa, no corpo das mensagens e nos logs JSON do gateway, do serviço de projetos e do worker. |
| D-43 | `validate` sem filas nem storage; medido nos testes. |

## Error Handling

Formato `{error: {code, message, details}, correlationId}` (ERROR-001, T-10). Mensagens em português, com instrução corretiva.

| Error Type | Code | Response |
|------------|------|----------|
| Corpo sem `steps` válido | `INVALID_REQUEST` `{field: "steps"}` (D-23, D-42) | 422 |
| Operação ou versão desconhecida, ou erro do `validate` de um passo | `INVALID_STEP_PARAMS` `{index, errors: [{code, field?, …}]}` (D-42) | 422 |
| Projeto já com tarefa ativa | `TASK_ALREADY_ACTIVE` `{taskId}` (D-44) | 409 |
| Quota insuficiente | `QUOTA_EXCEEDED` `{cost, remaining}` (T-03, D-44) | 429 |
| Cancelar uma tarefa fora de `queued`/`processing` | `TASK_NOT_ACTIVE`, no fim do `MESSAGES` (D-42, D-44) | 409 |
| Cancelar sem ser quem submeteu | `FORBIDDEN` (D-21) | 403 |
| Tarefa inexistente ou de outro projeto | `NOT_FOUND` (D-21) | 404 |
| Vídeo de entrada por concluir / formato / limites | `RESOURCE_NOT_READY` / `UNSUPPORTED_FORMAT`, `INVALID_CODEC` / `LIMIT_EXCEEDED` | 409 / 422 |
| Falha do FFmpeg ou entregas esgotadas | `PROCESSING_ERROR` (D-21) | Na tarefa e no `video-task-update` |
| Original em falta no storage durante a tarefa | `RESOURCE_UNAVAILABLE` (B002) | Na tarefa e no `video-task-update` |
| Falha de infraestrutura nas rotas | `INTERNAL_ERROR` (D-21) | 500/502 |

## External Dependencies

| Service | Purpose | Integration |
|---------|---------|-------------|
| Serviço de utilizadores (baseline, sem alterações) | Tipo, reserva, devolução e saldo | `GET users:/:user/type`, `GET users:/:user/process/:n` (701 = saldo insuficiente), `POST users:/:user/process/refund/:k`, `GET users:/:user` (`remaining_operations`) |
| `imageStorageService` (módulo de vídeo da B001) | URLs internos GET/PUT, `HEAD` e `DELETE` dos objetos | REST interno `/video/*`, sem alterações |
| RabbitMQ 4.0.5 | Tarefas, respostas, cancelamentos, progresso | `amqp.js` da B001 (estendido) e `pika==1.3.2` no worker |
| FFmpeg/FFprobe 5.1 (D-25) | Execução das cadeias | `subprocess.Popen` no worker |
| Socket.IO (wsGateway) | `video-task-update` | `wsGateway/video.js` (estendido) |

**Sem dependências novas.** Nada de `archiver` (D-06).

## Frontend (D-47)

Pela D-47, este bolt constrói só as peças comuns, sem as montar em nenhum ecrã (as operações e os seus painéis chegam na B004):

- `lib/video-tasks.ts`: `submitVideoOperation`, `validateVideoSteps` (com *debounce*), `getVideoTask`, `cancelVideoTask`, e mensagens para os códigos novos.
- `use-video-task.ts`: escuta `video-task-update` e ignora eventos de tarefas que já sabe terminadas (T-03). Depois de recarregar a página, recupera o estado com o GET a partir do `taskId` guardado em `sessionStorage`.
- `video-task-progress.tsx`: barra de progresso, "passo k de N", botão Cancelar (só para quem submeteu) e erro com o `correlationId` como código de suporte (T-10).

## Verificações a fazer no Estágio 4 (dependem do código das B001 e B002)

1. **V1:** como o `projects/video/amqp.js` despacha as mensagens de `video_project_queue` (incluindo as de *dead-letter*) e se tem uma função de publicação numa exchange. O ramo `task.run` tem de ser acrescentado antes de qualquer tratamento por omissão, só com linhas novas.
2. **V2:** como o `Tools/video/video.py` despacha por `operation`; se as funções de miniatura, fotograma 0, FFprobe, URLs e transferência do `ingest.py`/`storage.py` podem ser importadas tal como estão; e se a subclasse `video_rabbit.py` deixa abrir um segundo canal na mesma ligação.
3. **V3:** se o `wsGateway/video.js` emite o `event` da mensagem de forma genérica ou só `video-ingest-update`, e com que nome de sala do utilizador.
4. **V4:** a ordem das rotas `/:video/…` no router de vídeo do serviço de projetos e do gateway (para `tasks/:taskId`), os *middlewares* da B002 (`loadProject`, `rejectAnonymous`, `loadVideo`) e a normalização de erros do gateway para 202 e para os códigos novos.
5. **V5:** que funções o `formats.js` exporta (codec de saída por contentor, compatibilidade com o navegador) e as do `profiles.js` e do `display.js`; o que faltar acrescenta-se como exportações novas, sem mudar as existentes.
6. **V6:** o modelo do projeto, só para leitura, e se a remoção de uma conta (`DELETE /:user`) apaga os projetos (Q-ADD-14 "cobre também a remoção de contas").
7. **V7:** quantas réplicas do serviço de projetos o `docker-compose.yaml` lança.
8. **V8 (pedido da equipa):** o `GET users:/:user/process/:n` responde 701 tanto para "No more daily_operations available" (quota esgotada) como no `catch`, com "Error acquiring user's information." (erro interno; `users/routes/users.js`). Só o primeiro caso é `QUOTA_EXCEEDED`; o segundo é `INTERNAL_ERROR`, sem reserva e com o lugar libertado. Confirmar no código como os dois se distinguem (corpo da resposta); se não der para os distinguir com segurança, registar uma dúvida e parar.

Se alguma verificação mostrar que a extensão não é possível só com linhas acrescentadas, o problema é registado em `docs/specsDuvidas.md` e o Estágio 4 para antes de alterar código.

## Decisões tomadas no checkpoint do Estágio 2

Respondidas pela equipa e registadas em `docs/specsDuvidas.md`:

1. **D-44:** `TASK_NOT_ACTIVE` (409), `TASK_ALREADY_ACTIVE` (409, `{taskId}`) e `QUOTA_EXCEEDED` com HTTP 429.
2. **D-45:** devolução pelo menos uma vez (`refund.state: pending` → `done`, repetida pela reentrega e pela rotina), com o risco residual registado na resposta: devolução dupla numa queda de milissegundos e perda dos créditos numa queda entre a reserva e a criação da tarefa.
3. **D-46:** tarefa ativa de um projeto apagado → `cancelled` com devolução e cancelamento em `video_control`, antes da remoção.
4. **D-47:** a B003 constrói e testa as peças comuns de tarefa do frontend sem as montar; a B004 monta-as (registado nos limites do `bolt.md` da B004).
5. **V8** acrescentada às verificações do Estágio 4, a pedido da equipa.
6. Para o Estágio 3, a equipa pediu ADR para as decisões que vão além do ADD: voltar a publicar o cancelamento quando chega `started` de uma tarefa cancelada; os campos `refund`, `plan`, `published_at` e `status_changed_at` do `VideoTask`; e o `_id` do vídeo de resultado igual ao da tarefa.
