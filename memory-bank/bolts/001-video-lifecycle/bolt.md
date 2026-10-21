---
id: 001-video-lifecycle
unit: 001-video-lifecycle
intent: 001-video-processing-support
type: ddd-construction-bolt
status: planned
stories: [ST-VID-000]
created: 2026-10-19T17:31:16Z
started: null
completed: null
current_stage: null
stages_completed: []
requires_bolts: []
enables_bolts: [002-video-access, 003-video-task-foundation]
requires_units: []
blocks: false
# avg_complexity: maior esforço do ADD no bolt (S=1, M=2, L=3); os outros campos são preenchidos no início do bolt na Construção (specsDuvidas D-01)
complexity: {avg_complexity: 3, avg_uncertainty: null, max_dependencies: null, testing_scope: null}
---

# Bolt: 001-video-lifecycle

## Visão geral

Fundação de vídeo do UC-VID-000: carregamento, ingestão, persistência e visualização de vídeos no projeto, segundo o T-00 do ADD v1.1. Constrói a parte do T-00 de que a ingestão precisa: coleção, estágios, URLs de escrita, `formats.js`, routers com o `videoAuth`, filas, `wsGateway/video.js` e o worker de vídeo com a ingestão (specsDuvidas D-02).

## Objetivo

Implementar o UC-VID-000 sobre a fundação mínima do ADD (T-00): coleção `videos`, estágios de vídeo no storage, ingestão com metadados, miniatura, fotograma 0 e cópia de pré-visualização MP4, e leitor integrado, sem débito de quota.

## Stories incluídas

- **ST-VID-000 — Carregar e visualizar vídeo**: [Carregar e visualizar vídeo](../../intents/001-video-processing-support/units/001-video-lifecycle/stories/001-video-ingestion.md) (must).

## Tipo de bolt

**Tipo**: DDD Construction Bolt
**Definição**: `.specsmd/aidlc/templates/construction/bolt-types/ddd-construction-bolt.md`

## Etapas

- [ ] **1. Domain Model**: Pending → `ddd-01-domain-model.md`
- [ ] **2. Technical Design**: Pending → `ddd-02-technical-design.md`
- [ ] **3. ADR Analysis** (opcional): Pending → `adr-{n}-{slug}.md`
- [ ] **4. Implement**: Pending → código nos componentes indicados em "Saídas esperadas"
- [ ] **5. Test**: Pending → `ddd-03-test-report.md`

## Requisitos rastreados

REQ-VID-AUTH-001 a 003; REQ-VID-UPLOAD-001 a 020; REQ-VID-STORAGE-001 a 005; REQ-VID-NFR-001, 003, 008, 010, 017.

Os `REQ-VID-AUTH-*` passam para este bolt, que constrói os routers de vídeo com o `videoAuth` (specsDuvidas D-02). A NFR-010 (FFmpeg em Docker) passa para este bolt, que cria o worker (specsDuvidas D-03).

Os critérios de aceitação autoritativos são os dos ficheiros `docs/requirements/REQ-VID-*.md`; a propriedade de cada requisito está em `intents/001-video-processing-support/traceability.md`.

## Decisões do ADD v1.1

- **T-00 (fundação mínima):** modelo novo `projects/models/video.js` (coleção `videos`, separada de `project.imgs`) com os campos do esquema do T-00, incluindo `meta.rotation`, `meta.display_width`/`display_height` (Q-ADD-13), `storage.preview_key`, `storage.thumb_key`, `storage.first_frame_key`, `source_video_ids` e `recipe`; `status` de ingestão `queued | processing | completed | failed`. O campo `batch_id` não é criado (specsDuvidas D-06).
- **T-00, ingestão:** FFprobe extrai os metadados; miniatura a 00:00:01, ou no fotograma 0 se o vídeo tiver menos de 1 s (Q-ADD-22); fotograma 0 rodado e reduzido a no máximo 1280 px de largura para as pré-visualizações (T-07, Q-ADD-06).
- **T-06 / Q-ADD-20:** cópia de pré-visualização MP4 na ingestão para originais MOV ou AVI e para MP4 com perfis H.264 que os navegadores não reproduzem (10 bits, 4:2:2, 4:4:4), recodificada para `yuv420p`; guardada em `storage.preview_key`; o leitor usa-a quando existe.
- **T-08:** estágios de vídeo num ficheiro novo `imageStorageService/utils/videoStages.js` (`video_src`, `video_out`, `video_preview`, `video_thumb`); o `utils/stages.js` não muda. O estágio `video_zip` não é criado, porque só os lotes o usam (specsDuvidas D-06).
- **Q-ADD-04 (pendente no ADD):** a estratégia de carregamento de ficheiros até 2 GB (*streaming* pelos serviços ou PUT pré-assinado) não está decidida; em qualquer caso, a rota escolhida tem um `location` novo no nginx com `client_max_body_size 2g` e `proxy_request_buffering off` (T-08).
- **Q-ADD-19:** o módulo de vídeo reutiliza o `services/s3Client.js` (`aws-sdk` v2) existente, sem migração.
- **T-00 (rotas) / T-08 (URLs de escrita):** routers novos `apiGateway/routes/videos.js` e `projects/routes/videos.js`, cada um montado com uma linha `app.use` nova antes do router existente; *middleware* `apiGateway/auth/videoAuth.js` (401 sem JWT válido, 403 se o utilizador do token não for o `:user`); no serviço de projetos, reutilização de `checkSharePermission`, `requireEditPermission` e `enforcePresenceLimit`, sem `requireProjectVersion`. URL de escrita (`putObject`) só para a rede interna, pedido pelo worker quando o FFmpeg termina (specsDuvidas D-02).
- **T-00 (filas e WebSocket):** entradas novas em `rabbitMQ/definitions.json` para `video_operations_queue`, `video_project_queue` e `video_ws_queue`, com os *bindings* na exchange `picturas`; módulo `wsGateway/video.js`, carregado por uma linha nova no fim de `wsGateway/index.js`, que consome `video_ws_queue` (specsDuvidas D-02). A exchange `video_control` é da B003.
- **T-02 (worker) / T-05:** worker `Tools/video/` (`video.py`, subclasse de `Rabbit_MQ`, `video_msg.py`, configuração própria com `VIDEO_STORAGE_URL`) sobre `python:3.11-slim` com `apt-get install ffmpeg`, que reutiliza `Tools/utils/rabbit_mq.py` e `env.py` sem os alterar e não usa `tool_msg.py`, com a ingestão (FFprobe, miniatura, fotograma 0 e cópia MP4, T-06); `projects/video/formats.js` como única fonte da matriz (specsDuvidas D-02). O executor de cadeias é da B003.

