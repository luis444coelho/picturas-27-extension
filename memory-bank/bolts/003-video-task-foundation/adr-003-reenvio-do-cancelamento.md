---
bolt: 003-video-task-foundation
created: 2026-10-22T15:39:16Z
status: accepted
superseded_by: null
---

# ADR-003: Voltar a publicar o cancelamento quando chega `started` de uma tarefa cancelada

## Context

O cancelamento de uma tarefa de vídeo (REQ-VID-TASK-004/005, ADD T-03) é publicado uma única vez na exchange *fanout* `video_control`. Cada réplica do worker guarda os `taskId` cancelados num conjunto **em memória**, com TTL, e descarta uma tarefa cancelada quando a consome ou termina o FFmpeg se ela já estiver a correr. O ADD regista como risco aceite que esse conjunto se perde num reinício do worker: uma tarefa cancelada enquanto esperava na fila pode chegar a correr. O orquestrador ignora as respostas e apaga o resultado, mas o FFmpeg corre até ao fim, ocupa a única réplica (D-18) e emite eventos de progresso de uma tarefa que o utilizador já cancelou. O mesmo acontece se o cancelamento for publicado num momento em que nenhuma réplica tem a fila de controlo ligada, porque a exchange *fanout* descarta mensagens sem fila.

A regra 2.6 não se aplica aqui (código novo), mas o contrato de mensagens do T-03 não prevê uma confirmação do cancelamento.

## Decision

Quando o serviço de projetos recebe uma resposta `started` de uma tarefa que já está `cancelled`, **volta a publicar `{taskId, correlationId}` em `video_control`** e confirma a mensagem sem mudar o estado da tarefa. O worker que acabou de arrancar a tarefa recebe o cancelamento na volta seguinte do seu ciclo (≤ 0,5 s), termina o FFmpeg, limpa `/tmp/video/<taskId>/` e responde `cancelled`. Pela mesma razão, a rotina de manutenção e o tratamento do *dead-letter* também publicam o cancelamento quando fecham uma tarefa (D-41, D-46).

## Rationale

O `started` é o primeiro sinal de que um worker está a executar a tarefa, e chega sempre (é publicado antes do descarregamento). Responder-lhe com um novo cancelamento fecha a janela do risco aceite sem estado persistente no worker, sem uma segunda ligação e sem mudar o contrato do T-03: a mensagem é a mesma, só é enviada mais uma vez.

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Manter o risco aceite do ADD | Nada a construir | FFmpeg inútil até ao fim numa réplica única; eventos de progresso de uma tarefa cancelada | O custo da mitigação é uma publicação |
| Conjunto de cancelados persistente no worker (ficheiro no `video_tmp`) | Sobrevive a reinícios | Estado partilhado entre réplicas por ficheiro; limpeza e concorrência a gerir; não cobre a mensagem perdida sem fila ligada | Mais complexo e incompleto |
| O worker pergunta ao serviço de projetos se a tarefa foi cancelada antes de começar | Decisão exata | Dependência HTTP nova do worker para o serviço de projetos; contraria "o worker não decide e só fala pelo storage e pelas filas" (T-01, T-02) | Acopla o worker ao orquestrador |
| Fila durável de cancelamentos por réplica | Sem perda | As réplicas não têm identidade estável; filas órfãs | Desajustado ao *fanout* do T-03 |

## Consequences

### Positive

- Uma tarefa cancelada que chega a arrancar é interrompida em menos de 1 s depois do `started`.
- A réplica fica livre para a tarefa seguinte, e os eventos de progresso da tarefa cancelada param.

### Negative

- Uma publicação a mais em `video_control`, que todas as réplicas recebem e que as que não estão a correr a tarefa ignoram (só acrescentam o `taskId` ao conjunto).
- Entre o `started` e a chegada do novo cancelamento, o worker pode já ter pedido o URL e começado o descarregamento; esse trabalho perde-se.

### Risks

- Se o próprio `started` se perder, o que não acontece porque a resposta só é confirmada depois de tratada, o FFmpeg corre até ao fim. Mitigação: o resultado tardio é apagado (T-03) e a tarefa já está `cancelled`.

## Related

- **Stories**: ST-VID-COM-001 (AC4)
- **Requirements**: REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-NFR-007
- **ADD**: T-03 ("Cancelamento", "Cancelamento perdido num reinício do worker")
- **Decisões**: D-18, D-41, D-46
- **Previous ADRs**: ADR-002 (contrato de mensagens do worker)
