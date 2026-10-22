---
stage: implement
bolt: 005-video-visual-edits
created: 2026-10-22T20:40:42Z
---

## Implementation Walkthrough: 002-video-transformations

### Summary

Foram acrescentadas as operações `watermark`, `adjust`, `filter`, `resize` e `orient` ao registo do serviço de projetos e ao worker, como cadeias de um passo do executor da B003, e o endpoint de pré-visualização estática com o sharp (T-07). Também se acrescentaram as miniaturas dos filtros (4.4), o carregamento e a pré-visualização da marca de água (D-60, D-62) e cinco painéis de frontend ao lado dos da B004. Todo o código existente fica como estava: os sete ficheiros existentes tocados só recebem linhas novas (0 removidas face à `main`).

### Structure Overview

O serviço de projetos valida cada operação com o `validate` síncrono do registo. As dimensões da marca chegam-lhe através de um *middleware* novo, que corre antes do router da B001 (ADR-010). Depois do `buildPlan()` e do `applyPlanExtras()` da B004, um módulo novo acrescenta ao plano a entrada do filtro e a origem e geometria da marca (ADR-011). O worker copia esses dados para os parâmetros locais dos módulos e compõe a marca no mesmo grafo único (`movie` + `overlay`), por isso continua a haver uma só recodificação. As pré-visualizações são síncronas, com o sharp, sobre o fotograma 0 em cache, com uma operação por passagem. No gateway, um router novo trata as respostas binárias e o carregamento em bruto. No frontend, um componente irmão do da B004 monta os cinco painéis, reutilizando a sessão de tarefa, a validação e o estado da B003/B004.

### Completed Work

**Serviço de projetos (novos):**
- [x] `projects/video/filters.json` - catálogo dos seis filtros (D-58), matrizes 3×3 ou inversão.
- [x] `projects/video/operations/adjust.js` - ajuste: [0, 2], passo 0.05 com tolerância, `INVALID_ADJUST_PARAMS` com o campo e `NO_CHANGES` com os três neutros.
- [x] `projects/video/operations/filter.js` - filtro do catálogo, ou `INVALID_FILTER`.
- [x] `projects/video/operations/resize.js` - dimensões de apresentação pares, ≥ 128, dentro do teto do perfil, `INVALID_RESIZE_PARAMS` com `limit` e `NO_CHANGES`. O resultado sai com rotação 0.
- [x] `projects/video/operations/orient.js` - rotação 0, 90, 180 ou 270 e espelhos, `NO_CHANGES` na identidade (Q-ADD-24) e troca de dimensões.
- [x] `projects/video/operations/watermark.js` - tipo, conteúdo, escala, opacidade, posição e limites (D-61), com os códigos `INVALID_WATERMARK_CONTENT`, `INVALID_WATERMARK_PARAMS` e `WATERMARK_OUT_OF_BOUNDS`.
- [x] `projects/video/operations/visualSteps.js` - grelha de passos decimais com tolerância, partilhada pelas operações e pela pré-visualização.
- [x] `projects/video/watermarkGeometry.js` - caixa da marca (largura igual à escala vezes a largura do quadro, margem de 3% nas posições predefinidas) e verificação dos limites (RN3).
- [x] `projects/video/planExtrasVisual.js` - extras do plano para `filter` e `watermark` (ADR-011).
- [x] `projects/video/watermarks.js` - geração do texto com o sharp (D-59), resolução do `_mark`, carregamento e normalização de imagens (D-60).
- [x] `projects/video/watermarkCleanup.js` - limpeza das marcas de projetos apagados ou sem referência em `VideoTask` nem em `recipe` ao fim de 24 h (D-60, com a alteração da equipa).
- [x] `projects/video/preview.js` - pré-visualização do T-07, miniaturas e composição da marca.
- [x] `projects/video/frameCache.js` - cache LRU de 100 entradas e 10 min (D-64).
- [x] `projects/video/visualStorage.js` - leitura e escrita internas de objetos pequenos nos estágios de vídeo.
- [x] `projects/video/rawBody.js` - leitura do corpo em bruto com limite (ver "Deviations").
- [x] `projects/models/videoWatermark.js` - coleção `video_watermarks`.
- [x] `projects/routes/videoVisual.js` - *middleware* do `_mark` (ADR-010) e as rotas `…/:video/preview`, `…/:video/filters/thumbnails`, `…/:video/watermark-preview` e `…/watermarks`.

**Serviço de projetos (só linhas acrescentadas):**
- [x] `projects/video/operations/index.js` - cinco linhas de registo.
- [x] `projects/video/tasks.js` - um `require` e uma chamada a seguir ao `applyPlanExtras`.
- [x] `projects/app.js` - `require` e montagem do router novo antes do router de vídeo, e arranque da limpeza.

**API Gateway:**
- [x] `apiGateway/routes/videoVisual.js` - reencaminhamento das quatro rotas novas, com respostas binárias e o corpo de imagem em bruto até 1 MB.
- [x] `apiGateway/routes/videoRawBody.js` - a mesma leitura em bruto, neste serviço.
- [x] `apiGateway/app.js` - duas linhas: `require` e montagem depois do router de vídeo.

**Worker (novos e só linhas acrescentadas):**
- [x] `Tools/video/ops/adjust.py`, `filter.py`, `resize.py`, `orient.py`, `watermark.py` e `visual_steps.py` - tradução dos parâmetros em filtros FFmpeg (T-02).
- [x] `Tools/video/visual_input.py` - ponte dos extras do plano para os parâmetros dos módulos, numa cópia (ADR-011).
- [x] `Tools/video/ops/__init__.py` - seis linhas: um *import* e cinco registos.
- [x] `Tools/video/task.py` - quatro linhas: um *import*, duas de chamada e uma linha em branco.

