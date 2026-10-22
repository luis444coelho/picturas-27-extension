---
unit: 002-video-transformations
bolt: 004-video-basic-edits
stage: model
status: complete
updated: 2026-10-22T16:42:11Z
---

# Static Model - Recorte, remoção de áudio e velocidade

Fontes, por ordem de precedência: `docs/add.md` (ADD v1.1, mestre: T-01, T-02, T-03, T-05, T-06, T-07, Q-ADD-25), `docs/specsDuvidas.md` (D-01, D-03, D-06, D-37 a D-48), `memory-bank/standards/decision-index.md` (ADR-002 a ADR-006), `bolt.md` e as stories ST-VID-001 a 003, `docs/requirements/REQ-VID-TRIM.md`, `REQ-VID-AUDIO.md`, `REQ-VID-SPEED.md`, `docs/use-cases/UC-VID-001.md` a `003.md`. Base: o modelo e o desenho técnico da B003 (`ddd-01-domain-model.md`, `ddd-02-technical-design.md`) e o relatório de testes da B003. Modelo estático, sem leitura de código (restrição do estágio).

Os pontos que as fontes não decidem foram registados em `docs/specsDuvidas.md` como D-49 a D-53 e respondidos pela equipa no checkpoint deste estágio; o modelo cita-os como (D-xx).

## Bounded Context

**Processamento de vídeo (operações temporais e de áudio).** Acrescenta ao registo de operações da B003 três operações concretas, cada uma com as regras de um caso de uso:

- **Recorte** (`trim`, UC-VID-001): conserva só o intervalo `[início, fim]` do vídeo.
- **Remoção de áudio** (`remove_audio`, UC-VID-002): descarta todas as streams de áudio.
- **Velocidade** (`speed`, UC-VID-003): muda a cadência de vídeo e áudio por um fator.

Nomes e parâmetros pela D-50: `trim {startMs, endMs}`, `remove_audio {}`, `speed {factor}`, todos na versão 1.

Cada operação é um módulo do registo no serviço de projetos (`validate`, `estimate`, `cost`, `copyable`) e um módulo de filtros no worker (T-01, T-02). Corre como cadeia de um passo pela mecânica da B003, sem caminho próprio: aceitação pelos 11 passos, lugar de tarefa ativa, reserva e devolução de créditos, plano de execução, executor com um único `-filter_complex`, progresso, cancelamento, resultado como Vídeo novo com `sourceVideoIds` e `recipe`. Este bolt não muda essa mecânica; usa-a e, quando precisar de mais, estende-a só por acréscimo (regra 2.6).

Fronteiras e contextos vizinhos:

- **Tarefas, quota e executor (B003, Unit 001):** dono do `VideoTask`, do lugar, da quota, do `chain.js`, do `plan.js`, do `encoding.js`, do executor do worker e das peças comuns de tarefa do frontend. Este contexto fornece-lhes as regras de três operações e os filtros correspondentes. A única necessidade nova do plano é a cópia condicionada ao *keyframe* do recorte (D-49).
- **Ciclo de vida do vídeo (B001, B002):** dono do agregado Vídeo, da matriz de formatos (`formats.js`), dos `videos.meta` (as propriedades de entrada), do leitor e dos URLs de reprodução. Este contexto lê `videos.meta` (através da aceitação da B003) e usa o leitor da B002 para o *scrubbing* e o *loop preview*.
- **Interface de edição (frontend):** os três painéis novos montam as peças comuns da B003 (`lib/video-tasks.ts`, `use-video-task.ts`, `video-task-progress.tsx`) sem as reconstruir (D-47).
- **Fora deste contexto:** marca de água, ajuste, filtro, redimensionamento e orientação (B005); conversão de formato (B007); cadeias com vários passos, junção e validação de estrutura (B008); extração de fotogramas e lotes (D-06). As pré-visualizações estáticas do T-07 não se aplicam a estas três operações: o T-07 ignora explicitamente o recorte, a velocidade e o áudio.

## Domain Entities

Este bolt não cria entidades persistentes novas. As operações são serviços de domínio sem estado (T-01); o estado vive nas entidades da B001 e da B003.

