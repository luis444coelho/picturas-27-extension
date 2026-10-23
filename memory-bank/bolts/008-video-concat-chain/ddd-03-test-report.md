---
stage: test
bolt: 008-video-concat-chain
created: 2026-10-23T01:33:38Z
status: checkpoint
---

# Relatório de testes — etapa 5 da B008

A equipa aprovou a etapa 4 (`1516513`) e autorizou esta etapa com o âmbito do pedido. O bolt continua `in-progress`, em `current_stage: test`; os testes manuais e a aprovação da equipa ficam pendentes. Não foi executado `bolt-complete.cjs` nem feito merge.

Pilha reconstruída com `docker compose up -d --no-deps --build projects api_gateway users ws_gateway video_worker frontend`; worker com FFmpeg/FFprobe 5.1.9 (Debian 12). A `test_reencode` ficou desligada nos serviços.

## Resultados executados

| Suite/verificação | Resultado real |
| --- | --- |
| JS do serviço de projetos (`node --test`, sem E2E), incluindo a regressão unitária B001–B007 | **282/282**; 19 novos (`composition.test.js`) |
| Python do worker com FFmpeg 5.1.9 real, incluindo a regressão B001–B007 | **80/80**; 8 novos (`test_composition.py`) |
| Funções do frontend (Node 26, *type stripping*) | **68/68**; 6 novos (`video-chain.test.mts`) |
| `video-convert.test.mts` (B007) e `video-chain.test.mts` com o Bun | **8/8** (o da B007 só corre com o Bun, como na B007) |
| `tsc --noEmit` no contentor do frontend; ESLint e Prettier nos ficheiros novos | **Passaram** |
| Integração real B008 (`e2e-composition.test.js`: nginx → gateway → projetos e utilizadores → RabbitMQ → worker → storage; eventos WebSocket pela fila) | **9/9**, incluindo o *teardown* |
| Integração B007 (conversão) | **3/3** |
| Integração B005 (edições visuais, com o fluxo de imagem) | **16/16** |
| Integração B004 (edições básicas, com o fluxo de imagem) | **14/15**: a única falha é a conhecida em ARM no Brilho de imagem (espera 127, recebe 126); a B005 confirma o fluxo de imagem |
| Resultados publicados, no host: FFprobe, `ffmpeg -xerror` e VLC (`-I dummy`) | **10/10** ficheiros (7 resultados e 3 cópias MP4) descodificados por inteiro e reproduzidos |
| Invocações do FFmpeg por tarefa (`video.task.ffmpeg` nos logs do worker) | **1** em cada uma das 7 tarefas concluídas (NFR-013) |

Cobertura percentual não medida; os critérios foram exercitados por testes unitários e pela pilha real.

## Ficheiros de teste

- [x] `projects/test/video/composition.test.js`:
  - estrutura (cada regra da D-79, a D-85 e os 11 passos);
  - `concat` (10/50 clips com repetições, custo);
  - estimativas (primeiro clip à saída da sub-cadeia, dimensões ímpares, rotação, áudio de qualquer clip);
  - endereços dos erros (D-80) e limites (D-81);
  - `_clips` e `_mark` gravados pelo servidor, e submissão com uma entrada por ocorrência;
  - **ordem das fases sem junção** (pedido do checkpoint do Estágio 2);
  - estrutura das predefinições e extras do plano;
  - no `tasks.js`, `totalSteps = N` e `error.phase`.
- [x] `Tools/video/tests/test_composition.py`, com o FFmpeg 5.1 real:
  - junção heterogénea com clip repetido, e junção sem áudio em nenhum clip;
  - sub-cadeias e passos finais;
  - cadeia genérica com recorte, marca e filtro;
  - cadeias terminadas em MOV e AVI, e junção terminada em AVI;
  - a fase da falha em todos os caminhos.
- [x] `Tools/video/tests/generate_composition_fixtures.py` e `projects/test/video/e2e-composition.test.js`: integração real.
- [x] `frontend/test/video-chain.test.mts`.
- [x] `projects/test/video/README-b008.md`: como correr tudo.
- [x] `projects/test/video/task-domain.test.js` (+1) e `Tools/video/tests/test_task.py` (+2): linhas novas que isolam a `concat` nas asserções da D-37, como fizeram as B004, B005 e B007.

