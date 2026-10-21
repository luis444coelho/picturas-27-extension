# 📝 Exercício 2 — Especificação de Requisitos do Sistema (ERS)
### Fase 1: Suporte a Vídeo no PictuRAS · Dossiê de Requisitos e Arquitetura

---

## 0. Identificação e Metadados do Dossiê

| **Campo** | **Valor** |
|---|---|
| **Grupo / Equipa** | Grupo 27 |
| **Autores** | Equipa PictuRAS-27 |
| **Data** | 2026-10-21 |
| **Versão do Dossiê** | v2.4 (Alinhamento com o ADD v1.1); v2.3 (Novos requisitos RF1–RF10: casos de uso UC-VID-006 a UC-VID-015) |
| **Caso de Uso / Âmbito** | UC-VID-000 a UC-VID-015 — Extensão para Suporte a Vídeo Digital (Carregamento/Visualização, Trim, Áudio, Velocidade, Marca de Água, Fotogramas, Descarregamento, Informações, Ajustes, Filtros, Redimensionamento, Orientação, Conversão, Junção, Encadeamento e Lote) |
| **Baseline do Exercício 1** | `docs/requirements.md` (v1.2) e `docs/use-cases.md` (v1.2) |
| **Norma de Referência de Qualidade** | ISO/IEC 25010:2011 / ISO/IEC 25010:2023 |
| **Unidade Curricular** | Requisitos e Arquiteturas de Software — MEI, Universidade do Minho |

---

## 4. Especificação de Requisitos do Sistema (ERS)

**Casos de Uso Abrangidos:**
- **[UC-VID-000](use-cases/UC-VID-000.md)**: Carregamento, ingestão e visualização de vídeo no projeto *(Caso de Uso Fundacional)*
- **[UC-VID-001](use-cases/UC-VID-001.md)**: Recorte temporal de um vídeo (*trim*)
- **[UC-VID-002](use-cases/UC-VID-002.md)**: Remoção do áudio de um vídeo
- **[UC-VID-003](use-cases/UC-VID-003.md)**: Alteração da velocidade de reprodução de um vídeo
- **[UC-VID-004](use-cases/UC-VID-004.md)**: Aplicação de marca de água a um vídeo
- **[UC-VID-005](use-cases/UC-VID-005.md)**: Extração de fotogramas de um vídeo para o projeto
- **[UC-VID-006](use-cases/UC-VID-006.md)**: Descarregar um vídeo do projeto
- **[UC-VID-007](use-cases/UC-VID-007.md)**: Consultar as informações de um vídeo
- **[UC-VID-008](use-cases/UC-VID-008.md)**: Ajustar as propriedades visuais de um vídeo
- **[UC-VID-009](use-cases/UC-VID-009.md)**: Aplicar um filtro visual a um vídeo
- **[UC-VID-010](use-cases/UC-VID-010.md)**: Redimensionar um vídeo
- **[UC-VID-011](use-cases/UC-VID-011.md)**: Rodar e espelhar um vídeo
- **[UC-VID-012](use-cases/UC-VID-012.md)**: Converter o formato de um vídeo
- **[UC-VID-013](use-cases/UC-VID-013.md)**: Juntar vídeos
- **[UC-VID-014](use-cases/UC-VID-014.md)**: Encadear operações de edição num vídeo
- **[UC-VID-015](use-cases/UC-VID-015.md)**: Processar vários vídeos em lote

**Baseline e Evolução do Exercício 1 para o Exercício 2:**
- A baseline inicial do Exercício 1 cobria apenas as cinco operações de transformação temporal e espacial de vídeo (UC-VID-001 a 005). Contudo, dado que o PictuRAS é uma plataforma originalmente desenvolvida em exclusivo para processamento de imagem estática, tornou-se mandatória a definição formal do caso de uso de ingestão, validação e reprodução de vídeo (**UC-VID-000**), indispensável para viabilizar qualquer processamento subsequente.
- Na presente versão da ERS, todos os requisitos funcionais e de qualidade foram revistos e decompostos segundo o princípio da **estrita atomicidade**: cada requisito enuncia uma única obrigação não divisível do sistema através do fraseamento canónico (*"O sistema deve..."* ou *"O sistema deve permitir ao {ator}..."*), eliminando ambiguidades e formulações compostas.
- Para assegurar clareza e permitir a integração modular no relatório final (e.g., tabelas Typst paisagem por capítulo), os requisitos encontram-se **organizados em ficheiros independentes por caso de uso e domínio transversal** na pasta [`docs/requirements/`](requirements/).
- Na versão v2.3, a ERS foi estendida com dez novas funcionalidades (RF1 a RF10, pedidas no enunciado da Fase 1 e descritas a seguir), especificadas nos casos de uso **UC-VID-006** a **UC-VID-015**: descarregamento, consulta de informações, ajuste de propriedades visuais, filtros, redimensionamento, rotação/espelho, conversão de formato, junção de vídeos, encadeamento de operações e processamento em lote. O encadeamento e o lote de vídeos passaram a integrar o MVP e a matriz de formatos foi alargada a MP4, MOV e AVI (DQ-002, DQ-012 a DQ-025).
- Na versão v2.4, a ERS foi alinhada com o ADD v1.1 (`docs/add.md`), que passa a ser o documento mestre das decisões de arquitetura: a tabela de impacto (4.2) segue a regra "só acrescentar" (ADD 2.6), as referências aos requisitos não funcionais usam a decomposição NFR-017 a NFR-026, e os requisitos, as decisões de qualidade e os casos de uso refletem as decisões propostas nas questões Q-ADD-01 a Q-ADD-25, dadas como aceites.

---

### 4.1 Requisitos da ERS

#### 4.1.1 Catálogo de Requisitos Funcionais (por Caso de Uso)

| **Secção** | **Âmbito / Caso de Uso** | **Prefixo dos Requisitos** | **Qtd.** | **Ficheiro de Especificação** |
|---|---|---|:---:|---|
| **4.1.1.1** | Requisitos Comuns e Transversais (Sessão, Quotas, Storage, Tasks, Erros) | `REQ-VID-COM`, `AUTH`, `QUOTA`, `STORAGE`, `TASK`, `ERROR` | 33 | [REQ-VID-COM.md](requirements/REQ-VID-COM.md) |
| **4.1.1.2** | UC-VID-000: Carregamento, Ingestão e Visualização de Vídeo | `REQ-VID-UPLOAD` | 20 | [REQ-VID-UPLOAD.md](requirements/REQ-VID-UPLOAD.md) |
| **4.1.1.3** | UC-VID-001: Recorte Temporal (*Trim*) | `REQ-VID-TRIM` | 10 | [REQ-VID-TRIM.md](requirements/REQ-VID-TRIM.md) |
| **4.1.1.4** | UC-VID-002: Remoção do Áudio | `REQ-VID-AUDIO` | 6 | [REQ-VID-AUDIO.md](requirements/REQ-VID-AUDIO.md) |
| **4.1.1.5** | UC-VID-003: Alteração da Velocidade de Reprodução | `REQ-VID-SPEED` | 8 | [REQ-VID-SPEED.md](requirements/REQ-VID-SPEED.md) |
| **4.1.1.6** | UC-VID-004: Marca de Água em Vídeo | `REQ-VID-WATERMARK` | 11 | [REQ-VID-WATERMARK.md](requirements/REQ-VID-WATERMARK.md) |
| **4.1.1.7** | UC-VID-005: Extração de Fotogramas para o Projeto | `REQ-VID-FRAMES` | 13 | [REQ-VID-FRAMES.md](requirements/REQ-VID-FRAMES.md) |
| **4.1.1.8** | UC-VID-006: Descarregamento de Vídeo | `REQ-VID-DOWNLOAD` | 9 | [REQ-VID-DOWNLOAD.md](requirements/REQ-VID-DOWNLOAD.md) |
| **4.1.1.9** | UC-VID-007: Consulta de Informações do Vídeo | `REQ-VID-INFO` | 9 | [REQ-VID-INFO.md](requirements/REQ-VID-INFO.md) |
| **4.1.1.10** | UC-VID-008: Ajuste de Propriedades Visuais | `REQ-VID-ADJUST` | 10 | [REQ-VID-ADJUST.md](requirements/REQ-VID-ADJUST.md) |
| **4.1.1.11** | UC-VID-009: Filtros Visuais Predefinidos | `REQ-VID-FILTER` | 7 | [REQ-VID-FILTER.md](requirements/REQ-VID-FILTER.md) |
| **4.1.1.12** | UC-VID-010: Redimensionamento de Vídeo | `REQ-VID-RESIZE` | 9 | [REQ-VID-RESIZE.md](requirements/REQ-VID-RESIZE.md) |
| **4.1.1.13** | UC-VID-011: Rotação e Espelho de Vídeo | `REQ-VID-ORIENT` | 9 | [REQ-VID-ORIENT.md](requirements/REQ-VID-ORIENT.md) |
| **4.1.1.14** | UC-VID-012: Conversão de Formato de Vídeo | `REQ-VID-CONVERT` | 10 | [REQ-VID-CONVERT.md](requirements/REQ-VID-CONVERT.md) |
| **4.1.1.15** | UC-VID-013: Junção de Vídeos | `REQ-VID-CONCAT` | 13 | [REQ-VID-CONCAT.md](requirements/REQ-VID-CONCAT.md) |
| **4.1.1.16** | UC-VID-014: Encadeamento de Operações de Vídeo | `REQ-VID-CHAIN` | 18 | [REQ-VID-CHAIN.md](requirements/REQ-VID-CHAIN.md) |
| **4.1.1.17** | UC-VID-015: Processamento de Vídeos em Lote | `REQ-VID-BATCH` | 19 | [REQ-VID-BATCH.md](requirements/REQ-VID-BATCH.md) |
| **Total** | **Requisitos Funcionais do Subsistema de Vídeo** | — | **214** | — |

---

#### 4.1.2 Requisitos Não Funcionais e de Qualidade (ISO/IEC 25010)

Os 26 requisitos de qualidade do sistema encontram-se especificados no documento individual dedicado:
👉 **[Ver Tabela Completa de Requisitos Não Funcionais — REQ-VID-NFR.md](requirements/REQ-VID-NFR.md)**

A classificação cobre:
- **Segurança** (`REQ-VID-NFR-001`, `017`): Autenticação JWT, autorização segundo as permissões do projeto e URLs pré-assinados temporários.
- **Fiabilidade** (`REQ-VID-NFR-002`, `007`): `correlationId` distribuído e integridade transacional de dados sem ficheiros órfãos.
- **Compatibilidade** (`REQ-VID-NFR-003`, `004`, `018`, `019`): Contentores MP4, MOV e AVI na entrada segundo a matriz de codecs aprovada, resultados em MP4 (H.264/AAC) salvo na conversão de formato, e exportação JPEG/PNG nativa com a resolução da stream de origem.
- **Desempenho** (`REQ-VID-NFR-005`, `006`): Resposta síncrona HTTP $\le 1$ s e workers 100% assíncronos via RabbitMQ.
- **Capacidade** (`REQ-VID-NFR-008`, `020`, `021`): Limites contratuais rígidos de duração e tamanho (`008`), de fotogramas por extração (`020`) e concorrência máxima de 1 tarefa ativa por projeto (`021`).
- **Usabilidade** (`REQ-VID-NFR-009`): Progresso numérico WebSocket (0–100%), pelo menos 1×/s, em todas as operações.
- **Portabilidade e Manutenibilidade** (`REQ-VID-NFR-010`, `011`): Contentores Docker com FFmpeg e fila desacoplada `video_operations_queue`.
- **Compatibilidade dos resultados** (`REQ-VID-NFR-012`, `026`): Vídeos produzidos descodificáveis sem erros (`012`) e reproduzíveis em leitores de referência (`026`).
- **Eficiência** (`REQ-VID-NFR-013`, `016`, `025`): No máximo uma recodificação por cadeia de operações, descarregamento direto do storage (`016`) e retoma de transferências interrompidas com `Range` (`025`).
- **Capacidade de composição** (`REQ-VID-NFR-014`, `022`, `023`, `024`): Limites de vídeos por lote (`014`) e por junção (`022`), de passos por cadeia (`023`) e de duração total da junção (`024`).
- **Usabilidade das pré-visualizações** (`REQ-VID-NFR-015`): Pré-visualizações estáticas de ajustes, filtros, redimensionamento e orientação em $\le 1$ s.

---

#### 4.1.3 Verificação da Completude e dos Limites do Âmbito

