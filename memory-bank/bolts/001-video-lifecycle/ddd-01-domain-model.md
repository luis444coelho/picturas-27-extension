---
unit: 001-video-lifecycle
bolt: 001-video-lifecycle
stage: model
status: complete
updated: 2026-10-21T16:19:54Z
---

# Static Model - Ciclo de vida do vídeo (ingestão e visualização)

Fontes: ST-VID-000, UC-VID-000 v1.4, `docs/requirements/REQ-VID-UPLOAD.md`, `REQ-VID-COM.md` (AUTH, STORAGE, ERROR), `REQ-VID-NFR.md`, ADD v1.1 (T-00, T-02, T-03, T-05 a T-08, T-10), specsDuvidas D-02, D-08, D-09. Modelo estático, sem leitura de código (restrição do estágio).

## Bounded Context

**Ciclo de vida do vídeo (ingestão).** Responsável por receber um ficheiro de vídeo de um utilizador autorizado, validá-lo contra a matriz de formatos e os limites do perfil, extrair os metadados técnicos, gerar as imagens derivadas (miniatura e fotograma 0) e, quando necessário, a cópia de pré-visualização MP4, e publicá-lo como recurso `completed` do projeto, pronto a reproduzir.

Fronteiras e contextos vizinhos:

- **Identidade e perfis (baseline, serviço de utilizadores):** fornece o utilizador do JWT e o tipo de perfil (`anonymous`, Registado, Premium). Só leitura; a ingestão **não** usa a quota.
- **Projetos e partilha (baseline, serviço de projetos):** fornece o projeto, o dono e as permissões (leitura, edição, propriedade). Só leitura; o documento do projeto **não** é alterado (o vídeo vive na coleção própria `videos`).
- **Armazenamento de objetos (`imageStorageService` + SeaweedFS):** guarda os binários por estágio de vídeo. Contexto a jusante, acedido por uma porta própria do vídeo.
- **Processamento de vídeo (worker `Tools/video/`):** executa FFprobe/FFmpeg. Não decide regras de negócio: recebe o que fazer e devolve factos (metadados, chaves).
- **Notificação (wsGateway):** entrega eventos ao cliente, só com identificadores e estado.
- **Fora deste contexto nesta bolt:** `VideoTask`, quota, cancelamento de tarefas, registo de operações, executor de cadeias (B003); descarregamento e painel de informações (B002).

## Domain Entities

| Entity | Properties | Business Rules |
|--------|------------|----------------|
| **Vídeo** (raiz) | `id`; `projectId`; `ownerId` (dono do projeto, cópia para chegar ao bucket); `createdBy` (quem carregou); `originalName`; `mimeType`; `status` (EstadoIngestao); `storage` (ChavesArmazenamento); `meta` (MetadadosTecnicos); `sourceVideoIds` (lista ordenada); `recipe` (lista de passos); `taskId`; `createdAt`, `updatedAt` | RN7: o original é imutável depois de criado (`storage.originalKey` e o binário não mudam). Para um original carregado, `sourceVideoIds = []`, `recipe = []` e `taskId = null` (os resultados de operações são da B003+). Só é visível na galeria, reproduzível ou utilizável como entrada quando `status = completed` (COM-002). `mimeType` é derivado do contentor detetado na ingestão, não do valor declarado pelo cliente. O carregamento não debita quota (RN2). |
| **Projeto** (referência externa, baseline) | `id`; `ownerId`; partilhas com permissão de leitura ou edição | Só leitura neste contexto. Determina a permissão do executor (AUTH-003, STORAGE-003). Um vídeo pertence a exatamente um projeto. |
| **Utilizador** (referência externa, baseline) | `id`; `tipoPerfil` (`anonymous`, Registado, Premium) | `anonymous` não pode carregar nem aceder a rotas de vídeo (AUTH-002, RN1). O perfil de **quem carrega** (`createdBy`) define os limites aplicados (RN4, FA3). |
| **Carregamento** (sessão de transferência, transitória) | `uploadId`; `projectId`; `callerId`; `nomeDeclarado`; `tipoMimeDeclarado`; `tamanhoDeclarado`; `bytesRecebidos`; `estado` (`em_transferencia`, `transferido`, `cancelado`, `falhado`) | Existe só durante a transferência (passos 3–4). Progresso monótono de 0 % a 100 % (UPLOAD-018). Cancelamento ou falha de rede a qualquer momento antes do fim purga os dados parciais e não cria Vídeo (UPLOAD-006, FA2, exceção de rede). O tamanho é verificado contra o limite do perfil antes e durante a transferência (UPLOAD-004). Não é persistida como documento de domínio; a forma concreta depende da Q-ADD-04. |

