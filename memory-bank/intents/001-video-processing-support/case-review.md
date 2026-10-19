---
intent: 001-video-processing-support
phase: inception
status: superseded
created: 2026-10-09T16:57:05Z
updated: 2026-10-09T16:57:05Z
---

# Case Review: Video Processing Support

> **Revisão histórica de IDs/conteúdo inicial.** Os casos atuais e estáveis são `docs/use-cases/UC-VID-000.md` a `UC-VID-015.md`; não usar as propostas desta revisão antiga como estado atual.

## Source

Documento original: `docs/casos-de-uso-video.md`. O documento nao foi alterado.

## Proposed ID Normalization

| Original occurrence | Proposed stable ID | Name | Treatment |
|---------------------|--------------------|------|-----------|
| UC-VID-001 | UC-VID-001 | Recortar temporalmente um video | Keep |
| UC-VID-002 | UC-VID-002 | Remover o audio de um video | Keep |
| UC-VID-003 | UC-VID-003 | Alterar a velocidade de reproducao | Keep |
| First UC-VID-004 | UC-VID-004 | Aplicar marca de agua a um video | Keep |
| Second UC-VID-004 | UC-VID-005 | Extrair fotogramas de um video | Proposed normalization |
| Repeated extraction block | UC-VID-005 | Extrair fotogramas de um video | Duplicate content; single source for requirements |

## Review Findings

- The document contains template content before the filled cases and retains placeholder fields.
- The extraction case is duplicated and has conflicting identifiers with the watermark case.
- The extraction rules include explicit numeric proposals, but the text says they require team validation.
- The cases differ in actor policy: the first three mention anonymous users, watermark requires registered users, and extraction requires registered or premium users.
- Async processing and progress are explicit for watermark and extraction, but not consistently specified for trim, audio removal, and speed change.
- Cancellation is specified at different phases and does not define a common task state model.
- The extraction formula for `[start,end[` and regular step must be corrected or explicitly confirmed because the written ceiling formula may overcount when the interval is not an exact multiple.
- Output format, codec preservation, result retention, quota identity in shared projects, and failure cleanup remain open decisions.
- The document's section 4 is intentionally out of scope for the academic delivery document and must remain unchanged.

## Classification

### Confirmed by source document

The five intended behaviors, non-destructive processing intent, validation concerns, and the proposed extraction limits are present in the source document.

### Proposed by source document, not approved

Profiles, quotas, numeric limits, MP4/WebM support, H.264/AAC, regular extraction semantics, all-or-nothing extraction, asynchronous behavior for all operations, and fixed watermark position are not approved decisions merely because they appear in the document.

### Confirmed by existing code but not video support

JWT authentication, project ownership/edit permissions, S3-compatible object storage, MongoDB project/result records, RabbitMQ task messaging, WebSocket events, image processing cancellation, and image download ZIP behavior exist for image workflows.

### Not confirmed for video

Video upload, video metadata/codec inspection, video processing, frame extraction, video result resources, video-specific quota, atomic object/database commit, and video task cancellation.

## Normalization Risks

- Requirements use UC-VID-005 for extraction without modifying the original source.
- Any future change to the original document should preserve a mapping from its duplicated block to UC-VID-005.
- Requirements whose behavior is independent of a single use-case step are marked as cross-cutting and retain an explicit source rationale.
