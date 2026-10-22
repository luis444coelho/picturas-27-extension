---
unit: 001-video-lifecycle
bolt: 003-video-task-foundation
stage: test
status: in-progress
updated: 2026-10-22T16:22:18Z
---

# Test Report - Tarefas de vídeo, quota e executor de cadeias

Ambiente: a pilha Docker Compose da equipa a correr localmente (nginx em `https://localhost:8080`, SeaweedFS na porta 9091 do host por um `docker-compose.override.yml` local, sem efeito nos testes), reconstruída com `--no-deps`. Worker em `python:3.11-slim-bookworm` com **FFmpeg 5.1.9** (D-25). A operação de teste `test_reencode` (D-37) foi ativada só para os testes, com um ficheiro compose temporário fora do repositório (`VIDEO_TEST_OPERATIONS=1` em `projects` e `video_worker`), apagado no fim; a pilha voltou à configuração normal (`operations: []`). Todos os resultados vêm de execuções reais; nenhum é presumido.

## Test Summary

| Category | Passed | Failed | Skipped | Coverage |
|----------|--------|--------|---------|----------|
| Unit: serviço de projetos, B003 (`tasks`, `task-domain`, `maintenance`) | 54 | 0 | 0 | 92,9 % das linhas e 86,5 % dos ramos dos módulos novos (ver "Coverage Report") |
| Unit: worker, B003, com FFmpeg 5.1 real (`test_task.py`) | 19 | 0 | 0 | `task.py` 91 %, `executor.py` 95 %, `control.py` 94 %, `ops/` 100 % |
| Unit: frontend, estado da tarefa (`video-task-state.test.mts`) | 5 | 0 | 0 | `lib/video-task-state.ts` (todos os ramos) |
| E2E pela pilha real (`e2e-tasks.test.js`) | 12 | 0 | 0 | não medida (gateway, projetos, utilizadores, storage, RabbitMQ, worker, wsGateway, nginx) |
| E2E da rotina, projeto apagado (`e2e-tasks-cleanup.test.js`) | 1 | 0 | 0 | — |
| Regressão B001/B002: unitários do serviço de projetos | 68 | 0 | 0 | — |
| Regressão B001: unitários do worker (`test_ingest.py`) | 25 | 0 | 0 | — |
| Regressão B001/B002: unitários do frontend | 18 | 0 | 0 | — |
| Regressão B001: E2E (`e2e.test.js`, `e2e-project.test.js`) | 27 | 0 | 0 | — |
| Regressão B001: transferências grandes (`e2e-large.test.js`) | 2 | 0 | 0 | — |
| Regressão B002: E2E (`e2e-access.test.js`) | 18 | 0 | 0 | — |
| Regressão B001/B002 no navegador (`e2e-ui`, `e2e-access-ui`) | — | — | 10 | não corridos: o `playwright-core` não está instalado nesta máquina (ver "Issues Found", 6) |
| **Total** | **249** | **0** | **10** (navegador) | |

Como correr:

```bash
# unitários do serviço de projetos (B001, B002 e B003)
cd projects && node --test test/video/*.test.js
# unitários do worker (dentro da imagem, com o FFmpeg real)
docker run --rm -v "$PWD/Tools/video:/src:ro" -v "$PWD/Tools/utils:/utils:ro" -w /src \
  -e PYTHONPATH=/src:/ -e VIDEO_TEST_OPERATIONS=1 picturas-video_worker \
  python -m unittest tests/test_task.py tests/test_ingest.py
# unitários do frontend
cd frontend && node --experimental-strip-types --test test/*.test.mts
# E2E da B003: pilha com a operação de teste ativada por um compose temporário fora do repositório
#   services: {projects: {environment: {VIDEO_TEST_OPERATIONS: "1"}}, video_worker: {environment: {VIDEO_TEST_OPERATIONS: "1"}}}
docker compose -f docker-compose.yaml -f docker-compose.override.yml -f <tmp>/test-ops.yml \
  up -d --no-deps projects video_worker
cd projects && VIDEO_E2E_URL=https://localhost:8080 VIDEO_E2E_FIXTURES=<pasta> \
  NODE_TLS_REJECT_UNAUTHORIZED=0 node --test --test-timeout=600000 \
  test/video/e2e-tasks.test.js test/video/e2e-tasks-cleanup.test.js
```