## Value Objects

| Value Object | Properties | Constraints |
|--------------|------------|-------------|
| **EstadoIngestao** | `queued` \| `processing` \| `completed` \| `failed` | Transições válidas: `queued → processing → completed`; `queued → failed`; `processing → failed`; `processing → processing` (reentrega). `completed` e `failed` são finais. Ver "Questões para o Technical Design" (1) sobre o significado de `failed` face à garantia de "nenhum registo". |
| **MetadadosTecnicos** | `container` (`mp4`/`mov`/`avi`); `videoCodec`; `audioCodec` (`null` = sem áudio; ausente = não obtido); `width`, `height` (codificadas); `rotation` (0, 90, 180, 270); `displayWidth`, `displayHeight`; `fpsNum`, `fpsDen`; `durationMs`; `sizeBytes`; `bitrate` | Imutável; vem sempre do ficheiro real (FFprobe), nunca do cliente. `displayWidth × displayHeight` = `height × width` quando `rotation ∈ {90, 270}`, senão `width × height` (Q-ADD-13; ex.: 1920×1080 com 90° → 1080×1920). Frame rate como fração para não perder precisão (ex.: 30000/1001). `rotation` normalizada para 0–359 e múltiplo de 90. |
| **PerfilStreamVideo** (só na ingestão, não persistido) | `pixFmt`; `bitDepth`; `chromaSubsampling` (4:2:0, 4:2:2, 4:4:4); `h264Profile` | Usado só para decidir a compatibilidade com o navegador (T-06, Q-ADD-20). "Compatível com o navegador" ⇔ H.264 de 8 bits `yuv420p`. |
| **ChavesArmazenamento** | `originalKey`; `previewKey` (opcional); `thumbKey`; `firstFrameKey` | Cada chave é uma ChaveObjeto num estágio de vídeo próprio. `previewKey` existe se e só se `RegraCopiaPreVisualizacao` o exige. O leitor usa `previewKey` quando existe e `originalKey` nos restantes casos; descarregamento e operações usam sempre `originalKey` (UPLOAD-017). |
| **ChaveObjeto** | `bucket` (`user-<ownerId>`); `estagio` (EstagioVideo); `nome` (UUID + extensão) | Identificador único, não colidente (UPLOAD-007). O bucket é o do **dono do projeto**, não o de quem carrega. |
| **EstagioVideo** | `video_src` \| `video_out` \| `video_preview` \| `video_thumb` | Conjunto fechado e separado dos estágios de imagem (T-08): uma rota de imagem recusa um estágio de vídeo e vice-versa. Sem `video_zip`. Original em `video_src`; cópia MP4 em `video_preview`; miniatura e fotograma 0 em `video_thumb`. `video_out` é declarado para a B003 (resultados de operações). |
| **FormatoContentor** (entrada da matriz) | `container`; `extensao`; `mimeType`; `codecsVideoAdmitidos`; `codecsAudioAdmitidos` | Matriz fechada (RN3, NFR-003, T-05): MP4 `.mp4` `video/mp4` → vídeo {H.264}, áudio {AAC}; MOV `.mov` `video/quicktime` → {H.264}, {AAC}; AVI `.avi` `video/x-msvideo` → {H.264, MPEG-4 Part 2}, {AAC, MP3}. Áudio sempre opcional (FA4). Única fonte: a política de formatos. |
| **LimitesPerfil** | `maxBytes`; `maxDurationMs` | Registado: 200 MB e 5 min; Premium: 2 GB e 60 min (RN4, NFR-007). `anonymous`: sem limites, porque não tem acesso. Os limites são inclusivos (≤). |
| **Permissao** | `leitura` \| `edicao` \| `propriedade` | Ordem: propriedade ⊇ edição ⊇ leitura. Carregar exige edição ou propriedade; consultar e reproduzir exigem leitura (AUTH-003). |
| **IdentidadeExecutor** | `callerId` (utilizador do JWT); `tipoPerfil` | Obtida de um JWT válido e não expirado (AUTH-001, NFR-001). O `callerId` tem de coincidir com o `:user` do caminho, salvo acesso por partilha. |
| **InstantesDerivados** | `instanteMiniatura`; `larguraMaxFotograma0 = 1280` | `instanteMiniatura = 1 s` se `durationMs ≥ 1000`, senão `0` (fotograma 0) (UPLOAD-014, Q-ADD-22). O fotograma 0 tem a rotação aplicada e largura ≤ 1280 px, sem ampliar vídeos mais estreitos (T-07). |
| **ErroVideo** | `code`; `message`; `details`; `correlationId` | Forma estável `{error: {code, message, details}, correlationId}` (ERROR-001, T-10). Códigos da ingestão: `UNSUPPORTED_FORMAT` (contentor/MIME fora da matriz), `INVALID_CODEC` (UPLOAD-009/010), `LIMIT_EXCEEDED` (`details: {field: "size" \| "duration", limit, total}`), e, propostos (não fixados na ERS), `CORRUPTED_FILE` (UPLOAD-012) e `UPLOAD_ABORTED` (falha de rede/cancelamento). A causa técnica (fim do `stderr` do FFprobe/FFmpeg) fica só nos logs (ERROR-002). |
| **CorrelationId** | UUID | Gerado no router de vídeo do gateway e propagado a serviços, mensagens e respostas de erro (T-10). |

