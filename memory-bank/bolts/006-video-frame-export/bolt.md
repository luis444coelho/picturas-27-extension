---
id: 006-video-frame-export
unit: 002-video-transformations
intent: 001-video-processing-support
type: ddd-construction-bolt
status: planned
stories: [ST-VID-005]
created: 2026-10-19T17:31:16Z
started: null
completed: null
current_stage: null
stages_completed: []
requires_bolts: [003-video-task-foundation]
enables_bolts: []
requires_units: [001-video-lifecycle]
blocks: true
complexity: {avg_complexity: 3, avg_uncertainty: 2, max_dependencies: 2, testing_scope: 3}
---

# Bolt: 006-video-frame-export

## Objetivo

Implementar UC-VID-005: extração de fotogramas segundo intervalo/passo/formato, validação da quota/limites e criação atómica de recursos Imagem com timestamp e proveniência. Integrar com a biblioteca de imagem existente.

## Stories incluídas

- **ST-VID-005 — Extrair fotogramas**: [Extrair fotogramas](../../intents/001-video-processing-support/units/002-video-transformations/stories/005-video-frame-export.md) (must).

## Requisitos rastreados

REQ-VID-FRAMES-*; REQ-VID-NFR-004,019,020. Os contratos transversais são propriedade da Unit 001; B001 e B003 realizam os contratos de recurso e tarefa respetivamente, consumidos pelas Units dependentes conforme a matriz.

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
- **Desbloqueia:** nenhum Bolt subsequente.

## Limites

Extração adiciona o conjunto completo ou nenhum; imagens respeitam formato/resolução e são utilizáveis pelo pipeline de imagem; vídeo de origem inalterado.