## Cobertura do pedido da equipa

| Pedido | Onde e resultado |
| --- | --- |
| Junção heterogénea (16:9 e 9:16, 25 e 30 fps, com e sem áudio, rotação, dimensão ímpar no primeiro clip) e clip repetido | **Worker:**<br>- 320×240 a 25 fps, AAC estéreo a 48 kHz, 11 s ±0,15;<br>- barras laterais no 9:16 e no vídeo rodado (média da coluna < 24 e centro > 24);<br>- silêncio no clip sem áudio (< −80 dB) e som nos outros;<br>- 4 descarregamentos para 5 ocorrências, com 5 entradas `-i`.<br>**E2E:**<br>- estimativa de 320×240 a 25 fps;<br>- `source_video_ids` com repetições, `plan.inputs` distintos e `clips[].file = [0,1,2,3,0]`;<br>- reproduz no VLC |
| Junção com sub-cadeias (recorte, velocidade, filtro, marca de água num clip) e passos finais | Worker e E2E:<br>- 360×640 depois da rotação final, 5 s;<br>- custo e `totalSteps` 7, com o `_mark` do servidor no clip;<br>- `trim`, `colorchannelmixer`, `setpts=PTS/2`, `overlay` e `transpose` no mesmo grafo;<br>- uma invocação, e reproduz no VLC |
| Cadeia sem junção com recorte + marca + filtro (caminho genérico com *keyframe* e `visual_input`) | Worker e E2E:<br>- `videoMode: encode`, com a marca descarregada;<br>- 1,5 s, uma invocação;<br>- `kind: chain` e custo 3 |
| Cadeias terminadas em `convert` para MP4, MOV (genérico) e AVI (`composition_task`, com a cópia MP4 na mesma invocação) | - **MOV:** H.264/AAC, com a cópia MP4 feita depois e sem `plan.convert`.<br>- **AVI:** MPEG-4/MP3 e a cópia H.264/AAC na **mesma** invocação (`split`/`asplit`), com `previewMade`. A junção terminada em AVI também passa.<br>- **MP4:** recusada com `INVALID_STEP_PARAMS`/`SAME_FORMAT`, porque todas as operações já produzem MP4 (DQ-013) e a conversão da B007 recusa o mesmo formato. |
| Regras do `INVALID_CHAIN` (D-79, D-85), `CHAIN_TOO_LONG` com 11 passos, ordem das fases (D-80, incluindo sem junção com parâmetros inválidos) e `LIMIT_EXCEEDED` (D-81) | Unitários e E2E, na validação e na aceitação, sem tarefa e sem débito:<br>- **Regras:** `empty_chain`; `convert_not_last` (topo e clip); `multiple_concat` (segunda junção e junção num clip); `frame_extraction`; `concat_not_first` (nas duas rotas); `concat_in_preset`.<br>- **Contagem e entradas:** `CHAIN_TOO_LONG {total: 11, limit: 10}` no topo e dentro de um clip; `INSUFFICIENT_INPUTS`; `TOO_MANY_INPUTS {limit: 10}`; `NOT_FOUND {videoId, clipIndex}`.<br>- **Ordem das fases:** a estrutura vem antes dos passos. Sem junção, um vídeo de 90 s a 0.1× dá `INVALID_STEP_PARAMS` (e não `LIMIT_EXCEEDED`); a 0.25× dá `LIMIT_EXCEEDED {total: 360000, limit: 300000}`.<br>- **Limites:** a soma da junção com repetições e um passo final acima do limite são recusados; as saídas intermédias não são limitadas. |
| Custo N, cancelamento com devolução, "passo k de N" e `error.phase` em falhas simuladas de descarregamento, codificação e envio | **E2E (conta Registada):**<br>- uma cadeia de 2 passos debita 2;<br>- uma junção de 3 passos reserva 3; cancelada depois de progresso positivo, devolve os 3 (`refund.state: done`) e não deixa resultado nem objetos;<br>- os eventos levam `totalSteps` 3 e `step` entre 1 e 3.<br>**Fase (E2E):** com o original apagado, `RESOURCE_UNAVAILABLE`/`download`; com o original corrompido, `PROCESSING_ERROR`/`encode`. Em ambos os casos a fase aparece no GET, na resposta do worker e no evento WebSocket.<br>**Fase (worker):** falhas de descarregamento, codificação e envio, marca em falta, e envio no caminho da B007. |
| Predefinições: criar, PATCH, apagar, nome repetido, `anonymous`, marca de imagem noutro projeto | E2E:<br>- criar dá 201, sem os campos do servidor; `PATCH` muda o nome e os passos;<br>- nome repetido dá `PRESET_NAME_TAKEN` (409), sem distinguir maiúsculas nem espaços;<br>- `concat_in_preset` dá 422; uma operação desconhecida dá `INVALID_STEP_PARAMS`;<br>- `anonymous` dá 403 `FORBIDDEN`; outro utilizador, 403; sem JWT, 401;<br>- o GET das predefinições de imagem não mostra as de vídeo;<br>- `DELETE` dá 204 e depois 404;<br>- uma marca de imagem é válida no projeto de origem e dá `INVALID_WATERMARK_CONTENT` noutro projeto (D-84) |
| Nomes dos resultados (D-35, D-75) | - Junção: `odd.mp4`; descarregamento `odd_concat.mp4`.<br>- Composição: descarregamento `wide_concat_orient_adjust.mp4`.<br>- Cadeia: `wide.mp4`; descarregamento `wide_trim_watermark_filter.mp4`.<br>- MOV: `wide.mov`; descarregamento `wide_adjust_convert.mov`.<br>- AVI: `wide.avi`; descarregamento `wide_adjust_convert.avi`.<br>- Junção → AVI: descarregamento `wide_concat_convert.avi`. |

