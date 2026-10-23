---
unit: 003-video-composition
bolt: 008-video-concat-chain
stage: model
status: complete
updated: 2026-10-23T00:39:08Z
---

# Static Model - Junção de vídeos, cadeias de operações e predefinições de vídeo

Fontes, por ordem de precedência: `docs/add.md` (ADD v1.1, mestre: 2.6, T-01 a T-05, T-10, 4.8, 4.9, Q-ADD-13, Q-ADD-16, Q-ADD-25), `docs/specsDuvidas.md` (D-03, D-06, D-07, D-10, D-35, D-40, D-42 a D-45, D-49, D-50, D-60, D-61, D-75), `memory-bank/standards/decision-index.md` (ADR-004, ADR-005, ADR-007, ADR-008, ADR-010, ADR-011, ADR-013 e ADR-015), `bolt.md` e as stories ST-VID-013 e ST-VID-014, `docs/requirements/REQ-VID-CONCAT.md`, `REQ-VID-CHAIN.md` e `REQ-VID-NFR.md` (NFR-013, 014, 022 a 024), `docs/use-cases/UC-VID-013.md` e `UC-VID-014.md`. Base: o modelo de domínio da B003 (`ddd-01-domain-model.md`), que este contexto estende, e os das B004, B005 e B007 para as operações elegíveis como passo. Modelo estático, sem leitura de código (restrição do estágio).

Os pontos que as fontes não decidem foram registados em `docs/specsDuvidas.md` como D-78 a D-84 e respondidos pela equipa no checkpoint deste estágio; o modelo cita-os como (D-xx).

## Bounded Context

**Composição de vídeo (junção e cadeia).** Acrescenta ao contexto de tarefas da B003 duas formas de compor operações já existentes num único resultado, numa única tarefa e com uma única recodificação de vídeo:

- **Junção** (`concat`, UC-VID-013): concatena 2 ou mais clips do projeto pela ordem da linha temporal, com corte seco, normalizados à resolução e à taxa de fotogramas do primeiro clip. É um passo com `parameters.clips: [{videoId, steps}]` (T-01); uma junção isolada é uma cadeia de um só passo `concat` em que todas as sub-cadeias estão vazias (4.8).
- **Cadeia** (UC-VID-014): sequência ordenada de até 10 passos, contando as sub-cadeias, a junção e os passos finais, validada em três fases e executada atomicamente; com junção, cada clip tem a sua sub-cadeia e os passos seguintes aplicam-se ao resultado da junção (FA1).
- **Predefinições de vídeo** (CHAIN-014): cadeias sem junção guardadas com um nome na conta do utilizador, numa coleção nova do serviço de utilizadores, e reutilizáveis em novas cadeias (4.9; o lote fica de fora, D-06).

Este contexto não muda a mecânica da B003 (aceitação, lugar, reserva e devolução, executor, progresso, cancelamento, publicação) nem as regras das operações das B004, B005 e B007: usa-as e estende-as só por acréscimo (regra 2.6).

Fronteiras e contextos vizinhos:

- **Tarefas, quota e executor (B003, Unit 001):** dono do `VideoTask`, do lugar de tarefa ativa, da quota, do registo de operações, do plano de execução e do executor com um único `-filter_complex`. Este contexto acrescenta-lhe a operação `concat`, o validador de estrutura, a agregação do custo e a rota de operações sem `:video`.
- **Operações elegíveis (B004, B005, B007, Unit 002):** `trim`, `remove_audio`, `speed`, `watermark`, `adjust`, `filter`, `resize`, `orient` e `convert`, cada uma com `validate`, `estimate`, `cost` e `copyable` (T-01) e com os seus extras do plano (ADR-007, ADR-008, ADR-011, ADR-013). Este contexto chama-as como passos, pela ordem, com as propriedades estimadas à saída do passo anterior (CHAIN-003); não repete as suas regras.
- **Ciclo de vida do vídeo (B001, B002):** dono do agregado Vídeo, da matriz de formatos e dos limites por perfil. Os clips são Vídeos `completed`; o resultado é um Vídeo novo com `sourceVideoIds` e `recipe`.
- **Identidade e perfis (serviço de utilizadores):** passa a ser também dono das predefinições de vídeo (`users/models/videoPreset.js`), sem tocar nas predefinições de imagem (`preset.js`, `presets.js`).
- **Interface de edição (frontend):** a linha temporal da junção e o editor de cadeia são componentes novos com o dnd-kit; os componentes de imagem (`applied-tools-list.tsx`, `sortable-tool-item.tsx`, diálogo de predefinições de imagem) não mudam, e o diálogo de imagem nunca recebe cadeias de vídeo (4.9).
- **Fora deste contexto:** transições entre clips (Q-ERS-006); lotes, incluindo carregar uma predefinição num lote (D-06); extração de fotogramas, que só aparece aqui como passo proibido (D-05, D-79).