**Frontend (novos e uma montagem):**
- [x] `frontend/lib/video-visual.ts` - passos, regras de proporção e predefinições (D-64), chamadas à API e mensagens.
- [x] `frontend/components/video/use-video-preview.ts` - pré-visualização com *debounce* e libertação do URL.
- [x] `frontend/components/video/video-preview-image.tsx` e `video-visual-validation.tsx` - imagem com as dimensões finais e erros por campo.
- [x] `frontend/components/video/video-adjust-panel.tsx` - três `Slider` com passo 0.05 e "Repor".
- [x] `frontend/components/video/video-filter-panel.tsx` - grelha de seis miniaturas com seleção única.
- [x] `frontend/components/video/video-resize-panel.tsx` - campos, cadeado de proporção, predefinições e avisos.
- [x] `frontend/components/video/video-orient-panel.tsx` - botões de ângulo e espelhos, com as dimensões finais.
- [x] `frontend/components/video/video-watermark-panel.tsx` - texto ou imagem (local ou da galeria), posição, escala e opacidade.
- [x] `frontend/components/video/video-visual-actions.tsx` - botões e diálogo das cinco operações.
- [x] `frontend/components/video/video-player.tsx` - duas linhas: *import* e montagem a seguir ao `VideoEditActions`.

### Key Decisions

- **D-58 a D-64:** aplicadas como respondidas no checkpoint da etapa 1.
- **ADR-010 e ADR-011:** a resolução da marca e os extras do plano ficam em módulos novos ligados por linhas novas.
- **Marca no grafo único:** `null[base];movie=…[layer];[base][layer]overlay` dentro da cadeia linear do `build_command`, sem mudar o executor. Verificado numa sondagem no contentor (321×241 rodado a 90° dá 240×320, com 50 fotogramas e o AAC copiado).
- **Áudio:** as cinco operações declaram `copyable {video: false, audio: true}`. Com o `plan.js` existente, o AAC é copiado e o MP3 de um AVI é recodificado para AAC (WATERMARK-011, ADJUST-009, FILTER-007, RESIZE-009, ORIENT-009).
- **Codificação:** `libx264 -preset veryfast -crf 23` e AAC a 128 kb/s (D-39), através do `encoding.js` e do `plan.js` existentes. Corte de 1 px pelo `evenCrop` existente (Q-ADD-25).

### Deviations from Plan

- **Nome das marcas de texto:** ficam em `video_src/wm-<watermarkId>.png`, um registo por projeto e texto (*hash*), e não em `wm-<taskId>.png` (D-60). A aceitação de um texto já usado reutiliza o mesmo PNG. A limpeza e a `recipe` referem-se a ele pelo `watermarkId`, como nas imagens.
- **`express.raw` inexistente:** o Express dos dois serviços é o 4.16 e o `express.raw` só existe a partir do 4.17. Na primeira reconstrução, o serviço `projects` entrou em ciclo de reinício por causa disto. Foi corrigido com um leitor próprio do corpo, com limite (`rawBody.js`), sem dependências novas.
- **Router próprio no gateway:** o `forward()` da B001 só reencaminha JSON. A pré-visualização devolve bytes e o carregamento envia o corpo em bruto, por isso o gateway tem um router novo, montado depois do de vídeo (herda o `correlationId` e a linha de log).
- **Frontend:** os painéis ficam num componente irmão (`video-visual-actions.tsx`). O `video-edit-actions.tsx` da B004 não muda: alterar o seu tipo `Operation` e o `TITLES` seria alterar linhas existentes. Cada leitor tem duas sessões de tarefa (B004 e B005). O limite de uma tarefa por projeto continua a ser garantido pelo servidor (`TASK_ALREADY_ACTIVE`).
- **Imagens da galeria:** o limite de 1 MB aplica-se só ao ficheiro local, que passa pelo nginx. As imagens da galeria são lidas entre serviços e só têm o limite de 4096 px.
- **Pré-visualização com parâmetros inválidos:** responde 422 `INVALID_STEP_PARAMS` com os erros do passo. `NO_CHANGES` não impede a pré-visualização (mostra o fotograma inalterado).

### Dependencies Added

- Nenhuma. O sharp 0.33.5 e o DejaVu já estão no contentor `projects`; o `Tools/video/Dockerfile` não mudou (D-59).

### Developer Notes

- **Verificações desta etapa:**
  - sintaxe de todos os ficheiros JS e Python novos;
  - `tsc --noEmit --incremental false` e ESLint dos ficheiros novos do frontend (código de saída 0);
  - reconstrução com `docker compose up -d --no-deps --build projects api_gateway video_worker frontend`;
  - as rotas novas e as antigas respondem 401 sem JWT;
  - `VIDEO_TEST_OPERATIONS` sem valor nos serviços (`test_reencode` desligada);
  - sondagem no contentor da pré-visualização das quatro operações, das miniaturas, da geração do texto (1399×128 px) e dos códigos de erro principais (47 ms no total).
- **O que não foi executado nesta etapa:** testes persistentes, integração pela pilha, equivalência sharp ↔ FFmpeg, latência p95 e browser. Ficam para a etapa 3.
- **Limpeza:** a sondagem FFmpeg deixou ficheiros pequenos em `/tmp/b005probe`, dentro do contentor do worker. A remoção com `rm` foi bloqueada pela verificação de segurança do Claude Code e não foi feita. Desaparecem quando o contentor for recriado.
- **Contraste:** o `eq=contrast` atua sobre a luma em YUV e o sharp `linear` atua em RGB. A diferença é aceite pelo ADD (4.3) e vai ser medida na etapa 3.
