---
stage: implement
bolt: 008-video-concat-chain
created: 2026-10-23T00:58:42Z
status: complete
---

# Preflight da etapa 4 — verificações V1 a V14

Verificações do `ddd-02-technical-design.md` confirmadas no código da `main` com as B001 a B007 e a correção D-75 (ramo `bolt/008-video-concat-chain`, base `41f41da`), **antes de escrever código**. Para cada ponto: o que o código faz, o ponto de acréscimo (ficheiro e linha **antes** da alteração) e o resultado. Regra 2.6: todos os pontos são linhas novas ou ficheiros novos; nenhuma linha existente muda.

**Resultado: as 14 verificações passam. Não há dúvida nova; o ADR-019 continua `accepted`.** Há quatro ajustes ao desenho, todos por acréscimo, descritos em "Ajustes ao desenho".

## V1 — Aceitação com várias entradas (ADR-016) ✅

- `projects/video/taskModule.js:26-36` cria uma instância única `tasks` e exporta-a (`:68`); `projects/routes/videos.js:227` usa-a. O router de composição usa a mesma instância (`require("../video/taskModule").tasks`), com a mesma fila de reservas por executor (T-04).
- `tasks.submit({project, callerId, inputVideos, steps, correlationId})` (`projects/video/tasks.js:290-404`) aceita uma **lista** de vídeos: os passos 4 e 5 percorrem `inputVideos` (`:220-246`), `input_video_ids = inputVideos.map(v => v._id)` (`:360`), e o resultado recebe `source_video_ids: task.input_video_ids` (`:520`). Passando um elemento por ocorrência de clip, `source_video_ids` fica pela ordem e com repetições (CONCAT-001). `kind: chain.taskKind(steps)` (`:358`) dá `concat` (V11).
- **Achado:** `prepare` devolve `totalSteps: steps.length` (`:264`), ou seja, só os passos de topo; numa junção daria 1 + passos finais, e não N (C2 do modelo, CHAIN-012). **Ponto de acréscimo:** uma linha nova no objeto devolvido, a seguir à `:264`, que só numa cadeia com junção põe `totalSteps` igual ao custo (`chain.chainCost`, que já conta os passos dos clips, V2). Sem junção, `chainCost = steps.length` e nada muda.
- `tasks.validate` (`:269-287`) chama o mesmo `prepare`; o router de composição responde ele próprio ao `validate` com junção (V7), por isso não depende desta função para as junções.

## V2 — Registo, `validateChain` e códigos ✅

- `chain.validateChain(steps, inputProps, profile, registry)` (`projects/video/chain.js:56-73`) é exportada e pura; pode ser chamada por sub-cadeia com as propriedades de cada clip. Devolve `{error: {index, errors}, props, estimates}`; o router reendereça `index` para `{index: 0, clipIndex, stepIndex}`.
- `chain.chainCost` (`:77-85`) já chama `op.cost(parameters, inner => chainCost(inner))`: a `concat` devolve `1 + Σ inner(clip.steps)` e o custo da cadeia sai N sem mudar a B003. `chain.propsFromMeta` (`:5-20`) dá os `inputProps` de cada clip.
- Registo: `projects/video/operations/index.js:15` é a última linha `MODULES.push(...)`; **ponto de acréscimo:** uma linha nova a seguir, `MODULES.push(require("./concat"))`.
- `projects/video/errors.js:3-31`: não existem `INSUFFICIENT_INPUTS`, `TOO_MANY_INPUTS`, `INVALID_CHAIN`, `CHAIN_TOO_LONG` nem `PRESET_NAME_TAKEN`. **Ponto de acréscimo:** linhas novas no fim do `MESSAGES`, a seguir à `:30` (antes do `};` da `:31`), como fizeram a B003 e a B005.

## V3 — `plan.js` ✅ (com um ajuste no áudio da junção)

