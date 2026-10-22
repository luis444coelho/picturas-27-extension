---
last_updated: 2026-10-22T18:15:00Z
total_decisions: 8
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

### ADR-008: `planExtras.js` como módulo de extensão do plano sem alterar o `plan.js` da B003
- **Status**: accepted
- **Date**: 2026-10-22
- **Bolt**: 004-video-basic-edits (002-video-transformations)
- **Path**: `bolts/004-video-basic-edits/adr-008-plan-extras.md`
- **Summary**: O `plan.js` da B003 só conhece `estimate` e `copyable` booleanos. A B004 precisa de campos que esse contrato não exprime: `keyframeCopy` (ADR-007) e `inputFps` (taxa de fotogramas da entrada de cada passo, usada pelo filtro `fps=` da velocidade). O módulo `projects/video/planExtras.js` é aplicado ao plano já calculado, com uma única linha nova no `tasks.js`, sem alterar o `plan.js` (regra 2.6). Padrão declarado para as B005, B007 e B008.
- **Read when**: Extending the execution plan with step-level data not expressible by `estimate`/`copyable` (e.g. conditional copy flags, per-step input fps, chain-specific metadata); working on `plan.js`, `tasks.js`, or any bolt that adds new operation modules (B005, B007, B008+).

### ADR-007: O worker escolhe entre duas alternativas do plano calculadas pelo serviço de projetos (cópia no *keyframe* do recorte)
- **Status**: accepted
- **Date**: 2026-10-22
- **Bolt**: 004-video-basic-edits (002-video-transformations)
- **Path**: `bolts/004-video-basic-edits/adr-007-keyframe-copy-worker-decision.md`
- **Summary**: REQ-VID-TRIM-010 permite copiar vídeo e áudio sem recodificação quando o instante de início do recorte coincide com um *keyframe*. O serviço de projetos decide as condições estruturais da cópia e expõe `keyframeCopy: { atMs }` no plano (via `planExtras.js`, ADR-008). O worker verifica o *keyframe* com FFprobe e escolhe entre a cópia e a recodificação — a primeira vez que o worker toma uma decisão de execução entre duas alternativas do plano, além da letra do T-01. O recuo para recodificação em caso de falha do FFprobe garante robustez. O `videoMode` no `metadata` do `completed` regista o caminho seguido.
- **Read when**: Working on the `trim` operation, the `keyframe.py` module, the `keyframeCopy` field in execution plans, chains starting with a trim step (B008), or any future operation where the worker must choose between copy and re-encode based on a runtime check.

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
