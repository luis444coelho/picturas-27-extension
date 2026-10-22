# Suite persistente da B004

Executar a partir da raiz do repositório, numa pilha local de teste já configurada. As operações reais `trim`, `remove_audio` e `speed` ficam ativas; `test_reencode` permanece desligada nos serviços. Os testes unitários ativam-na apenas no seu subprocesso. Não é necessário instalar dependências no host.

## Build de produção e preparação

```bash
docker compose up -d --no-deps --build projects video_worker frontend
```

O Dockerfile do frontend executa o build de produção. Não acrescentar `--remove-orphans`: não faz parte da limpeza destes testes.

## JS e regressão unitária das B001–B003

```bash
docker exec -e VIDEO_TEST_OPERATIONS=1 -w /app picturas-projects-1 \
  node --test --experimental-test-coverage \
  test/video/domain.test.js test/video/maintenance.test.js \
  test/video/tasks.test.js test/video/access.test.js \
  test/video/ingest.test.js test/video/task-domain.test.js \
  test/video/basic-edits.test.js
```

São 154 testes, incluindo 32 da B004. O processo de teste não altera as variáveis do serviço em execução.

## Worker com FFmpeg/FFprobe 5.1 reais

```bash
docker exec -e VIDEO_TEST_OPERATIONS=1 -e PYTHONPATH=/app \
  -e PYTHONDONTWRITEBYTECODE=1 -w /app picturas-video_worker-1 \
  python -m unittest -v tests.test_basic_edits tests.test_task tests.test_ingest
```

São 56 testes, incluindo 12 da B004. A suite exige explicitamente a versão 5.1 das duas ferramentas, cria vídeos numerados em `TemporaryDirectory` e remove-os no final. Verifica hashes dos segmentos copiados, limites visuais dos recodificados, durações de streams com tolerância de um fotograma e sincronismo das durações de áudio/vídeo. `format.duration` serializado em milissegundos usa o equivalente de um fotograma arredondado ao milissegundo superior. Para AUDIO-006 aplica a duração visual aprovada na D-55.

## Frontend sem browser

Usar o Node 26 do serviço de projetos para os `.mts`; o Node 18 da imagem do frontend não suporta native type stripping. Escolher um diretório temporário novo para cada execução; os caminhos abaixo pertencem exclusivamente a esta execução.

```bash
docker exec picturas-projects-1 mkdir /tmp/b004-frontend-suite
docker cp frontend/lib picturas-projects-1:/tmp/b004-frontend-suite/lib
docker cp frontend/test picturas-projects-1:/tmp/b004-frontend-suite/test
docker exec -w /tmp/b004-frontend-suite picturas-projects-1 node --test \
  test/video-edit.test.mts test/video-access.test.mts \
  test/video-project.test.mts test/video-task-state.test.mts
docker exec -w /usr/src/app picturas-frontend-1 \
  bun node_modules/typescript/bin/tsc --noEmit --incremental false
docker exec -w /usr/src/app picturas-frontend-1 \
  bun node_modules/eslint/bin/eslint.js lib/video-edit.ts \
  components/video/use-video-edit.ts components/video/video-edit-actions.tsx \
  components/video/video-edit-status.tsx components/video/video-edit-validation.tsx \
  components/video/video-remove-audio-panel.tsx components/video/video-speed-panel.tsx \
  components/video/video-trim-panel.tsx
```

São 50 testes de funções/estado, incluindo 27 novos; não substituem os testes do leitor/DOM. O checklist manual está em `memory-bank/bolts/004-video-basic-edits/manual-test-checklist.md`.

## Integração real API/MongoDB/RabbitMQ/storage/worker/imagem

Gerar fixtures pelo código persistente, num diretório inicialmente vazio. Os nomes são intencionais: a suite combina os ficheiros de 4 s com `long.mp4` de 20 s/720p e `image.png` de 64×48.

```bash
docker exec -e PYTHONPATH=/app -e PYTHONDONTWRITEBYTECODE=1 \
  -w /app picturas-video_worker-1 \
  python -m tests.generate_basic_edit_fixtures /tmp/b004-e2e-fixtures
docker cp picturas-video_worker-1:/tmp/b004-e2e-fixtures /tmp/b004-e2e-fixtures
docker cp /tmp/b004-e2e-fixtures picturas-projects-1:/tmp/b004-e2e-fixtures
docker exec -e VIDEO_E2E_URL=https://nginx \
  -e VIDEO_E2E_FIXTURES=/tmp/b004-e2e-fixtures \
  -e NODE_TLS_REJECT_UNAUTHORIZED=0 -w /app picturas-projects-1 \
  node --test test/video/e2e-basic-edits.test.js
```

A desativação da validação TLS fica limitada ao processo de teste e ao certificado local. Sem `VIDEO_E2E_URL`/`VIDEO_E2E_FIXTURES`, a suite fica explicitamente skipped; isso não é um resultado aprovado.

Por omissão usa MongoDB, AMQP, storage e S3 da rede Compose local. Para outra configuração, definir `VIDEO_E2E_MONGO`, `VIDEO_E2E_USERS_MONGO`, `VIDEO_E2E_AMQP`, `VIDEO_E2E_STORAGE`, `VIDEO_E2E_S3`, `VIDEO_E2E_S3_ACCESS` e `VIDEO_E2E_S3_SECRET` no processo de teste; não escrever credenciais no repositório. A suite partilha um único projeto de teste com editores free para não esgotar volumes do SeaweedFS.

A republicação testa uma tarefa nova própria, persistida sem `published_at`, através da rotina real, sem parar serviços. A limpeza tardia publica uma resposta sintética apenas para outra tarefa própria já cancelada e exige eliminação do preview persistido, mesmo omitido em `output.keys`. O cancelamento normal espera progresso positivo do FFmpeg. A regressão de imagem passa por upload, ferramenta brightness, worker real e download do resultado, verificando dimensões e pixel processado.

O `after()` elimina objetos, buckets, documentos e utilizadores pelos IDs que esta execução criou. Antes de apagar um bucket próprio, valida que cada chave é um marcador de pasta ou pertence aos projetos desta execução. Remove também os diretórios locais de imagem desses utilizadores novos, em `/app/images/users/<id>` no contentor de projetos (`VIDEO_E2E_LOCAL_IMAGES` permite indicar outra raiz de teste). Não há eliminação por nomes globais nem limpeza de recursos preexistentes. Falhas de limpeza fazem falhar a suite; as ligações são fechadas sequencialmente em `finally`.

Após guardar os resultados, remover apenas os diretórios temporários acima que tenham sido criados nesta execução. Os vídeos também podem servir os testes manuais antes dessa remoção. Não executar as suites históricas `e2e-*.test.js` em conjunto sem preparar os seus ambientes/fixtures próprios; algumas reiniciam o worker, usam `test_reencode` ou têm outros requisitos de tempo/limpeza.
