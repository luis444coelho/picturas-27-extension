---
last_updated: 2026-10-22T22:34:06Z
total_decisions: 14
---

# Decision Index

This index tracks all Architecture Decision Records (ADRs) created during Construction bolts.
Use this to find relevant prior decisions when working on related features.

## How to Use

**For Agents**: Scan the "Read when" fields below to identify decisions relevant to your current task. Before implementing new features, check if existing ADRs constrain or guide your approach. Load the full ADR for matching entries.

**For Humans**: Browse decisions chronologically or search for keywords. Each entry links to the full ADR with complete context, alternatives considered, and consequences.

---

## Decisions

<!-- Entries are appended below in reverse chronological order (newest first) -->

### ADR-014: Modos de stream na validação apenas de `convert`
- **Status**: proposed (checkpoint de implementação da B007 pendente)
- **Date**: 2026-10-22
- **Bolt**: 007-video-format-conversion (002-video-transformations)
- **Path**: `bolts/007-video-format-conversion/adr-014-convert-validation-modes.md`
- **Summary**: D-72 (a): campos `videoMode`/`audioMode` apenas no `output` da validação de `convert`, por extensão aditiva após `plan.decide`; erros de formato 422 preservam os códigos específicos. As respostas B004/B005 permanecem iguais.
- **Read when**: Adding conversion UI, validating video steps, changing the `output` response or handling `SAME_FORMAT`/`UNSUPPORTED_TARGET_FORMAT`.

### ADR-013: Ramo aditivo para a conversão isolada no worker
- **Status**: proposed (checkpoint de implementação da B007 pendente)
- **Date**: 2026-10-22
- **Bolt**: 007-video-format-conversion (002-video-transformations)
- **Path**: `bolts/007-video-format-conversion/adr-013-convert-worker-path.md`
- **Summary**: Um ramo novo exclusivo de `convert` no `task.py` chama `convert_task.py`; produz AVI e preview MP4 numa só invocação com `split`/`asplit`, reutilizando execução, cancelamento, FFprobe e storage da B003 sem alterar o executor existente. O plano persiste `previewInSameInvocation` via extras no padrão ADR-008/011.
- **Read when**: Working on conversion, dual FFmpeg outputs, worker task execution, preview copies or B008 chain integration.

### ADR-012: Contraste e saturação do ajuste em RGB nos dois motores (`lutrgb` e matriz de luma BT.601)
- **Status**: accepted
- **Date**: 2026-10-22
- **Bolt**: 005-video-visual-edits (002-video-transformations)
- **Path**: `bolts/005-video-visual-edits/adr-012-adjust-rgb.md`
- **Summary**: Com o `eq` do ADD 4.3 (YUV), a pré-visualização diferia do resultado até 45,78/255 no contraste e na saturação. D-67 (a), aprovada: contraste com `lutrgb` e pivô 128 no worker (sharp `linear(c, 128·(1−c))`, sem mudança) e saturação com a matriz `s·I + (1−s)·luma BT.601` (`colorchannelmixer` no worker e `recomb` no sharp), igual ao `ImageEnhance.Color` (DQ-020). O brilho não muda. Depois da mudança, a diferença ficou entre 0,42 e 1,39.
- **Read when**: Working on the adjust operation, its preview, sharp/FFmpeg equivalence, or chains that combine adjust with other colour steps (B008).

### ADR-011: `planExtrasVisual.js` e ponte `visual_input.py` para os extras do plano da B005
- **Status**: accepted
- **Date**: 2026-10-22
- **Bolt**: 005-video-visual-edits (002-video-transformations)
- **Path**: `bolts/005-video-visual-edits/adr-011-visual-plan-extras.md`
- **Summary**: O `applyPlanExtras()` sai antes quando não há `trim`, `remove_audio` nem `speed` (linha existente, regra 2.6). D-63 (a), aprovada: o módulo novo `planExtrasVisual.js`, chamado por uma linha nova em `tasks.js`, acrescenta `plan.steps[i].filter` (entrada do catálogo) e `plan.steps[i].mark` (origem `video_src/wm-<id>.png` e caixa). No worker, `visual_input.py` (duas linhas novas no `task.py`) copia-os para `_filter` e `_overlay` numa cópia do plano. A marca entra no grafo único por `movie` + `overlay`, sem alterar o `executor.py`.
- **Read when**: Adding plan extras for new operations (B007, B008), working on filter or watermark steps, the worker's step parameters, or the single filtergraph built by `executor.build_command`.

### ADR-010: Dimensões da marca de água gravadas pelo servidor em `parameters._mark`, antes da validação
- **Status**: accepted
- **Date**: 2026-10-22
- **Bolt**: 005-video-visual-edits (002-video-transformations)
- **Path**: `bolts/005-video-visual-edits/adr-010-mark-resolution-middleware.md`
- **Summary**: O `validate` é síncrono e não conhece as dimensões da marca (WATERMARK-005, RN3). D-61 (a), aprovada: um router novo, montado antes do router de vídeo da B001, remove o `_mark` do cliente, repete a autorização sem responder e grava `parameters._mark = {watermarkId?, width, height}` nos pedidos `…/validate` e `…/operations`. O texto é gerado com o sharp e só é guardado na aceitação.
- **Read when**: Working on the watermark operation, `video_watermarks`, routes mounted before the B001 video router, recipe parameters set by the server, or reusing recipes with watermarks (B008 presets).