- `plans.decide(steps, inputs, finalProps, registry)` (`projects/video/plan.js:50-87`): com mais de uma entrada o vídeo é sempre `encode` (`:56-59`) e o áudio nunca `copy` (`:64-69`). `outputContainer` usa o `outputContainer` do último passo (`:13-17`): uma cadeia que termina em `convert` sai no contentor do `convert`, com os codecs de `formats.OUTPUT_CODECS` e a codificação do `encoding.js` (incluindo a qualidade AVI da D-68). `expectedDurationMs = output.durationMs` (`:153`), do `estimate` final, que com a junção é a soma (`_clips`).
- `buildPlan` faz `plan.inputs` com um elemento por vídeo de `inputs` (`:142-146`): com repetições, o worker descarregaria o mesmo ficheiro várias vezes (`Tools/video/task.py:190-194`).
- **Achado 1 (áudio):** `decide` dá `audio: none` quando **o primeiro** vídeo não tem áudio (`:62`), mesmo que outro clip tenha; isso contraria a RN6 do UC-VID-013. **Ajuste:** o `planExtrasComposition.js` (chamado depois do `buildPlan`, V4) põe `plan.output.audio = {mode: "encode", ...encoding.audioEncoding("aac")}` quando o `estimate` da junção tem áudio, e a resposta do `validate` com junção (V7) recalcula `output.audioCodec` da mesma forma. Sem alterar o `plan.js`.
- **Achado 2 (entradas repetidas):** o `planExtrasComposition.js` substitui `plan.inputs` pela lista dos vídeos distintos e guarda em `plan.composition.clips[i].file` o índice de cada ocorrência; `VideoTask.input_video_ids` continua com as repetições (V1).

## V4 — Extras do plano (ADR-008, ADR-011, ADR-013) ✅

- `projects/video/tasks.js:347-349` aplica, por esta ordem, `applyPlanExtras`, `applyVisualPlanExtras` e `applyConvertPlanExtras`, antes do `VideoTask.create` (`:353`). **Ponto de acréscimo:** um `require` novo a seguir à `:15` e uma chamada nova a seguir à `:349`: `applyCompositionPlanExtras(plan, steps, chain.propsFromMeta(inputVideos[0].meta), registry)`. Fica no plano persistido (ADR-004) e na mensagem.
- `applyPlanExtras` (`projects/video/planExtras.js:5-78`) só mexe nos passos de topo e só quando há `trim`, `remove_audio` ou `speed` no topo; numa junção, os passos dos clips não recebem `input` (V14). A `keyframeCopy` exige um só `trim` e todos os outros passos com `copyable.video` (`:23-30`): com a `concat` (`copyable` falso) nunca se aplica.
- `applyVisualPlanExtras(plan, steps, inputProps, registry)` (`projects/video/planExtrasVisual.js:8-41`) só usa `plan.steps[index]` e `plan.targets.original`; pode ser chamada sobre um plano parcial `{steps, targets: {original}}` de cada sub-cadeia, com as propriedades de entrada do clip, sem a alterar.
- `applyConvertPlanExtras` (`projects/video/convertPlanExtras.js:3-9`) só atua com **um** passo `convert`: numa cadeia de vários passos terminada em `convert` para AVI, `plan.convert.previewInSameInvocation` não é acrescentado. O `previewOf` do `plan.js` (`:93-115`) já dá `plan.preview` e `targets.preview` para AVI. **Ajuste:** o `planExtrasComposition.js` acrescenta `plan.convert = {previewInSameInvocation: true}` a essas cadeias (mesma forma do ADR-013).

## V5 — Worker; cadeia terminada em `convert` para AVI (ponto 2 da etapa 1, ADR-017) ✅

