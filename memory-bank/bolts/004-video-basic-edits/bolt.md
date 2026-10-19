---
id: 004-video-basic-edits
unit: 002-video-transformations
intent: 001-video-processing-support
type: ddd-construction-bolt
status: planned
stories: [ST-VID-001, ST-VID-002, ST-VID-003]
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

# Bolt: 004-video-basic-edits

## Objetivo

Implementar UC-VID-001/002/003 (recorte, remoção de áudio e velocidade) através dos contratos assíncronos comuns, incluindo interface, validação, resultado e tratamento de falha.

## Stories incluídas

- **ST-VID-001 — Recortar vídeo**: [Recortar vídeo](../../intents/001-video-processing-support/units/002-video-transformations/stories/001-video-trim.md) (must).
- **ST-VID-002 — Remover áudio**: [Remover áudio](../../intents/001-video-processing-support/units/002-video-transformations/stories/002-video-remove-audio.md) (must).
- **ST-VID-003 — Alterar velocidade**: [Alterar velocidade](../../intents/001-video-processing-support/units/002-video-transformations/stories/003-video-speed.md) (must).

## Requisitos rastreados

REQ-VID-TRIM-*; REQ-VID-AUDIO-*; REQ-VID-SPEED-*; REQ-VID-NFR-010,018. Os critérios transversais de descodificação e reprodução têm titularidade em B007 e são consumidos por todos os Bolts que produzem vídeo. Os contratos transversais são propriedade da Unit 001; B001 e B003 realizam os contratos de recurso e tarefa respetivamente, consumidos pelas Units dependentes conforme a matriz.

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

Parâmetros são validados antes de admitir tarefa; novos resultados respeitam formato/reprodução definidos e os originais permanecem intactos.