| Entity | Properties | Business Rules |
|--------|------------|----------------|
| **Tarefa de vídeo** (`VideoTask`, B003, referência) | Ver o modelo da B003. Aqui: `steps = [PassoOperacao]` com um único passo `trim`, `remove_audio` ou `speed`; `kind = single`; `totalSteps = 1`; `cost = 1` | Uma operação rejeitada pelo `validate` não cria tarefa nem reserva créditos (COM-004, AUDIO-003, exceções dos UC). Falha ou cancelamento devolve o crédito e não publica resultado (TRIM AC4, SPEED AC3, B003 T2 e T3). |
| **Vídeo de entrada** (B001, só leitura) | `meta`: `container`, `videoCodec`, `audioCodec` (`null` = sem áudio, T-00), `width`, `height`, `rotation`, `displayWidth`, `displayHeight`, `fpsNum`, `fpsDen`, `durationMs`, `sizeBytes` | Tem de ser `completed`, de um formato admitido e dentro dos limites do perfil (B003, passos 4 e 5). Nunca é alterado (RN8 do UC-VID-001, RN8 do UC-VID-002, RN10 do UC-VID-003). As propriedades vêm sempre de `videos.meta`, nunca do cliente (T-01). |
| **Vídeo de resultado** (B001/B003, criação) | Ver o modelo da B003: `_id` = `_id` da tarefa (ADR-005); `sourceVideoIds = [vídeo de entrada]`; `recipe = steps`; `meta` do FFprobe ao ficheiro produzido | MP4 H.264/AAC (ou sem áudio), mesmo a partir de MOV ou AVI (DQ-013, T-05, NFR-018). Os metadados vêm do ficheiro real e não do `estimate` (T-02). Regras de cada operação em "Aggregates". |

## Value Objects

| Value Object | Properties | Constraints |
|--------------|------------|-------------|
| **IntervaloRecorte** | `startMs`, `endMs` (inteiros, milissegundos; nomes e unidade na D-50) | `0 ≤ startMs < endMs ≤ durationMs` (RN2 do UC-VID-001). `startMs ≥ endMs` → `INVALID_INTERVAL` (TRIM-005). `startMs < 0` ou qualquer instante acima de `durationMs` → `OUT_OF_BOUNDS`, com a duração do vídeo nos detalhes (TRIM-006, exceção 2 do UC: "indicando a duração máxima permitida"). Valor ausente ou não inteiro → `INVALID_INTERVAL` com `{field}`; `OUT_OF_BOUNDS` leva `{field, durationMs}` (D-50). `endMs − startMs` menor do que um fotograma (`ceil(1000 × fpsDen / fpsNum)`) → `INVALID_INTERVAL` com `{minDurationMs}` (D-51). Duração prevista = `endMs − startMs` (TRIM-004). |
| **InstanteTemporal** (só interface) | horas, minutos, segundos, milissegundos ↔ milissegundos | Forma de introdução `hh:mm:ss.mmm` (TRIM-001/002: `00:00:10.500`) e de apresentação; a API recebe só milissegundos (D-50). O *scrubbing* preenche o instante a partir da posição do leitor, arredondada ao milissegundo (TRIM-003). |
| **FatorVelocidade** | `factor` (número real) | Nulo, não numérico, zero ou negativo → `INVALID_SPEED_FACTOR` (SPEED-004, exceção 1 do UC-VID-003). `factor < 0.25` ou `factor > 4.0` → `SPEED_FACTOR_OUT_OF_RANGE` com o intervalo homologado `{min: 0.25, max: 4.0}` nos detalhes (SPEED-005, exceção 2). Fator 1.0 → `NO_CHANGES`, como o ajuste (ADD 4.3); as predefinições não incluem 1.0× (D-53). Campos a mais nos parâmetros são ignorados (D-50). Predefinições da interface: 0.25, 0.5, 0.75, 1.25, 1.5, 2.0 e 4.0 (SPEED-001). Duração prevista = `durationMs / factor` (SPEED-003, RN3). |
| **CadeiaAtempo** (derivado, worker) | lista de fatores do `atempo` | O `atempo` aceita 0.5 a 100 no FFmpeg 5.1 (D-25), por isso só se encadeia abaixo de 0.5×: `factor ≥ 0.5` → `[factor]`; `factor < 0.5` → `[0.5, 2·factor]` (para 0.25×: `atempo=0.5,atempo=0.5`, T-02). O produto é sempre `factor`. Só existe quando o vídeo tem áudio (RN9 do UC-VID-003). |
| **CopiaNoKeyframe** (parte do PlanoExecucao) | `atMs` (= `startMs`); critério de coincidência | Pela D-49: só existe num recorte cuja stream de vídeo o plano copiaria se o recorte não a alterasse (codec de origem igual ao de saída e nenhum outro passo altera o vídeo). O worker verifica com o FFprobe se há um *keyframe* cujo instante, relativo ao primeiro fotograma e arredondado ao milissegundo, é igual a `atMs`; se houver, copia o vídeo com `-ss/-to`; se não, recodifica com `trim`. O áudio segue o vídeo: copiado (AAC) com o vídeo copiado, `atrim` e recodificado com o vídeo recodificado. Dados, não regras: o worker não decide se a cópia é permitida, só observa o *keyframe* (T-01, T-02). |
| **PassoOperacao** (B003) | `operation`, `version: 1`, `parameters` | Contrato uniforme (COM-006, T-01); `parameters` em camelCase. Imutável depois de aceite: é o `recipe` do resultado. |
| **PropriedadesVideo** (B003; saída do `estimate`) | como na B003 | Ver "Domain Services" para o `estimate` de cada operação. Com recodificação, as dimensões ímpares são cortadas ao par abaixo (T-02, Q-ADD-25) e a rotação passa para os píxeis (`rotation: 0`, como a `test_reencode` da B003). |
| **ErroValidacao** (B003) | `code`, `field?`, detalhes | Códigos desta operação, todos dentro de `INVALID_STEP_PARAMS {index, errors}` com 422 (D-42): `INVALID_INTERVAL`, `OUT_OF_BOUNDS` (UC-VID-001), `NO_AUDIO_STREAM` (UC-VID-002), `INVALID_SPEED_FACTOR`, `SPEED_FACTOR_OUT_OF_RANGE` (UC-VID-003). |