## Domain Entities

| Entity | Properties | Business Rules |
|--------|------------|----------------|
| **Tarefa de vídeo** (`VideoTask`, B003, referência) | Ver o modelo da B003. Aqui: `kind = concat` quando a cadeia tem uma junção (incluindo a junção isolada) e `chain` quando tem vários passos sem junção (regra do TipoTarefa da B003; ADD 4.8 e 4.9); `steps` = EstruturaCadeia; `totalSteps` = ContagemPassos; `cost` = `totalSteps`; `inputVideoIds` = os vídeos da cadeia pela ordem, com repetições numa junção | Só existe depois de as três fases da validação passarem (COM-004; CHAIN-007, 008, 016 a 018; CONCAT-005 a 007). Uma tarefa por cadeia, que ocupa o lugar de tarefa ativa do projeto (CHAIN-010, RN9). Falha ou cancelamento não publica resultado e devolve `reservedCredits` (todos os créditos da cadeia) (CHAIN-013, CONCAT-011; B003 T2 e T3). |
| **Clip** (ocorrência de um Vídeo numa junção) | `videoId`; `clipIndex` (posição na linha temporal); `steps` (sub-cadeia, possivelmente vazia) | O Vídeo tem de existir no projeto, estar `completed`, ter formato admitido e estar dentro dos limites do perfil; o erro indica o `videoId` e o `clipIndex` (4.8; D-80). Cada ocorrência é um clip distinto e conta para o número de clips e para a duração total (FA2, CONCAT-006/007). O Vídeo de origem nunca é alterado (RN11 do UC-VID-013). |
| **Vídeo de resultado** (B001/B003, criação) | Ver o modelo da B003: `_id` = `_id` da tarefa (ADR-005); `sourceVideoIds`; `recipe = steps`; `originalName` = o da primeira origem com a extensão do contentor real (D-35, D-75); `meta` do FFprobe ao ficheiro produzido | Numa junção, `sourceVideoIds` = os `videoId` dos clips pela ordem da linha temporal, com repetições (CONCAT-001, RN10). Numa cadeia sem junção, `[videoId]`. Só o vídeo final é gravado; nenhum resultado intermédio chega ao projeto nem ao storage (CHAIN-011, RN10). Nome sugerido no descarregamento: os passos de topo do `recipe` no sufixo (`ferias_concat_watermark.mp4`, D-35); os passos dos clips não entram no sufixo. |
| **Predefinição de vídeo** (`VideoPreset`, nova, serviço de utilizadores) | `id`; `ownerId`; `name`; `steps` (lista de PassoOperacao); `createdAt`, `updatedAt` | Pertence a um só utilizador e não é partilhada (4.9). Nome único por dono (4.9; regras do nome pela D-83). Sem junção (CHAIN-014, FA3) e com a estrutura válida de uma cadeia (D-79, D-83). Só o dono a lê e altera; o `anonymous` não tem predefinições (403, RN1). Não aparece no diálogo de predefinições de imagem (4.9). Carregada numa nova cadeia, os passos são validados contra o vídeo dessa cadeia (D-83). |
| **Utilizador** (referência externa, baseline) | `id`; `tipoPerfil` (`anonymous`, `free` = Registado, `premium`) | O perfil do executor (`runnerId`) fixa os LimitesPerfil e a quota (QUOTA-005/006). `anonymous` não submete cadeias nem guarda predefinições. |

## Value Objects

