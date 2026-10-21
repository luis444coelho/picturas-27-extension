---
last_updated: 2026-10-21T23:44:49Z
total_decisions: 2
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
