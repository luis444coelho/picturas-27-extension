---
unit: 002-video-transformations
bolt: 004-video-basic-edits
stage: design
status: complete
updated: 2026-10-22T16:58:47Z
---

# Technical Design - Recorte, remoção de áudio e velocidade

Fontes, por ordem de precedência: `docs/add.md` (ADD v1.1, mestre: T-01, T-02, T-03, T-05, T-06, T-07, Q-ADD-25), `docs/specsDuvidas.md` (D-03, D-25, D-37 a D-53), `memory-bank/standards/decision-index.md` (ADR-002 a ADR-006), `bolt.md` e as stories ST-VID-001 a 003, `docs/requirements/REQ-VID-TRIM.md`, `REQ-VID-AUDIO.md`, `REQ-VID-SPEED.md`, `docs/use-cases/UC-VID-001.md` a `003.md`. Base: `ddd-01-domain-model.md`. Os componentes das B001 a B003 que este bolt estende são descritos a partir dos seus artefactos (`ddd-02-technical-design.md` e `ddd-03-test-report.md` da B001 e da B003, `implementation-walkthrough.md` da B002). Não se leu código (restrição do estágio); o que depende do código está em "Verificações a fazer no Estágio 4".

## Architecture Pattern

**O mesmo das B001 a B003: extensão por acréscimo (regra 2.6), com o serviço de projetos como dono das regras e o worker como executor do plano.**

- Uma operação é um módulo do registo (`projects/video/operations/<op>.js`) e um módulo de filtros (`Tools/video/ops/<op>.py`) (T-01, T-02). As três operações entram assim, sem caminho próprio: a aceitação, a validação, o plano, a tarefa, a quota, o progresso, o cancelamento e o resultado são os da B003.
- A B003 deixou o plano a depender só de `estimate` e de `copyable` booleanos. Duas necessidades deste bolt não cabem aí: a cópia condicionada ao *keyframe* (D-49) e a taxa de fotogramas da entrada de cada passo, de que o `fps=` da velocidade precisa (D-52). Ficam num módulo novo, `projects/video/planExtras.js`, aplicado ao plano já calculado, sem mudar o `plan.js` (ver "Plano de execução").
- No worker, a verificação do *keyframe* é um módulo novo (`Tools/video/keyframe.py`) chamado antes de montar o comando: transforma o plano condicional num plano normal (cópia ou recodificação), que o executor da B003 já sabe correr.
- Regra 2.6 também para o código das B001 a B003: só ficheiros novos e linhas acrescentadas (registo das operações, a chamada ao `planExtras`, a chamada ao `keyframe.py`, a montagem dos painéis no leitor). Onde o código não tiver um ponto de extensão, regista-se a dúvida e para-se (ver "Verificações").

