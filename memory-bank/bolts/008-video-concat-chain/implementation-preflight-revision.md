---
stage: implement
bolt: 008-video-concat-chain
created: 2026-10-23T14:07:31Z
status: complete
---

# Preflight da etapa 4 da revisão: verificações V15 a V24

Verificações da secção "Revisão da etapa 2" do `ddd-02-technical-design.md`, feitas no código do ramo `bolt/008-video-concat-chain` (commit `3d80647`) **antes de escrever código**. Linhas indicadas **antes** da alteração. As linhas das B004, B005 e B007 só mudam ao abrigo da D-87 (ADR-020). O resto do código continua só por acréscimo face à `origin/main`.

**Resultado:** as dez verificações passam. Os nove painéis separam-se sem mudar o que se vê, por isso não há dúvida nova. A V17 encontrou uma limitação da pré-visualização da marca de água, resolvida com código novo da B008 (ver "Ajustes").

## V15: estrutura dos nove painéis

Todos seguem o mesmo padrão:

1. o estado do formulário (`useState`);
2. o passo construído a partir dele (`trimStep`, `speedStep`, …);
3. `useVideoEditValidation(target, videoId, step)` e, nos visuais, `useVideoPreview(...)`;
4. o JSX dos controlos;
5. `<VideoEditValidation>` ou `<VideoVisualValidation>`;
6. o botão de submissão `session.submit(step)`.

O que é de submissão é só o `session.submit`, o `session.busy` e o botão (ou o `AlertDialog`).

| Painel | Ficheiro e linhas | Estado de configuração | Entradas | Submissão (fica no painel simples) |
|--------|-------------------|------------------------|----------|-------------------------------------|
| Recorte | `video-trim-panel.tsx:25-217` | `start`, `end`, `url`, `playbackError`, `looping`, `player`, `resumeAt`, `renewals` (`:36-43`) | `durationMs`, `videoId` (leitor) | `:205-213` "Recortar · 1 crédito", na mesma linha (`:197`) do "Pré-visualizar corte"; chama `stop` antes de submeter |
| Remoção de áudio | `video-remove-audio-panel.tsx:23-67` | nenhum (`removeAudioStep`, `:32`) | — | `:40-64` `AlertDialog` de confirmação (AUDIO-004) |
| Velocidade | `video-speed-panel.tsx:20-83` | `value` (`:31`), por omissão `"2"` | `durationMs` | `:73-80` |
| Marca de água | `video-watermark-panel.tsx:32-240` | `values`, `uploading`, `imageError` (`:42-51`); por omissão: texto, posição `bottom-right`, escala 0.2, opacidade 0.6 | `useProjectInfo` (galeria), `videoId` (pré-visualização) | `:230-237`; desativa com `busy = session.busy \|\| uploading` (`:57`) |
| Ajuste | `video-adjust-panel.tsx:30-87` | `values` (`:39`), por omissão `NEUTRAL_ADJUST` | `videoId` (pré-visualização) | `:79-84` |
| Filtro | `video-filter-panel.tsx:25-96` | `filter` (`:34`), miniaturas (`:35-39`) | `videoId` | `:86-93` |
| Redimensionar | `video-resize-panel.tsx:29-151` | `locked`, `width`, `height` (`:42-44`) | `sourceWidth`, `sourceHeight` | `:141-148` |
| Rodar/espelhar | `video-orient-panel.tsx:27-96` | `values` (`:40`) | `sourceWidth`, `sourceHeight` | `:88-93` |
| Converter | `ConvertPanel` em `video-convert-actions.tsx:31-102` | `destination` (`:48-50`) | `source` (contentor), `videoCodec`, `audioCodec` | `:93-98`; desativa também sem `verdict` (`:54-56`, ADR-014) |

**Forma da extração sem mudar o que se vê:**

