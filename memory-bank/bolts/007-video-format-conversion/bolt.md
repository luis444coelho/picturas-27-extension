---
id: 007-video-format-conversion
unit: 002-video-transformations
intent: 001-video-processing-support
type: simple-construction-bolt
status: planned
stories: [ST-VID-012]
created: 2026-10-19T17:31:16Z
started: null
completed: null
current_stage: null
stages_completed: []
requires_bolts: [003-video-task-foundation]
enables_bolts: [008-video-concat-chain, 009-video-batch]
requires_units: [001-video-lifecycle]
blocks: true
complexity: {avg_complexity: 2, avg_uncertainty: 2, max_dependencies: 2, testing_scope: 3}
---

# Bolt: 007-video-format-conversion

## Objetivo

Implementar UC-VID-012: seleção, validação e conversão para as combinações de formato/codecs permitidas, incluindo interface e consulta do resultado.

## Stories incluídas

- **ST-VID-012 — Converter formato**: [Converter formato](../../intents/001-video-processing-support/units/002-video-transformations/stories/010-video-convert.md) (must).

## Requisitos rastreados

REQ-VID-CONVERT-*; REQ-VID-NFR-012,026. Estes critérios de descodificação e reprodução aplicam-se também aos resultados das demais operações de vídeo, cujos Bolts os consomem. Os contratos transversais são propriedade da Unit 001; B001 e B003 realizam os contratos de recurso e tarefa respetivamente, consumidos pelas Units dependentes conforme a matriz.

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

Combinações fora da matriz são rejeitadas antes da tarefa; resultado é descodificável/reproduzível e o original permanece intacto.