Vídeos de referência da B003, gerados com a imagem do worker: `short.mp4` (4 s, 640×360, H.264/AAC), `long.mp4` (90 s, 1080p, H.264/AAC, 175 MB) e `rot.mp4` (321×241 4:4:4 com matriz de rotação de 90°, sem áudio). Os da regressão das B001 e B002 foram regenerados a partir do que os testes verificam (as fontes desses vídeos não estão no repositório): `ok.mp4` com rotação, `ok.mov`, `ok.avi` MPEG-4/MP3, `high10.mp4`, `short.mp4` de 0,5 s, `hevc.mp4`, `audio.mp4`, `trunc.mp4`, `long.mp4` de 5:10 min e `img.png` para a B001; `ok.mp4` 640×360 com rotação a 30 fps, `ok.mov` a 30000/1001, `ok.avi` e `noaudio.mp4` para a B002.

## Acceptance Criteria Validation

| Story | Criteria | Status |
|-------|----------|--------|
| ST-VID-COM-001 | **AC1:** contrato `{operation, version, parameters}` validado pelo mesmo registo isolado ou em cadeia; operação isolada = cadeia de um passo; worker único com um só `-filter_complex` | ✅ unit: registo, `validateChain` com o `estimate` de cada passo, custo e tipo; E2E: operação isolada e cadeia de 2 pelo mesmo endpoint e o mesmo `validate`; log do worker com **uma** invocação de codificação e um `-filter_complex` para a cadeia (NFR-013) |
| ST-VID-COM-001 | **AC2:** 202 com `taskId` e `queued` em ≤ 1 s; `queued → processing → completed \| failed \| cancelled`; progresso ≥ 1×/s; uma tarefa ativa por projeto (409) | ✅ E2E: 202 em 20–27 ms com o corpo `{taskId, status}`; sequência de estados por WebSocket; progresso com intervalo máximo de **645 ms** (17 eventos, monótono, "passo 2 de 2"); segunda tarefa → 409 `TASK_ALREADY_ACTIVE {taskId}` |
| ST-VID-COM-001 | **AC3:** reserva na aceitação, definitiva em `completed` sem confirmação; devolução em falha, cancelamento ou esgotamento; Premium sem chamadas; `QUOTA_EXCEEDED {cost, remaining}` sem reservar | ✅ E2E: `remaining_operations` −1 na aceitação e igual depois de `completed`; +1 depois do cancelamento e do *dead-letter*; 6 passos com 5 créditos → 429 `{cost: 6, remaining: 5}` e o saldo fica 5; com 5 passos fica 0; Premium sem registo diário no serviço de utilizadores; convidado com edição paga com a sua quota (QUOTA-006) |
| ST-VID-COM-001 | **AC4:** só quem submeteu cancela (403), só em `queued`/`processing` (409); interrompe o FFmpeg, limpa os temporários, não publica resultado | ✅ E2E: convidado com edição → 403; executor → 200 `cancelled`; o FFmpeg deixa de existir no contentor e `/tmp/video/<taskId>` desaparece (verificado em `/proc` e no volume); segundo cancelamento → 409 `TASK_NOT_ACTIVE`; nenhum vídeo nem objeto em `video_out`/`video_thumb` |
| ST-VID-COM-001 | **AC5:** rotina periódica: tarefas paradas, lugares sem dono, recursos de projetos apagados (e carregamentos abandonados, D-15) | ✅ unit: todos os passos com relógio controlado (60 s, 3 h 10 min, 20 min); E2E: lugar órfão e carregamento abandonado (objeto **e** registo) removidos na volta seguinte; projeto apagado limpo em 170 s, com a tarefa ativa `cancelled` e o crédito devolvido (D-46) |
| ST-VID-COM-001 | **AC6:** erros `{error: {code, message, details}, correlationId}`; causa técnica só nos logs com o mesmo `correlationId`, que viaja no corpo das mensagens | ✅ E2E: 409, 422 e 429 com o formato e um `correlationId` UUID; o `correlationId` de uma tarefa aparece nos logs do `api_gateway`, do `projects` e do `video_worker`; nenhuma assinatura de URL nos logs; a mensagem de erro da tarefa é a da categoria, sem caminhos nem `stderr` (unit) |
| ST-VID-COM-001 | **AC7:** queda do worker → reentrega e recomeço do zero, no máximo duas entregas; depois `failed` com devolução, sem recurso e com temporários limpos | ✅ E2E: `docker compose restart video_worker` a meio → novo `started` (progresso 0) e `completed`; dois reinícios → *dead-letter* → `failed` `PROCESSING_ERROR`, crédito devolvido, sem vídeo, lugar livre, `/tmp/video/<taskId>` limpo (depois da correção 1) |

