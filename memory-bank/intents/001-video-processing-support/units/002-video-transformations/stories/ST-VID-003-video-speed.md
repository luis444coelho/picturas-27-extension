---
id: ST-VID-003
unit: 002-video-transformations
intent: 001-video-processing-support
status: complete
priority: must
created: 2026-10-19T17:31:16.000Z
assigned_bolt: 004-video-basic-edits
implemented: true
---

# Story: ST-VID-003 — Alterar velocidade

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** escolher um fator de velocidade permitido
**So that** obter uma nova versão com a cadência pretendida

## Acceptance Criteria

- [ ] Com um fator entre 0.25× e 4.0×, quando confirmo a operação, então o sistema mostra a duração prevista e gera um novo MP4 com vídeo e áudio ajustados de forma sincronizada.
- [ ] Fator nulo, não positivo ou fora dos limites é rejeitado antes da tarefa.
- [ ] Falha ou cancelamento preserva o original, não disponibiliza saída parcial e devolve o crédito reservado.

## Traceability

- **Use case:** UC-VID-003.
- **Requirements:** `REQ-VID-SPEED-001` a `008`. Consome `REQ-VID-COM-*`, `REQ-VID-NFR-009`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes (ERS v2.4).
- **Decisões do ADD v1.1:** T-02 (`setpts` e `atempo`, encadeado só abaixo de 0.5×).

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Alterar código existente (regra 2.6 do ADD: só acrescentar).
- Funcionalidades ou limites que não constem da ERS v2.4, dos casos de uso v1.5 ou do ADD v1.1.
