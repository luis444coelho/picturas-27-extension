---
unit: 001-video-lifecycle
bolt: 003-video-task-foundation
stage: model
status: complete
updated: 2026-10-22T15:25:53Z
---

# Static Model - Tarefas de vídeo, quota e executor de cadeias

Fontes: ST-VID-COM-001, `docs/requirements/REQ-VID-COM.md` (COM, QUOTA, TASK, ERROR), `REQ-VID-NFR.md` (NFR-002, 005 a 007, 009, 011, 013, 018, 021), ADD v1.1 (2.2, 2.6, T-00 a T-05, T-08, T-10, Q-ADD-02, 03, 11, 14, 15), specsDuvidas D-02 a D-04, D-08, D-09, D-15, D-18, D-19, D-21, D-23, D-28, D-35, modelo de domínio da B001. Modelo estático, sem leitura de código (restrição do estágio).

## Bounded Context

**Processamento de vídeo (tarefas).** Responsável por aceitar um pedido de operação sobre vídeos `completed` de um projeto, validá-lo com o registo de operações, calcular o plano de execução, garantir no máximo uma tarefa ativa por projeto, reservar e devolver créditos, acompanhar a tarefa pela máquina de estados canónica até `completed`, `failed` ou `cancelled`, publicar o resultado como Vídeo novo do projeto e recuperar ou limpar o que ficar parado ou órfão.

Uma operação isolada é uma cadeia de um passo (T-01, T-02): este contexto constrói a mecânica comum, e as operações concretas (recorte, ajuste, junção, …) entram no registo a partir da B004, sem mudar a mecânica.

Fronteiras e contextos vizinhos:

- **Ciclo de vida do vídeo (B001, B002):** dono do agregado Vídeo, da matriz de formatos (`formats.js`), das filas, do `amqp.js`, do `wsGateway/video.js`, do worker com a ingestão e dos URLs internos. Este contexto **lê** vídeos `completed` como entradas e **cria** vídeos de resultado, e estende os componentes por acréscimo, sem os alterar (D-08).
- **Identidade, perfis e quota (baseline, serviço de utilizadores):** fornece o tipo de perfil e o saldo (`remaining_operations`) e expõe a reserva (`process/:n`) e a devolução (`process/refund/:k`) tal como estão (T-04). Contexto a montante; não muda.
- **Projetos e partilha (baseline, serviço de projetos):** fornece a existência do projeto, o dono e as permissões. Só leitura; o documento do projeto não é alterado (o lugar de tarefa ativa vive fora dele, T-03).
- **Armazenamento de objetos:** guarda os resultados (`video_out`), as miniaturas e os fotogramas 0 (`video_thumb`) e as cópias de pré-visualização (`video_preview`); acedido pela porta de vídeo da B001.
- **Executor de cadeias (worker `Tools/video/`):** executa o plano recebido num único `-filter_complex`, emite progresso e responde com factos (metadados, chaves). Não decide regras de negócio (T-01, T-02).
- **Notificação (wsGateway):** entrega `video-task-update` à sala do executor e a `project:<id>`, só com identificadores, estado e progresso (risco aceite, T-03).
- **Fora deste contexto:** operações concretas (B004 a B007), junção e validação de estrutura das cadeias (B008).

## Domain Entities