## Aggregates

| Aggregate Root | Members | Invariants |
|----------------|---------|------------|
| **Vídeo** | MetadadosTecnicos, ChavesArmazenamento, EstadoIngestao | (I1) `status = completed` ⇒ `meta` completo, `originalKey`, `thumbKey` e `firstFrameKey` presentes e os objetos existem no storage (integridade objeto ↔ metadados). (I2) `previewKey` presente ⇔ contentor ∈ {MOV, AVI} **ou** (MP4 **e** perfil de vídeo não compatível com o navegador). (I3) `container`, `videoCodec` e `audioCodec` pertencem à matriz (`FormatoContentor`). (I4) `sizeBytes ≤ maxBytes` e `durationMs ≤ maxDurationMs` do perfil de `createdBy` no momento da ingestão. (I5) Dimensões de apresentação coerentes com `rotation`. (I6) Original imutável: nenhuma transição altera `originalKey` nem o binário. (I7) Sem estado parcial: se a ingestão não chega a `completed`, não ficam objetos nos estágios de vídeo nem registo visível no projeto (Garantia Mínima). (I8) `mimeType` coerente com `container`. |
| **Carregamento** (transitório) | — | (C1) `bytesRecebidos` nunca excede `maxBytes` do perfil (a transferência é interrompida). (C2) `cancelado` ou `falhado` ⇒ dados parciais purgados e nenhum Vídeo criado. (C3) Só chega a `transferido` com o ficheiro completo e consolidado no storage. |

Projeto e Utilizador são raízes de outros contextos (baseline); este contexto referencia-os só por identificador.

## Domain Events