| Value Object | Properties | Constraints |
|--------------|------------|-------------|
| **PassoOperacao** (B003) | `operation`, `version`, `parameters` | Contrato uniforme (COM-006, T-01). Operações elegíveis: `trim`, `remove_audio`, `speed`, `watermark`, `adjust`, `filter`, `resize`, `orient`, `convert` e `concat` (CHAIN-002, RN2). `extract_frames` é um nome reservado e proibido (D-79). Imutável depois de aceite: é o `recipe` do resultado. |
| **ParametrosJuncao** (`concat` v1) | `clips: [{videoId, steps}]` | `2 ≤ clips.length ≤ maxClips(perfil)`, contando as repetições (CONCAT-005/006, NFR-022, NFR-014 na parte da junção). Cada `steps` é uma sub-cadeia (lista de PassoOperacao), possivelmente vazia; não pode ter `concat` nem `convert` (D-79). |
| **EstruturaCadeia** | passos de topo; numa junção, os clips com as sub-cadeias | Não vazia (`empty_chain`, CHAIN-007). No máximo uma junção (`multiple_concat`, CHAIN-017) e, havendo-a, é o primeiro passo de topo (`concat_not_first`, D-78). `convert` só como último passo de topo (`convert_not_last`, CHAIN-016). Sem `extract_frames` (`frame_extraction`, CHAIN-018). Violação → 422 `INVALID_CHAIN {rule}` (D-79). |
| **ContagemPassos** | `N` | `N` = número de passos de topo (a junção conta 1) + soma dos passos de todas as sub-cadeias (RN5, CHAIN-008). `N ≤ 10` para qualquer perfil; acima → `CHAIN_TOO_LONG {total, limit: 10}` (NFR-023, FA6, D-80). Exemplo da CHAIN-009: três clips com um passo cada + junção + marca de água = 5. É também o `totalSteps` da tarefa (TASK-008). |
| **CustoCadeia** | `cost` | `cost = N` (um crédito por passo, a junção conta 1, DQ-014, QUOTA-008, CHAIN-009); uma junção isolada custa 1 (RN8 do UC-VID-013). Reserva de uma vez na aceitação; Premium sem reserva (T-04). Para o Registado, `N > 5` falha sempre por quota (DQ-025): a interface avisa antes. |
| **LimitesPerfil** (B001, referência) | `maxClips`: 10 (Registado), 50 (Premium); `maxDurationMs`: 5 min (Registado), 60 min (Premium); `maxSteps`: 10 | Aplicados a cada vídeo de entrada (passo 5 da aceitação), à saída de cada sub-cadeia, à soma na junção e ao resultado final; não às saídas intermédias (4.8, 4.9 fase 3, D-81). `LIMIT_EXCEEDED {total, limit}` e, quando é um clip, `{clipIndex}` (D-80). |
| **LinhaTemporal** (interface e pedido) | clips por ordem | A ordem de seleção é a ordem inicial (CONCAT-002); reordenável e com remoção antes de confirmar (CONCAT-013, CONCAT-003). Com menos de 2 clips a confirmação fica bloqueada (FA1 do UC-VID-013). |
| **PropriedadesVideo à saída da junção** (`estimate` da `concat`) | como na B003 | `durationMs` = soma das durações à saída de cada sub-cadeia (CONCAT-004, CONCAT-010). `displayWidth × displayHeight` e `fpsNum/fpsDen` = os do primeiro clip à saída da sua sub-cadeia, em dimensões de apresentação (CONCAT-012, Q-ADD-13), com cada dimensão ímpar arredondada ao par abaixo (Q-ADD-25, CONCAT-008); `rotation: 0`. `audioCodec` = AAC se pelo menos um clip tiver áudio à saída da sua sub-cadeia, senão `null` (RN6, RN7). Contentor MP4, vídeo H.264 (DQ-013). `sizeBytes` desconhecido. |
| **NormalizacaoClip** (derivado, worker) | `W×H`, `F` (alvo); modo de áudio da junção | Vídeo: `scale=W:H:force_original_aspect_ratio=decrease,pad=W:H:(ow-iw)/2:(oh-ih)/2,fps=F,setsar=1,format=yuv420p`, depois da sub-cadeia e com a rotação já aplicada, para centrar o clip com barras pretas sem o deformar (T-02, CONCAT-008). Áudio, quando a junção tem áudio: `aresample=48000,aformat=channel_layouts=stereo` (4.8, riscos), ou `anullsrc=r=48000:cl=stereo` com `atrim=duration=<d do clip>` num clip sem áudio (CONCAT-009). Sem áudio em nenhum clip: `concat … a=0` e sem ramo de áudio. |
| **PlanoJuncao** (parte do PlanoExecucao da B003) | entradas (uma por ocorrência, ficheiros distintos descarregados uma vez); sub-plano por clip; `W×H`, `F`; modo de áudio (`concat` \| `none`) | O vídeo é sempre recodificado (a junção altera-o; `copyable` falso) e só uma vez, na mesma invocação (NFR-013). Um clip repetido é passado como várias entradas `-i` do mesmo ficheiro, sem `split` (4.8). A cópia no *keyframe* do recorte (ADR-007) não se aplica dentro de uma junção, porque outro passo altera o vídeo (D-49). Calculado no serviço de projetos; o worker não repete a decisão (T-01). |
| **PassoCorrenteAproximado** (B003) | `step`, `totalSteps = N`, `progress` | `step = min(N, floor(progress / 100 × N) + 1)` (D-40, Q-ADD-16): um "passo k de N" que avança com o progresso global, sem fronteiras reais entre passos (CHAIN-012). |
| **FaseFalha** | `phase` ∈ `download`, `encode`, `upload` | Indicada no erro de uma tarefa falhada em vez do passo (exceção 7 do UC-VID-014, Q-ADD-16, ST-VID-014 AC4); o `code` continua `PROCESSING_ERROR`. Sem fase quando a falha não acontece no worker (D-82). |
| **ErroCadeia** | `code` + detalhes | `INVALID_CHAIN {rule, index?, clipIndex?, stepIndex?}` (D-79); `CHAIN_TOO_LONG {total, limit}`; `INSUFFICIENT_INPUTS`; `TOO_MANY_INPUTS {limit}` (4.8); `LIMIT_EXCEEDED {total, limit, clipIndex?}`; `UNSUPPORTED_FORMAT`, `NOT_FOUND` e `RESOURCE_NOT_READY` com `{videoId, clipIndex}`; `INVALID_STEP_PARAMS {index, clipIndex?, stepIndex?, errors}` (D-42, D-80); `INVALID_REQUEST {field: "steps"}` para a rota errada (D-78). Todos com 422 (409 no `RESOURCE_NOT_READY`, 404 no `NOT_FOUND`) e sem tarefa nem quota. |
| **NomePredefinicao** | texto | Com `trim()`, de 1 a 50 caracteres, único por dono sem distinguir maiúsculas; repetido → 409 `PRESET_NAME_TAKEN` (D-83). |

