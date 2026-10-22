# Dúvidas da revisão dos artefactos specsmd (Inception)

| Campo  | Valor                                                                                                                              |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Data   | 2026-10-21                                                                                                                         |
| Fontes | docs/add.md (ADD v1.1), docs/requirements.md (v2.4), docs/use-cases.md (v1.5), docs/inception/artefactos-finais.md, docs/diagrams/ |

## D-01 — Escala de complexidade dos bolts

- **Onde:** `memory-bank/bolts/001-video-lifecycle/bolt.md` a `memory-bank/bolts/009-video-batch/bolt.md`, campo `complexity` (`avg_complexity`, `avg_uncertainty`, `max_dependencies`, `testing_scope`).
- **Dúvida:** Que valores de 1 a 3 se atribuem aos quatro campos de complexidade de cada bolt?
- **O que as fontes dizem:** o ADD v1.1 dá um esforço S/M/L por caso de uso (secções 4.1 a 4.10, "Esforço estimado", e tabela-resumo da secção 5: T-00 L; UC-VID-006, 007, 010 e 011 S; UC-VID-008, 009 e 012 M; UC-VID-013, 014 e 015 L). `docs/inception/artefactos-finais.md` §4 dá a complexidade por Unit (Unit 001 L, Unit 002 XL, Unit 003 XL). Nenhuma fonte dá valores para os UC-VID-000 a 005 isolados, nem para a incerteza, as dependências ou o âmbito de testes, nem uma conversão de S/M/L para a escala 1–3.
- **Opções:** (a) converter o esforço do ADD (S=1, M=2, L=3) em `avg_complexity` e deixar os outros três campos por preencher; (b) a equipa atribui os quatro valores por bolt; (c) deixar o bloco por preencher até à Construção.
- **Resposta:** **(a), com o máximo do esforço do ADD por bolt.** Converte S=1, M=2, L=3 em `avg_complexity`, usando o maior esforço dos UC (ou do T-00) de cada bolt: B001 = 3 (T-00 L), B002 = 1 (UC-006 e 007 S), B005 = 2 (UC-008 e 009 M), B007 = 2 (UC-012 M), B008 = 3 e B009 = 3 (UC-013, 014 e 015 L). Na B003, B004 e B006 não há esforço no ADD, por isso o campo fica `null`. Os campos `avg_uncertainty`, `max_dependencies` e `testing_scope` ficam todos `null` e são preenchidos no início de cada bolt na Construção.

## D-02 — Componentes de fundação usados pela B001 e pela B002 mas atribuídos à B003

- **Onde:** `memory-bank/bolts/001-video-lifecycle/bolt.md`, `002-video-access/bolt.md` e `003-video-task-foundation/bolt.md` (campos `requires_bolts`, `enables_bolts`, "Saídas esperadas"); `units/001-video-lifecycle/unit-brief.md`; `traceability.md` (propriedade de `REQ-VID-AUTH-*`).
- **Dúvida:** Em que bolt são construídos o router de vídeo com o `videoAuth`, o worker `Tools/video/` com FFprobe/FFmpeg, o módulo `projects/video/formats.js` e os URLs de escrita, que a ingestão (B001) e o acesso (B002) já precisam, quando a tabela põe a B001 e a B002 antes da B003?
- **O que as fontes dizem:** ADD T-00 inclui na fundação mínima as rotas de vídeo com o `videoAuth`, o worker de vídeo (T-02) e a ingestão com FFprobe, miniatura, fotograma 0 e cópia MP4 (T-06: "é responsabilidade da fundação T-00"); T-05 faz do `formats.js` a única fonte da matriz; T-08 tem os URLs de escrita para o worker; a Q-ADD-01 manda construir "T-00 e T-02 primeiro". `artefactos-finais.md` §5: B001 = UC-VID-000 (sem dependências), B002 e B003 dependem de B001, e a B003 tem "registo de operações, worker de vídeo único e executor de cadeias". `traceability.md` atual atribui os `REQ-VID-AUTH-*` à B003.
- **Opções:** (a) a B001 constrói uma versão mínima do router, do `videoAuth`, do worker (só ingestão) e do `formats.js`, que a B003 estende; (b) a B003 passa a ser requerida pela B001 e pela B002 (alterando a tabela); (c) estes componentes passam para a B001 e a B003 fica com tarefas, quota, cancelamento, registo de operações e executor.
- **Resposta:** **(c).** A tabela de Bolts não muda (B001 sem dependências; B002 e B003 dependem da B001). A B001 constrói a parte do T-00 de que a ingestão precisa: a coleção `videos`, o `videoStages.js` e os URLs de escrita (T-08), o `formats.js` (T-05), os routers de vídeo com o `videoAuth`, as filas `video_operations_queue`, `video_project_queue` e `video_ws_queue`, o módulo `wsGateway/video.js` e o worker `Tools/video/` com a ingestão (FFprobe, miniatura, fotograma 0 e cópia MP4, T-06). A B003 fica com o `VideoTask`, o `video_project_locks`, a exchange `video_control`, a quota (T-04), o cancelamento e o progresso (T-03), o registo de operações (T-01) e o executor de cadeias (T-02). Os `REQ-VID-AUTH-*` passam para a B001.

## D-03 — Propriedade dos requisitos realizados pelo executor de cadeias da B003

- **Onde:** `traceability.md` (linhas `REQ-VID-NFR-010`, `REQ-VID-NFR-013` e `REQ-VID-NFR-018`); stories `units/002-video-transformations/stories/ST-VID-001-video-trim.md` e `units/003-video-composition/stories/ST-VID-014-video-chain.md`; bolts `003-video-task-foundation`, `004-video-basic-edits` e `008-video-concat-chain`.
- **Dúvida:** Os requisitos NFR-010 (FFmpeg em Docker), NFR-013 (uma recodificação por cadeia) e NFR-018 (saída MP4 H.264/AAC) continuam a pertencer às stories ST-VID-001 (B004) e ST-VID-014 (B008), ou passam para a ST-VID-COM-001 (B003), que agora constrói o worker e o executor?
- **O que as fontes dizem:** ADD T-02: o worker único `Tools/video/` e o executor com um único `-filter_complex` cumprem a NFR-010 e a NFR-013; a codificação de saída por omissão é `libx264` + `aac` (T-02) e o formato de trabalho é MP4 (T-05, DQ-013). `artefactos-finais.md` §5: o worker e o executor de cadeias estão na B003; a B008 fica com a junção e a validação de estrutura. A `traceability.md` atual atribui a NFR-010 e a NFR-018 à ST-VID-001 e a NFR-013 à ST-VID-014.
- **Opções:** (a) manter a propriedade atual (a B003 fornece o componente e a B004/B008 verificam os requisitos); (b) passar os três NFR para a ST-VID-COM-001 e a B003; (c) passar só a NFR-010 e a NFR-013 para a B003 e manter a NFR-018 na B004.
- **Resposta:** **Opção nova: cada requisito vai para o bolt que constrói o componente.** A NFR-010 (FFmpeg em Docker) passa para a B001, que cria o worker (ver D-02). A NFR-013 (uma recodificação por cadeia) e a NFR-018 (saída MP4 H.264/AAC por omissão) passam para a ST-VID-COM-001 e a B003, que constroem o executor e a codificação por omissão (T-02). A B004 e a B008 continuam a verificar estes três NFR nos seus critérios de aceitação, mas não são donas deles.

## D-04 — Bolt da rotina periódica de recuperação e limpeza (Q-ADD-14)

- **Onde:** `memory-bank/bolts/003-video-task-foundation/bolt.md` e `memory-bank/bolts/009-video-batch/bolt.md` ("Saídas esperadas"); `units/001-video-lifecycle/unit-brief.md`.
- **Dúvida:** Em que bolt(s) se constrói a rotina periódica do serviço de projetos da Q-ADD-14?
- **O que as fontes dizem:** ADD Q-ADD-14 (aceite): a rotina retoma ou fecha tarefas e lotes parados, liberta lugares de tarefa ativa sem dono, passa a `failed` os ZIP sem progresso e remove os recursos de vídeo de projetos apagados; é citada em T-00 (limpeza de projetos apagados), T-03 (lugares sem dono), T-09 (lotes parados) e 4.10 (ZIP). `artefactos-finais.md` §5 não a atribui a nenhum bolt.
- **Opções:** (a) toda na B003; (b) a parte de tarefas, lugares e projetos apagados na B003 e a parte de lotes e ZIP na B009; (c) um bolt próprio, depois da B009.
- **Resposta:** **(a), só com a parte que não depende de lotes.** A B003 cria a rotina periódica para as tarefas paradas, os lugares de tarefa ativa sem dono e a remoção dos recursos de vídeo de projetos apagados. A parte dos lotes parados e dos ZIP fica fora desta construção, porque a B009 não é implementada (ver D-06).

## D-05 — Desenho da extração de fotogramas (UC-VID-005)

- **Onde:** `memory-bank/bolts/006-video-frame-export/bolt.md` ("Objetivo", "Saídas esperadas"); story `units/002-video-transformations/stories/ST-VID-005-video-frame-export.md`.
- **Dúvida:** A extração de fotogramas é um módulo do registo de operações e do worker único (T-01, T-02), e onde ficam guardadas as imagens extraídas (estágios de imagem existentes ou estágios de vídeo novos)?
- **O que as fontes dizem:** o âmbito do ADD é UC-VID-006 a 015 (secção 1.2); a 2.5 diz só que a extração "tem de ser construída (T-00)". O ADD exclui a extração das cadeias e dos lotes (4.9, 4.10), e a tabela de composição do T-02 não a inclui. `artefactos-finais.md` §5: B006 é DDD, depende da B003 e de "integração imagem". A UC-VID-005 e a REQ-VID-FRAMES dizem que as imagens são recursos de imagem normais do projeto, mas não indicam o componente nem o estágio.
- **Opções:** (a) módulo do worker único, com resposta pelo módulo AMQP de vídeo e imagens gravadas nos estágios de imagem existentes; (b) módulo do worker único com estágios próprios; (c) a equipa desenha a extração num complemento ao ADD antes da B006.
- **Resposta:** **Não se aplica nesta construção.** A B006 não é implementada (ver D-06), por isso o desenho da extração fica por fazer. Se a B006 for retomada, a equipa escreve antes um complemento ao ADD, porque o ADD v1.1 não decide onde a extração corre nem onde ficam as imagens.

## D-06 — Bolts B006 e B009 fora desta construção (decisão da equipa)

- **Onde:** `memory-bank/bolts/006-video-frame-export/bolt.md`, `memory-bank/bolts/009-video-batch/bolt.md`, as stories `units/002-video-transformations/stories/ST-VID-005-video-frame-export.md` e `units/003-video-composition/stories/ST-VID-015-video-batch.md`, `units.md`, `unit-brief.md` das Units 002 e 003, `traceability.md`, `story-index.md` e as saídas esperadas da B001 e da B003.
- **Dúvida:** A equipa decidiu não implementar a extração de fotogramas (UC-VID-005, B006) nem o processamento em lote (UC-VID-015, B009). Como ficam os artefactos?
- **O que as fontes dizem:** na tabela de `artefactos-finais.md` §5, nenhum bolt depende da B006 nem da B009 (são folhas do grafo), por isso as B001 a B005, B007 e B008 não são afetadas. O ADD põe na fundação peças que só os lotes usam: o modelo `VideoBatch` (T-00, T-09), o estágio `video_zip` (T-08), o campo `batch_id` na coleção `videos`, o endpoint `POST …/videos/batch`, os itens `kind: "batch_item"` (T-03), a devolução por item (T-04) e a dependência `archiver` (secção 6). Os documentos `docs/` continuam a incluir o UC-VID-005 e o UC-VID-015 no MVP.
- **Opções:** (a) apagar os dois bolts; (b) manter os bolts e as stories com `status: blocked` e o motivo; (c) manter como `planned`.
- **Resposta:** **(b).**
  - Os dois bolts e as duas stories ficam no memory-bank com `status: blocked` e o motivo "Fora do âmbito desta construção por decisão da equipa (specsDuvidas D-06)". Os bolts não são apagados, para a rastreabilidade não se perder.
  - A B001 e a B003 **não** constroem o `VideoBatch`, o estágio `video_zip`, o endpoint de lote, os itens `batch_item`, a devolução por item, a rotina de lotes e ZIP, nem o `archiver`. O campo `batch_id` também não é criado.
  - A extração de fotogramas também não entra no worker.
  - Na `traceability.md`, os requisitos `REQ-VID-FRAMES-*`, `REQ-VID-BATCH-*`, `REQ-VID-TASK-007` e `REQ-VID-QUOTA-007` (só a parte de lotes) ficam marcados como "não cobertos nesta construção (D-06)".
  - Nas Units 002 e 003, `units.md` e `unit-brief.md` registam que essa parte do âmbito fica de fora.
  - A predefinição de cadeia (UC-VID-014 FA3) continua a poder ser guardada e usada numa nova cadeia; só deixa de poder ser carregada num lote.
  - Os documentos em `docs/` não são alterados nesta interação.

