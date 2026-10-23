# Suite persistente da B008

Corre a partir da raiz do repositório, numa pilha local de teste já configurada. A `concat` está sempre ativa; a `test_reencode` (D-37) fica desligada nos serviços. Não é preciso instalar dependências no host.

## Build

```bash
docker compose up -d --no-deps --build projects api_gateway users ws_gateway video_worker frontend
```

## JS do serviço de projetos (B008 e regressão B001–B007)

```bash
docker exec -e VIDEO_TEST_OPERATIONS=1 -w /app picturas-projects-1 \
  sh -c 'node --test $(ls test/video/*.test.js | grep -v e2e)'
```

`composition.test.js` cobre a estrutura (D-78, D-79, D-85), a `concat`, as três fases (D-80, D-81), o `_clips`, os extras do plano, a estrutura das predefinições (ADR-018) e, no `tasks.js`, `totalSteps = N` e `error.phase` (D-82).

## Worker com FFmpeg/FFprobe 5.1 reais

```bash
docker exec -e VIDEO_TEST_OPERATIONS=1 -e PYTHONPATH=/app -e PYTHONDONTWRITEBYTECODE=1 -w /app \
  picturas-video_worker-1 python -m unittest tests.test_basic_edits tests.test_task \
  tests.test_ingest tests.test_visual_edits tests.test_convert tests.test_composition
```

## Funções do frontend sem browser

```bash
docker exec picturas-projects-1 mkdir /tmp/b008-frontend-suite
docker cp frontend/lib picturas-projects-1:/tmp/b008-frontend-suite/lib
docker cp frontend/test picturas-projects-1:/tmp/b008-frontend-suite/test
docker exec -w /tmp/b008-frontend-suite picturas-projects-1 node --test \
  test/video-chain.test.mts test/video-visual.test.mts test/video-edit.test.mts \
  test/video-access.test.mts test/video-project.test.mts test/video-task-state.test.mts
docker exec -w /usr/src/app picturas-frontend-1 bun test test/video-convert.test.mts
docker exec -w /usr/src/app picturas-frontend-1 bun node_modules/typescript/bin/tsc --noEmit --incremental false
```

O `video-convert.test.mts` da B007 importa `./video-format` sem extensão e corre com o Bun, como na B007.

## Integração real (nginx, API, MongoDB, RabbitMQ, storage, worker, utilizadores)

```bash
docker exec -e PYTHONPATH=/app -e PYTHONDONTWRITEBYTECODE=1 -w /app picturas-video_worker-1 \
  python -m tests.generate_composition_fixtures /tmp/b008-e2e-fixtures
docker cp picturas-video_worker-1:/tmp/b008-e2e-fixtures <dir-local>/b008-e2e-fixtures
docker cp <dir-local>/b008-e2e-fixtures picturas-projects-1:/tmp/b008-e2e-fixtures
docker exec picturas-projects-1 mkdir -p /tmp/b008-outputs
docker exec -e VIDEO_E2E_URL=https://nginx -e VIDEO_E2E_FIXTURES=/tmp/b008-e2e-fixtures \
  -e VIDEO_E2E_OUTPUTS=/tmp/b008-outputs -e NODE_TLS_REJECT_UNAUTHORIZED=0 -w /app \
  picturas-projects-1 node --test test/video/e2e-composition.test.js
```

Com `VIDEO_E2E_OUTPUTS`, os resultados publicados e as cópias MP4 ficam nessa pasta, com `tasks.json` (rótulo → `taskId`). No host: `ffprobe`, `ffmpeg -v error -xerror -i <f> -f null -` e VLC (`-I dummy --play-and-exit --vout dummy --aout dummy`) em cada ficheiro; as invocações do FFmpeg por tarefa contam-se nos eventos `video.task.ffmpeg` de `docker logs picturas-video_worker-1`.

O `after()` apaga os objetos, buckets, documentos, marcas, predefinições e utilizadores criados nesta execução, pelos seus IDs. Os diretórios de fixtures e de resultados são do chamador.

## Revisão (D-86, D-87): integração com as três ações e medição da D-88

A suite `e2e-composition.test.js` inclui os testes da revisão: "Aplicar várias operações" com 12 passos, "Juntar vídeos" com 13 vídeos, Movie Maker com 3 vídeos, anónimo, falha a meio com devolução e a quota antes da tarefa. A medição da D-88 (junção de 100 clips curtos e cadeia de 60 passos) só corre com `-e VIDEO_E2E_D88=1` e grava os tempos em `VIDEO_E2E_OUTPUTS/d88.json`. A memória do FFmpeg mede-se no contentor do worker com `resource.getrusage(RUSAGE_CHILDREN).ru_maxrss` à volta do mesmo comando (`composition_task.build_command`), como está descrito no relatório da etapa 5.

## Edição simples igual antes e depois da D-87 (browser)

`e2e-panels-ui.test.js` corre no host (Node 22) com um Chromium (por exemplo, o Brave) pelo protocolo DevTools. Abre cada um dos nove painéis da edição simples, captura o DOM normalizado antes e depois de uma interação e compara-o com o *baseline*:

1. Construir o frontend da `origin/main` num *worktree* fora do repositório: `docker build -t b008-frontend-baseline <worktree>/frontend`.
2. Trocar o contentor: `docker stop picturas-frontend-1` e `docker run -d --name b008-frontend-baseline --network picturas_elk --network-alias frontend -e NEXT_PUBLIC_API_BASE_URL=/api-gateway/ b008-frontend-baseline`. Depois, `docker exec picturas-nginx-1 nginx -s reload`.
3. Gravar o *baseline*:
   ```bash
   VIDEO_UI_URL=https://localhost:8080 VIDEO_UI_BROWSER=<chromium> VIDEO_E2E_FIXTURES=<dir com wide.mp4> \
     VIDEO_UI_SNAPSHOTS=<dir vazio> VIDEO_UI_RECORD=1 NODE_TLS_REJECT_UNAUTHORIZED=0 \
     node --test projects/test/video/e2e-panels-ui.test.js
   ```
4. Repor o frontend atual: `docker rm -f b008-frontend-baseline`, `docker start picturas-frontend-1` e o *reload* do nginx.
5. Correr o mesmo comando sem `VIDEO_UI_RECORD`. Os nove painéis têm de dar o mesmo DOM, e as três ações da B008 têm de abrir os seus diálogos.

O teste apaga o utilizador e o projeto pela API. Os vídeos e os objetos do projeto apagado ficam para a rotina de manutenção da B003, e o bucket vazio do utilizador apagado fica no SeaweedFS até ser apagado à mão.
