---
unit: 003-video-composition
bolt: 008-video-concat-chain
stage: design
status: complete
updated: 2026-10-23T00:47:57Z
---

# Technical Design - Junção de vídeos, cadeias de operações e predefinições de vídeo

Fontes, por ordem de precedência: `docs/add.md` (ADD v1.1, mestre: 2.6, T-00 a T-06, T-08, T-10, 4.8, 4.9, Q-ADD-13, Q-ADD-16, Q-ADD-25), `docs/specsDuvidas.md` (D-23, D-35, D-39, D-40, D-42 a D-45, D-47, D-49, D-60, D-61, D-68, D-75, D-78 a D-85), `memory-bank/standards/decision-index.md` (ADR-004, ADR-005, ADR-007 a ADR-011, ADR-013 a ADR-015), `bolt.md` e as stories ST-VID-013 e 014, `docs/requirements/REQ-VID-CONCAT.md`, `REQ-VID-CHAIN.md`, `REQ-VID-NFR.md`, `docs/use-cases/UC-VID-013.md` e `014.md`. Base: `ddd-01-domain-model.md` (aprovado com as D-78 a D-84). Os componentes das B001 a B007 que este bolt estende são descritos a partir dos seus artefactos (`ddd-02-technical-design.md` da B003 e da B004, `implementation-walkthrough.md` da B005 e da B007, ADR-007 a ADR-014). Não se leu código (restrição do estágio); o que depende do código está em "Verificações a fazer no Estágio 4".

Uma dúvida nova surgiu neste estágio, **D-85** (código de uma predefinição com junção), respondida (a) pela equipa no checkpoint.

## Architecture Pattern

**O mesmo das B001 a B007: extensão por acréscimo (regra 2.6), com o serviço de projetos como dono das regras e o worker como executor do plano.** Este bolt segue três padrões já aceites:

1. **Router novo montado antes do router de vídeo, que intercepta só o que é seu** (ADR-010): um router de composição valida a estrutura e os limites das cadeias (fases 1 e 3, D-80) em todos os pedidos de validação e de operação, e trata por inteiro os pedidos com junção, que usam rotas sem `:video` (D-78). As cadeias sem junção seguem depois, sem mudanças, pelo router de vídeo e pelo `tasks.js` da B003, que fazem a fase 2.
2. **Campo gravado pelo servidor nos `parameters`** (ADR-010, `_mark`; B004, `_input`): o `validate` e o `estimate` da `concat` precisam das propriedades de cada clip à saída da sua sub-cadeia, que a assinatura `validate(parameters, inputProps, profile)` da B003 não dá. O router de composição calcula-as e grava-as em `parameters._clips`, por cima do que o cliente tenha enviado.
3. **Extras do plano num módulo novo e um ramo novo no worker** (ADR-008, ADR-011, ADR-013): o plano da junção vai num módulo `planExtrasComposition.js`, chamado por uma linha nova no `tasks.js`; no worker, um ramo novo `composition_task.py` executa os planos com várias entradas (junção) e as cadeias de vários passos que terminam em `convert`, porque o `executor.build_command` da B003 só monta uma entrada e uma saída H.264 e o ramo do ADR-013 só cobre a conversão isolada.

As predefinições de vídeo são CRUD numa coleção nova do serviço de utilizadores, com um router novo no gateway (ADD 4.9). A validação da estrutura de uma predefinição é delegada pelo gateway ao serviço de projetos, para as regras da D-79 terem uma só implementação (T-01).

Regra 2.6 também para o código das B001 a B007: só ficheiros novos e linhas acrescentadas. Onde o código não tiver um ponto de extensão, regista-se a dúvida e para-se (ver "Verificações").

## Layer Structure

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Presentation                                                                 │
│  frontend: video-chain-editor.tsx, video-chain-step-list.tsx,                │
│    video-chain-step-form.tsx, video-concat-timeline.tsx,                     │
│    video-clip-picker.tsx, video-chain-presets.tsx, video-task-phase.tsx,     │
│    video-composition-actions.tsx (montado no leitor e na galeria)            │
│  apiGateway/routes/videoComposition.js (POST …/videos/operations sem :video) │
│  apiGateway/routes/videoPresets.js (/users/:user/video-presets…, videoAuth)  │
│  projects/routes/videoComposition.js (antes do router de vídeo)              │
│  users/routes/videoPresets.js                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ Application                                                                  │
│  projects/video/composition.js: três fases, _clips, aceitação com junção     │
│  projects/video/tasks.js (B003): + linha do planExtrasComposition,           │
│    + linhas da fase da falha (D-82)                                          │
│  frontend/lib/video-chain.ts: contagem, custo, regras, endereços, mensagens  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Domain                                                                       │
│  projects/video/chainStructure.js (fase 1, D-78, D-79, D-85)                 │
│  projects/video/operations/concat.js (validate, estimate, cost, copyable)    │
│  projects/video/compositionLimits.js (clips e passos por perfil)             │
│  projects/video/planExtrasComposition.js (PlanoJuncao, ADR-008)              │
├──────────────────────────────────────────────────────────────────────────────┤
│ Infrastructure                                                               │
│  users/models/videoPreset.js (coleção videopresets)                          │
│  Tools/video/composition_task.py (várias entradas, saída dupla AVI)          │
│  Tools/video/ops/concat.py (sub-grafo da junção)                             │
│  Tools/video/phase.py (fase corrente da tarefa, D-82)                        │
│  Tools/video/task.py (B003): + desvio para composition_task, + fase          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Componentes e ficheiros

**Novos, no serviço de projetos:**

