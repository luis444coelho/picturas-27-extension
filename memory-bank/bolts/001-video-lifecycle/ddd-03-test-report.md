---
unit: 001-video-lifecycle
bolt: 001-video-lifecycle
stage: test
status: complete
updated: 2026-10-22T10:25:00Z
---

# Test Report - Ciclo de vida do vídeo (ingestão e visualização)

Ambiente: a pilha Docker Compose da equipa a correr localmente (nginx em `https://localhost:8080`, com o SeaweedFS exposto na porta 9091 por um `docker-compose.override.yml` local, sem efeito nos testes). Worker em `python:3.11-slim-bookworm` com **FFmpeg 5.1.9** (D-25). Todos os resultados abaixo vêm de execuções reais; nenhum é presumido.

## Test Summary

| Category | Passed | Failed | Skipped | Coverage |
|----------|--------|--------|---------|----------|
| Unit: serviço de projetos (`node:test`) | 40 | 0 | 0 | domínio e aplicação: `formats`, `profiles` e `display` 100 %; `ingest` 97,6 % (linhas) |
| Unit: worker, com FFmpeg 5.1 real (`unittest`) | 25 | 0 | 0 | `ingest.py` 93 %, `video_msg.py` 94 %, `config.py` 100 % |
| Integration / E2E pela pilha real (`e2e.test.js`) | 24 | 0 | 0 | não medida (atravessa gateway, projetos, storage, RabbitMQ, worker, wsGateway e nginx) |
| Transferências grandes (`e2e-large.test.js`) | 2 | 0 | 0 | — |
| Security (dentro das E2E, mais verificações de logs) | 10 | 0 | 0 | — (1 risco residual, D-27) |
| Performance (medições, sem carga) | 4 | 0 | 0 | — |
| Unit: frontend, fluxo da D-30 (`node:test` com *type stripping*) | 8 | 0 | 0 | `lib/video-project.ts` (todos os ramos) |
| E2E da D-30 pela API (`e2e-project.test.js`) | 3 | 0 | 0 | — |
| E2E no navegador, D-30 e D-31 (`e2e-ui.test.js`, Playwright/Chromium) | 6 | 0 | 0 | — |
| **Total** | **108** + 13 verificações | **0** | **0** | ver "Coverage Report" |

Como correr:

```bash
# unitários do serviço de projetos
cd projects && node --test --experimental-test-coverage test/video/domain.test.js test/video/ingest.test.js
# unitários do worker (dentro da imagem, com o FFmpeg real)
docker run --rm -v "$PWD/Tools/video:/src:ro" -v "$PWD/Tools/utils:/utils:ro" -w /src \
  -e PYTHONPATH=/src:/ picturas-video_worker python -m unittest tests/test_ingest.py
# E2E (pilha a correr; vídeos de referência gerados com a imagem do worker)
cd projects && VIDEO_E2E_URL=https://localhost:8080 VIDEO_E2E_FIXTURES=<pasta> \
  NODE_TLS_REJECT_UNAUTHORIZED=0 node --test test/video/e2e.test.js
cd projects && VIDEO_E2E_URL=https://localhost:8080 VIDEO_E2E_LARGE=1 \
  NODE_TLS_REJECT_UNAUTHORIZED=0 node --test test/video/e2e-large.test.js
# D-30 e D-31 (adenda): unitários do frontend, E2E pela API e no navegador
cd frontend && node --experimental-strip-types --test test/video-project.test.mts
cd projects && VIDEO_E2E_URL=https://localhost:8080 VIDEO_E2E_FIXTURES=<pasta> \
  NODE_TLS_REJECT_UNAUTHORIZED=0 node --test test/video/e2e-project.test.js
cd projects && VIDEO_E2E_URL=https://localhost:8080 VIDEO_E2E_FIXTURES=<pasta> \
  VIDEO_E2E_PLAYWRIGHT=<node_modules/playwright-core> \
  NODE_TLS_REJECT_UNAUTHORIZED=0 node --test test/video/e2e-ui.test.js
```

O `e2e-ui.test.js` precisa do `playwright-core` (1.58) e do seu Chromium, instalados fora do repositório; o frontend tem de estar reconstruído (`docker compose build frontend && docker compose up -d --no-deps frontend`), porque o contentor serve uma *build* de produção.

