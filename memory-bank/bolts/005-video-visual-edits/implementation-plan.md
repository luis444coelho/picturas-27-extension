---
stage: plan
bolt: 005-video-visual-edits
created: 2026-10-22T20:11:21Z
---

## Implementation Plan: 002-video-transformations

### Objetivo

Acrescentar as operações `watermark`, `adjust`, `filter`, `resize` e `orient` (UC-VID-004 e UC-VID-007, UC-VID-008, UC-VID-009, UC-VID-010) ao registo de operações do serviço de projetos e ao worker, como cadeias de um passo executadas pelo executor da B003. Também se acrescentam o endpoint de pré-visualização estática com o `sharp` (T-07), o endpoint das miniaturas dos filtros (4.4) e os cinco painéis de frontend, montados sobre as peças comuns de tarefa (D-47), como fez a B004.

**Fontes, por ordem de autoridade:**
1. `docs/add.md` (2.5, 2.6, T-01, T-02, T-05, T-07, 4.3 a 4.6, Q-ADD-07, 12, 13, 18, 23, 24 e 25).
2. `docs/specsDuvidas.md` (D-01 a D-57 e as novas D-58 a D-64).
3. `memory-bank/standards/decision-index.md` (ADR-001 a ADR-009, em especial ADR-008 e ADR-009).
4. Este bolt e as stories ST-VID-004, 008, 009, 010 e 011.
5. `docs/requirements/REQ-VID-{WATERMARK,ADJUST,FILTER,RESIZE,ORIENT,NFR}.md`.
6. `docs/use-cases/UC-VID-004.md` e UC-VID-007, UC-VID-008, UC-VID-009, UC-VID-010.

O `docs/merge.md` não é usado.

### Entregas

**Serviço de projetos (`projects/`), só ficheiros novos e linhas novas:**
- `projects/video/operations/adjust.js`, `filter.js`, `resize.js`, `orient.js` e `watermark.js`, com `name`, `versions: [1]`, `cost` de 1, `validate`, `estimate` e `copyable`. Cada um entra no registo com uma linha `MODULES.push(require(...))` nova em `operations/index.js`.
- `projects/video/filters.json`: catálogo dos seis filtros, `{type: "matrix", matrix}` ou `{type: "invert"}`. As matrizes ficam pendentes da D-58.
- `projects/video/planExtrasVisual.js`: extras do plano no padrão do ADR-008 (entrada do filtro e origem da marca), chamado por uma linha nova em `tasks.js`. Pendente da D-63.
- `projects/video/preview.js`: pipeline sharp do T-07, com uma operação por passagem, sobre `.raw`, e cache `Map` LRU limitada (D-64).
- Router novo `projects/routes/videoVisual.js`, montado por uma linha `app.use` nova em `projects/app.js`, antes do router de vídeo. Responde só às rotas novas e deixa passar as restantes:
  - `POST …/videos/:video/preview` (T-07);
  - `GET …/videos/:video/filters/thumbnails` (4.4);
  - `POST …/videos/watermarks` (D-60);
  - `POST …/videos/:video/watermark-preview` (D-62);
  - o *middleware* que resolve `_mark` antes da validação e da aceitação (D-61).
- Modelo novo `projects/models/videoWatermark.js` e módulo novo de limpeza das marcas órfãs (D-60).

**API Gateway:** linhas novas em `apiGateway/routes/videos.js` para as quatro rotas novas, com `checkVideoToken` e `forward` existentes.

**Worker (`Tools/video/`):** `Tools/video/ops/adjust.py`, `filter.py`, `resize.py`, `orient.py` e `watermark.py`, registados com linhas novas em `ops/__init__.py`. A marca de água obriga a acrescentar uma segunda entrada (o PNG da marca) ao comando do executor. O ponto de inserção é verificado na etapa 2, antes de escrever código, como a B004 fez com o `keyframe.insert_input_options`, sem alterar linhas do `executor.py` nem do `task.py`.