1. `projects/video/chainStructure.js`: `checkStructure(steps, {preset})` → `null` ou `{code: "INVALID_CHAIN", details: {rule, index?, clipIndex?, stepIndex?}}` ou `{code: "CHAIN_TOO_LONG", details: {total, limit: 10}}`; `countSteps(steps)` → N. Puro, sem leituras. Reconhece `extract_frames` antes do registo (D-79).
2. `projects/video/compositionLimits.js`: `maxClips(profile)` (10 / 50) e `MAX_STEPS = 10`, se o `profiles.js` da B001 não os tiver (V8). Os limites de duração vêm do `profiles.js`.
3. `projects/video/operations/concat.js`: operação `concat` v1 (ver "API Design").
4. `projects/video/composition.js`: o ValidadorCadeia (três fases, D-80, D-81), o cálculo do `_clips` e a aceitação com junção (ver "Aceitação").
5. `projects/video/planExtrasComposition.js`: `applyCompositionPlanExtras(plan, steps, inputProps, registry)` (ADR-008), que acrescenta `plan.composition` (ver "Plano de execução").
6. `projects/routes/videoComposition.js`: router de composição (ver "API Design"), e a rota interna `POST /video/chain-structure` usada pelo gateway nas predefinições.

**Novos, no serviço de utilizadores:**

1. `users/models/videoPreset.js`: modelo `VideoPreset` (ver "Data Persistence").
2. `users/routes/videoPresets.js`: `GET`, `POST`, `PATCH /:id`, `DELETE /:id` em `/:user/video-presets`, com recusa do `anonymous` (403).

**Novos, no API Gateway:**

1. `apiGateway/routes/videoComposition.js`: `POST /projects/:user/:project/videos/operations` (sem `:video`), com `videoAuth`, `X-Correlation-Id` e `X-Caller-Id` (T-10), se o router de vídeo da B001 não aceitar esta rota só com linhas novas (V7).
2. `apiGateway/routes/videoPresets.js`: `/users/:user/video-presets…` com `videoAuth`; em `POST` e `PATCH` com `steps`, chama primeiro o `POST projects:/video/chain-structure` com `{steps, preset: true}` e só depois o serviço de utilizadores.

**Novos, no worker `Tools/video/`:**

1. `ops/concat.py`: `clip_branch(...)` e `concat_filter(...)` (filtros da NormalizacaoClip e do `concat`).
2. `composition_task.py`: execução de um plano com `composition` ou de uma cadeia de vários passos terminada em `convert` (ver "Executor").
3. `phase.py`: `set_phase(name)`, `current_phase()`, `reset()` (D-82).

**Novos, no frontend:**

1. `frontend/lib/video-chain.ts`, sem dependências de React (testável com o Node): `OPERATIONS` (rótulos e passo por omissão das dez operações), `countSteps`, `chainCost`, `isConcatChain`, `moveStep`, `removeStep`, `toClipStep`, `ruleMessage(rule)`, `chainErrorMessage(code, details)`, `addressLabel({index, clipIndex, stepIndex})`, `phaseMessage(phase)`, `quotaWarning(profile, remaining, cost)` e a API das predefinições (`listVideoPresets`, `createVideoPreset`, `updateVideoPreset`, `deleteVideoPreset`).
2. `frontend/components/video/video-chain-editor.tsx`: diálogo do editor (cadeia principal, sub-cadeias, custo, duração, validação com *debounce*, aviso de quota, confirmar, acompanhar).
3. `video-chain-step-list.tsx`: lista ordenável com o `@dnd-kit/sortable` (um item por passo, remover, configurar).
4. `video-chain-step-form.tsx`: formulário de configuração de um passo; usa os construtores de passos e as mensagens de `lib/video-edit.ts`, `lib/video-visual.ts` e `lib/video-convert.ts` sem submeter nada (V10).
5. `video-concat-timeline.tsx`: linha temporal ordenável dos clips, com duração, `W×H` a `F` fps e, por clip, a sua sub-cadeia.
6. `video-clip-picker.tsx`: lista dos vídeos `completed` do projeto (miniatura, nome, duração) para acrescentar clips, com repetições.
7. `video-chain-presets.tsx`: guardar, carregar, mudar o nome e apagar predefinições.
8. `video-task-phase.tsx`: mostra a fase de uma tarefa falhada ao lado do `VideoTaskProgress` (D-82), se o componente da B003 não a mostrar (V10).
9. `video-composition-actions.tsx`: botões "Encadear operações" (no leitor) e "Juntar vídeos" (na área dos vídeos do projeto).

**Linhas acrescentadas em ficheiros existentes (sem alterar as que lá estão):**

1. `projects/video/operations/index.js`: uma linha de registo da `concat` (V2).
2. `projects/video/tasks.js`: um `require` e uma chamada a `applyCompositionPlanExtras` a seguir à dos extras da B007 (V4); as linhas da fase na resposta `failed` (V6).
3. `projects/app.js`: `require` e montagem do `videoComposition` antes do router de vídeo e do router da B005 que grava o `_mark` (V7, V13).
4. `projects/models/videoTask.js`: o campo `error.phase` (V6).
5. `projects/video/errors.js`: `INSUFFICIENT_INPUTS`, `TOO_MANY_INPUTS`, `INVALID_CHAIN`, `CHAIN_TOO_LONG` no fim do `MESSAGES`, se ainda não existirem (V2).
6. `users/app.js`: `require` e `app.use` do router de predefinições (V9).
7. `apiGateway/app.js`: montagem do `videoPresets` em `/users` antes do `usersRouter` e do `videoComposition` antes do router de vídeo (V7, V9). O `apiGateway/routes/users.js` não muda.
8. `Tools/video/ops/__init__.py`: o registo da `concat`.
9. `Tools/video/task.py`: o desvio para `composition_task` antes do bloco genérico e a seguir ao desvio da B007; as marcações de fase e o `error.phase` na resposta `failed` (V5, V6).
10. `frontend/components/video/video-player.tsx` e o componente da galeria de vídeos: uma linha de `import` e um elemento cada (V10).
11. Nada no `rabbitMQ/definitions.json`, no `docker-compose.yaml`, no nginx nem no `wsGateway`, se o `wsGateway/video.js` passar o `error` do evento tal como o recebe (V6).

