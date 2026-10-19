---
id: 002-video-access
unit: 001-video-lifecycle
intent: 001-video-processing-support
type: simple-construction-bolt
status: planned
stories: [ST-VID-006, ST-VID-007]
created: 2026-10-19T17:31:16Z
started: null
completed: null
current_stage: null
stages_completed: []
requires_bolts: [001-video-lifecycle]
enables_bolts: [009-video-batch]
requires_units: []
blocks: true
complexity: {avg_complexity: 1, avg_uncertainty: 1, max_dependencies: 1, testing_scope: 2}
---

# Bolt: 002-video-access

## Objetivo

Implementar UC-VID-006/007: consulta de informações e descarregamento autorizado de originais e resultados concluídos, com leitura permitida, URL temporário e retoma. Não debitar quota.

## Stories incluídas

- **ST-VID-006 — Descarregar vídeo**: [Descarregar vídeo](../../intents/001-video-processing-support/units/001-video-lifecycle/stories/002-video-download.md) (must).
- **ST-VID-007 — Consultar informações do vídeo**: [Consultar informações do vídeo](../../intents/001-video-processing-support/units/001-video-lifecycle/stories/003-video-information.md) (must).

## Requisitos rastreados

REQ-VID-DOWNLOAD-*; REQ-VID-INFO-*; REQ-VID-NFR-016,025. Os contratos transversais são propriedade da Unit 001; B001 e B003 realizam os contratos de recurso e tarefa respetivamente, consumidos pelas Units dependentes conforme a matriz.

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
- **Desbloqueia:** 009-video-batch.

## Limites

Atores com leitura consultam/descarregam; utilizadores sem permissão não obtêm dados nem URL; transferência direta pelo storage com Range.