| Event | Trigger | Payload |
|-------|---------|---------|
| **CarregamentoIniciado** | Utilizador confirma o carregamento (passo 3) depois da validação no cliente | `uploadId`, `projectId`, `callerId`, `nomeDeclarado`, `tamanhoDeclarado`, `correlationId` |
| **ProgressoCarregamento** (só cliente) | Bytes transmitidos | `uploadId`, `percentagem` (0–100, monótona) |
| **CarregamentoCancelado** | Utilizador cancela ou a ligação cai antes do fim (FA2, exceção de rede) | `uploadId`, `motivo` (`cancelado` \| `rede`), `correlationId` → purga dos dados parciais |
| **CarregamentoRejeitado** | Tamanho acima do limite, extensão/MIME fora da matriz (cliente ou servidor) | `uploadId`, `ErroVideo` |
| **VideoRecebido** | Ficheiro completo consolidado em `video_src` com chave UUID (passo 4) | `videoId`, `projectId`, `ownerId`, `createdBy`, `originalKey`, `originalName`, `sizeBytes`, `correlationId` → Vídeo criado em `queued`; pedido de ingestão publicado no worker |
| **IngestaoIniciada** | Worker começa a ingestão | `videoId`, `correlationId` → `queued → processing` |
| **IngestaoConcluida** | Worker termina FFprobe, miniatura, fotograma 0 e, se aplicável, a cópia MP4, com tudo enviado ao storage | `videoId`, `meta` (MetadadosTecnicos), `thumbKey`, `firstFrameKey`, `previewKey?`, `correlationId` → validação final (I1–I5) e `processing → completed` |
| **IngestaoFalhada** | Ficheiro corrompido, codec ou contentor fora da matriz, duração acima do limite, erro do FFmpeg, ou mensagem esgotada após 2 entregas (*dead-letter*) | `videoId`, `ErroVideo` (categoria), `correlationId` → compensação: apagar objetos (`video_src`, `video_preview`, `video_thumb`) e o registo (I7) |
| **VideoDisponivel** (notificação ao cliente) | `IngestaoConcluida` ou `IngestaoFalhada` persistidas | `projectId`, `videoId`, `status`, `code?` (só identificadores e estado, sem nomes nem URLs: risco aceite da sala do projeto, T-03) |

## Domain Services

| Service | Operations | Dependencies |
|---------|------------|--------------|
| **AutorizacaoVideo** (`videoAuth` + permissões do projeto) | `autenticar(jwt)` → IdentidadeExecutor ou 401; `verificarUtilizadorDoCaminho(identidade, :user, share?)` → 403; `exigirPermissao(projeto, identidade, leitura \| edicao)` → 403; `recusarAnonimo(identidade)` → 403 | Validação JWT (segredo partilhado), RepositorioProjetos, GatewayPerfis |
| **PoliticaFormatos** (`formats.js`, T-05) | `extensaoAdmitida(nome)`, `mimeAdmitido(tipo)` (pré-validação no cliente); `validarStreams(meta)` → `UNSUPPORTED_FORMAT` \| `INVALID_CODEC`; `compativelNavegador(perfilStream)`; `planoPreVisualizacao(meta, perfilStream)` → nenhum \| remux \| {vídeo: cópia \| recodificação, áudio: cópia \| recodificação \| nenhum} | FormatoContentor (matriz fechada) |
| **PoliticaLimitesPerfil** | `limitesPara(tipoPerfil)` → LimitesPerfil; `verificarTamanho(bytes, limites)`; `verificarDuracao(ms, limites)` → `LIMIT_EXCEEDED` | LimitesPerfil |
| **OrquestradorIngestao** (serviço de projetos) | `aceitarCarregamento(identidade, projeto, ficheiro)` → Vídeo `queued`; `publicarIngestao(video)`; `aoIngestaoIniciada`, `aoIngestaoConcluida`, `aoIngestaoFalhada` (idempotentes: ignoram vídeos já em estado final; confirmam a mensagem só depois de persistir); `compensar(video)` | RepositorioVideos, ArmazenamentoVideo, BarramentoVideo, NotificadorVideo, PoliticaFormatos, PoliticaLimitesPerfil |
| **ProcessadorIngestao** (worker) | `inspecionar(ficheiro)` → MetadadosTecnicos + PerfilStreamVideo ou `CORRUPTED_FILE`; `extrairMiniatura(ficheiro, InstantesDerivados)`; `extrairFotograma0(ficheiro, rotation, 1280)`; `gerarCopiaMp4(ficheiro, plano)` → H.264 `yuv420p`/AAC com `+faststart`; `limparTemporarios(videoId)` | FFprobe/FFmpeg, ArmazenamentoVideo (URLs internos GET/PUT), BarramentoVideo |
| **CalculoDimensoesApresentacao** | `apresentacao(width, height, rotation)` → `(displayWidth, displayHeight)` | — |
| **ServicoUrlsVideo** (`videoUrls.js`, T-08) | `urlLeituraInterna(chave)`; `urlEscritaInterna(chave, contentType)`; `estagioValido(estagio)` | Cliente S3 existente, EstagioVideo |