## Aggregates

Este bolt não cria agregados novos. Acrescenta invariantes ao resultado de cada operação, verificáveis com o FFprobe do ficheiro produzido (os metadados do Vídeo de resultado vêm dele, T-02):

| Aggregate Root | Members | Invariants |
|----------------|---------|------------|
| **Tarefa de vídeo** (B003) | PassoOperacao (`trim`, `remove_audio` ou `speed`) | Mantém T1 a T8 da B003. (O1) O passo passou o `validate` antes de a tarefa existir; por isso, um vídeo sem áudio nunca chega a uma tarefa `remove_audio` (AUDIO-002/003). (O2) `cost = 1` (QUOTA-008, RN5 dos UC). |
| **Vídeo de resultado de um recorte** | — | (R-T1) Duração = `endMs − startMs`, com a tolerância de um fotograma que vem da quantização em fotogramas (TRIM-008). (R-T2) Mesma taxa de fotogramas e mesma resolução de apresentação do original, exceto o corte de 1 px de uma dimensão ímpar quando o vídeo é recodificado (TRIM-009, Q-ADD-25). (R-T3) MP4 H.264/AAC (TRIM-010, RN3). (R-T4) A stream de vídeo só é copiada quando o instante inicial coincide com um *keyframe*, e é copiada nesse caso (TRIM-010; mecanismo na D-49). (R-T5) Contém só os fotogramas e o áudio do intervalo (TRIM-008). |
| **Vídeo de resultado de uma remoção de áudio** | — | (R-A1) Zero streams de áudio (AUDIO-005). (R-A2) Stream de vídeo H.264 de origem copiada sem recodificação (MP4, MOV e AVI com H.264); MPEG-4 Part 2 (AVI) recodificado para H.264 (AUDIO-005, T-05). (R-A3) Mesma duração, resolução e taxa de fotogramas (AUDIO-006); com cópia, nem o corte de 1 px se aplica. |
| **Vídeo de resultado de uma alteração de velocidade** | — | (R-S1) Duração = `durationMs / factor`, com a tolerância de um fotograma (SPEED-006). (R-S2) Áudio, se existir, com a mesma duração do vídeo e sem mudança de tom além da do `atempo` (SPEED-007, RN9, Q2 do UC-VID-003). (R-S3) Mesma resolução de apresentação, exceto o corte de 1 px (SPEED-008, Q-ADD-25). (R-S4) MP4 H.264/AAC (SPEED-008). (R-S5) Mesma taxa de fotogramas do original: `fps=<taxa original>` depois do `setpts` (D-52). |

Projeto e Utilizador continuam a ser raízes de outros contextos (baseline); o Vídeo é da B001 e a Tarefa da B003.

## Domain Events

