---
id: ST-VID-COM-001
unit: 001-video-lifecycle
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 003-video-task-foundation
implemented: false
---

# Story: ST-VID-COM-001 — Acompanhar tarefas e quota de vídeo

## User Story

**As a** Utilizador Registado ou Premium autenticado
**I want** submeter e acompanhar tarefas de vídeo com estado, progresso, cancelamento e contabilização consistente
**So that** saber o resultado e não pagar por trabalho não concluído

## Acceptance Criteria

- [ ] As operações usam o contrato `{operation, version, parameters}` e são validadas pelo mesmo registo de operações quando isoladas ou em cadeia (os lotes ficam fora desta construção, specsDuvidas D-06); uma operação isolada é uma cadeia de um passo executada pelo worker único num único `-filter_complex`.
- [ ] Um pedido aceite devolve HTTP 202 com `taskId` e `status: "queued"` em ≤ 1 s, percorre `queued → processing → completed | failed | cancelled` e emite progresso pelo menos uma vez por segundo; o projeto tem no máximo uma tarefa de vídeo ativa (409 para a segunda).
- [ ] Para o utilizador Registado, os créditos são reservados (debitados) na aceitação e a reserva torna-se definitiva quando a tarefa chega a `completed`, sem passo de confirmação; falha, cancelamento ou esgotamento das entregas devolvem os créditos; o Premium não chama a reserva. Quota insuficiente dá `QUOTA_EXCEEDED` com `{cost, remaining}` sem reservar nada.
- [ ] Só quem submeteu a tarefa a pode cancelar (403 para os outros), só em `queued` ou `processing` (409 fora disso). O cancelamento interrompe o FFmpeg em curso, limpa os temporários e não publica resultado.
- [ ] Uma rotina periódica do serviço de projetos retoma ou fecha as tarefas paradas, liberta os lugares de tarefa ativa sem dono e remove os recursos de vídeo de projetos apagados.
- [ ] As respostas de erro têm o formato `{error: {code, message, details}, correlationId}`; a causa técnica fica só nos logs com o mesmo `correlationId`, que também viaja no corpo das mensagens de vídeo.
- [ ] Se o worker cair, a mensagem é reentregue e a tarefa recomeça do zero, no máximo em duas entregas; depois, passa a `failed`, com devolução de créditos, sem recurso criado e com os temporários limpos.

## Traceability

- **Use case:** UC-VID-000 a UC-VID-015 (regras transversais).
- **Requirements:** `REQ-VID-COM-001` a `006`; `REQ-VID-QUOTA-001` a `008`; `REQ-VID-TASK-001` a `006` e `008`; `REQ-VID-ERROR-001` a `003`; `REQ-VID-NFR-002`, `005`, `006`, `007`, `009`, `011` (ver specsDuvidas.md, D-09), `013`, `018` (specsDuvidas D-03), `021`. Consome `REQ-VID-AUTH-*` (ST-VID-000, specsDuvidas D-02). Não cobertos nesta construção (specsDuvidas D-06): `REQ-VID-TASK-007` e a parte de lotes da `REQ-VID-QUOTA-007`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes (ERS v2.4).
- **Decisões do ADD v1.1:** T-01, T-02 (executor e codificação por omissão), T-03, T-04 e Q-ADD-03, T-05 e Q-ADD-21, T-08, T-10, Q-ADD-14 sem a parte de lotes e ZIP (specsDuvidas D-04), Q-ADD-02 (pendente no ADD). A NFR-013 e a NFR-018 são desta story; a NFR-010 é da ST-VID-000 (specsDuvidas D-03).

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Alterar código existente (regra 2.6 do ADD: só acrescentar).
- Funcionalidades ou limites que não constem da ERS v2.4, dos casos de uso v1.5 ou do ADD v1.1.