## Aggregates

| Aggregate Root | Members | Invariants |
|----------------|---------|------------|
| **Tarefa de vídeo** (B003) | EstruturaCadeia, ContagemPassos, CustoCadeia | Mantém T1 a T8 da B003. (C1) A estrutura, os passos (cada um face às propriedades estimadas à saída do anterior, CHAIN-003) e os limites passaram antes de a tarefa existir. (C2) `totalSteps = cost = N` e `reservedCredits ∈ {0, N}` (CHAIN-009, QUOTA-008). (C3) No máximo uma recodificação de vídeo para toda a cadeia, incluindo as sub-cadeias e os passos finais (NFR-013, RN12); uma cadeia só de passos copiáveis copia as streams (T-05). (C4) Atómica: em `failed` ou `cancelled` não há Vídeo de resultado nem objetos ou temporários, e os `N` créditos são devolvidos uma vez (CHAIN-013, CONCAT-011, D-45). (C5) Um só `taskId` e um só lugar de tarefa ativa para toda a cadeia (CHAIN-010). |
| **Vídeo de resultado de uma junção** | — | (J1) Clips pela ordem da linha temporal, com corte seco (RN4, CONCAT-010); duração = soma das durações dos clips à saída das sub-cadeias, com a tolerância de um fotograma por clip da quantização em fotogramas. (J2) Todo o vídeo em `W×H` a `F` fps, os do primeiro clip à saída da sua sub-cadeia em dimensões de apresentação, com o corte de 1 px de uma dimensão ímpar; os outros clips centrados, com barras pretas e sem distorção (CONCAT-008, RN5). (J3) Se pelo menos um clip tiver áudio: uma só stream de áudio contínua, com silêncio na posição e com a duração de cada clip sem áudio; senão, nenhuma stream de áudio (CONCAT-009, CONCAT-010, RN6, RN7). (J4) MP4 H.264/AAC, ou H.264 sem áudio (NFR-018). (J5) `sourceVideoIds` pela ordem, com repetições (CONCAT-001). |
| **Vídeo de resultado de uma cadeia** | — | (K1) Igual a aplicar os passos pela ordem: cumpre os invariantes do resultado de cada operação (B004 R-T*, R-A*, R-S*; B005; B007) face às propriedades à saída do passo anterior; com junção, as sub-cadeias aplicam-se a cada clip e os passos finais ao resultado da junção (CHAIN-005, CHAIN-006). (K2) `recipe` = os passos, incluindo as sub-cadeias dentro da junção (STORAGE-004). (K3) MP4 H.264/AAC, salvo quando o último passo é `convert` (RN13). |
| **Predefinição de vídeo** | NomePredefinicao, PassoOperacao | (P1) `(ownerId, nome)` único. (P2) Sem `concat` (CHAIN-014). (P3) Estrutura válida: 1 a 10 passos, `convert` só no fim, sem `extract_frames`, operações e versões conhecidas (D-79, D-83). (P4) Só o dono a vê e altera; sem partilha (4.9). (P5) Sem os campos que o servidor grava (`_mark`, `_input`), que voltam a ser calculados quando a cadeia é validada (ADR-010, D-83, D-84). |

Projeto e Utilizador continuam a ser raízes de outros contextos (baseline); o Vídeo é da B001 e a Tarefa da B003.

## Domain Events

Os eventos da tarefa são os da B003 (`TarefaAceite`, `TarefaIniciada`, `ProgressoTarefa`, `TarefaConcluida`, `TarefaFalhada`, `CancelamentoPedido`, `CreditosDevolvidos`, `VideoTaskUpdate`, …), sem mudanças de significado. Este bolt acrescenta:

| Event | Trigger | Payload |
|-------|---------|---------|
| **CadeiaValidada** | `POST …/videos/validate` (com *debounce*) a cada alteração no editor ou na linha temporal (T-01) | `{valid, cost: N, totalSteps: N, output, errors}`: o editor mostra o custo, a duração estimada e, na junção, `W×H` a `F` fps (CONCAT-004, CONCAT-012, CHAIN-009); sem tarefa nem quota; resposta em ≤ 1 s (D-43) |
| **CadeiaRejeitada** | Falha numa das três fases, na validação ou na aceitação | `ErroCadeia` (D-80) → sem tarefa, sem quota |
| **TarefaCadeiaAceite** | Aceitação de uma cadeia ou junção (passos 1 a 11 da B003, com os passos 4 e 5 por clip) | `taskId`, `kind`, `totalSteps: N`, `cost: N` → 202 `{taskId, status: "queued"}` |
| **ProgressoCadeia** | `ProgressoTarefa` de uma tarefa com `N > 1` | `step` aproximado (D-40), `totalSteps: N`, `progress` → `video-task-update` (CHAIN-012) |
| **TarefaFalhadaComFase** | O worker falha ao descarregar, codificar ou enviar | `taskId`, `error: {code: PROCESSING_ERROR, phase}` → `failed`, devolução dos `N` créditos, sem resultado (D-82) |
| **ClipAdicionado** / **ClipRemovido** / **ClipReordenado** (só interface) | Seleção, remoção ou arrasto na linha temporal | linha temporal nova → revalidação (CONCAT-002, 003, 013) |
| **PassoAdicionado** / **PassoRemovido** / **PassoReordenado** (só interface) | Alteração no editor, na cadeia principal ou na sub-cadeia de um clip | cadeia nova → revalidação dos passos afetados e do custo (CHAIN-004, CHAIN-015, FA2); com `N = 10`, acrescentar fica bloqueado (CHAIN-008) |
| **AvisoQuotaRegistado** (só interface) | Registado com `N > 5` ou `N` acima das operações restantes | aviso antes de confirmar (DQ-025, ADD 4.9 riscos) |
| **PredefinicaoGuardada** / **Alterada** / **Apagada** | `POST`, `PATCH` ou `DELETE /users/:user/video-presets…` | `presetId`, `ownerId`, `name` |
| **PredefinicaoCarregada** (só interface) | O utilizador escolhe uma predefinição numa nova cadeia | `presetId` → os passos substituem os da lista escolhida e são validados contra o vídeo (D-83, D-84) |

## Domain Services

