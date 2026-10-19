---
id: 003-video-task-foundation
unit: 001-video-lifecycle
intent: 001-video-processing-support
type: ddd-construction-bolt
status: planned
stories: [ST-VID-COM-001]
created: 2026-10-19T17:31:16Z
started: null
completed: null
current_stage: null
stages_completed: []
requires_bolts: [001-video-lifecycle]
enables_bolts: [004-video-basic-edits, 005-video-visual-edits, 006-video-frame-export, 007-video-format-conversion]
requires_units: []
blocks: true
complexity: {avg_complexity: 3, avg_uncertainty: 2, max_dependencies: 2, testing_scope: 3}
---

# Bolt: 003-video-task-foundation

## Objetivo

Definir e realizar uma só vez os contratos consumidos pelas Units de processamento: submissão assíncrona, estados/progresso/cancelamento, limite de tarefa por projeto, autorização do executor, reserva/commit/rollback de quota, correlationId, limpeza e erros.

## Stories incluídas

- **ST-VID-COM-001 — Acompanhar tarefas e quota de vídeo**: [Acompanhar tarefas e quota de vídeo](../../intents/001-video-processing-support/units/001-video-lifecycle/stories/004-video-task-quota-foundation.md) (must).

## Requisitos rastreados

REQ-VID-COM-*; REQ-VID-AUTH-*; REQ-VID-TASK-*; REQ-VID-QUOTA-*; REQ-VID-ERROR-*; REQ-VID-NFR-002,005,006,007,009,011,021. Os contratos transversais são propriedade da Unit 001; B001 e B003 realizam os contratos de recurso e tarefa respetivamente, consumidos pelas Units dependentes conforme a matriz.

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

- **Bolts requeridos:** 001-video-lifecycle.
- **Units requeridas:** baseline existente (autenticação, projetos, storage e imagem conforme o objetivo).
- **Desbloqueia:** 004-video-basic-edits, 005-video-visual-edits, 006-video-frame-export, 007-video-format-conversion.

## Limites

Contratos interoperáveis cobrem sucesso, falha e cancelamento; cobrança só pelo trabalho devido; sem resultados parciais nem temporários órfãos.