Os vídeos de referência (MP4 com etiqueta de rotação, MOV, AVI MPEG-4/MP3, MP4 High 10, MP4 de 0,5 s, HEVC, só áudio, MP4 truncado, 5:10 min, PNG) são gerados pelo FFmpeg da imagem do worker; os comandos estão em `projects/test/video/e2e.test.js` (cabeçalho) e no histórico do Estágio 5.

## Acceptance Criteria Validation

| Story | Criteria | Status |
|-------|----------|--------|
| ST-VID-000 | **AC1:** com JWT e edição, MP4/MOV/AVI dentro dos limites ficam em `videos` e em `video_src`, com metadados, rotação e dimensões de apresentação | ✅ E2E: MP4 320×240 com rotação 90 → `display` 240×320, `fps` 25/1, duração, tamanho, bitrate, codecs; MOV e AVI `completed` |
| ST-VID-000 | **AC2:** miniatura a 00:00:01 (fotograma 0 abaixo de 1 s); fotograma 0 rodado, ≤ 1280 px | ✅ worker: rotação aplicada (240×320), limites 320/1280 px, vídeo de 0,5 s e de 1,0 s (D-26); E2E: objetos em `video_thumb` |
| ST-VID-000 | **AC3:** cópia MP4 `yuv420p` para MOV, AVI e MP4 H.264 incompatível | ✅ E2E: MOV (remux), AVI (recodificado), High 10 (recodificado), todos `h264`/`yuv420p`; MP4 compatível sem cópia |
| ST-VID-000 | **AC4:** limites, formato, codec, corrupção, falha ou cancelamento → rejeitado, sem objeto nem registo | ✅ E2E: `UNSUPPORTED_FORMAT`, `LIMIT_EXCEEDED` (tamanho e duração), `INVALID_CODEC` (HEVC e só áudio, D-24), `CORRUPTED_FILE` (truncado e 150 MB de ruído), cancelamento, envio parcial e confirmação sem ficheiro (`UPLOAD_ABORTED`), sempre com o registo e os objetos verificados como apagados |
| ST-VID-000 | **AC5:** 401 sem JWT; 403 `anonymous`; leitura vs edição com o `videoAuth` | ✅ E2E: 401 nas 5 rotas (sem token e com token inválido), 403 utilizador ≠ caminho, 403 `anonymous`, leitura por partilha lista mas não carrega, 410 em link revogado |
| ST-VID-000 | **AC6:** reproduzir no leitor integrado; carregamento e reprodução não debitam quota | ✅ API: URL de reprodução por `/s3-video/` (200 e `Range` 206), a cópia MP4 quando existe; `remaining_operations` igual antes e depois. Navegador (adenda): o leitor abre a partir da lista do projeto, com `controls`, e carrega o vídeo (`readyState` ≥ 1) |
| ST-VID-000 | **AC7 (D-30):** "Novo projeto com vídeo" cria o projeto sem imagens, carrega o vídeo e abre o projeto; com falha ou cancelamento, o projeto fica vazio | ✅ Unit (8): ordem dos passos, erro ao criar o projeto, recusa do pedido, cancelamento antes e durante a transferência, falha de rede, confirmação recusada. API (3): projeto vazio recebe o MOV; cancelamento e vídeo rejeitado deixam o projeto vazio e utilizável. Navegador: MOV → projeto aberto com o vídeo; cancelamento aos ~5 % (rede limitada) → projeto vazio e sem registo em `videos`; HEVC → aviso de codecs depois de o projeto abrir; MKV bloqueado sem criar projeto |
| ST-VID-000 | **D-31:** vídeos concluídos na área principal, junto às imagens, com miniatura, nome, duração e ícone; clique abre o leitor; atualização pelo `video-ingest-update` | ✅ Navegador: coluna "Vídeos" ao lado das imagens com miniatura carregada, ícone e `m:ss`; vídeo carregado por fora com a página aberta aparece sem recarregar (< 30 s; sem o evento só ao fim de 10 min); a janela "Vídeos" continua a carregar e o vídeo aparece na coluna |

