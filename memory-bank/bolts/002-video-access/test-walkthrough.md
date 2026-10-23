---
stage: test
bolt: 002-video-access
created: 2026-10-22T14:51:15Z
---

## Test Report: 001-video-lifecycle (B002 — acesso a vídeos)

### Summary

- **Tests**: 168/168 passed. Novos da B002: 60/60 (28 unitários do serviço de projetos, 10 unitários do frontend, 18 E2E pela API e 4 no navegador). Regressão da B001: 108/108.
- **Coverage**: `projects/video/access.js` 100% das linhas (89,7% dos ramos); `projects/video/fileName.js` 100% das linhas (55,6% dos ramos; ficam por cobrir só os ramos de reserva para registos sem `original_name` nem extensão).

Todos os testes correram no stack em execução (Docker Compose, SeaweedFS 4.47, FFmpeg 5.1 no worker), com `projects`, `api_gateway` e `frontend` reconstruídos com `--no-deps`.

### Test Files

- [x] `projects/test/video/access.test.js` - Nome sugerido (original, operação isolada, cadeia e junção pela D-35, AVI, maiúsculas, acentos, pontos no nome, sem contentor); deteção de metadados em falta (`audio_codec` a `null` não conta); informações (campos, dimensões de apresentação, só o estado se não estiver concluído, `METADATA_UNAVAILABLE` com o `correlationId`, proveniência com origem removida, sem acesso ao storage); descarregamento (resposta e 15 min, nunca a cópia de pré-visualização, registo sem URL, 409 por estado, 404 `RESOURCE_UNAVAILABLE` com registo, URL novo em cada pedido); o módulo não depende de quota, tarefas, AMQP nem do serviço de utilizadores.
- [x] `frontend/test/video-access.test.mts` - Formatadores com os exemplos dos critérios da ERS: `00:00:45.200`, `1920 × 1080 px` / `1080 × 1920 px`, `MOV (H.264 / AAC)`, `MP4 (H.264 / sem áudio)`, `150.00 MB`, fronteira de 1 GB, `29.97 fps`.
- [x] `projects/test/video/e2e-access.test.js` - API pelo nginx: 401, 403 (sem acesso e anónimo), link de leitura permitido e revogado (410), 404; informações do MP4 com rotação de 90° (360 × 640), MOV a 30000/1001, MP4 sem áudio, AVI descrito pelo original e não pela cópia MP4; metadados em falta e registo; proveniência e passos; estado por concluir; descarregamento do AVI com hash igual, `.avi` e tipo armazenado; validade de 900 s na assinatura; expiração → 403 e URL novo; `Range` → 206 com os bytes certos; objeto em falta → 404 `RESOURCE_UNAVAILABLE`; quota inalterada e nenhuma tarefa; registos de emissão e ausência de assinaturas nos logs do serviço, do gateway e do nginx.
- [x] `projects/test/video/e2e-access-ui.test.js` - Chromium (Playwright 1.58): painel "Informações" no leitor com os valores formatados (AVI e MP4 com rotação); D-34: descarregamento com o nome `Férias São João.avi`, bytes iguais, sem navegar nem abrir separador; ações também na galeria da janela "Vídeos".

*Fixtures* geradas com a imagem do worker (`picturas-video_worker`): `ok.mp4` (640×360, H.264/AAC, 30 fps, 3 s, com a etiqueta de rotação de 90° aplicada por remux, porque o FFmpeg 5.1 descarta `rotate` ao codificar), `ok.mov` (30000/1001 fps), `ok.avi` (MPEG-4/MP3) e `noaudio.mp4`. A regressão da B001 usou as *fixtures* do Estágio 5 da B001.

Como correr:

```text
cd projects && node --test test/video/access.test.js
cd frontend && node --experimental-strip-types --test test/video-access.test.mts
cd projects && VIDEO_E2E_URL=https://localhost:8080 VIDEO_E2E_FIXTURES=<dir> \
  NODE_TLS_REJECT_UNAUTHORIZED=0 node --test test/video/e2e-access.test.js
cd projects && VIDEO_E2E_URL=https://localhost:8080 VIDEO_E2E_FIXTURES=<dir> \
  VIDEO_E2E_PLAYWRIGHT=<node_modules/playwright-core> \
  NODE_TLS_REJECT_UNAUTHORIZED=0 node --test test/video/e2e-access-ui.test.js
```

Regressão (B001), com os comandos de `bolts/001-video-lifecycle/ddd-03-test-report.md`: 40 unitários do serviço de projetos, 8 do frontend, 25 do worker, 24 E2E, 2 de transferências grandes (`VIDEO_E2E_LARGE=1`), 3 de projeto e 6 no navegador, todos a passar.

### Acceptance Criteria Validation

**ST-VID-006 — Descarregar vídeo**