## D-07 — NFR usados só pela extração de fotogramas e pelos lotes

- **Onde:** `memory-bank/intents/001-video-processing-support/traceability.md` (linhas `REQ-VID-NFR-004`, `019`, `020` e `014`); `memory-bank/bolts/006-video-frame-export/bolt.md` e `009-video-batch/bolt.md` ("Requisitos rastreados"); stories `units/002-video-transformations/stories/ST-VID-005-video-frame-export.md` e `units/003-video-composition/stories/ST-VID-015-video-batch.md`; `unit-brief.md` das Units 002 e 003.
- **Dúvida:** A D-06 manda marcar como "não cobertos nesta construção" os `REQ-VID-FRAMES-*`, os `REQ-VID-BATCH-*`, a `REQ-VID-TASK-007` e a parte de lotes da `REQ-VID-QUOTA-007`, mas não diz nada sobre a NFR-004, a NFR-019 e a NFR-020 (donas: ST-VID-005, B006) nem sobre a NFR-014 (dona: ST-VID-015, B009). Também ficam marcadas como não cobertas?
- **O que as fontes dizem:** ERS v2.4 (`docs/requirements/REQ-VID-NFR.md`): a NFR-004 (fotogramas em JPEG ou PNG), a NFR-019 (resolução das imagens extraídas) e a NFR-020 (limite de fotogramas por extração) têm origem só no UC-VID-005; a NFR-014 (limite de vídeos por lote) é sobre lotes, embora a origem cite também o UC-VID-013 e o UC-VID-014. Na `traceability.md`, as quatro pertencem a bolts agora `blocked`. Até à resposta, ficam com o estado "Especificado; implementação pendente".
- **Opções:** (a) marcar as quatro como "não cobertas nesta construção (D-06)"; (b) marcar só a NFR-004, a NFR-019 e a NFR-020 e manter a NFR-014; (c) manter as quatro como estão.
- **Resposta:** **A NFR-004, a NFR-019 e a NFR-020 ficam "Não coberto nesta construção (D-06)"**, porque só servem a extração. **A NFR-014 continua coberta na parte da junção e da cadeia** (UC-VID-013 RN2-RN3, UC-VID-014 RN5) e fica parcialmente não coberta só na parte de lotes (UC-VID-015 RN2), como a QUOTA-007. Princípio da equipa: só ficam de fora o UC-VID-005 (B006) e o UC-VID-015 (B009); tudo o resto é implementado.

## D-08 — Componentes de fundação que a D-02 não distribui

- **Onde:** `memory-bank/bolts/001-video-lifecycle/bolt.md` ("Notas"), `002-video-access/bolt.md` ("Decisões do ADD v1.1", T-08) e `003-video-task-foundation/bolt.md` ("Decisões do ADD v1.1", T-03 e T-08, e "Saídas esperadas"); `units/001-video-lifecycle/unit-brief.md`.
- **Dúvida:** A resposta à D-02 põe na B001 as filas, os URLs de escrita e o worker com a ingestão, e na B003 o `VideoTask`, os locks, o `video_control`, a quota, o cancelamento, o progresso, o registo de operações e o executor. Em que bolt se constroem estes componentes, que não aparecem em nenhuma das duas listas: (1) o módulo `projects/video/amqp.js`; (2) os URLs internos de leitura (GET) e a criação do `route/video.js` e do `services/videoUrls.js` do `imageStorageService`; (3) o volume `video_tmp`; (4) os argumentos da `video_operations_queue` (*quorum*, `x-delivery-limit: 1`, `x-consumer-timeout`, *dead-letter*)?
- **O que as fontes dizem:** ADD T-03: o `amqp.js` publica em `video_operations_queue` e consome `video_project_queue` com confirmação manual, e é a única via de vídeo entre o serviço de projetos e o worker. A ingestão com o worker (B001) já troca mensagens por estas filas. ADD T-08: o worker pede ao módulo de vídeo do storage os URLs de leitura quando começa a tarefa e os de escrita quando o FFmpeg termina; o `services/videoUrls.js` gera os dois tipos de URL, e o `route/video.js` é montado com `app.use("/video", …)`. A B002 descreve a montagem do `route/video.js` e o URL de leitura com 900 s. ADD T-02: os temporários do worker ficam em `/tmp/video/<taskId>/`, no volume `video_tmp`. ADD T-03: os argumentos fazem parte da declaração da `video_operations_queue` em `rabbitMQ/definitions.json`, que a D-02 põe na B001. Pela regra 2.6, uma fila declarada não se altera depois.
- **Opções:** (a) os quatro componentes vão para a B001, na medida em que a ingestão os usa, e a B002 e a B003 acrescentam o que lhes falta (URL de descarregamento de 900 s, tratamento das respostas de tarefa); (b) só o `amqp.js` e os argumentos da fila vão para a B001, e os URLs de leitura, o `route/video.js` e o `video_tmp` ficam onde estão; (c) a equipa distribui cada componente.
- **Resposta:** **Os quatro componentes vão para a B001**, porque a ingestão precisa deles: o `projects/video/amqp.js`; os URLs internos de leitura e o `route/video.js` com o `videoUrls.js` do `imageStorageService` (T-08); o volume `video_tmp`; e a declaração completa da `video_operations_queue`, já com todos os argumentos do T-03 (*quorum*, `x-delivery-limit`, `x-consumer-timeout` e *dead-letter*), porque pela regra 2.6 não podem ser acrescentados depois. A B003 estende estes componentes por acréscimo, sem os alterar. **Nota (confirmada pela equipa):** o `route/video.js` e o `videoUrls.js` são criados pela B001, e o URL de descarregamento de 900 s continua no âmbito da B002, que usa esse módulo por acréscimo. Princípio da equipa: só ficam de fora o UC-VID-005 (B006) e o UC-VID-015 (B009); tudo o resto é implementado.

## D-09 — Propriedade da NFR-011 depois da D-02

- **Onde:** `memory-bank/intents/001-video-processing-support/traceability.md` (linha `REQ-VID-NFR-011`); `memory-bank/bolts/003-video-task-foundation/bolt.md` ("Requisitos rastreados"); story `units/001-video-lifecycle/stories/ST-VID-COM-001-video-task-quota-foundation.md`.
- **Dúvida:** A NFR-011 (módulo de vídeo desacoplado por AMQP, com a fila independente `video_operations_queue`, sem alterar as ferramentas de imagem) continua a pertencer à ST-VID-COM-001 e à B003, ou passa para a ST-VID-000 e para a B001, que agora constrói as filas e o worker?
- **O que as fontes dizem:** ADD T-00: as filas de vídeo e o worker cumprem a NFR-011. A D-02 põe as filas e o worker na B001, e a D-03 adota a regra "cada requisito vai para o bolt que constrói o componente", mas só para a NFR-010, a NFR-013 e a NFR-018. A `traceability.md` atribui a NFR-011 à ST-VID-COM-001 (B003), com as decisões T-00 e T-02. Até à resposta, a atribuição mantém-se.
- **Opções:** (a) passar a NFR-011 para a ST-VID-000 e a B001; (b) manter na ST-VID-COM-001 e na B003, com a B001 a verificá-la.
- **Resposta:** **(a), pela regra da D-03.** A NFR-011 passa para a B001, que cria as filas e o worker. A B003 continua a verificá-la nos critérios de passagem. Princípio da equipa: só ficam de fora o UC-VID-005 (B006) e o UC-VID-015 (B009); tudo o resto é implementado.

## D-10 — Bolt que constrói a parte coberta da NFR-014

- **Onde:** `memory-bank/intents/001-video-processing-support/traceability.md` (linha `REQ-VID-NFR-014`); `memory-bank/bolts/008-video-concat-chain/bolt.md` e `009-video-batch/bolt.md` ("Requisitos rastreados"); stories `units/003-video-composition/stories/ST-VID-013-video-concat.md`, `ST-VID-014-video-chain.md` e `ST-VID-015-video-batch.md`; `units/003-video-composition/unit-brief.md`.
- **Dúvida:** A D-07 diz que a NFR-014 continua coberta na parte da junção e da cadeia (UC-VID-013 RN2-RN3, UC-VID-014 RN5) e só fica não coberta na parte de lotes. Mas a dona da NFR-014 é a ST-VID-015, no bolt B009, que está `blocked`, e a B008 não rastreia a NFR-014. Que story e que bolt constroem e verificam a parte coberta?
- **O que as fontes dizem:** ERS v2.4 (`docs/requirements/REQ-VID-NFR.md`): a NFR-014 diz "limites por perfil ao número de vídeos por lote" (2–10 Registado, 2–50 Premium), com origem no UC-VID-013 (RN2-RN3), no UC-VID-014 (RN5), no UC-VID-015 (RN2) e na DQ-015. A NFR-022 (limite de vídeos por junção), a NFR-023 (passos por cadeia) e a NFR-024 (duração da junção) têm a mesma origem e pertencem à ST-VID-013/014 e à B008. A `traceability.md` atribui a NFR-014 à ST-VID-015 e à B009, com as decisões T-09 e 4.10. Até à resposta, a atribuição mantém-se, e a linha fica com a parte de lotes marcada como não coberta.
- **Opções:** (a) a NFR-014 passa para a ST-VID-013 ou a ST-VID-014 e para a B008, que constrói a parte da junção e da cadeia; (b) a dona continua a ser a ST-VID-015 (B009), e a B008 verifica a parte coberta sem ser dona; (c) a equipa revê a D-07 para esta NFR.
- **Resposta:** **(a).** A NFR-014 passa a pertencer à ST-VID-013 (junção) e à B008, para a parte da junção e da cadeia (UC-VID-013 RN2-RN3, UC-VID-014 RN5). A ST-VID-014 verifica-a nos seus critérios. A parte de lotes (UC-VID-015 RN2) continua "parcialmente não coberta (D-06)" na ST-VID-015 e na B009.

## D-11 — Estratégia de carregamento até 2 GB (Q-ADD-04)

- **Onde:** `memory-bank/bolts/001-video-lifecycle/bolt.md` ("Decisões do ADD v1.1", Q-ADD-04); `ddd-01-domain-model.md` (agregado Carregamento, porta ArmazenamentoVideo).
- **Dúvida:** O carregamento de vídeos até 2 GB faz-se por *streaming* pelo API Gateway e pelo serviço de projetos, ou por upload direto com URL pré-assinado PUT?
- **O que as fontes dizem:** ADD Q-ADD-04 (pendente): o `multer.memoryStorage()` das rotas de imagem carrega o ficheiro inteiro em memória; em qualquer caso, a rota escolhida tem um `location` novo no nginx com `client_max_body_size 2g` e `proxy_request_buffering off` (T-08). O T-08 descreve o URL de escrita só para a rede interna (worker).
- **Opções:** (a) *streaming* pelos serviços; (b) PUT pré-assinado direto.
- **Resposta:** **(b).** O cliente pede ao router de vídeo um URL de escrita, com o tamanho declarado validado face ao perfil (≤ 200 MB Registado, ≤ 2 GB Premium); envia o ficheiro por PUT através do `location /s3-video/` do nginx (com `client_max_body_size 2g` e `proxy_request_buffering off`, T-08); depois confirma o fim do envio numa rota do router de vídeo, que verifica o objeto com `headObject` e só então inicia a ingestão. Motivo: o `multer.memoryStorage()` não serve para 2 GB, o tráfego não passa pelo API Gateway (NFR-016) e nada do código existente muda (regra 2.6). Esta decisão alarga o URL de escrita do T-08, previsto só para a rede interna, ao carregamento pelo cliente.

