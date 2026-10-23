---
stage: implement
bolt: 008-video-concat-chain
created: 2026-10-23T14:19:01Z
status: checkpoint
---

# Implementation Report — revisão da B008 (etapa 4)

Implementação da secção "Revisão da etapa 2" do `ddd-02-technical-design.md` (D-86 a D-89, ADR-016 com a nota da D-86, ADR-020), a partir do `implementation-preflight-revision.md` (V15 a V24). O backend das etapas 4 e 5 mantém-se. Mudam a interface (três ações independentes), os controlos de configuração (os da edição simples, D-87) e os limites de quantidade (D-86).

## Backend (B008, só código da B008 e linhas novas)

- **D-86:** `compositionLimits.js` fica só com `MIN_CLIPS` e `maxDurationMs`. O `chainStructure.checkStructure` deixa de devolver `CHAIN_TOO_LONG`, o `concat.checkClips` deixa de devolver `TOO_MANY_INPUTS`, e o `composition.js` tira-o da lista `CONCAT_CODES`. As duas mensagens que a B008 tinha acrescentado ao `errors.js` saem: nunca estiveram na `main`, por isso o `errors.js` continua só com linhas novas face à `origin/main`.
- **Rota `POST …/videos/chain/validate`** (`projects/routes/videoComposition.js`, `composition.validateWithInputs`): devolve a resposta do `…/validate` mais `inputs: {steps, clips, clipOutputs, output}`, as propriedades estimadas à entrada de cada passo e à saída de cada lista.
  - Sem junção, usa a `tasks.validate` da B003 e resolve as marcas de topo (o *middleware* da B005 só serve o `…/validate`).
  - Com junção, usa a `validateConcat`.
  - No gateway é uma linha nova em `apiGateway/routes/videos.js`.
- **Rota `POST …/videos/:video/chain/watermark-preview`** (D-89, V17): aplica os passos estáticos anteriores ao fotograma 0 (`preview.render`) e coloca a marca com as propriedades estimadas depois deles (`preview.watermark`, `markBox`). No gateway é uma linha nova em `apiGateway/routes/videoVisual.js`, com o reencaminhamento binário existente. A rota da B005 não muda.
- **413 (D-88 a):** *middleware* de erros novo, `apiGateway/routes/videoPayloadErrors.js`, montado por uma linha nova no `apiGateway/app.js` antes do 404. Nos caminhos de vídeo, `entity.too.large` passa a 422 `INVALID_REQUEST {field: "steps", reason: "too_large"}`. Os outros erros seguem para o *handler* existente.

## Frontend

- **Componentes de configuração (D-87, ADR-020):** `TrimConfig`, `RemoveAudioConfig`, `SpeedConfig`, `WatermarkConfig`, `AdjustConfig`, `FilterConfig`, `ResizeConfig`, `OrientConfig` e `ConvertConfig`, exportados dos ficheiros dos painéis, com o contrato de `frontend/components/video/operation-config.ts`.
  - Cada painel simples passa a ser `<XConfig … renderActions={…o botão de antes…} />`: o mesmo JSX pela mesma ordem, com o botão no mesmo sítio, a mesma condição de `disabled`, os mesmos valores por omissão e os mesmos pedidos de validação e de pré-visualização.
  - Nas composições, o mesmo componente recebe a validação da cadeia (`chainValidation`), as propriedades estimadas à entrada do passo, `isSource` (D-89) e os passos estáticos anteriores para a pré-visualização.
  - O recorte sem o original à entrada não pede o URL nem mostra o leitor; mostra "O recorte aplica-se ao resultado do passo anterior" e deixa os três botões do leitor visíveis e desativados.
  - Os `frontend/lib/video-*.ts` das B004, B005 e B007 **não mudaram**.
- **Três ações independentes** (`video-composition-actions.tsx`):
  - "Aplicar várias operações" no leitor (`video-multi-operations.tsx`);
  - "Juntar vídeos" (`video-concat-videos.tsx`) e "Movie Maker" (`video-movie-maker.tsx`) na janela "Vídeos".

  Partilham o `use-composition.ts` (validação com *debounce* pela rota nova, submissão e tarefa), o `video-operation-chain.tsx` (lista ordenável de operações, diálogo com o componente de configuração, rascunho validado dentro da cadeia, predefinições por lista), o `video-composition-summary.tsx` (custo, duração, resolução e fps, aviso de quota, Executar, progresso e fase) e o `video-operation-config.tsx` (registo dos nove componentes). Aproveitam do editor anterior a `SortableList`, o `video-clip-picker.tsx`, o `video-chain-presets.tsx` e o `video-task-phase.tsx`.