| Critério de passagem do bolt | Estado |
|---|---|
| Story implementada e critérios cumpridos | ✅ (AC1 a AC7 e D-31) |
| Critérios dos requisitos rastreados verificados por testes | ✅ AUTH-001/002/003, UPLOAD-003/004/005/006/007/008/009/010/011/012/013/014/016/017/019/020, STORAGE-001/003, NFR-001/003/008/010/011/017 |
| Nenhuma linha de código existente alterada | ✅ `git diff main`: 0 linhas removidas ou alteradas em ficheiros existentes |
| Testes automatizados e relatório registados | ✅ este relatório |
| Código revisto | ⏳ falta a revisão humana |
| Vídeo válido `completed` com metadados, miniatura, fotograma 0, cópia; sem quota | ✅ |
| Falha ou cancelamento sem objeto nem registo | ✅ |
| 401/403; worker arranca com `docker compose up` | ✅ |
| Só filas de vídeo e `amqp.js`; ferramentas de imagem intactas (NFR-011) | ✅ filas com os argumentos certos (`rabbitmqctl`); `Tools/utils` sem alterações |

Não verificados nesta bolt, por serem de outras: UPLOAD-002 (arrastar) só por revisão, porque o teste no navegador usa o seletor de ficheiros; UPLOAD-001/015/018/021 verificados no navegador na adenda; UPLOAD-015 (controlos do leitor) depende do `<video controls>` nativo; STORAGE-002/004 (proveniência e receita, B003+); STORAGE-005 (rotina da Q-ADD-14, B003).

## Unit Tests

- **Serviço de projetos (40):**
  - matriz de formatos (extensão/MIME, MP4 vs MOV pela *brand*, codecs por contentor, ausência de stream de vídeo);
  - plano da cópia (6 casos);
  - limites base 1024 inclusivos;
  - dimensões de apresentação;
  - instante da miniatura;
  - orquestrador com portas falsas: emissão do URL, *bucket* do dono, `anonymous`, limites, pedido inválido, *rollback* quando o URL falha, confirmação (dono, estado, objeto em falta, envio parcial, limite real, falha da publicação), cancelamento, respostas `probe`/`derive` (metadados, plano, MOV, High 10, 4 rejeições, Premium 59 min, corrompido, integridade I2, objetos parciais), idempotência, *dead-letter* com e sem `x-death`, limpeza interrompida.
- **Worker (25):**
  - `parse_probe`: rotação pela matriz e pela etiqueta, profundidade e *chroma*, capa ignorada, sem vídeo, sem áudio, sem duração;
  - argumentos da cópia;
  - corpo do PUT com `Content-Length` e sem *chunked*;
  - redação de assinaturas;
  - mensagens;
  - 11 testes com FFmpeg real: *probe* de MP4, MOV, AVI e High 10, rotação, só áudio, truncado e lixo → `CORRUPTED_FILE`, miniatura e fotograma 0 rodados e limitados, vídeo de 1 s e de 0,5 s, cópia por remux e recodificada.

## Integration Tests

24 testes E2E pelo nginx, contra a pilha real, com verificação direta no MongoDB (`videos`) e no storage (`HEAD` interno):

1. **Autenticação e autorização:** 401, 403 (outro utilizador, `anonymous`), 404, partilha de leitura e de edição, 410 em link revogado.
2. **Validação do pedido:** `UNSUPPORTED_FORMAT`, `LIMIT_EXCEEDED` (Registado vs Premium), `INVALID_REQUEST`.
3. **Fluxo principal:** MP4 com rotação, reprodução com `Range`, MOV, AVI, High 10, vídeo de 0,5 s.
4. **Rejeições sem resíduos:** HEVC, só áudio, truncado, 5:10 min (Registado); o mesmo 5:10 min é aceite a um Premium.
5. **Ciclo do carregamento:** cancelamento, confirmação sem ficheiro e com envio parcial, PUT com `Content-Type` diferente do assinado (403), registos `queued` invisíveis na galeria, `RESOURCE_NOT_READY` e `INVALID_STATE`.
6. **Regressão do fluxo de imagem:** carregamento de uma imagem e listagem pelas rotas existentes, que passam pelo router de vídeo; as rotas antigas mantêm os seus códigos (401 do `auth.checkToken`).

