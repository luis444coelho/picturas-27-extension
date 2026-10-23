---
stage: plan
bolt: 002-video-access
created: 2026-10-22T13:32:32Z
---

## Implementation Plan: 001-video-lifecycle (B002 — acesso a vídeos)

### Objective

Implementar o descarregamento (UC-VID-005, ADD 4.1) e a consulta de informações (UC-VID-006, ADD 4.2) de vídeos do projeto, com autorização de leitura, sem criar tarefa nem debitar quota, sobre a fundação construída pela B001 (coleção `videos`, routers de vídeo com `videoAuth`, `videoUrls.js`, `route/video.js` e `location /s3-video/`).

Fontes, por ordem de autoridade (regra da equipa na B001): `docs/add.md`, `docs/specsDuvidas.md`, `bolt.md` e stories, `docs/requirements/`, `docs/use-cases/`.

### Verificação prévia pedida pela D-29 (feita no início do Estágio 1)

Testado no stack em execução (SeaweedFS 4.47, objeto de teste num *bucket* temporário, já apagado):

1. SigV2 sem `response-*`, pelo nginx `/s3-video/` → **200**.
2. SigV2 com `response-content-disposition` (ASCII simples ou a forma RFC 6266 com `filename*`), pelo nginx → **403**. Confirma a D-29: o nome sugerido não pode ir no URL SigV2.
3. SigV4 com `response-content-disposition` RFC 6266, direto ao `seaweedfs:9000` → **200** com o `Content-Disposition` certo. O mesmo URL com o `Host` que o nginx envia (`localhost:8080`) → **403**, porque a SigV4 assina o `Host`.
4. `Range: bytes=60000-` pelo nginx → **206**, `Content-Range: bytes 60000-99999/100000` (DOWNLOAD-007, NFR-021).
5. URL com validade de 2 s, usado depois de expirar → **403** (DOWNLOAD-002).

Conclusão registada como **D-34**, respondida (a): o nome sugerido vai no atributo `download` da âncora, como o ADD 4.1 prevê.

### Deliverables

**Serviço de projetos**

- `projects/video/fileName.js` (novo): função única do nome sugerido, a partir de `original_name`, `recipe` e `meta.container` (DOWNLOAD-005, 006). Nome base = `original_name` sem extensão; sufixo com as operações do `recipe` pela ordem, unidas por `_` (D-35); extensão do contentor armazenado (`mp4`, `mov`, `avi`), nunca a do nome original nem a da cópia MP4.
- `projects/video/access.js` (novo): lógica dos dois casos, testável com dependências injetadas (como o `ingest.js` da B001):
  - `getInfo(video, correlationId)`: se `status !== "completed"`, devolve só `{id, originalName, status}`; senão devolve `{id, originalName, status, mimeType, meta, sources, recipe, downloadFileName, unavailable}`, em que `meta` traz os campos persistidos em *camelCase* (`container`, `videoCodec`, `audioCodec`, `displayWidth`, `displayHeight`, `durationMs`, `sizeBytes`, `fpsNum`, `fpsDen`), `sources` resolve cada `source_video_ids` para `{id, originalName}` ou `{id, originalName: null}` ("Vídeo removido", INFO-008), e `unavailable` lista os atributos sem metadado (`duration`, `resolution`, `format`, `size`, `fps`). Um `audio_codec` a `null` é "sem áudio", não metadado em falta (T-00). Com `unavailable` não vazio, regista `METADATA_UNAVAILABLE` com `correlationId`, `videoId` e os atributos (INFO-009).
  - `issueDownload(video, ctx)`: 409 `RESOURCE_NOT_READY` se não estiver `completed`; `headObject` ao `original_key` (nunca `preview_key`, DOWNLOAD-006) → 404 `RESOURCE_UNAVAILABLE` com registo `video.download.unavailable` se faltar; URL público de leitura de 900 s pelo `/s3-video/`; registo `video.download.issued` com `correlationId`, `userId`, `videoId` e `projectId`, **sem o URL** (DOWNLOAD-009, T-10); resposta `{url, fileName, expiresAt}`.
- `projects/routes/videos.js` (B001, por acréscimo): `GET /:user/:project/videos/:video` e `GET /:user/:project/videos/:video/download`, com `canRead` (`checkSharePermission` sem `requireEditPermission`, `loadProject`, `rejectAnonymous`) e `loadVideo`. Sem `enforcePresenceLimit` (leitura).
- `projects/video/errors.js` (B001, por acréscimo): código `RESOURCE_UNAVAILABLE` e a sua mensagem.