- **Saem:** `video-chain-editor.tsx`, `video-chain-step-form.tsx` e `video-chain-actions.tsx`, que eram da B008 e não estão na `main`. Saem também os limites de `lib/video-chain.ts` (`MAX_STEPS`, `MAX_CLIPS`, `canAddStep` e as duas mensagens).
- **Montagens:** as duas linhas da B008 em `video-player.tsx` e `video-section.tsx` passam a usar as ações novas.

## Auditoria (V24)

### 1. Ficheiros abrangidos pela D-87 (`git diff --numstat origin/main...HEAD`)

```text
51	19	frontend/components/video/video-adjust-panel.tsx
80	23	frontend/components/video/video-convert-actions.tsx
46	20	frontend/components/video/video-filter-panel.tsx
57	23	frontend/components/video/video-orient-panel.tsx
73	33	frontend/components/video/video-remove-audio-panel.tsx
56	28	frontend/components/video/video-resize-panel.tsx
64	22	frontend/components/video/video-speed-panel.tsx
73	20	frontend/components/video/video-trim-panel.tsx
59	25	frontend/components/video/video-watermark-panel.tsx
```

**9 ficheiros, +559, −213.** As 213 linhas originais alteradas ou removidas estão listadas por ficheiro no anexo, com o número da linha original. A maior parte é a assinatura de cada painel e o seu botão de submissão. Esse texto volta igual no componente do painel simples, que passa a envolver o componente de configuração, ou no *slot* `renderActions`. As restantes são as trocas `session.busy` → `disabled`, `useVideoEditValidation(...)` → validação própria ou da cadeia, os valores iniciais com `initialParam(...)` e o `fetchVideoPreview(t, v, [s])` → `[...source.previewSteps, s]`. Na edição simples, `previewSteps` está sempre vazio.

### 2. Resto do código (`git diff --numstat origin/main...HEAD -- . ':!memory-bank' ':!docs'`, sem os nove ficheiros da D-87)

**52 ficheiros, +6300, −0.** Nenhuma linha removida.

### CRLF

A lista dos 20 ficheiros de texto com CRLF do repositório não mudou; nenhum ficheiro novo ou alterado tem `\r`.

## Verificações feitas nesta etapa

- `tsc --noEmit` e ESLint em `frontend/components/video` e nas bibliotecas da B008: sem erros.
- **Prettier:** os ficheiros novos passam no `--check`. Nos ficheiros da D-87:
  - B004 e conversão: o Prettier foi aplicado, porque esses ficheiros já estavam conformes na `main`, e por isso não mudou outras linhas;
  - B005: as linhas novas seguem o estilo do próprio ficheiro, que não estava formatado pelo Prettier na `main`, para não reformatar linhas que não fazem parte da extração.
- Testes unitários do serviço de projetos (contentor): **282/282**. Os testes dos limites passaram a provar a sua ausência (11 e 40 passos, 11 e 120 clips, predefinição com 11 passos).
- Testes do frontend (Node 26): **68/68**. O `video-chain.test.mts` foi atualizado para a D-86.
- Imagens reconstruídas: `projects`, `api_gateway` e `frontend` (build de produção do Next.js pelo Dockerfile, sem erros).
- **Sondagem pela pilha** (script temporário fora do repositório, com o utilizador, o projeto, os objetos e os documentos apagados no fim):
  - `…/chain/validate` com velocidade 2× + recorte + redimensionamento: entradas 3000 → 1500 → 1000 ms e saída 320 px;
  - junção de 12 vídeos aceite, com custo 1 e 36 s;
  - cadeia de 15 passos aceite, com custo 15;
  - `…/chain/watermark-preview` responde 200 `image/jpeg`;
  - um corpo de 3000 passos responde 422 `INVALID_REQUEST {field: "steps", reason: "too_large"}`.
  - Ficou um bucket vazio do utilizador de teste no SeaweedFS local.
- **Não executado nesta etapa:** testes do worker (sem mudanças em Python), integração E2E completa, medições da D-88 e browser. Ficam para a etapa 5.

## Anexo — linhas originais alteradas ou removidas ao abrigo da D-87

