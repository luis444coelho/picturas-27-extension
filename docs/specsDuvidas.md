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

## D-54 — Destino de pré-visualização da alternativa de cópia do recorte

- **Onde:** B004, verificações V2(c), V3 e V5; `projects/video/plan.js:93-139`, `projects/video/tasks.js:330-357`, `Tools/video/task.py:208-223`; ADR-008, secção 3 ("Sem alterações a outros campos"). Evidência e ligações propostas em `memory-bank/bolts/004-video-basic-edits/implementation-preflight.md`.
- **Dúvida:** O plano normal de `trim` recodifica para MP4 e, por isso, `buildPlan()` devolve `preview: null` e não cria `targets.preview`. A alternativa `keyframeCopy` pode copiar H.264 High 10/4:2:2/4:4:4; nesse caso, o T-06 exige uma pré-visualização compatível com o navegador. Acrescentar apenas `keyframeCopy.preview` não basta: o worker precisa de `plan.targets.preview` para o upload. O ADR-008 só autoriza os extras `input` e `keyframeCopy` e proíbe alterar os outros campos. Qual é o ponto autorizado para acrescentar o destino?
- **O que as fontes dizem:** T-01/T-06: planos calculados no serviço de projetos; ADR-004: plano completo persistido antes de publicar, reutilizado na republicação; ADR-005: destino determinístico `video_preview/<taskId>.mp4`, com o mesmo proprietário/projeto dos restantes destinos. ADR-007 já prevê `keyframeCopy.preview`; falta ligar o destino. Regra 2.6: `plan.js` permanece intacto. `tasks.js` já elimina resultados tardios a partir da união das chaves recebidas com todos os `plan.targets` persistidos.
- **Opções:**
  - **(a) Estender pontualmente o ADR-008:** permitir que `applyPlanExtras(plan, steps, inputProps, registry)` acrescente também `plan.targets.preview`, apenas se estiver ausente e alguma alternativa puder precisar de pré-visualização. Para a B004, o destino é `{userId, projectId, stage: "video_preview", name: "<taskId>.mp4"}`, derivado do destino `original` já calculado no serviço de projetos. Mantêm-se `plan.preview`, `plan.output` e os destinos existentes. Não se muda a assinatura nem o único ponto de chamada após `buildPlan()`. Exige esclarecer documentalmente a excepção à secção 3 do ADR-008 antes de implementar.
  - **(b) Manter o limite do ADR-008:** criar um helper novo de destinos no serviço de projetos, chamado por uma linha adicional em `submit()`, depois de `applyPlanExtras()` e antes de `VideoTask.create()`. Esse helper acrescenta o mesmo `targets.preview` quando necessário. Mantém os extras limitados a `input`/`keyframeCopy`, mas acrescenta um módulo e um segundo ponto de ligação a documentar no desenho.
- **Recomendação:** **(a)**, pela extensão pequena e explícita do módulo já responsável pelas alternativas do plano. A pré-visualização continua a ser decidida no serviço de projetos: `keyframeCopy.preview` usa a matriz de `formats.js` para o resultado MP4 copiado (perfil compatível → sem pré-visualização; incompatível → recodificação H.264 `yuv420p`). O destino é persistido mesmo que o worker venha a escolher recodificação ou não precise de produzir a pré-visualização. O worker só seleciona a alternativa e usa o destino recebido; não inventa destinos. A limpeza tardia existente enumera esse destino mesmo se a resposta omitir a chave de preview. Ambas as opções preservam `plan.js`, os destinos existentes, as assinaturas e os caminhos anteriores das B001–B003.
- **Resposta:** **(a), aprovada pela equipa.** `applyPlanExtras()` pode também acrescentar `plan.targets.preview`, apenas se estiver ausente e alguma alternativa puder precisar de pré-visualização. Destino determinístico `video_preview/<taskId>.mp4`, calculado no serviço de projetos a partir do destino `original`, com o mesmo proprietário/projeto; persistido antes da publicação para republicação e limpeza tardia. Preservam-se `plan.preview`, `plan.output`, destinos existentes e a assinatura aprovada. O worker usa o destino recebido e não o calcula.

## D-55 — Duração ao remover áudio que termina depois da stream de vídeo

- **Onde:** B004, `Tools/video/tests/test_basic_edits.py`, caso `test_remove_audio_formats_and_properties`, AVI H.264/MP3 real gerado com FFmpeg 5.1.9; AUDIO-005/006 e T-05.
- **Dúvida:** O ficheiro de teste tem 120 fotogramas de vídeo a 30 fps (4.000 s), mas a stream MP3 termina aos 4.080 s; o contentor e `videos.meta.duration_ms` indicam 4.080 s. Remover o áudio copiando integralmente o vídeo produz MP4 sem áudio com duração de cerca de 4.034 s. A diferença para o contentor original (46 ms) ultrapassa um fotograma, apesar de os 120 fotogramas serem preservados. Que duração é autoritativa para AUDIO-006 neste caso?
- **O que as fontes dizem:** AUDIO-005/T-05 exigem cópia de vídeo H.264; AUDIO-006 exige preservar duração/resolução/fps; T-02 exige metadados do ficheiro real. Não há política para uma cauda de áudio maior do que a duração visual.
- **Opções:** (a) preservar a stream de vídeo e avaliar a duração visual; aceitar que a duração do contentor diminua pela remoção da cauda de áudio, registando sempre os metadados reais; (b) rejeitar estes ficheiros antes da tarefa com um novo erro de validação (exigiria informação adicional sobre a duração de cada stream); (c) preencher vídeo até à antiga duração do áudio, o que implicaria uma exceção à cópia exigida pela AUDIO-005, a decidir explicitamente.
- **Recomendação:** **(a)**: conserva exatamente o vídeo, conforme a regra de cópia, sem fabricar fotogramas nem conservar a duração do áudio removido.
- **Resposta:** **(a), aprovada pela equipa.** Preservar os fotogramas e avaliar a duração visual; aceitar a remoção da cauda de áudio. Os metadados continuam a vir do ficheiro real.

## D-56 — Entrega do cancelamento durante uma callback Pika síncrona

- **Onde:** integração persistente B004, `cancel active encoding refunds quota and a failed task refunds once`; `Tools/video/task.py:_wait`, `Tools/video/control.py` e Pika 1.3.2 do worker.
- **Dúvida:** A API passou a tarefa a `cancelled` e devolveu o crédito, mas o worker publicou `completed` cerca de quatro segundos depois, sem interromper FFmpeg. A resposta tardia foi descartada pelo serviço de projetos. O código real instalado do Pika confirma que `_dispatch_channel_events()` não despacha callbacks numa chamada reentrante de `process_data_events()` enquanto a callback `on_message` da operação está em execução. A sondagem com fakes da B003 não exercita esta proteção; a integração revelou a limitação no mesmo mecanismo reutilizado pela B004.
- **O que as fontes dizem:** T-03 pede cancelamento efetivo do FFmpeg e um segundo canal na mesma ligação, servido pelo ciclo do worker, sem threads. Regra 2.6 impede substituir as linhas existentes da B003. É necessário um ponto adicional que receba o controlo sem depender de dispatch reentrante.
- **Opções:** (a) acrescentar um adaptador de controlo com uma fila exclusiva adicional ligada ao mesmo `video_control`, no canal de controlo existente, consultada por `basic_get` nos pontos `_wait`/`_tick`; o tratamento da mensagem reutiliza `ControlChannel._on_message`, sem threads, sem nova ligação e sem mudar assinaturas/linhas anteriores; (b) criar uma ligação separada para o controlo, bombeada pelo mesmo ciclo, o que muda a escolha explícita da ligação única; (c) aceitar cancelamento apenas lógico, deixando FFmpeg terminar, o que não cumpre TASK-005.
- **Recomendação:** **(a)**, para manter a ligação única, o executor e o cancelamento existentes, acrescentando apenas receção por consulta explícita; documentar a fila exclusiva adicional e testar com RabbitMQ real. A fila e a consulta são locais ao worker e não mudam o fluxo de imagem nem a configuração global.
- **Resposta:** **(a), aprovada pela equipa.** Acrescentar uma fila exclusiva de controlo consultada por `basic_get` no canal/ligação existentes, reutilizando o tratamento de cancelamento. Sem threads nem nova ligação; as linhas anteriores da B003 e as assinaturas permanecem intactas.

## D-57 — Fim de recorte dentro de um grupo de B-frames que depende de referência posterior

