---
id: ST-VID-015
unit: 003-video-composition
intent: 001-video-processing-support
status: blocked
# motivo: Fora do âmbito desta construção por decisão da equipa (specsDuvidas D-06)
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 009-video-batch
implemented: false
---

# Story: ST-VID-015 — Processar vídeos em lote

> 🚫 **Bloqueada.** Fora do âmbito desta construção por decisão da equipa (specsDuvidas D-06).

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** aplicar uma operação elegível ou cadeia a vários vídeos
**So that** uniformizar resultados e acompanhar cada item individualmente

## Acceptance Criteria

- [ ] Quando seleciono de 2 a 10 (Registado) ou 50 (Premium) vídeos e uma operação ou cadeia sem junção nem extração, então o sistema pré-valida cada vídeo, assinala os incompatíveis com o motivo e mostra o custo total (custo × vídeos elegíveis) antes de aceitar o lote.
- [ ] O lote conta como uma tarefa ativa, processa os vídeos um a um e emite o estado de cada vídeo e o progresso agregado (terminados sobre o total e percentagem); cada sucesso cria um recurso independente.
- [ ] A falha de um vídeo devolve logo os créditos desse vídeo e o lote continua; no fim, o lote fica `completed` (≥ 1 concluído), `failed` (todos falharam) ou `cancelled` (se foi cancelado), com o resumo de concluídos, falhados e créditos debitados.
- [ ] Ao cancelar, o vídeo em curso e os pendentes são interrompidos, os seus créditos são devolvidos numa única operação e os vídeos já concluídos ficam no projeto.
- [ ] Posso pedir o ZIP dos vídeos concluídos com o lote `completed`, ou `cancelled` com pelo menos um concluído: o pedido devolve 202, sou avisado quando está pronto e obtenho um URL assinado, sem consumo de quota.

## Traceability

- **Use case:** UC-VID-015.
- **Requirements:** `REQ-VID-BATCH-001` a `019`; `REQ-VID-NFR-014`. Consome `REQ-VID-COM-*`, `REQ-VID-TASK-007`, `REQ-VID-QUOTA-007`, `008`, `REQ-VID-NFR-021`. Os `REQ-VID-BATCH-*`, a `REQ-VID-TASK-007` e a parte de lotes da `REQ-VID-QUOTA-007` não são cobertos nesta construção (specsDuvidas D-06); a NFR-014 fica não coberta só na parte de lotes e continua coberta na parte da junção e da cadeia (specsDuvidas D-07); o bolt dessa parte está em dúvida (ver specsDuvidas.md, D-10). Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes (ERS v2.4).
- **Decisões do ADD v1.1:** 4.10, T-09, ADD 6 (`archiver`), Q-ADD-09 (retenção do ZIP, pendente no ADD), Q-ADD-14 na parte de lotes parados e ZIP, fora desta construção (specsDuvidas D-04).

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Alterar código existente (regra 2.6 do ADD: só acrescentar).
- Funcionalidades ou limites que não constem da ERS v2.4, dos casos de uso v1.5 ou do ADD v1.1.