| Entity | Properties | Business Rules |
|--------|------------|----------------|
| **Tarefa de vídeo** (`VideoTask`, raiz) | `id` (igual ao `holderId` do lugar de tarefa ativa); `projectId`; `ownerId` (dono do projeto, para o bucket); `runnerId` (quem submeteu); `kind` (TipoTarefa); `steps` (lista de PassoOperacao); `inputVideoIds` (ordenada); `status` (EstadoTarefa); `step`, `totalSteps`; `progress`; `cost`; `reservedCredits`; `correlationId`; `resultVideoId`; `error` (ErroTarefa); `createdAt`, `updatedAt` | Só existe depois de os passos 1 a 9 da aceitação passarem (T-03): um pedido rejeitado não cria tarefa nem consome quota (COM-001, COM-004/005). Estado único e agregado para todos os passos (TASK-006). Só o `runnerId` a pode cancelar, e só em `queued` ou `processing` (TASK-004). Os créditos são do `runnerId`, mesmo num projeto partilhado (QUOTA-006). O progresso por segundo não é persistido (vai do worker para o WebSocket, T-03); a tarefa guarda o progresso das transições (0 ao aceitar e ao iniciar, 100 ao concluir). Uma tarefa num estado final não volta a mudar. |
| **Lugar de tarefa ativa** (`video_project_locks`) | `projectId` (único); `holderKind` (`task`); `holderId`; `createdAt` | No máximo um por projeto (NFR-017, DQ-015). É adquirido **antes** de a tarefa existir (passo 8); o `holderId` gerado nesse momento passa a ser o `id` da tarefa. É libertado quando a tarefa chega a um estado final, ou quando a reserva de créditos falha (passo 9). Um lugar cujo `holderId` não corresponde a nenhuma tarefa ao fim de 60 s é libertado pela rotina de manutenção (T-03, Q-ADD-14). Não vive no documento do projeto (T-03, "Porquê fora do projeto").  |
| **Vídeo** (agregado da B001, referência e criação) | Ver modelo da B001. Num **resultado**: `status = completed` desde a criação; `sourceVideoIds` = `inputVideoIds` da tarefa; `recipe` = `steps`; `taskId`; `createdBy` = `runnerId`; `ownerId` = dono do projeto; `originalName` = o da primeira origem (D-35); `meta` do ficheiro real; chaves em `video_out`, `video_thumb` e, se for preciso, `video_preview` | Uma entrada só é aceite se existir no projeto e estiver `completed` (COM-001; senão 404 ou 409 `RESOURCE_NOT_READY`). O resultado só é criado quando a tarefa chega a `completed` (COM-002, COM-003), como recurso independente; o original nunca é alterado. Os metadados vêm sempre do FFprobe ao ficheiro produzido, nunca do `estimate` (T-02). |
| **Utilizador** (referência externa, baseline) | `id`; `tipoPerfil` (`anonymous`, `free` = Registado, `premium`); `remainingOperations` | `anonymous` não submete operações (403, T-03 passo 3). Registado reserva créditos; Premium não chama a reserva nem a devolução (QUOTA-005, T-04). O perfil é o do `runnerId` (`X-Caller-Id`), não o do dono do projeto. |
| **Projeto** (referência externa, baseline) | `id`; `ownerId`; partilhas com permissão de leitura ou edição | Submeter e cancelar exigem edição; consultar uma tarefa exige leitura (T-03). Um projeto apagado deixa vídeos, tarefas, lugares e objetos órfãos, que a rotina de manutenção remove (T-00, NFR-006). |

## Value Objects