- **Onde:** suite persistente B004 com fotogramas numerados, `test_fractional_keyframe_copy_and_non_keyframe_end`; FFmpeg/FFprobe 5.1.9, MOV H.264/AAC a 30000/1001 fps, início 1001 ms num keyframe e fim 2137 ms.
- **Dúvida:** Mesmo com `-ss/-to` e limite de 35 pacotes de vídeo, a cópia fornece os fotogramas de origem 30–63 e 65, em vez de 30–64. O fotograma 65 é uma referência codificada antes do B-frame 64. A duração real do contentor fica em 1.202 s para um intervalo pedido de 1.136 s (66 ms, mais de um fotograma). Acrescentar `-t 1.136` não resolve: FFmpeg limita por timestamps de descodificação. A fixture anterior, com outro padrão de B-frames, passava; a numeração visível alterou legitimamente a estrutura de referências e revelou a limitação. O início coincide com um keyframe, mas copiar um prefixo de pacotes não garante que o fim escolhido seja representável sem incluir referência posterior.
- **O que as fontes dizem:** TRIM-008/009 exigem segmento/duração precisos; D-49 e ADR-007 escolhem cópia quando o início coincide com keyframe e preveem recodificação se a sondagem falhar. Não há uma condição aprovada para recusar cópia quando a ordem de descodificação impede representar o fim do intervalo.
- **Opções:** (a) permitir recuo para a alternativa de recodificação já persistida quando uma verificação técnica dos PTS dos pacotes demonstrar que o prefixo copiável não corresponde ao intervalo de apresentação escolhido; manter cópia nos intervalos representáveis, o plano/assinaturas e a tolerância de um fotograma; publicar o modo real; (b) aceitar referência/fotogramas posteriores e alargar a tolerância, alterando os critérios de precisão; (c) introduzir recodificação parcial do GOP final e montagem de segmentos, alargando a arquitetura do executor e o âmbito da B004.
- **Recomendação:** **(a)**. Preserva precisão e o executor existente; acrescenta apenas a verificação técnica local que pode selecionar a alternativa de recodificação já autorizada. Os casos de início em keyframe e fim representável continuam a copiar. Deve ficar explícita como extensão do ADR-007, sem o worker inventar destinos ou decisões de domínio.
- **Resposta:** **(a), aprovada pela equipa.** Recuar para recodificação quando o fim não for representável por cópia; preservar a precisão. A verificação técnica dos PTS escolhe entre as alternativas já persistidas; mantêm-se os destinos, as assinaturas e o modo efetivamente executado em `metadata.videoMode`.

## D-58 — Matrizes de cor dos filtros (Q-ADD-07)

- **Onde:** B005, `projects/video/filters.json` (catálogo, ADD 4.4 e T-07); `Tools/video/ops/filter.py`.
- **Dúvida:** Que matrizes 3×3 usam o Preto e Branco, o Sépia, o Vintage, o Frio e o Quente? E aceita-se que o catálogo fique só com transformações lineares (sem vinheta nem grão)?
- **O que as fontes dizem:** ADD T-07: o Preto e Branco usa "pesos de luminância", o Sépia a "matriz clássica" e o Negativo o tipo `invert`. Estes três têm definição canónica, mas o ADD não diz que pesos de luminância usar. As matrizes do Vintage, do Frio e do Quente "têm de ser definidas pela equipa" (Q-ADD-07, em aberto). ADD 4.4: só matrizes, para a pré-visualização (`recomb`) coincidir com o resultado (`colorchannelmixer`). REQ-VID-FILTER-001: seis filtros exatos. Nenhuma D-xx responde a isto.
- **Opções:**
  - (a) Catálogo linear. Matrizes por linhas (R, G, B de saída):
    - **Preto e Branco:** três linhas iguais com os pesos BT.601 `[0.299, 0.587, 0.114]`, os do `convert("L")` do PIL que as ferramentas de imagem usam.
    - **Sépia:** a matriz clássica `[[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]]`.
    - **Vintage:** dessaturado e quente, `[[0.6, 0.3, 0.1], [0.2, 0.7, 0.1], [0.2, 0.1, 0.6]]`.
    - **Frio:** `[[0.9, 0, 0], [0, 1, 0], [0, 0, 1.1]]`.
    - **Quente:** `[[1.1, 0, 0], [0, 1, 0], [0, 0, 0.9]]`.
    - Os valores acima de 255 são saturados da mesma forma pelos dois motores.
  - (b) Como (a), mas com o Preto e Branco em BT.709 `[0.2126, 0.7152, 0.0722]`.
  - (c) A equipa dá outras matrizes.
  - (d) Efeitos não lineares (`curves`, `vignette`). O T-07 exclui-os, porque o sharp não os reproduz.
- **Recomendação:** (a). Os pesos BT.601 são os do PIL, e as três matrizes novas são transformações simples que a equipa pode afinar depois sem mudar o código (só o `filters.json`).
- **Resposta:** **(a), aprovada pela equipa.** Catálogo linear: Preto e Branco com os pesos BT.601 `[0.299, 0.587, 0.114]`, Sépia com a matriz clássica, e Vintage, Frio e Quente com as matrizes propostas na opção (a). Registada como resposta à Q-ADD-07 do ADD.

## D-59 — Marca de água de texto: `drawtext` no worker ou imagem gerada no serviço de projetos (Q-ADD-12, ADD 6)

- **Onde:** B005, `Tools/video/ops/watermark.py`, `Tools/video/Dockerfile` (B001), `projects/video/operations/watermark.js`.
- **Dúvida:** A marca de água de vídeo é feita de raiz no worker (Q-ADD-12, em aberto no ADD). Com que mecanismo se desenha a marca de texto? E entra a dependência `fonts-dejavu-core`?
- **O que as fontes dizem:**
  - ADD T-02: "`overlay` (…) ou `drawtext`; implementação de raiz no worker de vídeo (Q-ADD-12)".
  - ADD 6: os tipos de letra entram "só se a marca de água de texto usar `drawtext`".
  - UC-VID-004, passo 6: "`drawtext` para texto ou `overlay` para imagem". A ST-VID-004 dá a Q-ADD-12 como implementação de raiz.
  - Na verificação desta etapa, o contentor `projects` tem o DejaVu (`/usr/share/fonts/truetype/dejavu`) e o sharp 0.33.5 com pango/fontconfig. O `Tools/video/Dockerfile` não tem tipos de letra.
  - REQ-VID-WATERMARK-005: a marca ocupa "exatamente 20% da largura do quadro". O `drawtext` só recebe o tamanho de letra, por isso a largura do texto tem de ser medida.
- **Opções:**
  - **(a) Uma só via com `overlay`:** o serviço de projetos gera o texto como PNG RGBA com o sharp (DejaVu Sans, branco), já com a largura pedida. O worker trata o texto como uma marca de imagem (`overlay`, `format=rgba`, `colorchannelmixer=aa=<opacidade>`).
    - Sem `drawtext`, o `fonts-dejavu-core` não entra e o `Dockerfile` fica como está.
    - As dimensões exatas do texto são conhecidas para validar os limites.
    - A pré-visualização usa o mesmo PNG que o resultado.
    - Diverge da letra do UC-VID-004 no passo 6, mas o ADD, que tem mais autoridade, admite as duas vias.
  - **(b) `drawtext` no worker:** acrescenta-se ao `Tools/video/Dockerfile` uma linha `RUN apt-get install fonts-dejavu-core`, só por acréscimo.
    - O serviço de projetos mede o texto com o sharp e o mesmo tipo de letra, para validar e calcular o `fontsize`.
    - Há risco de diferenças de 1 a 2 px entre o pango (medição e pré-visualização) e o freetype do `drawtext` (resultado).
    - Muda a imagem do worker, que o ADD 6 trata como mudança de dependência.
- **Recomendação:** (a). Um só caminho no worker, medição e resultado com o mesmo motor, e nenhuma dependência nova (o sharp e o DejaVu já existem no serviço de projetos).
- **Resposta:** **(a), aprovada pela equipa.** O texto é gerado como PNG RGBA com o sharp no serviço de projetos (DejaVu Sans, branco) e aplicado pelo worker com `overlay`, como uma marca de imagem. Sem `drawtext` e sem `fonts-dejavu-core`; o `Tools/video/Dockerfile` não muda. Registada como resposta à Q-ADD-12 do ADD (implementação de raiz no worker de vídeo).

## D-60 — Origem, armazenamento e ciclo de vida da imagem da marca de água

- **Onde:** B005, rotas novas no router de vídeo, `imageStorageService/utils/videoStages.js` (B001), `projects/video/storage.js`, `Tools/video/storage.py`.
- **Dúvida:** A REQ-VID-WATERMARK-003 pede "carregar ou selecionar a partir da galeria do projeto" um PNG ou JPEG. Como chega a imagem ao serviço de projetos e ao worker, onde fica guardada, até que tamanho e até quando?
- **O que as fontes dizem:**
  - UC-VID-004 FA1: galeria do projeto ou ficheiro local PNG/JPEG.
  - O worker só pede URLs para os estágios de vídeo (`imageStorageService/route/video.js` aceita só `videoStages`: `video_src`, `video_out`, `video_preview` e `video_thumb`). As imagens da galeria estão nos estágios de imagem (`src`), que o worker não lê.
  - O `location /api-gateway/` do nginx não tem `client_max_body_size`, por isso o limite é o de omissão, 1 MB.
  - Acrescentar um estágio ao array de `videoStages.js` alteraria uma linha existente (regra 2.6).
  - O plano é persistido para republicação (ADR-004). Por isso, um URL pré-assinado no plano expiraria.
  - Nenhuma fonte fixa o tamanho máximo, o local nem a limpeza.
- **Opções:**
  - **(a) Recurso de marca próprio:** endpoint novo `POST /projects/:user/:project/videos/watermarks`, com a autorização da pré-visualização.
    - Recebe um ficheiro local (`multer.memoryStorage()` num router novo, limite de 1 MB) ou `{imageId}` de uma imagem da galeria, que o serviço de projetos lê do storage de imagem.
    - Valida a imagem com o sharp: PNG ou JPEG legível, no máximo 4096×4096 px. Caso contrário devolve `INVALID_WATERMARK_CONTENT`.
    - Guarda a imagem normalizada para PNG RGBA no estágio existente `video_src`, com o nome `wm-<id>.png`, e regista-a numa coleção nova `video_watermarks` (`project_id`, `owner_id`, chave, `width` e `height`). Devolve `{watermarkId, width, height}`.
    - As marcas de texto (D-59 a) são geradas na aceitação com o nome `wm-<taskId>.png`.
    - O plano leva a origem como destino do storage (`{userId, projectId, stage: "video_src", name}`) e não como URL.
    - **Limpeza:** um módulo novo apaga as marcas de projetos que já não existem e as que não são usadas por nenhuma tarefa ativa há mais de 24 h. A `maintenance.js` não muda.
  - **(b)** Como (a), mas com um `location` novo no nginx para o upload, até 10 MB.
  - **(c)** Imagem em base64 dentro dos `parameters`. Ficaria guardada na `recipe` e no plano do `VideoTask` (perto do limite de 16 MB de um documento MongoDB), por isso é de rejeitar.