| **Tópico a verificar** | **Aplicável?** | **Decisão / justificação** | **Requisito(s) relacionado(s)** |
|---|:---:|---|---|
| **Carregamento, ingestão e visualização de vídeo** | **Sim** | O sistema suporta nativamente o carregamento por seleção e arrastamento, validação de cabeçalhos e codecs, armazenamento em SeaweedFS/S3, extração de metadados técnicos, geração de miniatura JPEG e visualização num leitor multimédia integrado com controlos de navegação e atalhos para edição. | REQ-VID-UPLOAD-001 a 020, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| **Formato, codec, duração e dimensão do vídeo** | **Sim** | O sistema aceita na entrada os contentores MP4, MOV e AVI com os codecs da matriz aprovada (H.264/AAC em MP4 e MOV; H.264 ou MPEG-4 Part 2 / AAC ou MP3 em AVI), gera os resultados das operações em MP4 (H.264/AAC) e, na conversão de formato, no contentor escolhido entre MP4, MOV e AVI; os originais e resultados MOV/AVI, e os MP4 com perfis H.264 que os navegadores não reproduzem (10 bits, 4:2:2, 4:4:4), são reproduzidos através de uma cópia de pré-visualização MP4 (ADD v1.1, Q-ADD-20); exporta fotogramas em JPEG/PNG. Impõe limites de duração e tamanho diferenciados por perfil (Registado: $\leq 5$ min e $\leq 200$ MB; Premium: $\leq 60$ min e $\leq 2$ GB). | REQ-VID-UPLOAD-003, REQ-VID-UPLOAD-004, REQ-VID-UPLOAD-009 a 011, REQ-VID-UPLOAD-016, REQ-VID-UPLOAD-017, REQ-VID-CONVERT-005, REQ-VID-NFR-003, REQ-VID-NFR-004, REQ-VID-NFR-008, REQ-VID-NFR-012 |
| **Estado, progresso, cancelamento e resultado** | **Sim** | Implementado ciclo de vida assíncrono completo com estados `queued → processing → completed \| failed \| cancelled`. Progresso contínuo 0–100% via WebSocket, emitido pelo menos uma vez por segundo em todas as operações (ADD v1.1, T-02). Cancelamento suportado com interrupção do worker e limpeza de temporários. | REQ-VID-TASK-001 a 005, REQ-VID-NFR-005, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| **Falhas durante o processamento** | **Sim** | Política estrita de integridade: em caso de falha durante a descodificação, recorte ou codificação, o vídeo original é preservado, nenhum resultado parcial é gravado no projeto, os temporários são purgados e a operação de quota reservada é estornada ao utilizador registado. | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-FRAMES-013, REQ-VID-ERROR-001 a 003, REQ-VID-NFR-007 |
| **Persistência e expiração dos ficheiros** | **Sim** | Os vídeos e resultados de transformações são armazenados como recursos de projeto permanentes no SeaweedFS/S3, com metadados persistidos no MongoDB e referência ao vídeo de origem (`sourceVideoId`). Seguem o ciclo de vida e permissões do projeto onde residem. | REQ-VID-COM-003, REQ-VID-STORAGE-001 a 005, REQ-VID-UPLOAD-007, REQ-VID-UPLOAD-013, REQ-VID-NFR-001 |
| **Perfis e contagem de operações** | **Sim** | Acesso reservado a utilizadores Registados e Premium (Anónimos excluídos). O carregamento de vídeo é livre de débito de quota. Cada operação de manipulação consome exatamente 1 crédito da quota diária de 5 operações do utilizador Registado. O perfil Premium tem acesso ilimitado. Em projetos partilhados, a quota é imputada ao utilizador executor da operação. | REQ-VID-AUTH-001 a 003, REQ-VID-QUOTA-001 a 006, REQ-VID-UPLOAD-014, REQ-VID-NFR-008 |
| **Encadeamento de ferramentas e processamento em lote** | **Sim** | **Decisão de Âmbito para o MVP (revista na v2.3):** O encadeamento de operações de vídeo (UC-VID-014), incluindo a composição com junção de vários clips, e o processamento em lote de vários vídeos (UC-VID-015) fazem parte do MVP da Fase 1. A extração de fotogramas não é elegível como passo de cadeia nem como operação de lote de vídeos; os fotogramas extraídos continuam a poder ser encadeados e processados em lote como imagens normais do projeto. | REQ-VID-CHAIN-001 a 018, REQ-VID-BATCH-001 a 019, REQ-VID-COM-006, REQ-VID-TASK-006, REQ-VID-TASK-007, REQ-VID-QUOTA-007, REQ-VID-QUOTA-008, REQ-VID-FRAMES-011 (Justificado no UC-VID-005 RN11 e A6, DQ-016 a DQ-018) |
| **Descarregamento e consulta de informações** | **Sim** | Os vídeos concluídos (originais ou resultantes) podem ser descarregados por URL assinado temporário com retoma, no formato armazenado, e as suas informações técnicas consultadas a partir dos metadados persistidos; nenhuma das ações consome quota. | REQ-VID-DOWNLOAD-001 a 009, REQ-VID-INFO-001 a 009, REQ-VID-QUOTA-008, REQ-VID-NFR-016 |
| **Transformações visuais e geométricas** | **Sim** | Ajuste de brilho, contraste e saturação, filtros predefinidos, redimensionamento e rotação/espelho, com pré-visualização estática e utilização isolada, em cadeia ou em lote. | REQ-VID-ADJUST-001 a 010, REQ-VID-FILTER-001 a 007, REQ-VID-RESIZE-001 a 009, REQ-VID-ORIENT-001 a 009, REQ-VID-NFR-015 |
| **Junção de vídeos** | **Sim** | Concatenação de 2 a 10 (Registado) ou 50 (Premium) clips com normalização para o primeiro clip à saída da sua sub-cadeia (dimensões de apresentação), silêncio nos clips sem áudio quando pelo menos um clip tem áudio e corte seco; as transições ficam fora do MVP (Q-ERS-006). | REQ-VID-CONCAT-001 a 013, REQ-VID-STORAGE-002, REQ-VID-STORAGE-004, REQ-VID-NFR-022, REQ-VID-NFR-024 |

---

### 4.2 Impacto no Sistema Existente

A tabela seguinte documenta a análise detalhada de impacto na arquitetura existente do PictuRAS provocada pela introdução da ERS de vídeo.

A evolução segue a regra **só acrescentar** do ADD v1.1 (secção 2.6): o código existente não é alterado. A funcionalidade de vídeo reutiliza-o tal como está e acrescenta ficheiros novos e pontos de ligação novos (uma linha `app.use`, um `require`, uma fila, um serviço ou um `location` novos), sem tocar nas linhas que já existem. Por isso, nenhum elemento existente é modificado: cada um é **Estendido (por acréscimo)** ou **Mantido**.

| **Elemento existente afetado** | **Impacto (Manter / Estender por acréscimo)** | **Descrição do impacto** | **Requisito(s) relacionado(s)** |
|---|:---:|---|---|
| API Gateway (`apiGateway/routes/projects.js`, `apiGateway/auth/auth.js`) | **Estender (por acréscimo)** | O `routes/projects.js` e o `auth.checkToken` não mudam. Router novo `apiGateway/routes/videos.js`, montado com uma linha `app.use` nova antes do router existente, que só responde às rotas `/projects/:user/:project/videos/…` e passa os restantes pedidos ao router seguinte. *Middleware* novo `apiGateway/auth/videoAuth.js`: HTTP 401 sem JWT válido e 403 se o utilizador do token não for o `:user` do caminho. O router de vídeo gera o `correlationId` e envia `X-Caller-Id` e `X-Correlation-Id` aos serviços (ADD v1.1, T-00, T-10). | REQ-VID-COM-001, REQ-VID-COM-004, REQ-VID-COM-005, REQ-VID-AUTH-001 a 003, REQ-VID-UPLOAD-001 a 004, REQ-VID-NFR-002, REQ-VID-NFR-005 |
| Serviço de Projetos (`projects/routes/projects.js`, `projects/middleware/`) | **Estender (por acréscimo)** | O `routes/projects.js` não muda. Router novo `projects/routes/videos.js` e módulos novos `projects/video/*`: registo de operações (`operations/<op>.js`), matriz de formatos (`formats.js`), catálogo de filtros (`filters.json`), módulo AMQP do vídeo (`amqp.js`) e nome sugerido (`fileName.js`). Reutiliza `checkSharePermission`, `requireEditPermission` e `enforcePresenceLimit` tal como estão, mas não `requireProjectVersion`, porque as operações de vídeo não alteram o documento do projeto (ADD v1.1, T-00, T-01, T-05, T-07). | REQ-VID-COM-001 a 003, REQ-VID-COM-006, REQ-VID-UPLOAD-013, REQ-VID-FRAMES-011, REQ-VID-STORAGE-001 a 005 |
| Modelos de Dados MongoDB (`projects/models/`, `users/models/`) | **Estender (por acréscimo)** | Coleções novas `videos` (metadados técnicos, etiqueta de rotação e dimensões de apresentação, `source_video_ids` ordenados, receita `recipe` e referência à cópia de pré-visualização), `VideoTask`, `VideoBatch` e `video_project_locks` (lugar de tarefa ativa por projeto). O modelo `Process` não muda. As predefinições de cadeias de vídeo ficam numa coleção nova, `users/models/videoPreset.js`, separada do `preset.js` de imagem (ADD v1.1, T-00, T-03, T-09, 4.9). | REQ-VID-STORAGE-001, REQ-VID-STORAGE-002, REQ-VID-UPLOAD-013, REQ-VID-TASK-002, REQ-VID-NFR-002, REQ-VID-STORAGE-004, REQ-VID-INFO-008, REQ-VID-CHAIN-014, REQ-VID-TASK-007, REQ-VID-UPLOAD-016, REQ-VID-NFR-021 |
| Mensageria e Filas (RabbitMQ, `projects/utils/project_msg.js`) | **Estender (por acréscimo)** | O `projects/utils/project_msg.js` não muda e o vídeo não usa `project_queue` nem `ws_queue`. Módulo novo `projects/video/amqp.js`. Entradas novas em `rabbitMQ/definitions.json`: `video_operations_queue` (fila *quorum* com `x-delivery-limit: 1`, `x-consumer-timeout` e *dead-letter* para `video_project_queue`), `video_project_queue`, `video_ws_queue` e a exchange *fanout* `video_control` (cancelamento). As mensagens suportam tarefas compostas (passos e sub-cadeias) e lotes (`batchId` com subtarefas), com estado agregado, passo corrente e processamento sequencial que conta como 1 tarefa ativa por projeto (ADD v1.1, T-00, T-03). | REQ-VID-TASK-001, REQ-VID-TASK-002, REQ-VID-TASK-004, REQ-VID-NFR-002, REQ-VID-NFR-007, REQ-VID-NFR-011, REQ-VID-TASK-006, REQ-VID-TASK-007, REQ-VID-CHAIN-010, REQ-VID-CHAIN-012, REQ-VID-BATCH-008 a 014 |
| Workers de Processamento (`Tools/`) | **Estender (por acréscimo)** | Worker de vídeo único novo, `Tools/video/`, com um módulo por operação e um único `-filter_complex` por cadeia; recebe o plano de execução (cópia ou recodificação por stream) calculado no serviço de projetos. Brilho com `colorchannelmixer`, contraste e saturação com `eq`; filtros com `colorchannelmixer` (matrizes 3×3) ou `lutrgb` (inversão); redimensionamento com `scale`, orientação com `transpose`/`hflip`/`vflip`, junção com `concat` e normalização; gera as cópias de pré-visualização MP4. Reutiliza `Tools/utils/rabbit_mq.py` e `env.py` sem os alterar e não usa `tool_msg.py` (ADD v1.1, T-02, T-06). | REQ-VID-TRIM-008, REQ-VID-AUDIO-005, REQ-VID-SPEED-006, REQ-VID-WATERMARK-010, REQ-VID-FRAMES-009, REQ-VID-TASK-005, REQ-VID-NFR-003, REQ-VID-NFR-010, REQ-VID-ADJUST-008, REQ-VID-FILTER-006, REQ-VID-RESIZE-008, REQ-VID-ORIENT-008, REQ-VID-CONVERT-005 a 008, REQ-VID-CONCAT-008 a 010, REQ-VID-CHAIN-010 a 013, REQ-VID-UPLOAD-016, REQ-VID-NFR-013 |
| Armazenamento de Objetos (`imageStorageService`, SeaweedFS/S3) | **Estender (por acréscimo)** | O `utils/stages.js` e o `services/getPresignedUrl.js` não mudam. Módulo de vídeo novo: `utils/videoStages.js`, `services/videoUrls.js` e `route/video.js`, montado com uma linha `app.use` nova. URL pré-assinado de leitura (15 min, `ResponseContentDisposition`) e de escrita (PUT, só na rede interna). ZIP do lote gerado em segundo plano com `archiver` e `s3.upload()` (ADD v1.1, T-08, 4.10). | REQ-VID-COM-002, REQ-VID-STORAGE-001, REQ-VID-UPLOAD-005 a 007, REQ-VID-ERROR-003, REQ-VID-NFR-001, REQ-VID-DOWNLOAD-002, REQ-VID-DOWNLOAD-006, REQ-VID-DOWNLOAD-007, REQ-VID-BATCH-015, REQ-VID-UPLOAD-016, REQ-VID-UPLOAD-017, REQ-VID-NFR-016 |
| Subsistema de Partilha (`projects/middleware/shareAuth.js`) | **Manter** | Reutilizado tal como está: `checkSharePermission` (leitura) e `requireEditPermission` (edição). A imputação da quota ao executor usa o `X-Caller-Id` enviado pelo router de vídeo (ADD v1.1, T-00, T-04). | REQ-VID-AUTH-001 a 003, REQ-VID-QUOTA-006, REQ-VID-NFR-001 |
| Serviço de Utilizadores, Subscrições e Quotas (`users/`, `subscriptions/`) | **Manter** | O carregamento de vídeo continua isento de quota. Reutiliza `GET /:user/process/:n` e `POST /:user/process/refund/:n` tal como estão, com N créditos por pedido (N por cadeia, custo × vídeos elegíveis no lote). Não há passo de confirmação: a reserva é o débito e a confirmação é não devolver. O Premium não chama a reserva. Não são criados endpoints de quota novos. Em `users/` entram só ficheiros novos para as predefinições de vídeo (`models/videoPreset.js`, `routes/videoPresets.js`) (ADD v1.1, T-04, 4.9, Q-ADD-03). | REQ-VID-QUOTA-001 a 005, REQ-VID-UPLOAD-014, REQ-VID-NFR-008, REQ-VID-QUOTA-007, REQ-VID-QUOTA-008, REQ-VID-CHAIN-009, REQ-VID-CHAIN-013, REQ-VID-CHAIN-014, REQ-VID-BATCH-007, REQ-VID-BATCH-011 |
| Gateway de WebSockets (`wsGateway`) | **Estender (por acréscimo)** | O `index.js` e os eventos existentes não mudam (só se acrescenta a linha que carrega o módulo novo). Módulo novo `wsGateway/video.js`, que consome `video_ws_queue` e emite `video-task-update` e `video-batch-update` para a sala do utilizador e para `project:<id>`, com progresso numérico (0–100%) em **todas** as operações (ADD v1.1, T-00, T-03). | REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-NFR-009 |
| Interface Web Frontend (`frontend/`) | **Estender (por acréscimo)** | Componentes novos de vídeo, sem alterar os componentes de imagem: zona de arrastamento e barra de upload, leitor multimédia integrado com controlos, seletores temporais de recorte, seletores de velocidade, painel de marca de água com pré-visualização e configurador de fotogramas. Na v2.3: painéis de ajuste, filtros, redimensionamento, orientação e conversão com pré-visualização, a linha temporal de junção, o editor de cadeias (incluindo sub-cadeias por clip) com contador de créditos, a configuração de lotes com pré-validação, o painel de informações e as ações de descarregamento. | REQ-VID-UPLOAD-001, REQ-VID-UPLOAD-002, REQ-VID-UPLOAD-015, REQ-VID-TRIM-001 a 004, REQ-VID-SPEED-001 a 003, REQ-VID-WATERMARK-001 a 009, REQ-VID-FRAMES-001 a 008, REQ-VID-TASK-004, REQ-VID-NFR-009, REQ-VID-DOWNLOAD-001, REQ-VID-INFO-001 a 006, REQ-VID-ADJUST-001 a 005, REQ-VID-FILTER-001 a 004, REQ-VID-RESIZE-001 a 005, REQ-VID-ORIENT-001 a 005, REQ-VID-CONVERT-001 a 003, REQ-VID-CONCAT-001 a 004, REQ-VID-CHAIN-001 a 009, REQ-VID-BATCH-001 a 007 |
| Reverse proxy (`nginx/nginx.conf`) | **Estender (por acréscimo)** | Os `location` existentes não mudam. `location /s3-video/` novo, sem *buffering*, que deixa passar o cabeçalho `Range` e as respostas 206, e `log_format` novo que regista só o caminho, sem a *query string* (que contém a assinatura do URL) (ADD v1.1, T-08, T-10). | REQ-VID-DOWNLOAD-007, REQ-VID-DOWNLOAD-009, REQ-VID-NFR-016, REQ-VID-NFR-025 |
| Orquestração de contentores (`docker-compose.yaml`) | **Estender (por acréscimo)** | Serviço novo do worker de vídeo (`Tools/video/`) e volume novo `video_tmp` para os temporários das tarefas; os serviços e volumes existentes não mudam (ADD v1.1, T-02). | REQ-VID-NFR-010, REQ-VID-TASK-005, REQ-VID-ERROR-003 |
| Definições do broker (`rabbitMQ/definitions.json`) | **Estender (por acréscimo)** | Entradas novas para as filas `video_operations_queue`, `video_project_queue` e `video_ws_queue`, os respetivos *bindings* na exchange `picturas` e a exchange *fanout* `video_control`; as filas de imagem e o `rabbitmq.conf` não mudam (ADD v1.1, T-00, T-03). | REQ-VID-NFR-007, REQ-VID-NFR-011, REQ-VID-TASK-004, REQ-VID-TASK-005 |