## D-12 — Estado `failed` da ingestão e Garantia Mínima

- **Onde:** `ddd-01-domain-model.md` (EstadoIngestao, invariante I7); ADD T-00 (esquema da coleção `videos`); ST-VID-000 AC4.
- **Dúvida:** O T-00 prevê `status: failed` para a ingestão, mas o AC4 e a Garantia Mínima do UC-VID-000 pedem que não fique registo em `videos`. Como se conciliam?
- **O que as fontes dizem:** ADD T-00: `queued`, `processing` e `failed` só se aplicam à ingestão. UC-VID-000, Garantia Mínima: nenhum registo órfão é gravado no MongoDB. ST-VID-000 AC4: não fica objeto no storage nem registo em `videos`.
- **Opções:** (a) `failed` como estado interno curto, seguido de limpeza; (b) manter registos `failed` visíveis.
- **Resposta:** **(a).** O `failed` é um estado interno curto: a limpeza apaga o registo e os ficheiros logo depois de o cliente ser notificado, o que cumpre a Garantia Mínima do UC-VID-000.

## D-13 — Onde se valida a ingestão e se calcula o plano da cópia MP4

- **Onde:** `ddd-01-domain-model.md` (PoliticaFormatos, ProcessadorIngestao); ADD T-05, T-06.
- **Dúvida:** O T-05 diz que o worker não tem cópia da matriz, mas os codecs só se conhecem depois do FFprobe no worker. Como se valida a ingestão e se planeia a cópia de pré-visualização?
- **O que as fontes dizem:** ADD T-05: `projects/video/formats.js` é a única fonte da matriz; o worker recebe o plano. ADD T-06: a cópia é uma "conversão para MP4" planeada pelo mesmo módulo, com a condição de compatibilidade com o navegador.
- **Opções:** (a) duas idas ao worker; (b) a mensagem de ingestão leva a matriz como dados.
- **Resposta:** **(a).** A primeira ida só faz o FFprobe e devolve os metadados. O serviço de projetos valida-os com o `formats.js` (codecs e duração por perfil) e calcula o plano da cópia MP4 (T-05, T-06). A segunda ida gera a miniatura, o fotograma 0 e, se o plano o pedir, a cópia. Motivo: a validação de codecs e de duração já precisa do `formats.js` no serviço de projetos, e o worker fica sem uma segunda cópia da matriz.

## D-14 — Códigos de erro da ingestão e evento WebSocket

- **Onde:** `ddd-01-domain-model.md` (ErroVideo, evento VideoDisponivel); ADD T-03, T-10.
- **Dúvida:** Que códigos de erro se usam para ficheiro corrompido e para transferência interrompida, que a ERS não fixa, e como se chama o evento WebSocket da ingestão, que o ADD não define?
- **O que as fontes dizem:** REQ-VID-UPLOAD-012 e a exceção de rede do UC-VID-000 não dão código. ADD T-03 define só `video-task-update` e `video-batch-update`.
- **Opções:** (a) `CORRUPTED_FILE`, `UPLOAD_ABORTED` e `video-ingest-update`; (b) outros nomes.
- **Resposta:** **(a).** Aceitam-se `CORRUPTED_FILE` e `UPLOAD_ABORTED`. O evento WebSocket da ingestão chama-se `video-ingest-update`, ao lado do `video-task-update` do T-03.

## D-15 — Estado do vídeo entre o pedido do URL e a confirmação; carregamentos abandonados

- **Onde:** `memory-bank/bolts/001-video-lifecycle/ddd-02-technical-design.md` (API Design, rotas `uploads`, `upload/complete` e `DELETE …/upload`; Data Persistence).
- **Dúvida:** Com o PUT pré-assinado (D-11), há um intervalo entre a emissão do URL e a confirmação. Onde fica o estado do carregamento nesse intervalo, e quem limpa um carregamento abandonado (URL pedido e ficheiro enviado, ou não, mas nunca confirmado nem cancelado, por exemplo porque o separador foi fechado)?
- **O que as fontes dizem:** ADD T-00: `status` `queued | processing | completed | failed`, em que `queued`, `processing` e `failed` só se aplicam à ingestão. UC-VID-000 Garantia Mínima e ST-VID-000 AC4: em falha ou cancelamento não fica objeto nem registo. A rotina periódica da Q-ADD-14 é da B003 (D-04) e não prevê carregamentos abandonados. Nenhuma fonte trata o intervalo entre o URL e a confirmação.
- **Opções:** (a) o registo é criado em `videos` ao emitir o URL, com `status: queued` (= à espera do envio), e a chave é derivada do `videoId`; a confirmação passa-o a `processing`; o cancelamento (`DELETE …/upload`) apaga o objeto e o registo; os `queued` com mais de 900 s + margem são apagados (objeto e registo) pela rotina da Q-ADD-14, o que acrescenta este caso ao âmbito da B003; (b) não há registo até à confirmação: o pedido do URL devolve um *token* assinado com a chave, o nome e o tamanho, e a rotina da B003 apaga os objetos de `video_src` sem registo; (c) como (a), mas com uma rotina própria na B001.
- **Resposta:** **(a), aceite.** O registo é criado em `videos` com `status: queued` ao emitir o URL, com a chave derivada do `videoId`; a confirmação passa-o a `processing` e o cancelamento (`DELETE …/upload`) apaga o objeto e o registo. Esse registo `queued` nunca aparece na galeria, que só lista vídeos `completed` (COM-002). A limpeza dos carregamentos abandonados (`queued` com mais de 900 s + margem: objeto e registo) fica explicitamente no âmbito da B003, na rotina periódica da Q-ADD-14.

## D-16 — Ponto de montagem do UI de vídeo no frontend

- **Onde:** `ddd-02-technical-design.md` (Componentes e ficheiros, ponto de ligação 8).
- **Dúvida:** Onde aparecem o carregamento, a galeria e o leitor de vídeo no frontend, e como se ligam ao ecrã do projeto sem alterar linhas existentes?
- **O que as fontes dizem:** ADD 2.6: são permitidos "componentes novos no frontend" e pontos de ligação novos sem tocar nas linhas existentes; ADD 2.1: o editor de projetos está em `frontend/app/dashboard/[pid]/page.tsx`. UC-VID-000 passo 7: o vídeo aparece "na galeria de recursos do projeto". Nenhuma fonte diz onde se monta o UI de vídeo.
- **Opções:** (a) acrescentar ao `app/dashboard/[pid]/page.tsx` uma linha `import` e um elemento `<VideoSection />`, como ponto de ligação; (b) uma página nova `app/dashboard/[pid]/videos/page.tsx`, sem tocar em ficheiros existentes, a que se chega por URL (sem ligação no ecrã do projeto, salvo com a opção (a) para o link); (c) outra.
- **Resposta:** **(a), aceite.** Acrescenta-se ao `app/dashboard/[pid]/page.tsx` uma linha `import` e um elemento `<VideoSection />`, como ponto de ligação permitido pela regra 2.6.

## D-17 — Rotas de galeria e de reprodução

- **Onde:** `ddd-02-technical-design.md` (API Design: `GET …/videos` e `GET …/videos/:video/playback`).
- **Dúvida:** Que rotas servem a galeria (passo 7 do UC-VID-000) e o leitor (passo 8), e com que URL o leitor reproduz o vídeo?
- **O que as fontes dizem:** ADD 4.1 e 4.2 definem só `GET …/videos/:video` (informações) e `GET …/videos/:video/download` (B002). ADD T-06: o leitor usa `preview_key` quando existe e `original_key` nos restantes casos. NFR-017: URLs temporários assinados por 15 min. Nenhuma fonte define a listagem nem o URL de reprodução.
- **Opções:** (a) `GET …/videos` (só `completed`, com URL assinado da miniatura) e `GET …/videos/:video/playback` (URL GET *inline* de 900 s pelo `/s3-video/`), ambas com permissão de leitura e recusa de `anonymous`, na B001; (b) a galeria usa o `GET …/videos/:video` da B002, e a B001 fica só com a listagem.
- **Resposta:** **(a), aceite.** A B001 constrói `GET …/videos` (só `completed`, com URL assinado da miniatura) e `GET …/videos/:video/playback` (URL GET *inline* de 900 s pelo `/s3-video/`), com permissão de leitura e recusa de `anonymous`.

## D-18 — Réplicas do worker e `x-consumer-timeout` (Q-ADD-10)

- **Onde:** `ddd-02-technical-design.md` (Data Persistence, filas; NFR Implementation, Desempenho); `docker-compose.yaml` (serviço `video`).
- **Dúvida:** Quantas réplicas do worker de vídeo se lançam, e que valor tem o `x-consumer-timeout` da `video_operations_queue`, que não pode ser alterado depois (regra 2.6, D-08)?
- **O que as fontes dizem:** ADD Q-ADD-10 (em aberto): com uma só réplica, uma tarefa Premium de 60 min bloqueia os outros projetos. ADD T-03: `x-consumer-timeout` "por exemplo 3 h = 10 800 000 ms".
- **Opções:** (a) 1 réplica e 10 800 000 ms; (b) N réplicas (indicar N) e 10 800 000 ms; (c) outros valores.
- **Resposta:** **(a), aceite.** 1 réplica por agora e `x-consumer-timeout` de 10 800 000 ms. O número de réplicas pode subir mais tarde no `docker-compose.yaml` sem mexer na fila (Q-ADD-10).

## D-19 — Parâmetros de codificação da cópia de pré-visualização MP4 (Q-ADD-11)

- **Onde:** `ddd-02-technical-design.md` (NFR Implementation, Cópia MP4).
- **Dúvida:** Que CRF e *preset* do `libx264` e que bitrate de AAC se usam quando a cópia de pré-visualização é recodificada na ingestão?
- **O que as fontes dizem:** ADD T-02: `libx264` + `aac`, `-pix_fmt yuv420p`, `-movflags +faststart`; "o CRF e o *preset* ficam por definir (questão Q-ADD-11)". Nenhuma fonte dá o bitrate do áudio.
- **Opções:** (a) `-preset veryfast -crf 23` e AAC a 128 kb/s (qualidade de pré-visualização, codificação rápida); (b) `-preset medium -crf 20` e AAC a 160 kb/s; (c) outros valores.
- **Resposta:** **(a), aceite.** `-preset veryfast -crf 23` e AAC a 128 kb/s na cópia de pré-visualização. Os valores das operações (B003+) continuam na Q-ADD-11.

## D-20 — Dimensão e qualidade da miniatura

- **Onde:** `ddd-02-technical-design.md` (NFR Implementation, Miniatura e fotograma 0).
- **Dúvida:** Com que dimensão e qualidade JPEG se guarda a miniatura?
- **O que as fontes dizem:** REQ-VID-UPLOAD-014 e RN5 do UC-VID-000: JPEG a 00:00:01 (ou fotograma 0), sem dimensão. ADD T-07 fixa ≤ 1280 px só para o fotograma 0.
- **Opções:** (a) rotação aplicada, largura ≤ 320 px, `-q:v 4`; (b) o mesmo limite do fotograma 0 (≤ 1280 px); (c) resolução de apresentação completa.
- **Resposta:** **(a), aceite.** Miniatura com a rotação aplicada, largura ≤ 320 px e `-q:v 4`.