### Requisitos rastreados

| Requisito | Verificação |
|-----------|-------------|
| COM-001 | E2E: vídeo inexistente → 404 sem tarefa; caminho de outro utilizador → 403; unit: vídeo por concluir → 409 |
| COM-002 / COM-003 | E2E: o resultado não aparece na galeria durante `processing`; aparece em `completed`, com metadados, `sources` e `recipe` (painel da B002) |
| COM-004 / COM-005 | E2E e unit: `INVALID_REQUEST` e `INVALID_STEP_PARAMS {index, errors}` com 422 antes de qualquer publicação; o número de tarefas não muda |
| COM-006 | Unit: registo único para `validate` e para a aceitação; `cost` de passos internos (junção) |
| QUOTA-001 a 006, 008 | Ver AC3; a parte de lotes da QUOTA-007 e da QUOTA-008 não é coberta (D-06) |
| TASK-001 a 006, 008 | Ver AC2 e AC4; GET devolve `status`, `step`, `totalSteps`, `progress` e `resultVideoId` |
| ERROR-001 / 002 / 003 | Ver AC6 e AC7 |
| NFR-002 | E2E: mesmo `correlationId` nos três serviços (depois da correção 3) |
| NFR-005 | E2E: 20–27 ms na aceitação; validação em 13–16 ms (D-43, ≤ 1 s) |
| NFR-006 | Toda a codificação corre no worker; o pedido HTTP termina na publicação |
| NFR-007 | Ver AC7 |
| NFR-009 | E2E: intervalo máximo de 645 ms (depois da correção 2) |
| NFR-011 (verificação, D-09) | `git diff main` vazio em `Tools/utils/`, nas ferramentas de imagem e em `rabbitMQ/rabbitmq.conf`; `rabbitmqctl`: filas de imagem, `project_queue` e `ws_queue` com 1 consumidor e os argumentos de antes; só a exchange `video_control` é nova |
| NFR-013 | Unit e E2E: um `-filter_complex` e uma invocação de codificação por tarefa, para 1 e 4 passos |
| NFR-018 | E2E: resultado MP4 `h264`/`aac`; unit: `yuv420p`, `+faststart`, `veryfast`/CRF 23/AAC 128k (D-39) |
| NFR-021 | Ver AC2 |

### Critérios de passagem do bolt

| Critério | Resultado |
|----------|-----------|
| Stories e critérios de aceitação cumpridos | ✅ ST-VID-COM-001, AC1 a AC7 |
| Critérios dos requisitos verificados por testes | ✅ tabela acima |
| Nenhuma linha de código existente alterada; fluxo de imagem como antes | ✅ `git diff main` nos 9 ficheiros existentes: **+160, −0**; no código todo: 38 ficheiros, 5769 inserções, 0 remoções; filas e consumidores de imagem intactos |
| Testes automatizados e relatório registados | ✅ este relatório; 249 testes a passar |
| Código revisto | ⏳ checkpoint deste estágio |
| Operação de um passo percorre a máquina de estados, progresso ≥ 1×/s, uma tarefa ativa | ✅ AC2 |
| Reserva na aceitação, sem confirmação; devolução em falha, cancelamento e *dead-letter*; Premium sem chamadas | ✅ AC3, AC7 |
| Cancelamento termina o FFmpeg, limpa `/tmp/video/<taskId>/` e apaga um resultado já enviado | ✅ AC4; o resultado tardio apagado é verificado nos unitários (`completed` depois de `cancelled`) |
| Tarefas só pelas filas de vídeo (NFR-011) | ✅ |
| Rotina: paradas, lugares sem dono, projetos apagados, carregamentos abandonados | ✅ AC5 |

## Unit Tests