**Frontend:** cinco painéis novos:
- **Marca de água:** separadores Texto e Imagem, carregamento ou galeria, posições predefinidas e X/Y, escala e opacidade.
- **Ajuste:** três `Slider` com `step={0.05}` e "Repor".
- **Filtros:** grelha de seis miniaturas com seleção única.
- **Redimensionamento:** campos, cadeado de proporção, predefinições, avisos de distorção e de ampliação.
- **Orientação:** botões de 90°, 180° e 270°, interruptores de espelho e dimensões finais.

Todos usam a pré-visualização com *debounce*, o `…/validate` existente e as peças `lib/video-tasks.ts`, `use-video-task.ts` e `video-task-progress.tsx`. São montados no mesmo ponto em que a B004 montou os seus três painéis (`frontend/components/video/video-edit-actions.tsx`), só com linhas novas. Os componentes da toolbar de imagem (`brightness-tool.tsx`, `contrast-tool.tsx`, `saturation-tool.tsx`, `resize-tool.tsx`, `rotate-tool.tsx`) e o `applyToolsPreview` não mudam.

**Testes (etapa 3):**
- Unitários JS dos cinco `validate`/`estimate`, de `preview.js` e de `planExtrasVisual.js`.
- Python/FFmpeg 5.1 real das cinco operações.
- Equivalência sharp ↔ FFmpeg com fotogramas de referência: oito combinações de orientação, seis filtros e o ajuste.
- Integração real pela pilha (nginx → gateway → projetos → RabbitMQ → worker → storage).
- Latência da pré-visualização (NFR-013, p95 ≤ 1 s).
- Regressão das B001 a B004 e do fluxo de imagem.
- Checklist de teste manual no browser.

### Dependências

- **B003 (na `main`):** registo de operações, `chain.js`, `plan.js`, `tasks.js` (aceitação, quota, lugar de tarefa ativa, cancelamento e progresso), `encoding.js` (D-39: `-preset veryfast -crf 23`, AAC a 128 kb/s), executor e worker. Também as peças comuns de frontend (D-47).
- **B004 (na `main`):** `planExtras.js` (ADR-008), consulta de controlo (ADR-009) e o padrão de montagem dos painéis.
- **B001:** `storage.first_frame_key` (fotograma 0 rodado, até 1280 px, ingestão e resultados), `meta.display_width` e `display_height`, e estágios `video_*`.
- **`sharp ^0.33.0`**, já em `projects/package.json` (0.33.5 no contentor, com pango e o DejaVu disponíveis).
- **`users.getUserType`**, para o teto do redimensionamento por perfil (RESIZE-006), através do `profile` que o `validate` já recebe.
- **Nenhuma dependência nova**, se a D-59 (a) for aceite. Com a D-59 (b), entra o `fonts-dejavu-core` no `Tools/video/Dockerfile`.

### Abordagem técnica

- **Ajuste (4.3):** `{brightness, contrastFactor, saturationFactor}` em [0, 2]. O passo de 0.05 aceita `|v·20 − round(v·20)| < 1e-6` e normaliza o valor. Os três a 1.0 dão `NO_CHANGES` (ADJUST-007). Valores fora do intervalo dão `INVALID_ADJUST_PARAMS` com `field` (ADJUST-006).
  - **Worker:** `colorchannelmixer=rr=f:gg=f:bb=f`, depois `eq=contrast=c` (pivô fixo, Q-ADD-18) e `eq=saturation=s` (Q-ADD-23).
  - **sharp:** três passagens: `linear(f, 0)`, `linear(c, 128·(1−c))` e `modulate({saturation})`.
- **Filtro (4.4):** `{filter: "bw" | "sepia" | "negative" | "vintage" | "cold" | "warm"}`. Um filtro ausente ou desconhecido dá `INVALID_FILTER` (FILTER-005).
  - **Worker:** `colorchannelmixer` com a matriz recebida no plano, ou `lutrgb=negval` no Negativo.
  - **sharp:** `recomb(M)` ou `negate`.
  - **Miniaturas:** seis aplicações sobre o fotograma 0 reduzido.