- `Tools/video/compiler.py` **não existe**; o compilador é o `executor.build_command` (`Tools/video/executor.py:32-75`), como o desenho da B003 dizia. O `bolt.md` cita o ficheiro por engano; o `composition_task.py` é o módulo novo.
- `build_command` só monta `[0:V:0]`/`[0:a:0]` (`:45`, `:52`) e uma saída com `-preset`/`-crf` (`:62`): não serve para várias entradas nem para MPEG-4 (`-q:v`). O `convert_task._avi_command` (`Tools/video/convert_task.py:64-113`) monta a saída dupla AVI + MP4 só a partir de `[0:V:0]` sem filtros de passos; não é reutilizável para o grafo da composição, mas fixa os argumentos AVI (`:90-99`) e da cópia MP4 (`:101-112`) que o `composition_task` repete a partir do plano e do `config` (`PREVIEW_X264_PRESET`, `PREVIEW_X264_CRF`, `PREVIEW_AAC_BITRATE`).
- Reutilizáveis sem mudanças: `executor.run` (`:105-150`), `executor.EVEN_CROP` (`:15`), `ops.get(name).video_filters/audio_filters` (`Tools/video/ops/__init__.py:27-31`), `step_input.with_filter_input` (`Tools/video/step_input.py:4-15`), `visual_input.resolve` (`Tools/video/visual_input.py:15-42`), `ingest.probe/thumbnail/first_frame/preview`, `runner._storage.upload`, `runner._preview_plan`, `runner._reporter`, `runner._wait`, `runner._control.cancelled` (como o `convert_task.execute`, `:124-166`).
- `visual_input.resolve` usa o índice do passo nos nomes (`mark{index}.png`, `wmbase{index}`, `Tools/video/ops/watermark.py:16`): o `composition_task` resolve todos os passos (clips e finais) num só plano achatado, para os índices não colidirem entre clips.
- **Ponto de acréscimo (desvio):** `Tools/video/task.py:196-197` é o desvio da B007, depois do descarregamento (`:190-194`) e antes da `keyframe` (`:199`). Duas linhas novas a seguir à `:197`: `if composition_task.applies(plan): return composition_task.execute(self, request, plan, input_paths, work_dir)`, e um `import composition_task` a seguir à `:16`. O `keyframe.resolve_keyframe_copy` e o `visual_input` do caminho genérico nunca veem um plano de composição.
- **Ajuste:** as cadeias terminadas em `convert` para **MOV** funcionam no caminho genérico (`libx264` com `-preset`/`-crf`, `+faststart` do `encoding.faststart`, cópia MP4 posterior pelo `plan.preview`), por isso o `composition_task.applies` só apanha `plan.composition` e as cadeias de vários passos com `plan.convert.previewInSameInvocation` (AVI). Isto restringe o desvio do ADR-017 ao que o caminho genérico não consegue fazer; o ADR fica com uma nota.

## V6 — Fase da falha só com linhas novas (D-82, ADR-019) ✅

Todos os pontos aceitam a fase só com linhas novas:

1. **`_reply`** (`Tools/video/task.py:120-127`): o `error` vem do `video_msg.build_reply` (`:121`); uma **linha nova entre a `:123` e a `:124`** faz `if status == 'failed' and reply.get('error') is not None and phase.current() is not None: reply['error']['phase'] = phase.current()`. A linha existente do `_reply` não muda.
2. **Marcação da fase:** `phase.reset()` numa linha nova a seguir à `:132` (início de `run`); `phase.set('download')` antes do ciclo de descarregamento (linha nova antes da `:190`); `phase.set('encode')` depois do descarregamento (linha nova a seguir à `:194`); `phase.set('upload')` antes dos URLs de escrita (linha nova antes da `:241`, caminho genérico) e no `convert_task.execute` (linha nova antes da `:156`). O `composition_task` marca as suas próprias fases.
3. **`VideoTask`** (`projects/models/videoTask.js:19-25`): linha nova `phase: { type: String },` a seguir à `:22` no `errorSchema`.
4. **Tratamento de `failed`** (`projects/video/tasks.js:626-634`): linha nova a seguir à `:630`, `if (reply.error?.phase) task.error_phase = String(reply.error.phase);` (objeto `lean` local); em `finish` (`:165-176`), linha nova a seguir à `:166`, `if (fields.error && task.error_phase) set.error = { ...fields.error, phase: task.error_phase };`. O `fail` (`:179-196`) continua igual.
5. **GET** (`view`, `:40-56`): linha nova a seguir à `:54`, `if (task.error?.phase) body.error.phase = task.error.phase;`.
6. **Evento** (`notify`, `:59-82`): linha nova a seguir à `:70` (`...extra,`), dentro do objeto, que junta `phase` ao `error` do evento quando a tarefa gravada a tem.
7. **`wsGateway/video.js:58`** só passa `error.code`; linha nova a seguir, `if (content.error?.phase && payload.error) payload.error.phase = content.error.phase;`.
8. **Frontend:** `applyTaskUpdate` copia o `error` inteiro (`frontend/lib/video-task-state.ts:57`), por isso a fase chega ao estado do `useVideoTask` sem mudanças; o componente novo `video-task-phase.tsx` mostra-a.

