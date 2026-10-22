# Suite persistente da B005

Corre a partir da raiz do repositório, numa pilha local de teste já configurada. As operações `watermark`, `adjust`, `filter`, `resize` e `orient` estão sempre ativas. A `test_reencode` (D-37) fica desligada nos serviços; os testes unitários só a ligam no seu próprio subprocesso. Não é preciso instalar dependências no host.

## Build e preparação

```bash
docker compose up -d --no-deps --build projects api_gateway video_worker frontend
```

O Dockerfile do frontend faz o build de produção.

## JS do serviço de projetos (B005 e regressão B001–B004)

```bash
docker exec -e VIDEO_TEST_OPERATIONS=1 -w /app picturas-projects-1 \
  node --test --experimental-test-coverage \
  test/video/domain.test.js test/video/maintenance.test.js \
  test/video/tasks.test.js test/video/access.test.js \
  test/video/ingest.test.js test/video/task-domain.test.js \
  test/video/basic-edits.test.js test/video/visual-edits.test.js
```

## Worker com FFmpeg/FFprobe 5.1 reais

```bash
docker exec -e VIDEO_TEST_OPERATIONS=1 -e PYTHONPATH=/app \
  -e PYTHONDONTWRITEBYTECODE=1 -w /app picturas-video_worker-1 \
  python -m unittest -v tests.test_basic_edits tests.test_task tests.test_ingest tests.test_visual_edits
```

`tests/visual_filters.json` é uma cópia do `projects/video/filters.json`, usada só como dados de teste: o worker não tem catálogo e recebe a entrada do filtro no plano (T-07).

## Funções do frontend sem browser

Usa o Node do serviço de projetos (com *native type stripping*), num diretório temporário novo:

```bash
docker exec picturas-projects-1 mkdir /tmp/b005-frontend-suite
docker cp frontend/lib picturas-projects-1:/tmp/b005-frontend-suite/lib
docker cp frontend/test picturas-projects-1:/tmp/b005-frontend-suite/test
docker exec -w /tmp/b005-frontend-suite picturas-projects-1 node --test \
  test/video-visual.test.mts test/video-edit.test.mts test/video-access.test.mts \
  test/video-project.test.mts test/video-task-state.test.mts
docker exec -w /usr/src/app picturas-frontend-1 \
  bun node_modules/typescript/bin/tsc --noEmit --incremental false
```

## Integração real (nginx, API, MongoDB, RabbitMQ, storage, worker, imagem)

Gera as fixtures num diretório vazio. `long.mp4` tem 60 s a 720p, para o cancelamento e a D-66.

```bash
docker exec -e PYTHONPATH=/app -e PYTHONDONTWRITEBYTECODE=1 -w /app picturas-video_worker-1 \
  python -m tests.generate_visual_edit_fixtures /tmp/b005-e2e-fixtures
docker cp picturas-video_worker-1:/tmp/b005-e2e-fixtures <dir-local>/b005-e2e-fixtures
docker cp <dir-local>/b005-e2e-fixtures picturas-projects-1:/tmp/b005-e2e-fixtures
docker exec -e VIDEO_E2E_URL=https://nginx -e VIDEO_E2E_FIXTURES=/tmp/b005-e2e-fixtures \
  -e NODE_TLS_REJECT_UNAUTHORIZED=0 -w /app picturas-projects-1 \
  node --test test/video/e2e-visual-edits.test.js
```

O que a suite verifica:
- as cinco operações pela pilha;
- a equivalência sharp ↔ FFmpeg: compara a pré-visualização com o fotograma 0 guardado do resultado;
- a latência da NFR-015 (40 pedidos);
- as rejeições sem tarefa nem quota;
- as imagens da marca de água;
- o cancelamento com devolução de quota e a recusa pelo servidor da D-66;
- a regressão de imagem.

Os casos do ajuste estão marcados como `todo` até haver resposta à D-67.

O `after()` apaga só os IDs criados nesta execução: vídeos, tarefas, marcas (`video_watermarks` e `wm-*.png`), projetos, utilizadores, *buckets* e diretórios locais de imagem.

A regressão de imagem calcula o valor esperado a partir do píxel real da fixture. Em aarch64, o `color=c=blue` do lavfi dá 253 (não 255), e o `ImageEnhance.Brightness(0.5)` dá então 126. É por isso que o teste equivalente da B004, que fixa 127, falha nesta máquina sem haver regressão.

## Browser (D-66), no host

Requer o Node 22 (WebSocket global) e um Chromium. Usa o protocolo DevTools, sem dependências novas. As fixtures `quad.mp4` e `long.mp4` são as do passo anterior, num diretório local.

```bash
VIDEO_UI_URL=https://localhost:8080 VIDEO_UI_BROWSER="<binário Chromium>" \
VIDEO_E2E_FIXTURES=<dir-local>/b005-e2e-fixtures VIDEO_UI_SCREENSHOTS=<dir-local> \
NODE_TLS_REJECT_UNAUTHORIZED=0 node --test projects/test/video/e2e-visual-ui.test.js
```

São dois casos:
1. Com o WebSocket ligado, o botão da B005 fica desativado enquanto há uma tarefa da B004 no projeto.
2. Sem eventos (o `socket.io` bloqueado), o pedido chega ao servidor e a interface mostra `TASK_ALREADY_ACTIVE` com o código de suporte.

O utilizador e o projeto são apagados pela API. Os vídeos do projeto apagado são removidos pela rotina de manutenção da B003.

Depois de guardar os resultados, remove só os diretórios temporários criados nesta execução.
