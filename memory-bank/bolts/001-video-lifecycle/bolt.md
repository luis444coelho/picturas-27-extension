---
id: 001-video-lifecycle
unit: 001-video-lifecycle
intent: 001-video-processing-support
type: ddd-construction-bolt
status: planned
stories: [ST-VID-000]
created: 2026-10-19T17:31:16Z
started: null
completed: null
current_stage: null
stages_completed: []
requires_bolts: []
enables_bolts: [002-video-access, 003-video-task-foundation]
requires_units: []
blocks: false
complexity: {avg_complexity: 3, avg_uncertainty: 2, max_dependencies: 2, testing_scope: 3}
---

# Bolt: 001-video-lifecycle

## Objetivo

Implementar UC-VID-000: autorização de edição, upload/streaming, validação de matriz e limites por perfil, metadados, thumbnail/preview, persistência no projeto e respetiva interface. Contratos de tarefa/quota detalhados ficam em B003.

## Stories incluídas

- **ST-VID-000 — Carregar e visualizar vídeo**: [Carregar e visualizar vídeo](../../intents/001-video-processing-support/units/001-video-lifecycle/stories/001-video-ingestion.md) (must).

## Requisitos rastreados

REQ-VID-UPLOAD-*; REQ-VID-STORAGE-*; REQ-VID-NFR-001,003,008,017. Integridade das tarefas e limpeza transacional (NFR-007), autorização e contratos comuns de disponibilização de resultados são definidos em B003 e consumidos por este trabalho.

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

- **Bolts requeridos:** nenhum.
- **Units requeridas:** baseline existente (autenticação, projetos, storage e imagem conforme o objetivo).
- **Desbloqueia:** 002-video-access, 003-video-task-foundation.

## Limites

Vídeo íntegro visível e reproduzível no projeto, sem consumo de quota; falha/cancelamento de upload não deixa objeto ou registo órfão.