| Service | Operations | Dependencies |
|---------|------------|--------------|
| **ValidadorCadeia** (serviço de projetos, novo) | `validar(steps, entradas, perfil)` em três fases, por esta ordem (D-80): (1) **estrutura**: `empty_chain`, `concat_not_first`, `multiple_concat`, `convert_not_last`, `frame_extraction` (também dentro das sub-cadeias) e `CHAIN_TOO_LONG` (D-78, D-79); (2) **passos**: cada sub-cadeia a partir das propriedades do seu clip, depois a junção com as saídas dos clips, depois os passos finais, cada `validate` com as propriedades estimadas à saída do anterior (CHAIN-003, RN6); (3) **limites**: saída de cada clip e resultado final (D-81). Devolve `cost`, `totalSteps`, `output` e os erros | RegistoOperacoes (B003), LimitesPerfil |
| **OperacaoJuncao** (`concat`, registo T-01) | `validate`: `INSUFFICIENT_INPUTS` (< 2 clips), `TOO_MANY_INPUTS {limit}`, `LIMIT_EXCEEDED {total, limit}` com a soma das durações à saída dos clips, contando as repetições (CONCAT-005 a 007). `estimate`: PropriedadesVideo à saída da junção. `cost = 1`. `copyable`: vídeo não, áudio não. As propriedades de saída dos clips são calculadas pelo ValidadorCadeia; a forma de as fazer chegar ao `validate` sem mudar a assinatura da B003 fica para a etapa 2 | ValidadorCadeia, PropriedadesVideo |
| **AceitacaoOperacao** (B003, estendida por acréscimo) | Rota sem `:video` para cadeias com junção (D-78); passos 4 e 5 (existe, `completed`, formato, limites) para cada vídeo distinto da junção, com o erro no primeiro `clipIndex` em que aparece (4.8, D-80); `validate` substituído pelo ValidadorCadeia; reserva de `N` créditos de uma vez (T-04) | ValidadorCadeia, RepositorioVideos, PlaneadorExecucao, ServicoQuota (B003) |
| **PlaneadorExecucao** (B003, estendido por acréscimo, padrão do ADR-008) | Para uma junção: PlanoJuncao. Para uma cadeia sem junção: o plano da B003 com os extras de cada operação (ADR-007, ADR-008, ADR-011). Uma cadeia que termina em `convert` escolhe o contentor e os codecs de saída e a cópia de pré-visualização do T-06; o ADR-013 só cobre a conversão isolada, por isso a etapa 2 decide como uma cadeia chega a uma saída AVI | RegistoOperacoes, PoliticaFormatos (B001), extras do plano das B004, B005 e B007 |
| **CompiladorJuncao** (worker, `Tools/video/ops/concat.py`) | Sub-grafo de cada clip (os filtros da sua sub-cadeia) → NormalizacaoClip → `concat=n=N:v=1:a=1` (ou `a=0`) → passos finais → codificação única (T-02, 4.8) | ExecutorCadeias e compilador de cadeias (B003), módulos `ops/<op>.py` |
| **ExecutorCadeias** (B003, worker, por acréscimo) | Descarrega cada ficheiro distinto uma vez e passa-o como uma entrada por ocorrência; indica a FaseFalha na resposta `failed` (D-82) | FFmpeg/FFprobe, ArmazenamentoVideo |
| **ServicoPredefinicoesVideo** (serviço de utilizadores, novo) | `listar(ownerId)`, `criar(ownerId, name, steps)`, `alterar(id, name?, steps?)` por `PATCH`, `apagar(id)`, sem limite de número (D-83); recusa o `anonymous` com 403 (RN1); validação só da estrutura ao guardar (D-79, D-83) | RepositorioPredefinicoesVideo, GatewayPerfis |
| **AutorizacaoPredefinicoes** (gateway, router novo) | `videoAuth` em `/users/:user/video-presets…`: 401 sem JWT válido, 403 se o utilizador do token não for o `:user` (T-00, 4.9) | `videoAuth` (B001) |
| **EditorCadeia** (frontend, novo) | Compor, configurar, reordenar e remover passos (CHAIN-001 a 006, 015) com a configuração dos painéis das B004, B005 e B007; sub-cadeias por clip; contador de créditos e duração estimada pelo `CadeiaValidada`; bloquear o 11.º passo; aviso de quota do Registado; guardar e carregar predefinições; acompanhar a tarefa com as peças comuns da B003 (D-47) | `lib/video-tasks.ts`, `use-video-task.ts`, `video-task-progress.tsx` (B003), dnd-kit |
| **LinhaTemporalJuncao** (frontend, novo) | Escolher clips (com repetições), reordenar, remover, mostrar a duração total e `W×H` a `F` fps estimados (CONCAT-001 a 004, 012, 013) | EditorCadeia, dnd-kit |

## Repository Interfaces

| Repository | Entity | Methods |
|------------|--------|---------|
| **RepositorioPredefinicoesVideo** (serviço de utilizadores, coleção nova) | Predefinição de vídeo | `listarPorDono(ownerId)`, `obter(ownerId, id)`, `criar(preset)` (falha com nome repetido), `alterar(ownerId, id, campos)`, `apagar(ownerId, id)` |
| **RepositorioVideos** (B001/B003) | Vídeo | `obterConcluidos(projectId, videoIds)` com os `videoId` distintos dos clips, `criarResultado(video)` |
| **RepositorioTarefas** (B003) | Tarefa de vídeo | Os da B003, sem métodos novos |
| **RegistoOperacoes** (B003) | — | `obter(operation, version)` passa a devolver também a `concat`; o nome `extract_frames` é tratado pelo ValidadorCadeia antes desta consulta (D-79) |
| **RegistoOpsWorker** (B003, `Tools/video/ops/`) | — | `obter("concat")` → CompiladorJuncao |

## Ubiquitous Language

| Term | Definition |
|------|------------|
| **Junção** (*concat*) | Operação que concatena dois ou mais clips, pela ordem da linha temporal, num único vídeo. |
| **Clip** | Uma ocorrência de um vídeo do projeto numa junção; o mesmo vídeo pode aparecer várias vezes. |
| **Linha temporal** | Lista ordenada dos clips de uma junção, reordenável por arrasto. |
| **Primeiro clip** | O clip na posição 0 da linha temporal; a sua resolução e taxa de fotogramas, à saída da sua sub-cadeia, são as do resultado. |
| **Corte seco** | Passagem de um clip para o seguinte sem transição. |
| **Normalização** | Ajuste de cada clip à resolução e à taxa de fotogramas do primeiro, com barras pretas (*letterbox*) quando a proporção difere. |
| **Faixa de silêncio** | Áudio sem som, com a duração do clip, acrescentado aos clips sem áudio quando outro clip tem áudio. |
| **Cadeia** | Sequência ordenada de passos executada numa única tarefa, com uma única recodificação de vídeo e um único resultado. |
| **Composição** | Cadeia com junção: sub-cadeias por clip → junção → passos finais (estilo *Movie Maker*). |
| **Sub-cadeia** | Passos aplicados a um clip antes da junção; pode estar vazia. |
| **Passos finais** | Passos de topo depois da junção, aplicados ao resultado da junção. |
| **Passo de topo** | Passo da cadeia principal, fora das sub-cadeias. |
| **Estrutura da cadeia** | As regras de composição: não vazia, uma junção no máximo e no início, conversão só no fim, sem extração de fotogramas, até 10 passos. |
| **Contagem de passos (N)** | Passos de topo mais passos das sub-cadeias; a junção conta 1. É o custo e o `totalSteps`. |
| **Passo corrente aproximado** | "Passo k de N" derivado do progresso global, porque os passos correm num único grafo. |
| **Fase da falha** | Descarregamento, codificação ou envio: a parte da tarefa em que a falha aconteceu. |
| **Predefinição de vídeo** | Cadeia sem junção guardada com um nome na conta do utilizador, para reutilizar numa nova cadeia. |

