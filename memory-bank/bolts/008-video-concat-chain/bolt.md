---
id: bolt-video-concat-chain-8
unit: 003-video-composition
intent: 001-video-processing-support
type: ddd-construction-bolt
status: planned
stories: [UC-VID-013, UC-VID-014]
created: 2026-10-18T18:00:00Z
started: null
completed: null
current_stage: null
stages_completed: []
requires_bolts: [bolt-video-basic-edits-4, bolt-video-visual-edits-5, bolt-video-format-conversion-7]
enables_bolts: [bolt-video-batch-9]
requires_units: [002-video-transformations]
blocks: true
complexity: {avg_complexity: 3, avg_uncertainty: 2, max_dependencies: 3, testing_scope: 3}
---

# B008 — Junção e cadeias

Implementar junção e composição de até 10 passos, validação da ordem e compatibilidade, contabilização por passo, execução atómica e um único resultado final.

**Requisitos:** `REQ-VID-CONCAT-*`, `REQ-VID-CHAIN-*`, `REQ-VID-NFR-013/014`.