- Cada painel passa a ser `<XConfig …>` com o mesmo JSX, pela mesma ordem, e com o botão de submissão no mesmo sítio.
- O botão entra por um *slot*, `renderActions(ctx)`, que o `XConfig` coloca exatamente onde o botão estava:
  - no recorte, dentro do `div` da `:197`, a seguir ao "Pré-visualizar corte";
  - nos outros painéis, depois do componente de validação.
- O `ctx` traz o passo, a validação, o `busy` interno (a marca junta-lhe o `uploading`), a função `beforeSubmit` (o `stop` do recorte) e, na conversão, o `verdict`. Assim cada painel mantém a sua condição de `disabled` tal como está.
- A validação continua a correr no mesmo *render* em que o passo é calculado. O `XConfig` recebe o *hook* de validação como *prop* (`useValidation(step)`), estável para cada instância:
  - o painel simples passa `(step) => useVideoEditValidation(target, videoId, step)`, o que dá a mesma ordem de *hooks* e os mesmos pedidos de agora;
  - as composições passam um *hook* que lê a validação da cadeia para aquele passo.
- Os `frontend/lib/video-*.ts` das B004, B005 e B007 **não** mudam.

## V16: leitor do recorte (D-89)

- O leitor do painel pede o URL de reprodução em `video-trim-panel.tsx:54-69` e renova-o em `:111-122`.
- O *scrubbing* está em `mark` (`:90-100`) e o *loop preview* em `:71-84` e `:101-110`.
- Os botões "Definir início/fim" e "Pré-visualizar corte" já ficam desativados sem `url` (`:159`, `:178`, `:200`).
- Com `isSource: false`, o `TrimConfig` não pede o URL nem mostra o `<video>`. Mostra no lugar dele a indicação "O recorte aplica-se ao resultado do passo anterior" e deixa os três botões visíveis e desativados.
- Os campos, a duração prevista e a validação ficam iguais, e `durationMs` passa a ser a duração estimada à entrada do passo.
- Na edição simples `isSource` é sempre `true`, por isso nada muda.

## V17: endpoints de pré-visualização da B005

- **`POST …/:video/preview`** (`projects/routes/videoVisual.js:218-238`, `staticSteps` em `:184-212`): aplica pela ordem os passos estáticos (`adjust`, `filter`, `resize`, `orient`) e ignora os outros. O `fetchVideoPreview(t, v, steps)` (`frontend/lib/video-visual-api.ts:49-53`) já aceita uma lista. Nas composições, os painéis visuais passam `[...previewSteps, passo]`, sem mudanças no backend.
- **`GET …/:video/filters/thumbnails`** (`:240-254`): as miniaturas são do fotograma 0 original, sem os passos anteriores. Fica como limitação (T-07): a pré-visualização principal, depois de escolher um filtro, já leva os passos anteriores.
- **`POST …/:video/watermark-preview`** (`:256-301`): só aceita **um** passo (`:263`) e valida e coloca a marca com as propriedades do vídeo original (`:281-291`). Não aplica os passos estáticos anteriores. Depois de um redimensionamento, podia dar `WATERMARK_OUT_OF_BOUNDS` numa cadeia válida.
  - **Ajuste:** rota nova da B008, `POST …/:video/chain/watermark-preview {steps: [...anteriores, watermark]}`, no router de composição.
  - Aplica `preview.render(frame, estáticos)` (`projects/video/preview.js:90`) e depois `preview.watermark(...)` (`:115`), com o `markBox` sobre as propriedades estimadas depois dos passos anteriores. Usa o `createWatermarks(...).resolve`/`markPng` (`projects/video/watermarks.js:91`).
  - O fotograma vem da mesma chave `first_frame_key` (o `firstFrame` do `videoVisual.js:168-177` não está exportado, por isso repete-se em código novo).
  - O `WatermarkConfig` usa a rota da B005 quando `previewSteps` está vazio e `isSource` é `true` (edição simples, sem mudanças), e a rota nova nos outros casos. O backend da B005 não muda.