- **Redimensionamento (4.5):** `{width, height}` em dimensões de apresentação (Q-ADD-13, RESIZE-001).
  - **Validação:** inteiros pares, ≥ 128, dentro do teto do perfil, comparando a maior dimensão com a maior e a menor com a menor. Os erros são `INVALID_RESIZE_PARAMS {field, limit}`. Dimensões iguais às de apresentação dão `NO_CHANGES`.
  - **`estimate`:** devolve `width × height` com rotação 0.
  - **Worker:** `scale=w:h,setsar=1`.
  - **sharp:** `resize(w′, h′, {fit: "fill"})`, até 1280 px e sem ampliar o fotograma.
- **Orientação (4.6):** `{rotation: 0 | 90 | 180 | 270, flipH, flipV}`, com a rotação antes do espelho.
  - **Validação:** ângulos fora do conjunto dão `INVALID_ORIENT_PARAMS`. A identidade, ou 180° com os dois espelhos, dá `NO_CHANGES` (Q-ADD-24, ORIENT-007).
  - **`estimate`:** troca as dimensões em 90° e 270° e põe a rotação a 0.
  - **Worker:** `transpose=1`, `hflip,vflip` ou `transpose=2`, seguidos de `hflip`/`vflip`.
  - **sharp:** duas passagens, `rotate` e depois `flop`/`flip`.
- **Marca de água (Q-ADD-12, D-59 a D-62):** implementação de raiz no worker com `overlay` do PNG da marca (`format=rgba`, `colorchannelmixer=aa=<opacidade>`) na posição fixa (WATERMARK-010).
  - **Áudio:** o AAC é copiado e o MP3 de um AVI é recodificado para AAC (RN4, WATERMARK-011), através do `copyable {video: false, audio: true}` e da matriz do T-05 no `plan.js` existente.
  - **Parâmetros, geometria, origem da imagem e pré-visualização:** pendentes das D-59 a D-62.
- **Comum às cinco operações:**
  - Saída MP4 H.264/AAC (T-05, DQ-012), com os valores de codificação da D-39 lidos pelo `encoding.js`.
  - Corte de 1 px nas dimensões ímpares quando há recodificação, através do `crop` existente (Q-ADD-25, já na ERS).
  - Duração, fps e áudio preservados.
  - Progresso, cancelamento e devolução de quota pela B003, com a consulta de controlo do ADR-009.
- **Pré-visualização (T-07):**
  - **Autorização:** `videoAuth`, permissão de edição e recusa de `anonymous`.
  - **Origem:** o fotograma 0 vem de `first_frame_key` pelo `imageStorageService`.
  - **Passos:** os que não são estáticos são ignorados.
  - **Resposta:** os bytes da imagem, sem gravar no storage, sem tarefa e sem quota.
  - **`applyToolsPreview`:** não é chamado nem alterado.
- **Regra 2.6:** a seguir a cada etapa, `git diff --numstat main` nos ficheiros de código deve mostrar 0 remoções. O CRLF mantém-se nos ficheiros que o usam: nenhum dos ficheiros a tocar (`projects/video/operations/index.js`, `Tools/video/ops/__init__.py`, `projects/video/tasks.js`, `projects/app.js`, `projects/routes/videos.js`, `apiGateway/routes/videos.js`, `frontend/components/video/video-edit-actions.tsx`) usa CRLF, segundo a verificação desta etapa (0 `\r`). Os ficheiros CRLF do repositório, como `projects/Dockerfile` e `Tools/resize/resize.py`, não são tocados.
- **Fora do âmbito:** cadeias com vários passos, junção (B008). Conversão de formato (B007).
- **ADR previstos (etapa 2):** ADR-010 (*middleware* do `_mark`, D-61) e ADR-011 (`planExtrasVisual.js`, D-63).