Mais 2 testes de transferências grandes: 150 MB por `/s3-video/` em *streaming*, seguidos de `CORRUPTED_FILE` e purga; 413 acima de 2 GB.

## Security Tests

| Verificação | Resultado |
|---|---|
| 401 sem JWT e com JWT inválido em todas as rotas de vídeo | ✅ |
| 403 utilizador do token ≠ `:user`; 403 `anonymous` | ✅ |
| Leitura partilhada não carrega; convidado com edição não confirma o carregamento de outro | ✅ |
| Link de partilha revogado → 410 `SHARE_LINK_REVOKED` | ✅ |
| PUT com `Content-Type` diferente do assinado → 403 do storage | ✅ |
| Respostas de erro com `correlationId` e sem detalhes técnicos | ✅ |
| *Access log* do `/s3-video/` sem *query string* (45 linhas analisadas) | ✅ |
| Logs do worker e do serviço de projetos sem URLs assinados | ✅ depois da correção (ver "Issues Found", 4) |
| Rotas internas `/video/*` do storage recusam segmentos com `..` ou `/` | ✅ pela validação `SAFE_SEGMENT`, revista no código; não é exposta pelo nginx |
| Eventos WS só com identificadores, estado e código | ✅ (E2E compara o evento completo) |
| *Error log* do nginx com a assinatura em pedidos recusados | ⚠️ risco residual (D-27) |

## Performance Tests

Medições locais (Apple Silicon, Docker Desktop), sem testes de carga:

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| `POST …/uploads` (gateway → projetos → users → storage) | ≤ 1 s (referência NFR-005) | 16–21 ms | ✅ |
| `POST …/upload/complete` (`headObject`, publicação) | ≤ 1 s | 15–36 ms | ✅ |
| Ingestão de um clip de 2 s (confirmação → evento final), com cópia recodificada | — | 190–320 ms | ✅ |
| PUT de 150 MB pelo nginx `/s3-video/` | *streaming* sem *buffer* | 1,0 s (≈150 MB/s) | ✅ |

## Coverage Report

| Camada | Medição | Valor |
|---|---|---|
| Domínio (`formats`, `profiles`, `display`) | unitários Node | 100 % linhas |
| Aplicação (`ingest.js`) | unitários Node | 97,6 % linhas, 88,7 % ramos |
| Worker (`ingest.py`, `video_msg.py`, `config.py`) | unitários Python | 93–100 % |
| Adaptadores (`routes/videos.js`, `amqp.js`, `storage.js`/`.py`, `video.py`, `video_rabbit.py`, gateway, `route/video.js`, `wsGateway/video.js`) | só E2E, sem medição | não medida |
| Frontend (`components/video`, `lib/videos.ts`) | sem infraestrutura de testes no projeto | `tsc` 0 erros, ESLint 0 problemas |

O critério do *template* ("cobertura > 80 %") cumpre-se no domínio e na aplicação, mas **não** no total do código novo, porque os adaptadores só são exercidos pelas E2E. Não há medição de cobertura nas E2E.

## Issues Found

Defeitos encontrados no Estágio 5, todos corrigidos e cobertos por testes:

| Issue | Severity | Status |
|-------|----------|--------|
| 1. O PUT do worker ao SeaweedFS falhava (500): o `requests` com um gerador envia `Transfer-Encoding: chunked` mesmo com `Content-Length`. Passou a enviar um corpo com `__len__` (`_PumpingFile`) | High | Fixed |
| 2. URLs públicos com `ResponseContentType` → 403 do SeaweedFS 4.47. O parâmetro deixou de ser enviado; os objetos já levam o `Content-Type` certo. Impacto previsto na B002 (D-29) | High | Fixed (B001) / aberto para a B002 |
| 3. Miniatura não produzida num vídeo de 1,0 s (sem fotograma em 00:00:01). O worker recorre ao fotograma 0 (D-26) | Medium | Fixed (a confirmar em D-26) |
| 4. URLs assinados internos nos logs do worker e do serviço de projetos (mensagem de `HTTPError`). Passaram a ser redigidos antes de log e resposta | Medium (segurança) | Fixed |
| 5. A etiqueta `python:3.11-slim` passou a Debian 13 / FFmpeg 7.1. Fixada em `bookworm`, como diz a secção 6 do ADD (D-25) | Medium | Fixed (a confirmar em D-25) |