## API Design

### Rotas

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/projects/:user/:project/videos/validate` | POST | Sem junção: `{videoId, steps}` (B003). Com junção: `{steps}` sem `videoId`, com `steps[0].operation === "concat"` (D-78) | **200** `{valid, cost: N, totalSteps: N, output, errors}` (B003). Os erros de estrutura e de limites são devolvidos como na aceitação (422, ver abaixo); os erros dos passos vêm em `errors: [{index, clipIndex?, stepIndex?, errors: [...]}]` (D-80). ≤ 1 s (D-43) |
| `/projects/:user/:project/videos/:video/operations` | POST | `{steps}` sem junção (B003) | **202** `{taskId, status: "queued"}`; com uma junção nos `steps` → 422 `INVALID_REQUEST {field: "steps"}` (D-78) |
| `/projects/:user/:project/videos/operations` | POST | `{steps}` com `steps[0].operation === "concat"` (nova, 4.8) | **202** `{taskId, status: "queued"}`; sem junção no início → 422 `INVALID_REQUEST {field: "steps"}` (D-78) |
| `/projects/:user/:project/videos/tasks/:taskId` | GET | B003 | B003, com `error.phase` quando existe (D-82) |
| `/users/:user/video-presets` | GET | `videoAuth`; o `:user` é o do token | **200** `[{id, name, steps, createdAt, updatedAt}]`, por `name` |
| `/users/:user/video-presets` | POST | `{name, steps}` | **201** a predefinição; 409 `PRESET_NAME_TAKEN`; 422 `INVALID_REQUEST {field}`, `INVALID_CHAIN {rule}`, `CHAIN_TOO_LONG`, `INVALID_STEP_PARAMS {index, errors}` (operação ou versão desconhecida) |
| `/users/:user/video-presets/:id` | PATCH | `{name?, steps?}` (pelo menos um) (D-83) | **200** a predefinição; 404 `NOT_FOUND`; os erros do POST |
| `/users/:user/video-presets/:id` | DELETE | — | **204**; 404 `NOT_FOUND` |
| `projects:/video/chain-structure` (interna, sem gateway) | POST | `{steps, preset: boolean}` | **200** `{steps}` (passos sem os campos do servidor) ou **422** com o erro da fase 1 |

Autorização: as rotas de vídeo com o `videoAuth`, edição e recusa do `anonymous` da B003; as de predefinições com o `videoAuth` (401 sem JWT válido, 403 se o utilizador do token não for o `:user`) e a recusa do `anonymous` no serviço de utilizadores (403 `FORBIDDEN`, RN1). Todas as respostas de erro com `{error: {code, message, details}, correlationId}` (T-10).

### Passo de junção (`concat` v1)

```text
{ operation: "concat", version: 1,
  parameters: { clips: [ { videoId: "<id>", steps: [ {operation, version, parameters}, … ] }, … ] } }