- **Recomendação:** (a). Uma marca de água de 1 MB chega para logótipos, não muda o nginx, e o worker lê a imagem por um estágio que já conhece. A `recipe` guarda o `watermarkId`, o que permite reproduzir a operação.
- **Resposta:** **(a), com uma alteração da equipa na limpeza.** Endpoint `POST …/videos/watermarks` (ficheiro local até 1 MB ou `{imageId}` da galeria), validação com o sharp, PNG RGBA em `video_src/wm-<id>.png` e registo em `video_watermarks`; as marcas de texto ficam em `wm-<taskId>.png`; o plano leva o destino e não um URL. **Limpeza:** só se apagam as marcas de projetos que já não existem e as que, ao fim de 24 h, não são referenciadas por nenhum `VideoTask` nem por nenhuma `recipe` de vídeo. Justificação da equipa: uma marca usada num resultado tem de continuar disponível para a `recipe` ser reproduzível (e para as predefinições de cadeia da B008).

## D-61 — Parâmetros, geometria e códigos de erro da marca de água

- **Onde:** B005, `projects/video/operations/watermark.js` (`validate`, `estimate`), painel de marca de água.
- **Dúvida:** Que nome e que parâmetros tem a operação, em que unidades, a que se refere a escala, onde ficam as posições predefinidas, e que código recebe cada erro? E como conhece o `validate` (síncrono, `chain.validateChain`) as dimensões da marca para verificar os limites?
- **O que as fontes dizem:**
  - REQ-VID-WATERMARK-004: posições predefinidas (cantos e centro) ou coordenadas X, Y.
  - REQ-VID-WATERMARK-005: escala de 5% a 50% "da dimensão correspondente do quadro", e o critério diz "20% da largura do quadro".
  - REQ-VID-WATERMARK-006: opacidade de 10% a 100%.
  - UC-VID-004 RN3: `X + largura ≤ largura_vídeo` e `Y + altura ≤ altura_vídeo`.
  - Códigos do UC: `INVALID_WATERMARK_CONTENT` e `WATERMARK_OUT_OF_BOUNDS`.
  - D-50: parâmetros em camelCase, `version` 1, campos a mais ignorados.
  - Q-ADD-13: dimensões de apresentação.
  - O `validate(parameters, inputProps, profile)` não recebe as dimensões da marca e não pode ler a base de dados (é síncrono).
  - Nenhuma fonte dá a margem das posições predefinidas, o passo dos controlos, o comprimento máximo do texto nem o código para escala ou opacidade fora do intervalo.
- **Opções:**
  - **(a)** Operação `watermark`, versão 1, com os parâmetros:
    - `type: "text" | "image"`;
    - `text` (1 a 100 caracteres depois de `trim()`) ou `watermarkId`;
    - `position`: `{preset: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"}` ou `{x, y}`, inteiros em px de apresentação, canto superior esquerdo da marca;
    - `scale` de 0.05 a 0.5, passo 0.01;
    - `opacity` de 0.1 a 1, passo 0.01.

    Regras e códigos:
    - A escala é a da largura: a marca fica com `round(scale × display_width)` px de largura e a altura sai da proporção da marca.
    - As posições predefinidas usam uma margem de `round(0.03 × min(display_width, display_height))` px.
    - Texto vazio, `watermarkId` inexistente ou noutro projeto → `INVALID_WATERMARK_CONTENT` com `{field}`.
    - Marca fora do quadro (incluindo uma altura que não cabe) → `WATERMARK_OUT_OF_BOUNDS` com `{field, limit}`.
    - Tipo, posição, escala ou opacidade mal formados ou fora do intervalo → `INVALID_WATERMARK_PARAMS` com `{field, min, max}`, como o `INVALID_ADJUST_PARAMS`.
    - **Dimensões da marca no servidor:** um *middleware* novo, num router novo montado antes do router de vídeo, resolve a marca antes da validação, nos pedidos `…/validate`, `…/operations` e de pré-visualização com passos `watermark`. Gera o texto (D-59 a) ou lê `video_watermarks` e grava `parameters._mark = {width, height}` por cima do que o cliente tenha enviado, como o `_input` da B004. O `validate` usa o `_mark`. Fica registado como ADR-010.
  - **(b)** A escala aplica-se às duas dimensões: a marca cabe numa caixa de `scale·W × scale·H` (ajuste *contain*). Os limites verificam-se sem conhecer a marca, por isso não é preciso *middleware*. Mas uma marca mais alta do que o quadro em proporção não ocupa "exatamente" a percentagem da largura (critério da WATERMARK-005).
- **Recomendação:** (a). Cumpre o critério da WATERMARK-005 à letra, e as dimensões da marca vêm sempre do servidor.
- **Resposta:** **(a), aprovada pela equipa, com o ADR-010** para o *middleware* que grava `parameters._mark = {width, height}` antes da validação.

## D-62 — Pré-visualização da marca de água (REQ-VID-WATERMARK-009) e o T-07

- **Onde:** B005, endpoint de pré-visualização (T-07) e painel de marca de água.
- **Dúvida:** A REQ-VID-WATERMARK-009 pede uma pré-visualização estática em tempo real da marca sobre o primeiro fotograma. Mas o T-07 diz que o endpoint `…/preview` ignora os passos de marca de água ("recorte, velocidade, áudio, marca de água, junção, conversão"). Como se mostra a pré-visualização?
- **O que as fontes dizem:**
  - ADD T-07: o endpoint só aplica o ajuste, o filtro, o redimensionamento e a orientação, os passos abrangidos pela NFR-015.
  - REQ-VID-WATERMARK-009 é "Deveria ter" e não está na NFR-015.
  - UC-VID-004 FA2: a pré-visualização é atualizada "imediatamente".
- **Opções:**
  - **(a) Endpoint novo** `POST …/videos/:video/watermark-preview`, com a autorização do T-07. Compõe com o sharp (`composite`, com a opacidade aplicada ao alfa) o PNG da marca (D-59/D-60) sobre o fotograma 0. O `…/preview` do T-07 continua a ignorar a marca, como o ADD diz.
  - **(b)** O frontend sobrepõe a marca ao fotograma 0 com CSS: o texto no tipo de letra do navegador e a imagem por URL local. Não há pedido ao servidor, mas o texto pode não coincidir com o resultado.
  - **(c)** O `…/preview` do T-07 passa a aplicar a marca, o que contraria o texto do T-07.
- **Recomendação:** (a). A pré-visualização usa o mesmo PNG e a mesma geometria do resultado, sem mudar o que o T-07 fixa.
- **Resposta:** **(a), aprovada pela equipa.** Endpoint novo `POST …/videos/:video/watermark-preview` com a autorização do T-07; o `…/preview` do T-07 continua a ignorar a marca.

## D-63 — Ponto de ligação dos extras do plano da B005 (ADR-008)

- **Onde:** `projects/video/planExtras.js` (B004), `projects/video/tasks.js:339` (única chamada, depois de `buildPlan()`).
- **Dúvida:** O plano da B005 tem de levar dados que o `estimate` e o `copyable` não exprimem: a entrada completa do filtro do catálogo (T-07, "o plano leva a entrada completa do filtro escolhido") e a origem da marca de água no storage (D-60). O `applyPlanExtras()` sai logo na primeira instrução quando não há `trim`, `remove_audio` nem `speed`, e essa lista é uma linha existente que não pode mudar (regra 2.6). Onde se acrescentam estes extras?
- **O que as fontes dizem:** O ADR-008 apresenta o `planExtras.js` como o padrão a seguir pela B005 (`Read when`: "any bolt that adds new operation modules"). A D-54 (b) já considerou válida uma "linha adicional em `submit()`, depois de `applyPlanExtras()`".
- **Opções:**
  - **(a)** Módulo novo `projects/video/planExtrasVisual.js` com `applyVisualPlanExtras(plan, steps, inputProps, registry)`, com a mesma assinatura e o mesmo padrão. É chamado por uma linha nova em `tasks.js`, logo a seguir à do `applyPlanExtras`. Acrescenta `plan.steps[i].filter` (a entrada do catálogo) e `plan.steps[i].mark` (o destino do PNG, D-60), e não toca nos campos da B003 nem da B004. Fica registado como ADR-010, ao lado do ADR-008.
  - **(b)** As operações devolvem os extras pelo `estimate`, mas o `plan.js` não os passa para o plano.
  - **(c)** O worker lê uma cópia do `filters.json`, o que contraria o T-07 e o T-01.
- **Recomendação:** (a).
- **Resposta:** **(a), aprovada pela equipa.** Módulo novo `projects/video/planExtrasVisual.js`, chamado por uma linha nova em `tasks.js` a seguir ao `applyPlanExtras`. A equipa deixou ao critério da construção juntar ao ADR-010 ou criar outro: fica no **ADR-011**, separado do ADR-010 (*middleware* do `_mark`), por serem pontos de ligação diferentes (pedido HTTP antes da validação vs. plano depois de `buildPlan()`).

## D-64 — Pormenores da pré-visualização, das miniaturas e do painel de redimensionamento que as fontes não fixam

