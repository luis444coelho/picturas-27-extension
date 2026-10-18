---
id: bolt-video-format-conversion-7
unit: 002-video-transformations
intent: 001-video-processing-support
type: simple-construction-bolt
status: planned
stories: [UC-VID-012]
created: 2026-10-18T18:00:00Z
started: null
completed: null
current_stage: null
stages_completed: []
requires_bolts: [bolt-video-task-foundation-3]
enables_bolts: [bolt-video-concat-chain-8]
requires_units: [001-video-lifecycle]
blocks: true
complexity: {avg_complexity: 2, avg_uncertainty: 2, max_dependencies: 2, testing_scope: 3}
---

# B007 — Conversão de formato

Implementar conversão entre MP4, MOV e AVI segundo a matriz de codecs, com validação e pré-visualização quando necessária.

**Requisitos:** `REQ-VID-CONVERT-*`, `REQ-VID-NFR-003/012`.
