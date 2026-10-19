---
id: 008-video-concat-chain
unit: 003-video-composition
intent: 001-video-processing-support
type: ddd-construction-bolt
status: planned
stories: [ST-VID-013, ST-VID-014]
created: 2026-10-19T17:31:16Z
started: null
completed: null
current_stage: null
stages_completed: []
requires_bolts: [004-video-basic-edits, 005-video-visual-edits, 007-video-format-conversion]
enables_bolts: [009-video-batch]
requires_units: [001-video-lifecycle, 002-video-transformations]
blocks: true
complexity: {avg_complexity: 3, avg_uncertainty: 2, max_dependencies: 3, testing_scope: 3}
---

# Bolt: 008-video-concat-chain

## Objetivo

Implementar UC-VID-013/014: junção de entradas compatíveis e editor/validador de cadeia até 10 passos, composição com operações elegíveis, semântica atómica e custo por passo. Extração de fotogramas não é elegível; conversão só na posição definida pela ERS.

## Stories incluídas

- **ST-VID-013 — Juntar vídeos**: [Juntar vídeos](../../intents/001-video-processing-support/units/003-video-composition/stories/001-video-concat.md) (must).
- **ST-VID-014 — Encadear operações**: [Encadear operações](../../intents/001-video-processing-support/units/003-video-composition/stories/002-video-chain.md) (must).

## Requisitos rastreados

REQ-VID-CONCAT-*; REQ-VID-CHAIN-*; REQ-VID-NFR-013,022,023,024. Os contratos transversais são propriedade da Unit 001; B001 e B003 realizam os contratos de recurso e tarefa respetivamente, consumidos pelas Units dependentes conforme a matriz.

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

- **Bolts requeridos:** 004-video-basic-edits, 005-video-visual-edits, 007-video-format-conversion.
- **Units requeridas:** 001-video-lifecycle, 002-video-transformations.
- **Desbloqueia:** 009-video-batch.

## Limites

Junção/cadeia respeitam limites e compatibilidade; cadeia falhada/cancelada não publica resultado parcial; custo reflete os passos e o sucesso produz resultado único.
