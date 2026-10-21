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

- [ ] Quando escolho brilho, contraste e saturação no intervalo [0.0, 2.0] com passo 0.05, então vejo em ≤ 1 s uma pré-visualização do primeiro fotograma e posso submeter a operação; "Repor" volta os três a 1.0.
- [ ] Valores fora do intervalo dão `INVALID_ADJUST_PARAMS` com o campo; os três em 1.0 dão `NO_CHANGES`; nos dois casos não é criada tarefa.
- [ ] O resultado é um novo MP4 com os ajustes uniformes em todos os fotogramas e a duração, a resolução (salvo o corte de 1 px numa dimensão ímpar), a taxa de fotogramas e o áudio do original; o original não é alterado.

## Traceability

- **Use case:** UC-VID-008.
- **Requirements:** `REQ-VID-ADJUST-001` a `010`; `REQ-VID-NFR-015`. Consome `REQ-VID-COM-*`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes (ERS v2.4).
- **Decisões do ADD v1.1:** 4.3 (brilho com `colorchannelmixer`, contraste e saturação com `eq`), T-07 (pré-visualização com `sharp`), Q-ADD-18 (pivô fixo do contraste), Q-ADD-23, Q-ADD-25.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Alterar código existente (regra 2.6 do ADD: só acrescentar).
- Funcionalidades ou limites que não constem da ERS v2.4, dos casos de uso v1.5 ou do ADD v1.1.
