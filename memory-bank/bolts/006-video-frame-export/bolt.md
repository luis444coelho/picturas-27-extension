---
id: bolt-video-frame-export-6
unit: 002-video-transformations
intent: 001-video-processing-support
type: ddd-construction-bolt
status: planned
stories: [UC-VID-005]
created: 2026-10-18T18:00:00Z
started: null
completed: null
current_stage: null
stages_completed: []
requires_bolts: [bolt-video-task-foundation-3]
enables_bolts: []
requires_units: [001-video-lifecycle]
blocks: true
complexity: {avg_complexity: 3, avg_uncertainty: 2, max_dependencies: 2, testing_scope: 3}
---

# B006 — Extração de fotogramas

Implementar extração temporal em JPEG/PNG, limites por perfil e adição atómica das imagens ao projeto com timestamp e proveniência do vídeo.

**Dependência de integração:** modelo e persistência existentes de imagens.

**Requisitos:** `REQ-VID-FRAMES-*`, `REQ-VID-NFR-004`.
