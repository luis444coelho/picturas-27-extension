---
id: bolt-video-access-2
unit: 001-video-lifecycle
intent: 001-video-processing-support
type: simple-construction-bolt
status: planned
stories: [UC-VID-006, UC-VID-007]
created: 2026-10-18T18:00:00Z
started: null
completed: null
current_stage: null
stages_completed: []
requires_bolts: [bolt-video-lifecycle-1]
enables_bolts: [bolt-video-batch-9]
requires_units: []
blocks: true
complexity: {avg_complexity: 1, avg_uncertainty: 1, max_dependencies: 1, testing_scope: 2}
---

# B002 — Acesso a vídeos

Implementar UC-VID-006 e UC-VID-007: consulta de metadados e descarregamento autorizado com URL temporário e suporte a retoma. Nenhuma destas ações consome quota.

**Requisitos:** `REQ-VID-DOWNLOAD-*`, `REQ-VID-INFO-*`, `REQ-VID-NFR-001/016`.