### ADR-009: Consulta explícita de controlo na ligação existente do worker
- **Status**: accepted
- **Date**: 2026-10-22
- **Bolt**: 004-video-basic-edits (002-video-transformations)
- **Path**: `bolts/004-video-basic-edits/adr-009-control-polling.md`
- **Summary**: A integração real expôs que o Pika 1.3.2 adia callbacks reentrantes enquanto a tarefa corre. D-56 (a), aprovada: fila exclusiva adicional no canal de controlo existente, consultada por `basic_get` em `_wait()`, reutilizando `ControlChannel._on_message`. Mantêm-se a ligação única, thread principal, assinaturas e todas as linhas anteriores das B001–B003.
- **Read when**: Working on cancellation, Pika callback dispatch, worker heartbeats, control queues or executor wait hooks.

### ADR-008: `planExtras.js` como módulo de extensão do plano sem alterar o `plan.js` da B003
- **Status**: accepted
- **Date**: 2026-10-22
- **Bolt**: 004-video-basic-edits (002-video-transformations)
- **Path**: `bolts/004-video-basic-edits/adr-008-plan-extras.md`
- **Summary**: O `plan.js` da B003 conhece `estimate` e `copyable { video, audio }` por stream. A B004 precisa de campos que esse contrato não exprime: `plan.keyframeCopy` (com `atMs`, `endMs`, `video`, `audio`, `preview` e `dropStep`, ADR-007) e `input: { fpsNum, fpsDen }` por passo (taxa de fotogramas da entrada, usada pelo filtro `fps=` da velocidade, D-52). O módulo `projects/video/planExtras.js` exporta `applyPlanExtras(plan, steps, inputProps, registry)`, aplicado após `plans.buildPlan(...)` no `tasks.js` com uma única linha nova, sem alterar o `plan.js` (regra 2.6). D-54 (a): pode também acrescentar `plan.targets.preview` ausente, determinístico a partir de `original`, com o mesmo proprietário/projeto, persistido antes da publicação; preserva `plan.preview`, `plan.output`, destinos existentes e assinatura. O worker só usa o destino recebido. Padrão declarado para as B005, B007 e B008.
- **Read when**: Extending the execution plan with step-level data not expressible by `estimate`/`copyable` (e.g. conditional copy flags, per-step `input.fpsNum/fpsDen`, chain-specific metadata); working on `plan.js`, `tasks.js`, or any bolt that adds new operation modules (B005, B007, B008+).

### ADR-007: O worker escolhe entre duas alternativas do plano calculadas pelo serviço de projetos (cópia no *keyframe* do recorte)
- **Status**: accepted
- **Date**: 2026-10-22
- **Bolt**: 004-video-basic-edits (002-video-transformations)
- **Path**: `bolts/004-video-basic-edits/adr-007-keyframe-copy-worker-decision.md`
- **Summary**: REQ-VID-TRIM-010 permite copiar vídeo e áudio sem recodificação quando o instante de início do recorte coincide com um *keyframe*. O serviço de projetos (`planExtras.js`, ADR-008) calcula **ambas** as alternativas: cópia (`plan.keyframeCopy` com `atMs`, `endMs`, `video`, `audio`, `preview`, `dropStep`) e recodificação (restante plano). O worker verifica a coincidência com `round((pts − first_pts) × 1000) == atMs` e escolhe entre elas; falha do FFprobe recai para recodificação sem falhar a tarefa. Áudio na cópia: `copy` (AAC), `encode` (MP3/outro), ou `none` (sem áudio). `metadata.videoMode = "copy" | "encode"`. Precedente: B001 (ADR-002), onde o worker também devolve FFprobe e o serviço de projetos decide.
- **Read when**: Working on the `trim` operation, the `keyframe.py` module, the `keyframeCopy` plan field (structure: `{atMs, endMs, video, audio, preview, dropStep}`), chains starting with a trim step (B008), or any future operation where the worker must choose between copy and re-encode at runtime.
- **Stage 5 clarification (D-57 a, approved)**: If packet presentation timestamps show that a copied prefix cannot preserve the selected end because of B-frame references, use the persisted encode alternative. Keep the one-frame tolerance and publish the actual mode. Copy remains available for representable intervals.

### ADR-006: Pastas temporárias órfãs depois de um *dead-letter*: ficheiro de bloqueio por tarefa e limpeza no arranque do worker
- **Status**: accepted
- **Date**: 2026-10-22
- **Bolt**: 003-video-task-foundation (001-video-lifecycle)
- **Path**: `bolts/003-video-task-foundation/adr-006-pastas-temporarias-orfas.md`
- **Summary**: Depois de um *dead-letter*, nenhum worker volta a receber a tarefa, e o cancelamento em `video_control` pode perder-se se o worker reiniciado ainda não estiver ligado, deixando `/tmp/video/<taskId>` no volume. Cada tarefa em execução mantém um `flock` em `/tmp/video/<taskId>/.task.lock`; no arranque, e ao receber o cancelamento de uma tarefa que não corre, o worker apaga as pastas cujo *lock* consegue tomar.
- **Read when**: Working on the video worker's temporary files (`video_tmp`), redelivery or dead-letter handling, worker restarts, the number of worker replicas (Q-ADD-10), or cleanup of ingestion or task leftovers.