## D-21 — Códigos de erro das rotas de vídeo não fixados nas fontes

- **Onde:** `ddd-02-technical-design.md` (Error Handling).
- **Dúvida:** Que `code` levam as respostas 401, 403, 404, os 409 de estado inválido na confirmação e no cancelamento, as falhas internas de processamento e as falhas de infraestrutura, no formato `{error: {code, message, details}, correlationId}`?
- **O que as fontes dizem:** ADD T-10 fixa o formato e dá exemplos de códigos de domínio (`LIMIT_EXCEEDED`, `QUOTA_EXCEEDED`, …); ADD T-03 dá `RESOURCE_NOT_READY` (409) e `UNSUPPORTED_FORMAT`; D-14 dá `CORRUPTED_FILE` e `UPLOAD_ABORTED`. REQ-VID-AUTH-001/002 e COM-001 dão só os códigos HTTP.
- **Opções:** (a) `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INVALID_STATE` (409), `PROCESSING_ERROR` (falha do FFmpeg ou *dead-letter*) e `INTERNAL_ERROR` (500/502); (b) outros nomes.
- **Resposta:** **(a), aceite.** `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INVALID_STATE` (409), `PROCESSING_ERROR` (falha do FFmpeg ou *dead-letter*) e `INTERNAL_ERROR` (500/502). A B003 reutiliza os mesmos códigos.

## D-22 — Unidade dos limites de tamanho por perfil

- **Onde:** `ddd-02-technical-design.md` (NFR Implementation, NFR-008); `projects/video/profiles.js`.
- **Dúvida:** Os limites "200 MB" e "2 GB" (RN4, NFR-008, UPLOAD-004) contam-se em base 1024 (200 × 1024² e 2 × 1024³ bytes) ou em base 1000?
- **O que as fontes dizem:** REQ-VID-INFO-005 define, para a apresentação do tamanho, 1 MB = 1024² bytes e 1 GB = 1024³ bytes. O `client_max_body_size 2g` do nginx (T-08) é 2 × 1024³ bytes. As regras de limite não dizem a base.
- **Opções:** (a) base 1024, coerente com a INFO-005 e com o nginx; (b) base 1000.
- **Resposta:** **(a), aceite.** Base 1024: 200 MB = 200 × 1024² bytes e 2 GB = 2 × 1024³ bytes, coerente com a INFO-005 e com o `client_max_body_size 2g` do nginx.

## D-23 — Códigos de erro das respostas dos *middlewares* reutilizados e de pedidos mal formados

- **Onde:** `apiGateway/routes/videos.js` (normalização das respostas do serviço de projetos); `projects/video/ingest.js` (`requestUpload`); `projects/video/errors.js`.
- **Dúvida:** Os *middlewares* reutilizados pelo router de vídeo (`checkSharePermission`, `requireEditPermission` e `enforcePresenceLimit`) respondem com texto simples e com estados que a D-21 não cobre: 410 (link de partilha revogado ou inexistente) e 429 (demasiados editores ativos). Pela regra 2.6, não podem ser alterados. Que `code` levam estas respostas no formato `{error: {code, message, details}, correlationId}` (ERROR-001)? E que código leva um pedido de URL de carregamento sem `fileName`, `mimeType` ou `sizeBytes` válidos?
- **O que as fontes dizem:** REQ-VID-ERROR-001 e ADD T-10 exigem o formato com código estável em todas as respostas de erro de vídeo. A D-21 fixa só 401, 403, 404, 409, `PROCESSING_ERROR` e `INTERNAL_ERROR`. A REQ-VID-COM-005 dá HTTP 422 para parâmetros inválidos, sem código.
- **Opções:** (a) o router de vídeo do gateway converte as respostas fora do formato, mantendo o estado HTTP: 401 → `UNAUTHENTICATED`, 403 → `FORBIDDEN`, 404 → `NOT_FOUND`, 409 → `INVALID_STATE`, 410 → `SHARE_LINK_REVOKED`, 429 → `TOO_MANY_EDITORS` e os restantes → `INTERNAL_ERROR`; um pedido de carregamento mal formado responde 422 `INVALID_REQUEST`, com `details.field`; (b) outros nomes.
- **Resposta:** **(a), aceite.** O router de vídeo do gateway converte as respostas fora do formato, mantendo o estado HTTP: `SHARE_LINK_REVOKED` (410), `TOO_MANY_EDITORS` (429) e, para os restantes, os códigos da D-21. Um pedido de carregamento mal formado responde 422 `INVALID_REQUEST`, com `details.field`.

## D-24 — Ficheiro sem stream de vídeo

- **Onde:** `Tools/video/ingest.py` (`parse_probe`); `projects/video/formats.js` (`validateStreams`).
- **Dúvida:** Um ficheiro MP4, MOV ou AVI que o FFprobe lê, mas que não tem stream de vídeo (por exemplo, só áudio), é rejeitado com que código?
- **O que as fontes dizem:** REQ-VID-UPLOAD-009 rejeita com `INVALID_CODEC` uma stream de vídeo com codec não admitido. REQ-VID-UPLOAD-012 rejeita ficheiros com cabeçalhos corrompidos ou fluxos truncados (`CORRUPTED_FILE`, D-14). Nenhuma fonte trata um contentor válido sem stream de vídeo.
- **Opções:** (a) `CORRUPTED_FILE` (o worker não encontra um vídeo legível); (b) `INVALID_CODEC` com `details: {stream: "video", codec: null}`; (c) `UNSUPPORTED_FORMAT`.
- **Resposta:** **(b).** Um ficheiro sem stream de vídeo não está corrompido: viola a REQ-VID-UPLOAD-009. É rejeitado com `INVALID_CODEC` e `details: {stream: "video", codec: null}`. O worker devolve os metadados com `videoCodec: null` e o serviço de projetos aplica a regra no `formats.js`. `CORRUPTED_FILE` fica para ficheiros que o FFprobe não consegue ler, sem duração ou truncados.

## D-25 — Imagem base do worker de vídeo e versão do FFmpeg

- **Onde:** `Tools/video/Dockerfile`.
- **Dúvida:** A etiqueta `python:3.11-slim` passou a apontar para o Debian 13, que traz o FFmpeg 7.1 (verificado no Estágio 5). Fixa-se a imagem no Debian 12, ou aceita-se o FFmpeg 7.1?
- **O que as fontes dizem:** ADD secção 6: "FFmpeg 5.1 no Debian 12, base da imagem `python:3.11-slim`"; "mudar a imagem base do worker muda a versão do FFmpeg e deve ser tratado como mudança de dependência". ADD T-02: "a mesma imagem base [...] de `Tools/brightness/Dockerfile`", que continua a usar a etiqueta flutuante.
- **Opções:** (a) fixar `python:3.11-slim-bookworm` (Debian 12, FFmpeg 5.1), como diz a secção 6; (b) manter `python:3.11-slim` (Debian 13, FFmpeg 7.1) e atualizar o ADD.
- **Resposta:** **(a).** Worker fixado em `python:3.11-slim-bookworm`, com FFmpeg 5.1, conforme a secção 6 do ADD. Os testes do Estágio 5 correram no FFmpeg 5.1.9.

## D-26 — Miniatura de vídeos com cerca de 1 s

- **Onde:** `Tools/video/ingest.py` (`thumbnail`).
- **Dúvida:** Um vídeo com exatamente 1,0 s (ou pouco mais) não tem nenhum fotograma que comece em 00:00:01, e o FFmpeg não produz a miniatura. Que fotograma se usa?
- **O que as fontes dizem:** REQ-VID-UPLOAD-014 e Q-ADD-22: miniatura a 00:00:01, ou no fotograma 0 "se o vídeo tiver menos de 1 s". Não tratam o caso em que não há fotograma em 00:00:01.
- **Opções:** (a) quando não há fotograma a partir de 00:00:01, usa-se o fotograma 0, como nos vídeos com menos de 1 s; (b) usa-se o último fotograma.
- **Resposta:** **(a).** Quando não há fotograma a 00:00:01, a miniatura é o fotograma 0 (Q-ADD-22). O worker tenta 00:00:01 e, se o FFmpeg não produzir imagem, repete no fotograma 0.

## D-27 — Assinaturas dos URLs no *error log* do nginx

- **Onde:** `nginx/nginx.conf` (`location /s3-video/`).
- **Dúvida:** O `log_format video_s3` (T-10) tira a *query string* do *access log*, mas o *error log* do nginx regista sempre o pedido completo, com a assinatura, quando recusa um pedido (por exemplo, 413 acima de 2 GB) ou quando o SeaweedFS falha. O formato do *error log* não é configurável. Aceita-se, ou baixa-se o nível do *error log* nesta `location`?
- **O que as fontes dizem:** ADD T-10: a *query* contém a assinatura, "que é uma credencial válida durante 15 minutos e não pode ficar nos logs"; a decisão trata só do *access log*.
- **Opções:** (a) aceitar como risco residual: só aparece em erros, e a assinatura expira em 15 min; (b) acrescentar `error_log /var/log/nginx/error.log crit;` na `location /s3-video/`, perdendo os erros de nível `error` (413, falhas de ligação ao SeaweedFS) dessa `location`.
- **Resposta:** **(b).** `error_log /var/log/nginx/error.log crit;` dentro da `location /s3-video/` nova, para que a assinatura nunca fique nos logs (T-10). É uma diretiva na `location` acrescentada pela B001, por isso respeita a regra 2.6. Os erros de nível `error` dessa `location` (413, falhas de ligação ao SeaweedFS) deixam de ser registados; o *access log* continua a registar o estado.

## D-28 — Consumidor do `video_ws_queue` sem religação ao RabbitMQ

- **Onde:** `wsGateway/video.js`.
- **Dúvida:** O `wsGateway/video.js` usa o `wsGateway/utils/rabbit_mq.js`, como manda o T-00. Esse utilitário não volta a ligar-se: depois de um reinício do RabbitMQ, os eventos `video-ingest-update` deixam de chegar até o `ws_gateway` ser reiniciado. É o mesmo comportamento que o `ws_queue` e o `project_queue` já têm (observado no Estágio 5). Mantém-se, ou o módulo de vídeo passa a ter o seu próprio consumidor com religação?
- **O que as fontes dizem:** ADD T-00: "consome `video_ws_queue` (com `wsGateway/utils/rabbit_mq.js`)". ADD T-03 dá ao `projects/video/amqp.js` uma ligação persistente própria, que se volta a ligar.
- **Opções:** (a) manter o T-00 e aceitar o risco, igual ao do fluxo de imagem; (b) consumidor próprio no `wsGateway/video.js` com `amqplib` e religação, como o `projects/video/amqp.js`, sem alterar o utilitário existente.
- **Resposta:** **(b), alargada.** O código de vídeo novo religa-se sozinho ao RabbitMQ: o `wsGateway/video.js` passa a ter a sua própria ligação `amqplib`, e o `projects/video/amqp.js` passa a religar-se também quando só o canal fecha. O `utils/rabbit_mq.js` e as filas existentes (`ws_queue`, `project_queue`) ficam como estão (regra 2.6).

## D-29 — O SeaweedFS recusa URLs assinados com `response-*` (impacto na B002)

- **Onde:** `imageStorageService/services/videoUrls.js` (`ResponseContentType`); ADD 4.1 (`ResponseContentDisposition` do descarregamento, B002).
- **Dúvida:** No Estágio 5 verificou-se que o SeaweedFS 4.47 responde 403 a URLs SigV2 com `response-content-type`. Na B001 deixou de ser enviado (os objetos já são gravados com o `Content-Type` certo). O descarregamento da B002 conta com `response-content-disposition` para o nome sugerido (DOWNLOAD-005), que deverá falhar da mesma forma. Segue-se a alternativa que o ADD já prevê?
- **O que as fontes dizem:** ADD 4.1: "Confirmar que o SeaweedFS (`4.47`) aplica o parâmetro `response-content-disposition` dos URLs assinados. Se não aplicar, o nome sugerido vai no atributo `download` da âncora, que o navegador respeita porque o URL `/s3-video/` é da mesma origem que o frontend."
- **Opções:** (a) a B002 usa o atributo `download` da âncora, como prevê o ADD; (b) a B002 investiga a assinatura SigV4 para os URLs de vídeo.
- **Resposta:** **Em aberto para a B002.** A B002 tem de testar primeiro o `response-content-disposition` no SeaweedFS e, se falhar, registar uma dúvida com alternativas antes de implementar o descarregamento.