---

### 4.3 Matriz de Rastreabilidade

A matriz seguinte rastreia detalhadamente cada requisito do sistema até aos elementos concretos dos casos de uso (`UC-VID-000` a `UC-VID-015`) e às decisões de qualidade tomadas pela equipa.

#### 4.3.1 Matriz de Rastreabilidade Estruturada por Caso de Uso

##### Rastreabilidade — UC-VID-000 (Carregamento e Visualização de Vídeo)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-000 Pré-condições** | JWT válido, permissão no projeto, ficheiro local disponível | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-UPLOAD-001, REQ-VID-NFR-001 |
| **UC-VID-000 Passo 1** | Abertura do projeto e apresentação da interface de upload e limites | REQ-VID-UPLOAD-001, REQ-VID-NFR-008 |
| **UC-VID-000 Passo 2** | Seleção do ficheiro local e validação cliente de extensão/MIME | REQ-VID-UPLOAD-001, REQ-VID-UPLOAD-003 |
| **UC-VID-000 Passo 3** | Confirmação e streaming de envio com progresso percentual | REQ-VID-UPLOAD-005 |
| **UC-VID-000 Passo 4** | Receção, validação de tamanho e gravação no storage SeaweedFS/S3 com UUID | REQ-VID-UPLOAD-004, REQ-VID-UPLOAD-007, REQ-VID-NFR-008 |
| **UC-VID-000 Passo 5** | Inspeção FFprobe, validação de codecs, teto de duração e metadados técnicos (incluindo rotação e dimensões de apresentação) | REQ-VID-UPLOAD-008, REQ-VID-UPLOAD-009, REQ-VID-UPLOAD-010, REQ-VID-UPLOAD-011, REQ-VID-UPLOAD-013, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| **UC-VID-000 Passo 6** | Geração automática de miniatura JPEG (fotograma 0 se < 1 s), guarda do fotograma 0 para pré-visualizações e registo no MongoDB sem debitar quota | REQ-VID-UPLOAD-013, REQ-VID-UPLOAD-014, REQ-VID-STORAGE-001 |
| **UC-VID-000 Passo 7** | Conclusão do carregamento e exibição do vídeo na galeria do projeto | REQ-VID-UPLOAD-014, REQ-VID-STORAGE-001 |
| **UC-VID-000 Passo 8** | Abertura do reprodutor integrado com controlos e ferramentas de manipulação | REQ-VID-UPLOAD-015, REQ-VID-COM-001 |
| **UC-VID-000 FA1** | Carregamento por arrastamento (*drag-and-drop*) | REQ-VID-UPLOAD-002, REQ-VID-UPLOAD-003 |
| **UC-VID-000 FA2** | Cancelamento durante a transferência com limpeza de temporários | REQ-VID-UPLOAD-006, REQ-VID-ERROR-003 |
| **UC-VID-000 FA3** | Utilizador com perfil Premium (limites alargados 2 GB / 60 min) | REQ-VID-UPLOAD-004, REQ-VID-UPLOAD-011, REQ-VID-NFR-008 |
| **UC-VID-000 FA4** | Carregamento de vídeo sem stream de áudio (silencioso de origem) | REQ-VID-UPLOAD-010 |
| **UC-VID-000 Exceção 1** | Formato ou extensão não MP4, MOV nem AVI | REQ-VID-UPLOAD-003, REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-000 Exceção 2** | Tamanho do ficheiro superior ao limite do perfil | REQ-VID-UPLOAD-004, REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-000 Exceção 3** | Codecs internos não correspondentes a H.264/AAC | REQ-VID-UPLOAD-009, REQ-VID-UPLOAD-010, REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-000 Exceção 4** | Duração do vídeo superior ao limite do perfil | REQ-VID-UPLOAD-011, REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-000 Exceção 5** | Ficheiro corrompido ou cabeçalhos ilegíveis | REQ-VID-UPLOAD-012, REQ-VID-ERROR-001, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **UC-VID-000 Exceção 6** | Falha de rede ou interrupção durante a transferência | REQ-VID-UPLOAD-006, REQ-VID-ERROR-001, REQ-VID-ERROR-003 |
| **UC-VID-000 Garantia Sucesso** | Ficheiro gravado, metadados e miniatura no MongoDB, visível no leitor, sem débito de quota | REQ-VID-UPLOAD-007, REQ-VID-UPLOAD-013, REQ-VID-UPLOAD-014, REQ-VID-UPLOAD-015, REQ-VID-STORAGE-001 |
| **UC-VID-000 Garantia Mínima** | Sem artefactos residuais no storage, sem registos órfãos no MongoDB, projeto inalterado | REQ-VID-UPLOAD-006, REQ-VID-UPLOAD-012, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **UC-VID-000 RN1 a RN7** | Regras de autenticação, isenção de quota, formatos MP4/MOV/AVI, limites, miniatura e reprodutor | REQ-VID-AUTH-001 a 002, REQ-VID-UPLOAD-003 a 015, REQ-VID-STORAGE-001 a 005, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| **UC-VID-000 FA5** | Carregamento de vídeo em MOV ou AVI (ou MP4 com perfil H.264 incompatível com o navegador) com cópia de pré-visualização MP4 | REQ-VID-UPLOAD-003, REQ-VID-UPLOAD-009, REQ-VID-UPLOAD-010, REQ-VID-UPLOAD-016, REQ-VID-UPLOAD-017, REQ-VID-NFR-003 |
| **UC-VID-000 RN8** | Cópia de pré-visualização (MOV, AVI e MP4 incompatíveis) exclusiva do reprodutor; operações e descarregamento usam o original | REQ-VID-UPLOAD-016, REQ-VID-UPLOAD-017, REQ-VID-DOWNLOAD-006 |

---

##### Rastreabilidade — UC-VID-001 (Recorte Temporal de Vídeo)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-001 Pré-condições** | JWT válido, permissão no projeto, vídeo elegível (MP4/MOV/AVI), sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008, REQ-VID-NFR-021 |
| **UC-VID-001 Passo 1** | Seleção do vídeo e apresentação das operações disponíveis | REQ-VID-COM-001 |
| **UC-VID-001 Passo 2** | Apresentação dos controlos de intervalo temporal | REQ-VID-TRIM-001, REQ-VID-TRIM-002 |
| **UC-VID-001 Passo 3** | Definição do intervalo, sincronização com reprodução e duração estimada | REQ-VID-TRIM-001, REQ-VID-TRIM-002, REQ-VID-TRIM-003, REQ-VID-TRIM-004, REQ-VID-COM-004 |
| **UC-VID-001 Passo 4** | Confirmação da operação, validação e reserva de quota | REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-001 Passo 5** | Notificação de estados de tarefa `queued` e `processing` | REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-NFR-006 |
| **UC-VID-001 Passo 6** | Processamento assíncrono do recorte e reserva da quota tornada definitiva | REQ-VID-TRIM-008, REQ-VID-TRIM-009, REQ-VID-QUOTA-003, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-NFR-003 |
| **UC-VID-001 Passo 7** | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **UC-VID-001 FA1** | Ajuste do intervalo e pré-visualização em ciclo (*loop preview*) | REQ-VID-TRIM-001, REQ-VID-TRIM-002, REQ-VID-TRIM-004, REQ-VID-TRIM-007 |
| **UC-VID-001 FA2** | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-001 FA3** | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-001 FA4** | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-NFR-008 |
| **UC-VID-001 Exceção 1** | Instante inicial maior ou igual ao instante final | REQ-VID-COM-005, REQ-VID-TRIM-005, REQ-VID-ERROR-001 |
| **UC-VID-001 Exceção 2** | Instantes definidos fora da duração total do vídeo | REQ-VID-COM-005, REQ-VID-TRIM-006, REQ-VID-ERROR-001 |
| **UC-VID-001 Exceção 3** | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-001 Exceção 4** | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-001 Exceção 5** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **UC-VID-001 Exceção 6** | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-QUOTA-004, REQ-VID-COM-002, REQ-VID-NFR-007 |
| **UC-VID-001 Garantia Sucesso** | Novo vídeo MP4 no projeto com intervalo válido, original preservado, 1 quota debitada | REQ-VID-TRIM-008, REQ-VID-TRIM-009, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-NFR-003 |
| **UC-VID-001 Garantia Mínima** | Original inalterado, sem resultados parciais gravados, quota devolvida | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **UC-VID-001 RN1 a RN9** | Regras de perfis, formatos de entrada MP4/MOV/AVI e saída MP4, assincronismo, limites e quotas de trim | REQ-VID-AUTH-002, REQ-VID-TRIM-001 a 010, REQ-VID-QUOTA-001 a 005, REQ-VID-TASK-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |

---

##### Rastreabilidade — UC-VID-002 (Remoção de Áudio)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-002 Pré-condições** | JWT válido, permissão no projeto, vídeo com áudio elegível, sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-AUDIO-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-008, REQ-VID-NFR-021 |
| **UC-VID-002 Passo 1** | Seleção do vídeo e verificação de presença de áudio | REQ-VID-COM-001, REQ-VID-AUDIO-001 |
| **UC-VID-002 Passo 2** | Confirmação explícita da operação, validação e reserva de quota | REQ-VID-COM-004, REQ-VID-AUDIO-004, REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-002 Passo 3** | Notificação de estados de tarefa `queued` e `processing` | REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-NFR-006 |
| **UC-VID-002 Passo 4** | Supressão de streams de áudio e preservação de stream visual por stream copy | REQ-VID-AUDIO-005, REQ-VID-AUDIO-006, REQ-VID-NFR-003 |
| **UC-VID-002 Passo 5** | Associação do resultado ao projeto e reserva da quota tornada definitiva | REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-STORAGE-002 |
| **UC-VID-002 Passo 6** | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **UC-VID-002 FA1** | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-002 FA2** | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-002 FA3** | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-NFR-008 |
| **UC-VID-002 Exceção 1** | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-002 Exceção 2** | Vídeo sem streams de áudio a remover | REQ-VID-AUDIO-002, REQ-VID-AUDIO-003, REQ-VID-ERROR-001 |
| **UC-VID-002 Exceção 3** | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-002 Exceção 4** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **UC-VID-002 Exceção 5** | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-QUOTA-004, REQ-VID-COM-002, REQ-VID-NFR-007 |
| **UC-VID-002 Garantia Sucesso** | Novo vídeo silencioso associado ao projeto, visual intacto, 1 quota debitada | REQ-VID-AUDIO-005, REQ-VID-AUDIO-006, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-NFR-003 |
| **UC-VID-002 Garantia Mínima** | Original inalterado, sem resultados parciais gravados, quota devolvida | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **UC-VID-002 RN1 a RN9** | Regras de áudio obrigatório, stream copy, assincronismo e quotas | REQ-VID-AUTH-002, REQ-VID-AUDIO-001 a 006, REQ-VID-QUOTA-001 a 005, REQ-VID-NFR-003, REQ-VID-NFR-008 |

---

