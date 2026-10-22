---
id: ST-VID-011
unit: 002-video-transformations
intent: 001-video-processing-support
status: complete
priority: must
created: 2026-10-19T17:31:16.000Z
assigned_bolt: 005-video-visual-edits
implemented: true
---

# Story: ST-VID-011 — Rodar ou espelhar vídeo

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** rodar ou espelhar o vídeo
**So that** corrigir a orientação visual

## Acceptance Criteria

- [ ] Quando escolho uma rotação de 0, 90°, 180° ou 270° e/ou espelho horizontal ou vertical, então a pré-visualização mostra a transformação (rotação antes do espelho) e as dimensões resultantes em ≤ 1 s, e posso confirmar.
- [ ] Ângulo fora do conjunto dá `INVALID_ORIENT_PARAMS`; sem transformação, ou com 180° e os dois espelhos (identidade), dá `NO_CHANGES`; nos dois casos não é criada tarefa.
- [ ] O resultado é um novo recurso com largura e altura trocadas a 90°/270°, sem barras (salvo o corte de 1 px numa dimensão ímpar); o original mantém-se inalterado.

## Traceability

- **Use case:** UC-VID-011.
- **Requirements:** `REQ-VID-ORIENT-001` a `009`. Consome `REQ-VID-COM-*`, `REQ-VID-NFR-015`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes (ERS v2.4).
- **Decisões do ADD v1.1:** 4.6, T-07, Q-ADD-24 (identidade), Q-ADD-25.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Alterar código existente (regra 2.6 do ADD: só acrescentar).
- Funcionalidades ou limites que não constem da ERS v2.4, dos casos de uso v1.5 ou do ADD v1.1.
