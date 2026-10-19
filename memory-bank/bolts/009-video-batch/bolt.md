---
id: 009-video-batch
unit: 003-video-composition
intent: 001-video-processing-support
type: ddd-construction-bolt
status: planned
stories: [ST-VID-015]
created: 2026-10-19T17:31:16Z
started: null
completed: null
current_stage: null
stages_completed: []
requires_bolts: [002-video-access, 004-video-basic-edits, 005-video-visual-edits, 007-video-format-conversion, 008-video-concat-chain]
enables_bolts: []
requires_units: [001-video-lifecycle, 002-video-transformations]
blocks: true
complexity: {avg_complexity: 3, avg_uncertainty: 2, max_dependencies: 3, testing_scope: 3}
---

# Bolt: 009-video-batch

## Objetivo

Implementar UC-VID-015: seleção e pré-validação, admissão condicionada ao custo total, execução sequencial, estado/progresso agregado e por item, resultados independentes, cancelamento/estorno e download ZIP conforme UC-VID-006. Excluir junção e extração.

## Stories incluídas

- **ST-VID-015 — Processar vídeos em lote**: [Processar vídeos em lote](../../intents/001-video-processing-support/units/003-video-composition/stories/003-video-batch.md) (must).

## Requisitos rastreados

REQ-VID-BATCH-*; REQ-VID-QUOTA-007,008; REQ-VID-NFR-014. O limite de tarefas ativas por projeto (NFR-021) é propriedade do B003 e é consumido por este Bolt. Os contratos transversais são propriedade da Unit 001; B001 e B003 realizam os contratos de recurso e tarefa respetivamente, consumidos pelas Units dependentes conforme a matriz.

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

- **Bolts requeridos:** 002-video-access, 004-video-basic-edits, 005-video-visual-edits, 007-video-format-conversion, 008-video-concat-chain.
- **Units requeridas:** 001-video-lifecycle, 002-video-transformations.
- **Desbloqueia:** nenhum Bolt subsequente.

## Limites

Lote respeita perfil e quota antes da admissão; cada vídeo concluído mantém resultado mesmo se outro falhar; cobrança/estorno por item e cancelamento são consistentes.