- **Onde:** B005, endpoint `…/preview` (T-07), `GET …/filters/thumbnails` (4.4), painel de redimensionamento (4.5).
- **Dúvida:** Que valores se usam nos pormenores que o ADD dá só como exemplo ou não define?
- **O que as fontes dizem:**
  - T-07: cache "por exemplo 100 fotogramas e 10 min", com remoção do menos usado; resposta em "JPEG ou WebP".
  - 4.4: miniaturas sobre o fotograma 0 "reduzido (~160 px)".
  - REQ-VID-RESIZE-003: as predefinições "aplicadas à altura".
  - REQ-VID-RESIZE-004/005: avisos de distorção e de ampliação.
  - Nenhuma fonte diz o que acontece com as predefinições num vídeo vertical, nem a tolerância do aviso de distorção.
- **Opções:**
  - **(a)** Os seguintes valores:
    - Cache com um `Map` de 100 fotogramas e 10 min, com remoção do menos usado, partilhada pela pré-visualização e pelas miniaturas.
    - Resposta em JPEG com qualidade 85.
    - Miniaturas com 160 px de largura, devolvidas num só JSON com seis imagens JPEG em base64.
    - Predefinições aplicadas à **menor** dimensão de apresentação, para que "720p" dê 720×1280 num vídeo vertical. Num vídeo horizontal coincide com a altura da RESIZE-003.
    - Aviso de distorção quando `|w/h − W/H| > 0.01`.
    - Aviso de ampliação quando `w > display_width` ou `h > display_height`.
  - **(b)** Como (a), mas com as predefinições sempre na altura, à letra da RESIZE-003: num vídeo vertical, "720p" daria 406×720.
  - **(c)** Outros valores.
- **Recomendação:** (a).
- **Resposta:** **(a), aprovada pela equipa.** Cache `Map` de 100 fotogramas e 10 min com remoção do menos usado; JPEG com qualidade 85; miniaturas de 160 px num só JSON; avisos de distorção (`|w/h − W/H| > 0.01`) e de ampliação. **Registo pedido pela equipa:** as predefinições aplicadas à menor dimensão de apresentação fogem à letra da REQ-VID-RESIZE-003 ("aplicadas à altura"); num vídeo horizontal coincidem com ela.

## D-65 — Nome das marcas de água de texto no storage

- **Onde:** B005, `projects/video/watermarks.js` (`storeText`), `projects/video/planExtrasVisual.js`, `projects/video/watermarkCleanup.js`; desvio 1 do `implementation-walkthrough.md`.
- **Dúvida:** A D-60 (a) dizia que as marcas de texto eram geradas na aceitação com o nome `wm-<taskId>.png`. A implementação guarda-as como `wm-<watermarkId>.png`, com um registo em `video_watermarks` por projeto e texto (*hash*), e reutiliza o PNG quando o mesmo texto volta a ser usado. Aceita-se?
- **O que as fontes dizem:** D-60 (a), com a alteração da equipa na limpeza: só se apagam marcas de projetos apagados ou sem referência em nenhum `VideoTask` nem em nenhuma `recipe` ao fim de 24 h, para a `recipe` ser reproduzível. ADR-010: o *middleware* resolve o texto antes da validação, quando ainda não há `taskId` (gerado no `submit()` da B003).
- **Opções:** (a) aceitar `wm-<watermarkId>.png`, com um registo por projeto e texto e o PNG reutilizado; (b) voltar a `wm-<taskId>.png`, o que obrigaria a gerar o PNG depois da criação do `taskId`, dentro do `submit()` da B003, que não pode mudar.
- **Recomendação:** (a).
- **Resposta:** **(a), aceite pela equipa; altera a resposta à D-60.** As marcas de texto ficam em `wm-<watermarkId>.png`, com um registo por projeto e texto e o PNG reutilizado, em vez de `wm-<taskId>.png`. A `recipe` e a limpeza usam o `watermarkId`, o que mantém a reprodutibilidade pedida pela equipa. **Risco residual aceite:** a limpeza pode apagar um registo de texto com mais de 24 h que esteja a ser reutilizado nos milissegundos antes de o `VideoTask` ser criado.

## D-66 — Duas sessões de tarefa no leitor de vídeo (B004 e B005)

- **Onde:** `frontend/components/video/video-edit-actions.tsx` (B004) e `frontend/components/video/video-visual-actions.tsx` (B005), montados lado a lado no `video-player.tsx`; desvio 4 do `implementation-walkthrough.md`.
- **Dúvida:** Cada componente cria a sua sessão (`useVideoEditSession`), por isso uma tarefa iniciada num não deixa o outro ocupado (`busy`) na interface. Aceita-se?
- **O que as fontes dizem:** Regra 2.6: o `video-edit-actions.tsx` não pode ser alterado (tipo `Operation` e `TITLES`). D-47: as peças comuns de tarefa são montadas pelos painéis. REQ-VID-NFR-021 e T-03: uma tarefa ativa por projeto, garantida no servidor pelo lugar de tarefa ativa (`TASK_ALREADY_ACTIVE`).
- **Opções:** (a) aceitar as duas sessões como risco residual; (b) partilhar a sessão, o que exigiria alterar o componente da B004.
- **Recomendação:** (a).
- **Resposta:** **(a), aceite pela equipa como risco residual**, porque o servidor garante uma tarefa por projeto. Na etapa 3, testa-se que um pedido da B005, com uma tarefa da B004 ativa, mostra na interface o erro do servidor.

## D-67 — Contraste e saturação do ajuste: a pré-visualização (sharp) não corresponde ao resultado (FFmpeg) com as fórmulas do ADD 4.3

- **Onde:** B005, etapa 3. Afeta `Tools/video/ops/adjust.py` (worker) e `projects/video/preview.js` (pré-visualização). Os casos de teste `adjust preview matches the FFmpeg result …` de `projects/test/video/e2e-visual-edits.test.js` estão marcados como `todo` ("D-67 pendente").
- **Dúvida:** Com as fórmulas fixadas no ADD 4.3 e no T-07, a pré-visualização do ajuste afasta-se muito do resultado no contraste e na saturação. O brilho coincide. Muda-se a implementação, contra a letra do ADD, ou aceita-se a diferença?
- **O que as fontes dizem:**
  - ADD 4.3 e tabela do T-07:
    - brilho com `colorchannelmixer=rr=f:gg=f:bb=f` ↔ `linear(f, 0)`;
    - contraste com `eq=contrast=c` ↔ `linear(c, 128·(1−c))`, pivô fixo (Q-ADD-18);
    - saturação com `eq=saturation=s` ↔ `modulate({saturation: s})`.
  - O ADD 4.3 aponta como risco a "equivalência sharp ↔ FFmpeg (testes com fotogramas de referência)" e o espaço de cor (o `eq` trabalha em YUV).
  - REQ-VID-ADJUST-005: pré-visualização "com os ajustes aplicados".
  - DQ-020: a mesma semântica das ferramentas de imagem. O `ImageEnhance.Contrast` é uma mistura linear em RGB com um pivô. O `ImageEnhance.Color` é uma mistura com a imagem em tons de cinzento BT.601 (`convert("L")`).
  - O critério de passagem do bolt sobre a NFR-015 só refere as orientações e os filtros.
- **Medições:** diferença média por canal (0–255) entre a pré-visualização e o fotograma do resultado, com o FFmpeg 5.1.9 e o sharp 0.33.5.
  - **Integração real (quadrantes de cor):**
    - brilho 1.2: 0,42;
    - contraste 1.3: 4,87;
    - contraste 0.6: 27,46;
    - saturação 0.5: 37,26;
    - combinação 1.2/1.3/0.5: 45,78.
    - Para comparação: as orientações dão 0,50 a 0,55 e os filtros 0,35 a 1,36.
  - **Gradiente suave (sondagem):**
    - brilho 1.2 e 0.7: 1,32 e 1,05;
    - `eq=contrast` 1.3 e 0.6: 9,95 e 22,84;
    - `eq=saturation` 0.5 e 1.5: 18,10 e 14,21.
    - Alternativas: `lutrgb=val·c+128·(1−c)` dá 2,29 e 1,83; uma matriz de saturação que preserva a luma BT.601 (`colorchannelmixer` no FFmpeg e `recomb` no sharp) dá 1,37 a 1,75 para s = 0, 0.5 e 1.5.
  - O `eq` aplica o contraste só à luma e a saturação só ao croma, em YUV. O sharp aplica o `linear` a cada canal RGB e o `modulate` em LCh.
- **Opções:**
  - **(a) Mudar o contraste e a saturação para RGB nos dois motores e manter o brilho:**
    - contraste com `lutrgb=r=val*c+128*(1-c):g=…:b=…` no worker, mantendo o `linear(c, 128·(1−c))` no sharp (pivô fixo 128, Q-ADD-18);
    - saturação com a matriz `s·I + (1−s)·[luma BT.601]` (`colorchannelmixer` no worker e `recomb` no sharp).
    - Diverge da letra do ADD 4.3 e do T-07 (`eq`, `modulate`) e da A1 do UC-VID-008, mas cumpre a DQ-020 à letra: o `ImageEnhance.Color` do PIL é esta matriz. Fica registado como ADR-012. É uma linha de código em cada passo, em ficheiros novos da B005.
  - **(b) Manter as fórmulas do ADD e aceitar a diferença:** a pré-visualização do ajuste fica só indicativa. Os casos `todo` passam a documentar a diferença em vez de a exigir.
  - **(c) Mudar só a pré-visualização, para imitar o `eq` em YUV:** o sharp não tem operações em YUV, por isso exigiria código de conversão próprio por píxel no serviço de projetos e afastaria a pré-visualização do padrão do T-07.
