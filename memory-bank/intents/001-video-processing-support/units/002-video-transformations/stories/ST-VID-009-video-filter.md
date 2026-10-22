---
id: ST-VID-009
unit: 002-video-transformations
intent: 001-video-processing-support
status: complete
priority: must
created: 2026-10-19T17:31:16.000Z
assigned_bolt: 005-video-visual-edits
implemented: true
---

# Story: ST-VID-009 — Aplicar filtro visual

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** selecionar um filtro predefinido
**So that** aplicar um estilo visual de forma reproduzível

## Acceptance Criteria

- [ ] Quando abro o painel, vejo os seis filtros do catálogo com miniaturas sobre o fotograma 0; ao selecionar um, vejo em ≤ 1 s a pré-visualização e posso confirmar.
- [ ] Filtro em falta ou fora do catálogo dá `INVALID_FILTER` sem criar tarefa.
- [ ] O resultado é um novo MP4 com o filtro em todos os fotogramas e as restantes propriedades preservadas (salvo o corte de 1 px numa dimensão ímpar); o original não é alterado.

## Traceability

- **Use case:** UC-VID-009.
- **Requirements:** `REQ-VID-FILTER-001` a `007`. Consome `REQ-VID-COM-*`, `REQ-VID-NFR-015`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes (ERS v2.4).
- **Decisões do ADD v1.1:** 4.4 (`filters.json` com matrizes 3×3 e inversão), T-07, Q-ADD-07 (matrizes de Vintage, Frio e Quente, pendente no ADD), Q-ADD-25.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Alterar código existente (regra 2.6 do ADD: só acrescentar).
- Funcionalidades ou limites que não constem da ERS v2.4, dos casos de uso v1.5 ou do ADD v1.1.