**API Gateway**

- `apiGateway/routes/videos.js` (B001, por acréscimo): duas linhas `router.get(…, checkVideoToken, forward("get"))` para as rotas acima. A correlação, o `X-Caller-Id` e a normalização de erros já existem.

**imageStorageService e nginx**

- Nada a acrescentar (D-34 (a)): o `videoUrls.js`, o `route/video.js` (incluindo o `headObject`), o `location /s3-video/` sem *buffering*, o `log_format video_s3` sem *query string* e o `error_log crit` (D-27) já foram construídos pela B001. Este bolt verifica-os nos testes (206, 403 depois de expirar, logs sem assinatura).

**Frontend**

- `frontend/lib/video-access.ts` (novo): tipos e chamadas `fetchVideoInfo` e `requestVideoDownload`; formatadores do ADD 4.2: duração `hh:mm:ss.mmm` (INFO-002), resolução `L × A px` de apresentação (INFO-003), formato `MOV (H.264 / AAC)` ou `MP4 (H.264 / sem áudio)` (INFO-004), fps com 2 casas (INFO-006); o tamanho reutiliza o `formatSize` da B001, que já segue a INFO-005; e a navegação para o URL com uma âncora `href` com o atributo `download` (D-34), nunca `blob`.
- `frontend/components/video/video-info-panel.tsx` (novo): painel "Informações" com os cinco atributos, "Indisponível" nos atributos de `unavailable`, proveniência ("Vídeo removido" para origens apagadas) e passos aplicados pela ordem; para um vídeo por concluir, só o estado.
- `frontend/components/video/video-download-dialog.tsx` (novo): os dois momentos do UC (4.1): mostra nome sugerido, formato e tamanho a partir do `GET …/videos/:video`; só na confirmação pede o URL e inicia a transferência. Repetir o pedido gera um URL novo (DOWNLOAD-008). Erros pelos códigos estáveis.
- `frontend/components/video/video-actions.tsx` (novo): botões "Informações" e "Descarregar"; ocultos para `anonymous`; "Descarregar" desativado com a indicação `RESOURCE_NOT_READY` quando `status !== "completed"` (DOWNLOAD-003).
- Pontos de ligação (componentes da B001, por acréscimo de uma linha `import` e um elemento): `video-player.tsx` (o leitor, aberto a partir da lista da área principal e da galeria da janela "Vídeos", FA3 do UC-007 e FA1 do UC-006) e `video-gallery.tsx` (ações por item na galeria da janela "Vídeos"). A lista da área principal (`project-video-list.tsx`) usa botões por item, que não podem conter outros botões; aí as ações ficam no leitor.
- `frontend/lib/videos.ts` (B001, por acréscimo): mensagem de `RESOURCE_UNAVAILABLE`.

**Testes** (Estágio 3)

- `projects/test/video/access.test.js` (unitários, `node --test`): `fileName.js` e `access.js` com *fakes*.
- `frontend/test/video-access.test.mts` (unitários): formatadores com os exemplos dos critérios da ERS.
- `projects/test/video/e2e-access.test.js` (E2E contra o stack, pelo nginx, como os da B001).
- Regressão das suites da B001.

### Dependencies

- **B001 (completa):** coleção `videos`, routers de vídeo com `videoAuth` e correlação, `projects/video/storage.js` (`publicReadUrl`, `head`), `projects/video/users.js` (`getUserType`), `imageStorageService/route/video.js`, `location /s3-video/`, componentes de vídeo do frontend e infraestrutura de testes E2E (geração das *fixtures* com a imagem do worker).
- **Serviço de utilizadores:** só `GET /:user/type` (DOWNLOAD-004, INFO-007: nenhuma chamada de quota).
- **Dependências novas:** nenhuma.

### Technical Approach