Os eventos da tarefa são os da B003 (`OperacaoSubmetida`, `OperacaoRejeitada`, `TarefaAceite`, `TarefaIniciada`, `ProgressoTarefa`, `TarefaConcluida`, `TarefaFalhada`, `CancelamentoPedido`, `CreditosDevolvidos`, `VideoTaskUpdate`, …), sem mudanças. Este bolt acrescenta:

| Event | Trigger | Payload |
|-------|---------|---------|
| **OperacaoValidada** | `POST …/videos/validate` com um passo `trim`, `remove_audio` ou `speed` (chamada com *debounce* a cada alteração no painel, T-01) | `{valid, cost, totalSteps, output, errors}` da B003: o painel mostra a duração prevista a partir do `output.durationMs` e os erros por campo. Sem tarefa, sem quota |
| **ModoVideoDecidido** (D-49) | O worker verificou o *keyframe* de um recorte com `CopiaNoKeyframe` | `taskId`, `videoMode: copy \| encode`, `keyframeMs?` → só no log e no `metadata` da resposta `completed`, para a verificação da TRIM-010 |
| **IntervaloMarcado** (só interface) | "Definir Início" / "Definir Fim" com o leitor numa posição | instante do leitor em ms → preenche o seletor (TRIM-003) |
| **LoopPreviewIniciado** / **Terminado** (só interface) | "Pré-visualizar Corte" | `startMs`, `endMs` → o leitor repete só o intervalo, sem tarefa nem quota (TRIM-007, FA1 do UC-VID-001) |
| **RemocaoAudioConfirmada** (só interface) | O utilizador confirma a janela que avisa da supressão do áudio | → só então o painel submete a operação (AUDIO-004) |

## Domain Services

| Service | Operations | Dependencies |
|---------|------------|--------------|
| **OperacaoRecorte** (`trim`, registo T-01) | `validate(parameters, inputProps, profile)`: forma (D-50), `INVALID_INTERVAL`, `OUT_OF_BOUNDS`, intervalo mínimo (D-51). `estimate(inputProps, parameters)`: `durationMs = endMs − startMs`; contentor MP4, vídeo H.264, áudio AAC se a entrada tiver áudio; dimensões de apresentação, `rotation: 0` e dimensões ímpares cortadas ao par (o caso da recodificação; com cópia o FFprobe do resultado dá os valores reais, T-02); `fpsNum`/`fpsDen` iguais; `sizeBytes` desconhecido. `cost = 1`. `copyable`: vídeo não (o `trim` altera-o; a exceção do *keyframe* é a CopiaNoKeyframe da D-49), áudio não (o `atrim` altera-o; com a cópia no *keyframe* o áudio segue o vídeo) | PropriedadesVideo |
| **OperacaoRemoverAudio** (`remove_audio`) | `validate`: `audioCodec === null` → `NO_AUDIO_STREAM` (AUDIO-001/002, exceção do UC-VID-002). `estimate`: tudo igual exceto `audioCodec: null`, contentor MP4 e vídeo H.264; se a entrada já é H.264, o vídeo é copiado e as dimensões e a rotação mantêm-se; senão (MPEG-4 Part 2), aplica-se a regra da recodificação. `cost = 1`. `copyable`: vídeo sim; áudio não existe à saída (o plano dá `audio: none`) | PropriedadesVideo, PoliticaFormatos (B001) |
| **OperacaoVelocidade** (`speed`) | `validate`: `INVALID_SPEED_FACTOR`, `SPEED_FACTOR_OUT_OF_RANGE`, `NO_CHANGES` com o fator 1.0 (D-53). `estimate`: `durationMs = round(durationMs / factor)`; MP4 H.264, AAC se houver áudio; dimensões da recodificação; taxa de fotogramas igual à da entrada (D-52). `cost = 1`. `copyable`: vídeo não, áudio não | PropriedadesVideo |
| **PlaneadorExecucao** (B003, estendido por acréscimo) | Sem mudanças para `remove_audio` e `speed`. Para o recorte, acrescenta `CopiaNoKeyframe` quando as condições da D-49 se cumprem | RegistoOperacoes, PoliticaFormatos |
| **FiltrosRecorte** (worker, `ops/trim.py`) | Vídeo: `trim=start=s:end=e,setpts=PTS-STARTPTS`; áudio: `atrim=start=s:end=e,asetpts=PTS-STARTPTS` (T-02). Com a cópia da D-49, sem filtros: opções de entrada `-ss`/`-to` | ExecutorCadeias (B003) |
| **FiltrosRemoverAudio** (worker, `ops/remove_audio.py`) | Sem filtros de vídeo; o ramo de áudio é descartado (`-an`, T-02), o que o plano já exprime com `audio: none` | ExecutorCadeias |
| **FiltrosVelocidade** (worker, `ops/speed.py`) | Vídeo: `setpts=PTS/f,fps=<taxa original>` (D-52); áudio: `atempo` pela CadeiaAtempo (T-02) | ExecutorCadeias |
| **VerificadorKeyframe** (worker, D-49) | `haKeyframeEm(ficheiro, atMs)` com o FFprobe, antes de montar o comando; devolve `copy` ou `encode` | FFprobe |
| **ValidacaoEmTempoReal** (frontend) | Verificações triviais no cliente (formato `hh:mm:ss.mmm`, número no campo do fator); o resto pelo `validateVideoSteps` da B003, com *debounce* (T-01) | `lib/video-tasks.ts` (B003) |

