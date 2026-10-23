---
bolt: 008-video-concat-chain
created: 2026-10-23T00:47:57Z
status: accepted
superseded_by: null
---

# ADR-019: Fase da falha (`error.phase`) em todas as tarefas de vídeo

## Context

A ST-VID-014 (AC4) e a exceção 7 do UC-VID-013 pedem que o erro de uma cadeia falhada indique a fase (descarregamento, codificação ou *upload*) em vez do passo, porque os passos correm num único grafo (Q-ADD-16). A D-40 deixou esta parte para a B008, e a D-82 escolheu um campo `error.phase` em todas as tarefas, condicionado a uma verificação: a fase tem de entrar na resposta `failed` do worker e no `VideoTask` só com linhas novas (regra 2.6).

## Decision

1. **Worker:** um módulo novo, `Tools/video/phase.py`, guarda a fase da entrega corrente. O `task.py` chama `reset` no início de cada entrega e `set_phase("download" | "encode" | "upload")` antes de pedir os URLs GET, antes do FFmpeg e antes de pedir os URLs PUT, nos três caminhos (genérico, `convert_task`, `composition_task`). A resposta `failed` ganha `error.phase`.
2. **Serviço de projetos:** o esquema do `VideoTask` ganha `error.phase` (opcional); o tratamento de `failed` grava-o; o `GET …/tasks/:taskId` e o `video-task-update` passam-no ao cliente.
3. O `code` continua `PROCESSING_ERROR` (ou `RESOURCE_UNAVAILABLE`); as falhas sem fase observável (*dead-letter*, rotina, falha antes de começar) ficam sem `phase`.
4. **Condição (D-82 e checkpoint do Estágio 2):** a V6 confirma no Estágio 4, antes de escrever código, que cada um destes pontos aceita a fase só com linhas novas. Em particular, se a fase não puder entrar na resposta `failed` sem mudar a linha existente do `_reply` em `task.py`, regista-se uma dúvida nova e para-se. Este ADR só se aplica se a V6 passar.

## Rationale

Mantém o código estável da ERROR-001 e dá à interface comum da B003 uma informação a mais, igual para todos os tipos de tarefa.

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| `error.phase` só em tarefas `chain` e `concat` | Âmbito menor | Dois comportamentos na mesma interface | D-82 (b) não escolhida |
| Códigos por fase (`DOWNLOAD_ERROR`, …) | Sem campo novo | Muda o código das falhas das B003 a B007 | D-82 (c); contraria a ERROR-001 |
| Fase só nos logs | Nada muda no contrato | Não cumpre a ST-VID-014 AC4 | Requisito |

## Consequences

### Positive

- O utilizador vê em que fase uma tarefa falhou, em qualquer operação.
- O `code` e as mensagens existentes não mudam.

### Negative

- Mais um campo no contrato da resposta `failed`, no `VideoTask` e no evento; as tarefas anteriores não o têm.

### Risks

- A V6 pode falhar (por exemplo, se o `_reply` montar o `error` numa linha que teria de mudar); nesse caso o Estágio 4 para com uma dúvida nova antes de qualquer alteração.

## Related

- **Stories**: ST-VID-014
- **Standards**: T-03, T-10, ERROR-001; Q-ADD-16
- **Previous ADRs**: ADR-004, ADR-013, ADR-017
- **Dúvidas**: D-40, D-82; verificação V6
