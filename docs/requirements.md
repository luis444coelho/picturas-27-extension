# 📝 Exercício 2 — Especificação de Requisitos do Sistema (ERS)
### Fase 1: Suporte a Vídeo no PictuRAS · Dossiê de Requisitos e Arquitetura

---

## 0. Identificação e Metadados do Dossiê

| **Campo** | **Valor** |
|---|---|
| **Grupo / Equipa** | Grupo 27 |
| **Autores** | Equipa PictuRAS-27 |
| **Data** | 2026-10-18 |
| **Versão do Dossiê** | v2.2 (Modularização da ERS em ficheiros individuais por Caso de Uso) |
| **Caso de Uso / Âmbito** | UC-VID-000 a UC-VID-005 — Extensão para Suporte a Vídeo Digital (Carregamento/Visualização, Trim, Áudio, Velocidade, Marca de Água e Fotogramas) |
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

**Baseline e Evolução do Exercício 1 para o Exercício 2:**
- A baseline inicial do Exercício 1 cobria apenas as cinco operações de transformação temporal e espacial de vídeo (UC-VID-001 a 005). Contudo, dado que o PictuRAS é uma plataforma originalmente desenvolvida em exclusivo para processamento de imagem estática, tornou-se mandatória a definição formal do caso de uso de ingestão, validação e reprodução de vídeo (**UC-VID-000**), indispensável para viabilizar qualquer processamento subsequente.
- Na presente versão da ERS, todos os requisitos funcionais foram rigorosamente decompostos segundo o princípio da **estrita atomicidade**: cada requisito enuncia uma única obrigação não divisível do sistema através do fraseamento canónico (*"O sistema deve..."* ou *"O sistema deve permitir ao {ator}..."*), eliminando ambiguidades e formulações compostas.
- Para assegurar clareza e permitir a integração modular no relatório final (e.g., tabelas Typst paisagem por capítulo), os requisitos encontram-se **organizados em ficheiros independentes por caso de uso e domínio transversal** na pasta [`docs/requirements/`](requirements/).

---

### 4.1 Requisitos da ERS

#### 4.1.1 Catálogo de Requisitos Funcionais (por Caso de Uso)

| **Secção** | **Âmbito / Caso de Uso** | **Prefixo dos Requisitos** | **Qtd.** | **Ficheiro de Especificação** |
|---|---|---|:---:|---|
| **4.1.1.1** | Requisitos Comuns e Transversais (Sessão, Quotas, Storage, Tasks, Erros) | `REQ-VID-COM`, `AUTH`, `QUOTA`, `STORAGE`, `TASK`, `ERROR` | 25 | [REQ-VID-COM.md](requirements/REQ-VID-COM.md) |
| **4.1.1.2** | UC-VID-000: Carregamento, Ingestão e Visualização de Vídeo | `REQ-VID-UPLOAD` | 15 | [REQ-VID-UPLOAD.md](requirements/REQ-VID-UPLOAD.md) |
| **4.1.1.3** | UC-VID-001: Recorte Temporal (*Trim*) | `REQ-VID-TRIM` | 9 | [REQ-VID-TRIM.md](requirements/REQ-VID-TRIM.md) |
| **4.1.1.4** | UC-VID-002: Remoção do Áudio | `REQ-VID-AUDIO` | 6 | [REQ-VID-AUDIO.md](requirements/REQ-VID-AUDIO.md) |
| **4.1.1.5** | UC-VID-003: Alteração da Velocidade de Reprodução | `REQ-VID-SPEED` | 8 | [REQ-VID-SPEED.md](requirements/REQ-VID-SPEED.md) |
| **4.1.1.6** | UC-VID-004: Marca de Água em Vídeo | `REQ-VID-WATERMARK` | 11 | [REQ-VID-WATERMARK.md](requirements/REQ-VID-WATERMARK.md) |
| **4.1.1.7** | UC-VID-005: Extração de Fotogramas para o Projeto | `REQ-VID-FRAMES` | 13 | [REQ-VID-FRAMES.md](requirements/REQ-VID-FRAMES.md) |
| **Total** | **Requisitos Funcionais do Subsistema de Vídeo** | — | **87** | — |

---

#### 4.1.2 Requisitos Não Funcionais e de Qualidade (ISO/IEC 25010)

Os 11 requisitos de qualidade do sistema encontram-se especificados no documento individual dedicado:
👉 **[Ver Tabela Completa de Requisitos Não Funcionais — REQ-VID-NFR.md](requirements/REQ-VID-NFR.md)**