| Value Object | Properties | Constraints |
|--------------|------------|-------------|
| **PassoOperacao** | `operation`; `version` (inteiro ≥ 1); `parameters` | Contrato uniforme (COM-006, T-01). `operation` tem de existir no registo e `version` tem de ser uma versão que a operação aceita. Os nomes em `parameters` são camelCase. A junção é um passo como os outros, com `parameters.clips: [{videoId, steps}]` (B008). Imutável depois de aceite: é o que fica no `recipe` do resultado. |
| **TipoTarefa** | `single` \| `chain` \| `concat` | Derivado dos passos: `concat` se algum passo é uma junção; `chain` se há mais de um passo; `single` nos restantes casos.  |
| **EstadoTarefa** | `queued` \| `processing` \| `completed` \| `failed` \| `cancelled` | Transições válidas (TASK-002, diagrama do T-03): `queued → processing`, `queued → failed`, `queued → cancelled`, `processing → processing` (reentrega, recomeça do zero), `processing → completed`, `processing → failed`, `processing → cancelled`. `completed`, `failed` e `cancelled` são finais e absorventes. Ativos: `queued` e `processing`. |
| **ProgressoTarefa** | `step` (1 … `totalSteps`); `totalSteps`; `progress` (0–100) | `totalSteps` = número de passos da cadeia (TASK-007). Dentro de uma execução, o progresso é monótono e chega ao cliente pelo menos 1×/s (NFR-008); numa reentrega volta a 0, porque a tarefa recomeça do zero (NFR-006, T-03). O significado de `step` quando todos os passos correm num único *filtergraph* está na questão D-40. |
| **Custo** | `cost` (créditos) | 1 por passo; a junção conta 1, mais os passos dentro de cada clip; uma cadeia é a soma dos passos (QUOTA-008, T-01, DQ-013). Descarregamento, consulta e validação custam 0. |
| **ReservaCreditos** | `reservedCredits`; `refunded` (sim/não) | `reservedCredits = cost` para Registado e `0` para Premium (QUOTA-005). A reserva **é** o débito (QUOTA-002/003): `completed` não faz chamada nenhuma; `failed` e `cancelled` devolvem `reservedCredits` uma só vez (QUOTA-004). Saldo insuficiente → `QUOTA_EXCEEDED` com `{cost, remaining}` e nada reservado (QUOTA-001/007). As reservas do mesmo `runnerId` são serializadas no serviço de projetos (T-04). |
| **PropriedadesVideo** (`inputProps` / saída do `estimate`) | `container`; `videoCodec`; `audioCodec` (ou `null`); `width`, `height`; `rotation`; `displayWidth`, `displayHeight`; `fpsNum`, `fpsDen`; `durationMs`; `sizeBytes` | À entrada são sempre lidas pelo servidor de `videos.meta`, nunca aceites do cliente (T-01). À saída de um passo são uma estimativa, usada para validar o passo seguinte e para mostrar as dimensões; com recodificação, as dimensões ímpares são arredondadas para baixo ao par (T-02, Q-ADD-25). |
| **ErroValidacao** | `code`; `field?`; detalhes próprios do código | Produzido pelo `validate` de cada operação (T-01), por exemplo `INVALID_ADJUST_PARAMS` ou `NO_CHANGES`. Os códigos que a mecânica comum precisa e as fontes não fixam estão na questão D-42. |
| **PlanoExecucao** | por stream: `video` (`copy` \| `encode` + codec), `audio` (`copy` \| `encode` + codec \| `none`); `container` de saída; passos com os parâmetros já resolvidos; chaves dos originais; ajustes de robustez (`-map 0:V:0 -map 0:a:0? -sn -dn`, `+genpts` para AVI copiado, corte de 1 px nas dimensões ímpares); parâmetros de codificação; plano da cópia de pré-visualização do resultado | Calculado só no serviço de projetos, a partir do `estimate` e do `copyable` de cada passo e da matriz de formatos (T-01, T-05); o worker não repete a decisão. Cópia de uma stream só quando o codec de origem é igual ao de saída e nenhum passo a altera. No máximo uma recodificação de vídeo por cadeia (NFR-012). Formato de trabalho: MP4 H.264/AAC `yuv420p` com `+faststart`, exceto na conversão (NFR-016, DQ-012). Os parâmetros de qualidade estão na questão D-39. As chaves de saída derivam do `id` da tarefa, para o reprocessamento escrever no mesmo sítio. |
| **ErroTarefa** | `code`; `message` | Categoria estável e instrução corretiva (ERROR-001): `PROCESSING_ERROR` para falha do FFmpeg ou esgotamento das entregas (D-21). A causa técnica (fim do `stderr`) fica só nos logs, com o `correlationId` (ERROR-002). |
| **ErroVideo** (resposta HTTP, da B001) | `code`; `message`; `details`; `correlationId` | `{error: {code, message, details}, correlationId}` em todas as respostas de erro (ERROR-001, T-10). Códigos usados aqui: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `INVALID_STATE` (D-21); `SHARE_LINK_REVOKED`, `TOO_MANY_EDITORS`, `INVALID_REQUEST` (D-23); `RESOURCE_NOT_READY`, `UNSUPPORTED_FORMAT`, `LIMIT_EXCEEDED`, `QUOTA_EXCEEDED` `{cost, remaining}` (T-03, T-10); os da validação dos passos com 422 (COM-005); os da questão D-42. |
| **CorrelationId** | UUID | Gerado no router de vídeo do gateway; viaja nos cabeçalhos entre serviços, no corpo das mensagens de vídeo (não nas propriedades AMQP), no `VideoTask.correlation_id`, nos logs JSON e nas respostas de erro (NFR-002, T-10). Não é a chave de associação das respostas do worker, que é o `taskId`. |
| **PedidoCancelamento** | `taskId` | Publicado na exchange *fanout* `video_control`; cada réplica do worker guarda os `taskId` cancelados durante um TTL maior do que a espera máxima na fila (T-03). |