## D-30 — Criar um projeto a partir de um vídeo (requisito novo da equipa)

- **Onde:** `docs/requirements/REQ-VID-UPLOAD.md` (REQ-VID-UPLOAD-021); `docs/use-cases/UC-VID-000.md` (FA6 e pré-condições); `frontend/components/video/new-video-project-dialog.tsx`; `frontend/components/dashboard-sidebar/dashboard-sidebar.tsx`.
- **Dúvida:** Hoje só se cria um projeto com imagens (`new-project-dialog.tsx` exige pelo menos uma). Como começa um utilizador que só tem um vídeo?
- **O que as fontes dizem:** Nada; o UC-VID-000 parte de um projeto existente. A rota existente `POST /projects/:user` já aceita `imgs` vazio.
- **Resposta:** **Requisito novo da equipa (REQ-VID-UPLOAD-021, UC-VID-000 FA6), construído na B001.** Componente novo `new-video-project-dialog.tsx` com o nome do projeto e o seletor de vídeo (MP4, MOV, AVI, com as validações do passo 2): cria o projeto com `POST /projects/:user`, carrega o vídeo pelo fluxo da B001 e abre o projeto. Fica ligado com uma linha nova na `dashboard-sidebar`, junto a "New Project"; o `new-project-dialog.tsx` não muda (regra 2.6). Se o carregamento falhar ou for cancelado, o projeto fica criado e vazio, e o utilizador pode carregar outro vídeo. Utilizadores anónimos não veem a opção (RN1).

## D-31 — Vídeos concluídos na área principal do projeto (correção do UC-VID-000, passos 7 e 8)

- **Onde:** `frontend/components/video/project-video-list.tsx`; `frontend/app/dashboard/[pid]/page.tsx`.
- **Dúvida:** Na B001, os vídeos concluídos só aparecem dentro da janela "Vídeos". Os passos 7 e 8 pedem que o vídeo apareça "na galeria de recursos do projeto".
- **O que as fontes dizem:** UC-VID-000, passo 7: o vídeo aparece "na galeria de recursos do projeto com a miniatura gerada, nome do ficheiro e duração formatada"; passo 8: ao selecioná-lo, abre o reprodutor integrado.
- **Resposta:** **Correção da equipa.** Componente novo `project-video-list.tsx`, montado com uma linha nova em `app/dashboard/[pid]/page.tsx`, junto ao `ProjectImageList` existente, que não muda (regra 2.6). Mostra cada vídeo `completed` com miniatura, nome do ficheiro, duração formatada e um ícone que o distingue das imagens; ao clicar, abre o `VideoPlayer` da B001. Atualiza-se com o evento `video-ingest-update`, para o vídeo aparecer logo que a ingestão termina. A janela "Vídeos" fica como ponto de carregamento.

## D-32 — Pormenores de interface da D-30 e da D-31 que as fontes não fixam

- **Onde:** `frontend/components/video/new-video-project-dialog.tsx`; `frontend/components/video/project-video-list.tsx`.
- **Dúvida:** (1) Na D-30, o projeto abre quando termina a transferência ou só quando termina a ingestão? E abre também quando o carregamento falha? (2) Na D-31, em que lugar da área principal fica a lista de vídeos, e aparece também no modo "results"?
- **O que as fontes dizem:** A D-30 diz "carrega o vídeo pelo fluxo da B001 e abre o projeto" e que, em caso de falha, o projeto fica vazio e o utilizador pode carregar outro vídeo. A D-31 diz "junto ao `ProjectImageList`". Nenhuma fonte fixa os pormenores.
- **Opções:** (1a) abrir quando a transferência termina (202 do `upload/complete`), com o vídeo a aparecer na lista quando a ingestão termina, e abrir também em caso de falha ou cancelamento, para o utilizador carregar outro vídeo; (1b) manter a janela aberta até a ingestão terminar. (2a) coluna à direita das imagens, só quando há vídeos concluídos, nos dois modos; (2b) faixa por cima da grelha de imagens.
- **Resposta:** **(1a) e (2a), aceites como estão implementadas.** A janela continua à escuta do `video-ingest-update` depois de abrir o projeto e avisa se a ingestão falhar.

## D-33 — O `bolt-complete.cjs` não encontra os ficheiros das stories

- **Onde:** `.specsmd/aidlc/scripts/bolt-complete.cjs` (`findStoryFile`); `memory-bank/intents/001-video-processing-support/units/*/stories/`.
- **Dúvida:** Ao fechar a B001, o script marcou o bolt como `complete`, mas não atualizou a ST-VID-000 ("File not found"). O script procura `stories/ST-VID-000.md` ou `stories/ST-VID-000-*.md`, e a Inception gravou as stories como `001-video-ingestion.md`, com o ID só no *frontmatter*. Acontece o mesmo em todos os bolts. O script recusa correr outra vez num bolt `complete`, e as stories não se editam à mão. Como se fecha a ST-VID-000 e se evita o problema nos próximos bolts?
- **O que as fontes dizem:** O bolt type manda usar o `bolt-complete.cjs` e não editar as stories à mão. Nenhuma fonte trata o nome dos ficheiros das stories.
- **Opções:** (a) renomear os ficheiros das stories para `ST-VID-xxx-<nome>.md` (com `git mv` e atualização das ligações), e a equipa autoriza, só desta vez, pôr a ST-VID-000 em `status: complete` e `implemented: true` como o script faria; (b) manter os nomes e a equipa autoriza essa atualização manual em cada fecho de bolt; (c) manter a ST-VID-000 como está até haver uma correção do specsmd.
- **Resposta:** **(a).** Os 17 ficheiros de stories passaram a `ST-VID-xxx-<nome>.md` (por exemplo, `ST-VID-000-video-ingestion.md` e `ST-VID-COM-001-video-task-quota-foundation.md`), com `git mv` para manter o histórico, e as ligações foram atualizadas (`story-index.md`, os `bolt.md` das B001 a B009 e as referências desta lista). Uma pesquisa às ligações relativas de `docs/` e `memory-bank/` confirmou 0 ligações partidas. A ST-VID-000 foi atualizada à mão, só desta vez, com o que o script faria: `status: complete` e `implemented: true`. Os bolts seguintes fecham com o `bolt-complete.cjs`, que passa a encontrar as stories. Ficam com o nome antigo só o registo histórico do *construction log* e a descrição desta dúvida.

## D-34 — Nome sugerido no descarregamento depois da verificação da D-29

- **Onde:** `projects/video/access.js` (`issueDownload`); `frontend/lib/video-access.ts`; `imageStorageService/services/videoUrls.js`; `nginx/nginx.conf`.
- **Dúvida:** A verificação que a D-29 pede foi feita no Estágio 1 da B002, no stack em execução. Com a assinatura SigV2 atual, o SeaweedFS 4.47 responde 403 a qualquer URL com `response-content-disposition` (ASCII simples ou RFC 6266). Com SigV4, o mesmo parâmetro funciona e o `Content-Disposition` volta certo, mas só quando o pedido chega com `Host: seaweedfs:9000`: pelo `/s3-video/`, que envia o `Host` do cliente, responde 403, porque a SigV4 assina o `Host`. O `Range` (206) e a expiração (403) funcionam com SigV2. Como se entrega o nome sugerido (DOWNLOAD-005)?
- **O que as fontes dizem:** ADD 4.1: "Confirmar que o SeaweedFS (`4.47`) aplica o parâmetro `response-content-disposition` dos URLs assinados. Se não aplicar, o nome sugerido vai no atributo `download` da âncora, que o navegador respeita porque o URL `/s3-video/` é da mesma origem que o frontend." ADD T-08: a SigV2 foi escolhida por não assinar o *host*, o que permite reescrevê-lo para o `/s3-video/`.
- **Opções:** (a) URL SigV2 sem `response-*`, como os da B001, e o nome no atributo `download` da âncora (o `fileName` da resposta), como prevê o ADD; nada muda no storage nem no nginx; o nome só é aplicado pelo navegador, e um URL copiado e aberto à parte grava com o nome da chave; (b) cliente S3 SigV4 novo só para os descarregamentos e uma `location` nginx nova (por exemplo `/s3-video-dl/`) com `proxy_set_header Host seaweedfs:9000`, sem tocar no `/s3-video/` da B001; o nome segue no `Content-Disposition` (RFC 6266) e o atributo `download` fica como reforço; mais código e configuração, e uma `location` a mais para manter com o mesmo `log_format` e `error_log`.
- **Recomendação:** (a).
- **Resposta:** **(a).** URL SigV2 sem `response-*` e o nome sugerido no atributo `download` da âncora, como prevê o ADD 4.1; válido porque o frontend e o `/s3-video/` estão na mesma origem (nginx, `localhost:8080`). Nada muda no storage nem no nginx. No Estágio 3 confirma-se no navegador que o ficheiro é descarregado (e não aberto no leitor) com o nome sugerido, incluindo um nome com acentos.

## D-35 — Sufixo do nome sugerido para cadeias e junções e nome base de uma junção (Q-ADD-08)

- **Onde:** `projects/video/fileName.js`.
- **Dúvida:** O `fileName.js` é a função única do nome sugerido (ADD 4.1) e tem de tratar qualquer `recipe`. A Q-ADD-08 está pendente no ADD: que sufixo leva o resultado de uma cadeia ou de uma junção, e qual é o nome base de uma junção com várias origens? Na B002 só há originais (sem sufixo); os resultados de operações chegam a partir da B004 e as cadeias e junções na B008.
- **O que as fontes dizem:** REQ-VID-DOWNLOAD-005: "nome original, um sufixo com a(s) operação(ões) aplicada(s) e a extensão do formato armazenado"; exemplo `ferias.mp4` recortado → `ferias_trim.mp4`. ADD 4.1: a função recebe `original_name`, `recipe` e `meta.container`. ADD Q-ADD-08: em aberto. Os lotes estão fora desta construção (D-06).
- **Opções:** (a) os identificadores das operações do `recipe`, pela ordem, unidos por `_` (`ferias_trim_filter.mp4`); numa junção, o nome base é o `original_name` do resultado (o da primeira origem) e a junção entra no sufixo como `concat` (`ferias_concat.mp4`); (b) só a última operação no sufixo; (c) a B002 implementa só originais e operações isoladas, e a regra das cadeias e junções fica para a B008, que a acrescenta ao `fileName.js`.
- **Recomendação:** (a).
- **Resposta:** **(a), registada como resposta à Q-ADD-08 do ADD.** O sufixo são os identificadores das operações do `recipe`, pela ordem, unidos por `_` (`ferias_trim_filter.mp4`); numa junção, o nome base é o `original_name` do resultado (o da primeira origem) e a junção entra no sufixo como `concat` (`ferias_concat.mp4`).

## D-36 — Tamanhos imediatamente abaixo de 1 GB aparecem como "1024.00 MB"