## V7 — Rotas e montagem (ADR-016) ✅

- Serviço de projetos: `projects/app.js:36-38` monta `videoVisualRouter`, `videosRouter` e `projectsRouter` em `/`. O `POST …/videos/validate` da B003 exige `videoId` (`loadBodyVideo`, `projects/routes/videos.js:230-244`); o `POST …/videos/operations` sem `:video` não tem rota (cairia no 404). **Ponto de acréscimo:** `require` novo a seguir à `:10` e `app.use("/", videoCompositionRouter)` numa linha nova **entre a `:36` e a `:37`**, ou seja, depois do router da B005 e antes do router de vídeo (ver V13).
- Gateway: `apiGateway/routes/videos.js:132-133` tem `validate` e `:video/operations`; não tem `…/videos/operations`. **Ponto de acréscimo:** uma linha nova a seguir à `:133`, `router.post(\`${VIDEOS}/operations\`, checkVideoToken, forward("post"));`, com o `videoAuth`, o `X-Correlation-Id` e o `X-Caller-Id` do router existente (`:28-37`). Não é preciso o `apiGateway/routes/videoComposition.js` do desenho.
- A rota interna `POST /video/chain-structure` (ADR-018) fica no router de composição; é atendida antes do `projectsRouter` (que tem rotas `/:user/:project`).

## V8 — Limites por perfil ✅

- `projects/video/profiles.js:6-9` tem `maxBytes` e `maxDurationMs` por perfil (`free`, `premium`) e `limitsFor` (`:12-14`); não tem clips nem passos. Ficheiro novo `projects/video/compositionLimits.js` com `MAX_CLIPS = {free: 10, premium: 50}` e `MAX_STEPS = 10`; a duração usa `profiles.limitsFor(...).maxDurationMs`.
- O `profile` passado ao `validate` é o tipo do executor (`users.getUserType`, `projects/video/tasks.js:215`, `"free"` ou `"premium"`).

## V9 — Padrão de `presets.js` (D-83, ADR-018) ✅

Onde as predefinições de vídeo diferem das de imagem (`users/routes/presets.js`, `users/models/preset.js`, `apiGateway/routes/users.js:140-208`), e porquê:

| Aspeto | Imagem (existente) | Vídeo (B008) | Porquê |
|--------|--------------------|--------------|--------|
| Caminho | `/users/:user/presets` | `/users/:user/video-presets` | ADD 4.9: coleção e rotas novas, o diálogo de imagem nunca vê cadeias de vídeo |
| Autenticação no gateway | `auth.checkToken` (401 nos dois casos) | `checkVideoToken` (401/403) | ADD 4.9 e T-00 |
| `anonymous` | 403 com texto | 403 `FORBIDDEN` no formato de erro do vídeo | RN1, T-10 |
| Passos | `tools: [{procedure, params}]`, pelo menos 2 | `steps: [{operation, version, parameters}]`, 1 a 10, estrutura validada pelo serviço de projetos | T-01, D-79, D-83, ADR-018 |
| Limite de número | 4 (`MAX_PRESETS`, `:122`) | sem limite | D-83: o limite de 4 é das predefinições de imagem e não está nas fontes de vídeo |
| Nome | `trim`, `maxlength: 60`, único com maiúsculas distintas (`preset.js:23`, `:31`) | `trim`, 1 a 50, único sem distinguir maiúsculas (`name_key`) | D-83 |
| Partilha e predefinidas | `share`, `DEFAULT_PRESETS` | nenhuma | ADD 4.9: sem partilha |
| Erros | texto simples (`jsonp("…")`), 400/409 | `{error: {code, message, details}, correlationId}`, 422/409/404 | T-10 |
| `GET` | `{defaultPresets, userPresets}` | lista | sem predefinidas |
| `PATCH` | `name?`, `tools?` | `name?`, `steps?` (pelo menos um) | D-83 (mesma semântica) |
| `DELETE` | 204 mesmo sem a predefinição | 204; 404 se não existir | formato de erro do vídeo |