## Repository Interfaces

Sem repositórios novos. O contexto usa os da B003 e da B001 tal como estão:

| Repository | Entity | Methods |
|------------|--------|---------|
| **RepositorioVideos** (B001/B003) | Vídeo | `obterConcluidos(projectId, videoIds)` (as propriedades de entrada), `criarResultado(video)` |
| **RepositorioTarefas** (B003) | Tarefa de vídeo | Os da B003, sem métodos novos |
| **RegistoOperacoes** (B003) | — | `obter(operation, version)`: passa a devolver os três módulos novos, sempre registados (ao contrário da `test_reencode`, que continua só com `VIDEO_TEST_OPERATIONS=1`, D-37) |
| **RegistoOpsWorker** (B003, `Tools/video/ops/`) | — | `obter(operation)` → `video_filters`, `audio_filters` (e, para o recorte, as opções de entrada da D-49) |

## Ubiquitous Language

| Term | Definition |
|------|------------|
| **Recorte** (*trim*) | Operação que conserva só o intervalo `[início, fim]` de um vídeo e cria um vídeo novo. |
| **Instante inicial / final** | Limites do intervalo, em milissegundos na API e em `hh:mm:ss.mmm` na interface. |
| **Duração prevista** | Duração do resultado calculada antes de submeter: `fim − início` no recorte, `duração / fator` na velocidade. Vem do `estimate`, pelo endpoint de validação. |
| ***Scrubbing*** | Arrastar ou posicionar o leitor e usar a posição atual como instante inicial ou final. |
| ***Loop preview*** | Reprodução repetida, só no navegador, do intervalo selecionado, sem tarefa nem quota. |
| ***Keyframe*** | Fotograma codificado sem depender de outros (I-frame); só a partir dele se pode copiar a stream de vídeo sem a recodificar. |
| **Cópia no *keyframe*** | Recorte em que o vídeo é copiado com `-ss/-to` porque o instante inicial coincide com um *keyframe* (TRIM-010). |
| **Remoção de áudio** | Operação que cria um vídeo novo sem nenhuma stream de áudio. |
| **Vídeo silencioso** | Vídeo sem streams de áudio (`audioCodec: null`); não admite a remoção de áudio. |
| **Fator de velocidade** | Multiplicador da cadência: > 1 acelera, < 1 abranda; intervalo homologado 0.25× a 4.0×. |
| **Fator predefinido** | Um dos botões 0.25×, 0.5×, 0.75×, 1.25×, 1.5×, 2.0× e 4.0×. |
| **`atempo`** | Filtro do FFmpeg que muda a cadência do áudio mantendo o tom; aceita 0.5 a 100 por instância. |
| **Corte de 1 px** | Redução de uma dimensão ímpar ao par abaixo quando o vídeo é recodificado (T-02, Q-ADD-25). |
| **Painel de operação** | Componente do frontend com os controlos de uma operação, a duração prevista, os erros e, depois de submeter, o progresso da tarefa (peças da B003). |

## Cobertura das stories

### ST-VID-001 — Recortar vídeo

