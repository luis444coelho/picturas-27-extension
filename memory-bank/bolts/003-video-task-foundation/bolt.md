---
id: bolt-video-task-foundation-3
unit: 001-video-lifecycle
intent: 001-video-processing-support
type: ddd-construction-bolt
status: planned
stories: [ST-VID-COM-001]
created: 2026-10-18T18:00:00Z
started: null
completed: null
current_stage: null
stages_completed: []
requires_bolts: [bolt-video-lifecycle-1]
enables_bolts: [bolt-video-basic-edits-4, bolt-video-visual-edits-5, bolt-video-frame-export-6, bolt-video-format-conversion-7]
requires_units: []
blocks: true
complexity: {avg_complexity: 3, avg_uncertainty: 2, max_dependencies: 2, testing_scope: 3}
---

# B003 — Fundação de tarefas de vídeo

Definir e implementar contratos transversais de tarefa assíncrona, fila, estados, cancelamento, progresso, quota, limpeza de temporários e erros correlacionados.

**Critérios:** uma tarefa ativa por projeto; estados terminais coerentes; reserva/estorno de créditos; falhas não publicam resultados parciais.

**Requisitos:** `REQ-VID-COM-*`, `REQ-VID-TASK-*`, `REQ-VID-QUOTA-*`, `REQ-VID-ERROR-*`, `REQ-VID-NFR-005/006/007/008/009/011`.