A classificação cobre:
- **Segurança** (`REQ-VID-NFR-001`): Autenticação JWT e URLs pré-assinados temporários.
- **Fiabilidade** (`REQ-VID-NFR-002`, `007`): `correlationId` distribuído e integridade transacional de dados sem ficheiros órfãos.
- **Compatibilidade** (`REQ-VID-NFR-003`, `004`): Contentor MP4 (H.264/AAC) exclusivo e exportação JPEG/PNG nativa.
- **Desempenho** (`REQ-VID-NFR-005`, `006`): Resposta síncrona HTTP $\le 1$ s e workers 100% assíncronos via RabbitMQ.
- **Capacidade** (`REQ-VID-NFR-008`): Limites contratuais rígidos de duração, tamanho e concorrência máxima de 1 tarefa ativa por projeto.
- **Usabilidade** (`REQ-VID-NFR-009`): Progresso numérico WebSocket (0–100%) em operações contínuas.
- **Portabilidade e Manutenibilidade** (`REQ-VID-NFR-010`, `011`): Contentores Docker com FFmpeg e fila desacoplada `video_operations_queue`.

---

#### 4.1.3 Verificação da Completude e dos Limites do Âmbito

| **Tópico a verificar** | **Aplicável?** | **Decisão / justificação** | **Requisito(s) relacionado(s)** |
|---|:---:|---|---|
| **Carregamento, ingestão e visualização de vídeo** | **Sim** | O sistema suporta nativamente o carregamento por seleção e arrastamento, validação de cabeçalhos e codecs, armazenamento em SeaweedFS/S3, extração de metadados técnicos, geração de miniatura JPEG e visualização num leitor multimédia integrado com controlos de navegação e atalhos para edição. | REQ-VID-UPLOAD-001 a 015, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| **Formato, codec, duração e dimensão do vídeo** | **Sim** | O sistema suporta exclusivamente o contentor MP4 com codecs H.264 e AAC para todas as operações de entrada e saída de vídeo, e JPEG/PNG para fotogramas extraídos. Impõe limites de duração e tamanho diferenciados por perfil (Registado: $\leq 5$ min e $\leq 200$ MB; Premium: $\leq 60$ min e $\leq 2$ GB). | REQ-VID-UPLOAD-003, REQ-VID-UPLOAD-004, REQ-VID-UPLOAD-009 a 011, REQ-VID-NFR-003, REQ-VID-NFR-004, REQ-VID-NFR-008 |
| **Estado, progresso, cancelamento e resultado** | **Sim** | Implementado ciclo de vida assíncrono completo com estados `queued → processing → completed \| failed \| cancelled`. Progresso contínuo 0–100% via WebSocket nas operações que processam fotograma a fotograma (marca de água e extração). Cancelamento suportado com interrupção do worker e limpeza de temporários. | REQ-VID-TASK-001 a 005, REQ-VID-NFR-005, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| **Falhas durante o processamento** | **Sim** | Política estrita de integridade: em caso de falha durante a descodificação, recorte ou codificação, o vídeo original é preservado, nenhum resultado parcial é gravado no projeto, os temporários são purgados e a operação de quota reservada é estornada ao utilizador registado. | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-FRAMES-013, REQ-VID-ERROR-001 a 003, REQ-VID-NFR-007 |
| **Persistência e expiração dos ficheiros** | **Sim** | Os vídeos e resultados de transformações são armazenados como recursos de projeto permanentes no SeaweedFS/S3, com metadados persistidos no MongoDB e referência ao vídeo de origem (`sourceVideoId`). Seguem o ciclo de vida e permissões do projeto onde residem. | REQ-VID-COM-003, REQ-VID-STORAGE-001 a 003, REQ-VID-UPLOAD-007, REQ-VID-UPLOAD-013, REQ-VID-NFR-001 |
| **Perfis e contagem de operações** | **Sim** | Acesso reservado a utilizadores Registados e Premium (Anónimos excluídos). O carregamento de vídeo é livre de débito de quota. Cada operação de manipulação consome exatamente 1 crédito da quota diária de 5 operações do utilizador Registado. O perfil Premium tem acesso ilimitado. Em projetos partilhados, a quota é imputada ao utilizador executor da operação. | REQ-VID-AUTH-001 a 003, REQ-VID-QUOTA-001 a 006, REQ-VID-UPLOAD-014, REQ-VID-NFR-008 |
| **Encadeamento de ferramentas e processamento em lote** | **Sim (com exclusão explícita)** | **Decisão de Âmbito para o MVP:** O encadeamento de ferramentas (*tool chaining*) e o processamento em lote (*batch processing*) aplicam-se **exclusivamente aos fotogramas extraídos** após a sua conversão em imagens normais do projeto. O encadeamento de operações de vídeo entre si e o processamento em lote de múltiplos vídeos em simultâneo ficam **explicitamente excluídos do âmbito do MVP da Fase 1**. | REQ-VID-FRAMES-011, REQ-VID-STORAGE-001 (Justificado no UC-VID-005 RN11 e A6) |