- **Onde:** `frontend/lib/video-format.ts` (`formatFileSize`); `frontend/lib/videos.ts` (`formatSize`, B001), que tem o mesmo comportamento.
- **Dúvida:** Encontrado nos testes do Estágio 3 da B002. Com a regra da INFO-005 aplicada à letra (MB abaixo de 1 GB, GB a partir daí, 2 casas), um ficheiro entre 1024³ − 5 243 e 1024³ − 1 bytes (menos de 5 KB abaixo de 1 GB) aparece como `1024.00 MB`, porque o arredondamento a 2 casas sobe para 1024. Mantém-se, ou escolhe-se a unidade depois de arredondar?
- **O que as fontes dizem:** REQ-VID-INFO-005: "em MB (abaixo de 1 GB) ou em GB, com 2 casas decimais, sendo 1 MB = 1024² bytes e 1 GB = 1024³ bytes"; exemplo `157 286 400` bytes → `150.00 MB`. ADD 4.2: "tamanho em MB abaixo de 1 GB e em GB a partir daí, com 2 casas". Nenhuma fonte trata o arredondamento na fronteira.
- **Opções:** (a) manter a regra à letra: o caso só acontece numa janela de 5 KB, e só para Premium (o limite Registado é 200 MB); (b) escolher a unidade depois de arredondar (`1.00 GB` a partir de 1023,995 MB), na `formatFileSize` da B002; o `formatSize` da B001 fica como está (regra 2.6 aplicada ao código da B001), pelo que o seletor de carregamento e o painel podiam diferir nesses 5 KB.
- **Recomendação:** (a).
- **Resposta:** **(a).** Mantém-se a regra à letra, por coerência com o `formatSize` da B001 e com a INFO-005.

## D-37 — Operação usada para verificar o executor na B003

- **Onde:** `memory-bank/bolts/003-video-task-foundation/ddd-01-domain-model.md` (RegistoOperacoes); critérios de passagem da B003 ("uma operação de um passo percorre `queued → processing → completed | failed | cancelled`").
- **Dúvida:** A B003 constrói o registo de operações, a aceitação, o executor de cadeias, o cancelamento e a quota, mas nenhuma operação concreta (essas chegam a partir da B004). Com que operação se verificam de ponta a ponta a aceitação, o progresso, o cancelamento do FFmpeg, a devolução e o esgotamento das entregas?
- **O que as fontes dizem:** ADD T-01: uma operação isolada é uma cadeia de um passo e cada operação é um módulo `projects/video/operations/<op>.js` e `Tools/video/ops/<op>.py`. O bolt pede que uma operação de um passo percorra a máquina de estados. Nenhuma fonte diz qual.
- **Opções:** (a) uma operação de teste (`test_reencode`: recodifica no formato de trabalho sem filtros, custo 1), registada só quando a variável `VIDEO_TEST_OPERATIONS=1` está definida, nunca exposta na UI nem em produção; (b) antecipar uma operação simples da B004 (por exemplo, remover o áudio) e a B004 só a completa; (c) testar o executor só com planos sintéticos publicados diretamente na fila, sem passar pela API.
- **Recomendação:** (a). Exercita todo o caminho (incluindo uma recodificação real, para o progresso e o cancelamento) sem invadir o âmbito da B004.
- **Resposta:** **(a).** A operação `test_reencode` (recodifica no formato de trabalho sem filtros, custo 1) só é registada quando `VIDEO_TEST_OPERATIONS=1` está definida; a variável não fica ativa no `docker-compose.yaml` e a operação não aparece na UI.

## D-38 — O processamento de imagens conta como tarefa ativa? (Q-ADD-02)

- **Onde:** `ddd-01-domain-model.md` (Lugar de tarefa ativa).
- **Dúvida:** O limite de uma tarefa de vídeo ativa por projeto (NFR-021, DQ-016) também bloqueia, ou é bloqueado por, um processamento de imagens em curso no mesmo projeto (`activeToken`)?
- **O que as fontes dizem:** ADD T-03 e Q-ADD-02 (em aberto). A regra 2.6 impede que o fluxo de imagem passe a consultar o `video_project_locks`, por isso, na opção (b), o bloqueio só funcionaria num sentido.
- **Opções:** (a) não conta: o lugar é só para tarefas de vídeo; (b) conta num só sentido: a aceitação de vídeo recusa (409) se o projeto tiver um processamento de imagens em curso, lido do documento do projeto, mas o processamento de imagens continua a não ver as tarefas de vídeo.
- **Recomendação:** (a). A opção (b) seria assimétrica e dependeria de ler o estado interno do fluxo de imagem.
- **Resposta:** **(a), registada como resposta à Q-ADD-02 do ADD.** O processamento de imagens não conta como tarefa ativa: o lugar de `video_project_locks` é só para tarefas de vídeo.

## D-39 — Parâmetros de qualidade da codificação por omissão dos resultados (Q-ADD-11)

- **Onde:** `ddd-01-domain-model.md` (PoliticaCodificacao, PlanoExecucao).
- **Dúvida:** Que *preset* e CRF do `libx264` e que bitrate de AAC usa a codificação por omissão (MP4/MOV) dos resultados das operações? Os parâmetros do `mpeg4` e do MP3 (saída AVI) ficam para a B007, que constrói a conversão.
- **O que as fontes dizem:** ADD T-02: `libx264` + `aac`, `yuv420p`, `+faststart`; "o CRF e o *preset* ficam por definir (Q-ADD-11)". D-19 fixou `-preset veryfast -crf 23` e AAC a 128 kb/s só para a cópia de pré-visualização da ingestão. D-18: uma réplica do worker.
- **Opções:** (a) os mesmos valores da D-19 (`veryfast`, CRF 23, AAC 128 kb/s): um só conjunto de valores, codificação rápida com uma réplica; (b) `-preset medium -crf 20` e AAC a 160 kb/s: melhor qualidade, cerca de 2 a 3 vezes mais lento; (c) outros valores.
- **Recomendação:** (a). O CRF 23 é o valor por omissão do `libx264` e, com uma só réplica, a rapidez reduz a espera dos outros projetos.
- **Resposta:** **(a) para MP4 e MOV, registada como resposta parcial à Q-ADD-11 do ADD:** `-preset veryfast -crf 23` e AAC a 128 kb/s, os valores da D-19. O executor da B003 não gera AVI (o formato de trabalho é MP4, T-05/DQ-013, e a `test_reencode` da D-37 produz MP4; só a conversão, B007, escolhe outro contentor), por isso o `-q:v` do `mpeg4` e o bitrate do MP3 ficam para a B007.

## D-40 — Passo corrente (`step`) quando a cadeia corre num único *filtergraph* (TASK-008)

- **Onde:** `ddd-01-domain-model.md` (ProgressoTarefa); evento `video-task-update` e `GET …/videos/tasks/:taskId`.
- **Dúvida:** A REQ-VID-TASK-008 pede o passo corrente (exemplo: `step: 3`, `totalSteps: 4`). Com o T-02, todos os passos correm ao mesmo tempo numa única invocação FFmpeg, por isso não há um "passo em execução" observável. Que valor leva `step`?
- **O que as fontes dizem:** REQ-VID-TASK-008; ADD T-02 (um único `-filter_complex`) e T-03 (eventos de progresso com `step`, `totalSteps` e `progress`). Nenhuma fonte trata a contradição.
- **Opções:** (a) `step` proporcional ao progresso: `step = min(totalSteps, floor(progress / 100 × totalSteps) + 1)`, monótono e coerente com o exemplo da ERS; (b) `step = totalSteps` durante toda a codificação (todos os passos em curso); (c) `step = 1` até ao fim e `totalSteps` só como informação.
- **Recomendação:** (a). Cumpre o critério da TASK-008 e dá à UI um "passo k de N" que avança; fica documentado que é uma indicação derivada do progresso global.
- **Resposta:** **(a), registada como resposta à Q-ADD-16 do ADD na parte do passo corrente:** `step = min(totalSteps, floor(progress / 100 × totalSteps) + 1)`, a aproximação "proporção do tempo" que a Q-ADD-16 propõe para um grafo FFmpeg único, sem execução passo a passo (NFR-013). A outra parte da Q-ADD-16 (indicar a fase em vez do passo numa falha, UC-VID-014 exceção 7) é da B008 e não é respondida aqui.

## D-41 — Parâmetros da rotina de manutenção (Q-ADD-14, D-15)

- **Onde:** `ddd-01-domain-model.md` (RotinaManutencao).
- **Dúvida:** Com que período corre a rotina, quando é que uma tarefa ativa está "parada", o que significa "retomar", e qual é a margem dos carregamentos abandonados (900 s + margem, D-15)?
- **O que as fontes dizem:** ADD Q-ADD-14: tarefas "sem progresso há mais do que um *timeout* proporcional à duração" são retomadas (republicando) ou fechadas como `failed` com devolução; lugares órfãos ao fim de um minuto. O T-03 não grava o progresso no MongoDB (vai só para o WebSocket), por isso o serviço de projetos não vê o progresso de uma tarefa. As quedas do worker já são tratadas pela reentrega e pelo *dead-letter*, e as respostas só são confirmadas depois de gravadas; o caso que sobra é uma queda do serviço de projetos entre a criação da tarefa e a publicação. D-18: `x-consumer-timeout` de 3 h.
- **Opções:** (a) período de 60 s; lugares órfãos ao fim de 60 s (ADD); a tarefa guarda o instante da publicação, e uma tarefa `queued` nunca publicada há mais de 60 s é **retomada** (republicada); uma tarefa ativa sem transição há mais de 3 h 10 min (o `x-consumer-timeout` mais uma margem) é **fechada** como `failed` (`PROCESSING_ERROR`), com devolução, cancelamento em `video_control` e lugar libertado; carregamentos abandonados com mais de 900 s + 300 s (20 min); projetos apagados verificados a cada 10 min; (b) a equipa indica outros valores.
- **Recomendação:** (a). Os limites seguem os do ADD e da D-18, e o fecho por tempo só apanha tarefas que já não podem estar a correr.
- **Resposta:** **(a), registada como resposta à Q-ADD-14 do ADD na parte que não depende de lotes (D-04).** Período de 60 s; lugares órfãos ao fim de 60 s; tarefa `queued` nunca publicada há mais de 60 s → republicada; tarefa ativa sem transição há mais de 3 h 10 min → `failed` (`PROCESSING_ERROR`) com devolução, cancelamento em `video_control` e lugar libertado; carregamentos abandonados (D-15) com mais de 900 s + 300 s; projetos apagados verificados a cada 10 min. **Porquê 3 h 10 min:** fica acima do `x-consumer-timeout` de 3 h da `video_operations_queue` (D-18). Uma entrega sem confirmação não dura mais de 3 h (o RabbitMQ devolve-a à fila e o novo `started` conta como transição), por isso, passados 3 h 10 min sem transição, a tarefa já não pode estar a correr. **Porquê um valor fixo e não o *timeout* proporcional à duração da Q-ADD-14:** o progresso não é gravado no MongoDB (T-03), pelo que o serviço de projetos não vê se uma tarefa avança; e um valor proporcional à duração do vídeo teria de estimar a velocidade de codificação de cada operação e resolução, e podia fechar como `failed` uma tarefa lenta (4K, junção longa) que ainda está a correr. O limite fixo só fecha tarefas que já não podem estar vivas.

## D-42 — Códigos de erro da aceitação que as fontes não fixam

- **Onde:** `ddd-01-domain-model.md` (ErroVideo, ErroValidacao).
- **Dúvida:** Que `code` levam: (1) o 409 de "já existe uma tarefa ativa no projeto"; (2) um passo com `operation` desconhecida; (3) uma `version` que a operação não aceita; (4) um corpo sem `steps` ou com `steps` vazio ou mal formado; (5) o 422 que agrega os erros do `validate` dos passos?
- **O que as fontes dizem:** ADD T-03 dá 409 para a tarefa ativa, sem código. ADD T-10 cita "o índice do passo no `INVALID_STEP_PARAMS`, ou a lista de erros de validação do T-01". REQ-VID-COM-005: HTTP 422 com o atributo causador. D-21: `INVALID_STATE` (409 de estado inválido). D-23: `INVALID_REQUEST` (422) com `details.field` para pedidos mal formados.
- **Opções:** (a) (1) 409 `TASK_ALREADY_ACTIVE`; (2) 422 `UNKNOWN_OPERATION` com `{index, operation}`; (3) 422 `UNSUPPORTED_OPERATION_VERSION` com `{index, operation, version, supportedVersions}`; (4) 422 `INVALID_REQUEST` com `{field: "steps"}` (D-23); (5) 422 com o código do primeiro erro e `details: {index, errors: [{code, field?, …}]}` com todos os erros desse passo; (b) (1) 409 `INVALID_STATE` (D-21) e (2), (3) e (5) todos como 422 `INVALID_STEP_PARAMS` com `{index, errors}`; (c) outros nomes.
- **Recomendação:** (b). Reutiliza os códigos já fixados (D-21, T-10) e dá uma só forma aos erros dos passos; o frontend distingue os casos pelos `errors`.
- **Resposta:** **Opção nova da equipa.** Não se reutiliza o `INVALID_STATE`: a sua mensagem fala do carregamento e, pela regra 2.6, não pode ser mudada. Para uma tarefa fora de `queued`/`processing` usa-se um código novo, acrescentado ao fim do `MESSAGES` em `projects/video/errors.js`. Os erros dos passos (operação ou versão desconhecida e erros do `validate`) são 422 `INVALID_STEP_PARAMS` com `{index, errors}`, como proposto na (b); um corpo sem `steps` válido é 422 `INVALID_REQUEST` com `{field: "steps"}` (D-23). O nome do código novo e o código do 409 de tarefa ativa no projeto ficam na D-44.