##### Rastreabilidade — UC-VID-003 (Alteração da Velocidade de Reprodução)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-003 Pré-condições** | JWT válido, permissão no projeto, vídeo elegível (MP4/MOV/AVI), sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008, REQ-VID-NFR-021 |
| **UC-VID-003 Passo 1** | Apresentação do vídeo, predefinições de velocidade e campo numérico | REQ-VID-COM-001, REQ-VID-SPEED-001, REQ-VID-SPEED-002 |
| **UC-VID-003 Passo 2** | Indicação do fator e cálculo instantâneo da duração estimada | REQ-VID-SPEED-001, REQ-VID-SPEED-002, REQ-VID-SPEED-003, REQ-VID-COM-004 |
| **UC-VID-003 Passo 3** | Confirmação da operação, validação e reserva de quota | REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-003 Passo 4** | Notificação de estados de tarefa `queued` e `processing` | REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-NFR-006 |
| **UC-VID-003 Passo 5** | Processamento assíncrono com ajuste de vídeo e áudio sincronizado | REQ-VID-SPEED-006, REQ-VID-SPEED-007, REQ-VID-SPEED-008, REQ-VID-NFR-003 |
| **UC-VID-003 Passo 6** | Associação do resultado ao projeto e reserva da quota tornada definitiva | REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-STORAGE-002 |
| **UC-VID-003 Passo 7** | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **UC-VID-003 FA1** | Seleção via botão de velocidade rápida e recálculo de duração | REQ-VID-SPEED-001, REQ-VID-SPEED-003 |
| **UC-VID-003 FA2** | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-003 FA3** | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-003 FA4** | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-NFR-008 |
| **UC-VID-003 Exceção 1** | Fator nulo, negativo ou igual a zero | REQ-VID-COM-005, REQ-VID-SPEED-004, REQ-VID-ERROR-001 |
| **UC-VID-003 Exceção 2** | Fator fora do intervalo homologado (0.25× a 4.0×) | REQ-VID-COM-005, REQ-VID-SPEED-005, REQ-VID-ERROR-001 |
| **UC-VID-003 Exceção 3** | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-003 Exceção 4** | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-003 Exceção 5** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **UC-VID-003 Exceção 6** | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-QUOTA-004, REQ-VID-COM-002, REQ-VID-NFR-007 |
| **UC-VID-003 Garantia Sucesso** | Novo vídeo com velocidade ajustada, original preservado, 1 quota debitada | REQ-VID-SPEED-006, REQ-VID-SPEED-007, REQ-VID-SPEED-008, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-NFR-003 |
| **UC-VID-003 Garantia Mínima** | Original inalterado, sem resultados parciais gravados, quota devolvida | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **UC-VID-003 RN1 a RN9** | Regras de fator positivo, limites 0.25–4×, pitch de áudio e quotas | REQ-VID-AUTH-002, REQ-VID-SPEED-001 a 008, REQ-VID-QUOTA-001 a 005, REQ-VID-TASK-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |

---

##### Rastreabilidade — UC-VID-004 (Marca de Água em Vídeo)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-004 Pré-condições** | JWT válido, permissão no projeto, vídeo elegível, elemento de marca acessível | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| **UC-VID-004 Passo 1** | Seleção do vídeo e abertura da interface de configuração | REQ-VID-COM-001 |
| **UC-VID-004 Passo 2** | Seleção da modalidade de marca (texto ou imagem) | REQ-VID-WATERMARK-001 |
| **UC-VID-004 Passo 3** | Entrada e validação do conteúdo da marca (texto ou ficheiro de imagem) e ajuste de posição, escala e opacidade com pré-visualização estática | REQ-VID-WATERMARK-002, REQ-VID-WATERMARK-003, REQ-VID-WATERMARK-004, REQ-VID-WATERMARK-005, REQ-VID-WATERMARK-006, REQ-VID-WATERMARK-007, REQ-VID-WATERMARK-008, REQ-VID-WATERMARK-009, REQ-VID-COM-004 |
| **UC-VID-004 Passo 4** | Confirmação da operação, validação geométrica e verificação de quota | REQ-VID-COM-004, REQ-VID-WATERMARK-008, REQ-VID-QUOTA-001, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-004 Passo 5** | Reserva de quota e notificação do estado `queued` | REQ-VID-QUOTA-002, REQ-VID-TASK-002, REQ-VID-TASK-003 |
| **UC-VID-004 Passo 6** | Processamento com marca fixa e emissão de progresso WebSocket contínuo | REQ-VID-WATERMARK-010, REQ-VID-TASK-002, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| **UC-VID-004 Passo 7** | Recomposição em MP4 com remuxing do áudio original | REQ-VID-WATERMARK-011, REQ-VID-NFR-003 |
| **UC-VID-004 Passo 8** | Associação ao projeto e reserva da quota tornada definitiva | REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-STORAGE-002 |
| **UC-VID-004 Passo 9** | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **UC-VID-004 FA1** | Utilização de ficheiro de imagem como marca de água | REQ-VID-WATERMARK-001, REQ-VID-WATERMARK-003, REQ-VID-WATERMARK-007 |
| **UC-VID-004 FA2** | Alteração interativa de parâmetros após pré-visualização estática | REQ-VID-WATERMARK-004, REQ-VID-WATERMARK-005, REQ-VID-WATERMARK-006, REQ-VID-WATERMARK-009 |
| **UC-VID-004 FA3** | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-004 FA4** | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-004 FA5** | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-NFR-008 |
| **UC-VID-004 Exceção 1** | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-004 Exceção 2** | Conteúdo vazio ou ficheiro de imagem da marca inválido | REQ-VID-COM-005, REQ-VID-WATERMARK-007, REQ-VID-ERROR-001 |
| **UC-VID-004 Exceção 3** | Posição ou dimensão ultrapassa área visível do quadro | REQ-VID-COM-005, REQ-VID-WATERMARK-008, REQ-VID-ERROR-001 |
| **UC-VID-004 Exceção 4** | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-004 Exceção 5** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **UC-VID-004 Exceção 6** | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-QUOTA-004, REQ-VID-COM-002, REQ-VID-NFR-007 |
| **UC-VID-004 Garantia Sucesso** | Novo vídeo com marca aplicada uniformemente, áudio remuxado, 1 quota debitada | REQ-VID-WATERMARK-010, REQ-VID-WATERMARK-011, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-NFR-003 |
| **UC-VID-004 Garantia Mínima** | Original inalterado, sem resultados parciais gravados, quota devolvida | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **UC-VID-004 RN1 a RN9** | Regras de posição fixa, geometria visível, remuxing e progresso contínuo | REQ-VID-AUTH-002, REQ-VID-WATERMARK-001 a 011, REQ-VID-QUOTA-001 a 005, REQ-VID-NFR-003, REQ-VID-NFR-008, REQ-VID-NFR-009 |

---