### Decisões tomadas no checkpoint (2026-10-22T20:22:31Z)

A equipa aprovou o plano com as respostas seguintes (texto completo em `docs/specsDuvidas.md`):

- **D-58 (a):** catálogo linear com BT.601 no Preto e Branco, Sépia clássica e as matrizes propostas para Vintage, Frio e Quente (Q-ADD-07).
- **D-59 (a):** texto gerado como PNG com o sharp no serviço de projetos e aplicado com `overlay`; sem `drawtext` nem `fonts-dejavu-core` (Q-ADD-12).
- **D-60 (a), com alteração:** recurso de marca em `video_src/wm-<id>.png` e `video_watermarks`. A limpeza só apaga as marcas de projetos que já não existem e as que, ao fim de 24 h, não são referenciadas por nenhum `VideoTask` nem por nenhuma `recipe` de vídeo, para a `recipe` continuar reproduzível (B008).
- **D-61 (a):** operação `watermark` v1 e *middleware* que grava `_mark`, registado no **ADR-010**.
- **D-62 (a):** endpoint novo `…/watermark-preview`; o `…/preview` do T-07 continua a ignorar a marca.
- **D-63 (a):** `planExtrasVisual.js` com uma linha nova em `tasks.js`, registado no **ADR-011** (separado do ADR-010).
- **D-64 (a):** valores propostos. As predefinições na menor dimensão fogem à letra da RESIZE-003 ("aplicadas à altura") e coincidem com ela num vídeo horizontal.

As Q-ADD-13, 18, 23, 24 e 25 têm decisão no ADD, que este plano segue (dimensões de apresentação, pivô 128, brilho por `colorchannelmixer`, `NO_CHANGES` na identidade e corte de 1 px). A ERS já inclui as exceções da Q-ADD-24 (ORIENT-007) e da Q-ADD-25 (ADJUST-009, FILTER-007 e ORIENT-008).

### Critérios de aceitação

- [ ] Ajuste: ADJUST-001 a 010, incluindo o passo de 0.05, "Repor", `NO_CHANGES`, `INVALID_ADJUST_PARAMS` com `field` e a preservação de duração, resolução, fps e áudio AAC.
- [ ] Filtro: FILTER-001 a 007, com exatamente seis filtros, miniaturas sobre o fotograma 0, seleção única, `INVALID_FILTER` e aplicação uniforme.
- [ ] Redimensionamento: RESIZE-001 a 009, incluindo a proporção par mais próxima (1000 → 562), as predefinições, os avisos, o teto por perfil com `limit`, `NO_CHANGES` com rotação, `W×H` exato e rotação 0.
- [ ] Orientação: ORIENT-001 a 009, incluindo as oito combinações, a rotação antes do espelho, `INVALID_ORIENT_PARAMS`, `NO_CHANGES` na identidade e a troca de dimensões sem barras.
- [ ] Marca de água: WATERMARK-001 a 011, com texto e imagem, posições, escala de 5 a 50%, opacidade de 10 a 100%, rejeição de conteúdo e geometria antes da tarefa, pré-visualização, posição fixa em todos os fotogramas e áudio AAC copiado ou MP3 recodificado para AAC.
- [ ] NFR-013: pré-visualização ≤ 1 s em 95% dos pedidos, a corresponder ao FFmpeg nas oito orientações e nos filtros do catálogo, com tolerância medida e registada.
- [ ] Erros de validação rejeitados antes de criar tarefa e de reservar quota. Progresso ≥ 1×/s, cancelamento com devolução e nenhum resultado parcial (B003).
- [ ] Cada operação gera um novo recurso em `videos` com `source_video_ids` e `recipe`. O original não muda.
- [ ] Regra 2.6: 0 linhas removidas nos ficheiros de código face à `main` (`git diff --numstat`). O fluxo de imagem e as B001 a B004 passam na regressão.
- [ ] Checklist de teste manual no browser entregue.
