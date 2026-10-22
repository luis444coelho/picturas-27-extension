---
id: ST-VID-001
unit: 002-video-transformations
intent: 001-video-processing-support
status: complete
priority: must
created: 2026-10-19T17:31:16.000Z
assigned_bolt: 004-video-basic-edits
implemented: true
---

# Story: ST-VID-001 — Recortar vídeo

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** definir um intervalo temporal e criar um segmento
**So that** obter apenas o trecho pretendido preservando a origem

## Acceptance Criteria

- [ ] Com um vídeo elegível e um intervalo `0 ≤ início < fim ≤ duração`, quando confirmo o recorte, então é criada uma tarefa e, ao concluir, um novo MP4 (H.264/AAC) contém exatamente o intervalo, com a resolução e a taxa de fotogramas do original.
- [ ] A stream de vídeo é recodificada para a precisão ao milissegundo e só é copiada quando o instante inicial coincide com um *keyframe*; o áudio pode ser copiado. Numa recodificação, uma dimensão ímpar é cortada 1 px para o par abaixo.
- [ ] Intervalo invertido ou fora da duração é rejeitado (`INVALID_INTERVAL`, `OUT_OF_BOUNDS`) antes de criar tarefa ou reservar quota.
- [ ] Falha ou cancelamento não altera o original nem publica segmento parcial, e devolve o crédito reservado.

## Traceability

- **Use case:** UC-VID-001.
- **Requirements:** `REQ-VID-TRIM-001` a `010`. Consome `REQ-VID-COM-*`. Verifica a `REQ-VID-NFR-010` (dona: ST-VID-000), a `013` e a `018` (donas: ST-VID-COM-001), sem ser dona delas (specsDuvidas D-03). Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes (ERS v2.4).
- **Decisões do ADD v1.1:** T-01, T-02 (recorte com `trim`/`atrim`), T-05 (formato de trabalho MP4), Q-ADD-25.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Alterar código existente (regra 2.6 do ADD: só acrescentar).
- Funcionalidades ou limites que não constem da ERS v2.4, dos casos de uso v1.5 ou do ADD v1.1.
