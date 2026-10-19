---
id: ST-VID-008
unit: 002-video-transformations
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 005-video-visual-edits
implemented: false
---

# Story: ST-VID-008 — Ajustar propriedades visuais

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** ajustar brilho, contraste e saturação
**So that** obter uma nova versão com aparência ajustada

## Acceptance Criteria

- [ ] Quando escolho valores permitidos, então recebo a pré-visualização estática prevista e posso submeter a transformação.
- [ ] Valores fora dos limites são rejeitados antes do processamento.
- [ ] O resultado é um recurso novo; o original permanece disponível e não é alterado.

## Traceability

- **Use case:** UC-VID-008.
- **Requirements:** `REQ-VID-ADJUST-*; REQ-VID-NFR-015,018,026`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Funcionalidades ou limites que não constem da ERS v2.3.