---

### 4.2 Impacto no Sistema Existente

A tabela seguinte documenta a análise detalhada de impacto na arquitetura existente do PictuRAS provocada pela introdução da ERS de vídeo:

| **Elemento existente afetado** | **Impacto (Manter / Estender / Alterar)** | **Descrição do impacto** | **Requisito(s) relacionado(s)** |
|---|:---:|---|---|
| `apiGateway/routes/projects.js` | **Estender** | Expor rotas dedicadas para carregamento de vídeo (`POST /projects/:id/videos`) e submissão das cinco operações de manipulação (`/video/trim`, `/audio`, `/speed`, `/watermark`, `/extract-frames`). Validar token JWT, permissões e parâmetros antes de despachar mensagens. | REQ-VID-COM-001, REQ-VID-COM-004, REQ-VID-COM-005, REQ-VID-AUTH-001 a 003, REQ-VID-UPLOAD-001 a 004, REQ-VID-NFR-005 |
| Serviço de Projetos (`projects/routes/projects.js`) | **Estender** | Incorporar lógica de negócio para orquestração de vídeo, associação de recursos de vídeo e fotogramas ao projeto, e gestão de permissões partilhadas (read/edit). | REQ-VID-COM-001 a 003, REQ-VID-UPLOAD-013, REQ-VID-FRAMES-011, REQ-VID-STORAGE-001 a 003 |
| Modelos de Dados MongoDB (`projects/models/`) | **Alterar** | Criar esquema específico para recursos de vídeo (`videos`), armazenando metadados técnicos de codec, resolução, duração, thumbnail e streams. Alterar esquema de tarefas para suportar operações de vídeo e relacionar resultados ao vídeo de origem (`sourceVideoId`). | REQ-VID-STORAGE-001, REQ-VID-STORAGE-002, REQ-VID-UPLOAD-013, REQ-VID-TASK-002, REQ-VID-NFR-002 |
| Mensageria e Filas (`projects/utils/project_msg.js`, RabbitMQ) | **Estender** | Criar nova fila dedicada (`video_operations_queue`) e contratos de mensagem com campos para tipo de operação, parâmetros validados e identificadores de correlação, preservando as filas existentes de imagem intactas. | REQ-VID-TASK-001, REQ-VID-TASK-002, REQ-VID-TASK-004, REQ-VID-NFR-002, REQ-VID-NFR-011 |
| Workers de Processamento (`Tools/` e serviços Python) | **Estender** | Desenvolver novos workers em Python com FFmpeg para recorte temporal, remoção de áudio, alteração de velocidade, marca de água e extração de fotogramas, suportando cancelamento e emissão de progresso. | REQ-VID-TRIM-008, REQ-VID-AUDIO-005, REQ-VID-SPEED-006, REQ-VID-WATERMARK-010, REQ-VID-FRAMES-009, REQ-VID-TASK-005, REQ-VID-NFR-003, REQ-VID-NFR-010 |
| Armazenamento de Objetos (`imageStorageService`, SeaweedFS/S3) | **Estender** | Suportar upload em streaming, leitura e geração de URLs assinados temporários para ficheiros de grande porte de vídeo (até 2 GB) e gestão de ficheiros temporários, sem colisão com artefactos de imagem. | REQ-VID-COM-002, REQ-VID-STORAGE-001, REQ-VID-UPLOAD-005 a 007, REQ-VID-ERROR-003, REQ-VID-NFR-001 |
| Subsistema de Autenticação JWT e Partilha (`shareAuth`) | **Estender** | Reutilizar a infraestrutura de validação de token JWT e permissões de link de partilha, adicionando a verificação de que o utilizador autenticado que dispara a operação é aquele a quem a quota diária é debitada. | REQ-VID-AUTH-001 a 003, REQ-VID-QUOTA-006, REQ-VID-NFR-001 |
| Serviço de Subscrições e Quotas (`users/`, `subscriptions/`) | **Alterar** | Manter o carregamento de vídeo isento de quota. Contabilizar operações de manipulação (1 operação = 1 crédito da quota diária de 5 ops do utilizador registado). Implementar mecanismos de reserva (`reserve`), consolidação (`commit`) e estorno (`rollback`). | REQ-VID-QUOTA-001 a 005, REQ-VID-UPLOAD-014, REQ-VID-NFR-008 |
| Gateway de WebSockets (`wsGateway`) | **Estender** | Suportar tópicos de progresso para tarefas de vídeo, transmitindo eventos de transição de estado e percentagem de progresso numérico (0–100%) para operações contínuas (marca de água e fotogramas). | REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-NFR-009 |
| Interface Web Frontend (`frontend/`) | **Estender** | Desenvolver componentes de UI dedicados a vídeo: zona de arrastamento e barra de upload, leitor multimédia integrado com controlos, seletores temporais de recorte, seletores de velocidade, painel de marca de água com pré-visualização e configurador de fotogramas. | REQ-VID-UPLOAD-001, REQ-VID-UPLOAD-002, REQ-VID-UPLOAD-015, REQ-VID-TRIM-001 a 004, REQ-VID-SPEED-001 a 003, REQ-VID-WATERMARK-001 a 009, REQ-VID-FRAMES-001 a 008, REQ-VID-TASK-004, REQ-VID-NFR-009 |

