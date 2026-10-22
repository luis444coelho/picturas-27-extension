---
id: 003-video-task-foundation
unit: 001-video-lifecycle
intent: 001-video-processing-support
type: ddd-construction-bolt
status: in-progress
stories: [ST-VID-COM-001]
created: 2026-10-19T17:31:16Z
started: 2026-10-22T15:15:43Z
completed: null
current_stage: design
stages_completed:
  - name: model
    completed: 2026-10-22T15:25:53Z
    artifact: ddd-01-domain-model.md
requires_bolts: [001-video-lifecycle]
enables_bolts: [004-video-basic-edits, 005-video-visual-edits, 006-video-frame-export, 007-video-format-conversion]
requires_units: []
blocks: true
# avg_complexity: maior esforço do ADD no bolt (S=1, M=2, L=3); os outros campos são preenchidos no início do bolt na Construção (specsDuvidas D-01)
complexity:
  avg_complexity: null
  avg_uncertainty: 3
  max_dependencies: 3
  testing_scope: 3
---

# Bolt: 003-video-task-foundation

## Visão geral

Contratos comuns de processamento e executor de cadeias: tarefas, quota, cancelamento, progresso, erros, registo de operações e executor com um único `-filter_complex` no worker de vídeo criado pela B001 (ADD v1.1, T-01 a T-04 e T-10; specsDuvidas D-02).

## Objetivo

Construir uma só vez o que todas as operações usam: no ADD, uma operação isolada é uma cadeia de um passo (T-01, T-02), por isso o registo de operações e o executor de cadeias ficam neste bolt (`docs/inception/artefactos-finais.md` §5), com o `VideoTask`, o `video_project_locks`, a exchange `video_control`, a quota (T-04), o cancelamento e o progresso (T-03). A coleção `videos`, os estágios, os URLs de escrita, o `formats.js`, os routers com o `videoAuth`, as filas, o `wsGateway/video.js` e o worker com a ingestão são da B001 (specsDuvidas D-02).

## Stories incluídas

- **ST-VID-COM-001 — Acompanhar tarefas e quota de vídeo**: [Acompanhar tarefas e quota de vídeo](../../intents/001-video-processing-support/units/001-video-lifecycle/stories/ST-VID-COM-001-video-task-quota-foundation.md) (must).

## Tipo de bolt

**Tipo**: DDD Construction Bolt
**Definição**: `.specsmd/aidlc/templates/construction/bolt-types/ddd-construction-bolt.md`

## Etapas

- [x] **1. Domain Model**: Complete → `ddd-01-domain-model.md`
- [ ] **2. Technical Design**: ⏳ In progress → `ddd-02-technical-design.md`
- [ ] **3. ADR Analysis** (opcional): Pending → `adr-{n}-{slug}.md`
- [ ] **4. Implement**: Pending → código nos componentes indicados em "Saídas esperadas"
- [ ] **5. Test**: Pending → `ddd-03-test-report.md`

## Requisitos rastreados

REQ-VID-COM-001 a 006; REQ-VID-ERROR-001 a 003; REQ-VID-QUOTA-001 a 008; REQ-VID-TASK-001 a 006 e 008; REQ-VID-NFR-002, 005 a 007, 009, 013, 018, 021.

Os `REQ-VID-AUTH-*` passaram para a B001, que constrói os routers com o `videoAuth`; este bolt consome-os (specsDuvidas D-02). A NFR-013 (uma recodificação por cadeia) e a NFR-018 (saída MP4 H.264/AAC por omissão) passam para este bolt, que constrói o executor e a codificação por omissão (T-02); a NFR-010 passa para a B001 (specsDuvidas D-03).

Não cobertos nesta construção (specsDuvidas D-06): `REQ-VID-TASK-007` (lotes) e a parte de lotes da `REQ-VID-QUOTA-007`. A NFR-011 passou para a B001, que cria as filas e o worker; este bolt continua a verificá-la nos critérios de passagem (specsDuvidas D-09).

Os critérios de aceitação autoritativos são os dos ficheiros `docs/requirements/REQ-VID-*.md`; a propriedade de cada requisito está em `intents/001-video-processing-support/traceability.md`.

## Decisões do ADD v1.1

