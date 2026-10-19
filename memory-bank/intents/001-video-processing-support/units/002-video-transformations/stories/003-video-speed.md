---
id: ST-VID-003
unit: 002-video-transformations
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 004-video-basic-edits
implemented: false
---

# Story: ST-VID-003 — Alterar velocidade

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** escolher um fator de velocidade permitido
**So that** obter uma nova versão com a cadência pretendida

## Acceptance Criteria

- [ ] Com um fator válido, quando confirmo a operação, então o sistema calcula a duração prevista e gera um novo vídeo conforme o fator.
- [ ] Fator nulo, não positivo ou fora dos limites é rejeitado antes da tarefa.
- [ ] Falha/cancelamento preserva o vídeo original e não disponibiliza saída parcial.

## Traceability

- **Use case:** UC-VID-003.
- **Requirements:** `REQ-VID-SPEED-*; REQ-VID-COM-*`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Funcionalidades ou limites que não constem da ERS v2.3.
