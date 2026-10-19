---
id: ST-VID-011
unit: 002-video-transformations
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 005-video-visual-edits
implemented: false
---

# Story: ST-VID-011 — Rodar ou espelhar vídeo

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** rodar ou espelhar o vídeo
**So that** corrigir a orientação visual

## Acceptance Criteria

- [ ] Quando seleciono uma orientação suportada, então a pré-visualização corresponde à transformação e posso confirmá-la.
- [ ] Opção inválida é recusada antes de iniciar tarefa.
- [ ] O resultado é um novo recurso e o original mantém-se inalterado.

## Traceability

- **Use case:** UC-VID-011.
- **Requirements:** `REQ-VID-ORIENT-*; REQ-VID-NFR-015,018,026`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Funcionalidades ou limites que não constem da ERS v2.3.