- **T-01:** contrato `{operation, version, parameters}` (`version` começa em 1; a junção usa `parameters.clips: [{videoId, steps}]`); registo de operações `projects/video/operations/<op>.js` com `validate`, `estimate`, `cost` e `copyable`; plano de execução calculado no serviço de projetos; endpoint `POST /projects/:user/:project/videos/validate` com *debounce* e `inputProps` lidos de `videos.meta`. **Q-ADD-15 (pendente no ADD):** orçamento de latência da validação.
- **T-02:** executor de cadeias no worker `Tools/video/` criado pela B001 (specsDuvidas D-02): `ops/` e execução do plano recebido num único `-filter_complex`; progresso de `-progress pipe:1` (`out_time_us`) pelo menos 1×/s; temporários em `/tmp/video/<taskId>/` no volume `video_tmp`; descarregamento e envio por blocos com `Content-Length` no PUT; codificação por omissão `libx264` + `aac`, `yuv420p`, `+faststart`; corte de 1 px nas dimensões ímpares (Q-ADD-25); FFprobe, miniatura e fotograma 0 de cada resultado. **Q-ADD-10 e Q-ADD-11 (pendentes no ADD):** réplicas do worker e parâmetros de qualidade (CRF, *preset*, `-q:v`, bitrate).
- **T-03:** modelo `projects/models/videoTask.js`; aceitação em 11 passos (`videoAuth`, permissão de edição, recusa do `anonymous`, vídeos `completed`, formato e limites, `validate`, plano, lugar de tarefa ativa, reserva, `VideoTask queued`, 202); coleção `video_project_locks` com índice único em `project_id`; `GET` e `DELETE …/videos/tasks/:taskId` (403 para quem não submeteu, 409 fora de `queued`/`processing`); extensão por acréscimo do `projects/video/amqp.js` da B001 (publicação das tarefas e dos cancelamentos e tratamento das respostas do worker), sem o alterar; `video_operations_queue` declarada pela B001 já com os argumentos do T-03 (*quorum*, `x-delivery-limit: 1`, `x-consumer-timeout`, *dead-letter* para `video_project_queue`) (specsDuvidas D-08); exchange *fanout* `video_control`; evento `video-task-update` no `wsGateway/video.js` da B001, para a sala do utilizador e `project:<id>`; ciclo de uma só *thread* com `process_data_events`. **Q-ADD-02 (pendente no ADD):** se o processamento de imagens conta como tarefa ativa.
- **T-03 (sem lotes):** não há itens `kind: "batch_item"` nem `holder_kind: "batch"` (specsDuvidas D-06).
- **T-04 / Q-ADD-03:** reserva com `GET users:/:user/process/:n` (a reserva é o débito; não há passo de confirmação) e devolução com `POST users:/:user/process/refund/:k`; o Premium não chama a reserva; 701 traduzido em `QUOTA_EXCEEDED` com `{cost, remaining}`; reservas serializadas por `runner_id`; limitações aceites da Q-ADD-03. Sem devolução por item de lote (specsDuvidas D-06).
- **T-05 / Q-ADD-21:** o executor usa o `projects/video/formats.js` criado pela B001 (specsDuvidas D-02); cópia de uma stream só quando o codec de origem é igual ao de saída e nenhum passo a altera; `-map 0:V:0 -map 0:a:0? -sn -dn` e `+genpts` para AVI copiado.
- **T-08:** os URLs internos de leitura e de escrita, o `route/video.js` e o `videoUrls.js` são da B001 (specsDuvidas D-02, D-08); o executor usa-os, sem os alterar. O worker pede-os quando são precisos.
- **T-10:** *middleware* no router de vídeo do gateway que gera o `X-Correlation-Id`; `correlationId` no corpo das mensagens de vídeo (não nas propriedades AMQP) e nas respostas de erro `{error: {code, message, details}, correlationId}`; logs JSON em `stdout`.
- **Q-ADD-14:** rotina periódica do serviço de projetos para as tarefas paradas, os lugares de tarefa ativa sem dono e a remoção dos recursos de vídeo de projetos apagados; a parte dos lotes parados e dos ZIP fica fora desta construção (specsDuvidas D-04, D-06). **Q-ADD-17 (pendente no ADD):** pipeline de CI e testes automáticos.

## Saídas esperadas

