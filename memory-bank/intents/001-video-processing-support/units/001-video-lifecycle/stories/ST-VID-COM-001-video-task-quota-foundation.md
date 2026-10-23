---
id: ST-VID-COM-001
unit: 001-video-lifecycle
intent: 001-video-processing-support
status: complete
priority: must
created: 2026-10-19T17:31:16.000Z
assigned_bolt: 003-video-task-foundation
implemented: true
---

# Story: ST-VID-COM-001 — Acompanhar tarefas e quota de vídeo

## User Story

**As a** Utilizador Registado ou Premium autenticado
**I want** submeter e acompanhar tarefas de vídeo com estado, progresso, cancelamento e contabilização consistente
**So that** saber o resultado e não pagar por trabalho não concluído

## Acceptance Criteria

- [ ] As operações usam o contrato `{operation, version, parameters}` e são validadas pelo mesmo registo de operações quando isoladas ou em cadeia; uma operação isolada é uma cadeia de um passo executada pelo worker único num único `-filter_complex`.
- [ ] Um pedido aceite devolve HTTP 202 com `taskId` e `status: "queued"` em ≤ 1 s, percorre `queued → processing → completed | failed | cancelled` e emite progresso pelo menos uma vez por segundo; o projeto tem no máximo uma tarefa de vídeo ativa (409 para a segunda).
- [ ] Para o utilizador Registado, os créditos são reservados (debitados) na aceitação e a reserva torna-se definitiva quando a tarefa chega a `completed`, sem passo de confirmação; falha, cancelamento ou esgotamento das entregas devolvem os créditos; o Premium não chama a reserva. Quota insuficiente dá `QUOTA_EXCEEDED` com `{cost, remaining}` sem reservar nada.
- [ ] Só quem submeteu a tarefa a pode cancelar (403 para os outros), só em `queued` ou `processing` (409 fora disso). O cancelamento interrompe o FFmpeg em curso, limpa os temporários e não publica resultado.
- [ ] Uma rotina periódica do serviço de projetos retoma ou fecha as tarefas paradas, liberta os lugares de tarefa ativa sem dono e remove os recursos de vídeo de projetos apagados.
- [ ] As respostas de erro têm o formato `{error: {code, message, details}, correlationId}`; a causa técnica fica só nos logs com o mesmo `correlationId`, que também viaja no corpo das mensagens de vídeo.
- [ ] Se o worker cair, a mensagem é reentregue e a tarefa recomeça do zero, no máximo em duas entregas; depois, passa a `failed`, com devolução de créditos, sem recurso criado e com os temporários limpos.

## Traceability

- **Use case:** UC-VID-000, UC-VID-001, UC-VID-002, UC-VID-003, UC-VID-004, UC-VID-005, UC-VID-006, UC-VID-007, UC-VID-008, UC-VID-009, UC-VID-010, UC-VID-011, UC-VID-012, UC-VID-013 (regras transversais).
- **Requirements:** `REQ-VID-COM-001` a `006`; `REQ-VID-QUOTA-001` a `008`; `REQ-VID-TASK-001` a `006` e `008`; `REQ-VID-ERROR-001` a `003`; `REQ-VID-NFR-002`, `005`, `006`, `007`, `009`, `013`, `018` (specsDuvidas D-03), `021`. Consome `REQ-VID-AUTH-*` (ST-VID-000, specsDuvidas D-02). Verifica a `REQ-VID-NFR-010` (dona: ST-VID-000), sem ser dona dela (specsDuvidas D-09). Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes (ERS v2.4).
- **Decisões do ADD v1.1:** T-01, T-02 (executor e codificação por omissão), T-03, T-04 e Q-ADD-03, T-05 e Q-ADD-21, T-08, T-10, Q-ADD-14 (specsDuvidas D-04), Q-ADD-02 (pendente no ADD). A NFR-012 e a NFR-016 são desta story; a NFR-009 é da ST-VID-000 (specsDuvidas D-03).

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Alterar código existente (regra 2.6 do ADD: só acrescentar).
- Funcionalidades ou limites que não constem da ERS v2.4, dos casos de uso v1.5 ou do ADD v1.1.