## D-43 — Orçamento de latência do endpoint de validação (Q-ADD-15)

- **Onde:** `ddd-01-domain-model.md` (RegistoOperacoes); `POST /projects/:user/:project/videos/validate`.
- **Dúvida:** Há um limite de tempo para a resposta do endpoint de validação, que o editor chama com *debounce*?
- **O que as fontes dizem:** ADD T-01 e Q-ADD-15 (em aberto: "≤ 1 s como em NFR-005?"). A validação é síncrona, lê `videos.meta` e não usa filas.
- **Opções:** (a) ≤ 1 s, como a NFR-005, verificado nos testes; (b) ≤ 300 ms, para a UI parecer imediata; (c) sem orçamento.
- **Recomendação:** (a). É o valor já usado para a aceitação e a validação só faz uma leitura ao MongoDB e cálculos em memória.
- **Resposta:** **(a), registada como resposta à Q-ADD-15 do ADD.** O endpoint de validação responde em ≤ 1 s, como a NFR-005, e isso é verificado nos testes.

## D-44 — Nomes dos códigos novos da aceitação e do cancelamento, e estado HTTP do `QUOTA_EXCEEDED`

- **Onde:** `memory-bank/bolts/003-video-task-foundation/ddd-02-technical-design.md` (API Design, Error Handling); `projects/video/errors.js` (fim do `MESSAGES`).
- **Dúvida:** A D-42 decidiu não reutilizar o `INVALID_STATE` e deixou por nomear: (1) o código do 409 de cancelamento de uma tarefa fora de `queued`/`processing`; (2) o código do 409 de "o projeto já tem uma tarefa ativa", que, pela mesma razão, também não pode ser o `INVALID_STATE`. Falta ainda (3) o estado HTTP do `QUOTA_EXCEEDED`.
- **O que as fontes dizem:** ADD T-03: 409 nos dois casos, sem código; `QUOTA_EXCEEDED` com `{cost, remaining}`, sem estado HTTP. UC-VID-001 a 011 (exceção "Quota diária esgotada"): o sistema informa e sugere o upgrade para Premium; a tarefa não é criada. D-23: o 429 já é o `TOO_MANY_EDITORS`. Nenhuma fonte dá estes nomes nem o estado.
- **Opções:** (a) (1) `TASK_NOT_ACTIVE`; (2) `TASK_ALREADY_ACTIVE` com `details: {taskId}` da tarefa ativa, para o cliente a poder acompanhar; (3) `QUOTA_EXCEEDED` com 429, o estado HTTP de limites de pedidos por período (RFC 6585); (b) como (a), mas (3) com 402, que sugere pagamento (upgrade); (c) como (a), mas (3) com 403; (d) outros nomes.
- **Recomendação:** (a). O 429 já é usado por limites, o corpo distingue o `QUOTA_EXCEEDED` do `TOO_MANY_EDITORS`, e o 402 é um estado reservado e pouco usado.
- **Resposta:** **(a).** `TASK_NOT_ACTIVE` (409) para cancelar uma tarefa fora de `queued`/`processing`; `TASK_ALREADY_ACTIVE` (409) com `details: {taskId}` da tarefa ativa; `QUOTA_EXCEEDED` com HTTP 429 e `details: {cost, remaining}`. Os dois códigos novos são acrescentados ao fim do `MESSAGES` de `projects/video/errors.js` (D-42).

## D-45 — Garantia de devolução com um `refund` que não é idempotente

- **Onde:** `ddd-02-technical-design.md` (Data Persistence, campo `refund`; Respostas do worker; Rotina de manutenção).
- **Dúvida:** O invariante T3 do modelo pede que, em `failed` ou `cancelled`, os créditos sejam devolvidos exatamente uma vez. O `POST users:/:user/process/refund/:k` não é idempotente e não pode mudar (regra 2.6, T-04). Uma queda do serviço de projetos entre a chamada e o registo de que ela foi feita leva a devolver duas vezes ou a não devolver. O que se garante?
- **O que as fontes dizem:** REQ-VID-QUOTA-004: em falha, o saldo é incrementado "de imediato". ADD T-04 e Q-ADD-03: aceitam limitações do `refund` atual (corrida e dia corrente). ADD T-03: um lugar sem dono, por queda entre a aquisição e a criação da tarefa, é libertado pela rotina, mas nada diz sobre os créditos já reservados nessa janela. Nenhuma fonte trata a queda a meio de uma devolução.
- **Opções:** (a) **pelo menos uma vez**: a transição para `failed`/`cancelled` grava `refund.state: pending` na mesma escrita; depois chama-se o `refund` e grava-se `done`; uma reentrega da resposta e a rotina (pendentes há mais de 60 s, D-41) repetem a chamada. Numa queda entre a chamada e o `done` (milissegundos), o utilizador pode receber os créditos duas vezes. A queda entre a reserva (passo 9) e a criação da tarefa (passo 10) perde os créditos reservados, e isso é aceite e registado no log, como o lugar sem dono do T-03; (b) **no máximo uma vez**: grava-se `done` antes de chamar; numa queda, o utilizador perde a devolução; (c) a equipa aceita mudar o serviço de utilizadores numa fase posterior (Q-ADD-03) e, nesta fase, escolhe (a) ou (b).
- **Recomendação:** (a). A QUOTA-004 é a garantia que o utilizador vê, e uma devolução a mais numa janela de milissegundos é melhor do que cobrar trabalho não feito.
- **Resposta:** **(a), pelo menos uma vez.** A transição para `failed`/`cancelled` grava `refund.state: pending` na mesma escrita; depois chama-se o `refund/:k` e grava-se `done`; a reentrega da resposta e a rotina de manutenção (pendentes há mais de 60 s, D-41) repetem a chamada até ficar `done`. **Risco residual aceite:** (1) uma queda do serviço de projetos depois de o `refund` responder e antes de se gravar `done` faz a devolução repetir-se, e o utilizador recebe os créditos duas vezes (janela de milissegundos); (2) uma queda entre a reserva (passo 9 da aceitação) e a criação da tarefa (passo 10) perde os créditos reservados, porque ainda não há tarefa onde registar a devolução; o lugar fica sem dono e é libertado pela rotina (T-03), e a reserva fica registada no log com o `correlationId`. Os dois riscos desaparecem com uma reserva e uma devolução idempotentes no serviço de utilizadores, que a regra 2.6 deixa para uma fase posterior (Q-ADD-03).

## D-46 — Tarefas ativas de um projeto apagado

- **Onde:** `ddd-02-technical-design.md` (Rotina de manutenção, passo "Projetos apagados").
- **Dúvida:** Quando a rotina encontra um projeto apagado que ainda tem uma tarefa em `queued` ou `processing`, o que acontece à tarefa, ao FFmpeg e aos créditos reservados?
- **O que as fontes dizem:** ADD T-00 e Q-ADD-14: a rotina remove os vídeos, as tarefas, os lugares e os objetos de projetos que já não existem. REQ-VID-QUOTA-004: devolução em cancelamento, rejeição ou falha. Nenhuma fonte trata uma tarefa ativa nesse momento.
- **Opções:** (a) fechar a tarefa como `cancelled` com devolução, publicar o cancelamento em `video_control` (para terminar o FFmpeg) e só depois remover tudo; o resultado que ainda chegue é apagado como resultado tardio; (b) fechar como `failed` (`PROCESSING_ERROR`) com devolução; (c) remover sem devolução.
- **Recomendação:** (a). Apagar o projeto equivale a desistir da tarefa, e o cancelamento já trata o FFmpeg, os temporários e o resultado tardio.
- **Resposta:** **(a).** A rotina fecha a tarefa ativa de um projeto apagado como `cancelled`, com devolução (D-45), publica o cancelamento em `video_control` para terminar o FFmpeg e só depois remove os vídeos, as tarefas, os lugares e os objetos; um resultado que ainda chegue é apagado como resultado tardio.

## D-47 — Bolt que constrói a UI comum de tarefa (progresso, passo, cancelar)

- **Onde:** `ddd-02-technical-design.md` (Frontend); `memory-bank/bolts/003-video-task-foundation/bolt.md` e `004-video-basic-edits/bolt.md` ("Saídas esperadas").
- **Dúvida:** A ST-VID-COM-001 é uma story de utilizador (acompanhar o estado, o progresso e o passo, e cancelar), mas as "Saídas esperadas" da B003 não falam do frontend, e as da B004 só falam dos painéis das operações. Que bolt constrói as peças comuns de tarefa no frontend (chamadas à API, escuta de `video-task-update`, recuperação depois de recarregar, barra de progresso com "passo k de N", Cancelar, erro com o `correlationId`)?
- **O que as fontes dizem:** unit-brief: a Unit 001 é "uma fatia vertical da aplicação web". ADD T-03: "o frontend ignora os eventos de tarefas que já sabe terminadas"; T-10: o `correlationId` "serve ao frontend como código de suporte". A B003 não tem operações visíveis (D-37), por isso não há onde montar a UI neste bolt.
- **Opções:** (a) a B003 constrói as peças comuns (`lib/video-tasks.ts`, `use-video-task.ts`, `video-task-progress.tsx`), testadas com testes unitários do frontend e não montadas em nenhum ecrã; a B004 monta-as nos seus painéis; (b) a B004 constrói-as junto com os primeiros painéis; (c) a B003 constrói-as e monta um painel de tarefas na janela "Vídeos", visível mesmo sem operações.
- **Recomendação:** (a). As regras dos eventos e do cancelamento são da B003, e a B004 só tem de as ligar aos seus painéis.
- **Resposta:** **(a).** A B003 constrói e testa as peças comuns de tarefa no frontend (`lib/video-tasks.ts`, `use-video-task.ts`, `video-task-progress.tsx`) sem as montar em nenhum ecrã; a B004 monta-as nos seus painéis. Registado nos limites do `bolt.md` da B004.

## D-48 — Reserva gravada pelo serviço de utilizadores com a resposta perdida (tempo esgotado)

- **Onde:** `projects/video/quota.js` (`reserve`) e `projects/video/tasks.js` (`submit`, passo 9).
- **Dúvida:** A verificação V8 confirmou que os dois 701 do `GET users:/:user/process/:n` se distinguem pelo corpo e que, no 701 de erro interno, nada é reservado. Fica um caso que o código não distingue: o serviço de utilizadores grava a reserva (`User.update`), mas a resposta não chega ao serviço de projetos (tempo esgotado de 5 s ou ligação cortada). A aceitação trata-o como `INTERNAL_ERROR`, liberta o lugar e não devolve nada, e os créditos ficam debitados sem tarefa. O que se faz?
- **O que as fontes dizem:** ADD T-04: a reserva é um ciclo ler-modificar-escrever, sem idempotência, e não pode mudar (regra 2.6, Q-ADD-03). D-45, ponto 2: créditos perdidos numa queda entre a reserva e a criação da tarefa, aceites como risco residual. Nenhuma fonte trata a resposta perdida.
- **Opções:** (a) aceitar como risco residual e registar no log; (b) devolver por precaução, o que daria créditos a mais quando a reserva não foi gravada.
- **Recomendação:** (a).
- **Resposta:** **(a). Aceite como risco residual, do mesmo tipo da D-45 ponto 2; fica registado em log.** A falha da reserva é registada como `video.task.reserve_failed`, com o `correlationId`, o utilizador e a causa (incluindo o tempo esgotado).