## Defeitos encontrados e corrigidos nesta etapa

1. **Cadeia vazia com `:video`:** chegava à B003, que respondia `INVALID_REQUEST`, mas a CHAIN-007 e a D-79 pedem `INVALID_CHAIN {rule: "empty_chain"}`. Corrigido no router de composição, que agora faz a fase 1 a qualquer lista de passos.
2. **`concat_not_first` inalcançável:** a verificação da rota (D-78) respondia `INVALID_REQUEST` antes da estrutura. Pela ordem da D-80 a estrutura vem primeiro: `[passo, junção]` dá agora `INVALID_CHAIN {rule: "concat_not_first", index: 1}` nas duas rotas. Uma cadeia sem junção na rota sem `:video` continua a dar `INVALID_REQUEST {field: "steps"}`.

As duas correções são código novo da B008 (`videoComposition.js` e uma função nova em `composition.js`), sem linhas removidas face à `origin/main`.

## Limites e riscos

- **Conversão para MP4 no fim de uma cadeia:** nunca é possível, porque todos os passos já produzem MP4 (DQ-013, `SAME_FORMAT` da B007). É o comportamento que as fontes dão; o editor mostra a mensagem da conversão.
- **Limite de duração da saída de um clip (fase 3):** fica sempre coberto antes pela soma da junção, que inclui o clip. Só é exercitado nos testes unitários, como verificação defensiva.
- **Falha no envio:** simulada só no worker (`test_composition.py`); na pilha, o envio para o SeaweedFS não foi forçado a falhar.
- **D-74 continua:** o contador de operações da sessão não se atualiza depois de uma tarefa de vídeo; o servidor debita e devolve corretamente, o que se verificou aqui com N créditos.
- **Memória numa junção de 50 clips (ADD 4.8):** não medida; as junções testadas têm até 5 clips.
- **Testes manuais no browser:** pendentes, em `manual-test-checklist.md`.

## Auditoria de alterações

O `git diff --numstat origin/main...HEAD -- . ':!memory-bank' ':!docs'` corre depois do commit desta etapa e é apresentado no checkpoint; o critério é 0 linhas removidas no código. Os 20 ficheiros de texto com CRLF do repositório continuam inteiramente CRLF e não foram tocados.