### ADR-005: O vídeo de resultado tem o mesmo `_id` que a tarefa
- **Status**: accepted
- **Date**: 2026-10-22
- **Bolt**: 003-video-task-foundation (001-video-lifecycle)
- **Path**: `bolts/003-video-task-foundation/adr-005-id-do-resultado-igual-ao-da-tarefa.md`
- **Summary**: A criação do vídeo de resultado tem de ser idempotente numa reentrega e as chaves do resultado têm de ser conhecidas antes de o worker começar (T-03). O vídeo de resultado é criado com `_id` igual ao da tarefa, as chaves `video_out/<taskId>.mp4`, `video_thumb/<taskId>.*` e `video_preview/<taskId>.mp4` vão no plano desde a aceitação, e um `E11000` na inserção é tratado como já criado.
- **Read when**: Creating result videos from tasks (any operation, chain or concat, B004+), naming storage keys of results, handling redelivered `completed` replies, or cleaning up late or orphaned results.

### ADR-004: Campos `refund`, `plan`, `published_at` e `status_changed_at` no `VideoTask`
- **Status**: accepted
- **Date**: 2026-10-22
- **Bolt**: 003-video-task-foundation (001-video-lifecycle)
- **Path**: `bolts/003-video-task-foundation/adr-004-campos-extra-do-videotask.md`
- **Summary**: A rotina da Q-ADD-14 (D-41) e a devolução pelo menos uma vez (D-45) precisam de estado que os campos do T-03 não guardam. O `VideoTask` ganha `refund {state, at}` (gravado como `pending` na mesma escrita da transição final), `plan` (para republicar), `published_at` e `status_changed_at`.
- **Read when**: Changing the `VideoTask` model, the quota reservation or refund flow, the maintenance routine (stuck tasks, unpublished tasks, pending refunds), or reading task data directly from MongoDB.

### ADR-003: Voltar a publicar o cancelamento quando chega `started` de uma tarefa cancelada
- **Status**: accepted
- **Date**: 2026-10-22
- **Bolt**: 003-video-task-foundation (001-video-lifecycle)
- **Path**: `bolts/003-video-task-foundation/adr-003-reenvio-do-cancelamento.md`
- **Summary**: O conjunto de tarefas canceladas do worker vive em memória e perde-se num reinício, e uma tarefa cancelada na fila pode chegar a correr (risco aceite do T-03). Quando o serviço de projetos recebe `started` de uma tarefa já `cancelled`, volta a publicar `{taskId}` em `video_control`; a rotina e o *dead-letter* também publicam o cancelamento quando fecham uma tarefa.
- **Read when**: Working on task cancellation, the `video_control` exchange, the worker's control channel or cancelled-set TTL, or the handling of worker replies in `projects/video/tasks.js`.

### ADR-002: Ingestão em duas idas ao worker, com as regras de formato só no serviço de projetos
- **Status**: accepted
- **Date**: 2026-10-21
- **Bolt**: 001-video-lifecycle (001-video-lifecycle)
- **Path**: `bolts/001-video-lifecycle/adr-002-ingestao-em-duas-idas.md`
- **Summary**: A ingestão precisa de validar codecs e duração e de planear a cópia MP4, mas a matriz de formatos só pode existir no `projects/video/formats.js`, e os codecs só se conhecem depois do FFprobe no worker. A ingestão faz duas idas ao worker (`ingest.probe` → validação e plano no serviço de projetos → `ingest.derive`), com mensagens associadas por `videoId` + `operation` e `ack` manual.
- **Read when**: Working on the video worker (`Tools/video/`), the AMQP contract or `projects/video/amqp.js`, the format matrix (`formats.js`), execution plans for video operations or chains (B003+), or idempotency and redelivery of video messages.

### ADR-001: Carregamento de vídeo por PUT pré-assinado direto ao storage, com confirmação
- **Status**: accepted
- **Date**: 2026-10-21
- **Bolt**: 001-video-lifecycle (001-video-lifecycle)
- **Path**: `bolts/001-video-lifecycle/adr-001-upload-put-pre-assinado.md`
- **Summary**: O carregamento de vídeos até 2 GB não pode passar pelas rotas de upload existentes (`multer.memoryStorage()`, regra 2.6). O navegador envia o ficheiro por PUT pré-assinado através do `location /s3-video/` do nginx, entre um pedido de URL (que cria o registo `queued`) e uma confirmação verificada com `headObject`.
- **Read when**: Working on video upload or download, pre-signed URLs, the `/s3-video/` nginx location, `imageStorageService/route/video.js` or `videoUrls.js`, upload cancellation, or the Q-ADD-14 cleanup of abandoned uploads (B003).