- **Recomendação:** (a). A pré-visualização passa a coincidir com o resultado (cerca de 2/255, como nos filtros), a semântica fica igual à das ferramentas de imagem (DQ-020), e não há dependências novas.
- **Resposta:** **(a), aprovada pela equipa.** O contraste passa a `lutrgb` com pivô 128 no worker (`val·c + 128·(1−c)`), mantendo o `linear(c, 128·(1−c))` no sharp. A saturação passa à matriz que preserva a luma BT.601 (`colorchannelmixer` no worker e `recomb` no sharp). O brilho não muda. Registado no ADR-012 e no `decision-index.md`. Justificação da equipa: o ADD 4.3 pretende que a pré-visualização seja igual ao resultado (pivô fixo "igual ao da pré-visualização sharp"), e a DQ-020 pede a semântica RGB das ferramentas de imagem; o pivô 128 da Q-ADD-18 mantém-se.

## D-68 — Qualidade da saída AVI na conversão (parte pendente da Q-ADD-11)

- **Onde:** B007, etapa 1; `projects/video/encoding.js`, `projects/video/operations/convert.js` e `Tools/video/ops/convert.py`.
- **Dúvida:** Que valor de `-q:v` usa o codificador `mpeg4` e que bitrate constante (`-b:a`) usa o `libmp3lame` nos resultados AVI?
- **O que as fontes dizem:** ADD T-02/T-05/4.7 fixa `mpeg4` + `libmp3lame`, `yuv420p`, MP3 em taxa constante e ausência de `+faststart`, mas deixa os valores na Q-ADD-11. D-19 fixa `veryfast`/CRF 23/AAC 128 kb/s para a pré-visualização MP4; D-39 aplica os mesmos valores aos resultados MP4/MOV e reserva os parâmetros de AVI para a B007. UC-VID-012 Q1 não dá valores.
- **Opções:**
  - **(a)** `mpeg4 -q:v 5 -pix_fmt yuv420p` e `libmp3lame -b:a 192k` com bitrate constante; qualidade visual moderada e áudio a uma taxa comum, com ficheiros AVI de tamanho variável em função do vídeo.
  - **(b)** `mpeg4 -q:v 3 -pix_fmt yuv420p` e `libmp3lame -b:a 128k` com bitrate constante; mais qualidade de vídeo e menos bitrate de áudio.
  - **(c)** Outros valores indicados pela equipa, mantendo MP3 em taxa constante.
- **Recomendação:** (a), sujeita a ensaio de descodificação/reprodução na etapa 3. Nenhum valor AVI é adotado antes da resposta.
- **Resposta:** **(c), aprovada pela equipa para a B007:** `mpeg4 -q:v 3 -pix_fmt yuv420p` e `libmp3lame -b:a 192k` em taxa constante. O `mpeg4` é menos eficiente do que H.264; `-q:v 3` aproxima a qualidade do CRF 23 da D-39, e MP3 a 192 kb/s fica próximo do AAC a 128 kb/s. Confirmar a reprodução na etapa 3 (NFR-026).

## D-69 — Cópia MP4 para perfis H.264 incompatíveis com navegadores (Q-ADD-20)

- **Onde:** B007, etapa 1; ADD T-06/4.7, `projects/video/formats.js`, `projects/video/plan.js` e o leitor de vídeo.
- **Dúvida:** Confirma-se a cópia de pré-visualização MP4 também para originais e resultados MP4 com H.264 High 10, 4:2:2 ou 4:4:4, recodificada para `yuv420p`, ou rejeitam-se esses perfis na ingestão?
- **O que as fontes dizem:** DQ-012 previa cópia para MOV/AVI. O ADD T-06 e Q-ADD-20 propõem alargá-la a MP4 incompatível. REQ-VID-CONVERT-008 já inclui resultados MP4 incompatíveis e REQ-VID-UPLOAD-009 admite H.264 sem fixar o perfil. A B001 já gera cópia segundo `formats.previewPlan`; rejeitar agora esses originais afetaria a fundação existente e a regra 2.6.
- **Opções:**
  - **(a)** Confirmar o alargamento do T-06: aceitar esses originais e gerar cópia MP4 `yuv420p` para originais e resultados incompatíveis, guardada em `storage.preview_key`.
  - **(b)** Restringir a ingestão aos perfis reproduzíveis sem cópia; exige rever a fundação/ERS e a regra 2.6 antes de aplicar à B007.
  - **(c)** Outra política de compatibilidade definida pela equipa.
- **Recomendação:** (a), alinhada com o ADD, a ERS atual e o comportamento da B001.
- **Resposta:** **(a), aprovada pela equipa.** Gerar cópia MP4 para originais e resultados MP4 com perfis H.264 incompatíveis com o navegador. A REQ-VID-CONVERT-008 já inclui estes resultados.

## D-70 — Critério de cópia por stream na conversão para AVI (Q-ADD-21)

- **Onde:** B007, etapa 1; ADD T-05/4.7, `projects/video/formats.js` e `projects/video/plan.js`.
- **Dúvida:** A cópia direta exige codec de origem igual ao codec de saída da matriz, ou basta que o codec de origem seja admitido pelo contentor de destino?
- **O que as fontes dizem:** ADD T-05 e Q-ADD-21 seguem CONVERT-005: MP4 H.264/AAC → AVI produz MPEG-4 Part 2/MP3 por recodificação. A formulação antiga de CONVERT-006 admitia cópia de H.264/AAC para AVI, apesar de contradizer CONVERT-005; `REQ-VID-CONVERT.md` já diz «iguais aos codecs de saída da matriz». A B003 planeia por igualdade de codec.
- **Opções:**
  - **(a)** Confirmar igualdade com o codec de saída por stream, como no ADD e na redação atual da ERS; copiar MP4 H.264/AAC → MOV, recodificar MP4 H.264/AAC → AVI.
  - **(b)** Copiar qualquer codec admitido pelo contentor de destino; a saída AVI poderia ter H.264/AAC, contrariando CONVERT-005, e exigiria rever a ERS e o plano B003.
  - **(c)** Outra matriz de saída aprovada pela equipa.
- **Recomendação:** (a), para manter saídas uniformes e o contrato já construído na B003.
- **Resposta:** **(a), aprovada pela equipa.** Copiar uma stream apenas quando o codec de origem é igual ao codec de saída da matriz. A REQ-VID-CONVERT-006 já contém esta redação.

## D-71 — Dimensões ímpares quando a conversão recodifica (Q-ADD-25)

- **Onde:** B007, etapa 1; ADD T-02/4.7, `projects/video/plan.js` e `Tools/video/executor.py`.
- **Dúvida:** Confirma-se cortar 1 px em cada dimensão ímpar recodificada para o par abaixo, mantendo a resolução original nas streams copiadas?
- **O que as fontes dizem:** ADD T-02/Q-ADD-25 prevê `crop=trunc(iw/2)*2:trunc(ih/2)*2` porque H.264/MPEG-4 Part 2 em `yuv420p` não codificam dimensões ímpares. CONVERT-007 e ST-VID-012 já incluem a exceção. O `plan.js` e o executor da B003 já aplicam o corte só no modo `encode`.
- **Opções:**
  - **(a)** Confirmar o corte de 1 px apenas nas streams de vídeo recodificadas; os metadados e a UI mostram a dimensão resultante.
  - **(b)** Preservar a dimensão ímpar com outra codificação ou formato de píxel, o que exige rever T-02/T-05, CONVERT-007 e a matriz fixa.
  - **(c)** Outra exceção de resolução definida pela equipa.
- **Recomendação:** (a), alinhada com o ADD, a ERS atual e a infraestrutura já construída.
- **Resposta:** **(a), aprovada pela equipa.** Cortar 1 px nas dimensões ímpares quando há recodificação. A REQ-VID-CONVERT-007 já inclui a exceção.

## D-72 — Como expor no endpoint de validação a decisão de cópia ou recodificação (CONVERT-003)

- **Onde:** B007, etapa 1; `projects/video/tasks.js`, `projects/routes/videos.js`, `frontend/lib/video-tasks.ts` e o painel de conversão.
- **Dúvida:** Que campos adicionais do resultado de `POST …/videos/validate` permitem ao painel mostrar «Cópia direta» ou «Recodificação», incluindo o caso de uma stream copiada e outra recodificada?
- **O que as fontes dizem:** ADD 4.7 exige obter a indicação pelo endpoint de validação. O `plan.js` calcula `decisions.video.mode` e `decisions.audio.mode`, mas a resposta atual de `tasks.validate` inclui apenas `output` (propriedades estimadas), custo e erros. O contrato não nomeia campos para os modos; a regra 2.6 proíbe substituir as linhas existentes. O frontend da D-47 já usa `useVideoEditValidation`.
- **Opções:**
  - **(a)** Acrescentar, apenas quando há `convert`, campos `videoMode` e `audioMode` ao objeto `output` já devolvido, através de uma linha de extensão antes do retorno existente; o painel usa os valores do servidor e indica as streams separadamente quando diferem.
  - **(b)** Acrescentar um endpoint novo e exclusivo de previsão da conversão, que reutilize o planeamento do serviço; o painel teria duas chamadas de validação.
  - **(c)** Outro formato de resposta compatível com o endpoint existente e a regra 2.6.
- **Recomendação:** (a), desde que a verificação V4 confirme que pode ser ligada apenas com linhas novas e sem alterar respostas das operações anteriores.
- **Resposta:** **(a), aprovada condicionalmente pela equipa.** Acrescentar `videoMode` e `audioMode` apenas à resposta de validação de `convert`, desde que V4 confirme que só entram linhas novas e que as respostas da B004 e B005 não mudam; se a V4 falhar, registar dúvida nova e parar.