- Serviço de utilizadores: `users/app.js:31-32` monta `usersRouter` e `presetsRouter` em `/`, com os caminhos completos (`/users/:user/presets`). **Ponto de acréscimo:** `require` novo a seguir à `:9` e `app.use("/", videoPresetsRouter)` numa linha nova a seguir à `:32`. O caminho `/users/:user/video-presets` não colide com as rotas `/:user/…` do `usersRouter`, que não têm `users` como primeiro segmento fixo.
- A verificação do JWT e do `anonymous` segue o `requireAuth` (`presets.js:53-78`: `User.getOne`, `auth.validate_jwt`, `type === "anonymous"`), em código novo.
- Gateway: `apiGateway/app.js:30` monta `usersRouter` em `/users`. **Ponto de acréscimo:** `require` novo a seguir à `:10` e `app.use("/users", videoPresetsRouter)` numa linha nova **antes** da `:30`. O router novo só responde a `/:user/video-presets…`. O `apiGateway/routes/users.js` não muda.

## V10 — Frontend (ponto 3 da etapa 1) ✅

- Os painéis das B004 a B007 submetem ao montar a sessão (`useVideoEditSession.submit(step)`, `frontend/components/video/use-video-edit.ts:48-62`, que envia `[step]`); não são reutilizáveis como formulários de configuração. Usam-se os construtores e as mensagens das bibliotecas, que estão exportados e não submetem: `lib/video-edit.ts` (`trimStep`, `removeAudioStep`, `speedStep`, `SPEED_PRESETS`, `parseTimecode`, `formatTimecode`, `stepErrorMessage`), `lib/video-visual.ts` (`adjustStep`, `filterStep`, `resizeStep`, `orientStep`, `watermarkStep`, `FILTERS`, `WATERMARK_PRESETS`, `NEUTRAL_ADJUST`, `visualStepErrorMessage`, `isAcceptedWatermarkFile`), `lib/video-visual-api.ts` (`uploadWatermarkFile`), `lib/video-convert.ts` (`convertStep`, `VIDEO_CONTAINERS`, `conversionError`).
- `lib/video-tasks.ts` só tem `submitVideoOperation(target, videoId, steps)` e `validateVideoSteps(target, videoId, steps)` com `videoId`; as chamadas sem `videoId` (junção) ficam no `lib/video-chain.ts` novo, com o mesmo `videosPath`/`requestConfig` (repetidos, porque não estão exportados).
- Montagem: `frontend/components/video/video-player.tsx:98` é a última ação (`VideoConvertActions`); **ponto de acréscimo:** `import` novo a seguir à `:15` e `<VideoChainActions …/>` numa linha nova a seguir à `:98`. "Juntar vídeos": `frontend/components/video/video-section.tsx:65` (`{canEdit && <VideoUpload …/>}`); `import` novo a seguir à `:21` e uma linha nova a seguir à `:65`.
- Lista de vídeos do projeto: `fetchProjectVideos(target)` com a chave `["projectVideos", pid, ownerId, shareId]` (`frontend/components/video/video-gallery.tsx:24-29`); `ProjectVideo` tem `durationMs`, `displayWidth`, `displayHeight`, `thumbnailUrl` (`frontend/lib/videos.ts:7-16`).
- Tarefa: `useVideoTask(target)` (`frontend/components/video/use-video-task.ts:37-95`) dá `{task, follow, cancel}`; o `error` completo chega ao estado (V6). Perfil e saldo: `useSession().user.type` e `user.remaining_operations` (`frontend/lib/session.ts:4-14`), que pode estar desatualizado (D-74).
- dnd-kit: `@dnd-kit/core ^6.3.1`, `@dnd-kit/sortable ^10.0.0`, `@dnd-kit/utilities ^3.2.2` (`frontend/package.json:13-15`).
- Testes do frontend: `frontend/test/*.test.mts` com o Node (sem dependências de React), como os das B003 a B007.

