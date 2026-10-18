---
story: ST-VID-COM-001
unit: 001-video-lifecycle
intent: 001-video-processing-support
status: planned
---

# Shared video task foundation

As an authenticated project editor, I want video operations to be submitted, tracked and cancelled consistently, so that long work is observable and failures do not leave partial resources or consume unearned quota.

## Acceptance criteria

- A valid task follows `queued → processing → completed | failed | cancelled` and respects one active task per project.
- Registered accounts reserve up to five daily credits; Premium accounts have no daily credit limit.
- Standalone operations cost one credit, chains cost per step and batches charge per completed video.
- Failed/cancelled work returns unconsumed credits, removes temporary objects and never changes the original.
- Upload, playback, preview, information lookup and download do not consume credits.

**Traceability:** `REQ-VID-COM-*`, `REQ-VID-TASK-*`, `REQ-VID-QUOTA-*`, `REQ-VID-ERROR-*`; UC-VID-000 to 015.
