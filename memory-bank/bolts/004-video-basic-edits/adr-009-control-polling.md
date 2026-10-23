---
bolt: 004-video-basic-edits
created: 2026-10-22T19:00:00Z
status: accepted
superseded_by: null
---

# ADR-009: Consulta explícita de controlo na ligação existente do worker

## Context

A integração real da etapa 5 revelou que o Pika 1.3.2 adia callbacks de consumidores durante chamadas reentrantes de `process_data_events`. O worker executa a tarefa dentro da callback de entrega; chamar esse método em `_wait` serve I/O e heartbeats, mas não entrega o cancelamento à callback do segundo canal até a tarefa terminar. A API cancelava e devolvia o crédito, mas o FFmpeg continuava. Os fakes anteriores não reproduziam a proteção de reentrância do Pika.

O T-03 mantém um único processo, a thread principal e uma ligação AMQP por worker. A regra 2.6 impede substituir linhas da B003. A equipa aprovou a opção (a) da D-56 em `docs/specsDuvidas.md`.

## Decision

Acrescentar `Tools/video/control_poll.py`, com `ControlPoller`. O adaptador declara uma fila adicional de nome gerado, exclusiva da ligação e ligada ao exchange fanout `video_control`, usando o canal de controlo já criado por `ControlChannel`. Não cria outro canal, ligação ou thread, nem altera o exchange ou o compose.

Uma chamada nova em `_wait`, após a linha existente de `process_data_events`, consulta a fila com `basic_get(auto_ack=True)` e entrega cada mensagem diretamente a `ControlChannel._on_message`. Assim reutiliza a validação, o conjunto de tarefas canceladas e `_on_cancel`. `_tick`, transferências, sondagens e `executor.run` continuam a passar por `_wait`. O ciclo atende até 100 mensagens por consulta para não monopolizar heartbeats/progresso.

O consumidor anterior permanece intacto e continua a servir o ciclo exterior. As mensagens duplicadas de cancelamento são idempotentes; cada fila é removida com o fecho da ligação exclusiva. Não se altera nenhuma assinatura nem se removem linhas anteriores das B001–B003.

## Alternatives considered

1. **Consulta explícita na ligação existente — escolhida:** evita dispatch reentrante e preserva o T-03, com uma fila exclusiva adicional por worker.
2. **Ligação de controlo separada:** muda a escolha explícita de ligação única e acrescenta reconexão/gestão de outra ligação.
3. **Cancelamento apenas lógico:** não interrompe FFmpeg e não cumpre TASK-005.

## Consequences and verification

A consulta acrescenta RPCs locais ao broker nos pontos de espera. A latência segue o ciclo existente de cerca de 0,5 s. O teste persistente `test_control_poll_receives_cancellation_without_consumer_dispatch` verifica o adaptador sem executar callbacks de consumidores. A integração B004 espera progresso positivo do FFmpeg antes de cancelar e exige resposta `cancelled` do worker, ausência de `completed`, ausência de resultado e devolução do crédito. O teste real passou após esta correção; os resultados completos estão em `ddd-03-test-report.md`.

Este ajuste serve também as tarefas anteriores da B003. Não muda o fluxo de imagem.

## Related

- Decisão: D-56, opção (a), aprovada pela equipa.
- ADD: T-03, 2.6; requisito TASK-005.
- B003: `Tools/video/control.py`, `task.py`, `executor.py`.
- Testes: `Tools/video/tests/test_basic_edits.py`, `projects/test/video/e2e-basic-edits.test.js`.