## Cobertura das stories

### ST-VID-013 — Juntar vídeos

- ✅ **AC1** (2 a 10 ou 50 clips com repetições, um MP4 pela ordem, corte seco, `sourceVideoIds` pela ordem): ParametrosJuncao, LinhaTemporal, OperacaoJuncao, J1, J4, J5; CONCAT-001, 002, 010, 013.
- ✅ **AC2** (resolução e fps do primeiro clip à saída da sua sub-cadeia, em dimensões de apresentação, com barras pretas): PropriedadesVideo à saída da junção, NormalizacaoClip, J2; CONCAT-008, 012; Q-ADD-13, Q-ADD-25.
- ✅ **AC3** (silêncio quando pelo menos um clip tem áudio; sem áudio se nenhum tiver): NormalizacaoClip, J3; CONCAT-009, 010.
- ✅ **AC4** (menos de 2 clips, limites de clips ou de duração contando as repetições, formato não suportado → rejeição antes da tarefa; custo 1): OperacaoJuncao, AceitacaoOperacao por clip, ErroCadeia, CustoCadeia; CONCAT-005 a 007; endereço dos erros pela **D-80**.
- ✅ **AC5** (falha ou cancelamento sem resultado, com devolução, sem alterar as origens): C4 e a mecânica da B003; CONCAT-011.
- ✅ CONCAT-003 e 004 (remover clip, duração total em tempo real): LinhaTemporalJuncao, CadeiaValidada.
- ✅ **NFR-014** (parte da junção e da cadeia, dona: ST-VID-013, D-10), **NFR-022** e **NFR-024**: LimitesPerfil (`maxClips`, `maxDurationMs`), aplicados antes da tarefa.

### ST-VID-014 — Encadear operações

- ✅ **AC1** (até 10 passos contando sub-cadeias, junção e passos finais; cada passo validado face à saída do anterior; custo e duração estimada): ContagemPassos, CustoCadeia, ValidadorCadeia (fase 2), CadeiaValidada; CHAIN-001 a 006, 009, 015.
- ✅ **AC2** (`INVALID_CHAIN` com a regra para cadeia vazia, conversão fora do fim, mais de uma junção ou extração de fotogramas; `CHAIN_TOO_LONG`; sem tarefa): EstruturaCadeia, ValidadorCadeia (fase 1); CHAIN-007, 008, 016 a 018; nomes das regras e extração pela **D-79**, posição da junção pela **D-78**.
- ✅ **AC3** (uma tarefa, uma recodificação, passo corrente aproximado e progresso global, só o vídeo final gravado): C3, C5, PassoCorrenteAproximado, PlanoJuncao; CHAIN-010 a 012.
- ✅ **AC4** (falha ou cancelamento sem resultado, devolução de todos os créditos, erro com a fase): C4, FaseFalha, TarefaFalhadaComFase; CHAIN-013; forma da fase pela **D-82**.
- ✅ **AC5** (guardar uma cadeia sem junção como predefinição própria e reutilizá-la numa nova cadeia; o lote fica de fora): Predefinição de vídeo, ServicoPredefinicoesVideo, PredefinicaoCarregada; CHAIN-014 sem a parte do lote (D-06); regras pela **D-83** e marcas de imagem pela **D-84**.
- ✅ **NFR-023** (dona): ContagemPassos, `CHAIN_TOO_LONG` antes da tarefa.
- ✅ Limites de duração da fase 3 (exceção 5 do UC-VID-014): LimitesPerfil, pela **D-81**.

### Verificações sem propriedade (D-03, D-10)