- **Autorização (AUTH, NFR-001, NFR-015):** igual às rotas de leitura da B001 (`GET …/videos` e `…/playback`): `videoAuth` no gateway (401/403), `checkSharePermission` + `loadProject` + `rejectAnonymous` no serviço de projetos.
- **Sem custo (DOWNLOAD-004, INFO-007, QUOTA-008):** os dois handlers não importam o módulo de quota, não criam `VideoTask` (que só existe a partir da B003) nem publicam mensagens AMQP; os testes unitários confirmam que a única chamada externa ao serviço de utilizadores é `getUserType`.
- **Dois momentos (4.1):** `GET …/videos/:video` devolve o `downloadFileName` e os metadados para o diálogo; só a confirmação chama `…/download`, de modo que os 15 min começam na confirmação.
- **NFR-014:** o ficheiro vai do SeaweedFS ao navegador pelo `/s3-video/`; o API Gateway só transporta o JSON `{url, fileName, expiresAt}`.
- **Regra 2.6:** nenhum ficheiro anterior ao vídeo é alterado. Nos ficheiros criados pela B001 só se acrescentam linhas (rotas, um código de erro, pontos de ligação dos componentes), como a D-08 prevê para a B002.
- **Ordem de trabalho no Estágio 2:** backend (`fileName.js`, `access.js`, rotas, gateway) → frontend → verificação manual no stack.
- **Complexidade (D-01):** `avg_uncertainty` = 2 (D-34 e D-35 em aberto no início do bolt, comportamento do SeaweedFS), `max_dependencies` = 1 (só a B001), `testing_scope` = 2 (unitários + E2E pelo nginx; sem worker nem filas).

### Dúvidas (respondidas no checkpoint do Estágio 1)

- **D-34 — Nome sugerido no descarregamento depois da verificação da D-29.** Resposta: (a) atributo `download` da âncora; no Estágio 3 confirma-se no navegador o descarregamento com o nome sugerido, também com acentos.
- **D-35 — Sufixo do nome sugerido para cadeias e junções e nome base de uma junção (Q-ADD-08).** Resposta: (a) passos pela ordem, unidos por `_`; junção com o nome base da primeira origem e `concat` no sufixo (resposta à Q-ADD-08).

### Acceptance Criteria

**ST-VID-006 / REQ-VID-DOWNLOAD-001 a 009, NFR-014, NFR-021**

- [ ] Leitor, editor ou dono de um vídeo `completed` recebe `{url, fileName, expiresAt}`, com `expiresAt` = emissão + 900 s, e o descarregamento inicia-se (001, 002).
- [ ] Sem acesso ao projeto → 403 (ou 410 para link revogado); anónimo → 403; vídeo inexistente → 404 `NOT_FOUND`; vídeo não `completed` → 409 `RESOURCE_NOT_READY`; objeto em falta → 404 `RESOURCE_UNAVAILABLE` com registo; em nenhum caso é emitido URL (001, 003).
- [ ] "Descarregar" desativado com indicação `RESOURCE_NOT_READY` quando o vídeo não está `completed`, e oculto para anónimos (003).
- [ ] O saldo da quota mantém-se depois de descarregamentos (004).
- [ ] Nome sugerido: original → `ferias.mp4`; resultado de recorte de `ferias.mp4` → `ferias_trim.mp4`; extensão do formato armazenado (005, 006).
- [ ] Um AVI carregado é descarregado com extensão `.avi` e hash idêntico ao ficheiro carregado; nunca a cópia MP4 (006).
- [ ] Pedido com `Range` pelo `/s3-video/` → 206 com os bytes em falta (007, NFR-021).
- [ ] URL usado depois de expirar → 403; repetir o pedido gera um URL novo e válido (002, 008).
- [ ] Cada emissão regista `correlationId`, utilizador e recurso; nem os logs do serviço nem o *access log* do nginx contêm a assinatura (009, T-10).
- [ ] Os dados do ficheiro não atravessam o API Gateway (NFR-014).

**ST-VID-007 / REQ-VID-INFO-001 a 009**

- [ ] Leitor, editor ou dono abre o painel "Informações" na galeria e no leitor (001).
- [ ] Duração `00:00:45.200` para 45 200 ms (002).
- [ ] Resolução `1920 × 1080 px`; vídeo codificado 1920×1080 com rotação 90° → `1080 × 1920 px` (003, Q-ADD-13).
- [ ] Formato `MOV (H.264 / AAC)`; sem áudio → `MP4 (H.264 / sem áudio)` (004).
- [ ] 157 286 400 bytes → `150.00 MB`; a partir de 1024³ bytes em GB (005).
- [ ] 30000/1001 → `29.97 fps` (006).
- [ ] Lido dos metadados persistidos, sem tarefa nem débito de quota (007).
- [ ] Proveniência e passos pela ordem; origem apagada → "Vídeo removido" (008).
- [ ] Metadado ausente → "Indisponível" e `METADATA_UNAVAILABLE` nos logs com o `correlationId` (009).
- [ ] Sem acesso ou anónimo → recusado sem expor metadados.

**Critérios do bolt**

- [ ] Nenhuma linha de código existente alterada (regra 2.6); o fluxo de imagem e as funcionalidades da B001 continuam a funcionar (regressão).
- [ ] Testes automatizados e relatório registados no Estágio 3; nenhum resultado presumido.