## Aggregates

| Aggregate Root | Members | Invariants |
|----------------|---------|------------|
| **Tarefa de vídeo** | PassoOperacao, ProgressoTarefa, ReservaCreditos, ErroTarefa | (T1) Só as transições de EstadoTarefa são possíveis; os estados finais são absorventes, por isso uma resposta reentregue ou atrasada para uma tarefa num estado final não muda nada (idempotência, T-03). (T2) `completed` ⇒ `resultVideoId` aponta para um Vídeo `completed` do mesmo projeto; `failed` ou `cancelled` ⇒ não há Vídeo de resultado, nem objetos do resultado no storage, nem temporários (NFR-006, ERROR-003, TASK-005). (T3) Em `failed` ou `cancelled`, `reservedCredits > 0` ⇒ devolução feita exatamente uma vez; em `completed` nunca há devolução (QUOTA-003/004). (T4) `reservedCredits ∈ {0, cost}`, consoante o perfil do `runnerId` na aceitação. (T5) Enquanto `status ∈ {queued, processing}`, existe o lugar de tarefa ativa do projeto com `holderId = id`; num estado final, esse lugar já não existe. (T6) `1 ≤ step ≤ totalSteps` e `0 ≤ progress ≤ 100`; `completed` ⇒ `progress = 100`. (T7) Todos os `steps` passaram o `validate` do registo e o plano foi calculado antes de a tarefa existir (COM-004). (T8) No máximo duas entregas ao worker; esgotadas, a tarefa passa a `failed` (`PROCESSING_ERROR`) (NFR-006). |
| **Lugar de tarefa ativa** | — | (L1) Unicidade por `projectId`: uma segunda aquisição falha e o pedido recebe 409 sem criar tarefa nem reservar créditos (NFR-017). (L2) Um lugar sem tarefa correspondente ao fim de 60 s é órfão e é libertado. (L3) A libertação é condicional ao `holderId`, para nunca libertar o lugar de outra tarefa. |
| **Vídeo** (B001; regras acrescentadas para os resultados) | — | Mantém I1 a I8 da B001. (R1) Um resultado é criado já `completed` e de forma atómica, com `meta` e chaves presentes; antes disso nada aparece na galeria (COM-002). (R2) `sourceVideoIds`, `recipe` e `taskId` estão preenchidos e coincidem com a tarefa (COM-003, STORAGE-002/004). (R3) O resultado é MP4 H.264/AAC, salvo numa conversão (NFR-016). |

Projeto e Utilizador são raízes de outros contextos (baseline); este contexto referencia-os só por identificador.

## Domain Events