- Registo de operações, plano de execução e endpoint de validação (T-01).
- Executor de um único `-filter_complex` no worker `Tools/video/` da B001, com a codificação por omissão (T-02; specsDuvidas D-02, D-03). O volume `video_tmp` é da B001 (specsDuvidas D-08).
- `VideoTask`, `video_project_locks`, endpoints de tarefa, cancelamento e progresso, exchange `video_control` em `rabbitMQ/definitions.json` e evento `video-task-update` (T-03).
- Integração com a reserva e a devolução de quota existentes (T-04).
- Rotina periódica da Q-ADD-14 para tarefas paradas, lugares sem dono e recursos de vídeo de projetos apagados (specsDuvidas D-04), e para os carregamentos abandonados da B001: vídeos em `queued` há mais de 900 s + margem, de que se apagam o objeto em `video_src` e o registo (specsDuvidas D-15).
- Não constrói o `VideoBatch`, o endpoint de lote, os itens `batch_item`, a devolução por item, a rotina de lotes e ZIP nem o `archiver` (specsDuvidas D-06).
- Correlação, logs e formato de erro das rotas de vídeo (T-10).
- Testes de aceitação ligados aos critérios de `REQ-VID-COM-*` (QUOTA, TASK, ERROR) e NFR rastreados.

## Critérios de passagem

- [ ] Stories incluídas implementadas e respetivos critérios de aceitação cumpridos.
- [ ] Critérios de aceitação dos requisitos rastreados (ficheiros `docs/requirements/REQ-VID-*.md`) verificados por testes.
- [ ] Nenhuma linha de código existente alterada (regra 2.6 do ADD); o fluxo de imagem continua a funcionar como antes.
- [ ] Testes automatizados e relatório do bolt registados; nenhum resultado de teste é presumido nesta fase.
- [ ] Código revisto.
- [ ] Uma operação de um passo percorre `queued → processing → completed | failed | cancelled`, com progresso pelo menos 1×/s e no máximo uma tarefa ativa por projeto.
- [ ] A reserva debita os créditos na aceitação, a conclusão não faz chamada de confirmação, e falha, cancelamento ou *dead-letter* devolvem os créditos (Premium sem chamadas).
- [ ] O cancelamento termina o FFmpeg em curso, limpa `/tmp/video/<taskId>/` e apaga um resultado já enviado.
- [ ] As tarefas de vídeo circulam só pelas filas de vídeo da B001, sem alterar as ferramentas de imagem nem as filas existentes (verificação da NFR-011, specsDuvidas D-09).
- [ ] A rotina periódica retoma ou fecha as tarefas paradas, liberta os lugares de tarefa ativa sem dono, remove os recursos de vídeo de projetos apagados e apaga os carregamentos abandonados (D-15).

## Dependências

### Requer

- **Bolts:** 001-video-lifecycle (coleção `videos`, estágios, URLs de leitura e de escrita, `formats.js`, routers com o `videoAuth`, filas, `amqp.js`, `wsGateway/video.js`, worker e `video_tmp`; specsDuvidas D-02, D-08). Este bolt estende estes componentes por acréscimo, sem os alterar.
- **Units:** Nenhuma além da própria Unit 001.

### Desbloqueia

- 004-video-basic-edits, 005-video-visual-edits, 006-video-frame-export, 007-video-format-conversion. A B006 está `blocked` (specsDuvidas D-06).

## Limites

- **Regra 2.6 do ADD ("só acrescentar"):** o código existente não é alterado. Só se acrescentam ficheiros novos e pontos de ligação novos (uma linha `app.use` ou `require`, uma fila, exchange ou *binding* em `rabbitMQ/definitions.json`, um serviço ou volume no `docker-compose.yaml`, um `location` ou `log_format` no `nginx/nginx.conf`, componentes novos no frontend), sem tocar nas linhas existentes nem mudar o comportamento do fluxo de imagem.
- Não usa `project_queue`, `ws_queue`, `process_msg`, `requireProjectVersion` nem o modelo `Process`; não altera `rabbitmq.conf` (o `x-consumer-timeout` é argumento da fila).
- O serviço de utilizadores não muda: não há endpoints de quota novos.

## Notas

- Esforço no ADD: o T-00 = L conta para a B001; os T-01 a T-05, T-08 e T-10 não têm esforço próprio. Sem esforço no ADD para este bolt, por isso `avg_complexity` fica `null`; `avg_uncertainty`, `max_dependencies` e `testing_scope` são preenchidos no início do bolt na Construção (specsDuvidas D-01).
- Risco aceite no ADD (T-03): o `join-project` não verifica permissões, por isso os eventos de vídeo levam só identificadores, estado e progresso.