## D-49 — Quem verifica o *keyframe* do recorte e como fica o áudio (TRIM-010)

- **Onde:** `memory-bank/bolts/004-video-basic-edits/ddd-01-domain-model.md` (CopiaNoKeyframe, PlaneadorExecucao, R-T4); `projects/video/plan.js` e `Tools/video/executor.py` (B003).
- **Dúvida:** A TRIM-010 manda copiar a stream de vídeo quando o instante inicial coincide com um *keyframe* e recodificá-la nos outros casos. O plano é calculado no serviço de projetos e o worker não volta a decidir (T-01), mas a posição dos *keyframes* só se conhece com o FFprobe ao ficheiro, que só o worker tem, e não está nos `videos.meta` da ingestão (B001, que não pode mudar). Quem decide a cópia, com que critério de coincidência, e o que acontece ao áudio?
- **O que as fontes dizem:** ADD T-02: "a cópia com `-ss/-to` só é usada quando o instante inicial coincide com um *keyframe* (verificado com FFprobe); o áudio pode ser copiado". ADD T-01: o worker "executa o plano recebido, sem validar regras de negócio". REQ-VID-TRIM-010: "dado um instante inicial num *keyframe*, Então a stream de vídeo é copiada". A aceitação tem de responder em ≤ 1 s (NFR-005) e não fala com o worker. Nenhuma fonte diz quando dois instantes "coincidem" nem como se corta o áudio copiado.
- **Opções:** (a) **cópia condicionada no plano:** o serviço de projetos decide se a cópia é permitida (recorte, codec de origem igual ao de saída, nenhum outro passo altera o vídeo) e, nesse caso, põe no plano `CopiaNoKeyframe {atMs: startMs}`; o worker só verifica o facto com o FFprobe (há um *keyframe* cujo instante, relativo ao primeiro fotograma e arredondado ao milissegundo, é igual a `startMs`), escolhe `copy` (`-ss/-to` à entrada) ou `encode` (`trim`) e indica o modo no `metadata` da resposta `completed`. O áudio segue o vídeo: com o vídeo copiado, o áudio AAC é copiado (MP3 de AVI é recodificado); com o vídeo recodificado, o áudio é cortado com `atrim` e recodificado, para ficar sincronizado ao milissegundo. (b) Como (a), mas com o áudio AAC sempre copiado, também quando o vídeo é recodificado (segunda entrada do mesmo ficheiro com `-ss/-to`); desfasamento até um pacote AAC (~21 ms). (c) Recodificar sempre o vídeo e o áudio; cumpre a precisão mas não a parte "dado um instante inicial num *keyframe*, a stream de vídeo é copiada" da TRIM-010.
- **Recomendação:** (a). A regra (quando a cópia é permitida) fica no serviço de projetos e o worker só observa um facto que só ele pode ver, como o T-02 prevê ("verificado com FFprobe"); o "pode ser copiado" do áudio deixa usar a cópia só quando não custa sincronismo. O caso mais comum, cortar só o fim (`startMs = 0`), fica uma cópia.
- **Resposta:** **(a).** O serviço de projetos decide se a cópia é permitida e põe `CopiaNoKeyframe {atMs: startMs}` no plano; o worker só verifica com o FFprobe se há um *keyframe* em `startMs` (relativo ao primeiro fotograma, arredondado ao milissegundo), escolhe `copy` ou `encode` e indica o modo no `metadata` da resposta `completed`. O áudio segue o vídeo: copiado (AAC) quando o vídeo é copiado; cortado com `atrim` e recodificado quando o vídeo é recodificado. Justificação da equipa: a TRIM-010 diz que o áudio "pode" ser copiado, não que tem de ser.

## D-50 — Nomes das operações e dos parâmetros, e parâmetros mal formados

- **Onde:** `ddd-01-domain-model.md` (Bounded Context, IntervaloRecorte, FatorVelocidade); `projects/video/operations/` e `Tools/video/ops/`.
- **Dúvida:** Que nomes têm as três operações e os seus parâmetros, em que unidade vão os instantes, e que código recebe um parâmetro ausente ou de tipo errado?
- **O que as fontes dizem:** ADD T-01: passo `{operation, version, parameters}`, `version` começa em 1, parâmetros em camelCase (`contrastFactor`, `flipH`); exemplos de nomes de operação `adjust`, `filter`, `convert`, `concat`; a B003 usa `test_reencode`. REQ-VID-TRIM-001/002: instantes em horas, minutos, segundos e milissegundos. UC-VID-001/003: `INVALID_INTERVAL`, `OUT_OF_BOUNDS`, `INVALID_SPEED_FACTOR` (fator "nulo"), `SPEED_FACTOR_OUT_OF_RANGE`; UC-VID-002: `NO_AUDIO_STREAM`. Nenhuma fonte dá os nomes nem trata parâmetros ausentes do recorte.
- **Opções:** (a) operações `trim`, `remove_audio` e `speed`, versão 1; `trim {startMs, endMs}` em milissegundos inteiros; `speed {factor}`; `remove_audio {}`. Instante ausente ou não inteiro → `INVALID_INTERVAL` com `{field}`; negativo ou acima da duração → `OUT_OF_BOUNDS` com `{field, durationMs}`; fator ausente ou não numérico → `INVALID_SPEED_FACTOR`; `SPEED_FACTOR_OUT_OF_RANGE` com `{min: 0.25, max: 4}`; campos a mais são ignorados. (b) Como (a), mas com os instantes em segundos decimais (`{start, end}`). (c) Outros nomes.
- **Recomendação:** (a). Milissegundos inteiros evitam arredondamentos de vírgula flutuante e têm a mesma unidade de `durationMs`; o `snake_case` do nome da operação segue o da `test_reencode`.
- **Resposta:** **(a).** Operações `trim`, `remove_audio` e `speed`, versão 1; `trim {startMs, endMs}` em milissegundos inteiros, `speed {factor}`, `remove_audio {}`. Instante ausente ou não inteiro → `INVALID_INTERVAL` com `{field}`; negativo ou acima da duração → `OUT_OF_BOUNDS` com `{field, durationMs}`; fator ausente ou não numérico → `INVALID_SPEED_FACTOR`; `SPEED_FACTOR_OUT_OF_RANGE` com `{min: 0.25, max: 4}`; campos a mais são ignorados.

## D-51 — Intervalo de recorte mais curto do que um fotograma

- **Onde:** `ddd-01-domain-model.md` (IntervaloRecorte, OperacaoRecorte `validate`).
- **Dúvida:** Um intervalo válido pela RN2 (`0 ≤ início < fim ≤ duração`) pode não conter nenhum fotograma (por exemplo, 10 ms num vídeo a 30 fps, ou um intervalo no último fotograma). O FFmpeg produz então um ficheiro sem vídeo ou falha, e a tarefa acaba em `failed` depois de reservar o crédito. Rejeita-se antes?
- **O que as fontes dizem:** UC-VID-001 RN2 e REQ-VID-TRIM-005/006 só pedem `início < fim` e os limites da duração. Nenhuma fonte fixa uma duração mínima do segmento.
- **Opções:** (a) rejeitar com `INVALID_INTERVAL` e `{minDurationMs}` quando `endMs − startMs` é menor do que a duração de um fotograma (`ceil(1000 × fpsDen / fpsNum)`), antes da tarefa e sem quota; (b) aceitar e deixar falhar no worker (`PROCESSING_ERROR`, com devolução).
- **Recomendação:** (a). É a mesma verificação "antes de criar tarefa ou reservar quota" da ST-VID-001 AC3, para um caso que de outra forma só falharia no worker.
- **Resposta:** **(a).** `endMs − startMs` menor do que a duração de um fotograma (`ceil(1000 × fpsDen / fpsNum)`) → `INVALID_INTERVAL` com `{minDurationMs}`, rejeitado antes de criar a tarefa e de reservar quota.

## D-52 — Taxa de fotogramas do resultado de uma alteração de velocidade

- **Onde:** `ddd-01-domain-model.md` (R-S5, OperacaoVelocidade `estimate`, FiltrosVelocidade).
- **Dúvida:** Com só `setpts=PTS/f`, os fotogramas mantêm-se todos e a taxa de fotogramas do resultado passa a `fps × f` (30 fps a 4× dá 120 fps; a 0.25× dá 7,5 fps). Mantém-se a taxa original?
- **O que as fontes dizem:** ADD T-02: velocidade com `setpts=PTS/f` e `atempo`. REQ-VID-SPEED-008 preserva a resolução, mas não fala da taxa de fotogramas; REQ-VID-SPEED-006 pede "movimento suave" a 0.5×. Nas outras operações a ERS manda preservar a taxa (TRIM-009, AUDIO-006). A junção normaliza a taxa ao primeiro clip (CONCAT-008, B008).
- **Opções:** (a) só `setpts`: taxa `fps × f`; o `estimate` devolve-a assim; (b) `setpts=PTS/f,fps=<taxa original>`: taxa original constante, descartando fotogramas ao acelerar e repetindo-os ao abrandar (sem interpolação); (c) como (b) só ao acelerar, e `fps × f` ao abrandar.
- **Recomendação:** (b). O resultado fica com a taxa do original, como nas outras operações, com tamanho previsível e sem vídeos a 120 ou 240 fps que alguns leitores não reproduzem bem. Ao abrandar, a imagem é a mesma da opção (a) (os fotogramas repetidos não mudam o que se vê); a interpolação (`minterpolate`) fica de fora por ser muito lenta e não estar no ADD.
- **Resposta:** **(b), `setpts=PTS/f,fps=<taxa original>`** (a equipa respondeu "(a), fps=<original>"; regista-se pelo conteúdo, que é a opção (b) e a recomendação). O resultado mantém a taxa de fotogramas do original. Justificação da equipa: bate com a "reamostragem temporal dos fotogramas" da REQ-VID-SPEED e com a TRIM-009 (manter a taxa de fotogramas).

## D-53 — Fator de velocidade 1.0

- **Onde:** `ddd-01-domain-model.md` (FatorVelocidade, OperacaoVelocidade `validate`).
- **Dúvida:** O fator 1.0 está dentro do intervalo homologado, mas produz um vídeo com a mesma cadência, recodificado, e gasta um crédito. Aceita-se ou rejeita-se?
- **O que as fontes dizem:** UC-VID-003 RN2 e REQ-VID-SPEED-004/005: válido se `0.25 ≤ v ≤ 4.0`. As predefinições (SPEED-001) não incluem 1.0. ADD 4.3: o ajuste rejeita com `NO_CHANGES` os parâmetros que não mudam nada. Nenhuma fonte fala do fator 1.0.
- **Opções:** (a) aceitar, como a RN2 diz à letra; (b) rejeitar com `NO_CHANGES`, como o ajuste, antes da tarefa e sem quota.
- **Recomendação:** (b), com a ressalva de que acrescenta uma regra que a ERS não tem; a equipa decide. Impede gastar um crédito numa recodificação que não muda nada, e o código já existe no ADD para o mesmo fim.
- **Resposta:** **(b), rejeitar com `NO_CHANGES`** antes da tarefa e sem quota (a equipa respondeu "(a), NO_CHANGES"; regista-se pelo conteúdo, que é a opção (b) e a recomendação). Registo pedido pela equipa: as predefinições da REQ-VID-SPEED-001 não incluem 1.0×, e a regra é coerente com o `NO_CHANGES` do ajuste (ADD 4.3).