- **Serviço de projetos (54):**
  - aceitação: corpo 202, plano, mensagem sem URLs, Premium, convidado, cadeia;
  - recusas: `anonymous`, vídeo por concluir, limite, passos, `TASK_ALREADY_ACTIVE`, `QUOTA_EXCEEDED`, erro do serviço de utilizadores (V8), *broker* em baixo;
  - `validate`; GET; cancelamento (403, 200, 409, Premium);
  - respostas do worker: `started`, reentrega, `completed`, `completed` duplicado, queda entre a transição e o vídeo, resultado tardio, saídas em falta, `failed` duplicado, `RESOURCE_UNAVAILABLE`, *dead-letter*, `started` depois de cancelada (ADR-003);
  - devolução pendente (D-45);
  - domínio: registo com e sem a variável (D-37), `chain`, `stepFromProgress` (D-40), plano (rotação, dimensões ímpares, cópia, `genpts`, pré-visualização), quota (os dois 701 da V8, serialização por executor), lugar;
  - rotina: todos os passos e os seus limites.
- **Worker (19):**
  - comando (um `-filter_complex`, codificação por omissão, sem áudio, cópia, operação desconhecida);
  - progresso (`out_time_us`, limite de 99 %, cadência e passo da D-40);
  - conjunto de cancelados (TTL de 4 h) e registo condicionado pela variável;
  - FFmpeg real: recodificação de 4:4:4 para `yuv420p`, rotação aplicada e dimensões pares, cancelamento a meio sem FFmpeg vivo, falha com o fim do `stderr`;
  - `TaskRunner` com AMQP e storage falsos: fluxo completo, cancelamento a meio, descarte de tarefa cancelada na fila, original em falta sem assinatura, limpeza ao receber o cancelamento de uma tarefa que não corre, varrimento no arranque (correção 1), escolha do plano de pré-visualização.
- **Frontend (5):** transições, eventos tardios ignorados, outra tarefa, erro, rótulos e mensagens dos códigos novos.

## Integration Tests

As 13 E2E atravessam nginx, API Gateway, serviço de projetos, serviço de utilizadores, `imageStorageService`, SeaweedFS, RabbitMQ, worker e wsGateway, com eventos WebSocket reais e leituras diretas ao MongoDB, ao storage e ao contentor do worker. As quedas do worker são reinícios reais do contentor (`docker compose restart video_worker`), e a reentrega e o *dead-letter* são os do RabbitMQ (fila *quorum*, `x-delivery-limit: 1`).

## Security Tests

| Test | Result |
|------|--------|
| Sem JWT → 401; `anonymous` → 403; caminho de outro utilizador sem partilha → 403 | ✅ |
| Convidado com edição não cancela a tarefa de outro (403); tarefa de outro projeto → 404 | ✅ (E2E e unit) |
| Quota do executor e não do dono (QUOTA-006) | ✅ |
| Mensagem `task.run` sem URLs; propriedades de entrada lidas do servidor | ✅ (unit) |
| Logs do gateway, do serviço de projetos e do worker sem assinaturas de URL | ✅ (E2E, procura de `X-Amz-Signature`/`Signature=`) |
| Eventos WebSocket só com identificadores, estado, progresso e código | ✅ (E2E, chaves dos eventos) |
| `test_reencode` ausente sem a variável | ✅ (unit; e `operations: []` na pilha restaurada) |

## Performance Tests

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Aceitação (`POST …/operations`, pela pilha) | ≤ 1 s (NFR-005) | 20–27 ms | ✅ |
| Validação (`POST …/validate`) | ≤ 1 s (D-43) | 13–16 ms | ✅ |
| Intervalo máximo entre eventos de progresso | ≤ 1 s (NFR-009) | 645 ms (antes da correção 2: 1097 ms) | ✅ |
| Cadeia de 2 passos sobre 90 s em 1080p | — | ~9 s de codificação (`veryfast`) | informativo |
| Limpeza de um projeto apagado | ≤ 10 min (D-41) | 170 s | ✅ |

Não houve testes de carga: com uma réplica do worker (D-18), as tarefas são executadas uma de cada vez.

## Coverage Report