| Event | Trigger | Payload |
|-------|---------|---------|
| **OperacaoSubmetida** | `POST …/videos/:video/operations` com `{steps}` | `projectId`, `runnerId`, `inputVideoIds`, `steps`, `correlationId` |
| **OperacaoRejeitada** | Falha num dos passos 1 a 9 da aceitação (T-03) | `ErroVideo` (HTTP 401/403/404/409/410/422/429 ou `QUOTA_EXCEEDED`) → sem tarefa, sem quota; um lugar já adquirido é libertado |
| **LugarAdquirido** / **LugarLibertado** | Passo 8 / estado final, falha da reserva ou rotina de manutenção | `projectId`, `holderId` |
| **CreditosReservados** | Passo 9, só Registado | `runnerId`, `cost` |
| **TarefaAceite** | Passo 10: tarefa criada em `queued` e publicada em `video_operations_queue` | `taskId`, `projectId`, `runnerId`, `kind`, `totalSteps`, `correlationId` → resposta 202 `{taskId, status: "queued"}` em ≤ 1 s (TASK-001, NFR-004) |
| **TarefaIniciada** | O worker começa (ou recomeça, numa reentrega) | `taskId`, `correlationId` → `queued → processing` |
| **ProgressoTarefa** | Linhas de `-progress pipe:1` (`out_time_us`), pelo menos 1×/s | `user`, `projectId`, `taskId`, `step`, `totalSteps`, `progress` → diretamente para `video_ws_queue`, sem passar pelo serviço de projetos (T-03) |
| **TarefaConcluida** | FFmpeg terminou, FFprobe feito, resultado, miniatura, fotograma 0 e (se o plano pedir) cópia MP4 enviados | `taskId`, `meta`, chaves, `correlationId` → Vídeo de resultado criado, `processing → completed`, lugar libertado |
| **TarefaFalhada** | Erro antes de começar (original em falta) ou durante o FFmpeg | `taskId`, `ErroTarefa`, `correlationId` → `failed`, devolução, limpeza, lugar libertado |
| **EntregasEsgotadas** | A mensagem chega à `video_project_queue` por *dead-letter* (cabeçalho `x-death`) depois de duas entregas | `taskId`, `correlationId` → `failed` com `PROCESSING_ERROR`, devolução, lugar libertado (NFR-006) |
| **CancelamentoPedido** | `DELETE …/videos/tasks/:taskId` pelo `runnerId`, com a tarefa ativa | `taskId`, `correlationId` → `cancelled`, `{taskId}` em `video_control`, devolução, lugar libertado |
| **ExecucaoInterrompida** | O worker recebe o cancelamento: termina o FFmpeg (ou descarta a mensagem ainda por começar) e apaga `/tmp/video/<taskId>/` | `taskId`, `status: cancelled` → ignorada pelo orquestrador (a tarefa já é final) |
| **ResultadoTardioDescartado** | Chega `completed` de uma tarefa já `cancelled` ou `failed` | `taskId`, chaves → os objetos enviados são apagados do storage (T-03, NFR-006) |
| **CreditosDevolvidos** | `failed` ou `cancelled` com `reservedCredits > 0` | `runnerId`, `k = reservedCredits` |
| **VideoTaskUpdate** (notificação ao cliente) | Qualquer transição persistida e cada `ProgressoTarefa` | `taskId`, `projectId`, `status`, `step`, `totalSteps`, `progress`, `resultVideoId?`, `error.code?` → `video-task-update` para a sala do executor e `project:<id>`, numa só emissão; só identificadores, estado e progresso (TASK-003) |
| **TarefaParadaRetomada** / **TarefaParadaFechada** | Rotina de manutenção encontra uma tarefa ativa sem avanço (D-41) | `taskId`, `motivo` → republicação, ou `failed` com devolução e lugar libertado |
| **LugarOrfaoLibertado** | Rotina de manutenção: `holderId` sem tarefa há mais de 60 s | `projectId`, `holderId` |
| **RecursosProjetoApagadoRemovidos** | Rotina de manutenção: `projectId` sem projeto | `projectId`, número de vídeos, tarefas, lugares e objetos removidos (T-00, NFR-006) |
| **CarregamentoAbandonadoRemovido** | Rotina de manutenção: vídeo `queued` há mais de 900 s + margem (D-15) | `videoId`, `originalKey` → objeto em `video_src` e registo apagados |

## Domain Services

