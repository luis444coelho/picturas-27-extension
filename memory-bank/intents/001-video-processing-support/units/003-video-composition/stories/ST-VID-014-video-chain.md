---
id: ST-VID-014
unit: 003-video-composition
intent: 001-video-processing-support
status: complete
priority: must
created: 2026-10-19T17:31:16.000Z
assigned_bolt: 008-video-concat-chain
implemented: true
---

# Story: ST-VID-014 — Encadear operações

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** definir uma sequência válida de operações para um ou mais vídeos elegíveis
**So that** executar várias transformações com um único resultado final consistente

## Acceptance Criteria

- [ ] Quando componho uma cadeia de até 10 passos (contando sub-cadeias, junção e passos finais), cada passo é validado face às propriedades estimadas à saída do anterior e vejo o custo total (um crédito por passo) e a duração estimada.
- [ ] Cadeia vazia, conversão que não é o último passo, mais de uma junção ou extração de fotogramas dão `INVALID_CHAIN` com a regra violada; mais de 10 passos dá `CHAIN_TOO_LONG`; nos dois casos não é criada tarefa.
- [ ] A cadeia executa numa única tarefa, com uma única recodificação de vídeo, e emite um passo corrente aproximado (k de N) e o progresso global; só o vídeo final é gravado no projeto.
- [ ] Uma falha ou cancelamento não grava resultado e devolve todos os créditos; o erro indica a fase (descarregamento, codificação ou *upload*) em vez do passo.
- [ ] Posso guardar uma cadeia sem junção como predefinição minha (não partilhada) e reutilizá-la numa nova cadeia; carregá-la num lote fica fora desta construção (specsDuvidas D-06).

## Traceability

- **Use case:** UC-VID-014.
- **Requirements:** `REQ-VID-CHAIN-001` a `018`; `REQ-VID-NFR-023`. Verifica a `REQ-VID-NFR-010`, a `013` e a `018`, sem ser dona delas (specsDuvidas D-03), e a `REQ-VID-NFR-014` na parte da cadeia (UC-VID-014 RN5), cuja dona é a ST-VID-013 (specsDuvidas D-10). Consome `REQ-VID-COM-*`, `REQ-VID-TASK-006`, `008`, `REQ-VID-QUOTA-007`, `008`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes (ERS v2.4).
- **Decisões do ADD v1.1:** 4.9 (validação em três fases e predefinições de vídeo), T-01, T-02, Q-ADD-16 (passo aproximado), Q-ADD-03.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Alterar código existente (regra 2.6 do ADD: só acrescentar).
- Funcionalidades ou limites que não constem da ERS v2.4, dos casos de uso v1.5 ou do ADD v1.1.