## V18: conversão numa cadeia

- `ConvertPanel` (`video-convert-actions.tsx:31-102`): os destinos vêm de `conversionTargets(source)` (`:47`). O texto "Formato atual" vem de `formatVideoFormat` (`:59`). O `verdict` ("Cópia direta"/"Recodificação") vem de `validation.output.videoMode/audioMode` (`:54-56`).
- Esses dois campos só existem no `convert` isolado (`annotateConvertValidation`, `projects/video/convertPlanExtras.js:13-17`, ADR-014).
- Numa cadeia, a origem é a estimada à entrada do passo, normalmente MP4 H.264/AAC (DQ-012): os destinos são MOV e AVI, e o `verdict` não aparece.
- No `ConvertConfig`, o *slot* de ações das composições não depende do `verdict`. O painel simples mantém a sua condição (`!verdict` desativa, `:94`).

## V19: rota `…/videos/chain/validate`

- `tasks.validate({callerId, inputVideos, steps})` (`projects/video/tasks.js:269-287`, exportada em `:670-681`) dá a resposta comum sem junção. Para junções há a `composition.validateConcat`.
- `chain.validateChain` devolve `estimates` (`projects/video/chain.js:56-73`): o `inputs.steps[k]` é `k === 0 ? inputProps : estimates[k-1]`. A partir de um passo com erro, as entradas seguintes ficam `null`.
- Com junção, `inputs.clips[i][k]` vem da mesma forma do `_clips[i].input` e da cadeia do clip. Os passos de topo depois da junção partem do `estimate` da `concat`.
- **Ponto de acréscimo:** uma rota nova no `projects/routes/videoComposition.js` (ficheiro da B008) e uma linha nova no gateway, a seguir à linha da B008 em `apiGateway/routes/videos.js:135`.
- O perfil vem do `rejectAnonymous` (`req.callerType`). Nenhuma linha da B003 muda.

## V20: limite do corpo do pedido (D-88 a)

- **Gateway:** `apiGateway/app.js:23` `app.use(express.json)`, com o limite por omissão do Express, 100 kB. Um corpo maior falha no *parser* com `err.status = 413` e `err.type = "entity.too.large"`. O Express salta os routers e o 404 (`:36-38`) e chega ao *handler* de erros existente (`:41-48`), que responde `jsonp(err)` fora do formato do vídeo.
- **Ponto de acréscimo:** um *middleware* de erros novo, `apiGateway/routes/videoPayloadErrors.js`, montado numa linha nova a seguir à `:33` (depois dos routers e antes do 404). Para caminhos `/projects/:user/:project/videos…` com `err.type === "entity.too.large"`, responde 422 `INVALID_REQUEST {field: "steps", reason: "too_large"}` no formato do vídeo. Para os outros erros, `next(err)`. O fluxo de imagem não muda.
- **Serviço de projetos:** `projects/app.js:31`, também 100 kB. Como o gateway recusa antes, um pedido demasiado grande nunca lá chega.

## V21: montagens

- `frontend/components/video/video-player.tsx`: as linhas da B008 são a `:16` (`import { VideoChainActions }`) e a `:100` (`<VideoChainActions …/>`), depois das linhas da B007. Passam a importar o `VideoMultiOperationsAction`.
- `frontend/components/video/video-section.tsx`: as linhas da B008 são a `:22` (`import { VideoConcatAction }`) e a `:67` (`{canEdit && <VideoConcatAction …/>}`). Passam a montar os botões "Juntar vídeos" e "Movie Maker".
- Mudam só linhas que a B008 acrescentou, que não estão na `origin/main`; as das B001, B002 e B007 ficam iguais.

## V22: testes existentes do frontend

`frontend/test/video-edit.test.mts`, `video-visual.test.mts` e `video-convert.test.mts` testam só funções de `frontend/lib/` (construtores, mensagens, regras de proporção), não componentes. As bibliotecas não mudam (V15), por isso continuam a valer. O aspeto e o comportamento dos nove painéis simples verificam-se:

- pelo `tsc` e pelo ESLint;
- por testes novos sem browser das funções puras dos componentes de configuração (por exemplo, o passo a partir dos valores e as entradas a partir das propriedades estimadas);
- pela checklist visual da etapa 5, painel a painel.

## V23: linhas da B008 que saem com a D-86

| Ficheiro (B008) | O que sai |
|-----------------|-----------|
| `projects/video/errors.js` | As linhas `TOO_MANY_INPUTS` e `CHAIN_TOO_LONG` acrescentadas pela B008 ao `MESSAGES` (não estão na `main`) |
| `projects/video/chainStructure.js` | O `CHAIN_TOO_LONG` e o `MAX_STEPS`; o `countSteps` fica |
| `projects/video/compositionLimits.js` | O `MAX_CLIPS`, o `maxClips` e o `MAX_STEPS`; ficam o `MIN_CLIPS` e o `maxDurationMs` |
| `projects/video/operations/concat.js` | O `TOO_MANY_INPUTS` no `checkClips` |
| `projects/video/composition.js` | O `TOO_MANY_INPUTS` na lista `CONCAT_CODES` |
| `frontend/lib/video-chain.ts` | `MAX_STEPS`, `MAX_CLIPS`, `canAddStep` e as mensagens `CHAIN_TOO_LONG`/`TOO_MANY_INPUTS` |
| Testes | `composition.test.js` (11 passos, 11/51 clips), `e2e-composition.test.js` (`CHAIN_TOO_LONG`, `TOO_MANY_INPUTS`) e `video-chain.test.mts`. Passam a provar que esses pedidos são aceites |

O `video-chain-editor.tsx`, o `video-chain-step-form.tsx` e o `video-chain-actions.tsx` (B008) saem. Como não estão na `main`, o `numstat` face à `origin/main` continua sem linhas removidas fora da D-87.

## V24: auditoria

- **Ficheiros da D-87:** `video-trim-panel.tsx`, `video-remove-audio-panel.tsx`, `video-speed-panel.tsx`, `video-watermark-panel.tsx`, `video-adjust-panel.tsx`, `video-filter-panel.tsx`, `video-resize-panel.tsx`, `video-orient-panel.tsx` e `video-convert-actions.tsx`.
- **Auditoria dos ficheiros da D-87:** `git diff --numstat origin/main...HEAD` só desses ficheiros, e `git diff -U0 origin/main...HEAD` desses ficheiros, com cada linha alterada ou removida listada no relatório.
- **Resto do código:** `git diff --numstat origin/main...HEAD -- . ':!memory-bank' ':!docs'` sem esses nove ficheiros, com o critério de 0 linhas removidas.
- **CRLF:** nenhum dos nove ficheiros tem `\r`; a lista dos 20 ficheiros CRLF do repositório é verificada outra vez no fim.

## Ajustes ao desenho (sem dúvida nova)

1. **Contrato dos componentes de configuração** (V15): em vez de `value`/`onChange`/`validation`, o componente recebe:
   - `initial` (passo a editar);
   - `useValidation(step)` (*hook*);
   - `onStepChange(step)`, para a composição guardar o passo;
   - `renderActions(ctx)` (*slot* do botão);
   - `source`, `disabled` e `target`.

   Fica assim por duas razões: o painel simples mantém a mesma ordem de *hooks* e de pedidos, e o botão fica no mesmo sítio do DOM.
2. **Pré-visualização da marca de água numa cadeia** (V17): rota nova da B008, `POST …/:video/chain/watermark-preview`, que aplica os passos estáticos anteriores antes da marca. A rota da B005 não muda.
3. **413 do gateway** (V20): *middleware* de erros novo, montado por uma linha nova no `apiGateway/app.js`.
4. **Bibliotecas `frontend/lib/video-*.ts` das B004, B005 e B007:** não mudam (V15).