| Service | Operations | Dependencies |
|---------|------------|--------------|
| **RegistoOperacoes** (`projects/video/operations/<op>.js`, T-01) | `obter(operation, version)`; para cada operação: `validate(parameters, inputProps, profile)` → `[ErroValidacao]`, `estimate(inputProps, parameters)` → PropriedadesVideo, `cost` → créditos, `copyable(inputProps, parameters)` → `{video, audio}`; `validarCadeia(steps, inputProps, profile)` → erros por índice, com o `estimate` de cada passo como entrada do seguinte; `custo(steps)` | PropriedadesVideo, perfil do executor. Sem operações concretas neste bolt (ver D-37) |
| **PlaneadorExecucao** (T-01, T-05) | `planear(steps, entradas)` → PlanoExecucao: decisão cópia/recodificação por stream, codecs e contentor de saída, ajustes de robustez, codificação por omissão, corte de dimensões ímpares, plano da cópia de pré-visualização do resultado (T-06) | RegistoOperacoes (`estimate`, `copyable`), PoliticaFormatos (`formats.js` da B001), PoliticaCodificacao |
| **PoliticaCodificacao** (T-02) | `codificacaoPorOmissao(container)` → `libx264` + `aac`, `yuv420p`, `+faststart` (MP4/MOV); parâmetros de qualidade (D-39) | — |
| **AceitacaoOperacao** (orquestrador, T-03) | `aceitar(pedido)` pelos 11 passos: autorização → permissão de edição → recusa de `anonymous` → entradas `completed` → formato e limites do perfil → `validate` → plano → lugar → reserva → tarefa `queued` + publicação → 202 | AutorizacaoVideo (B001), PoliticaFormatos, PoliticaLimitesPerfil (B001), RegistoOperacoes, PlaneadorExecucao, RepositorioLugares, ServicoQuota, RepositorioTarefas, BarramentoVideo |
| **ServicoQuota** (T-04) | `reservar(runnerId, n)` → ok \| `QUOTA_EXCEEDED {cost, remaining}`; `devolver(runnerId, k)`; não chama nada para Premium; serializa as reservas por `runnerId` | GatewayQuota, GatewayPerfis |
| **ServicoCancelamento** (T-03) | `cancelar(taskId, callerId)` → 403 se não for o `runnerId`, 409 se não estiver ativa; transição para `cancelled`, publicação em `video_control`, devolução, libertação do lugar | RepositorioTarefas, RepositorioLugares, BarramentoVideo, ServicoQuota, NotificadorVideo |
| **ProcessadorRespostasTarefa** (consumidor de `video_project_queue`) | `aoIniciada`, `aoConcluida`, `aoFalhada`, `aoCancelada`, `aoEsgotada` (*dead-letter*); todas idempotentes (ignoram tarefas finais; apagam o resultado tardio); a mensagem só é confirmada depois de o efeito estar gravado | RepositorioTarefas, RepositorioVideos, RepositorioLugares, ServicoQuota, ArmazenamentoVideo, NotificadorVideo |
| **ExecutorCadeias** (worker, T-02) | `executar(tarefa, plano)`: pedir URLs GET, descarregar por blocos, `construirComando(plano)` (um `-filter_complex`), correr o FFmpeg com `-progress pipe:1`, publicar o progresso, FFprobe ao resultado, miniatura e fotograma 0, pedir URLs PUT e enviar por blocos com `Content-Length`, responder; `interromper(taskId)`; `limpar(taskId)`; numa reentrega, recomeçar do zero | FFmpeg/FFprobe, ArmazenamentoVideo (URLs internos), BarramentoVideo, módulos `ops/<op>.py` (filtros por operação) |
| **RotinaManutencao** (Q-ADD-14, D-04, D-15) | `libertarLugaresOrfaos`; `retomarOuFecharTarefasParadas`; `removerRecursosDeProjetosApagados`; `removerCarregamentosAbandonados`; parâmetros na questão D-41 | RepositorioTarefas, RepositorioLugares, RepositorioVideos, RepositorioProjetos, ArmazenamentoVideo, ServicoQuota, BarramentoVideo |
| **Correlacao** (T-10) | `gerar` no gateway; `propagar(pedido → serviços → mensagens)`; `registar(evento)` em JSON (`{level, correlationId, taskId, userId, resource, event}`) | — |

## Repository Interfaces

| Repository | Entity | Methods |
|------------|--------|---------|
| **RepositorioTarefas** (coleção `videotasks`) | Tarefa de vídeo | `criar(tarefa)` (em `queued`, com o `id` do lugar); `obter(projectId, taskId)`; `transitar(taskId, deEstados, para, campos)` (condicional ao estado atual: só quem ganha a transição aplica os efeitos); `marcarDevolvida(taskId)` (condicional, para devolver uma só vez); `listarAtivasSemAvanco(limite)`; `existe(taskId)`; `removerPorProjeto(projectId)` |
| **RepositorioLugares** (coleção `video_project_locks`) | Lugar de tarefa ativa | `adquirir(projectId, holderId)` → ok \| ocupado (chave duplicada); `libertar(projectId, holderId)` (condicional ao `holderId`); `listarMaisAntigosQue(segundos)`; `removerPorProjeto(projectId)` |
| **RepositorioVideos** (B001, métodos acrescentados) | Vídeo | `obterConcluidos(projectId, videoIds)`; `criarResultado(video)` (já `completed`); `listarPorProjeto(projectId)`; `listarQueuedMaisAntigosQue(segundos)`; `removerPorProjeto(projectId)` |
| **RepositorioProjetos** (baseline, só leitura) | Projeto | `obter(projectId)`; `permissaoDe(projectId, callerId)`; `existentes(projectIds)` → os que ainda existem |
| **GatewayPerfis** (baseline, só leitura) | Utilizador | `tipoPerfil(callerId)`; `remainingOperations(callerId)` |
| **GatewayQuota** (baseline, sem alterações) | — | `reservar(runnerId, n)` → ok \| 701; `devolver(runnerId, k)` |
| **ArmazenamentoVideo** (porta da B001) | ChaveObjeto | `remover(chave)`; `existe(chave)` |
| **BarramentoVideo** (porta AMQP, `amqp.js` da B001 estendido por acréscimo) | — | `publicarTarefa(mensagem)` em `video_operations_queue`; `publicarCancelamento(taskId)` em `video_control`; `consumirRespostasTarefa(handler)` de `video_project_queue` (incluindo as mensagens com `x-death`), com confirmação manual |
| **NotificadorVideo** (porta para `video_ws_queue`) | — | `notificarTarefa(userId, projectId, evento)` |

