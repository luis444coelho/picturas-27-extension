---
id: ST-VID-009
unit: 002-video-transformations
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 005-video-visual-edits
implemented: false
---

# Story: ST-VID-009 — Aplicar filtro visual

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** selecionar um filtro predefinido
**So that** aplicar um estilo visual de forma reproduzível

## Acceptance Criteria

- [ ] Quando seleciono um filtro suportado, então o sistema apresenta a pré-visualização prevista e permite confirmar a operação.
- [ ] Filtro fora do catálogo suportado é rejeitado sem criar tarefa.
- [ ] O resultado é novo e o original permanece inalterado.

## Traceability

- **Use case:** UC-VID-009.
- **Requirements:** `REQ-VID-FILTER-*; REQ-VID-NFR-015,018,026`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Funcionalidades ou limites que não constem da ERS v2.3.