- ↪ **NFR-010** (FFmpeg em Docker, dona: B001), **NFR-013** (uma recodificação por cadeia) e **NFR-018** (saída MP4 H.264/AAC), donas: B003: verificadas nos resultados de junções e cadeias (C3, J4, K3); a cadeia termina noutro formato só com `convert`.
- ↪ **NFR-014** na parte da cadeia (UC-VID-014 RN5): verificada pela ST-VID-014 com a contagem de passos e os limites de clips da junção dentro da cadeia.

## Pontos para a etapa 2 (desenho técnico)

Não são dúvidas sobre o domínio: dependem do código, que esta etapa não lê.

1. Como o `validate` da `concat` recebe as propriedades à saída de cada clip sem mudar a assinatura `validate(parameters, inputProps, profile)` da B003 (por exemplo um campo gravado pelo servidor, como o `_mark` do ADR-010 e o `_input` da B004).
2. Como uma cadeia que termina em `convert` (sobretudo para AVI, com a cópia MP4 na mesma invocação do T-06) é executada, já que o ramo do ADR-013 só cobre a conversão isolada.
3. Como o editor configura um passo com os painéis das B004, B005 e B007 sem os mudar, já que esses painéis submetem a operação diretamente.
4. Se a regra do TipoTarefa (`concat` quando há junção) está no código da B003 como o modelo da B003 a descreve.
5. Onde o padrão das predefinições de imagem (`users/routes/presets.js`) difere da D-83.

## Decisões tomadas no checkpoint do Estágio 1

Respondidas pela equipa em 2026-10-23T00:39:08Z e registadas em `docs/specsDuvidas.md`:

1. **D-78 (a):** a junção, quando existe, é o primeiro passo de topo (`concat_not_first` noutra posição); cadeias com junção usam as rotas sem `:video`; a rota errada dá `INVALID_REQUEST {field: "steps"}`.
2. **D-79 (a):** `{rule}` ∈ `empty_chain`, `convert_not_last`, `multiple_concat`, `frame_extraction`, `concat_not_first`; `convert` e junção proibidos nas sub-cadeias; `extract_frames` como nome reservado.
3. **D-80 (a):** estrutura → passos → limites, a parar na primeira fase que falha (a numeração do ADD 4.9 não fixa a precedência); endereços `{index, clipIndex, stepIndex}` e `{videoId, clipIndex}`.
4. **D-81 (a):** limites de duração só nos pontos do ADD, não nas saídas intermédias.
5. **D-82 (a), condicionada:** `error.phase` em todas as tarefas, com `PROCESSING_ERROR`; a etapa 2 acrescenta uma verificação V, confirmada na etapa 4, de que a fase entra na resposta `failed` do worker e no `VideoTask` só com linhas novas; se não der, dúvida nova e paragem.
6. **D-83 (a), alterada:** mudança de nome e de passos por `PATCH /users/:user/video-presets/:id`, como o `presets.js`; sem limite de número (o limite de 4 é das predefinições de imagem); uma verificação V na etapa 2 regista onde o padrão de `presets.js` difere.
7. **D-84 (a):** a marca de imagem fica na predefinição com o `watermarkId`; noutro projeto dá `INVALID_WATERMARK_CONTENT` e o painel pede outra imagem.

## Revisão depois da etapa 5 (D-86, D-87)

A equipa reviu o resultado no browser e reabriu a etapa 2. O modelo do backend mantém-se: sub-cadeia por clip → junção → passos finais (D-78), uma tarefa e uma invocação FFmpeg, custo N (DQ-014), reserva e devolução (D-45), resultado atómico, originais intactos, fase da falha (D-82), predefinições (D-83 a D-85) e nomes (D-35, D-75). Mudam apenas:

- **Limites de quantidade (D-86):** a ContagemPassos deixa de ter o máximo de 10 e os ParametrosJuncao deixam de ter o máximo de 10/50 clips, em todos os perfis; o `CHAIN_TOO_LONG` e o `TOO_MANY_INPUTS` saem do ErroCadeia. Mantêm-se o mínimo de 2 clips, os limites de duração e de tamanho (LimitesPerfil sem `maxClips` nem `maxSteps`), a quota dos Registados e a recusa dos anónimos.
- **Interface:** o mesmo modelo é exposto por três ações independentes. "Aplicar várias operações" é uma cadeia sem junção sobre um vídeo. "Juntar vídeos" é uma junção com sub-cadeias vazias e sem passos finais, com custo 1. "Movie Maker" é a composição completa, com N clips, cada um com a sua cadeia (possivelmente vazia), e N passos depois da junção. O EditorCadeia e a LinhaTemporalJuncao deste modelo dão lugar a esses três fluxos (ver o `ddd-02-technical-design.md`, secção "Revisão da etapa 2").
- **Configuração de cada passo (D-87):** os controlos são os componentes da edição simples das B004, B005 e B007, extraídos dos painéis (ADR-020).
