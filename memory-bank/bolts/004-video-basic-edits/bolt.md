---
id: bolt-video-basic-edits-4
unit: 002-video-transformations
intent: 001-video-processing-support
type: ddd-construction-bolt
status: planned
stories: [UC-VID-001, UC-VID-002, UC-VID-003]
created: 2026-10-18T18:00:00Z
started: null
completed: null
current_stage: null
stages_completed: []
requires_bolts: [bolt-video-task-foundation-3]
enables_bolts: [bolt-video-concat-chain-8, bolt-video-batch-9]
requires_units: [001-video-lifecycle]
blocks: true
complexity: {avg_complexity: 2, avg_uncertainty: 1, max_dependencies: 2, testing_scope: 3}
---

# B004 — Edição básica

Implementar recorte temporal, remoção de áudio e alteração de velocidade como operações isoladas, assíncronas e não destrutivas.

**Requisitos:** `REQ-VID-TRIM-*`, `REQ-VID-AUDIO-*`, `REQ-VID-SPEED-*` e regras comuns de tarefa/quota.