## Repository Interfaces

| Repository | Entity | Methods |
|------------|--------|---------|
| **RepositorioVideos** (coleção `videos`) | Vídeo | `criar(video)` (em `queued`); `obter(projectId, videoId)`; `listarConcluidos(projectId)`; `transitar(videoId, de, para)` (condicional ao estado atual, para idempotência); `concluirIngestao(videoId, meta, chaves)` (condicional a `processing`); `remover(videoId)` |
| **RepositorioProjetos** (baseline, só leitura) | Projeto | `obter(projectId)`; `permissaoDe(projectId, callerId)` → Permissao |
| **GatewayPerfis** (baseline, só leitura) | Utilizador | `tipoPerfil(callerId)` |
| **ArmazenamentoVideo** (porta para o storage) | ChaveObjeto | `gravarEmStreaming(chave, fluxo, tamanho)` ou `urlEscrita(chave)` (conforme Q-ADD-04); `existe(chave)`; `remover(chave)`; `garantirBucket(ownerId)` |
| **BarramentoVideo** (porta AMQP, `amqp.js`) | — | `publicarIngestao(pedido)` em `video_operations_queue`; `consumirRespostas(handler)` de `video_project_queue` com confirmação manual |
| **NotificadorVideo** (porta para `video_ws_queue`) | — | `notificar(projectId, userId, evento)` |

## Ubiquitous Language

| Term | Definition |
|------|------------|
| **Vídeo** | Recurso de projeto distinto de uma imagem, guardado na coleção `videos`, com binário original, metadados técnicos e imagens derivadas. |
| **Original** | Ficheiro carregado pelo utilizador, no contentor original (MP4/MOV/AVI); imutável; fonte das operações e do descarregamento. |
| **Carregamento** | Transferência do ficheiro do navegador para o storage, com progresso e cancelamento; termina quando o ficheiro está consolidado. |
| **Ingestão** | Processamento assíncrono que se segue ao carregamento: inspeção FFprobe, validação, miniatura, fotograma 0 e cópia de pré-visualização; termina em `completed` ou `failed`. |
| **Matriz de formatos** | Lista fechada de contentores e codecs admitidos (RN3, T-05). |
| **Perfil** | Tipo de conta do executor: `anonymous` (sem acesso), Registado (200 MB / 5 min) ou Premium (2 GB / 60 min). |
| **Executor** (`createdBy`) | Utilizador que faz o carregamento; o seu perfil define os limites. |
| **Dono** (`ownerId`) | Dono do projeto; o bucket do storage é o dele, mesmo quando um convidado carrega. |
| **Permissão de leitura / edição** | Nível de acesso ao projeto: leitura para consultar e reproduzir; edição ou propriedade para carregar e transformar. |
| **Etiqueta de rotação** | Metadado do contentor (0/90/180/270°) que indica como apresentar o vídeo, sem alterar as amostras codificadas. |
| **Dimensões codificadas / de apresentação** | Largura × altura das amostras na stream / largura × altura depois de aplicar a etiqueta de rotação. |
| **Miniatura** | JPEG tirado a 00:00:01 (ou ao fotograma 0 em vídeos com menos de 1 s), mostrado na galeria. |
| **Fotograma 0** | Primeiro fotograma, rodado e reduzido a ≤ 1280 px de largura, base das pré-visualizações estáticas. |
| **Cópia de pré-visualização** | MP4 H.264 `yuv420p`/AAC gerado para MOV, AVI e MP4 com perfis que o navegador não reproduz; usada só pelo leitor integrado. |
| **Compatível com o navegador** | Stream H.264 de 8 bits `yuv420p`, reproduzível pela tag `<video>`. |
| **Estágio** | Prefixo lógico do storage que separa os tipos de objeto (`video_src`, `video_out`, `video_preview`, `video_thumb`). |
| **Leitor integrado** | Reprodutor no frontend com reprodução, pausa, *seek*, volume e ecrã inteiro. |
| **Garantia mínima** | Em erro ou cancelamento não fica objeto parcial no storage nem registo órfão em `videos`, e o projeto fica como estava. |
| **Regra 2.6** | Só acrescentar: nenhuma linha de código existente é alterada; o vídeo liga-se por pontos de ligação novos. |
| **`correlationId`** | Identificador de rastreio gerado por pedido de vídeo e presente em logs, mensagens e respostas de erro. |