#### `frontend/components/video/video-adjust-panel.tsx` (19 linhas originais alteradas ou removidas)

```text
  30  export function VideoAdjustPanel({
  32    videoId,
  33    session,
  34  }: {
  35    target: VideoTarget;
  36    videoId: string;
  37    session: VideoEditSession;
  38  }) {
  39    const [values, setValues] = useState<AdjustValues>(NEUTRAL_ADJUST);
  41    const preview = useVideoPreview(target, videoId, step, (t, v, s) => fetchVideoPreview(t, v, [s]));
  42    const validation = useVideoEditValidation(target, videoId, step);
  59              disabled={session.busy}
  73          disabled={session.busy || neutral}
  79        <Button
  80          disabled={!validation.valid || session.busy}
  81          onClick={() => void session.submit(step)}
  82        >
  83          Aplicar ajuste · 1 crédito
  84        </Button>
```

#### `frontend/components/video/video-convert-actions.tsx` (23 linhas originais alteradas ou removidas)

```text
  32  function ConvertPanel({
  34    videoId,
  35    source,
  36    videoCodec,
  37    audioCodec,
  38    session,
  39  }: {
  40    target: VideoTarget;
  41    videoId: string;
  42    source: VideoContainer;
  43    videoCodec: string;
  44    audioCodec: string | null;
  45    session: VideoEditSession;
  46  }) {
  49      destinations[0],
  52    const validation = useVideoEditValidation(target, videoId, step);
  65            disabled={session.busy}
  94        <Button
  95          disabled={!validation.valid || !verdict || session.busy}
  96          onClick={() => void session.submit(step)}
  97        >
  98          Converter · 1 crédito
  99        </Button>
```

#### `frontend/components/video/video-filter-panel.tsx` (20 linhas originais alteradas ou removidas)

```text
  25  export function VideoFilterPanel({
  27    videoId,
  28    session,
  29  }: {
  30    target: VideoTarget;
  31    videoId: string;
  32    session: VideoEditSession;
  33  }) {
  34    const [filter, setFilter] = useState<FilterId | null>(null);
  41    const preview = useVideoPreview(target, videoId, step, (t, v, s) => fetchVideoPreview(t, v, [s]), 0);
  42    const validation = useVideoEditValidation(target, videoId, step);
  55                disabled={session.busy}
  86        <Button
  87          disabled={!step || !validation.valid || session.busy}
  88          onClick={() => {
  89            if (step) void session.submit(step);
  90          }}
  91        >
  92          Aplicar filtro · 1 crédito
  93        </Button>
```

#### `frontend/components/video/video-orient-panel.tsx` (23 linhas originais alteradas ou removidas)

```text
  27  export function VideoOrientPanel({
  29    videoId,
  30    sourceWidth,
  31    sourceHeight,
  32    session,
  33  }: {
  34    target: VideoTarget;
  35    videoId: string;
  36    sourceWidth: number;
  37    sourceHeight: number;
  38    session: VideoEditSession;
  39  }) {
  40    const [values, setValues] = useState<OrientValues>({ rotation: 0, flipH: false, flipV: false });
  42    const preview = useVideoPreview(target, videoId, step, (t, v, s) => fetchVideoPreview(t, v, [s]), 0);
  43    const validation = useVideoEditValidation(target, videoId, step);
  55              disabled={session.busy}
  72              disabled={session.busy}
  88        <Button
  89          disabled={!validation.valid || session.busy}
  90          onClick={() => void session.submit(step)}
  91        >
  92          Aplicar orientação · 1 crédito
  93        </Button>
```

#### `frontend/components/video/video-remove-audio-panel.tsx` (33 linhas originais alteradas ou removidas)