---

### 4.3 Matriz de Rastreabilidade

A matriz seguinte rastreia detalhadamente cada requisito do sistema até aos elementos concretos dos casos de uso (`UC-VID-000` a `UC-VID-005`) e às decisões de qualidade tomadas pela equipa.

#### 4.3.1 Matriz de Rastreabilidade Estruturada por Caso de Uso

##### Rastreabilidade — UC-VID-000 (Carregamento e Visualização de Vídeo)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-000 Pré-condições** | JWT válido, permissão no projeto, ficheiro local disponível | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-UPLOAD-001, REQ-VID-NFR-001 |
| **UC-VID-000 Passo 1** | Abertura do projeto e apresentação da interface de upload e limites | REQ-VID-UPLOAD-001, REQ-VID-NFR-008 |
| **UC-VID-000 Passo 2** | Seleção do ficheiro local e validação cliente de extensão/MIME | REQ-VID-UPLOAD-001, REQ-VID-UPLOAD-003 |
| **UC-VID-000 Passo 3** | Confirmação e streaming de envio com progresso percentual | REQ-VID-UPLOAD-005 |
| **UC-VID-000 Passo 4** | Receção, validação de tamanho e gravação no storage SeaweedFS/S3 com UUID | REQ-VID-UPLOAD-004, REQ-VID-UPLOAD-007, REQ-VID-NFR-008 |
| **UC-VID-000 Passo 5** | Inspeção FFprobe, validação H.264/AAC, teto de duração e metadados técnicos | REQ-VID-UPLOAD-008, REQ-VID-UPLOAD-009, REQ-VID-UPLOAD-010, REQ-VID-UPLOAD-011, REQ-VID-UPLOAD-013, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| **UC-VID-000 Passo 6** | Geração automática de miniatura JPEG e registo no MongoDB sem debitar quota | REQ-VID-UPLOAD-013, REQ-VID-UPLOAD-014, REQ-VID-STORAGE-001 |
| **UC-VID-000 Passo 7** | Conclusão do carregamento e exibição do vídeo na galeria do projeto | REQ-VID-UPLOAD-014, REQ-VID-STORAGE-001 |
| **UC-VID-000 Passo 8** | Abertura do reprodutor integrado com controlos e ferramentas de manipulação | REQ-VID-UPLOAD-015, REQ-VID-COM-001 |
| **UC-VID-000 FA1** | Carregamento por arrastamento (*drag-and-drop*) | REQ-VID-UPLOAD-002, REQ-VID-UPLOAD-003 |
| **UC-VID-000 FA2** | Cancelamento durante a transferência com limpeza de temporários | REQ-VID-UPLOAD-006, REQ-VID-ERROR-003 |
| **UC-VID-000 FA3** | Utilizador com perfil Premium (limites alargados 2 GB / 60 min) | REQ-VID-UPLOAD-004, REQ-VID-UPLOAD-011, REQ-VID-NFR-008 |
| **UC-VID-000 FA4** | Carregamento de vídeo sem stream de áudio (silencioso de origem) | REQ-VID-UPLOAD-010 |
| **UC-VID-000 Exceção 1** | Formato ou extensão não MP4 | REQ-VID-UPLOAD-003, REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-000 Exceção 2** | Tamanho do ficheiro superior ao limite do perfil | REQ-VID-UPLOAD-004, REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-000 Exceção 3** | Codecs internos não correspondentes a H.264/AAC | REQ-VID-UPLOAD-009, REQ-VID-UPLOAD-010, REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-000 Exceção 4** | Duração do vídeo superior ao limite do perfil | REQ-VID-UPLOAD-011, REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-000 Exceção 5** | Ficheiro corrompido ou cabeçalhos ilegíveis | REQ-VID-UPLOAD-012, REQ-VID-ERROR-001, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **UC-VID-000 Exceção 6** | Falha de rede ou interrupção durante a transferência | REQ-VID-UPLOAD-006, REQ-VID-ERROR-001, REQ-VID-ERROR-003 |
| **UC-VID-000 Garantia Sucesso** | Ficheiro gravado, metadados e miniatura no MongoDB, visível no leitor, sem débito de quota | REQ-VID-UPLOAD-007, REQ-VID-UPLOAD-013, REQ-VID-UPLOAD-014, REQ-VID-UPLOAD-015, REQ-VID-STORAGE-001 |
| **UC-VID-000 Garantia Mínima** | Sem artefactos residuais no storage, sem registos órfãos no MongoDB, projeto inalterado | REQ-VID-UPLOAD-006, REQ-VID-UPLOAD-012, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **UC-VID-000 RN1 a RN7** | Regras de autenticação, isenção de quota, MP4/H.264, limites, miniatura e reprodutor | REQ-VID-AUTH-001 a 002, REQ-VID-UPLOAD-003 a 015, REQ-VID-STORAGE-001 a 003, REQ-VID-NFR-003, REQ-VID-NFR-008 |

