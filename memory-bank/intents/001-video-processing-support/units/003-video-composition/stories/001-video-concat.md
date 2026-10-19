---
id: ST-VID-013
unit: 003-video-composition
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 008-video-concat-chain
implemented: false
---

# Story: ST-VID-013 — Juntar vídeos

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** selecionar e concatenar vídeos compatíveis
**So that** obter um novo vídeo contínuo sem alterar as fontes

## Acceptance Criteria

- [ ] Quando seleciono a quantidade permitida de vídeos elegíveis e confirmo, então o sistema valida compatibilidade e produz um novo vídeo concatenado.
- [ ] Entradas fora de quantidade, perfil ou compatibilidade são rejeitadas antes da tarefa.
- [ ] Falha não publica um resultado parcial nem altera os vídeos de origem.

## Traceability

- **Use case:** UC-VID-013.
- **Requirements:** `REQ-VID-CONCAT-*; REQ-VID-NFR-003,018,022,024`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Funcionalidades ou limites que não constem da ERS v2.3.
