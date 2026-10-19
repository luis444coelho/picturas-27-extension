---
id: ST-VID-010
unit: 002-video-transformations
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 005-video-visual-edits
implemented: false
---

# Story: ST-VID-010 — Redimensionar vídeo

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** definir dimensões de saída permitidas
**So that** adaptar o vídeo ao destino pretendido

## Acceptance Criteria

- [ ] Quando defino dimensões válidas segundo limites/perfil e confirmo, então o sistema gera um novo vídeo redimensionado.
- [ ] Dimensões inválidas ou acima dos limites são recusadas antes da tarefa.
- [ ] O resultado respeita as regras de proporção aplicáveis e o original não é alterado.

## Traceability

- **Use case:** UC-VID-010.
- **Requirements:** `REQ-VID-RESIZE-*; REQ-VID-NFR-015,018,026`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Funcionalidades ou limites que não constem da ERS v2.3.