## V11 — `taskKind` (ponto 4 da etapa 1) ✅

`chain.taskKind` (`projects/video/chain.js:87-90`) devolve `concat` quando algum passo é uma junção, `chain` com vários passos e `single` com um. O enum do modelo (`projects/models/videoTask.js:32`) já tem os três.

## V12 — Nome sugerido (D-35) ✅

`suggestedFileName` (`projects/video/fileName.js:7-25`) percorre só os passos de topo do `recipe` (`:12`): uma junção seguida de marca de água dá `ferias_concat_watermark.mp4`. Sem mudanças.

## V13 — Marcas de água nas sub-cadeias (ADR-010) ✅

- O *middleware* `resolveMarks` (`projects/routes/videoVisual.js:142-161`) só trata passos `watermark` **de topo** (`watermarkSteps`, `:132-138`) e só nas rotas `…/validate` e `…/:video/operations` (`:163-164`): não vê os passos dentro de `parameters.clips[i].steps` nem a rota `…/videos/operations`.
- O router de composição usa uma instância própria de `createWatermarks({VideoWatermark, files})` (`projects/video/watermarks.js:25`) e a sua `resolve(project, parameters, {store, callerId})` (`:91-110`), sem mudar o *middleware*: apaga o `_mark` do cliente e grava o do servidor em todos os passos `watermark` dos clips e, na rota sem `:video`, também nos passos finais. Por isso o router é montado **depois** do da B005 (V7): numa cadeia sem junção, os passos de topo já chegam com o `_mark` do servidor, e a fase 2 em memória dá o mesmo resultado que a B003.
- Numa marca de imagem de outro projeto, `resolve` devolve `null` (`:101-108`, filtro por `project_id`) e o `validate` dá `INVALID_WATERMARK_CONTENT` (D-84).

## V14 — `input` da velocidade nas sub-cadeias (ADR-008) ✅

- O `step.input = {fpsNum, fpsDen}` de cada passo é calculado pelo `applyPlanExtras` a partir do `estimate` anterior, só nos passos de topo (`projects/video/planExtras.js:12-19`); o worker exige-o na velocidade (`Tools/video/step_input.py:4-15`).
- O `planExtrasComposition.js` calcula o mesmo `input` para cada passo de cada clip, a partir das propriedades do clip e dos `estimate` da sub-cadeia, e para os passos finais a partir do `estimate` da junção (o `applyPlanExtras` já o faz nos passos de topo, porque a `concat` tem `estimate`).

## Ajustes ao desenho (por acréscimo, sem dúvida nova)

1. **`totalSteps` da junção** (V1): uma linha nova no `prepare` do `tasks.js` põe `totalSteps = chainCost` quando há junção, para cumprir C2 (`totalSteps = cost = N`).
2. **Áudio e entradas da junção** (V3): o `planExtrasComposition.js` corrige `plan.output.audio` quando só um clip que não é o primeiro tem áudio, e reduz `plan.inputs` aos vídeos distintos.
3. **Montagem do router de composição** (V7, V13): depois do router da B005 e antes do router de vídeo, e não antes dos dois; a rota sem `:video` no gateway é uma linha nova no `apiGateway/routes/videos.js`.
4. **Desvio do `composition_task`** (V5): só para `plan.composition` e para as cadeias de vários passos terminadas em `convert` para AVI; as terminadas em MOV seguem o caminho genérico.

## Ficheiros CRLF

Os ficheiros a tocar não têm CRLF (`grep -c $'\r'` = 0 em `tasks.js`, `operations/index.js`, `errors.js`, `projects/app.js`, `videoTask.js`, `users/app.js`, `apiGateway/app.js`, `apiGateway/routes/videos.js`, `task.py`, `convert_task.py`, `ops/__init__.py`, `wsGateway/video.js`, `video-player.tsx`, `video-section.tsx`). Os 20 ficheiros de texto do repositório com CRLF (por exemplo `Tools/resize/resize.py`, `Tools/utils/rabbit_mq.py`, `apiGateway/Dockerfile`) não são tocados; a lista fica guardada para a verificação do fim da etapa.