## Layer Structure

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Presentation                                                             │
│  frontend: video-trim-panel.tsx, video-remove-audio-panel.tsx,           │
│    video-speed-panel.tsx, video-edit-actions.tsx (montado no leitor)     │
│  (rotas da B003 sem mudanças: validate, operations, tasks/:taskId)       │
├──────────────────────────────────────────────────────────────────────────┤
│ Application                                                              │
│  projects/video/tasks.js (B003): + uma linha que aplica o planExtras     │
│  frontend/lib/video-edit.ts: passos, tempos, mensagens dos códigos       │
├──────────────────────────────────────────────────────────────────────────┤
│ Domain                                                                   │
│  projects/video/operations/trim.js, remove_audio.js, speed.js            │
│  projects/video/operations/reencodedProps.js (estimate da recodificação) │
│  projects/video/planExtras.js (CopiaNoKeyframe, fps de entrada, D-49/52) │
├──────────────────────────────────────────────────────────────────────────┤
│ Infrastructure                                                           │
│  Tools/video/ops/trim.py, remove_audio.py, speed.py                      │
│  Tools/video/keyframe.py (FFprobe; escolhe cópia ou recodificação)       │
│  Tools/video/task.py (B003): + a chamada ao keyframe.py e o videoMode    │
└──────────────────────────────────────────────────────────────────────────┘
```

### Componentes e ficheiros

**Novos, no serviço de projetos:**

1. `projects/video/operations/trim.js`: operação `trim` v1 (D-50, D-51).
2. `projects/video/operations/remove_audio.js`: operação `remove_audio` v1.
3. `projects/video/operations/speed.js`: operação `speed` v1 (D-52, D-53).
4. `projects/video/operations/reencodedProps.js`: as propriedades à saída de uma recodificação (dimensões de apresentação, `rotation: 0`, dimensões ímpares cortadas ao par), usadas pelos três `estimate`. Se a `test_reencode` já exportar esta função, reutiliza-se por `require` e este ficheiro não é criado (V6).
5. `projects/video/planExtras.js`: `applyPlanExtras(plan, steps, inputProps, registry)` (ver "Plano de execução").

**Novos, no worker `Tools/video/`:**

1. `ops/trim.py`, `ops/remove_audio.py`, `ops/speed.py`: filtros de cada operação.
2. `keyframe.py`: `resolve_keyframe_copy(plan, input_path)` → plano normal e `video_mode`.

**Novos, no frontend:**

1. `frontend/lib/video-edit.ts`: sem dependências (testável com o Node, como o `video-format.ts` da B002): `parseTimecode`/`formatTimecode` (`hh:mm:ss.mmm` ↔ ms), `trimStep`, `speedStep`, `removeAudioStep`, `SPEED_PRESETS`, `predictedTrimMs`, `predictedSpeedMs`, `stepErrorMessage(code, details)` (mensagens em português dos códigos da D-50 e do `NO_CHANGES`).
2. `frontend/components/video/video-trim-panel.tsx`, `video-remove-audio-panel.tsx`, `video-speed-panel.tsx`.
3. `frontend/components/video/video-edit-actions.tsx`: botões "Recortar", "Remover áudio" e "Velocidade", que abrem os painéis.

**Linhas acrescentadas em ficheiros existentes (sem alterar as que lá estão):**

1. `projects/video/operations/index.js`: o registo dos três módulos, sempre ativos (a `test_reencode` continua condicionada pela variável, D-37) (V1).
2. `projects/video/tasks.js`: uma chamada a `applyPlanExtras` logo a seguir ao cálculo do plano na aceitação (V3).
3. `Tools/video/ops/__init__.py`: o registo dos três módulos (V1).
4. `Tools/video/task.py`: a chamada a `resolve_keyframe_copy` depois do descarregamento e antes do executor, e o `videoMode` no `metadata` da resposta `completed` (V4, V5).
5. `frontend/components/video/video-player.tsx`: uma linha de `import` e um elemento `<VideoEditActions …/>`, como a B002 fez com as ações (V7).
6. Nada no API Gateway, no `wsGateway`, no `rabbitMQ/definitions.json`, no `docker-compose.yaml` nem no nginx: as rotas, as filas e os eventos são os da B003.

## API Design

Sem endpoints novos. Os painéis usam as rotas da B003 pelo `lib/video-tasks.ts`:

| Endpoint | Method | Uso neste bolt |
|----------|--------|----------------|
| `/projects/:user/:project/videos/validate` | POST | `{videoId, steps: [passo]}` a cada alteração, com *debounce*. Os erros de cada campo vêm de `errors[0].errors` (`{code, field?, …}`); a duração prevista é confirmada por `output.durationMs` |
| `/projects/:user/:project/videos/:video/operations` | POST | `{steps: [passo]}` → 202 `{taskId, status: "queued"}`; os erros dos passos são 422 `INVALID_STEP_PARAMS {index, errors}` (D-42) |
| `/projects/:user/:project/videos/tasks/:taskId` | GET / DELETE | Progresso, recuperação depois de recarregar e cancelamento, pelas peças comuns da B003 |

### Passos (D-50)

| Operação | `parameters` | Exemplo |
|----------|--------------|---------|
| `trim` v1 | `{startMs: inteiro, endMs: inteiro}` | `{operation: "trim", version: 1, parameters: {startMs: 10500, endMs: 45000}}` |
| `remove_audio` v1 | `{}` | `{operation: "remove_audio", version: 1, parameters: {}}` |
| `speed` v1 | `{factor: número}` | `{operation: "speed", version: 1, parameters: {factor: 1.75}}` |

Campos a mais nos `parameters` são ignorados (D-50).

### `validate` de cada operação

Os erros são devolvidos na ordem abaixo; cada operação para no primeiro erro de forma, para não acumular erros que derivam dele.

| Operação | Condição | Erro `{code, field?, …}` |
|----------|----------|--------------------------|
| `trim` | `startMs` ou `endMs` ausente ou não inteiro | `INVALID_INTERVAL {field: "startMs" \| "endMs"}` |
| `trim` | `startMs < 0` ou `startMs > durationMs` | `OUT_OF_BOUNDS {field: "startMs", durationMs}` |
| `trim` | `endMs > durationMs` (ou `endMs < 0`) | `OUT_OF_BOUNDS {field: "endMs", durationMs}` |
| `trim` | `startMs ≥ endMs` | `INVALID_INTERVAL {field: "endMs"}` |
| `trim` | `endMs − startMs < ceil(1000 × fpsDen / fpsNum)` | `INVALID_INTERVAL {field: "endMs", minDurationMs}` (D-51) |
| `remove_audio` | `audioCodec === null` | `NO_AUDIO_STREAM` |
| `speed` | `factor` ausente, não numérico, não finito, `≤ 0` | `INVALID_SPEED_FACTOR {field: "factor"}` |
| `speed` | `factor < 0.25` ou `factor > 4` | `SPEED_FACTOR_OUT_OF_RANGE {field: "factor", min: 0.25, max: 4}` |
| `speed` | `factor === 1` | `NO_CHANGES {field: "factor"}` (D-53) |

Os limites e as propriedades vêm do `inputProps` que a B003 passa ao `validate` (de `videos.meta`, ou do `estimate` do passo anterior numa cadeia), nunca do cliente (T-01).

### `estimate`, `cost` e `copyable`

| Operação | `estimate(inputProps, parameters)` | `copyable` |
|----------|-----------------------------------|------------|
| `trim` | `reencodedProps(inputProps)` com `durationMs = endMs − startMs`, `container: "mp4"`, `videoCodec: "h264"`, `audioCodec: "aac"` se a entrada tiver áudio, `sizeBytes: null`, `fpsNum`/`fpsDen` iguais | `{video: false, audio: false}` |
| `remove_audio` | Entrada H.264: igual à entrada (dimensões, rotação), com `audioCodec: null` e `container: "mp4"`. Outra (MPEG-4 Part 2): `reencodedProps` com `videoCodec: "h264"`, `audioCodec: null`. `sizeBytes: null` | `{video: true, audio: false}` |
| `speed` | `reencodedProps(inputProps)` com `durationMs = round(durationMs / factor)`, `fpsNum`/`fpsDen` iguais (D-52), `audioCodec: "aac"` se houver áudio, `sizeBytes: null` | `{video: false, audio: false}` |

`cost = 1` nos três (QUOTA-008). No recorte, o `estimate` assume a recodificação; numa cópia no *keyframe* as dimensões de apresentação são as mesmas e o resultado pode manter a etiqueta de rotação ou uma dimensão ímpar, mas os metadados do resultado vêm sempre do FFprobe ao ficheiro (T-02).

## Plano de execução (T-01, T-05, D-49, D-52)

O `plan.js` da B003 calcula o plano a partir dos `estimate` e dos `copyable`. O resultado, para cada operação, fica:

| Operação | Vídeo | Áudio |
|----------|-------|-------|
| `trim` | `encode` (`libx264`, com o corte de 1 px) | `encode` (`aac`) com `atrim`, ou `none` sem áudio |
| `remove_audio` | `copy` se a entrada é H.264; `encode` se é MPEG-4 Part 2; `genpts` com AVI copiado (T-05) | `none` |
| `speed` | `encode` | `encode` com `atempo`, ou `none` sem áudio |

A `remove_audio` precisa de que o `plan.js` dê `audio: none` quando o `estimate` do último passo tem `audioCodec: null`, mesmo que a entrada tenha áudio (V2). Com o vídeo copiado de um H.264 que o navegador não reproduz (High 10, 4:2:2, 4:4:4), o `plan.preview` da B003 já pede a cópia de pré-visualização (T-06, Q-ADD-20).

**`planExtras.js`, aplicado depois do `plan.js`** (uma linha nova no `tasks.js`, V3). O plano guardado na tarefa (`VideoTask.plan`, ADR-004) já leva os extras, por isso a republicação da rotina (D-41) não precisa dele.

1. **Propriedades de entrada de cada passo.** Percorre os passos com o `estimate` do registo (como o `validateChain` da B003) e acrescenta a cada passo do plano `input: {fpsNum, fpsDen}`. O `speed.py` usa-as no `fps=` (D-52). Se o `plan.js` já passar as propriedades de entrada de cada passo ao worker, usa-se isso e este ponto não se aplica (V2).
2. **CopiaNoKeyframe (D-49).** Aplica-se quando: há exatamente um passo `trim`; todos os outros passos têm `copyable.video = true`; e o codec de vídeo de entrada é o codec de saída da matriz para MP4 (`formats.js`, V8). Acrescenta:

```text
plan.keyframeCopy = {
  atMs: startMs, endMs,
  video: {mode: "copy", genpts: <entrada AVI>},
  audio: {mode: "copy" | "encode" | "none"},   // copy se a entrada é AAC e nenhum outro passo altera o áudio
  preview: <plano da cópia de pré-visualização para o vídeo copiado, mesma forma do plan.preview da B003>,
  dropStep: <índice do passo trim>               // o -ss/-to substitui o trim
}
```

O resto do plano (`video: encode`, `audio: encode` com `atrim`) é a alternativa que o worker usa se o *keyframe* não coincidir. Assim, as duas decisões são tomadas no serviço de projetos; o worker só escolhe entre elas por um facto que só ele vê.

## Executor (worker)

### Filtros de cada operação (`ops/<op>.py`)

Cada módulo devolve `video_filters` e `audio_filters` a partir dos `parameters` (e, na velocidade, do `input` do passo), como a `test_reencode` da B003:

| Operação | `video_filters` | `audio_filters` |
|----------|-----------------|-----------------|
| `trim` | `trim=start=<s>:end=<e>`, `setpts=PTS-STARTPTS` (`s`, `e` em segundos com 3 casas) | `atrim=start=<s>:end=<e>`, `asetpts=PTS-STARTPTS` |
| `remove_audio` | `[]` | `[]` (o plano já tem `audio: none`, o que dá `-an`, T-02) |
| `speed` | `setpts=PTS/<f>`, `fps=<fpsNum>/<fpsDen>` (D-52) | `atempo=<f>` com `f ≥ 0.5`; `atempo=0.5`, `atempo=<2f>` com `f < 0.5` (T-02) |

Com `atrim`/`atempo` num ramo de áudio, o executor da B003 compõe o grafo `[0:a:0]…[a]` como faz para qualquer passo.

### Cópia no *keyframe* (`keyframe.py`, D-49)

Corre depois do descarregamento do original e antes do executor, só se o plano tiver `keyframeCopy`:

1. FFprobe à primeira stream de vídeo: o instante do primeiro fotograma (`first_pts`) e os *keyframes* à volta de `atMs` (`-select_streams V:0 -skip_frame nokey -show_entries frame=pts_time -read_intervals <atMs−1 s>%<atMs+1 s>`; para `atMs = 0`, o primeiro *keyframe*).
2. Coincide se existir um *keyframe* com `round((pts − first_pts) × 1000) == atMs`.
3. Coincide → plano normal com `video: copy`, `audio: keyframeCopy.audio`, o `preview` e o `genpts` de `keyframeCopy`, sem o passo `dropStep`, e as opções de entrada `-ss <atMs/1000> -to <endMs/1000>` antes do `-i`; `video_mode = "copy"`.
4. Não coincide, ou o FFprobe falha → o plano recebido sem `keyframeCopy`; `video_mode = "encode"`. Uma falha do FFprobe não falha a tarefa: a recodificação é sempre correta.

O executor da B003 já monta a cópia de uma stream (`-map 0:V:0 -c:v copy`). As opções de entrada `-ss/-to` são acrescentadas pelo `keyframe.py` como dados do plano (`inputOptions`), se o executor tiver esse ponto; senão, por uma função nova que as insere na lista de argumentos antes do `-i` (V4). A duração esperada para o progresso é `endMs − atMs` nos dois casos.

A resposta `completed` leva `metadata.videoMode` (`copy` ou `encode`) e o log `video.task.keyframe` regista `{taskId, atMs, keyframeMs, videoMode}`; o serviço de projetos ignora o campo (o resultado é criado da mesma forma).

## Data Persistence

Sem coleções nem campos novos.

| Table | Columns | Relationships |
|-------|---------|---------------|
| `videotasks` (B003) | Os da B003. `steps` com um passo `trim`, `remove_audio` ou `speed`; `plan` com os extras do `planExtras.js` (incluindo `keyframeCopy`, quando existe) | — |
| `videos` (B001/B003) | Resultado como na B003: `_id` da tarefa (ADR-005), `source_video_ids`, `recipe = steps`, `meta` do FFprobe | O painel "Informações" da B002 mostra os passos aplicados a partir do `recipe` (V7) |

## Frontend

As peças comuns da B003 (`lib/video-tasks.ts`, `use-video-task.ts`, `video-task-progress.tsx`) são montadas nos três painéis, sem as reconstruir (D-47). Cada painel tem dois momentos: **configurar** (controlos, duração prevista, erros, botão de confirmação) e, depois de submeter, **acompanhar** (o `VideoTaskProgress`: progresso, "passo 1 de 1", Cancelar, erro com o `correlationId`). Ao terminar em `completed`, o painel indica que o vídeo novo está na lista do projeto e pede à galeria que recarregue (V7).

**`video-edit-actions.tsx`**, montado no leitor da B001/B002: botões "Recortar", "Remover áudio" e "Velocidade". Escondidos para o `anonymous` e para quem só tem leitura, como as ações da B002 (V7); o servidor recusa na mesma (B003, passos 2 e 3). "Remover áudio" fica desativado com a indicação "Este vídeo não tem áudio" quando `meta.audioCodec === null` (AUDIO-001/002); se o leitor não tiver os `meta`, o painel abre e mostra o `NO_AUDIO_STREAM` do `validate` (V7).

**Recorte (`video-trim-panel.tsx`):**

- Um `<video>` próprio do painel, com o URL de reprodução da B001 (`preview_key` quando existe), para não mexer no leitor existente (V7).
- Campos "Início" e "Fim" em `hh:mm:ss.mmm` (TRIM-001/002), validados no cliente só quanto ao formato; início 0 e fim = duração por omissão.
- "Definir início" / "Definir fim": preenchem com `round(video.currentTime × 1000)` (TRIM-003).
- Duração prevista `fim − início`, mostrada logo a cada alteração (TRIM-004).
- "Pré-visualizar corte" (TRIM-007): reproduz a partir do início e, num ciclo `requestAnimationFrame`, volta ao início quando `currentTime ≥ fim`; sem pedidos ao servidor. Para quando se fecha o painel ou se carrega de novo.
- "Recortar" desativado com intervalo inválido (TRIM-005/006) e enquanto o `validate` tem erros, com a mensagem por campo (`stepErrorMessage`).

**Remoção de áudio (`video-remove-audio-panel.tsx`):** resumo da operação (remove todas as faixas de áudio; o original fica igual); "Remover áudio" abre uma janela de confirmação que avisa da supressão do áudio, e só "Confirmar" submete (AUDIO-004).

**Velocidade (`video-speed-panel.tsx`):** botões 0.25×, 0.5×, 0.75×, 1.25×, 1.5×, 2.0× e 4.0× (SPEED-001); campo numérico para outro fator (SPEED-002); duração prevista `duração / fator` mostrada logo (SPEED-003); erros do `validate` (incluindo `NO_CHANGES` para 1.0×, D-53).

As durações previstas são calculadas no cliente para aparecerem sem esperar pela rede (são aritmética, não regras); a validação e o `output.durationMs` vêm sempre do servidor (T-01).

## Security Design

| Concern | Approach |
|---------|----------|
| Authentication / Authorization | Os da B003, sem mudanças: `videoAuth`, edição para validar e submeter, recusa do `anonymous`, cancelamento só por quem submeteu. |
| Entradas do cliente | Só `videoId` e os `parameters` da D-50. Duração, fps, codecs e áudio vêm de `videos.meta` (T-01). Os valores numéricos são verificados como inteiros ou números finitos antes de chegarem a um filtro. |
| Injeção no comando FFmpeg | Os filtros são montados a partir de números já validados no serviço de projetos e formatados no worker (`%.3f`, inteiros); nenhum texto do cliente entra no grafo. O comando é uma lista de argumentos do `subprocess`, sem *shell* (B003). |
| Quota | A da B003: rejeições do `validate` antes da reserva (AUDIO-003, D-51, D-53). |
| Logs | JSON com `correlationId` e `taskId`; sem URLs assinados (B003). |

## NFR Implementation

| Requirement | Design Approach |
|-------------|-----------------|
| NFR-005 / D-43 (≤ 1 s) | O `validate` e o `planExtras` são cálculos em memória; o FFprobe do *keyframe* corre no worker, nunca na aceitação. |
| NFR-009 | Progresso da B003 (0,5 s), também na cópia, em que o FFmpeg termina depressa. |
| NFR-010 (verificação, dona: B001) | Tudo corre no contentor `video_worker` com o FFmpeg 5.1 (D-25). |
| NFR-013 (verificação, dona: B003) | No máximo uma recodificação: a cópia no *keyframe* e a remoção de áudio de um H.264 não recodificam o vídeo; o FFprobe do *keyframe* não codifica nada. Verificado no log do worker. |
| NFR-018 (verificação, dona: B003) | Resultado MP4 H.264/AAC (ou sem áudio), verificado com o FFprobe do resultado nas três operações e nas entradas MP4, MOV e AVI. |
| AUDIO-005 | Cópia do vídeo verificada pelo `codec`, `profile` e número de pacotes iguais aos do original, e pelo `videoMode` no log. |
| TRIM-008 / SPEED-006 | Duração do resultado verificada com tolerância de um fotograma. |

## Error Handling

| Error Type | Code | Response |
|------------|------|----------|
| Parâmetros inválidos de um passo | `INVALID_STEP_PARAMS {index, errors}` com os códigos da tabela do `validate` | 422 (B003, D-42) |
| Vídeo sem áudio na remoção | `NO_AUDIO_STREAM` dentro de `INVALID_STEP_PARAMS` | 422 |
| Falha do FFmpeg | `PROCESSING_ERROR` (B003) | Na tarefa e no `video-task-update`; crédito devolvido |
| Falha do FFprobe do *keyframe* | — (recodificação, registada no log) | A tarefa continua |
| Os restantes | Os da B003 (`TASK_ALREADY_ACTIVE`, `QUOTA_EXCEEDED`, `RESOURCE_NOT_READY`, …) | Mensagens já existentes no `lib/video-tasks.ts` |

As mensagens em português dos códigos novos dos passos ficam só no frontend (`stepErrorMessage`), porque chegam dentro do `details` do `INVALID_STEP_PARAMS`; o `MESSAGES` do `errors.js` não muda.

## External Dependencies

Sem dependências novas. FFmpeg/FFprobe 5.1 do worker (D-25): `trim`, `atrim`, `setpts`, `asetpts`, `fps`, `atempo`, `-skip_frame nokey`, `-read_intervals` e `-ss/-to` como opções de entrada existem todos nesta versão.

## Testes previstos (Estágio 5)

- **Unitários do serviço de projetos:** `validate`, `estimate` e `copyable` das três operações (limites, D-50 a D-53, MP4/MOV/AVI, rotação, dimensões ímpares); `planExtras` (condições da cópia no *keyframe*, áudio `copy`/`encode`/`none`, `genpts`, `fps` de entrada); `plan.js` com `remove_audio` (`audio: none`, cópia do vídeo, pré-visualização de High 10).
- **Unitários do worker com FFmpeg 5.1 real:** filtros de cada operação; `keyframe.py` com início num *keyframe*, fora dele, em 0 e com FFprobe a falhar; `atempo` encadeado a 0.25×; `fps=` a 4× e a 0.25×; recorte e remoção de áudio de MP4, MOV e AVI (H.264 e MPEG-4 Part 2).
- **E2E pela pilha:** cada operação de ponta a ponta com o FFprobe do resultado (duração, resolução, fps, codecs, número de streams de áudio, `videoMode`); rejeições sem tarefa e sem quota (AUDIO-003, TRIM AC3, SPEED AC2); cancelamento e falha com devolução; `sourceVideoIds` e `recipe` no resultado; NFR-010, 013 e 018.
- **Frontend:** unitários do `lib/video-edit.ts`; no navegador, se o `playwright-core` estiver instalado (não estava na B003), os três painéis, o *scrubbing* e o *loop preview*.
- **Regressão:** os testes das B001 a B003 e o fluxo de imagem.

## Verificações a fazer no Estágio 4 (dependem do código das B001 a B003)

1. **V1:** como o `projects/video/operations/index.js` e o `Tools/video/ops/__init__.py` registam os módulos, e se basta acrescentar linhas para registar os três sempre ativos.
2. **V2:** no `plan.js`, (a) como se decide `audio: none` (só pela entrada, ou também pelo `estimate` do último passo, de que a `remove_audio` precisa); (b) se os passos chegam ao worker com as propriedades de entrada de cada um; (c) a forma do `plan.preview` e do `genpts`, para o `keyframeCopy` os repetir.
3. **V3:** onde o `tasks.js` calcula o plano na aceitação, para acrescentar a chamada ao `applyPlanExtras` só com uma linha nova, e se o `validate` também calcula o plano (os extras não mudam o `output`, por isso aí não são precisos).
4. **V4:** como o `executor.py` monta o comando (opções de entrada, cópia de uma stream, grafo sem filtros, passos a omitir) e onde se insere `-ss/-to` antes do `-i` sem mudar linhas.
5. **V5:** no `task.py`, o ponto entre o descarregamento e o executor para a chamada ao `keyframe.py`, e como se acrescenta `videoMode` ao `metadata` do `completed`.
6. **V6:** se a `test_reencode` já tem uma função exportável para as propriedades de uma recodificação.
7. **V7:** no frontend, (a) o ponto de montagem no `video-player.tsx` e o que o leitor recebe (vídeo com `meta`, permissões, `projectId`); (b) a função do URL de reprodução em `lib/videos.ts`; (c) como a galeria recarrega quando aparece um vídeo novo; (d) se a permissão de edição está disponível no cliente; (e) se o painel "Informações" da B002 tem nomes para as operações do `recipe`; (f) o componente de janela de confirmação disponível em `components/ui/`.
8. **V8:** a função do `formats.js` que dá o codec de saída de um contentor.

Se alguma verificação mostrar que a extensão não é possível só com linhas acrescentadas, regista-se em `docs/specsDuvidas.md` e o Estágio 4 para antes de alterar código.

## Candidatos a ADR (Estágio 3)

- **Cópia condicionada no plano, com o *keyframe* verificado pelo worker (D-49):** é a primeira vez que o worker escolhe entre duas alternativas do plano, o que vai além da letra do T-01 ("o worker não volta a tomar esta decisão"); afeta a B008 (cadeias que começam por um recorte) e futuras operações com cópia condicionada.
- **`planExtras.js` como extensão do plano sem mudar o `plan.js`:** padrão para as próximas operações que precisem de dados que o `estimate`/`copyable` booleanos não exprimem (B005, B007, B008).

## Decisões tomadas no checkpoint do Estágio 2

1. Desenho técnico aprovado pela equipa, sem alterações e sem dúvidas novas.
2. Para o Estágio 3, a equipa pediu dois ADR: **ADR-007**, o worker escolhe entre duas alternativas do plano calculadas no serviço de projetos (cópia no *keyframe*, D-49); **ADR-008**, o `planExtras.js` como padrão de extensão do plano para as B005, B007 e B008.

## Esclarecimentos de implementação aprovados na retoma (D-54)

A D-54 (a) autoriza `applyPlanExtras(plan, steps, inputProps, registry)` a acrescentar também `plan.targets.preview` quando ausente e alguma alternativa puder precisar de pré-visualização. O destino `video_preview/<taskId>.mp4` é calculado no serviço de projetos a partir de `targets.original`, com o mesmo proprietário/projeto. É persistido antes da publicação para republicação e limpeza tardia. Preservam-se `plan.preview`, `plan.output`, destinos existentes e a assinatura aprovada; `plan.js` fica intacto. O worker recebe o destino e não o calcula.

O preflight confirma os pontos adicionais por acréscimo: adaptador em `_filters()` que copia localmente os parâmetros de `speed` e injeta o `step.input` do servidor como `_input` (sobrescreve o cliente; ausência/formato inválido falha); modo de vídeo limitado à entrega atual, reinicializado antes de cada entrega e publicado por `_reply()` apenas em `metadata` de `completed`; helper de opções `-ss/-to` chamado em `task.py` depois de `build_command()` e antes do log/execução, preservando `executor.run()` e os argumentos anteriores. Nenhuma assinatura existente muda. Os painéis obtêm metadados por `useVideoInfo()` e usam `useCanEditProject()`; `useVideoTask()` já invalida a galeria ao concluir.