## D-73 — Nome apresentado do resultado conserva a extensão da origem

- **Onde:** B007, verificação manual da etapa 3; `projects/video/tasks.js` da B003 e `projects/video/fileName.js` da B001/B003.
- **Dúvida:** Aceita-se que um MP4 convertido para MOV apareça no projeto com `original_name` terminado em `.mp4`, embora o ficheiro descarregado tenha a extensão `.mov` correta?
- **O que as fontes dizem:** O `resultVideo` em `tasks.js` da B003 copia `original_name` da origem para o resultado. O download usa `fileName.js`, que escolhe a extensão do contentor guardado. O mesmo nome herdado ocorre nas operações desde a B004. A regra 2.6 do ADD proíbe alterar as linhas existentes do fluxo de publicação.
- **Opções:** (a) aceitar o nome apresentado como risco residual, mantendo o download com a extensão correta; (b) alterar a atribuição de `original_name` em `tasks.js`, o que exige modificar código existente e viola a regra 2.6; (c) definir numa intervenção futura uma apresentação específica dos resultados sem alterar a publicação histórica.
- **Recomendação:** (a) neste bolt, por preservar a regra 2.6 e não afetar o formato real nem o download.
- **Resposta:** **(a), aceite pela equipa como risco residual.** O nome apresentado mantém a extensão da origem; a transferência usa `fileName.js` e recebe a extensão do resultado.
- **Revista pela D-75:** A equipa decidiu corrigir o nome apresentado dos novos resultados de vídeo; os resultados já guardados não são alterados.

## D-74 — Contador de operações diárias não atualiza após tarefas de vídeo

- **Onde:** B007, verificação manual da etapa 3; `frontend/components/video/use-video-task.ts` da B003, `frontend/app/dashboard/[pid]/page.tsx` (fluxo de imagem), `projects/video/tasks.js`, `projects/video/quota.js` e serviço de utilizadores.
- **Dúvida:** Numa conta `free`, o contador «Operações diárias restantes» da interface não diminui após uma operação de vídeo. O crédito não é debitado no servidor ou falta atualizar a sessão do frontend?
- **O que as fontes dizem:** REQ-VID-QUOTA-002/003 exige reservar um crédito na aceitação e mantê-lo debitado após conclusão. A B003 chama `users.getUserType(callerId)`, reserva pela API de utilizadores e guarda `reserved_credits` no VideoTask. `use-video-task.ts` invalida `projectVideos` na conclusão, mas não chama `useUpdateSession`; o fluxo de imagem em `page.tsx` chama `updateSession.mutate` após aceitar o processamento e ao cancelar.
- **Evidência na pilha real (2026-10-23, conta de diagnóstico `free`, conversão MP4 → MOV):** `users.getUserType` e `GET /users/:user` devolveram `free`; `remaining_operations` passou de **5 antes** para **4 na aceitação** e ficou **4 após `completed`**. No MongoDB de utilizadores, `operations` passou de vazio para o registo do dia com `processed: 1`. O VideoTask tinha `reserved_credits: 1` na aceitação e no fim, `refund.state: none` em ambos os momentos e estado final `completed`. Os logs de `projects` para a tarefa registaram `video.task.accepted` com `cost: 1, reserved: 1`, `video.task.started` e `video.task.completed`; não houve evento de devolução. A conta e o projeto de diagnóstico foram removidos pela limpeza da suite.
- **Opções:** (a) aceitar como risco residual de atualização da interface: o servidor debita corretamente, e o contador volta ao valor real quando a sessão é atualizada; (b) numa intervenção futura, montar uma extensão nova que refresque a sessão quando uma tarefa de vídeo é aceite, concluída ou cancelada, verificando a regra 2.6 sem alterar linhas existentes; (c) modificar diretamente `use-video-task.ts` da B003 para chamar `useUpdateSession`, o que viola a regra 2.6.
- **Recomendação:** (a) para a B007, porque a quota no servidor e a cobrança da tarefa estão corretas; planear a atualização do contador numa intervenção aditiva própria.
- **Resposta:** **(a), aceite pela equipa como risco residual sob a condição de débito no servidor, confirmada pelo diagnóstico acima.** O contador apresentado pode ficar desatualizado durante a sessão após operações de vídeo; a quota efetiva no servidor diminui e impede operações acima do limite.

## D-75 — Extensão real no nome apresentado dos novos resultados de vídeo

- **Onde:** Correção pontual após a B007; `projects/models/video.js`, galeria, leitor e painel de informação; ADR-015.
- **Dúvida:** Que nome deve aparecer num vídeo produzido por uma tarefa quando o contentor de saída difere do da origem?
- **O que as fontes dizem:** ADD 4.1/4.2 e REQ-VID-DOWNLOAD-005 distinguem o nome apresentado do nome sugerido para descarregamento. A D-35 põe o sufixo das operações apenas no descarregamento, através de `projects/video/fileName.js`. A D-73 aceitou temporariamente que `tasks.js` copiasse o `original_name` da origem, incluindo a extensão antiga. ADD 2.6 só permite acrescentar linhas ao código existente.
- **Opções:**
  - **(a)** Nos documentos novos com `task_id`, um hook `pre("validate")` no schema, antes de `mongoose.model`, troca apenas a última extensão do `original_name` pela de `formats.CONTAINERS[meta.container].extension`; mantém o nome base sem sufixos, os originais da ingestão e os resultados já guardados.
  - **(b)** Alterar a atribuição em `tasks.js`, substituindo código existente.
  - **(c)** Corrigir só a apresentação em cada interface, mantendo o nome antigo no documento.
- **Recomendação:** (a), por manter um nome coerente nas três vistas, preservar o contrato de download da D-35 e cumprir a regra 2.6 no código de produção.
- **Resposta:** **(a), aprovada pela equipa.** Por exemplo, `Quando Tu Entras Em Campo - SC Braga.mp4` convertido para AVI fica `Quando Tu Entras Em Campo - SC Braga.avi` na galeria, no leitor e na informação; o descarregamento fica `Quando Tu Entras Em Campo - SC Braga_convert.avi`. O hook só atua em documentos novos com `task_id` preenchido, usa a extensão do contentor real e não migra resultados existentes. As D-76 e D-77 foram esclarecidas antes da implementação.

## D-76 — Teste existente exige o nome anterior do resultado (V4)

- **Onde:** Verificação V4 da correção D-75; `projects/test/video/tasks.test.js:492`.
- **Dúvida:** Como atualizar a expectativa do teste da B003 sem violar a regra 2.6, depois da decisão D-75?
- **O que as fontes dizem:** A asserção `assert.equal(video.original_name, "férias.mov", "first source's name (D-35)")` verifica o objeto emitido por `tasks.js` antes do middleware do Mongoose: o teste injeta a coleção falsa `createCollection()` na linha 65, por isso o hook `pre("validate")` não corre. A atribuição do nome da origem em `tasks.js` mantém-se. Um teste novo com `new Video(doc).validate()` cobre o comportamento persistido; o teste de ingestão cobre um original sem `task_id`.
- **Opções:**
  - **(a)** Manter a asserção da coleção falsa e acrescentar testes com o schema real para o comportamento do hook.
  - **(b)** Alterar a expectativa do teste da B003, apesar de ele não usar Mongoose.
  - **(c)** Adiar a correção D-75 até existir uma revisão da regra 2.6 aplicável aos testes históricos.
- **Recomendação:** (a), porque a asserção continua a verificar corretamente `tasks.js` e o teste novo cobre o comportamento persistido, sem base de dados.
- **Resposta:** **(a), esclarecida pela equipa.** A asserção da linha 492 não muda e continua a passar: usa `createCollection()`, não o modelo Mongoose. O teste novo com o schema real verifica que um resultado novo com `task_id` recebe a extensão de `meta.container`, um original sem `task_id` não muda e um documento já existente também não muda. A V4 fica satisfeita sem alterar linhas existentes.

## D-77 — A main remota ainda não contém a B007

- **Onde:** Preparação do ramo `fix/video-result-name` a partir de `origin/main`, em 2026-10-23.
- **Dúvida:** Como criar o ramo pedido a partir da main com a B007 quando a main remota ainda aponta para a B005?
- **O que as fontes dizem:** A equipa indica que a B007 está fechada e na main e pede um ramo criado dessa base, sem merge para a main. Após `git fetch origin main`, `main` e `origin/main` apontam para `270161f` (merge da B005); `origin/bolt/007-video-format-conversion` aponta para `204c4b9`. Criar o ramo agora a partir de `origin/main` deixaria a B007 de fora.
- **Opções:**
  - **(a)** Atualizar a main remota com a B007 pelo processo da equipa e só depois criar `fix/video-result-name` a partir dela.
  - **(b)** Criar o ramo a partir do ramo da B007 e aceitar que o diff contra `origin/main` inclui toda a B007 até a main ser atualizada.
  - **(c)** Criar o ramo a partir da B005, incorporando a B007 no próprio ramo da correção.
- **Recomendação:** (a), para respeitar a base pedida e permitir atribuir o numstat da correção apenas a esta intervenção.
- **Resposta:** **(a), resolvida pela equipa.** A B007 foi integrada e enviada para `origin/main` (`69dc977`); o ramo `fix/video-result-name` foi criado a partir desse commit. As alterações de documentação foram transportadas para o ramo.

## D-78 — Posição da junção numa cadeia e rotas com e sem `:video`