Problemas abertos:

| Issue | Severity | Status |
|-------|----------|--------|
| 6. *Error log* do nginx regista a assinatura em pedidos recusados no `/s3-video/` (D-27) | Low | Open |
| 7. O consumidor do `video_ws_queue` usa o `utils/rabbit_mq.js` existente, sem religação. Num reinício do RabbitMQ, os eventos param até reiniciar o `ws_gateway`, como já acontece ao `ws_queue` e ao `project_queue` (D-28) | Medium | Open |
| 8. UI (carregamento, galeria, leitor) sem teste no navegador | Medium | Resolvido na adenda: `e2e-ui.test.js` (6 testes) |
| 9. Os testes E2E deixam utilizadores, projetos e vídeos de teste (`e2e-*@test.local`) na base de dados e no storage locais | Low | Open: limpeza manual, se desejada |
| 10. Fora da B001 (código existente): `POST /users/:email/login` responde 701 para utilizadores acabados de criar com `POST /users`; o teste no navegador regista-se pela página `/register`, que não usa o *login*. Causa não investigada (regra 2.6) | Medium | Open: para a equipa |

Incidente durante os testes: um `docker compose up -d --build video_worker` recriou também o `rabbitmq`. Os consumidores Node sem religação (`project_queue`, `ws_queue`, `video_ws_queue`) ficaram sem ligação, e o nginx ficou com o IP antigo do `ws_gateway`. Repus o estado com `docker compose restart projects ws_gateway` e `nginx -s reload`. As reconstruções seguintes usaram `--no-deps`.

## Adenda: D-30 e D-31 (2026-10-22)

Pedido da equipa depois do checkpoint do Estágio 5: criar um projeto a partir de um vídeo (D-30, REQ-VID-UPLOAD-021, UC-VID-000 FA6) e mostrar os vídeos concluídos na área principal do projeto (D-31). Os pormenores de interface que as fontes não fixam ficaram na D-32 (pendente, com implementação provisória).

Ficheiros novos: `frontend/lib/video-project.ts` (fluxo, com os passos injetados para ser testável), `frontend/components/video/new-video-project-dialog.tsx`, `frontend/components/video/project-video-list.tsx`, `frontend/test/video-project.test.mts`, `projects/test/video/e2e-project.test.js` e `projects/test/video/e2e-ui.test.js`. Linhas acrescentadas: 2 na `dashboard-sidebar.tsx` e 2 em `app/dashboard/[pid]/page.tsx`. O `new-project-dialog.tsx` e o `ProjectImageList` não mudaram. Sem alterações no backend: a rota `POST /projects/:user` já aceita `imgs` vazio.

Defeito encontrado no navegador e corrigido: o `react-dropzone` descarta os ficheiros fora do `accept` antes do `onDrop`, por isso um MKV era ignorado sem mensagem (Exceção 1 do UC-VID-000 pede o aviso). Afetava a janela "Vídeos" da B001 e o novo diálogo; os dois passaram a usar `onDropRejected` com `UNSUPPORTED_FORMAT` (Medium, Fixed).

Regressão depois da adenda: unitários do serviço de projetos 40/40, E2E 24/24 e frontend `tsc` e ESLint sem erros (o único aviso, em `page.tsx:420`, é de código existente). Regra 2.6: `git diff f9c316a` não remove nem altera nenhuma linha de código existente; as linhas alteradas são só de documentação e do memory-bank (contagens e rastreabilidade da D-30).

## Ready for Operations

- [x] All acceptance criteria met (API, backend e navegador, incluindo D-30 e D-31)
- [ ] Code coverage > 80% (cumprido no domínio e na aplicação; os adaptadores não são medidos)
- [x] No critical/high severity issues open (as 2 *High* foram corrigidas)
- [ ] D-25 a D-29 e D-32 respondidos pela equipa
