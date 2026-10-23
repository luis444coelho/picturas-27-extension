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