---

##### Rastreabilidade — UC-VID-001 (Recorte Temporal de Vídeo)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-001 Pré-condições** | JWT válido, permissão no projeto, vídeo MP4 elegível, sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| **UC-VID-001 Passo 1** | Seleção do vídeo e apresentação das operações disponíveis | REQ-VID-COM-001 |
| **UC-VID-001 Passo 2** | Apresentação dos controlos de intervalo temporal | REQ-VID-TRIM-001, REQ-VID-TRIM-002 |
| **UC-VID-001 Passo 3** | Definição do intervalo, sincronização com reprodução e duração estimada | REQ-VID-TRIM-001, REQ-VID-TRIM-002, REQ-VID-TRIM-003, REQ-VID-TRIM-004, REQ-VID-COM-004 |
| **UC-VID-001 Passo 4** | Confirmação da operação, validação e reserva de quota | REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-001 Passo 5** | Notificação de estados de tarefa `queued` e `processing` | REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-NFR-006 |
| **UC-VID-001 Passo 6** | Processamento assíncrono do recorte e consolidação de quota | REQ-VID-TRIM-008, REQ-VID-TRIM-009, REQ-VID-QUOTA-003, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-NFR-003 |
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
| **UC-VID-001 RN1 a RN9** | Regras de perfis, formato MP4, assincronismo, limites e quotas de trim | REQ-VID-AUTH-002, REQ-VID-TRIM-001 a 009, REQ-VID-QUOTA-001 a 005, REQ-VID-TASK-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |

---