## Ubiquitous Language

| Term | Definition |
|------|------------|
| **Operação** | Transformação de vídeo identificada por `operation`, com uma `version` dos parâmetros e os `parameters` (COM-006). |
| **Passo** | Uma operação dentro de um pedido; um pedido tem 1 a N passos. |
| **Operação isolada** | Pedido com um só passo; é uma cadeia de um passo e segue exatamente o mesmo caminho. |
| **Cadeia** | Pedido com vários passos, aplicados pela ordem e executados numa única invocação FFmpeg. |
| **Registo de operações** | Conjunto de módulos, um por operação, com `validate`, `estimate`, `cost` e `copyable`; a única fonte das regras de cada operação. |
| **Plano de execução** | Decisão, tomada no serviço de projetos, de copiar ou recodificar cada stream, com que codecs, contentor e parâmetros; o worker só a executa. |
| **Executor de cadeias** | Parte do worker de vídeo que transforma o plano num comando FFmpeg com um único `-filter_complex` e o executa. |
| **Executor (pessoa)** | Utilizador que submete a tarefa (`runnerId`, `X-Caller-Id`): dono da quota e o único que pode cancelar. Não confundir com o executor de cadeias. |
| **Tarefa** | Registo `VideoTask` que acompanha um pedido aceite até a um estado final. |
| **Tarefa ativa** | Tarefa em `queued` ou `processing`. |
| **Lugar de tarefa ativa** | Documento único por projeto que garante no máximo uma tarefa ativa. |
| **Lugar órfão** | Lugar cujo `holderId` não corresponde a nenhuma tarefa (queda entre a aquisição e a criação). |
| **Reserva** | Débito de `cost` créditos na aceitação; é definitiva se a tarefa chegar a `completed`. |
| **Devolução** | Reposição dos créditos reservados em falha, cancelamento ou esgotamento das entregas. |
| **Entrega / reentrega** | Envio da mensagem da tarefa ao worker; a reentrega (`redelivered`) acontece se o worker cair e recomeça a tarefa do zero. |
| **Esgotamento das entregas** | Segunda entrega falhada: a mensagem vai por *dead-letter* para o serviço de projetos e a tarefa passa a `failed`. |
| **Cancelamento** | Pedido do executor que fecha a tarefa em `cancelled`, interrompe o FFmpeg, limpa os temporários e não publica resultado. |
| **Resultado** | Vídeo novo do projeto, criado `completed` no fim da tarefa, com proveniência e receita. |
| **Formato de trabalho** | MP4 H.264/AAC, o formato de saída de todas as operações exceto a conversão. |
| **Cópia de stream** / **Recodificação** | Passar uma stream sem a decodificar / decodificá-la e codificá-la de novo; no máximo uma recodificação de vídeo por cadeia. |
| **Rotina de manutenção** | Tarefa periódica do serviço de projetos que retoma ou fecha tarefas paradas, liberta lugares órfãos, remove recursos de projetos apagados e carregamentos abandonados. |
| **Tarefa parada** | Tarefa ativa que deixou de avançar por uma queda do orquestrador fora das filas. |
| **Carregamento abandonado** | Vídeo em `queued` (URL de carregamento emitido) nunca confirmado nem cancelado (D-15). |
| **`correlationId`** | Identificador de rastreio de um pedido de vídeo, presente em logs, mensagens e respostas de erro. |