## Cobertura da story ST-VID-000

- ✅ **AC1** (carregar MP4/MOV/AVI dentro dos limites e da matriz, guardar em `videos` e `video_src`, metadados com rotação e dimensões de apresentação): Vídeo, MetadadosTecnicos, PoliticaFormatos, PoliticaLimitesPerfil, VideoRecebido, IngestaoConcluida, I3–I5.
- ✅ **AC2** (miniatura a 00:00:01 ou fotograma 0; fotograma 0 rodado, ≤ 1280 px): InstantesDerivados, ProcessadorIngestao, I1.
- ✅ **AC3** (cópia MP4 `yuv420p` para MOV, AVI e MP4 incompatível): PerfilStreamVideo, `planoPreVisualizacao`, I2.
- ✅ **AC4** (limites, formato, codec, corrupção, falha ou cancelamento → sem objeto nem registo): Carregamento C1–C3, IngestaoFalhada + compensação, I7, ErroVideo.
- ✅ **AC5** (401 sem JWT, 403 `anonymous`, leitura vs edição): AutorizacaoVideo, Permissao, IdentidadeExecutor.
- ✅ **AC6** (reproduzir no leitor; carregamento e reprodução sem débito de quota): ChavesArmazenamento (regra do leitor), regra "sem quota" na entidade Vídeo; nenhuma dependência do contexto de quota.

## Decisões tomadas no checkpoint do Estágio 1

As questões abertas deste modelo foram respondidas pela equipa e registadas em `docs/specsDuvidas.md`:

1. **D-11 (Q-ADD-04):** carregamento por PUT pré-assinado através do `location /s3-video/`. O tamanho declarado é validado ao pedir o URL e o objeto é verificado com `headObject` na confirmação. A porta ArmazenamentoVideo usa `urlEscrita(chave)`.
2. **D-12:** `failed` é um estado interno curto; a compensação apaga o registo e os objetos logo depois de notificar o cliente (I7).
3. **D-13:** a ingestão faz duas idas ao worker: (1) FFprobe → metadados; (2) o serviço de projetos valida com o `formats.js` e calcula o plano, e o worker gera a miniatura, o fotograma 0 e, se o plano o pedir, a cópia MP4. `planoPreVisualizacao` fica só no serviço de projetos.
4. **D-14:** os códigos `CORRUPTED_FILE` e `UPLOAD_ABORTED` são aceites; o evento WebSocket da ingestão chama-se `video-ingest-update`.