##### Rastreabilidade — UC-VID-005 (Extração de Fotogramas para o Projeto)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-005 Pré-condições** | JWT válido, permissão no projeto, vídeo elegível, sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008, REQ-VID-NFR-021 |
| **UC-VID-005 Passo 1** | Abertura do projeto, visualização do saldo de quota e limites | REQ-VID-COM-001, REQ-VID-QUOTA-001 |
| **UC-VID-005 Passo 2** | Apresentação do configurador com valores padrão | REQ-VID-FRAMES-001, REQ-VID-FRAMES-002, REQ-VID-FRAMES-003 |
| **UC-VID-005 Passo 3** | Parametrização de $[início, fim[$, passo N, formato e estimativa em tempo real | REQ-VID-FRAMES-001, REQ-VID-FRAMES-002, REQ-VID-FRAMES-003, REQ-VID-FRAMES-004, REQ-VID-COM-004 |
| **UC-VID-005 Passo 4** | Confirmação da operação, validação e reserva de quota | REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-005 Passo 5** | Notificação de estados de tarefa e emissão de progresso WebSocket | REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| **UC-VID-005 Passo 6** | Extração do fotograma disponível mais próximo para cada timestamp | REQ-VID-FRAMES-009, REQ-VID-FRAMES-010 |
| **UC-VID-005 Passo 7** | Inclusão atómica de imagens com metadados de timestamp e reserva da quota tornada definitiva | REQ-VID-FRAMES-010, REQ-VID-FRAMES-011, REQ-VID-FRAMES-012, REQ-VID-QUOTA-003, REQ-VID-NFR-004 |
| **UC-VID-005 Passo 8** | Disponibilização das imagens na galeria e preservação do original | REQ-VID-COM-002, REQ-VID-STORAGE-003 |
| **UC-VID-005 FA1** | Pré-visualização de amostra estática (3 frames) sem quota | REQ-VID-FRAMES-008 |
| **UC-VID-005 FA2** | Cancelamento durante o processamento com purga atómica de temporários | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-FRAMES-013, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-005 FA3** | Utilizador abandona a sessão com continuidade assíncrona | REQ-VID-TASK-001, REQ-VID-TASK-002, REQ-VID-NFR-006 |
| **UC-VID-005 FA4** | Execução por utilizador com perfil Premium (teto alargado 500 frames) | REQ-VID-QUOTA-005, REQ-VID-NFR-008 |
| **UC-VID-005 FA5** | Aceitação de ajuste automático sugerido para o passo N | REQ-VID-FRAMES-004, REQ-VID-FRAMES-007 |
| **UC-VID-005 Exceção 1** | Parâmetros inválidos ($início \ge fim$, $fim > duração$, $N < 1$s) | REQ-VID-COM-005, REQ-VID-FRAMES-005, REQ-VID-ERROR-001 |
| **UC-VID-005 Exceção 2** | Contagem estimada de fotogramas excede o teto do perfil | REQ-VID-COM-005, REQ-VID-FRAMES-006, REQ-VID-FRAMES-007, REQ-VID-ERROR-001 |
| **UC-VID-005 Exceção 3** | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-005 Exceção 4** | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-005 Exceção 5** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **UC-VID-005 Exceção 6** | Ficheiro corrompido ou erro de descodificação | REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-QUOTA-004 |
| **UC-VID-005 Exceção 7** | Falha de execução a meio do processamento | REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-FRAMES-013, REQ-VID-QUOTA-004, REQ-VID-NFR-007 |
| **UC-VID-005 Exceção 8** | Armazenamento de projeto insuficiente para os fotogramas estimados | REQ-VID-ERROR-001, REQ-VID-QUOTA-004 |
| **UC-VID-005 Garantia Sucesso** | Inclusão de todos os fotogramas pedidos, resolução original preservada, 1 quota debitada | REQ-VID-FRAMES-010, REQ-VID-FRAMES-011, REQ-VID-FRAMES-012, REQ-VID-COM-002, REQ-VID-QUOTA-003, REQ-VID-NFR-004 |
| **UC-VID-005 Garantia Mínima** | Projeto intacto, zero fotogramas parciais adicionados, quota devolvida | REQ-VID-FRAMES-013, REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **UC-VID-005 RN1 a RN11** | Regras de semiaberto $[início, fim[$, tetos 50/500, atomicidade tudo-ou-nada e integração | REQ-VID-AUTH-002, REQ-VID-FRAMES-001 a 013, REQ-VID-QUOTA-001 a 005, REQ-VID-NFR-004, REQ-VID-NFR-008 |

---

##### Rastreabilidade — UC-VID-006 (Descarregamento de Vídeo)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-006 Pré-condições** | JWT válido, permissão de leitura ou superior, recurso de vídeo concluído | REQ-VID-AUTH-001, REQ-VID-DOWNLOAD-001, REQ-VID-DOWNLOAD-003, REQ-VID-NFR-001 |
| **UC-VID-006 Passo 1** | Seleção do vídeo, verificação de permissão e estado, nome, formato e tamanho | REQ-VID-DOWNLOAD-001, REQ-VID-DOWNLOAD-003, REQ-VID-DOWNLOAD-005 |
| **UC-VID-006 Passo 2** | Geração de URL assinado temporário portador (15 min) sem débito de quota | REQ-VID-DOWNLOAD-002, REQ-VID-DOWNLOAD-004, REQ-VID-QUOTA-008, REQ-VID-NFR-001 |
| **UC-VID-006 Passo 3** | Transferência direta do storage com nome de ficheiro sugerido | REQ-VID-DOWNLOAD-005, REQ-VID-DOWNLOAD-006, REQ-VID-NFR-016 |
| **UC-VID-006 Passo 4** | Registo do descarregamento com `correlationId` | REQ-VID-DOWNLOAD-009, REQ-VID-NFR-002 |
| **UC-VID-006 FA1** | Descarregamento a partir do reprodutor integrado | REQ-VID-DOWNLOAD-001, REQ-VID-UPLOAD-015 |
| **UC-VID-006 FA2** | Retoma de transferência interrompida (HTTP `Range`) | REQ-VID-DOWNLOAD-007, REQ-VID-NFR-016 |
| **UC-VID-006 FA3** | Regeneração de URL expirado | REQ-VID-DOWNLOAD-008 |
| **UC-VID-006 FA4** | Descarregamento do original no formato carregado (não a pré-visualização) | REQ-VID-DOWNLOAD-006, REQ-VID-UPLOAD-017 |
| **UC-VID-006 Exceção 1** | Recurso ainda não concluído | REQ-VID-DOWNLOAD-003, REQ-VID-ERROR-001 |
| **UC-VID-006 Exceção 2** | Utilizador sem permissão sobre o projeto | REQ-VID-AUTH-001, REQ-VID-DOWNLOAD-001, REQ-VID-ERROR-001 |
| **UC-VID-006 Exceção 3** | URL usado após expirar | REQ-VID-DOWNLOAD-002, REQ-VID-NFR-001 |
| **UC-VID-006 Exceção 4** | Objeto inexistente no armazenamento | REQ-VID-DOWNLOAD-009, REQ-VID-ERROR-001, REQ-VID-ERROR-002 |
| **UC-VID-006 Garantia Sucesso** | Cópia no dispositivo no formato armazenado, recurso inalterado, sem quota | REQ-VID-DOWNLOAD-004, REQ-VID-DOWNLOAD-006 |
| **UC-VID-006 Garantia Mínima** | Nenhum URL exposto a não autorizados, recurso e quota inalterados | REQ-VID-DOWNLOAD-002, REQ-VID-DOWNLOAD-004, REQ-VID-NFR-001 |
| **UC-VID-006 RN1 a RN7** | Regras de perfis e permissões, isenção de quota, estado, URL assinado, nome e formato | REQ-VID-AUTH-002, REQ-VID-DOWNLOAD-001 a 009, REQ-VID-QUOTA-008, REQ-VID-NFR-001, REQ-VID-NFR-016 |

---

##### Rastreabilidade — UC-VID-007 (Consulta de Informações do Vídeo)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-007 Pré-condições** | JWT válido, permissão de leitura ou superior, recurso de vídeo existente | REQ-VID-AUTH-001, REQ-VID-INFO-001 |
| **UC-VID-007 Passo 1** | Abertura do painel a partir dos metadados persistidos, sem tarefa nem quota | REQ-VID-INFO-001, REQ-VID-INFO-007, REQ-VID-QUOTA-008 |
| **UC-VID-007 Passo 2** | Apresentação de duração, resolução de apresentação, formato, tamanho (1024² / 1024³ bytes) e taxa de fotogramas | REQ-VID-INFO-002, REQ-VID-INFO-003, REQ-VID-INFO-004, REQ-VID-INFO-005, REQ-VID-INFO-006, REQ-VID-UPLOAD-013, REQ-VID-STORAGE-001 |
| **UC-VID-007 Passo 3** | Fecho do painel sem alterações | REQ-VID-INFO-007 |
| **UC-VID-007 FA1** | Proveniência e operações aplicadas em vídeos resultantes (origem removida como "Vídeo removido") | REQ-VID-INFO-008, REQ-VID-STORAGE-002, REQ-VID-STORAGE-004 |
| **UC-VID-007 FA2** | Formato original de MOV/AVI (não a pré-visualização) | REQ-VID-INFO-004, REQ-VID-UPLOAD-017 |
| **UC-VID-007 FA3** | Consulta a partir do reprodutor integrado | REQ-VID-INFO-001, REQ-VID-UPLOAD-015 |
| **UC-VID-007 Exceção 1** | Metadado indisponível | REQ-VID-INFO-009, REQ-VID-ERROR-002 |
| **UC-VID-007 Exceção 2** | Utilizador sem permissão sobre o projeto | REQ-VID-AUTH-001, REQ-VID-ERROR-001 |
| **UC-VID-007 Exceção 3** | Recurso ainda em processamento | REQ-VID-TASK-002, REQ-VID-COM-002 |
| **UC-VID-007 Garantia Sucesso** | Informações apresentadas, sem tarefa nem quota | REQ-VID-INFO-001 a 007 |
| **UC-VID-007 Garantia Mínima** | Projeto, recurso e quota inalterados | REQ-VID-INFO-007 |
| **UC-VID-007 RN1 a RN5** | Regras de permissões, isenção de quota, fonte dos metadados e unidades | REQ-VID-AUTH-002, REQ-VID-INFO-001 a 009, REQ-VID-QUOTA-008 |

---

##### Rastreabilidade — UC-VID-008 (Ajuste de Propriedades Visuais)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-008 Pré-condições** | JWT válido, permissão no projeto, vídeo elegível (MP4/MOV/AVI), sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008, REQ-VID-NFR-021 |
| **UC-VID-008 Passo 1** | Apresentação dos controlos de brilho, contraste e saturação no neutro 1.0 | REQ-VID-COM-001, REQ-VID-ADJUST-001, REQ-VID-ADJUST-002, REQ-VID-ADJUST-003, REQ-VID-ADJUST-004 |
| **UC-VID-008 Passo 2** | Ajuste dos fatores e pré-visualização estática do primeiro fotograma | REQ-VID-ADJUST-001, REQ-VID-ADJUST-002, REQ-VID-ADJUST-003, REQ-VID-ADJUST-005, REQ-VID-NFR-015 |
| **UC-VID-008 Passo 3** | Confirmação da operação, validação e verificação de quota | REQ-VID-ADJUST-006, REQ-VID-ADJUST-007, REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-008 Passo 4** | Reserva de quota e notificação do estado `queued` | REQ-VID-QUOTA-002, REQ-VID-TASK-002, REQ-VID-TASK-003 |
| **UC-VID-008 Passo 5** | Aplicação uniforme dos ajustes a todos os fotogramas com progresso | REQ-VID-ADJUST-008, REQ-VID-TASK-002, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| **UC-VID-008 Passo 6** | Geração do MP4 com duração, resolução, fps e áudio preservados | REQ-VID-ADJUST-009, REQ-VID-NFR-003, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-QUOTA-003 |
| **UC-VID-008 Passo 7** | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **UC-VID-008 FA1** | Reposição dos valores neutros | REQ-VID-ADJUST-004 |
| **UC-VID-008 FA2** | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-008 FA3** | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-008 FA4** | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-NFR-008 |
| **UC-VID-008 FA5** | Utilização como passo de cadeia ou em lote | REQ-VID-COM-006, REQ-VID-CHAIN-002, REQ-VID-BATCH-002 |
| **UC-VID-008 Exceção 1** | Fator de ajuste fora do intervalo [0.0, 2.0] | REQ-VID-COM-005, REQ-VID-ADJUST-006, REQ-VID-ERROR-001 |
| **UC-VID-008 Exceção 2** | Todos os fatores no neutro (sem alterações) | REQ-VID-ADJUST-007, REQ-VID-ERROR-001 |
| **UC-VID-008 Exceção 3** | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-008 Exceção 4** | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-008 Exceção 5** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **UC-VID-008 Exceção 6** | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-ERROR-003, REQ-VID-QUOTA-004, REQ-VID-COM-002, REQ-VID-NFR-007 |
| **UC-VID-008 Garantia Sucesso** | Novo vídeo MP4 com ajustes uniformes, original preservado, 1 quota debitada | REQ-VID-ADJUST-008, REQ-VID-ADJUST-009, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-003 |
| **UC-VID-008 Garantia Mínima** | Original inalterado, sem resultados parciais gravados, quota devolvida | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **UC-VID-008 RN1 a RN11** | Regras de perfis, intervalo e neutro dos fatores, uniformidade, formato de saída e quotas | REQ-VID-AUTH-002, REQ-VID-ADJUST-001 a 010, REQ-VID-QUOTA-001 a 005, REQ-VID-TASK-001, REQ-VID-COM-006, REQ-VID-NFR-003, REQ-VID-NFR-008 |

---

##### Rastreabilidade — UC-VID-009 (Filtros Visuais Predefinidos)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-009 Pré-condições** | JWT válido, permissão no projeto, vídeo elegível (MP4/MOV/AVI), sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008, REQ-VID-NFR-021 |
| **UC-VID-009 Passo 1** | Apresentação do catálogo de filtros com miniaturas de exemplo | REQ-VID-COM-001, REQ-VID-FILTER-001, REQ-VID-FILTER-002 |
| **UC-VID-009 Passo 2** | Seleção de um filtro e pré-visualização estática | REQ-VID-FILTER-003, REQ-VID-FILTER-004, REQ-VID-NFR-015 |
| **UC-VID-009 Passo 3** | Confirmação da operação, validação e verificação de quota | REQ-VID-FILTER-005, REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-009 Passo 4** | Reserva de quota e notificação do estado `queued` | REQ-VID-QUOTA-002, REQ-VID-TASK-002, REQ-VID-TASK-003 |
| **UC-VID-009 Passo 5** | Aplicação uniforme do filtro a todos os fotogramas com progresso | REQ-VID-FILTER-006, REQ-VID-TASK-002, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| **UC-VID-009 Passo 6** | Geração do MP4 com duração, resolução, fps e áudio preservados | REQ-VID-FILTER-007, REQ-VID-NFR-003, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-QUOTA-003 |
| **UC-VID-009 Passo 7** | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **UC-VID-009 FA1** | Troca de filtro após pré-visualização | REQ-VID-FILTER-003, REQ-VID-FILTER-004 |
| **UC-VID-009 FA2** | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-009 FA3** | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-009 FA4** | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-NFR-008 |
| **UC-VID-009 FA5** | Utilização como passo de cadeia ou em lote | REQ-VID-COM-006, REQ-VID-CHAIN-002, REQ-VID-BATCH-002 |
| **UC-VID-009 Exceção 1** | Nenhum filtro selecionado ou filtro inexistente | REQ-VID-COM-005, REQ-VID-FILTER-005, REQ-VID-ERROR-001 |
| **UC-VID-009 Exceção 2** | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-009 Exceção 3** | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-009 Exceção 4** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **UC-VID-009 Exceção 5** | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-ERROR-003, REQ-VID-QUOTA-004, REQ-VID-COM-002, REQ-VID-NFR-007 |
| **UC-VID-009 Garantia Sucesso** | Novo vídeo MP4 com o filtro aplicado, original preservado, 1 quota debitada | REQ-VID-FILTER-006, REQ-VID-FILTER-007, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-003 |
| **UC-VID-009 Garantia Mínima** | Original inalterado, sem resultados parciais gravados, quota devolvida | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **UC-VID-009 RN1 a RN11** | Regras de perfis, catálogo fechado, um filtro por operação, uniformidade e quotas | REQ-VID-AUTH-002, REQ-VID-FILTER-001 a 007, REQ-VID-QUOTA-001 a 005, REQ-VID-TASK-001, REQ-VID-COM-006, REQ-VID-NFR-003, REQ-VID-NFR-008 |

---

##### Rastreabilidade — UC-VID-010 (Redimensionamento de Vídeo)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-010 Pré-condições** | JWT válido, permissão no projeto, vídeo elegível (MP4/MOV/AVI), sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008, REQ-VID-NFR-021 |
| **UC-VID-010 Passo 1** | Apresentação da resolução atual (dimensões de apresentação), bloqueio de proporção e predefinições | REQ-VID-COM-001, REQ-VID-RESIZE-001, REQ-VID-RESIZE-002, REQ-VID-RESIZE-003 |
| **UC-VID-010 Passo 2** | Escolha das dimensões com recálculo proporcional e arredondamento par | REQ-VID-RESIZE-001, REQ-VID-RESIZE-002, REQ-VID-RESIZE-003 |
| **UC-VID-010 Passo 3** | Confirmação da operação, validação e verificação de quota | REQ-VID-RESIZE-006, REQ-VID-RESIZE-007, REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-010 Passo 4** | Reserva de quota e notificação do estado `queued` | REQ-VID-QUOTA-002, REQ-VID-TASK-002, REQ-VID-TASK-003 |
| **UC-VID-010 Passo 5** | Reamostragem de todos os fotogramas com progresso | REQ-VID-RESIZE-008, REQ-VID-TASK-002, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| **UC-VID-010 Passo 6** | Geração do MP4 com as dimensões exatas e duração, fps e áudio preservados | REQ-VID-RESIZE-008, REQ-VID-RESIZE-009, REQ-VID-NFR-003, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-QUOTA-003 |
| **UC-VID-010 Passo 7** | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **UC-VID-010 FA1** | Desbloqueio da proporção com aviso de distorção | REQ-VID-RESIZE-004 |
| **UC-VID-010 FA2** | Ampliação acima da resolução original com aviso | REQ-VID-RESIZE-005 |
| **UC-VID-010 FA3** | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-010 FA4** | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-010 FA5** | Execução por utilizador Premium (teto 3840×2160) | REQ-VID-QUOTA-005, REQ-VID-RESIZE-006, REQ-VID-NFR-008 |
| **UC-VID-010 FA6** | Utilização como passo de cadeia ou em lote | REQ-VID-COM-006, REQ-VID-CHAIN-002, REQ-VID-BATCH-002 |
| **UC-VID-010 Exceção 1** | Dimensões ímpares, inferiores a 128 px ou acima do teto do perfil | REQ-VID-COM-005, REQ-VID-RESIZE-006, REQ-VID-ERROR-001 |
| **UC-VID-010 Exceção 2** | Dimensões iguais às de apresentação do original | REQ-VID-RESIZE-007, REQ-VID-ERROR-001 |
| **UC-VID-010 Exceção 3** | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-010 Exceção 4** | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-010 Exceção 5** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **UC-VID-010 Exceção 6** | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-ERROR-003, REQ-VID-QUOTA-004, REQ-VID-COM-002, REQ-VID-NFR-007 |
| **UC-VID-010 Garantia Sucesso** | Novo vídeo MP4 com as dimensões confirmadas, original preservado, 1 quota debitada | REQ-VID-RESIZE-008, REQ-VID-RESIZE-009, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-003 |
| **UC-VID-010 Garantia Mínima** | Original inalterado, sem resultados parciais gravados, quota devolvida | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **UC-VID-010 RN1 a RN12** | Regras de perfis, dimensões pares e tetos, proporção, ampliação, formato de saída e quotas | REQ-VID-AUTH-002, REQ-VID-RESIZE-001 a 009, REQ-VID-QUOTA-001 a 005, REQ-VID-TASK-001, REQ-VID-COM-006, REQ-VID-NFR-003, REQ-VID-NFR-008 |

---

##### Rastreabilidade — UC-VID-011 (Rotação e Espelho de Vídeo)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-011 Pré-condições** | JWT válido, permissão no projeto, vídeo elegível (MP4/MOV/AVI), sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008, REQ-VID-NFR-021 |
| **UC-VID-011 Passo 1** | Apresentação das rotações (90°/180°/270°) e espelhos | REQ-VID-COM-001, REQ-VID-ORIENT-001, REQ-VID-ORIENT-002, REQ-VID-ORIENT-003 |
| **UC-VID-011 Passo 2** | Escolha da transformação combinada e pré-visualização com dimensões resultantes | REQ-VID-ORIENT-001, REQ-VID-ORIENT-002, REQ-VID-ORIENT-003, REQ-VID-ORIENT-004, REQ-VID-ORIENT-005, REQ-VID-NFR-015 |
| **UC-VID-011 Passo 3** | Confirmação da operação, validação e verificação de quota | REQ-VID-ORIENT-006, REQ-VID-ORIENT-007, REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-011 Passo 4** | Reserva de quota e notificação do estado `queued` | REQ-VID-QUOTA-002, REQ-VID-TASK-002, REQ-VID-TASK-003 |
| **UC-VID-011 Passo 5** | Aplicação da transformação a todos os fotogramas com progresso | REQ-VID-ORIENT-004, REQ-VID-TASK-002, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| **UC-VID-011 Passo 6** | Geração do MP4 com dimensões trocadas a 90°/270° e duração, fps e áudio preservados | REQ-VID-ORIENT-008, REQ-VID-ORIENT-009, REQ-VID-NFR-003, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-QUOTA-003 |
| **UC-VID-011 Passo 7** | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **UC-VID-011 FA1** | Alteração da transformação após pré-visualização | REQ-VID-ORIENT-005 |
| **UC-VID-011 FA2** | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-011 FA3** | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-011 FA4** | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-NFR-008 |
| **UC-VID-011 FA5** | Utilização como passo de cadeia ou em lote | REQ-VID-COM-006, REQ-VID-CHAIN-002, REQ-VID-BATCH-002 |
| **UC-VID-011 Exceção 1** | Ângulo de rotação fora de {0, 90°, 180°, 270°} | REQ-VID-COM-005, REQ-VID-ORIENT-006, REQ-VID-ERROR-001 |
| **UC-VID-011 Exceção 2** | Nenhuma transformação definida ou transformação igual à identidade | REQ-VID-ORIENT-007, REQ-VID-ERROR-001 |
| **UC-VID-011 Exceção 3** | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-011 Exceção 4** | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-011 Exceção 5** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **UC-VID-011 Exceção 6** | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-ERROR-003, REQ-VID-QUOTA-004, REQ-VID-COM-002, REQ-VID-NFR-007 |
| **UC-VID-011 Garantia Sucesso** | Novo vídeo MP4 com a orientação pretendida, original preservado, 1 quota debitada | REQ-VID-ORIENT-008, REQ-VID-ORIENT-009, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-003 |
| **UC-VID-011 Garantia Mínima** | Original inalterado, sem resultados parciais gravados, quota devolvida | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **UC-VID-011 RN1 a RN12** | Regras de perfis, ângulos, combinação rotação/espelho, troca de dimensões, formato e quotas | REQ-VID-AUTH-002, REQ-VID-ORIENT-001 a 009, REQ-VID-QUOTA-001 a 005, REQ-VID-TASK-001, REQ-VID-COM-006, REQ-VID-NFR-003, REQ-VID-NFR-008 |

---

##### Rastreabilidade — UC-VID-012 (Conversão de Formato de Vídeo)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-012 Pré-condições** | JWT válido, permissão no projeto, vídeo elegível (MP4/MOV/AVI), sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008, REQ-VID-NFR-021 |
| **UC-VID-012 Passo 1** | Apresentação do formato atual e dos formatos de saída suportados | REQ-VID-COM-001, REQ-VID-CONVERT-001 |
| **UC-VID-012 Passo 2** | Seleção do formato de saída e indicação de codecs e de cópia direta/recodificação | REQ-VID-CONVERT-002, REQ-VID-CONVERT-003 |
| **UC-VID-012 Passo 3** | Confirmação da operação, validação e verificação de quota | REQ-VID-CONVERT-004, REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-012 Passo 4** | Reserva de quota e notificação do estado `queued` | REQ-VID-QUOTA-002, REQ-VID-TASK-002, REQ-VID-TASK-003 |
| **UC-VID-012 Passo 5** | Remux ou recodificação para os codecs da matriz com progresso | REQ-VID-CONVERT-005, REQ-VID-CONVERT-006, REQ-VID-TASK-002, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| **UC-VID-012 Passo 6** | Armazenamento com duração/resolução/fps preservados e cópia de pré-visualização MP4 (MOV/AVI e MP4 não reproduzíveis) | REQ-VID-CONVERT-007, REQ-VID-CONVERT-008, REQ-VID-NFR-012, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-QUOTA-003 |
| **UC-VID-012 Passo 7** | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **UC-VID-012 FA1** | Conversão por cópia direta de streams (codecs de origem iguais aos de saída da matriz) | REQ-VID-CONVERT-006 |
| **UC-VID-012 FA2** | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-012 FA3** | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-012 FA4** | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-NFR-008 |
| **UC-VID-012 FA5** | Utilização como último passo de cadeia ou em lote | REQ-VID-CONVERT-009, REQ-VID-COM-006, REQ-VID-BATCH-002 |
| **UC-VID-012 Exceção 1** | Formato de saída igual ao atual | REQ-VID-COM-005, REQ-VID-CONVERT-004, REQ-VID-ERROR-001 |
| **UC-VID-012 Exceção 2** | Formato de saída fora da matriz suportada | REQ-VID-COM-005, REQ-VID-CONVERT-004, REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-012 Exceção 3** | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-012 Exceção 4** | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-012 Exceção 5** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **UC-VID-012 Exceção 6** | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-ERROR-003, REQ-VID-QUOTA-004, REQ-VID-COM-002, REQ-VID-NFR-007 |
| **UC-VID-012 Garantia Sucesso** | Novo vídeo no formato escolhido, conforme à matriz, original preservado, 1 quota debitada | REQ-VID-CONVERT-005, REQ-VID-CONVERT-007, REQ-VID-CONVERT-008, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-003 |
| **UC-VID-012 Garantia Mínima** | Original inalterado, sem resultados parciais gravados, quota devolvida | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **UC-VID-012 RN1 a RN13** | Regras de perfis, matriz de formatos e codecs, remux, preservação, pré-visualização e posição na cadeia | REQ-VID-AUTH-002, REQ-VID-CONVERT-001 a 010, REQ-VID-QUOTA-001 a 005, REQ-VID-TASK-001, REQ-VID-NFR-003, REQ-VID-NFR-008, REQ-VID-NFR-012 |

---

##### Rastreabilidade — UC-VID-013 (Junção de Vídeos)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-013 Pré-condições** | JWT válido, permissão de edição, pelo menos dois vídeos elegíveis, sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008, REQ-VID-NFR-021 |
| **UC-VID-013 Passo 1** | Lista de vídeos elegíveis e limites do perfil | REQ-VID-COM-001, REQ-VID-CONCAT-001, REQ-VID-NFR-022, REQ-VID-NFR-024 |
| **UC-VID-013 Passo 2** | Seleção de dois ou mais vídeos na linha temporal com duração total | REQ-VID-CONCAT-001, REQ-VID-CONCAT-002, REQ-VID-CONCAT-004 |
| **UC-VID-013 Passo 3** | Reordenação e indicação da resolução/fps do resultado (primeiro clip à saída da sua sub-cadeia) | REQ-VID-CONCAT-002, REQ-VID-CONCAT-004, REQ-VID-CONCAT-012, REQ-VID-CONCAT-013 |
| **UC-VID-013 Passo 4** | Confirmação, validação de número, duração e formatos, verificação de quota | REQ-VID-COM-004, REQ-VID-CONCAT-005, REQ-VID-CONCAT-006, REQ-VID-CONCAT-007, REQ-VID-QUOTA-001, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-013 Passo 5** | Reserva de quota e notificação do estado `queued` | REQ-VID-QUOTA-002, REQ-VID-TASK-002, REQ-VID-TASK-003 |
| **UC-VID-013 Passo 6** | Normalização, silêncio nos clips mudos (se algum clip tiver áudio), concatenação e progresso | REQ-VID-CONCAT-008, REQ-VID-CONCAT-009, REQ-VID-CONCAT-010, REQ-VID-TASK-002, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| **UC-VID-013 Passo 7** | Geração do MP4, associação com `sourceVideoIds` e reserva da quota tornada definitiva | REQ-VID-CONCAT-010, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-STORAGE-004, REQ-VID-QUOTA-003, REQ-VID-NFR-003 |
| **UC-VID-013 Passo 8** | Disponibilização do resultado e preservação dos originais | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **UC-VID-013 FA1** | Remoção de um clip da seleção | REQ-VID-CONCAT-003, REQ-VID-CONCAT-005 |
| **UC-VID-013 FA2** | Repetição de um vídeo na linha temporal (cada ocorrência conta para os limites) | REQ-VID-CONCAT-001, REQ-VID-CONCAT-006, REQ-VID-CONCAT-007 |
| **UC-VID-013 FA3** | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-CONCAT-011 |
| **UC-VID-013 FA4** | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-CONCAT-011 |
| **UC-VID-013 FA5** | Execução por utilizador Premium (até 50 vídeos e 60 min) | REQ-VID-QUOTA-005, REQ-VID-CONCAT-006, REQ-VID-CONCAT-007, REQ-VID-NFR-022, REQ-VID-NFR-024 |
| **UC-VID-013 FA6** | Junção como passo de uma cadeia | REQ-VID-CHAIN-005, REQ-VID-CHAIN-006 |
| **UC-VID-013 Exceção 1** | Menos de dois vídeos selecionados | REQ-VID-COM-005, REQ-VID-CONCAT-005, REQ-VID-ERROR-001 |
| **UC-VID-013 Exceção 2** | Número de vídeos acima do limite do perfil | REQ-VID-COM-005, REQ-VID-CONCAT-006, REQ-VID-ERROR-001, REQ-VID-NFR-022 |
| **UC-VID-013 Exceção 3** | Duração total acima do limite do perfil | REQ-VID-COM-005, REQ-VID-CONCAT-007, REQ-VID-ERROR-001, REQ-VID-NFR-024 |
| **UC-VID-013 Exceção 4** | Formato ou codec de algum vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-013 Exceção 5** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **UC-VID-013 Exceção 6** | Falha de processamento em qualquer clip | REQ-VID-CONCAT-011, REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-ERROR-003, REQ-VID-QUOTA-004, REQ-VID-NFR-007 |
| **UC-VID-013 Garantia Sucesso** | Único MP4 com os clips por ordem, origens registadas, 1 quota debitada | REQ-VID-CONCAT-010, REQ-VID-STORAGE-002, REQ-VID-STORAGE-004, REQ-VID-COM-003, REQ-VID-QUOTA-003 |
| **UC-VID-013 Garantia Mínima** | Sem resultado parcial, temporários purgados, quota devolvida, originais inalterados | REQ-VID-CONCAT-011, REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **UC-VID-013 RN1 a RN13** | Regras de número de clips, duração total, ordem, normalização, silêncio, quota, atomicidade e proveniência | REQ-VID-AUTH-002, REQ-VID-CONCAT-001 a 013, REQ-VID-QUOTA-001 a 008, REQ-VID-STORAGE-002, REQ-VID-STORAGE-004, REQ-VID-NFR-003, REQ-VID-NFR-008, REQ-VID-NFR-022, REQ-VID-NFR-024 |

---

##### Rastreabilidade — UC-VID-014 (Encadeamento de Operações de Vídeo)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-014 Pré-condições** | JWT válido, permissão de edição, vídeo(s) elegível(eis), quota para o custo total, sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-QUOTA-007, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008, REQ-VID-NFR-021 |
| **UC-VID-014 Passo 1** | Editor de cadeia com operações elegíveis e contador de créditos | REQ-VID-CHAIN-001, REQ-VID-CHAIN-002, REQ-VID-CHAIN-009, REQ-VID-COM-006 |
| **UC-VID-014 Passo 2** | Adição e configuração de passo validado face ao passo anterior | REQ-VID-CHAIN-001, REQ-VID-CHAIN-003, REQ-VID-COM-004 |
| **UC-VID-014 Passo 3** | Cadeia completa, limite de 10 passos, custo total e duração estimada | REQ-VID-CHAIN-004, REQ-VID-CHAIN-008, REQ-VID-CHAIN-009, REQ-VID-QUOTA-008, REQ-VID-NFR-023 |
| **UC-VID-014 Passo 4** | Revalidação da estrutura e dos passos, limites e quota para o custo total | REQ-VID-CHAIN-003, REQ-VID-CHAIN-007, REQ-VID-QUOTA-001, REQ-VID-QUOTA-007, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-014 Passo 5** | Reserva da totalidade dos créditos e notificação do estado `queued` | REQ-VID-QUOTA-007, REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-TASK-006 |
| **UC-VID-014 Passo 6** | Execução numa única tarefa, uma recodificação, passo corrente aproximado e progresso | REQ-VID-CHAIN-010, REQ-VID-CHAIN-012, REQ-VID-TASK-006, REQ-VID-NFR-006, REQ-VID-NFR-009, REQ-VID-NFR-013 |
| **UC-VID-014 Passo 7** | Gravação apenas do vídeo final com proveniência e passos, reserva dos créditos tornada definitiva | REQ-VID-CHAIN-011, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-STORAGE-004, REQ-VID-QUOTA-003 |
| **UC-VID-014 Passo 8** | Disponibilização do resultado e preservação dos originais | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **UC-VID-014 FA1** | Composição com junção: sub-cadeias por clip, junção e cadeia sobre o resultado | REQ-VID-CHAIN-005, REQ-VID-CHAIN-006, REQ-VID-CONCAT-008 a 010, REQ-VID-STORAGE-004 |
| **UC-VID-014 FA2** | Reordenação ou remoção de passos com revalidação | REQ-VID-CHAIN-004 |
| **UC-VID-014 FA3** | Guardar e reutilizar a cadeia (sem junção) como predefinição do utilizador | REQ-VID-CHAIN-014 |
| **UC-VID-014 FA4** | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-CHAIN-013 |
| **UC-VID-014 FA5** | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-CHAIN-013 |
| **UC-VID-014 FA6** | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-CHAIN-008, REQ-VID-NFR-023 |
| **UC-VID-014 FA7** | Utilizador abandona a sessão com continuidade assíncrona | REQ-VID-TASK-001, REQ-VID-TASK-006, REQ-VID-NFR-006 |
| **UC-VID-014 Exceção 1** | Parâmetros inválidos num passo | REQ-VID-COM-005, REQ-VID-CHAIN-003, REQ-VID-ERROR-001 |
| **UC-VID-014 Exceção 2** | Estrutura de cadeia inválida | REQ-VID-CHAIN-007, REQ-VID-CONVERT-009, REQ-VID-ERROR-001 |
| **UC-VID-014 Exceção 3** | Cadeia com mais de 10 passos | REQ-VID-CHAIN-008, REQ-VID-NFR-023 |
| **UC-VID-014 Exceção 4** | Quota inferior ao custo total da cadeia | REQ-VID-QUOTA-001, REQ-VID-QUOTA-007, REQ-VID-ERROR-001 |
| **UC-VID-014 Exceção 5** | Duração ou tamanho acima do limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-014 Exceção 6** | Formato ou codec de algum vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-014 Exceção 7** | Falha durante a execução (erro indica a fase) | REQ-VID-CHAIN-013, REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-ERROR-003, REQ-VID-QUOTA-004, REQ-VID-NFR-007 |
| **UC-VID-014 Garantia Sucesso** | Único vídeo final com todos os passos, sem intermédios, N créditos debitados | REQ-VID-CHAIN-010, REQ-VID-CHAIN-011, REQ-VID-STORAGE-004, REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-QUOTA-008 |
| **UC-VID-014 Garantia Mínima** | Política tudo-ou-nada, temporários purgados, todos os créditos devolvidos | REQ-VID-CHAIN-013, REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **UC-VID-014 RN1 a RN14** | Regras de operações elegíveis, estrutura, limite de passos, validação, custo N, tarefa única, atomicidade e recodificação | REQ-VID-AUTH-002, REQ-VID-CHAIN-001 a 018, REQ-VID-QUOTA-001 a 008, REQ-VID-TASK-006, REQ-VID-COM-006, REQ-VID-NFR-003, REQ-VID-NFR-013, REQ-VID-NFR-023 |

---

##### Rastreabilidade — UC-VID-015 (Processamento de Vídeos em Lote)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-015 Pré-condições** | JWT válido, permissão de edição, dois ou mais vídeos elegíveis, quota para o custo total, sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-QUOTA-007, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008, REQ-VID-NFR-021 |
| **UC-VID-015 Passo 1** | Seleção dos vídeos e apresentação dos limites do perfil | REQ-VID-BATCH-001, REQ-VID-NFR-014 |
| **UC-VID-015 Passo 2** | Definição de uma operação ou cadeia sem junção | REQ-VID-BATCH-002, REQ-VID-BATCH-003, REQ-VID-COM-004, REQ-VID-COM-006 |
| **UC-VID-015 Passo 3** | Pré-validação por vídeo e custo total | REQ-VID-BATCH-004, REQ-VID-BATCH-007, REQ-VID-QUOTA-008 |
| **UC-VID-015 Passo 4** | Verificação de quota, criação do lote (`batchId`) como 1 tarefa ativa | REQ-VID-BATCH-006, REQ-VID-BATCH-008, REQ-VID-BATCH-009, REQ-VID-QUOTA-001, REQ-VID-QUOTA-007, REQ-VID-TASK-007, REQ-VID-NFR-005, REQ-VID-NFR-021 |
| **UC-VID-015 Passo 5** | Reserva da totalidade dos créditos e notificação do estado `queued` | REQ-VID-QUOTA-007, REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-TASK-007 |
| **UC-VID-015 Passo 6** | Processamento sequencial com estado por vídeo e progresso agregado (terminados / total) | REQ-VID-BATCH-009, REQ-VID-BATCH-013, REQ-VID-BATCH-018, REQ-VID-TASK-007, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| **UC-VID-015 Passo 7** | Associação de cada resultado e débito/estorno por vídeo | REQ-VID-BATCH-010, REQ-VID-BATCH-011, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-QUOTA-003, REQ-VID-QUOTA-004 |
| **UC-VID-015 Passo 8** | Estado final agregado e resumo | REQ-VID-BATCH-012, REQ-VID-BATCH-014, REQ-VID-BATCH-017, REQ-VID-TASK-002, REQ-VID-TASK-003 |
| **UC-VID-015 Passo 9** | Disponibilização dos resultados e preservação dos originais | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **UC-VID-015 FA1** | Descarregamento dos resultados em ZIP gerado em segundo plano (lote `completed`, ou `cancelled` com ≥ 1 concluído) | REQ-VID-BATCH-015, REQ-VID-DOWNLOAD-002 |
| **UC-VID-015 FA2** | Exclusão dos vídeos incompatíveis com recálculo do custo | REQ-VID-BATCH-005, REQ-VID-BATCH-007 |
| **UC-VID-015 FA3** | Carregamento de uma cadeia predefinida | REQ-VID-CHAIN-014 |
| **UC-VID-015 FA4** | Cancelamento do lote mantendo os vídeos concluídos | REQ-VID-BATCH-014, REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004 |
| **UC-VID-015 FA5** | Execução por utilizador Premium (até 50 vídeos) | REQ-VID-QUOTA-005, REQ-VID-BATCH-006, REQ-VID-NFR-014 |
| **UC-VID-015 FA6** | Utilizador abandona a sessão com continuidade assíncrona | REQ-VID-TASK-001, REQ-VID-TASK-007, REQ-VID-NFR-006 |
| **UC-VID-015 Exceção 1** | Menos de dois vídeos ou acima do limite do perfil | REQ-VID-COM-005, REQ-VID-BATCH-006, REQ-VID-ERROR-001, REQ-VID-NFR-014 |
| **UC-VID-015 Exceção 2** | Configuração com junção ou extração de fotogramas | REQ-VID-BATCH-003, REQ-VID-ERROR-001 |
| **UC-VID-015 Exceção 3** | Nenhum vídeo compatível com a configuração | REQ-VID-BATCH-004, REQ-VID-ERROR-001 |
| **UC-VID-015 Exceção 4** | Quota inferior ao custo total do lote | REQ-VID-QUOTA-001, REQ-VID-QUOTA-007, REQ-VID-ERROR-001 |
| **UC-VID-015 Exceção 5** | Falha no processamento de um vídeo | REQ-VID-BATCH-010, REQ-VID-BATCH-011, REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-ERROR-003 |
| **UC-VID-015 Exceção 6** | Falha geral do worker (reentrega; ao fim de duas entregas falha só o item em curso) | REQ-VID-BATCH-010, REQ-VID-BATCH-011, REQ-VID-ERROR-002, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **UC-VID-015 Garantia Sucesso** | Um novo vídeo por vídeo concluído, créditos apenas pelos concluídos | REQ-VID-BATCH-010, REQ-VID-BATCH-011, REQ-VID-BATCH-012, REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-QUOTA-008 |
| **UC-VID-015 Garantia Mínima** | Falhados sem parciais e com créditos devolvidos, concluídos mantidos | REQ-VID-BATCH-010, REQ-VID-BATCH-011, REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **UC-VID-015 RN1 a RN9** | Regras de número de vídeos, operações elegíveis, custo, concorrência, independência e estorno | REQ-VID-AUTH-002, REQ-VID-BATCH-001 a 019, REQ-VID-QUOTA-001 a 008, REQ-VID-TASK-007, REQ-VID-NFR-003, REQ-VID-NFR-014 |

---

##### Rastreabilidade — Requisitos Transversais de Arquitetura (UC-VID-000 a UC-VID-015)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **Todos os casos: execução dos workers (DQ-002)** | Processamento e descodificação de vídeo em contentores Docker com FFmpeg, sem binários instalados no host | REQ-VID-NFR-010 |
| **Todos os casos: extensibilidade das operações (Tabela de Impacto 4.2)** | Fila AMQP dedicada (`video_operations_queue`) que permite acrescentar operações sem alterar as ferramentas de imagem | REQ-VID-NFR-011, REQ-VID-COM-006 |

---

#### 4.3.2 Verificações de Cobertura

- [x] **Cada requisito funcional e não funcional aparece na matriz**: Todos os 214 requisitos funcionais e 26 requisitos não funcionais da ERS têm origem registada nos respetivos ficheiros e constam da matriz de rastreabilidade da secção 7 do relatório Typst; a revisão está registada em [quality-review.md](requirements/quality-review.md).
- [x] **Cada requisito tem origem identificada**: Todas as linhas possuem ligação direta a um passo do fluxo, exceção, regra de negócio ou decisão de qualidade documentada nos casos de uso.
- [x] **Todos os elementos relevantes dos casos de uso têm requisito associado**: Pré-condições, passos dos fluxos principais, fluxos alternativos, exceções, garantias pós-condicionais e regras de negócio de `UC-VID-000` a `UC-VID-015` estão integralmente cobertos.
- [x] **Os tópicos de âmbito da secção 4.1.3 estão justificados**: O encadeamento de operações de vídeo e o processamento em lote de vários vídeos passaram a integrar o MVP (v2.3); as exclusões remanescentes (extração de fotogramas como passo de cadeia ou de lote de vídeos, transições na junção) estão justificadas na secção 4.1.3, na DQ-017 e na Q-ERS-006.
- [x] **O impacto no sistema existente está atualizado e ligado aos requisitos relevantes**: A secção 4.2 abrange todos os serviços afetados, incluindo upload de vídeo, reprodutor integrado e serviços de storage SeaweedFS/S3 com os respetivos identificadores de requisitos. A partir da v2.3, inclui também as novas operações (descarregamento, informações, ajustes, filtros, redimensionamento, orientação, conversão, junção, cadeias e lotes) e as cópias de pré-visualização MP4 (MOV/AVI e MP4 não reproduzíveis).

---

### 4.4 Decisões de Qualidade e Arquitetura Introduzidas na ERS

| **ID** | **Decisão de Qualidade** | **Justificação** | **Requisito(s) Relacionado(s)** |
|---|---|---|---|
| **DQ-001** | Acesso restrito a utilizadores autenticados Registados e Premium com quota diária (5 ops/dia no plano Registado e ilimitado no Premium); exclusão de perfis anónimos. | Protege a capacidade de computação contra abusos e ataques de negação de serviço, sustentando o modelo de negócio da plataforma através de controlo transacional de créditos de processamento. | REQ-VID-AUTH-001 a 003, REQ-VID-QUOTA-001 a 005, REQ-VID-NFR-001, REQ-VID-NFR-008 |
| **DQ-002** | Contentores MP4, MOV e AVI na entrada com matriz de codecs aprovada (H.264/AAC em MP4 e MOV; H.264 ou MPEG-4 Part 2 / AAC ou MP3 em AVI); conversão entre MP4, MOV e AVI (MPEG-4 Part 2/MP3 na saída AVI); exportação de fotogramas em JPEG/PNG. | Alarga a compatibilidade aos formatos mais comuns de câmaras e de arquivos antigos, mantendo uma matriz fechada e testável; a reprodução no navegador é assegurada pela cópia de pré-visualização MP4 (DQ-012). | REQ-VID-NFR-003, REQ-VID-NFR-004, REQ-VID-NFR-012, REQ-VID-UPLOAD-003, REQ-VID-UPLOAD-009, REQ-VID-UPLOAD-010, REQ-VID-CONVERT-002, REQ-VID-CONVERT-005, REQ-VID-TRIM-008, REQ-VID-AUDIO-005, REQ-VID-SPEED-008, REQ-VID-WATERMARK-011, REQ-VID-FRAMES-003, REQ-VID-FRAMES-010 |
| **DQ-003** | Modelação explícita de recursos de vídeo na base de dados (MongoDB) e referência de proveniência (`sourceVideoId`). | Separa a semântica de fluxos contínuos audiovisuais dos artefactos de imagem estática, permitindo rastrear o histórico completo de transformações do projeto. | REQ-VID-STORAGE-001, REQ-VID-STORAGE-002, REQ-VID-COM-003, REQ-VID-UPLOAD-013, REQ-VID-FRAMES-012 |
| **DQ-004** | Orquestração assíncrona orientada a eventos via RabbitMQ e WebSockets com máquina de estados canónica (`queued → processing → completed \| failed \| cancelled`). | Desacopla o gateway HTTP da carga computacional pesada, assegurando que o utilizador recebe confirmação imediata e navega livremente enquanto o trabalho decorre. | REQ-VID-TASK-001 a 005, REQ-VID-NFR-005, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| **DQ-005** | Limites contratuais rígidos de duração e volume no MVP (Registado: $\leq 5$ min / 200 MB / 50 frames; Premium: $\leq 60$ min / 2 GB / 500 frames; máx. 1 tarefa ativa/projeto). | Evita o esgotamento do armazenamento e saturação dos workers por ficheiros anómalos durante a fase de validação funcional do produto. | REQ-VID-UPLOAD-004, REQ-VID-UPLOAD-011, REQ-VID-SPEED-005, REQ-VID-FRAMES-006, REQ-VID-NFR-008, REQ-VID-NFR-020, REQ-VID-NFR-021 |
| **DQ-006** | Semântica matemática de intervalo semiaberto `[início, fim[` para amostragem temporal com cardinalidade calculada por timestamps discretos $\text{início} + k \times N < \text{fim}$. | Elimina ambiguidades na contagem de fotogramas e garante que a estimativa apresentada na interface coincide exatamente com o número de ficheiros entregues no projeto. | REQ-VID-FRAMES-001, REQ-VID-FRAMES-002, REQ-VID-FRAMES-004, REQ-VID-FRAMES-005 |
| **DQ-007** | Garantia de não publicação parcial e estorno automático de quota perante cancelamento voluntário ou falha técnica. | Preserva a integridade e consistência transacional do projeto do utilizador, assegurando que este nunca fica com lotes parciais inúteis nem perde quota por anomalias do sistema. | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-004, REQ-VID-FRAMES-013, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **DQ-008** | Imputação do consumo de quota à conta do utilizador executor da operação em projetos partilhados. | Impede que utilizadores convidados com permissão de edição esgotem a quota do dono do projeto, alinhando a responsabilidade de débito com o agente ativo. | REQ-VID-QUOTA-006 |
| **DQ-009** | Geometria estática invariante da marca de água ao longo de toda a duração temporal do vídeo. | Simplifica a validação e o algoritmo do worker na Fase 1 do MVP, garantindo consistência visual estável sem sobrecarga de interpolação espacial de keyframes. | REQ-VID-WATERMARK-004, REQ-VID-WATERMARK-008, REQ-VID-WATERMARK-010 |
| **DQ-010** | Distinção formal entre Alvo MVP e Alvo de Produção segundo a ISO/IEC 25010 para sustentação da Fase 2 de melhoria por refactoring. | Permite validar funcionalmente a extensão na Fase 1 sem impor prematuramente metas de alta disponibilidade, clusterização elástica ou SLA de produção industrial. | REQ-VID-NFR-001 a REQ-VID-NFR-011 |
| **DQ-011** | Isenção de consumo de quota diária para o carregamento e reprodução de vídeos no projeto. | Fomenta a adoção da plataforma permitindo que os utilizadores criem a sua mediateca e visualizem vídeos sem barreiras transacionais, incidindo a cobrança exclusivamente sobre as tarefas de processamento/manipulação. | REQ-VID-UPLOAD-014, REQ-VID-QUOTA-001 |
| **DQ-012** | Pré-visualização de originais e resultados em MOV ou AVI, e de originais e resultados MP4 com perfis H.264 que os navegadores não reproduzem (10 bits, 4:2:2, 4:4:4), através de uma cópia MP4 (H.264 `yuv420p`/AAC) gerada na ingestão e no fim da operação, usada exclusivamente pelo reprodutor integrado; as operações e o descarregamento usam sempre o ficheiro original. | Os navegadores não reproduzem AVI, reproduzem MOV de forma inconsistente e não reproduzem os perfis H.264 de 10 bits, 4:2:2 ou 4:4:4, que são recodificados para `yuv420p`; a alternativa "disponível apenas para descarregar" foi rejeitada por impedir a inspeção visual antes da edição (UC-VID-000, passo 8). ADD v1.1, T-06, Q-ADD-20. | REQ-VID-UPLOAD-016, REQ-VID-UPLOAD-017, REQ-VID-CONVERT-008, REQ-VID-DOWNLOAD-006, REQ-VID-INFO-004, REQ-VID-NFR-012 |
| **DQ-013** | Os resultados de todas as operações de vídeo são gerados em MP4 (H.264/AAC), salvo na conversão de formato, que gera o contentor escolhido. | Um único formato de trabalho simplifica os workers, as cadeias e a reprodução; a conversão é o único ponto de saída para outros formatos. | REQ-VID-ADJUST-009, REQ-VID-FILTER-007, REQ-VID-RESIZE-009, REQ-VID-ORIENT-009, REQ-VID-CONCAT-010, REQ-VID-CONVERT-005, REQ-VID-NFR-003 |
| **DQ-014** | Política de quota: 1 crédito por operação isolada ou junção; N créditos por cadeia de N passos (a junção conta 1); num lote, custo da operação ou cadeia × vídeos concluídos; descarregamento e consulta de informações gratuitos; custo total verificado e reservado antes da aceitação. | O custo reflete o trabalho de processamento efetivamente pedido e entregue, mantendo a regra base de 1 operação = 1 crédito. | REQ-VID-QUOTA-007, REQ-VID-QUOTA-008, REQ-VID-CHAIN-009, REQ-VID-CHAIN-013, REQ-VID-BATCH-007, REQ-VID-BATCH-011, REQ-VID-DOWNLOAD-004, REQ-VID-INFO-007 |
| **DQ-015** | Limites de composição: lote e junção com 2–10 vídeos (Registado) ou 2–50 (Premium); cadeia com máximo de 10 passos; duração total da junção ≤ limite de duração do perfil. | Protege os workers e o armazenamento contra pedidos desproporcionados durante a validação do MVP. | REQ-VID-CONCAT-006, REQ-VID-CONCAT-007, REQ-VID-CHAIN-008, REQ-VID-BATCH-006, REQ-VID-NFR-014, REQ-VID-NFR-022, REQ-VID-NFR-023, REQ-VID-NFR-024 |
| **DQ-016** | Uma cadeia ou um lote conta como 1 tarefa ativa no projeto; os vídeos de um lote são processados sequencialmente. | Mantém o limite de 1 tarefa ativa por projeto (REQ-VID-NFR-021) sem impedir cadeias e lotes. | REQ-VID-TASK-006, REQ-VID-TASK-007, REQ-VID-CHAIN-010, REQ-VID-BATCH-009, REQ-VID-NFR-021 |
| **DQ-017** | Âmbito da cadeia e do lote: são elegíveis o recorte, a remoção de áudio, a velocidade, a marca de água, os ajustes, os filtros, o redimensionamento, a orientação, a conversão (apenas como último passo) e a junção (no máximo uma, com sub-cadeias por clip e cadeia sobre o resultado); a extração de fotogramas é excluída; o lote aplica uma operação ou cadeia sem junção. | Garante cadeias executáveis com um formato de trabalho único e resultados de vídeo; a junção é incompatível com o princípio de um resultado por vídeo do lote. | REQ-VID-COM-006, REQ-VID-CHAIN-002, REQ-VID-CHAIN-005, REQ-VID-CHAIN-006, REQ-VID-CHAIN-007, REQ-VID-CONVERT-009, REQ-VID-BATCH-002, REQ-VID-BATCH-003 |
| **DQ-018** | Política de falhas: a cadeia e a junção são atómicas (tudo-ou-nada); no lote, os resultados são independentes por vídeo. | Uma cadeia ou junção parcial não corresponde à edição pedida; num lote, um vídeo problemático não deve invalidar o trabalho válido dos restantes. | REQ-VID-CONCAT-011, REQ-VID-CHAIN-013, REQ-VID-BATCH-010, REQ-VID-BATCH-011 |
| **DQ-019** | Normalização na junção: o resultado adota a resolução e a taxa de fotogramas do primeiro clip à saída da sua sub-cadeia, nas dimensões de apresentação, com barras pretas quando a proporção difere, silêncio nos clips sem áudio quando pelo menos um clip tem áudio (se nenhum tiver, o resultado fica sem áudio) e corte seco entre clips. | Regra simples e previsível para clips heterogéneos; o utilizador pode controlar a resolução final encadeando um redimensionamento. ADD v1.1, 4.8, Q-ADD-13. | REQ-VID-CONCAT-004, REQ-VID-CONCAT-008, REQ-VID-CONCAT-009, REQ-VID-CONCAT-010 |
| **DQ-020** | Ajustes visuais como fatores multiplicativos no intervalo [0.0, 2.0], com passo de 0.05 e neutro 1.0. | Mantém a semântica das ferramentas de imagem existentes (brilho, contraste e saturação), reduzindo a curva de aprendizagem. O contraste usa um pivô fixo (128), ao contrário do `ImageEnhance.Contrast`, que usa a média da imagem, para a aplicação ser uniforme entre fotogramas (ADD v1.1, Q-ADD-18). | REQ-VID-ADJUST-001 a 007 |
| **DQ-021** | Catálogo fechado de filtros no MVP: Preto e Branco, Sépia, Negativo, Vintage, Frio e Quente; um filtro por operação, sem controlo de intensidade. | Resultados previsíveis e testáveis com matrizes de cor 3×3 e inversão, aplicadas da mesma forma pelo sharp e pelo FFmpeg; combinações fazem-se por encadeamento. As matrizes de Vintage, Frio e Quente ficam por definir (ADD v1.1, T-07, Q-ADD-07). | REQ-VID-FILTER-001, REQ-VID-FILTER-003, REQ-VID-FILTER-005 |
| **DQ-022** | Redimensionamento com dimensões pares ≥ 128 px, teto de 1920×1080 (Registado) ou 3840×2160 (Premium), proporção bloqueada por omissão e ampliação permitida com aviso. | Compatibilidade com H.264 e controlo da carga de processamento e armazenamento por perfil. | REQ-VID-RESIZE-002, REQ-VID-RESIZE-004, REQ-VID-RESIZE-005, REQ-VID-RESIZE-006 |
| **DQ-023** | Descarregamento de qualquer vídeo concluído (original ou resultante) com permissão de leitura, no formato armazenado, por URL assinado de 15 min com suporte a `Range` e sem consumo de quota. | O descarregamento não consome processamento; servi-lo diretamente do storage protege o API Gateway de transferências de até 2 GB. | REQ-VID-DOWNLOAD-001 a 007, REQ-VID-NFR-016 |
| **DQ-024** | Todas as novas funcionalidades (UC-VID-006 a UC-VID-015) estão restritas a utilizadores Registados e Premium; os Anónimos ficam excluídos. | Coerente com a DQ-001: os recursos residem em projetos autenticados e o processamento exige controlo de abuso e de quota. | REQ-VID-AUTH-002, REQ-VID-DOWNLOAD-001, REQ-VID-INFO-001, REQ-VID-ADJUST-001, REQ-VID-FILTER-001, REQ-VID-RESIZE-001, REQ-VID-ORIENT-001, REQ-VID-CONVERT-002, REQ-VID-CONCAT-001, REQ-VID-CHAIN-001, REQ-VID-BATCH-001 |
| **DQ-025** | O perfil Registado fica limitado, pela quota diária de 5 créditos, a cadeias com no máximo 5 passos por dia; não existem pacotes de créditos adicionais no MVP e as necessidades maiores são cobertas pelo perfil Premium. | Preserva o modelo de negócio e a diferenciação entre os planos Registado e Premium, sem regras de quota específicas para cadeias. | REQ-VID-QUOTA-007, REQ-VID-QUOTA-008, REQ-VID-CHAIN-008, REQ-VID-CHAIN-009 |

---

### 4.5 Questões em Aberto e Checklist de Entrega

### 4.5.1 Questões em Aberto Residuais

As questões de arquitetura e de implementação estão nas Q-ADD-01 a Q-ADD-25 do ADD v1.1 (`docs/add.md`, secção 7). Nesta versão da ERS, essas questões são dadas como aceites com a decisão que o próprio ADD propõe.

| **ID** | **Questão em Aberto** | **Impacto no MVP** | **Resolução Provisória Adotada para a Fase 1** |
|---|---|---|---|
| **Q-ERS-001** | Deve ser suportada a ingestão de vídeos através de URL externo (e.g. YouTube, HTTP direto) além do upload de ficheiro local? | Baixo | Rejeitada para o MVP. O upload é estritamente via ficheiro binário local para controlar os limites e a integridade de rede. |
| **Q-ERS-002** | Deve ser permitida a substituição direta de um ficheiro de vídeo existente mantendo o mesmo identificador de recurso? | Médio | Não permitida no MVP. O ficheiro original é imutável; novas versões geram novos recursos com novo UUID. |
| **Q-ERS-003** | Deve ser disponibilizada a seleção interativa da marca de água por arrastamento (*drag-to-position*) na interface web? | Baixo | Para o MVP, o posicionamento é feito através de botões predefinidos (cantos/centro) e campos numéricos de coordenadas X e Y. |
| **Q-ERS-004** | As cópias de pré-visualização MP4 (de vídeos MOV/AVI e de MP4 não reproduzíveis nos navegadores) contam para os limites de armazenamento do projeto ou do perfil? | Baixo | Não contam no MVP; são eliminadas juntamente com o recurso original e podem ser regeneradas. |
| **Q-ERS-005** | O utilizador Registado fica limitado, pela quota diária de 5 créditos, a cadeias de no máximo 5 passos. Deve existir um pacote de créditos adicional? | Médio | **Fechada (v2.3).** Aceite a limitação a 5 passos por dia no perfil Registado; o Premium cobre os casos maiores (DQ-025). |
| **Q-ERS-006** | Devem ser suportadas transições entre clips na junção (e.g. *fade*, *crossfade*)? | Baixo | Não no MVP; a junção usa corte seco. Transições ficam para a Fase 2. |
| **Q-ERS-007** | Se a quota não cobrir o custo total de um lote, deve o sistema aceitar apenas os vídeos que a quota cobre? | Médio | Não no MVP. O lote é rejeitado (REQ-VID-QUOTA-007) e o utilizador pode reduzir a seleção. |
| **Q-ERS-008** | Deve existir controlo de intensidade dos filtros visuais? | Baixo | Não no MVP (DQ-021). A intensidade fica para a Fase 2. |
| **Q-ERS-009** | As pré-condições dos UC-VID-001 a UC-VID-005 e os requisitos REQ-VID-TRIM-009 e REQ-VID-AUDIO-005 referem apenas MP4 (H.264/AAC). Como se comportam estas operações sobre originais MOV ou AVI? | Médio | **Fechada (v2.3).** Os UC-VID-001 a UC-VID-005 (pré-condições, passos, exceções, regras de negócio e assunções) e os requisitos REQ-VID-TRIM-009, REQ-VID-AUDIO-005, REQ-VID-SPEED-008 e REQ-VID-WATERMARK-011 foram atualizados para aceitar MP4, MOV e AVI segundo a DQ-002, gerando resultados em MP4 (H.264/AAC) segundo a DQ-013. |

### 4.5.2 Lista de Verificação antes de Entregar

- [x] O caso de uso fundacional `UC-VID-000` (Carregamento, ingestão e visualização de vídeo) foi devidamente especificado e os seus 20 requisitos funcionais nucleares foram incorporados.
- [x] Todos os requisitos funcionais dos casos de uso `UC-VID-001` a `UC-VID-005` foram refinados e decompostos segundo o princípio da **estrita atomicidade**.
- [x] Cada requisito utiliza rigorosamente o fraseamento canónico *"O sistema deve..."* ou *"O sistema deve permitir ao {ator}..."*.
- [x] Os requisitos encontram-se organizados em ficheiros dedicados por caso de uso na pasta `docs/requirements/`, respeitando fielmente as colunas do template do Exercício 2.
- [x] Todos os requisitos possuem critérios de aceitação e verificação mensuráveis descritos no formato canónico *Dado... Quando... Então...*.
- [x] Os requisitos não funcionais encontram-se classificados segundo a norma **ISO/IEC 25010** e distinguem formalmente o **Alvo MVP** do **Alvo de Produção**.
- [x] A matriz de rastreabilidade (secção 4.3) estabelece uma cobertura bidirecional exaustiva, garantindo zero requisitos órfãos e zero passos/exceções/regras de negócio por cobrir.
- [x] A análise de impacto no sistema existente (secção 4.2) mapeia todos os componentes afetados pela ingestão de vídeo e pelas ferramentas de manipulação.
- [x] As decisões de qualidade e arquitetura (`DQ-001` a `DQ-025`) encontram-se catalogadas com justificações técnicas e ligação aos requisitos correspondentes.
- [x] Os novos requisitos RF1 a RF10 (as dez funcionalidades novas pedidas no enunciado da Fase 1) foram especificados nos casos de uso `UC-VID-006` a `UC-VID-015` e nos ficheiros `REQ-VID-DOWNLOAD`, `INFO`, `ADJUST`, `FILTER`, `RESIZE`, `ORIENT`, `CONVERT`, `CONCAT`, `CHAIN` e `BATCH` (101 requisitos funcionais), com 6 requisitos comuns, 2 de carregamento e 5 não funcionais adicionais.
- [x] O encadeamento de operações e o processamento em lote de vídeos foram incluídos no MVP e a matriz de formatos foi alargada a MP4, MOV e AVI, com cópia de pré-visualização MP4 (DQ-002, DQ-012 a DQ-017).