```

O servidor acrescenta `parameters._clips = [{videoId, input: PropriedadesVideo, output: PropriedadesVideo}, …]` (uma entrada por ocorrência) antes de qualquer `validate`, sempre por cima do que o cliente enviar. O `_clips` fica no `recipe` do resultado, como o `_mark` (ADR-010).

### `concat.js`

| Função | Comportamento |
|--------|---------------|
| `validate(parameters, inputProps, profile)` | `clips` ausente ou não lista, ou clip sem `videoId` ou `steps` lista → `INVALID_REQUEST {field}` (D-23); `clips.length < 2` → `INSUFFICIENT_INPUTS`; `> maxClips(profile)` → `TOO_MANY_INPUTS {limit}`; `Σ _clips[i].output.durationMs > maxDurationMs(profile)` → `LIMIT_EXCEEDED {total, limit}` (CONCAT-005 a 007). Sem `_clips` (pedido que não passou pelo router de composição) → `INVALID_REQUEST {field: "clips"}` |
| `estimate(inputProps, parameters)` | `container: "mp4"`, `videoCodec: "h264"`, `audioCodec: "aac"` se algum `_clips[i].output.audioCodec` não é `null`, senão `null`; `displayWidth`/`width` e `displayHeight`/`height` = os do `_clips[0].output`, cada um arredondado ao par abaixo (Q-ADD-25); `rotation: 0`; `fpsNum`/`fpsDen` do `_clips[0].output`; `durationMs` = soma; `sizeBytes: null` |
| `cost` | 1 |
| `copyable` | `{video: false, audio: false}` |

### Validação em três fases (`composition.js`, D-80, D-81)

Para cada pedido de `…/validate` e de `…/operations` (com ou sem `:video`), o router de composição:

1. **Forma e rota (D-78):** `steps` lista não vazia de objetos, senão `INVALID_REQUEST {field: "steps"}`; junção no início ⇔ rota sem `:video` (ou `validate` sem `videoId`).
2. **Fase 1, estrutura:** `chainStructure.checkStructure(steps)`, por esta ordem de regras: `empty_chain`; `frame_extraction` (topo e clips); `multiple_concat` (mais de uma junção no topo, ou junção num clip); `concat_not_first`; `convert_not_last` (topo, ou qualquer `convert` num clip); `CHAIN_TOO_LONG` com N > 10. 422 e fim.
3. **Entradas:** com junção, os `videoId` distintos dos clips são lidos de uma vez (`videos.meta`) e verificados como nos passos 4 e 5 da aceitação: `NOT_FOUND`, `RESOURCE_NOT_READY`, `UNSUPPORTED_FORMAT`, `LIMIT_EXCEEDED` de entrada, com `{videoId, clipIndex}` do primeiro clip em que aparece (D-80). Sem junção, estas verificações ficam para a B003.
4. **Fase 2, passos:** cada sub-cadeia com o `chain.validateChain(clip.steps, clip.input, profile)` da B003, com os erros reendereçados para `{index: 0, clipIndex, stepIndex}` (V2); depois o `_clips` é gravado com o `estimate` final de cada sub-cadeia, e a cadeia de topo é validada com o `validateChain` (a junção e os passos finais), com os erros em `{index}`. **Sem junção**, o router corre também o `chain.validateChain(steps, inputProps, profile)` em memória, com os `videos.meta` do vídeo da rota; se a fase 2 falhar, faz `next()` sem responder, e é a B003 que devolve o `INVALID_STEP_PARAMS` (ou o erro de entrada do vídeo, se o vídeo não existir ou não estiver pronto). Só com a fase 2 válida se passa à fase 3.
5. **Fase 3, limites (D-81):** só depois de a fase 2 passar. Saída de cada clip (`LIMIT_EXCEEDED {total, limit, clipIndex}`) e resultado final (`LIMIT_EXCEEDED {total, limit}`); a soma na junção já foi verificada pelo `validate` da `concat`. Sem junção, só o resultado final, com o `estimate` dos passos já calculado na fase 2.
6. Sem junção e sem erros: `next()`, e o pedido segue sem mudanças pelo router de vídeo e pelo `tasks.js` da B003 (fase 2 e aceitação). Com junção: `validate` responde 200 aqui; `operations` segue para a aceitação com junção.

Assim a ordem estrutura → passos → limites da D-80 vale também sem junção, sem tocar no código da B003: uma cadeia sem junção com parâmetros inválidos que também excederia o limite recebe `INVALID_STEP_PARAMS` (da B003) e não `LIMIT_EXCEEDED`. A fase 2 repetida no router seguinte é um cálculo em memória.

### Aceitação com junção

Os passos do T-03, com as diferenças da junção:

1. a 3. Como na B003 (`videoAuth`, edição, recusa do `anonymous`).
4. e 5. Por clip, no passo 3 da validação acima.
6. As três fases acima, com o `_clips` gravado.
7. a 11. Pelas funções do `tasks.js` da B003 (plano com o `plan.js` e os extras, lugar, reserva de N créditos, `VideoTask` `queued` com `kind: "concat"`, `input_video_ids` = os `videoId` dos clips pela ordem, com repetições, publicação e 202), chamadas pelo `composition.js` com a lista de entradas já carregada (V1). Se o `tasks.js` não expuser um ponto de entrada com várias entradas, regista-se uma dúvida e para-se.

O resultado recebe `source_video_ids = input_video_ids` (B003), o que dá a ordem com repetições da CONCAT-001. O nome sugerido no descarregamento usa os passos de topo do `recipe` (`ferias_concat_watermark.mp4`, D-35, V12).

### Códigos e detalhes

| Code | HTTP | `details` |
|------|------|-----------|
| `INVALID_CHAIN` | 422 | `{rule, index?, clipIndex?, stepIndex?}`; `rule` ∈ `empty_chain`, `convert_not_last`, `multiple_concat`, `frame_extraction`, `concat_not_first` (D-79), `concat_in_preset` (D-85) |
| `CHAIN_TOO_LONG` | 422 | `{total, limit: 10}` |
| `INSUFFICIENT_INPUTS` | 422 | `{min: 2}` |
| `TOO_MANY_INPUTS` | 422 | `{limit}` |
| `LIMIT_EXCEEDED` | 422 | `{total, limit, clipIndex?}`, ou `{videoId, clipIndex}` com os campos da B001 numa entrada |
| `UNSUPPORTED_FORMAT`, `NOT_FOUND`, `RESOURCE_NOT_READY` | 422, 404, 409 | `{videoId, clipIndex}` numa junção |
| `INVALID_STEP_PARAMS` | 422 | `{index, clipIndex?, stepIndex?, errors}` (D-42, D-80) |
| `PRESET_NAME_TAKEN` | 409 | `{name}` |

### Contrato de mensagens AMQP

O pedido `task.run` é o da B003, com `plan.composition` quando há junção. A resposta `failed` ganha `error.phase` (D-82):

```text
{…, status: "failed", error: {code: "PROCESSING_ERROR" | "RESOURCE_UNAVAILABLE", message, phase?: "download" | "encode" | "upload"}}
```

O evento `video-task-update` leva `error: {code, phase?}`.

## Plano de execução (T-01, T-05, ADR-008)

O `plan.js` da B003 corre sobre os passos de topo: com a `concat` (`copyable` falso), o vídeo é `encode`; o áudio é `none` se o `estimate` final não tiver áudio, senão `encode` (V3). `expectedDurationMs` vem do `estimate` do último passo. As entradas do plano (`plan.inputs`) vêm de `input_video_ids` (V3).

**`planExtrasComposition.js`**, chamado por uma linha nova no `tasks.js` a seguir aos extras da B004, B005 e B007 (V4), só quando o primeiro passo é uma `concat`:

```text
plan.composition = {
  files:  [{videoId, stage: "video_src", name, container}],         // um por vídeo distinto
  clips:  [{file: <índice em files>, steps: [passo com extras], input: {fpsNum, fpsDen, durationMs, hasAudio},
            outputDurationMs}],                                     // um por ocorrência, pela ordem
  target: {width, height, fpsNum, fpsDen},                         // do _clips[0].output, pares
  audio:  "concat" | "none",                                       // algum clip com áudio à saída?
  finalSteps: [passo com extras]                                   // os passos de topo depois da junção
}
```

Os passos de cada clip e os passos finais recebem os extras das operações (`input` da B004, `filter` e `mark` da B005, ADR-008 e ADR-011) pelas funções existentes aplicadas a um plano parcial de cada sub-cadeia, sem as alterar (V4). A cópia no *keyframe* (`keyframeCopy`, ADR-007) nunca se aplica numa junção.

**Cadeia que termina em `convert`** (sem junção ou com ela): o `plan.js` e os extras da B007 já dão o contentor e os codecs de saída e, para AVI, `plan.convert.previewInSameInvocation` (ADR-013, V3, V4). O worker desvia estas cadeias de vários passos para o `composition_task.py` (ver abaixo); a conversão isolada continua no `convert_task.py`.

## Executor (worker)

### Desvio no `task.py`

Uma linha nova a seguir ao desvio da B007 e antes do bloco genérico (V5):

- `plan.composition` presente, ou mais de um passo com o último `convert` → `composition_task.execute(...)`;
- os restantes casos seguem como hoje: o `convert` isolado no `convert_task.py` (ADR-013), as cadeias sem junção e sem `convert` no `executor.build_command` da B003.

### `composition_task.py`

Reutiliza `executor.run`, a leitura do progresso, o ciclo de cancelamento (ADR-009), o FFprobe, a miniatura, o fotograma 0, o `StorageClient.upload` e o contrato de resposta da B003, e os filtros de cada `ops/<op>.py` e a ponte `visual_input.py` (ADR-011), sem os alterar (V5). Monta:

```text
ffmpeg -hide_banner -nostdin -y [-fflags +genpts] -i <ficheiro do clip 0> -i <ficheiro do clip 1> … (uma entrada por ocorrência)
  -filter_complex "
    [i:V:0]<filtros de vídeo da sub-cadeia>,scale=W:H:force_original_aspect_ratio=decrease,
           pad=W:H:(ow-iw)/2:(oh-ih)/2,fps=F,setsar=1,format=yuv420p[v<i>];
    [i:a:0]<filtros de áudio da sub-cadeia>,aresample=48000,aformat=channel_layouts=stereo[a<i>]
      | anullsrc=r=48000:cl=stereo,atrim=duration=<outputDurationMs/1000>[a<i>]   (clip sem áudio)
    [v0][a0][v1][a1]…concat=n=N:v=1:a=1[vc][ac]                          (a=0 e sem [a<i>] se audio = "none")
    [vc]<filtros de vídeo finais>,crop=trunc(iw/2)*2:trunc(ih/2)*2[v];[ac]<filtros de áudio finais>[a]"
  -map "[v]" [-map "[a]"] -sn -dn <argumentos de saída do plano> -progress pipe:1 -nostats <saída>
  [para AVI com previewInSameInvocation: split/asplit e uma segunda saída MP4 H.264/AAC, como o convert_task (T-06)]
