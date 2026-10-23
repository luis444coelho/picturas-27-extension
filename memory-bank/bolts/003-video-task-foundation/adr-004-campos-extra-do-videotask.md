---
bolt: 003-video-task-foundation
created: 2026-10-22T15:39:16Z
status: accepted
superseded_by: null
---

# ADR-004: Campos `refund`, `plan`, `published_at` e `status_changed_at` no `VideoTask`

## Context

O ADD T-03 define os campos do modelo `projects/models/videoTask.js`: `status`, `kind`, `steps`, `step`, `total_steps`, `progress`, `cost`, `reserved_credits`, `runner_id`, `owner_id`, `project_id`, `input_video_ids`, `result_video_id`, `correlation_id` e `error` (campos de tarefa e recurso). Três decisões tomadas nesta construção precisam de estado que esses campos não guardam:

- **D-41 (rotina da Q-ADD-14):** retomar uma tarefa `queued` que nunca chegou a ser publicada (queda entre a criação e a publicação) e fechar uma tarefa ativa sem transição há mais de 3 h 10 min. Para isso é preciso saber se e quando a mensagem foi publicada, quando foi a última transição e com que mensagem republicar. O progresso não é gravado no MongoDB (T-03), e o `updatedAt` muda com qualquer escrita, não só com transições.
- **D-45 (devolução pelo menos uma vez):** o `POST users:/:user/process/refund/:k` não é idempotente e não pode mudar (regra 2.6). É preciso registar que uma devolução está pendente, na mesma escrita atómica da transição para `failed`/`cancelled`, e que já foi feita.

## Decision

O `VideoTask` tem, além dos campos do T-03, quatro campos novos:

| Campo | Tipo | Uso |
|-------|------|-----|
| `refund` | `{state: "none" \| "pending" \| "done", at: Date}` | Gravado como `pending` na mesma escrita condicional que leva a tarefa a `failed` ou `cancelled` quando `reserved_credits > 0`; passa a `done` depois de o `refund/:k` responder. A reentrega da resposta e a rotina repetem as `pending` com mais de 60 s (D-45) |
| `plan` | Mixed | Plano de execução calculado na aceitação (T-01, T-05), guardado para a rotina republicar a mensagem exatamente igual (D-41) |
| `published_at` | Date ou `null` | Instante em que o *broker* confirmou a publicação; `null` + `createdAt` com mais de 60 s → republicar (D-41) |
| `status_changed_at` | Date | Instante da última transição, incluindo o `processing → processing` de uma reentrega; base do fecho por tempo das tarefas paradas (D-41) |

Índices: `{status: 1, status_changed_at: 1}`, `{status: 1, published_at: 1}` e `{"refund.state": 1, updatedAt: 1}`.

## Rationale

São os campos mínimos para cumprir as respostas da equipa (D-41, D-45) com escritas condicionais num único documento, sem coleções auxiliares nem transações. O modelo é novo, por isso acrescentar campos não toca em código existente.

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Só os campos do T-03; recalcular o plano ao republicar e usar o `updatedAt` | Modelo igual ao ADD | O plano pode mudar se o vídeo de entrada for apagado ou se o código mudar entre a aceitação e a republicação; o `updatedAt` muda com a marcação da devolução e esconde tarefas paradas | Republicação e deteção pouco fiáveis |
| Coleção própria para as devoluções pendentes (*outbox*) | Separa a quota das tarefas | Duas escritas em coleções diferentes, que só seriam atómicas com uma transação multi-documento (que o serviço de projetos não usa); sem ela, a mesma janela de queda que se queria evitar | Não é atómica com a transição |
| Gravar o progresso a cada segundo para detetar tarefas paradas | Deteção fina | Uma escrita por segundo e por tarefa, que o T-03 quis evitar | Contraria o T-03 |

## Consequences

### Positive

- A transição para um estado final e a intenção de devolver ficam numa só escrita atómica.
- A rotina distingue "por publicar", "à espera na fila" e "parada" sem ler o RabbitMQ.
- A mensagem republicada é exatamente a que a aceitação validou.

### Negative

- O documento da tarefa fica maior (o plano tem as entradas, os passos e os destinos); cabe com folga nos 16 MB do MongoDB.
- O modelo afasta-se da lista do ADD, que tem de ser lida junto com este ADR.

### Risks

- Os riscos residuais da devolução (dupla numa queda de milissegundos; perdida numa queda entre a reserva e a criação da tarefa) estão registados na D-45.

## Related

- **Stories**: ST-VID-COM-001 (AC3, AC5, AC7)
- **Requirements**: REQ-VID-QUOTA-004, REQ-VID-NFR-006, REQ-VID-ERROR-003
- **ADD**: T-03 (modelo `VideoTask`), T-04, Q-ADD-14
- **Decisões**: D-41, D-45
- **Previous ADRs**: ADR-003, ADR-005
