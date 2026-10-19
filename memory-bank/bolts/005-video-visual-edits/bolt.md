---
id: 005-video-visual-edits
unit: 002-video-transformations
intent: 001-video-processing-support
type: simple-construction-bolt
status: planned
stories: [ST-VID-004, ST-VID-008, ST-VID-009, ST-VID-010, ST-VID-011]
created: 2026-10-19T17:31:16Z
started: null
completed: null
current_stage: null
stages_completed: []
requires_bolts: [003-video-task-foundation]
enables_bolts: [008-video-concat-chain, 009-video-batch]
requires_units: [001-video-lifecycle]
blocks: true
complexity: {avg_complexity: 2, avg_uncertainty: 1, max_dependencies: 2, testing_scope: 3}
---

# Bolt: 005-video-visual-edits

## Objetivo

Implementar UC-VID-004/008/009/010/011: marca de água, ajustes, filtros, redimensionamento, rotação e espelho, incluindo os controlos de interface e pré-visualizações estáticas previstas.

## Stories incluídas

- **ST-VID-004 — Aplicar marca de água**: [Aplicar marca de água](../../intents/001-video-processing-support/units/002-video-transformations/stories/004-video-watermark.md) (must).
- **ST-VID-008 — Ajustar propriedades visuais**: [Ajustar propriedades visuais](../../intents/001-video-processing-support/units/002-video-transformations/stories/006-video-adjust.md) (must).
- **ST-VID-009 — Aplicar filtro visual**: [Aplicar filtro visual](../../intents/001-video-processing-support/units/002-video-transformations/stories/007-video-filter.md) (must).
- **ST-VID-010 — Redimensionar vídeo**: [Redimensionar vídeo](../../intents/001-video-processing-support/units/002-video-transformations/stories/008-video-resize.md) (must).
- **ST-VID-011 — Rodar ou espelhar vídeo**: [Rodar ou espelhar vídeo](../../intents/001-video-processing-support/units/002-video-transformations/stories/009-video-orientation.md) (must).

## Requisitos rastreados

REQ-VID-WATERMARK-*; REQ-VID-ADJUST-*; REQ-VID-FILTER-*; REQ-VID-RESIZE-*; REQ-VID-ORIENT-*; REQ-VID-NFR-015. Os contratos transversais são propriedade da Unit 001; B001 e B003 realizam os contratos de recurso e tarefa respetivamente, consumidos pelas Units dependentes conforme a matriz.

## Saídas esperadas

- Modelo/contrato de domínio e desenho técnico conforme o tipo de Bolt.
- Implementação da capacidade, incluindo interface, APIs/workers/storage que lhe pertencem.
- Testes de aceitação ligados aos AC das Stories e aos critérios nos ficheiros `docs/requirements/`.
- Evidência de estados de sucesso, falha e cancelamento quando aplicável.

## Critérios de passagem

- [ ] Stories e AC atribuídos cumpridos.
- [ ] Requisitos rastreados verificados sem alterar os originais nem expor recursos sem autorização.
- [ ] Testes automatizados e relatório do Bolt registados; nenhum resultado de teste é presumido nesta fase.

## Dependências

- **Bolts requeridos:** 003-video-task-foundation.
- **Units requeridas:** 001-video-lifecycle.
- **Desbloqueia:** 008-video-concat-chain, 009-video-batch.

## Limites

Cada opção e parâmetro respeita os limites aprovados; pré-visualização e resultado correspondem; tarefa preserva original e não publica saída parcial.