```

- Sem junção (cadeia terminada em `convert`), o grafo tem uma só entrada e os filtros de todos os passos, como o da B003, com a saída do `convert`.
- Um ficheiro descarregado uma vez pode ser várias entradas `-i` (4.8). O espaço temporário é a soma dos ficheiros distintos e do resultado.
- O progresso usa `expectedDurationMs` da soma; o `step` aproximado é o da B003 (D-40).
- Uma só invocação de codificação, registada no log (`video.task.command`, sem URLs) para a NFR-013.

### Fase da falha (D-82)

`phase.py` guarda a fase da entrega corrente: `download` antes de pedir os URLs GET; `encode` antes do FFmpeg (e do FFprobe, miniatura e fotograma 0); `upload` antes de pedir os URLs PUT. O `task.py` chama `phase.reset()` no início de cada entrega e `set_phase(...)` nesses pontos, nos três caminhos (genérico, `convert_task`, `composition_task`), e acrescenta `error.phase = current_phase()` à resposta `failed` (V6). No serviço de projetos, o tratamento de `failed` grava `error.phase` no `VideoTask`, e o GET e o `video-task-update` passam-no ao cliente (V6). As falhas que não passam pelo worker (*dead-letter*, rotina) ficam sem `phase`.

## Data Persistence

| Table | Columns | Relationships |
|-------|---------|---------------|
| `videotasks` (B003) | Os da B003. `kind: "concat"` com junção, `"chain"` sem ela; `steps` com os clips e o `_clips`; `input_video_ids` com repetições; `total_steps = cost = N`; `plan.composition`; `error.phase` (novo, opcional, D-82) | — |
| `videos` (B001/B003) | Resultado como na B003: `source_video_ids` pela ordem, com repetições; `recipe = steps`; `original_name` da primeira origem com a extensão do contentor (D-35, D-75) | — |
| `videopresets` (novo, serviço de utilizadores, `timestamps: true`) | `_id`; `owner_id` (ObjectId); `name` (com `trim()`, 1 a 50); `name_key` (`name` em minúsculas, para a unicidade); `steps` [{operation, version, parameters}] | Índice único `{owner_id: 1, name_key: 1}` (D-83); `owner_id` → `users`. Sem campos de partilha |

Sem migrações: as coleções são novas ou recebem só campos opcionais. As predefinições não têm limite de número (D-83). Os passos guardados não têm `_mark`, `_input` nem `_clips` (D-83, D-84).

## Frontend

As peças comuns da B003 (`lib/video-tasks.ts`, `use-video-task.ts`, `video-task-progress.tsx`) acompanham a tarefa, sem as reconstruir (D-47).

**"Encadear operações"** (botão no leitor, para quem pode editar e não é `anonymous`, como as ações das B004 a B007): abre o `video-chain-editor.tsx` com o vídeo do leitor.

- "Acrescentar passo" com as dez operações (CHAIN-002); cada passo abre o `video-chain-step-form.tsx`, que configura sem submeter.
- Lista ordenável com o dnd-kit, com remover (CHAIN-004, CHAIN-015); cada alteração revalida com *debounce* e descarta respostas antigas.
- Contador "N passos · N créditos" e duração estimada a partir do `output` (CHAIN-009, passo 3 do UC). Com N = 10, "Acrescentar passo" fica desativado (CHAIN-008).
- Erros mostrados no passo indicado por `{index, clipIndex, stepIndex}`; os de estrutura e de limites num aviso no topo, com a mensagem da regra.
- Aviso para o Registado quando N > 5 (DQ-025) ou N acima das operações restantes da sessão (que pode estar desatualizado, D-74; o servidor decide com `QUOTA_EXCEEDED`).
- "Acrescentar junção" (só sem junção): o vídeo do leitor passa a clip 1 e os passos que já existiam passam para a sua sub-cadeia (D-78); abre-se a linha temporal.
- "Guardar como predefinição" (desativado com junção, D-85) e "Carregar predefinição", que substitui os passos da cadeia principal ou da sub-cadeia escolhida, com confirmação se não estiver vazia (D-83). Uma marca de imagem de outro projeto aparece com o erro `INVALID_WATERMARK_CONTENT` no passo e pede outra imagem (D-84).
- "Executar" → `POST …/:video/operations` ou, com junção, `POST …/videos/operations`; depois o `VideoTaskProgress` com "passo k de N" e, numa falha, a fase (D-82).

**"Juntar vídeos"** (botão na área dos vídeos do projeto): abre o mesmo editor já com uma junção e a linha temporal vazia.

- `video-clip-picker.tsx`: vídeos `completed` do projeto com miniatura, nome e duração; cada clique acrescenta um clip no fim (repetições permitidas, CONCAT-001/002), até `maxClips`, mostrado ao lado (passo 1 do UC-VID-013).
- `video-concat-timeline.tsx`: arrastar para reordenar (CONCAT-013), remover (CONCAT-003), duração total e `W×H` a `F` fps do `output` em tempo real (CONCAT-004, CONCAT-012). Cada clip pode abrir a sua sub-cadeia. Com menos de 2 clips, "Executar" fica desativado (FA1).

**Mensagens:** `lib/video-chain.ts` traduz os códigos e as regras novas para português; os códigos de cada operação continuam a usar as mensagens das bibliotecas das B004, B005 e B007.

## Security Design

| Concern | Approach |
|---------|----------|
| Authentication / Authorization | Vídeo: `videoAuth`, edição e recusa do `anonymous` (B003) também na rota sem `:video`. Predefinições: `videoAuth` no gateway (o `:user` tem de ser o do token) e recusa do `anonymous` no serviço de utilizadores; um `:id` de outro dono dá 404. |
| Entradas do cliente | Só `videoId`, `steps` e `name`. As propriedades dos clips vêm de `videos.meta`; `_clips`, `_mark` e `_input` são sempre gravados pelo servidor por cima do cliente. Todos os `videoId` dos clips têm de ser do projeto da rota. |
| Limites de recursos | Clips (10/50), duração (5/60 min) e passos (10) antes da reserva e do lugar; o espaço temporário cresce só com os ficheiros distintos. |
| Injeção no comando FFmpeg | O grafo é montado a partir de números validados e dos filtros dos módulos existentes; nenhum texto do cliente entra no grafo; `subprocess` sem *shell* (B003). |
| Rota interna `chain-structure` | Só na rede do Compose, sem rota no gateway; pura, sem leituras nem escritas. |
| Logs | JSON com `correlationId` e `taskId`; sem URLs assinados (B003). |

## NFR Implementation

| Requirement | Design Approach |
|-------------|-----------------|
| NFR-013 (verificação, dona: B003) | Uma invocação de codificação por tarefa, incluindo as sub-cadeias e os passos finais; verificado no log do worker com uma cadeia de 4 passos e uma junção com sub-cadeias. |
| NFR-014 (parte da junção e da cadeia, dona: ST-VID-013), NFR-022, NFR-024 | `maxClips` e `maxDurationMs` antes da tarefa, contando as repetições; testes com 11 e 51 clips e com 5 min 30 s. |
| NFR-023 | `CHAIN_TOO_LONG` antes da tarefa, contando sub-cadeias, junção e passos finais; bloqueio no editor. |
| NFR-005 / D-43 (≤ 1 s) | Validação em memória com uma leitura dos `videos.meta` dos clips distintos (até 50); medido nos testes. |
| NFR-009 | Progresso da B003 também no `composition_task`. |
| NFR-010, NFR-018 (verificação) | Resultado no `video_worker` com o FFmpeg 5.1; MP4 H.264/AAC verificado com o FFprobe, ou o formato do `convert` final. |

## Error Handling

| Error Type | Code | Response |
|------------|------|----------|
| Estrutura | `INVALID_CHAIN {rule}`, `CHAIN_TOO_LONG` | 422, antes de qualquer leitura |
| Rota errada | `INVALID_REQUEST {field: "steps"}` | 422 (D-78) |
| Junção | `INSUFFICIENT_INPUTS`, `TOO_MANY_INPUTS`, `LIMIT_EXCEEDED` | 422 |
| Clip não elegível | `NOT_FOUND`, `RESOURCE_NOT_READY`, `UNSUPPORTED_FORMAT`, `LIMIT_EXCEEDED` com `{videoId, clipIndex}` | 404, 409, 422 |
| Passos | `INVALID_STEP_PARAMS {index, clipIndex?, stepIndex?, errors}` | 422 (200 com `errors` no `validate`) |
| Falha no worker | `PROCESSING_ERROR` com `phase` | Na tarefa e no `video-task-update`; N créditos devolvidos (D-45) |
| Predefinições | `PRESET_NAME_TAKEN`, `NOT_FOUND`, `FORBIDDEN`, `INVALID_REQUEST`, os da fase 1 | 409, 404, 403, 422 |

## External Dependencies

Sem dependências novas. O `@dnd-kit/core` e o `@dnd-kit/sortable` já estão no frontend (ADD 4.8); FFmpeg 5.1 do worker (D-25): `concat`, `scale`, `pad`, `fps`, `setsar`, `format`, `anullsrc`, `atrim`, `aresample`, `aformat`, `split` e `asplit` existem todos nesta versão.

## Testes previstos (Estágio 5)

- **Unitários do serviço de projetos:** `chainStructure` (cada regra, sub-cadeias, `extract_frames`, N = 10 e 11, preset com junção → `concat_in_preset`); `concat.js` (limites por perfil com repetições, `estimate` com rotação, dimensões ímpares, áudio misto, fps do primeiro clip à saída da sua sub-cadeia); `composition.js` (ordem das fases, endereços, `_clips` por cima do cliente, limites da D-81; **cadeia sem junção com parâmetros inválidos que também excederia o limite → o router faz `next()` e a resposta final é `INVALID_STEP_PARAMS`, não `LIMIT_EXCEEDED`**, pedido da equipa no checkpoint do Estágio 2); `planExtrasComposition` (ficheiros distintos, ocorrências, extras nas sub-cadeias).
- **Unitários do worker com FFmpeg 5.1 real:** junção de clips heterogéneos (16:9 e 9:16, 25 e 30 fps, com e sem áudio, mono e estéreo, rotação), clip repetido, sem áudio em nenhum clip, dimensão ímpar no primeiro clip; sub-cadeias com recorte, velocidade e filtro; cadeia terminada em `convert` para MOV e AVI com a cópia MP4; fase em falhas simuladas de descarregamento, codificação e envio.
- **E2E pela pilha:** junção isolada e composição da CHAIN-009 (custo 5) com o FFprobe do resultado; rejeições sem tarefa e sem quota (cada `rule`, `CHAIN_TOO_LONG`, `INSUFFICIENT_INPUTS`, `TOO_MANY_INPUTS`, `LIMIT_EXCEEDED`, `UNSUPPORTED_FORMAT` de um clip); cancelamento e falha com devolução de N créditos; `source_video_ids` com repetições; uma única invocação de codificação; predefinições (CRUD, nome repetido, `anonymous`, outro utilizador, junção).
- **Frontend:** unitários do `lib/video-chain.ts`; no navegador, o editor, a linha temporal com o dnd-kit e as predefinições.
- **Regressão:** os testes das B001 a B007, o fluxo de imagem e o diálogo de predefinições de imagem (sem cadeias de vídeo).

## Verificações a fazer no Estágio 4 (dependem do código das B001 a B007)

1. **V1 (aceitação com várias entradas):** que funções o `tasks.js` exporta para a aceitação e a validação; se aceitam uma lista de entradas com repetições e passos já validados (como a B003 diz: "o `tasks.js` já aceita uma lista de entradas"), e se dão `kind: "concat"` (regra do TipoTarefa da B003, ponto 4 da etapa 1) e `source_video_ids` com repetições. Se não houver ponto de entrada sem mudar linhas, dúvida nova e paragem.
2. **V2 (registo e validação):** a forma do `chain.validateChain` (pode ser chamado por sub-cadeia, com os `inputProps` de cada clip? que endereço dá aos erros?), o registo de operações e os códigos já existentes no `errors.js`.
3. **V3 (`plan.js`):** como monta `plan.inputs` a partir de `input_video_ids` (repetições), o `audio: none` a partir do `estimate` final, o contentor e os codecs de saída a partir de um `convert` no fim de uma cadeia, e o `expectedDurationMs`.
4. **V4 (extras do plano):** se o `applyPlanExtras` (B004), o `applyVisualPlanExtras` (B005) e os extras da B007 podem ser aplicados a um plano parcial de uma sub-cadeia; em que condições o `previewInSameInvocation` é acrescentado (só com um passo, ou também no fim de uma cadeia); onde acrescentar a linha do `applyCompositionPlanExtras`.
5. **V5 (worker; ponto 2 da etapa 1, cadeia terminada em `convert` para AVI):** o ponto do `task.py` para o desvio, depois do da B007; se o `convert_task.py` expõe os argumentos de saída AVI e a saída dupla de forma reutilizável; se o `executor` expõe `run`, a leitura do progresso e a tradução dos filtros de um passo; se o `visual_input.py` e o `keyframe.py` ignoram um plano com `composition`. Confirmar também que não existe `Tools/video/compiler.py` (o `bolt.md` cita-o; o desenho da B003 só tem o `executor.py`): se existir, o `composition_task` usa-o.
6. **V6 (D-82, pedida pela equipa; ADR-019):** que a fase entra na resposta `failed` do worker (`task.py`, `_reply` e os ramos da B007) e no `VideoTask` (esquema do `error`, tratamento de `failed` no `tasks.js`, GET da tarefa, evento `video-task-update` e `wsGateway/video.js`) **só com linhas novas**. Em particular, se a fase não puder entrar na resposta `failed` sem mudar a linha existente do `_reply` em `task.py`, regista-se uma dúvida nova e para-se, como a resposta à D-82 e o checkpoint do Estágio 2 mandam.
7. **V7 (rotas):** a ordem e os padrões das rotas do router de vídeo no gateway e no serviço de projetos (`…/videos/operations` sem `:video` não pode ser apanhada por uma rota com parâmetro), o corpo aceite pelo `…/validate` sem `videoId`, e onde montar o router de composição antes do router de vídeo e do da B005, em `projects/app.js` e `apiGateway/app.js`.
8. **V8 (limites por perfil):** o que o `profiles.js` da B001 exporta (duração e tamanho por perfil; clips e passos?).
9. **V9 (D-83, pedida pela equipa; ponto 5 da etapa 1):** o padrão do `users/routes/presets.js` e do `users/models/preset.js`: verificação do dono e do `anonymous`, forma das respostas e dos erros, regra do nome único (maiúsculas, `trim`, comprimento), semântica do `PATCH`, limite de 4 e partilha. Regista-se no relatório da etapa 4 onde as predefinições de vídeo diferem e porquê (sem limite de número, sem partilha, formato de erro do vídeo). Também: como o gateway encaminha para o serviço de utilizadores e onde montar o `videoPresets` antes do `usersRouter`.
10. **V10 (frontend; ponto 3 da etapa 1):** se os painéis das B004, B005 e B007 têm partes de configuração reutilizáveis sem submissão; que construtores de passos e mensagens exportam `lib/video-edit.ts`, `lib/video-visual.ts` e `lib/video-convert.ts`; o ponto de montagem na galeria para "Juntar vídeos" e a lista dos vídeos do projeto; se o `use-video-task.ts` e o `VideoTaskProgress` expõem o `error` completo (para a fase); de onde vêm o perfil e as operações restantes na sessão; a versão do dnd-kit.
11. **V11 (ponto 4 da etapa 1):** a regra do `chain.taskKind` (`concat` quando há junção).
12. **V12 (nome sugerido):** que o `fileName.js` (D-35) percorre só os passos de topo do `recipe` e dá `…_concat_….mp4`.
13. **V13 (marcas de água nas sub-cadeias):** se o *middleware* do `_mark` (ADR-010) resolve passos `watermark` dentro de `parameters.clips[i].steps` e na rota sem `:video`; se não, o router de composição chama as funções do `watermarks.js` para os passos dos clips, sem mudar o *middleware*.
14. **V14 (`_input` da velocidade nas sub-cadeias):** se o `step.input` da B004 (ADR-008) é calculado por passo a partir do `estimate` anterior, para os passos de um clip receberem as propriedades do seu clip.

Se alguma verificação mostrar que a extensão não é possível só com linhas acrescentadas, regista-se em `docs/specsDuvidas.md` e o Estágio 4 para antes de alterar código.

## Candidatos a ADR (Estágio 3)

1. **Router de composição antes do router de vídeo, com as fases 1 e 3 e o `_clips` gravado pelo servidor:** aplica a ordem da D-80 sem mudar o `tasks.js` e passa as propriedades dos clips ao `validate` da `concat` sem mudar a assinatura do registo (padrão do ADR-010).
2. **Ramo `composition_task.py` no worker para junções e cadeias terminadas em `convert`:** estende o ADR-013 às cadeias, porque o construtor genérico só monta uma entrada e uma saída H.264.
3. **Validação da estrutura das predefinições delegada pelo gateway ao serviço de projetos:** uma só implementação das regras (T-01), sem catálogo de operações no serviço de utilizadores.
4. **`error.phase` em todas as tarefas (D-82):** campo novo no contrato da resposta `failed`, no `VideoTask` e no evento.

## Decisões tomadas no checkpoint do Estágio 2

Respondidas pela equipa em 2026-10-23T00:47:57Z:

1. Desenho técnico aprovado, com uma correção: numa cadeia sem junção, o router de composição corre a fase 2 (`chain.validateChain` em memória) antes da fase 3; se a fase 2 falhar, faz `next()` sem responder e a B003 devolve o `INVALID_STEP_PARAMS`; só com a fase 2 válida a fase 3 pode dar `LIMIT_EXCEEDED`. Atualizada a secção "Validação em três fases" e acrescentado o teste unitário correspondente.
2. **D-85 (a):** predefinição com junção → 422 `INVALID_CHAIN {rule: "concat_in_preset", index}`.
3. Estágio 3: os quatro ADR propostos, ADR-016 (router de composição e `_clips`), ADR-017 (`composition_task.py`), ADR-018 (validação da estrutura das predefinições delegada ao serviço de projetos) e ADR-019 (`error.phase`, condicionado à V6), acrescentados ao `decision-index.md`.
4. V6: se a fase não puder entrar na resposta `failed` sem mudar a linha existente do `_reply` em `task.py`, regista-se a dúvida e para-se.
