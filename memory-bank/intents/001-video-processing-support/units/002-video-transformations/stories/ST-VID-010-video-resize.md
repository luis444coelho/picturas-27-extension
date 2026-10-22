---
id: ST-VID-010
unit: 002-video-transformations
intent: 001-video-processing-support
status: complete
priority: must
created: 2026-10-19T17:31:16.000Z
assigned_bolt: 005-video-visual-edits
implemented: true
---

# Story: ST-VID-010 — Redimensionar vídeo

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** definir dimensões de saída permitidas
**So that** adaptar o vídeo ao destino pretendido

## Acceptance Criteria

- [ ] Quando defino largura e altura pares ≥ 128 px, referidas às dimensões de apresentação e dentro do teto do perfil (1920×1080 Registado, 3840×2160 Premium), e confirmo, então o sistema gera um novo vídeo com exatamente essas dimensões e rotação 0.
- [ ] Dimensões inválidas ou acima do teto dão `INVALID_RESIZE_PARAMS` com o campo e o limite; dimensões iguais às de apresentação dão `NO_CHANGES`; nos dois casos não é criada tarefa.
- [ ] Por omissão a proporção fica bloqueada; desbloqueá-la ou ampliar mostra o aviso respetivo; o original não é alterado.

## Traceability

- **Use case:** UC-VID-010.
- **Requirements:** `REQ-VID-RESIZE-001` a `009`. Consome `REQ-VID-COM-*`, `REQ-VID-NFR-015`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes (ERS v2.4).
- **Decisões do ADD v1.1:** 4.5, T-07, Q-ADD-13 (dimensões de apresentação).

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Alterar código existente (regra 2.6 do ADD: só acrescentar).
- Funcionalidades ou limites que não constem da ERS v2.4, dos casos de uso v1.5 ou do ADD v1.1.