- ✅ **AC1** (tarefa e MP4 H.264/AAC com exatamente o intervalo, com a resolução e a taxa de fotogramas do original): OperacaoRecorte, R-T1, R-T2, R-T3, R-T5; mecânica da B003.
- ✅ **AC2** (vídeo recodificado para a precisão ao milissegundo, copiado só com o início num *keyframe*; áudio que pode ser copiado; corte de 1 px): FiltrosRecorte, R-T2, R-T4; mecanismo e áudio pela **D-49**.
- ✅ **AC3** (`INVALID_INTERVAL`, `OUT_OF_BOUNDS` antes de criar tarefa ou reservar quota): IntervaloRecorte, O1; forma dos parâmetros pela **D-50**, intervalo mínimo pela **D-51**.
- ✅ **AC4** (falha ou cancelamento sem alterar o original, sem segmento parcial, com devolução): mecânica da B003 (T2, T3).
- ✅ TRIM-001 a 004 e 007 (introdução, *scrubbing*, duração prevista, *loop preview*): InstanteTemporal, IntervaloMarcado, LoopPreviewIniciado, OperacaoValidada.

### ST-VID-002 — Remover áudio

- ✅ **AC1** (sem streams de áudio; vídeo H.264 copiado): OperacaoRemoverAudio, R-A1, R-A2, R-A3.
- ✅ **AC2** (vídeo sem áudio ou recurso não elegível → erro antes da tarefa): `NO_AUDIO_STREAM`, O1; elegibilidade pelos passos 4 e 5 da B003.
- ✅ **AC3** (assíncrona, progresso ≥ 1×/s, não destrutiva, quota e falhas comuns): mecânica da B003. Com a cópia, o FFmpeg termina depressa; o progresso continua a sair a cada 0,5 s (B003, correção 2).
- ✅ AUDIO-004 (confirmação explícita): RemocaoAudioConfirmada.

### ST-VID-003 — Alterar velocidade

- ✅ **AC1** (fator de 0.25× a 4.0×, duração prevista, MP4 com vídeo e áudio sincronizados): OperacaoVelocidade, CadeiaAtempo, R-S1 a R-S4; taxa de fotogramas pela **D-52**.
- ✅ **AC2** (fator nulo, não positivo ou fora dos limites rejeitado antes da tarefa): FatorVelocidade, O1; o fator 1.0 pela **D-53**.
- ✅ **AC3** (falha ou cancelamento sem saída parcial, com devolução): mecânica da B003.
- ✅ SPEED-001 a 003 (predefinições, valor manual, duração prevista): FatorVelocidade, OperacaoValidada.

### Verificações sem propriedade (D-03)

- ↪ **NFR-010** (FFmpeg em Docker, dona: B001), **NFR-013** (uma recodificação por cadeia) e **NFR-018** (saída MP4 H.264/AAC), donas: B003: verificadas nos resultados destas três operações; a cópia (remoção de áudio, recorte num *keyframe*) não recodifica nenhuma vez.

## Decisões tomadas no checkpoint do Estágio 1

Respondidas pela equipa e registadas em `docs/specsDuvidas.md`:

1. **D-49 (a):** cópia condicionada no plano. O serviço de projetos decide se a cópia é permitida (`CopiaNoKeyframe {atMs}`); o worker só verifica o *keyframe* com o FFprobe (instante relativo ao primeiro fotograma, arredondado ao milissegundo) e indica o modo no `metadata` do `completed`. O áudio segue o vídeo, porque a TRIM-010 diz que o áudio "pode" ser copiado, não que tem de ser.
2. **D-50 (a):** `trim {startMs, endMs}` (milissegundos inteiros), `remove_audio {}`, `speed {factor}`, versão 1; `INVALID_INTERVAL {field}`, `OUT_OF_BOUNDS {field, durationMs}`, `INVALID_SPEED_FACTOR`, `SPEED_FACTOR_OUT_OF_RANGE {min, max}`; campos a mais ignorados.
3. **D-51 (a):** intervalo mais curto do que um fotograma → `INVALID_INTERVAL {minDurationMs}`, antes da tarefa e da reserva.
4. **D-52 (b):** `setpts=PTS/f,fps=<taxa original>`; o resultado mantém a taxa de fotogramas (REQ-VID-SPEED, "reamostragem temporal dos fotogramas", e coerência com a TRIM-009). A equipa escreveu "(a)", mas com o conteúdo da opção (b), que era a recomendação; regista-se pelo conteúdo.
5. **D-53 (b):** fator 1.0 → `NO_CHANGES`, antes da tarefa e sem quota; as predefinições da SPEED-001 não incluem 1.0×, e é coerente com o `NO_CHANGES` do ajuste (ADD 4.3). A equipa escreveu "(a)", com o conteúdo da opção (b); regista-se pelo conteúdo.
