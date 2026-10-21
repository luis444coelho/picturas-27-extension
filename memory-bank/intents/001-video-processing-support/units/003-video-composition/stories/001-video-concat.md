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

- [ ] Quando seleciono de 2 a 10 (Registado) ou 50 (Premium) clips, incluindo repetições, e confirmo, então o sistema produz um único MP4 com os clips pela ordem da linha temporal, com corte seco, e regista `sourceVideoIds` pela ordem.
- [ ] O resultado adota a resolução e a taxa de fotogramas do primeiro clip à saída da sua sub-cadeia, em dimensões de apresentação, com barras pretas quando a proporção difere.
- [ ] Os clips sem áudio recebem silêncio quando pelo menos um clip tem áudio; se nenhum tiver, o resultado não tem áudio.
- [ ] Menos de 2 clips, clips ou duração total acima do limite (contando cada ocorrência repetida) ou formato não suportado são rejeitados antes da tarefa; a junção custa 1 crédito.
- [ ] Falha ou cancelamento não publica resultado parcial, devolve o crédito e não altera os vídeos de origem.

## Traceability

- **Use case:** UC-VID-013.
- **Requirements:** `REQ-VID-CONCAT-001` a `013`; `REQ-VID-NFR-014` na parte da junção e da cadeia (specsDuvidas D-10), `022`, `024`. Consome `REQ-VID-COM-*`, `REQ-VID-STORAGE-002`, `004`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes (ERS v2.4).
- **Decisões do ADD v1.1:** 4.8, T-01 (`parameters.clips`), Q-ADD-13, Q-ADD-25.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Alterar código existente (regra 2.6 do ADD: só acrescentar).
- Funcionalidades ou limites que não constem da ERS v2.4, dos casos de uso v1.5 ou do ADD v1.1.