- **Onde:** B008, etapa 1 (`ddd-01-domain-model.md`, EstruturaCadeia, AceitacaoOperacao); `POST …/videos/operations` (com e sem `:video`) e `POST …/videos/validate`.
- **Dúvida:** Numa cadeia com junção, a junção tem de ser o primeiro passo de topo? Se não for, a que vídeo se aplicam os passos de topo que vêm antes dela? E que rota recebe cada pedido: a junção usa a rota sem `:video` (4.8), mas uma cadeia com junção tem um vídeo selecionado no editor (UC-VID-014, passo 1)?
- **O que as fontes dizem:** ADD T-01: a junção é um passo com `parameters.clips: [{videoId, steps}]`, ou seja, todos os clips, incluindo o primeiro, vêm dentro da junção com a sua sub-cadeia. ADD 4.8: uma junção isolada usa `POST …/videos/operations` sem `:video`. ADD 4.9 e UC-VID-014 FA1: "sub-cadeias por clip → junção → passos finais"; o utilizador começa por selecionar um vídeo e, ao acrescentar a junção, junta outros vídeos como clips. REQ-VID-CHAIN-005/006: sub-cadeias antes da junção e passos depois dela. Nenhuma fonte diz o que acontece a passos de topo antes da junção nem que rota recebe uma cadeia com junção.
- **Opções:**
  - **(a)** Quando há junção, é o **primeiro passo de topo**; o que se faz a cada clip antes dela vai na sua sub-cadeia. Junção noutra posição → 422 `INVALID_CHAIN` com `{rule: "concat_not_first"}`. No editor, o vídeo selecionado passa a ser o clip 1 e os passos que já tinha passam para a sua sub-cadeia. Uma cadeia com junção (isolada ou não) usa as rotas **sem** `:video` (`POST …/videos/operations` e `POST …/videos/validate` sem `videoId`); uma cadeia sem junção usa as rotas com `:video`. Um pedido sem `:video` cujo primeiro passo não é uma junção, ou com `:video` e uma junção, → 422 `INVALID_REQUEST` com `{field: "steps"}` (D-23).
  - **(b)** A junção pode estar em qualquer posição; os passos de topo antes dela aplicam-se ao vídeo da rota com `:video`, que tem de ser o clip 1. Há duas formas de escrever a mesma composição (passos antes da junção ou na sub-cadeia do clip 1), o que complica a contagem, a `recipe` e as predefinições.
  - **(c)** Outra regra definida pela equipa.
- **Recomendação:** (a). Uma só forma de exprimir a composição, igual à do T-01 (`clips` com as sub-cadeias) e à do exemplo da FA1, e uma só rota para pedidos com várias entradas.
- **Resposta:** **(a), aprovada pela equipa.** A junção, quando existe, é o primeiro passo de topo; noutra posição → `INVALID_CHAIN {rule: "concat_not_first"}`. Cadeias com junção usam as rotas sem `:video`; sem `:video` e sem junção no início, ou com `:video` e uma junção → 422 `INVALID_REQUEST {field: "steps"}`.

## D-79 — Regras do `INVALID_CHAIN`, restrições das sub-cadeias e extração de fotogramas sem operação

- **Onde:** B008, etapa 1 (`ddd-01-domain-model.md`, EstruturaCadeia, ValidadorCadeia); `projects/video/errors.js` (detalhes do `INVALID_CHAIN`).
- **Dúvida:** Que valores leva o `{rule}` do `INVALID_CHAIN`? As sub-cadeias dos clips podem ter `convert` ou outra junção? E como se rejeita a extração de fotogramas com `INVALID_CHAIN` (CHAIN-018) se a operação não existe no registo (D-05, D-06)?
- **O que as fontes dizem:** ADD 4.9: `INVALID_CHAIN` com `{rule}` a indicar a regra violada (cadeia vazia, mais de uma `concat`, `convert` só no fim, sem extração de fotogramas) e `CHAIN_TOO_LONG`; T-10: `{rule}` nos detalhes. REQ-VID-CHAIN-007, 016, 017 e 018. UC-VID-013 RN13 e UC-VID-014 RN3: no máximo uma junção por cadeia; conversão só no último passo da cadeia. D-42: operação desconhecida → `INVALID_STEP_PARAMS` com `{index, errors}`. D-05/D-06: a extração não é implementada e não tem nome de operação. Nenhuma fonte dá os nomes das regras nem fala de `convert` ou junção dentro de uma sub-cadeia.
- **Opções:**
  - **(a)** `{rule}` ∈ `empty_chain`, `convert_not_last`, `multiple_concat`, `frame_extraction` e `concat_not_first` (D-78), com `{index}` do passo de topo e, dentro de um clip, `{clipIndex, stepIndex}`. Numa sub-cadeia, `convert` dá `convert_not_last` (a junção vem depois e o resultado é MP4) e uma junção dá `multiple_concat`. O validador de estrutura reconhece o nome reservado `extract_frames` antes de consultar o registo, e dá `frame_extraction` em vez de operação desconhecida. As sub-cadeias podem ser vazias (UC-VID-014 FA1).
  - **(b)** Como (a), mas `convert` e junção dentro de um clip dão `INVALID_STEP_PARAMS` desse passo, e a extração de fotogramas fica como operação desconhecida (`INVALID_STEP_PARAMS`, D-42); a CHAIN-018 ficaria por verificar com o seu código.
  - **(c)** Outros nomes.
- **Recomendação:** (a). Cumpre o código da CHAIN-018 sem construir a extração, e os nomes descrevem a regra para o editor os traduzir.
- **Resposta:** **(a), aprovada pela equipa.** `{rule}` ∈ `empty_chain`, `convert_not_last`, `multiple_concat`, `frame_extraction`, `concat_not_first`, com `{index}` e, dentro de um clip, `{clipIndex, stepIndex}`; `convert` numa sub-cadeia → `convert_not_last`, junção numa sub-cadeia → `multiple_concat`; `extract_frames` é um nome reservado reconhecido antes do registo; sub-cadeias vazias permitidas.

## D-80 — Ordem das três fases da validação e endereço dos erros nas sub-cadeias

- **Onde:** B008, etapa 1 (`ddd-01-domain-model.md`, ValidadorCadeia, ErroCadeia); resposta de `POST …/videos/validate` e da aceitação.
- **Dúvida:** (1) Por que ordem correm as fases (passos, estrutura, limites) e o que se devolve quando falham várias? (2) Como se indica um erro num passo dentro da sub-cadeia de um clip, e num clip não elegível (vídeo inexistente, não `completed`, formato não suportado, acima do limite)?
- **O que as fontes dizem:** ADD 4.9 numera as fases 1. por passo, 2. estrutura, 3. limites do perfil, sem dizer se é uma ordem de precedência. ADD 4.8: as verificações dos passos 4 e 5 da aceitação são feitas por clip e o erro indica o clip (`videoId` e posição na linha temporal). D-42: `INVALID_STEP_PARAMS` com `{index, errors}`. T-10: `{total, limit}` no `LIMIT_EXCEEDED`. CHAIN-008: o 11.º passo é bloqueado com `CHAIN_TOO_LONG` logo ao ser acrescentado. Nenhuma fonte define o endereço de um passo de uma sub-cadeia.
- **Opções:**
  - **(a)** Ordem **estrutura → passos → limites**, a parar na primeira fase que falha: a estrutura não precisa de propriedades nem de leituras, e validar passos numa cadeia sem estrutura válida (por exemplo com 12 passos ou duas junções) daria erros enganadores. Os erros seguem a forma de resposta da B003. Endereço: passo de topo `{index}`; passo de um clip `{index, clipIndex, stepIndex}` (o `index` é o da junção); clip não elegível com o código do passo 4 ou 5 da aceitação (`NOT_FOUND`, `RESOURCE_NOT_READY`, `UNSUPPORTED_FORMAT`, `LIMIT_EXCEEDED`) e `{videoId, clipIndex}`; `LIMIT_EXCEEDED` da fase 3 com `{total, limit}` e `{clipIndex}` quando é a saída de um clip; `CHAIN_TOO_LONG` com `{total, limit: 10}`. `clipIndex` conta as ocorrências (um clip repetido tem dois índices).
  - **(b)** A ordem literal do ADD (passos → estrutura → limites), com os mesmos endereços.
  - **(c)** Endereço plano: um índice único na contagem total dos passos (o 4.º passo da cadeia, contando os dos clips).
- **Recomendação:** (a).
- **Resposta:** **(a), aprovada pela equipa.** A numeração do ADD 4.9 não fixa a precedência; validar primeiro a estrutura evita erros enganadores. Ordem estrutura → passos → limites, a parar na primeira fase que falha, com os endereços da opção (a).

## D-81 — Limites de duração nas saídas intermédias de uma cadeia

- **Onde:** B008, etapa 1 (`ddd-01-domain-model.md`, ValidadorCadeia, fase 3).
- **Dúvida:** A fase 3 verifica a duração estimada só nos pontos que o ADD nomeia, ou depois de cada passo? Por exemplo: um vídeo de 4 min abrandado para 0,5× (8 min) e depois recortado para 1 min, num perfil Registado (5 min).
- **O que as fontes dizem:** ADD 4.9, fase 3: "a duração estimada de cada clip e a do resultado final" não podem exceder o limite do perfil (`LIMIT_EXCEEDED` com `{total, limit}`, exceção 5 do UC-VID-014). ADD 4.8 e CONCAT-007: a soma das durações dos clips na junção. T-03 passo 5: limites de duração e tamanho de cada vídeo de entrada. Nenhuma fonte fala das saídas intermédias.
- **Opções:**
  - **(a)** Só os pontos das fontes: cada vídeo de entrada (passo 5 da aceitação), a saída da sub-cadeia de cada clip, a soma na junção (`validate` da `concat`, CONCAT-007) e o resultado final. As saídas intermédias não são limitadas; o exemplo é aceite.
  - **(b)** Também a saída de cada passo; o exemplo é rejeitado no abrandamento.