```text
  32    const step = removeAudioStep();
  33    const validation = useVideoEditValidation(target, videoId, step);
  35      <div className="flex flex-col gap-3">
  36        <p className="text-sm">
  37          Cria um vídeo novo sem nenhuma faixa de áudio. O original mantém-se.
  38        </p>
  39        <VideoEditValidation validation={validation} />
  40        <AlertDialog>
  41          <AlertDialogTrigger asChild>
  42            <Button disabled={!validation.valid || session.busy}>
  43              Remover áudio · 1 crédito
  44            </Button>
  45          </AlertDialogTrigger>
  46          <AlertDialogContent>
  47            <AlertDialogHeader>
  48              <AlertDialogTitle>Confirmar remoção do áudio</AlertDialogTitle>
  49              <AlertDialogDescription>
  50                Todas as faixas de áudio serão removidas do novo vídeo. O original
  51                mantém-se. Confirmas a operação?
  52              </AlertDialogDescription>
  53            </AlertDialogHeader>
  54            <AlertDialogFooter>
  55              <AlertDialogCancel>Voltar</AlertDialogCancel>
  56              <AlertDialogAction
  57                disabled={!validation.valid || session.busy}
  58                onClick={() => void session.submit(step)}
  59              >
  60                Confirmar
  61              </AlertDialogAction>
  62            </AlertDialogFooter>
  63          </AlertDialogContent>
  64        </AlertDialog>
  65      </div>
```

#### `frontend/components/video/video-resize-panel.tsx` (28 linhas originais alteradas ou removidas)

```text
  29  export function VideoResizePanel({
  31    videoId,
  32    sourceWidth,
  33    sourceHeight,
  34    session,
  35  }: {
  36    target: VideoTarget;
  37    videoId: string;
  38    sourceWidth: number;
  39    sourceHeight: number;
  40    session: VideoEditSession;
  41  }) {
  43    const [width, setWidth] = useState(String(sourceWidth));
  44    const [height, setHeight] = useState(String(sourceHeight));
  49    const preview = useVideoPreview(target, videoId, step, (t, v, s) => fetchVideoPreview(t, v, [s]));
  50    const validation = useVideoEditValidation(target, videoId, step);
  68              disabled={session.busy}
  87              disabled={session.busy}
 100            disabled={session.busy}
 116              disabled={session.busy}
 141        <Button
 142          disabled={!step || !validation.valid || session.busy}
 143          onClick={() => {
 144            if (step) void session.submit(step);
 145          }}
 146        >
 147          Redimensionar · 1 crédito
 148        </Button>
```

#### `frontend/components/video/video-speed-panel.tsx` (22 linhas originais alteradas ou removidas)

```text
  20  export function VideoSpeedPanel({
  22    videoId,
  23    durationMs,
  24    session,
  25  }: {
  26    target: VideoTarget;
  27    videoId: string;
  28    durationMs: number;
  29    session: VideoEditSession;
  30  }) {
  31    const [value, setValue] = useState("2");
  34    const validation = useVideoEditValidation(target, videoId, step);
  43              disabled={session.busy}
  58          disabled={session.busy}
  73        <Button
  74          disabled={!step || !validation.valid || session.busy}
  75          onClick={() => {
  76            if (step) void session.submit(step);
  77          }}
  78        >
  79          Alterar velocidade · 1 crédito
  80        </Button>
```

#### `frontend/components/video/video-trim-panel.tsx` (20 linhas originais alteradas ou removidas)

```text
  25  export function VideoTrimPanel({
  27    videoId,
  28    durationMs,
  29    session,
  30  }: {
  31    target: VideoTarget;
  32    videoId: string;
  33    durationMs: number;
  34    session: VideoEditSession;
  35  }) {
  36    const [start, setStart] = useState(formatTimecode(0));
  37    const [end, setEnd] = useState(formatTimecode(durationMs));
  52    const validation = useVideoEditValidation(target, videoId, step);
 151              disabled={session.busy}
 159              disabled={session.busy || !url}
 170              disabled={session.busy}
 178              disabled={session.busy || !url}
 208              stop();
 214        </div>
 215      </div>
```

#### `frontend/components/video/video-watermark-panel.tsx` (25 linhas originais alteradas ou removidas)

```text
  32  export function VideoWatermarkPanel({
  34    videoId,
  35    session,
  36  }: {
  37    target: VideoTarget;
  38    videoId: string;
  39    session: VideoEditSession;
  40  }) {
  43      type: "text",
  44      text: "",
  45      watermarkId: null,
  46      position: { preset: "bottom-right" },
  47      scale: 0.2,
  48      opacity: 0.6,
  54    const preview = useVideoPreview(target, videoId, step, fetchWatermarkPreview);
  55    const validation = useVideoEditValidation(target, videoId, step);
  57    const busy = session.busy || uploading;
 230        <Button
 231          disabled={!step || !validation.valid || busy}
 232          onClick={() => {
 233            if (step) void session.submit(step);
 234          }}
 235        >
 236          Aplicar marca de água · 1 crédito
 237        </Button>
```