| Módulo | Tipo | Linhas | Ramos |
|--------|------|--------|-------|
| `projects/video/chain.js` | unit Node | 100 % | 88,9 % |
| `projects/video/quota.js` | unit Node | 100 % | 89,5 % |
| `projects/video/encoding.js` | unit Node | 100 % | 66,7 % |
| `projects/video/plan.js` | unit Node | 99,4 % | 84,9 % |
| `projects/video/maintenance.js` | unit Node | 98,4 % | 86,8 % |
| `projects/video/locks.js` | unit Node | 93,9 % | 90,0 % |
| `projects/video/tasks.js` | unit Node | 93,2 % | 80,0 % |
| **Módulos novos do serviço de projetos** | | **92,9 %** | **86,5 %** |
| `Tools/video/` (`task.py`, `executor.py`, `control.py`, `ops/`) | unit Python | 93 % | — |
| Adaptadores (`taskModule.js`, rotas, `amqp.js`, `wsGateway/video.js`, `video.py`) | só E2E | não medida | — |

## Issues Found

Defeitos encontrados nos testes e corrigidos neste estágio (código novo, só acréscimos):

| Issue | Severity | Status |
|-------|----------|--------|
| 1. Depois de um *dead-letter*, a pasta `/tmp/video/<taskId>` da entrega morta ficava no volume `video_tmp`: o cancelamento que o serviço de projetos publica podia chegar quando o worker reiniciado ainda não tinha a fila de controlo ligada, e a exchange *fanout* descarta-o. **Correção:** cada tarefa em execução mantém um `flock` em `/tmp/video/<taskId>/.task.lock`; no arranque, o worker apaga as pastas cujo *lock* consegue tomar (sem dono vivo), e o cancelamento de uma tarefa que não está a correr faz o mesmo. É seguro com várias réplicas a partilhar o volume, e as pastas da ingestão da B001 (sem *lock*) não são tocadas | High (NFR-007) | Fixed |
| 2. A cadência do progresso ficava entre 1,0 e 1,5 s (intervalo máximo medido de 1097 ms): o envio esperava 1,0 s num ciclo de ~0,5 s. **Correção:** envio a cada 0,5 s (cerca de 2 eventos por segundo); o teste E2E passou a exigir ≤ 1000 ms | Medium (NFR-009) | Fixed |
| 3. O router de vídeo do gateway só registava erros, por isso um pedido bem-sucedido não deixava o `correlationId` nos logs do gateway (NFR-002). **Correção:** um *middleware* novo, acrescentado a seguir ao da correlação, regista cada pedido de vídeo no fim da resposta (`video.gateway.request`) | Medium (NFR-002) | Fixed |
| 4. O registo da falha da reserva não guardava o número de créditos, que a D-48 precisa | Low | Fixed no Estágio 4 (`credits` no `video.task.reserve_failed`) |
| 5. Defeitos dos próprios testes, sem efeito no código: vídeo de referência rodado mal construído (o FFmpeg 5.1 só escreve a matriz de rotação em cópia de streams, como já notava a B001); créditos do dono esgotados antes dos testes de queda, que passaram a ter um utilizador próprio | — | Fixed |
| 6. As E2E no navegador das B001 e B002 (10) não foram corridas: precisam do `playwright-core` e do seu Chromium, que não estão instalados nesta máquina. A B003 não monta nenhum componente (D-47), e no frontend só acrescenta 4 ficheiros novos não importados por nenhum ecrã, por isso não pode alterar esses ecrãs | — | Registado |

Correções 1 a 3: as duas primeiras vão além do texto do ADD (varrimento no arranque com `flock`; cadência de 0,5 s) e ficam à decisão da equipa no checkpoint (ADR ou D, se a equipa quiser).

**Dados de teste apagados no fim:**
- os 35 utilizadores criados (28 `e2e *` e 7 anónimos, filtrados pela data do `ObjectId` a partir das 16:00 UTC);
- os seus 23 projetos, 53 vídeos e 25 tarefas;
- 18 *buckets* (`s3.bucket.delete`, só os dos utilizadores de teste; os 3 *buckets* anteriores ao bolt ficam);
- a pasta deixada pela primeira execução falhada no `video_tmp`.

Ficam os 2 vídeos anteriores ao bolt. O ficheiro compose temporário foi apagado e os serviços foram recriados sem a variável.

## Ready for Operations

- [x] Testes unitários e de integração a passar (249/249; 10 E2E de navegador da regressão não corridas, ver 6)
- [x] Critérios de aceitação da ST-VID-COM-001 cumpridos
- [x] Nenhuma linha de código existente alterada
- [x] Desempenho dentro dos alvos (NFR-005, NFR-009, D-43)
- [ ] Checkpoint final da equipa e `bolt-complete.cjs`