- **Recomendação:** (a). É o que o ADD escreve; o trabalho do worker depende das entradas, que já são limitadas, e (b) rejeitaria cadeias cujo resultado cumpre o limite.
- **Resposta:** **(a), aprovada pela equipa.** Limites só na entrada de cada vídeo, na saída de cada sub-cadeia, na soma da junção e no resultado final; as saídas intermédias não são limitadas.

## D-82 — Fase da falha de uma tarefa (Q-ADD-16, parte da falha)

- **Onde:** B008, etapa 1 (`ddd-01-domain-model.md`, FaseFalha, ErroTarefa); `VideoTask.error`, `GET …/videos/tasks/:taskId`, `video-task-update`, resposta `failed` do worker.
- **Dúvida:** A ST-VID-014 (AC4) e a exceção 7 do UC-VID-014 pedem que o erro indique a fase (descarregamento, codificação ou *upload*) em vez do passo. A D-40 deixou esta parte da Q-ADD-16 para a B008. Onde e com que valores vai a fase, e para que tarefas?
- **O que as fontes dizem:** UC-VID-014, exceção 7; ADD 4.9 (riscos) e Q-ADD-16. B003: `ErroTarefa {code, message}` com `PROCESSING_ERROR` (D-21); a causa técnica fica só nos logs (ERROR-002, T-10). Nenhuma fonte dá o nome nem os valores do campo.
- **Opções:**
  - **(a)** Campo novo `error.phase` ∈ `download` (URLs e descarregamento das entradas, incluindo as marcas de água), `encode` (FFmpeg, FFprobe, miniatura e fotograma 0) e `upload` (URLs de escrita e envio). Vai no `VideoTask.error`, no `GET …/tasks/:taskId` e no `video-task-update`, em **qualquer** tarefa (uma operação isolada também ganha a fase), por acréscimo. O worker indica a fase na resposta `failed`. As falhas sem fase observável (esgotamento das entregas, rotina de manutenção, falha antes de começar) ficam sem `phase`. O `code` continua `PROCESSING_ERROR`; a interface mostra a fase na mensagem.
  - **(b)** Como (a), mas só nas tarefas `chain` e `concat`.
  - **(c)** Códigos diferentes por fase (`DOWNLOAD_ERROR`, `ENCODE_ERROR`, `UPLOAD_ERROR`) no lugar de `PROCESSING_ERROR`, o que muda o código das falhas das B003 a B007.
- **Recomendação:** (a). O código estável da ERROR-001 não muda, a fase é um detalhe a mais e a interface comum da B003 pode mostrá-la sem distinguir o tipo de tarefa.
- **Resposta:** **(a), aprovada com uma condição.** `error.phase` ∈ `download`, `encode`, `upload` em qualquer tarefa, com o `code` `PROCESSING_ERROR`. A etapa 2 acrescenta uma verificação V, confirmada na etapa 4, de que a fase entra na resposta `failed` do worker e no `VideoTask` só com linhas novas (regra 2.6); se não for possível, regista-se uma dúvida nova e pára-se.

## D-83 — Regras das predefinições de cadeia de vídeo que as fontes não fixam

- **Onde:** B008, etapa 1 (`ddd-01-domain-model.md`, PredefinicaoVideo, ServicoPredefinicoesVideo); `users/models/videoPreset.js`, `users/routes/videoPresets.js`, `apiGateway/routes/videoPresets.js` e o editor de cadeia.
- **Dúvida:** Que limites tem o nome, que erros dão um nome repetido e uma cadeia inválida, que operações há (listar, criar, mudar, apagar), o que se valida ao guardar e como se carrega uma predefinição no editor?
- **O que as fontes dizem:** ADD 4.9: `{owner_id, name, steps: [{operation, version, parameters}]}`, nome único por dono, sem partilha, sem junção; recusa do `anonymous` com 403; `videoAuth` no gateway; "repete o padrão de `users/routes/presets.js` (CRUD, nome único), sem a partilha". REQ-VID-CHAIN-014 e UC-VID-014 FA3: guardar com um nome e reutilizar numa nova cadeia (num lote fica de fora, D-06). T-01: a `version` serve para migrar ou rejeitar receitas guardadas. Os parâmetros de vários passos dependem do vídeo (por exemplo os instantes do recorte), por isso não se podem validar sem ele.
- **Opções:**
  - **(a)** Nome com `trim()`, de 1 a 50 caracteres, único por dono sem distinguir maiúsculas de minúsculas; repetido → 409 `PRESET_NAME_TAKEN`. Rotas `GET /users/:user/video-presets`, `POST`, `PUT /…/:id` (muda o nome e/ou os passos) e `DELETE /…/:id`; sem limite de número. Ao guardar valida-se só a estrutura (operações e versões conhecidas, sem junção, sem `extract_frames`, `convert` só no fim, 1 a 10 passos), com os códigos da D-79 e o `CHAIN_TOO_LONG`, e retiram-se os campos que o servidor grava (`_mark`, `_input`). Os parâmetros são validados quando a predefinição é carregada numa cadeia, pelo `POST …/videos/validate`. Carregar **substitui** os passos da cadeia principal (sem junção) ou da sub-cadeia de um clip, com confirmação quando a lista não está vazia.
  - **(b)** Como (a), mas carregar **acrescenta** os passos aos que já existem, até 10.
  - **(c)** Copiar as regras exatas de `users/routes/presets.js` (a verificar no código na etapa 2), sem a partilha.
- **Recomendação:** (a); na etapa 2 regista-se onde o padrão das predefinições de imagem difere.
- **Resposta:** **(a), com uma alteração da equipa.** A mudança de nome e de passos usa `PATCH /users/:user/video-presets/:id`, como o `users/routes/presets.js`, e não `PUT`. Sem limite de número de predefinições: o limite de 4 é das predefinições de imagem e não está nas fontes de vídeo. A etapa 2 prevê uma verificação V que regista onde o padrão de `presets.js` difere.

## D-84 — Marcas de água de imagem nas predefinições (ADR-010, D-60, D-61)

- **Onde:** B008, etapa 1 (`ddd-01-domain-model.md`, PredefinicaoVideo); `parameters.watermarkId` das predefinições de vídeo.
- **Dúvida:** Uma marca de água de imagem guarda o `watermarkId` de um registo de `video_watermarks` do projeto onde foi carregada. Uma predefinição pertence ao utilizador e pode ser usada noutro projeto, onde esse `watermarkId` dá `INVALID_WATERMARK_CONTENT` (D-61: "`watermarkId` inexistente ou noutro projeto"). O que se guarda e o que acontece ao carregar?
- **O que as fontes dizem:** D-60: as marcas ficam enquanto alguma `recipe` ou `VideoTask` as referir, "para as predefinições de cadeia da B008". D-61: `watermarkId` de outro projeto é inválido. ADR-010: o `_mark` é sempre gravado pelo servidor. ADD 4.9: as predefinições não são partilhadas.
- **Opções:**
  - **(a)** Guarda-se o passo tal como está (com o `watermarkId`, sem o `_mark`). No mesmo projeto funciona; noutro projeto, a validação dá `INVALID_WATERMARK_CONTENT {field: "watermarkId"}` nesse passo e o painel pede outra imagem. As marcas de texto funcionam em qualquer projeto.
  - **(b)** Ao guardar retira-se o `watermarkId`, e a imagem tem de ser escolhida sempre que a predefinição é carregada.
  - **(c)** Aceitar marcas de outro projeto do mesmo dono, o que muda a regra da D-61 e o código da B005 (regra 2.6).
- **Recomendação:** (a). Não muda a B005, mantém a predefinição reproduzível no projeto de origem e dá um erro claro nos outros.
- **Resposta:** **(a), aprovada pela equipa.**

## D-85 — Código de uma predefinição de vídeo com junção

- **Onde:** B008, etapa 2 (`ddd-02-technical-design.md`, API das predefinições); `POST` e `PATCH /users/:user/video-presets…`.
- **Dúvida:** A D-83 manda validar a estrutura ao guardar "com os códigos da D-79", mas nenhuma regra da D-79 cobre uma predefinição com uma junção: numa cadeia, uma junção é permitida. Que código e que `{rule}` recebe?
- **O que as fontes dizem:** ADD 4.9 e UC-VID-014 FA3: "Cadeias com junção não podem ser guardadas"; REQ-VID-CHAIN-014: "guardar uma cadeia sem junção". D-79: `{rule}` ∈ `empty_chain`, `convert_not_last`, `multiple_concat`, `frame_extraction`, `concat_not_first`. Nenhuma fonte dá o código.
- **Opções:** (a) 422 `INVALID_CHAIN` com `{rule: "concat_in_preset", index}`, uma sexta regra só usada pelas predefinições; (b) 422 `INVALID_CHAIN` com `{rule: "multiple_concat"}`, que descreve mal o caso; (c) 422 `INVALID_REQUEST` com `{field: "steps"}` (D-23).
- **Recomendação:** (a). O editor já traduz o `{rule}` e a mensagem diz exatamente porque a cadeia não pode ser guardada; o botão "Guardar como predefinição" fica desativado no editor quando há junção, por isso o código só aparece a quem chama a API diretamente.
- **Resposta:** _pendente._