## Saídas esperadas

- Modelo `projects/models/video.js` e acesso à coleção `videos`.
- `imageStorageService/utils/videoStages.js` sem `video_zip`, e a parte do módulo de vídeo do storage necessária à ingestão, incluindo os URLs de escrita (T-08) (specsDuvidas D-02, D-06).
- Pipeline de ingestão: validação de contentor/codecs e limites por perfil, metadados (incluindo rotação e dimensões de apresentação), miniatura, fotograma 0 e cópia MP4 (T-00, T-06, T-07).
- Frontend: componentes novos de carregamento (seleção e arrastamento, progresso, cancelamento) e leitor integrado que usa `preview_key` quando existe.
- `projects/video/formats.js` (T-05).
- Routers `apiGateway/routes/videos.js` e `projects/routes/videos.js` e *middleware* `apiGateway/auth/videoAuth.js` (T-00).
- Filas `video_operations_queue`, `video_project_queue` e `video_ws_queue` em `rabbitMQ/definitions.json` e módulo `wsGateway/video.js` (T-00).
- Worker `Tools/video/` com a ingestão (FFprobe, miniatura, fotograma 0 e cópia MP4) e o respetivo serviço no `docker-compose.yaml` (T-02, T-06).
- Não constrói o `VideoBatch`, o estágio `video_zip`, o campo `batch_id`, o endpoint de lote nem a dependência `archiver` (specsDuvidas D-06), nem a extração de fotogramas no worker (specsDuvidas D-05, D-06).
- Testes de aceitação ligados aos critérios de `REQ-VID-AUTH-*`, `REQ-VID-UPLOAD-*`, `REQ-VID-STORAGE-*` e NFR rastreados.

## Critérios de passagem

- [ ] Stories incluídas implementadas e respetivos critérios de aceitação cumpridos.
- [ ] Critérios de aceitação dos requisitos rastreados (ficheiros `docs/requirements/REQ-VID-*.md`) verificados por testes.
- [ ] Nenhuma linha de código existente alterada (regra 2.6 do ADD); o fluxo de imagem continua a funcionar como antes.
- [ ] Testes automatizados e relatório do bolt registados; nenhum resultado de teste é presumido nesta fase.
- [ ] Código revisto.
- [ ] Um vídeo válido fica em `videos` com `status: completed`, metadados, miniatura, fotograma 0 e, quando aplicável, cópia MP4; o carregamento não debita quota.
- [ ] Falha ou cancelamento do carregamento não deixa objeto no storage nem registo em `videos`.
- [ ] As rotas de vídeo respondem 401 sem JWT válido e 403 ao utilizador `anonymous` e a quem não tem a permissão exigida; o worker de vídeo arranca com `docker compose up` sem binários instalados no *host*.

## Dependências

### Requer

- **Bolts:** Nenhum (primeiro bolt).
- **Units:** Baseline existente (autenticação JWT, projetos e partilha, `imageStorageService`/SeaweedFS, MongoDB).

### Desbloqueia

- 002-video-access, 003-video-task-foundation.

## Limites

- **Regra 2.6 do ADD ("só acrescentar"):** o código existente não é alterado. Só se acrescentam ficheiros novos e pontos de ligação novos (uma linha `app.use` ou `require`, uma fila, exchange ou *binding* em `rabbitMQ/definitions.json`, um serviço ou volume no `docker-compose.yaml`, um `location` ou `log_format` no `nginx/nginx.conf`, componentes novos no frontend), sem tocar nas linhas existentes nem mudar o comportamento do fluxo de imagem.
- Não cria tarefas de processamento (`VideoTask`, `video_project_locks`, `video_control`), quota, cancelamento, progresso, registo de operações, executor de cadeias nem operações de transformação (B003 e seguintes; specsDuvidas D-02).
- O `project.imgs`, o `utils/stages.js`, o `services/getPresignedUrl.js` e os `location` existentes do nginx não mudam (ADD T-00, T-08).

## Notas

- Esforço da fundação no ADD (tabela-resumo, secção 5): T-00 = L. `avg_complexity` = 3 (maior esforço do ADD no bolt, com S=1, M=2, L=3); `avg_uncertainty`, `max_dependencies` e `testing_scope` são preenchidos no início do bolt na Construção (specsDuvidas D-01).
- Ordem de construção: a Q-ADD-01 manda construir primeiro a fundação T-00 e o worker T-02. A tabela de bolts não muda: este bolt não tem dependências e constrói a parte do T-00 de que a ingestão precisa; a B003 fica com o resto (specsDuvidas D-02).
- O módulo AMQP do serviço de projetos (`projects/video/amqp.js`), os URLs internos de leitura e a criação do `route/video.js` e do `services/videoUrls.js` do storage, e o volume `video_tmp` não estão distribuídos pela D-02 (ver specsDuvidas.md, D-08).