## Cobertura da story ST-VID-COM-001

- ✅ **AC1** (contrato `{operation, version, parameters}`, mesmo registo isolado ou em cadeia, uma operação isolada é uma cadeia de um passo, worker único, um único `-filter_complex`): PassoOperacao, RegistoOperacoes, PlaneadorExecucao, ExecutorCadeias, T7.
- ✅ **AC2** (202 com `taskId` e `queued` em ≤ 1 s, máquina de estados, progresso ≥ 1×/s, uma tarefa ativa por projeto com 409): AceitacaoOperacao, TarefaAceite, EstadoTarefa, ProgressoTarefa, Lugar de tarefa ativa (L1), T1, T5.
- ✅ **AC3** (reserva na aceitação, definitiva em `completed`, devolução em falha, cancelamento ou esgotamento, Premium sem chamadas, `QUOTA_EXCEEDED {cost, remaining}` sem reservar): ReservaCreditos, ServicoQuota, CreditosDevolvidos, T3, T4.
- ✅ **AC4** (só o executor cancela, 403/409, interrompe o FFmpeg, limpa e não publica): ServicoCancelamento, CancelamentoPedido, ExecucaoInterrompida, ResultadoTardioDescartado, T2.
- ✅ **AC5** (rotina periódica: tarefas paradas, lugares sem dono, recursos de projetos apagados; e os carregamentos abandonados da D-15): RotinaManutencao e os seus eventos; parâmetros na D-41.
- ✅ **AC6** (formato de erro, causa técnica só nos logs, `correlationId` no corpo das mensagens): ErroVideo, ErroTarefa, CorrelationId, Correlacao.
- ✅ **AC7** (queda do worker: reentrega e recomeço do zero, no máximo duas entregas, depois `failed` com devolução, sem recurso e com temporários limpos): EntregasEsgotadas, T2, T3, T8.
- ↪ **NFR-010** (verificação, dona: B001): o contexto só usa as filas de vídeo e não toca nas ferramentas de imagem nem nas filas existentes.

## Decisões tomadas no checkpoint do Estágio 1

As questões abertas deste modelo foram respondidas pela equipa e registadas em `docs/specsDuvidas.md`:

1. **D-37:** a verificação de ponta a ponta usa a operação `test_reencode` (recodifica no formato de trabalho, custo 1), registada só com `VIDEO_TEST_OPERATIONS=1`, que não fica ativa no `docker-compose.yaml`.
2. **D-38 (Q-ADD-02):** o processamento de imagens não conta como tarefa ativa.
3. **D-39 (Q-ADD-11, parte MP4/MOV):** `-preset veryfast -crf 23` e AAC a 128 kb/s. O executor da B003 não gera AVI; o `-q:v` do `mpeg4` e o bitrate do MP3 ficam para a B007.
4. **D-40 (Q-ADD-16, parte do passo corrente):** `step = min(totalSteps, floor(progress / 100 × totalSteps) + 1)`.
5. **D-41 (Q-ADD-14):** período de 60 s; lugares órfãos ao fim de 60 s; tarefas `queued` nunca publicadas há mais de 60 s são republicadas; tarefas ativas sem transição há mais de 3 h 10 min (acima do `x-consumer-timeout` de 3 h da D-18) passam a `failed` com devolução; carregamentos abandonados com mais de 20 min (D-15); projetos apagados verificados a cada 10 min. A tarefa guarda o instante da publicação.
6. **D-42:** não se reutiliza o `INVALID_STATE`. Uma tarefa fora de `queued`/`processing` recebe um código novo, acrescentado ao fim do `MESSAGES` em `projects/video/errors.js`; os erros dos passos são 422 `INVALID_STEP_PARAMS` com `{index, errors}`; um corpo sem `steps` válido é 422 `INVALID_REQUEST` com `{field: "steps"}`. O nome do código novo e o do 409 de tarefa ativa ficam na D-44.
7. **D-43 (Q-ADD-15):** o endpoint de validação responde em ≤ 1 s.
