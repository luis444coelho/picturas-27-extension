---
id: 002-video-access
unit: 001-video-lifecycle
intent: 001-video-processing-support
type: simple-construction-bolt
status: planned
stories: [ST-VID-006, ST-VID-007]
created: 2026-10-19T17:31:16Z
started: null
completed: null
current_stage: null
stages_completed: []
requires_bolts: [001-video-lifecycle]
enables_bolts: [009-video-batch]
requires_units: []
blocks: true
# avg_complexity: maior esforço do ADD no bolt (S=1, M=2, L=3); os outros campos são preenchidos no início do bolt na Construção (specsDuvidas D-01)
complexity: {avg_complexity: 1, avg_uncertainty: null, max_dependencies: null, testing_scope: null}
---

# Bolt: 002-video-access

## Visão geral

Descarregamento e consulta de informações de vídeos concluídos (UC-VID-006 e UC-VID-007), sem quota, segundo as secções 4.1 e 4.2 do ADD v1.1.

## Objetivo

Implementar os endpoints `GET /projects/:user/:project/videos/:video` (informações) e `GET /projects/:user/:project/videos/:video/download` (URL assinado de 15 min) e os respetivos componentes de frontend, com autorização de leitura e sem criar tarefa nem debitar quota.

## Stories incluídas

- **ST-VID-006 — Descarregar vídeo**: [Descarregar vídeo](../../intents/001-video-processing-support/units/001-video-lifecycle/stories/002-video-download.md) (must).
- **ST-VID-007 — Consultar informações do vídeo**: [Consultar informações do vídeo](../../intents/001-video-processing-support/units/001-video-lifecycle/stories/003-video-information.md) (must).

## Tipo de bolt

**Tipo**: Simple Construction Bolt
**Definição**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Etapas

- [ ] **1. Plan**: Pending → `implementation-plan.md`
- [ ] **2. Implement**: Pending → código + `implementation-walkthrough.md`
- [ ] **3. Test**: Pending → `test-walkthrough.md`

## Requisitos rastreados

REQ-VID-DOWNLOAD-001 a 009; REQ-VID-INFO-001 a 009; REQ-VID-NFR-016, 025.

Consome os contratos de autorização (`REQ-VID-AUTH-*`) da B001, que constrói os routers de vídeo com o `videoAuth` (specsDuvidas D-02).

Os critérios de aceitação autoritativos são os dos ficheiros `docs/requirements/REQ-VID-*.md`; a propriedade de cada requisito está em `intents/001-video-processing-support/traceability.md`.

## Decisões do ADD v1.1

- **4.1 (descarregamento):** `videoAuth` no gateway (401/403); `checkSharePermission` sem `requireEditPermission`; recusa do `anonymous` com 403 a partir de `GET users:/:user/type` para o `X-Caller-Id`; 404 se o vídeo não existir e 409 `RESOURCE_NOT_READY` se não estiver `completed`; `headObject` ao `original_key` (404 `RESOURCE_UNAVAILABLE` se faltar); resposta `{url, fileName, expiresAt}`. Dois momentos: o URL só é gerado na confirmação.
- **4.2 (informações):** devolve `meta`, `status`, `source_video_ids` (com nomes; "Vídeo removido" se a origem já não existir), `recipe` e `downloadFileName`; resolução de apresentação (Q-ADD-13), tamanho com 1 MB = 1024² e 1 GB = 1024³ bytes; campo ausente mostrado como "Indisponível" com `METADATA_UNAVAILABLE` nos logs.
- **T-08:** `services/videoUrls.js` gera o URL de leitura (a B001 já tem os URLs de escrita, specsDuvidas D-02; o bolt que cria o `route/video.js` e o `services/videoUrls.js` está em dúvida, ver specsDuvidas.md, D-08) com `expires` de 900 s, `ResponseContentDisposition` (RFC 6266, `filename` e `filename*`) e `ResponseContentType`; `route/video.js` montado com `app.use("/video", …)`; `location /s3-video/` novo no nginx, sem *buffering*, com `Range` e respostas 206.
- **T-10:** registo da emissão do URL com `correlationId`, utilizador e recurso; `log_format` novo do `/s3-video/` regista só `$uri`, sem a *query string*.
- **Função única do nome sugerido:** `projects/video/fileName.js`, usada pelos dois endpoints. **Q-ADD-08 (pendente no ADD):** sufixo para cadeias, junções e lotes e nome base de uma junção.
- **Q-ADD-05:** os URLs pré-assinados são portadores; o controlo é a validade de 15 min.

## Saídas esperadas

- Rotas no router de vídeo do gateway (`apiGateway/routes/videos.js`) e do serviço de projetos (`projects/routes/videos.js`) para informações e descarregamento.
- `projects/video/fileName.js`.
- `imageStorageService/services/videoUrls.js` (leitura) e rotas do `route/video.js` (`headObject`).
- `location /s3-video/` e `log_format` novos no `nginx/nginx.conf`.
- Frontend: ação "Descarregar" (âncora `href`, não `blob`) e painel "Informações" na galeria e no leitor, com os formatadores da 4.2.
- Testes ligados aos critérios de `REQ-VID-DOWNLOAD-*`, `REQ-VID-INFO-*`, NFR-016 e NFR-025.

## Critérios de passagem

- [ ] Stories incluídas implementadas e respetivos critérios de aceitação cumpridos.
- [ ] Critérios de aceitação dos requisitos rastreados (ficheiros `docs/requirements/REQ-VID-*.md`) verificados por testes.
- [ ] Nenhuma linha de código existente alterada (regra 2.6 do ADD); o fluxo de imagem continua a funcionar como antes.
- [ ] Testes automatizados e relatório do bolt registados; nenhum resultado de teste é presumido nesta fase.
- [ ] Código revisto.
- [ ] O descarregamento e a consulta não criam tarefa nem chamam a reserva de quota; a única chamada ao serviço de utilizadores é a leitura do tipo.
- [ ] Os dados do ficheiro passam pelo nginx (`/s3-video/`) e não pelo API Gateway; um pedido com `Range` recebe 206.

## Dependências

### Requer

- **Bolts:** 001-video-lifecycle (coleção `videos`, estágios de vídeo e recursos concluídos).
- **Units:** Nenhuma além da própria Unit 001.

### Desbloqueia

- 009-video-batch (ZIP do lote usa o URL assinado e o `downloadFileName` da 4.1); a B009 está `blocked` (specsDuvidas D-06).

## Limites

- **Regra 2.6 do ADD ("só acrescentar"):** o código existente não é alterado. Só se acrescentam ficheiros novos e pontos de ligação novos (uma linha `app.use` ou `require`, uma fila, exchange ou *binding* em `rabbitMQ/definitions.json`, um serviço ou volume no `docker-compose.yaml`, um `location` ou `log_format` no `nginx/nginx.conf`, componentes novos no frontend), sem tocar nas linhas existentes nem mudar o comportamento do fluxo de imagem.
- Usa sempre `original_key`, nunca `preview_key` (DOWNLOAD-006).
- O `getPresignedUrl.js`, o `location /s3/` e o `location /api-gateway/` existentes não mudam.

## Notas

- Esforço no ADD: UC-VID-006 = S, UC-VID-007 = S. `avg_complexity` = 1 (maior esforço do ADD no bolt, com S=1, M=2, L=3); `avg_uncertainty`, `max_dependencies` e `testing_scope` são preenchidos no início do bolt na Construção (specsDuvidas D-01).
- Confirmar que o SeaweedFS 4.47 aplica `response-content-disposition`; se não, o nome vai no atributo `download` da âncora (ADD 4.1, riscos).