##### Rastreabilidade — UC-VID-002 (Remoção de Áudio)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-002 Pré-condições** | JWT válido, permissão no projeto, vídeo com áudio elegível, sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-AUDIO-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-008 |
| **UC-VID-002 Passo 1** | Seleção do vídeo e verificação de presença de áudio | REQ-VID-COM-001, REQ-VID-AUDIO-001 |
| **UC-VID-002 Passo 2** | Confirmação explícita da operação, validação e reserva de quota | REQ-VID-COM-004, REQ-VID-AUDIO-004, REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-002 Passo 3** | Notificação de estados de tarefa `queued` e `processing` | REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-NFR-006 |
| **UC-VID-002 Passo 4** | Supressão de streams de áudio e preservação de stream visual por stream copy | REQ-VID-AUDIO-005, REQ-VID-AUDIO-006, REQ-VID-NFR-003 |
| **UC-VID-002 Passo 5** | Associação do resultado ao projeto e consolidação de quota | REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-STORAGE-002 |
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
| **UC-VID-003 Pré-condições** | JWT válido, permissão no projeto, vídeo MP4 elegível, sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| **UC-VID-003 Passo 1** | Apresentação do vídeo, predefinições de velocidade e campo numérico | REQ-VID-COM-001, REQ-VID-SPEED-001, REQ-VID-SPEED-002 |
| **UC-VID-003 Passo 2** | Indicação do fator e cálculo instantâneo da duração estimada | REQ-VID-SPEED-001, REQ-VID-SPEED-002, REQ-VID-SPEED-003, REQ-VID-COM-004 |
| **UC-VID-003 Passo 3** | Confirmação da operação, validação e reserva de quota | REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-003 Passo 4** | Notificação de estados de tarefa `queued` e `processing` | REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-NFR-006 |
| **UC-VID-003 Passo 5** | Processamento assíncrono com ajuste de vídeo e áudio sincronizado | REQ-VID-SPEED-006, REQ-VID-SPEED-007, REQ-VID-SPEED-008, REQ-VID-NFR-003 |
| **UC-VID-003 Passo 6** | Associação do resultado ao projeto e consolidação de quota | REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-STORAGE-002 |
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
| **UC-VID-004 Passo 3** | Entrada e validação do conteúdo da marca (texto ou ficheiro de imagem) | REQ-VID-WATERMARK-002, REQ-VID-WATERMARK-003, REQ-VID-WATERMARK-007 |
| **UC-VID-004 Passo 4** | Ajuste de posição, escala e opacidade com pré-visualização estática | REQ-VID-WATERMARK-004, REQ-VID-WATERMARK-005, REQ-VID-WATERMARK-006, REQ-VID-WATERMARK-008, REQ-VID-WATERMARK-009, REQ-VID-COM-004 |
| **UC-VID-004 Passo 5** | Confirmação da operação, validação e reserva de quota | REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-004 Passo 6** | Processamento com marca fixa e emissão de progresso WebSocket contínuo | REQ-VID-WATERMARK-010, REQ-VID-TASK-002, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| **UC-VID-004 Passo 7** | Remuxing de áudio original, associação ao projeto e consolidação de quota | REQ-VID-WATERMARK-011, REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-STORAGE-002, REQ-VID-NFR-003 |
| **UC-VID-004 Passo 8** | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
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
| **UC-VID-005 Pré-condições** | JWT válido, permissão no projeto, vídeo elegível, sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| **UC-VID-005 Passo 1** | Abertura do projeto, visualização do saldo de quota e limites | REQ-VID-COM-001, REQ-VID-QUOTA-001 |
| **UC-VID-005 Passo 2** | Apresentação do configurador com valores padrão | REQ-VID-FRAMES-001, REQ-VID-FRAMES-002, REQ-VID-FRAMES-003 |
| **UC-VID-005 Passo 3** | Parametrização de $[início, fim[$, passo N, formato e estimativa em tempo real | REQ-VID-FRAMES-001, REQ-VID-FRAMES-002, REQ-VID-FRAMES-003, REQ-VID-FRAMES-004, REQ-VID-COM-004 |
| **UC-VID-005 Passo 4** | Confirmação da operação, validação e reserva de quota | REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-005 Passo 5** | Notificação de estados de tarefa e emissão de progresso WebSocket | REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| **UC-VID-005 Passo 6** | Extração do fotograma disponível mais próximo para cada timestamp | REQ-VID-FRAMES-009, REQ-VID-FRAMES-010 |
| **UC-VID-005 Passo 7** | Inclusão atómica de imagens com metadados de timestamp e consolidação de quota | REQ-VID-FRAMES-010, REQ-VID-FRAMES-011, REQ-VID-FRAMES-012, REQ-VID-QUOTA-003, REQ-VID-NFR-004 |
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

#### 4.3.2 Verificações de Cobertura

- [x] **Cada requisito funcional e não funcional aparece na matriz**: Todos os 87 requisitos funcionais e 11 requisitos não funcionais da ERS estão mapeados na secção 4.3.
- [x] **Cada requisito tem origem identificada**: Todas as linhas possuem ligação direta a um passo do fluxo, exceção, regra de negócio ou decisão de qualidade documentada nos casos de uso.
- [x] **Todos os elementos relevantes dos casos de uso têm requisito associado**: Pré-condições, passos dos fluxos principais, fluxos alternativos, exceções, garantias pós-condicionais e regras de negócio de `UC-VID-000` a `UC-VID-005` estão integralmente cobertos.
- [x] **Os tópicos excluídos na secção 4.1.3 estão justificados**: O encadeamento de ferramentas entre vídeos e o processamento em lote de múltiplos vídeos foram formalmente excluídos do MVP na secção 4.1.3 com fundamentação de escopo.
- [x] **O impacto no sistema existente está atualizado e ligado aos requisitos relevantes**: A secção 4.2 abrange todos os serviços afetados, incluindo upload de vídeo, reprodutor integrado e serviços de storage SeaweedFS/S3 com os respetivos identificadores de requisitos.

---

### 4.4 Decisões de Qualidade e Arquitetura Introduzidas na ERS

| **ID** | **Decisão de Qualidade** | **Justificação** | **Requisito(s) Relacionado(s)** |
|---|---|---|---|
| **DQ-001** | Acesso restrito a utilizadores autenticados Registados e Premium com quota diária (5 ops/dia no plano Registado e ilimitado no Premium); exclusão de perfis anónimos. | Protege a capacidade de computação contra abusos e ataques de negação de serviço, sustentando o modelo de negócio da plataforma através de controlo transacional de créditos de processamento. | REQ-VID-AUTH-001 a 003, REQ-VID-QUOTA-001 a 005, REQ-VID-NFR-001, REQ-VID-NFR-008 |
| **DQ-002** | Contentor MP4 de entrada e saída com codecs H.264 (vídeo) e AAC (áudio); exportação de fotogramas em JPEG/PNG. | Garante 100% de interoperabilidade nos navegadores web modernos sem necessidade de transcodificação onerosa em tempo real durante o MVP da Fase 1. | REQ-VID-NFR-003, REQ-VID-NFR-004, REQ-VID-UPLOAD-003, REQ-VID-UPLOAD-009, REQ-VID-UPLOAD-010, REQ-VID-TRIM-008, REQ-VID-AUDIO-005, REQ-VID-SPEED-008, REQ-VID-WATERMARK-011, REQ-VID-FRAMES-003, REQ-VID-FRAMES-010 |
| **DQ-003** | Modelação explícita de recursos de vídeo na base de dados (MongoDB) e referência de proveniência (`sourceVideoId`). | Separa a semântica de fluxos contínuos audiovisuais dos artefactos de imagem estática, permitindo rastrear o histórico completo de transformações do projeto. | REQ-VID-STORAGE-001, REQ-VID-STORAGE-002, REQ-VID-COM-003, REQ-VID-UPLOAD-013, REQ-VID-FRAMES-012 |
| **DQ-004** | Orquestração assíncrona orientada a eventos via RabbitMQ e WebSockets com máquina de estados canónica (`queued → processing → completed \| failed \| cancelled`). | Desacopla o gateway HTTP da carga computacional pesada, assegurando que o utilizador recebe confirmação imediata e navega livremente enquanto o trabalho decorre. | REQ-VID-TASK-001 a 005, REQ-VID-NFR-005, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| **DQ-005** | Limites contratuais rígidos de duração e volume no MVP (Registado: $\leq 5$ min / 200 MB / 50 frames; Premium: $\leq 60$ min / 2 GB / 500 frames; máx. 1 tarefa ativa/projeto). | Evita o esgotamento do armazenamento e saturação dos workers por ficheiros anómalos durante a fase de validação funcional do produto. | REQ-VID-UPLOAD-004, REQ-VID-UPLOAD-011, REQ-VID-SPEED-005, REQ-VID-FRAMES-006, REQ-VID-NFR-008 |
| **DQ-006** | Semântica matemática de intervalo semiaberto `[início, fim[` para amostragem temporal com cardinalidade calculada por timestamps discretos $\text{início} + k \times N < \text{fim}$. | Elimina ambiguidades na contagem de fotogramas e garante que a estimativa apresentada na interface coincide exatamente com o número de ficheiros entregues no projeto. | REQ-VID-FRAMES-001, REQ-VID-FRAMES-002, REQ-VID-FRAMES-004, REQ-VID-FRAMES-005 |
| **DQ-007** | Garantia de não publicação parcial e estorno automático de quota perante cancelamento voluntário ou falha técnica. | Preserva a integridade e consistência transacional do projeto do utilizador, assegurando que este nunca fica com lotes parciais inúteis nem perde quota por anomalias do sistema. | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-004, REQ-VID-FRAMES-013, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| **DQ-008** | Imputação do consumo de quota à conta do utilizador executor da operação em projetos partilhados. | Impede que utilizadores convidados com permissão de edição esgotem a quota do dono do projeto, alinhando a responsabilidade de débito com o agente ativo. | REQ-VID-QUOTA-006 |
| **DQ-009** | Geometria estática invariante da marca de água ao longo de toda a duração temporal do vídeo. | Simplifica a validação e o algoritmo do worker na Fase 1 do MVP, garantindo consistência visual estável sem sobrecarga de interpolação espacial de keyframes. | REQ-VID-WATERMARK-004, REQ-VID-WATERMARK-008, REQ-VID-WATERMARK-010 |
| **DQ-010** | Distinção formal entre Alvo MVP e Alvo de Produção segundo a ISO/IEC 25010 para sustentação da Fase 2 de melhoria por refactoring. | Permite validar funcionalmente a extensão na Fase 1 sem impor prematuramente metas de alta disponibilidade, clusterização elástica ou SLA de produção industrial. | REQ-VID-NFR-001 a REQ-VID-NFR-011 |
| **DQ-011** | Isenção de consumo de quota diária para o carregamento e reprodução de vídeos no projeto. | Fomenta a adoção da plataforma permitindo que os utilizadores criem a sua mediateca e visualizem vídeos sem barreiras transacionais, incidindo a cobrança exclusivamente sobre as tarefas de processamento/manipulação. | REQ-VID-UPLOAD-014, REQ-VID-QUOTA-001 |

---

### 4.5 Questões em Aberto e Checklist de Entrega

### 4.5.1 Questões em Aberto Residuais

| **ID** | **Questão em Aberto** | **Impacto no MVP** | **Resolução Provisória Adotada para a Fase 1** |
|---|---|---|---|
| **Q-ERS-001** | Deve ser suportada a ingestão de vídeos através de URL externo (e.g. YouTube, HTTP direto) além do upload de ficheiro local? | Baixo | Rejeitada para o MVP. O upload é estritamente via ficheiro binário local para controlar os limites e a integridade de rede. |
| **Q-ERS-002** | Deve ser permitida a substituição direta de um ficheiro de vídeo existente mantendo o mesmo identificador de recurso? | Médio | Não permitida no MVP. O ficheiro original é imutável; novas versões geram novos recursos com novo UUID. |
| **Q-ERS-003** | Deve ser disponibilizada a seleção interativa da marca de água por arrastamento (*drag-to-position*) na interface web? | Baixo | Para o MVP, o posicionamento é feito através de botões predefinidos (cantos/centro) e campos numéricos de coordenadas X e Y. |

### 4.5.2 Lista de Verificação antes de Entregar

- [x] O caso de uso fundacional `UC-VID-000` (Carregamento, ingestão e visualização de vídeo) foi devidamente especificado e os seus 15 requisitos funcionais nucleares foram incorporados.
- [x] Todos os requisitos funcionais dos casos de uso `UC-VID-001` a `UC-VID-005` foram refinados e decompostos segundo o princípio da **estrita atomicidade**.
- [x] Cada requisito utiliza rigorosamente o fraseamento canónico *"O sistema deve..."* ou *"O sistema deve permitir ao {ator}..."*.
- [x] Os requisitos encontram-se organizados em ficheiros dedicados por caso de uso na pasta `docs/requirements/`, respeitando fielmente as colunas do template do Exercício 2.
- [x] Todos os requisitos possuem critérios de aceitação e verificação mensuráveis descritos no formato canónico *Dado... Quando... Então...*.
- [x] Os requisitos não funcionais encontram-se classificados segundo a norma **ISO/IEC 25010** e distinguem formalmente o **Alvo MVP** do **Alvo de Produção**.
- [x] A matriz de rastreabilidade (secção 4.3) estabelece uma cobertura bidirecional exaustiva, garantindo zero requisitos órfãos e zero passos/exceções/regras de negócio por cobrir.
- [x] A análise de impacto no sistema existente (secção 4.2) mapeia todos os componentes afetados pela ingestão de vídeo e pelas ferramentas de manipulação.
- [x] As decisões de qualidade e arquitetura (`DQ-001` a `DQ-011`) encontram-se catalogadas com justificações técnicas e ligação aos requisitos correspondentes.