- ✅ **AC1 — `{url, fileName, expiresAt}` com 15 min, formato armazenado, nunca a pré-visualização** (DOWNLOAD-001, 002, 006): E2E (AVI com hash igual, `video_src`, `Expires` = emissão + 900 s, link de leitura) e unitários.
- ✅ **AC2 — Recusas sem URL: sem acesso, anónimo, não `completed`, objeto em falta** (DOWNLOAD-001, 003): E2E 403, 410, 409 `RESOURCE_NOT_READY` e 404 `RESOURCE_UNAVAILABLE`, sempre sem `url`.
- ✅ **AC3 — URL portador: 403 depois de expirar; repetir gera URL novo** (DOWNLOAD-002, 008, Q-ADD-05): E2E com o mesmo gerador e validade de 2 s (os 15 min não se esperam; a validade de 900 s é verificada na assinatura) e dois pedidos seguidos com URLs e expirações diferentes.
- ✅ **AC4 — `Range` → 206; dados fora do API Gateway; sem quota** (DOWNLOAD-004, 007, NFR-014, NFR-021): E2E 206 com os bytes certos, URL em `/s3-video/`, transferência no *access log* do nginx e ausente dos logs do gateway, `remaining_operations` inalterado.
- ✅ **AC5 — Emissão registada com `correlationId`, utilizador e recurso, sem a assinatura** (DOWNLOAD-009, T-10): E2E nos logs do contentor `projects`; nenhuma assinatura nos logs do serviço, do gateway nem do nginx.
- ✅ **DOWNLOAD-005 — Nome sugerido**: unitários (`ferias_trim.mp4` e os casos da D-35) e navegador (`Férias São João.avi`, D-34).
- ⚠️ **DOWNLOAD-003 — "Descarregar" desativado com `RESOURCE_NOT_READY` na interface**: implementado no `video-actions.tsx`, mas não verificado por teste automático: na B002 as listas só mostram vídeos `completed` (D-17), pelo que o estado desativado não aparece na interface; a recusa no servidor (409) está verificada. Fica para verificar quando a B003+ mostrar resultados em processamento.

**ST-VID-007 — Consultar informações do vídeo**

- ✅ **AC1 — Duração, resolução de apresentação, formato, tamanho e fps dos metadados persistidos** (INFO-001 a 006): unitários dos formatadores com os exemplos da ERS, E2E dos valores da API e navegador com os valores formatados no painel (AVI e MP4 com rotação).
- ✅ **AC2 — Proveniência e passos; origem removida como "Vídeo removido"** (INFO-008): unitários e E2E com um registo resultante criado na base de dados (não há operações antes da B004).
- ✅ **AC3 — "Indisponível" e `METADATA_UNAVAILABLE` com o `correlationId`** (INFO-009): unitários e E2E (lista `unavailable` e linha de log com o `correlationId` e os atributos).
- ✅ **AC4 — Recusado sem expor metadados; sem tarefa nem quota** (INFO-007): E2E 401/403/410 sem `meta`, quota inalterada, nenhum `videotasks`; unitário confirma que o módulo não usa quota, AMQP nem o serviço de utilizadores.

**Critérios do bolt**

- ✅ **Nenhuma linha de código existente alterada (regra 2.6)**: `git diff` do código desde o início do bolt sem linhas removidas; nos ficheiros da B001 só linhas acrescentadas.
- ✅ **Fluxo de vídeo da B001 sem regressões**: 108/108.
- ✅ **Os dados do ficheiro passam pelo nginx e não pelo API Gateway; `Range` → 206**.

### Issues Found

- **Fixture sem rotação** (teste, não código): o FFmpeg 5.1 descarta `-metadata:s:v:0 rotate=90` ao codificar; a etiqueta passou a ser aplicada por remux (`-c copy`). Depois disso, a resolução de apresentação deu 360 × 640, como esperado.
- **Logs de erro lidos só do `stdout`** (teste, não código): o `video/log.js` escreve os erros no `stderr`; o auxiliar do E2E passou a ler os dois.
- **D-36 (respondida (a), mantém-se):** tamanhos a menos de 5 KB de 1 GB aparecem como `1024.00 MB` com a regra da INFO-005 aplicada à letra. Mantido por coerência com o `formatSize` da B001 e com a INFO-005.

### Notes

- **Dados de teste apagados:** os 23 utilizadores criados durante o bolt (`e2e-*`, `smoke-*` e anónimos, filtrados pela data do `ObjectId` a partir do início do bolt), os seus 21 projetos, 29 registos de vídeo, 19 presenças e 11 *buckets* com 135 objetos. Os dois vídeos que ficam na base de dados são anteriores ao bolt.
- **Verificação da D-29 no Estágio 1** (*bucket* temporário, já apagado): SigV2 com `response-content-disposition` → 403; SigV4 só funciona com `Host: seaweedfs:9000`; `Range` → 206; expirado → 403.
- A transição de abertura do diálogo aparece numa das capturas do navegador (`b002-info-avi`); os valores lidos pelo teste são os finais.
