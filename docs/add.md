# 🏛️ Architecture Design Document (ADD)
### Fase 1: Suporte a Vídeo no PictuRAS · Decisões de Arquitetura e Implementação (UC-VID-006 a UC-VID-015)

---

## 0. Identificação do Documento

| **Campo** | **Valor** |
|---|---|
| **Grupo / Equipa** | Grupo 27 |
| **Autores** | Equipa PictuRAS-27 |
| **Data** | 2026-10-19 |
| **Versão do documento** | v1.0 (primeira versão do ADD) |
| **Âmbito** | UC-VID-006 a UC-VID-015, requisitos comuns `REQ-VID-COM-006`, `REQ-VID-QUOTA-007/008`, `REQ-VID-STORAGE-002/004`, `REQ-VID-TASK-006/007`, `REQ-VID-UPLOAD-016/017` e não funcionais `REQ-VID-NFR-012` a `016` |
| **Unidade Curricular** | Requisitos e Arquiteturas de Software — MEI, Universidade do Minho |

---

## 1. Introdução

### 1.1 Objetivo

Este documento regista as decisões de arquitetura e de implementação para os dez novos casos de uso de vídeo (UC-VID-006 a UC-VID-015) e para os requisitos comuns e não funcionais introduzidos na ERS v2.3. Para cada requisito, a decisão segue esta ordem de preferência:

1. Reutilizar um componente existente tal como está;
2. Adaptar ou estender um componente existente;
3. Usar uma biblioteca ou framework que já está no projeto;
4. Introduzir uma biblioteca nova e consolidada (só com justificação);
5. Criar código novo de raiz (só quando nada acima serve).

### 1.2 Âmbito

- **Dentro do âmbito:** o desenho dos componentes e das pipelines necessários para UC-VID-006 a UC-VID-015, incluindo os componentes transversais partilhados (secção 3).
- **Fora do âmbito:** a implementação. Este documento não altera código nem outros documentos.
- **Pré-requisito declarado:** a análise do código (secção 2.5) mostra que **a fundação de vídeo (UC-VID-000 a UC-VID-005) ainda não está implementada**. Os novos casos de uso dependem dela. A secção 3.1 resume o mínimo dessa fundação de que este ADD depende, sem a redesenhar por completo.

### 1.3 Documentos de referência

| **Documento** | **Conteúdo relevante** |
|---|---|
| [`docs/requirements.md`](requirements.md) | ERS v2.3: catálogo de requisitos, tabela de impacto (4.2), DQ-001 a DQ-025 (4.4), Q-ERS-001 a 009 (4.5) |
| [`docs/use-cases.md`](use-cases.md) | Índice dos casos de uso v1.4 |
| [`docs/use-cases/UC-VID-006.md`](use-cases/UC-VID-006.md) a [`UC-VID-015.md`](use-cases/UC-VID-015.md) | Fluxos, exceções, regras de negócio, assunções e questões dos novos casos de uso |
| [`docs/use-cases/UC-VID-000.md`](use-cases/UC-VID-000.md) a [`UC-VID-005.md`](use-cases/UC-VID-005.md) | Fundação de vídeo (pré-requisito) |
| [`docs/requirements/`](requirements/) | `REQ-VID-COM`, `DOWNLOAD`, `INFO`, `ADJUST`, `FILTER`, `RESIZE`, `ORIENT`, `CONVERT`, `CONCAT`, `CHAIN`, `BATCH`, `NFR`, `UPLOAD` |
| `README.md` | Descrição da arquitetura de microsserviços e das funcionalidades existentes |
| `docker-compose.yaml` | Topologia de serviços, volumes e redes |

---

## 2. Arquitetura Atual

### 2.1 Componentes

| **Componente** | **Pasta / imagem** | **Responsabilidade atual** |
|---|---|---|
| Reverse proxy | `nginx/nginx.conf` (`nginx:latest`) | Termina TLS (porta 8080→443) e encaminha `/` → frontend, `/api-gateway/` → API Gateway, `/socket.io` → WS Gateway, `/s3/` → SeaweedFS (URLs pré-assinados públicos) |
| Frontend | `frontend/` (Next.js) | Editor de projetos de imagem: toolbar de ferramentas (`components/toolbar/`), lista de ferramentas aplicadas ordenável (`applied-tools-list.tsx`, `sortable-tool-item.tsx`), predefinições (`components/presets/presets-dialog.tsx`), progresso por WebSocket (`app/dashboard/[pid]/page.tsx`) |
| API Gateway | `apiGateway/` | Valida o JWT (`auth/auth.js`) e reencaminha pedidos para os serviços (`routes/projects.js`, `users.js`, `subscriptions.js`), propagando `Authorization` e `X-Caller-Id` |
| Serviço de Projetos | `projects/` | Gestão de projetos, imagens e ferramentas; orquestração do processamento (`routes/projects.js`); partilha (`middleware/shareAuth.js`); controlo de versão otimista (`middleware/projectVersion.js`); presença de editores (`middleware/enforcePresenceLimit.js`); cache de pré-visualizações (`models/previewCache.js`, `utils/cacheKey.js`) |
| Serviço de Utilizadores | `users/` | Contas, tipo de utilizador (`anonymous`, `free`, `premium`), quota diária (`routes/users.js`: `GET /:user/process/:n`, `POST /:user/process/refund/:n`), predefinições de ferramentas (`models/preset.js`, `routes/presets.js`) |
| Serviço de Subscrições | `subscriptions/` | Planos e cartões |
| Armazenamento de objetos | `imageStorageService/` + `seaweedfs` (`chrislusf/seaweedfs:4.47`) | Upload, cópia, remoção e URLs pré-assinados (`services/getPresignedUrl.js`) num bucket por utilizador (`user-<id>`) com chaves `<projectId>/<stage>/<uuid>.<ext>`; estágios permitidos em `utils/stages.js`: `src`, `preview`, `preview_cache`, `out` |
| Broker | `rabbitMQ/` (`rabbitmq:4.0.5-management`) | Exchange direta `picturas`; uma fila por ferramenta (`<tool>_queue`), `project_queue` (respostas dos workers) e `ws_queue` (notificações), declaradas em `rabbitMQ/definitions.json` |
| Workers de imagem | `Tools/<tool>/` | Um contentor Python por ferramenta; consomem a sua fila, leem e escrevem ficheiros no volume partilhado `image_data` e respondem em `project_queue`. Utilitários comuns em `Tools/utils/` (`rabbit_mq.py`, `tool_msg.py`, `img_handler.py`, `env.py`) |
| Worker de marca de água | imagem externa `prcsousa/picturas-watermark-tool-ms:latest` | Consome `watermark_queue`; **o código-fonte não está neste repositório** |
| Mock generativo | `generative-mock/` | API local que simula o Stable Diffusion WebUI para `expand_ai` |
| WS Gateway | `wsGateway/` | Socket.IO; autentica o JWT na ligação e junta o socket à sala do utilizador e à sala `project:<id>`; consome `ws_queue` e emite `preview-ready`, `preview-error`, `process-update`, `process-error`, `project-op`, `project-updated` |
| Bases de dados | `projects_mongoDB`, `users_mongoDB`, `subscriptions_mongoDB` (`mongo:4.4`) | Persistência por serviço; cópia diária com `mongodump` (`mongo-backup`) |

### 2.2 Pipeline de processamento atual (imagem)

O processamento de imagem já é um **executor de cadeias orientado a mensagens**: as ferramentas do projeto (`project.tools`, ordenadas por `position`) são aplicadas a cada imagem, uma ferramenta de cada vez, e o orquestrador em `projects/routes/projects.js` (`process_msg`) avança para o passo seguinte quando o worker responde.

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend (Next.js)
    participant NG as nginx
    participant GW as API Gateway
    participant PR as projects
    participant US as users
    participant ST as imageStorageService
    participant S3 as SeaweedFS (S3)
    participant MQ as RabbitMQ (exchange picturas)
    participant TW as Worker (Tools/tool)
    participant WS as wsGateway

    FE->>NG: POST /api-gateway/projects/:user/:project/process (JWT)
    NG->>GW: proxy
    GW->>GW: auth.checkToken (JWT)
    GW->>PR: POST /:user/:project/process (+X-Caller-Id)
    opt existem ferramentas avançadas (IA)
        PR->>US: GET /:user/process/:n (verifica e reserva n créditos)
        US-->>PR: true / 701
    end
    PR->>PR: activeToken++ (nova execução)
    loop por cada imagem
        PR->>ST: GET /image/internal/.../src/:key
        ST-->>PR: URL pré-assinado interno
        PR->>S3: GET original → volume image_data
        PR->>PR: Process.create (cur_pos = 0, token)
        PR->>MQ: publish <tool[0]>_queue
    end
    PR-->>FE: 201
    MQ->>TW: mensagem com procedure e parameters
    TW->>TW: lê/escreve ficheiro no volume image_data
    TW->>MQ: publish project_queue (success/error)
    MQ->>PR: process_msg()
    PR->>PR: guard activeToken, apaga Process, cria Process(cur_pos+1)
    PR->>MQ: publish ws_queue (update-client-process-*)
    MQ->>WS: consome ws_queue
    WS-->>FE: emit process-update (sala do utilizador)
    alt último passo da cadeia
        PR->>ST: POST /upload/.../out (FormData)
        PR->>PR: Result.create(token) e commit (committedToken)
    else há passo seguinte
        PR->>MQ: publish <tool[k+1]>_queue
    end
    FE->>GW: GET /:user/:project/process/url
    GW->>PR: proxy
    PR->>ST: URLs pré-assinados públicos (stage out)
    PR-->>FE: lista de URLs (servidos por nginx /s3/)
```

Mecanismos existentes relevantes para os novos requisitos:

| **Mecanismo** | **Onde** | **Como funciona** |
|---|---|---|
| Cancelamento por *token* | `projects/routes/projects.js` (`DELETE /:user/:project/process`, guard em `process_msg`) | O cancelamento incrementa `activeToken`; respostas de workers com outro `token` são ignoradas; os `Result` do token cancelado são apagados e os créditos pendentes devolvidos. Os workers **não** são interrompidos. |
| Reserva e devolução de quota com N créditos | `users/routes/users.js` (`GET /:user/process/:n`, `POST /:user/process/refund/:n`, `check_process`) | A reserva já aceita N créditos; para `premium` é sempre aceite; `FREE_DAILY_OP=5` em `docker-compose.yaml`. A reserva **é** o débito: não existe um passo de confirmação separado. |
| Pré-visualização assíncrona | `POST /:user/:project/preview/:img` | Corre a cadeia completa numa imagem via workers e responde por WebSocket (`preview-ready`); cache por `sha256` da imagem e das ferramentas (`utils/cacheKey.js`). |
| Pré-visualização síncrona com `sharp` | `applyToolsPreview` em `projects/routes/projects.js` | Aplica brilho (`modulate`), saturação (`modulate`) e contraste (`linear(c, 128·(1−c))`) num buffer em memória, sem workers. Usado pelo assistente de IA. |
| Descarregamento em ZIP | `GET /:user/:project/process` | Descarrega os resultados para disco temporário e gera um ZIP em memória com `jszip`. No frontend, `lib/projects.ts` (`downloadProjectImages`) também gera ZIPs no navegador. |
| Predefinições de cadeias | `users/models/preset.js`, `users/routes/presets.js`, `frontend/components/presets/presets-dialog.tsx` | Guardam `[{procedure, params}]` por utilizador com nome único e partilha por link. |
| Permissões de partilha | `projects/middleware/shareAuth.js` | `checkSharePermission` (leitura) e `requireEditPermission` (edição). |
| Notificações de co-edição | `send_msg_project_op` em `projects/utils/project_msg.js` | Eventos `project-op` para a sala `project:<id>`. |

### 2.3 Pipelines de build, CI/CD e deploy

| **Aspeto** | **Estado atual** |
|---|---|
| CI/CD | **Não existe.** A pasta `.github/` contém apenas `agents/` e `prompts/` do specsmd; não há `.github/workflows/`. Não existem testes automáticos nos serviços (`wsGateway/package.json` tem `"test": "echo \"Error: no test specified\""`). |
| Build | Cada serviço tem o seu `Dockerfile`; os workers de imagem usam `Tools/` como contexto (`dockerfile: <tool>/Dockerfile`) e copiam `Tools/utils/`. O frontend faz `bun run build` na imagem. |
| Deploy | `docker compose up` numa única máquina, rede `elk`, volumes nomeados (`image_data`, `seaweedfs_data`, `rabbitmq_data`, `project_data`, `user_data`, `subscription_data`). O stack ELK está comentado em `docker-compose.yaml`; os logs vão apenas para `stdout`. |
| Configuração | Variáveis de ambiente em `docker-compose.yaml` (credenciais RabbitMQ e S3, `JWT_SECRET_KEY`, `FREE_DAILY_OP`) e `.env.example`. |

### 2.4 Stack tecnológico

| **Framework / biblioteca** | **Versão** | **Onde é usado** |
|---|---|---|
| Next.js | 15.1.3 | `frontend/package.json` |
| React / React DOM | ^19.0.0 | `frontend/package.json` |
| TypeScript | ^5 | `frontend/package.json` |
| Tailwind CSS | ^3.4.1 | `frontend/package.json` |
| @tanstack/react-query | ^5.63.0 | `frontend/lib/queries/`, `frontend/lib/mutations/` |
| socket.io-client | ^4.8.1 | `frontend/lib/queries/projects.ts` (`useGetSocket`) |
| @dnd-kit/core / @dnd-kit/sortable | ^6.3.1 / ^10.0.0 | `frontend/components/toolbar/sortable-tool-item.tsx` |
| Radix UI (slider, progress, checkbox, dialog, select, tabs) | ^1.2.2, ^1.1.1, ^1.1.3, ^1.1.4, ^2.1.4, ^1.1.2 | `frontend/components/ui/` |
| react-dropzone | ^14.3.5 | `frontend/components/app-dropzone.tsx` |
| jszip | ^3.10.1 | `frontend/lib/projects.ts`, `frontend/lib/utils.ts`, `projects/routes/projects.js` |
| Bun / Node (frontend) | 1.1.32 / `node:18` | `frontend/.tool-versions`, `frontend/Dockerfile` |
| Express | ~4.16.1 (projects, users, apiGateway), ^4.21.2 (imageStorageService, wsGateway) | `*/package.json` |
| Mongoose | ^8.9.3 | `projects/`, `users/` |
| amqplib | ^0.10.5 | `projects/utils/rabbit_mq.js`, `wsGateway/utils/rabbit_mq.js` |
| sharp | ^0.33.0 | `projects/routes/projects.js` (`applyToolsPreview`) |
| multer | ^1.4.5-lts.1 (`memoryStorage`) | `apiGateway/`, `projects/`, `imageStorageService/` |
| uuid | ^11.0.5 | `projects/` |
| jsonwebtoken | ^9.0.x | `apiGateway/`, `projects/`, `users/`, `wsGateway/` |
| aws-sdk (JavaScript v2) | ^2.1692.0 | `imageStorageService/services/s3Client.js` |
| socket.io | ^4.8.1 | `wsGateway/index.js` |
| Node (backend) | `node` sem versão fixa (`node:18` no wsGateway) | `*/Dockerfile` |
| Python | 3.11-slim (3.10 em `expand_ai`) | `Tools/*/Dockerfile` |
| pika | 1.3.2 | `Tools/utils/rabbit_mq.py` |
| Pillow | 11.0.0 | `Tools/*/requirements.txt` (`ImageEnhance` em `brightness`, `contrast`, `saturation`) |
| opencv-python-headless | 4.10.0.84 | ferramentas de IA |
| requests | 2.32.3 | `Tools/expand_ai/requirements.txt` |
| RabbitMQ | 4.0.5-management | `rabbitMQ/Dockerfile` |
| MongoDB | 4.4 | `docker-compose.yaml` |
| SeaweedFS | 4.47 | `docker-compose.yaml` |
| nginx | latest | `docker-compose.yaml` |
| FFmpeg / FFprobe | **não existe no projeto** | — |

### 2.5 Estado das operações de vídeo (UC-VID-000 a UC-VID-005) e das ferramentas de imagem

**Vídeo.** Uma pesquisa por `video`, `ffmpeg` e `mp4` em todo o código (excluindo `docs/`, `memory-bank/` e a configuração do specsmd) não devolve resultados. Os UC-VID-000 a UC-VID-005 estão **especificados mas não implementados**. Em concreto, não existem:

- modelo de recurso de vídeo no MongoDB, rotas de vídeo no API Gateway ou no serviço de projetos;
- fila `video_operations_queue` em `rabbitMQ/definitions.json`;
- workers com FFmpeg, nem FFmpeg em nenhum `Dockerfile`;
- leitor de vídeo, componentes de vídeo ou validação de MIME de vídeo no frontend;
- estágios de armazenamento para vídeo em `imageStorageService/utils/stages.js`.

Por isso, o recorte, o áudio, a velocidade, a marca de água e a extração de fotogramas **não podem ser reutilizados**: têm de ser construídos (secção 3.1), e os novos casos de uso assentam nessa construção.

**Ferramentas de imagem que servem de referência:**

| **Ferramenta** | **Implementação** | **Parâmetros** | **O que se aproveita para vídeo** |
|---|---|---|---|
| Brilho | `Tools/brightness/brightness.py` (`ImageEnhance.Brightness`) | `brightness` ∈ [0, 2], neutro 1 (`frontend/lib/tool-types.ts`) | Semântica e nome do parâmetro (DQ-020); UI `frontend/components/toolbar/brightness-tool.tsx` |
| Contraste | `Tools/contrast/contrast.py` (`ImageEnhance.Contrast`) | `contrastFactor` ∈ [0, 2] | Semântica; UI `contrast-tool.tsx` |
| Saturação | `Tools/saturation/saturation.py` (`ImageEnhance.Color`) | `saturationFactor` ∈ [0, 2] | Semântica; UI `saturation-tool.tsx` |
| Redimensionamento | `Tools/resize/resize.py` (`Image.resize`) | `width`, `height` | Nomes dos parâmetros; UI `resize-tool.tsx` |
| Rotação | `Tools/rotate/rotate.py` (`Image.rotate(expand=True)`) | `degrees` ∈ [0, 360] | UI `rotate-tool.tsx` (o vídeo restringe a 90/180/270 e acrescenta espelho) |
| Reflexão (espelho) | **não existe** como ferramenta de imagem | — | Nada a reutilizar |
| Marca de água | imagem externa `prcsousa/picturas-watermark-tool-ms` | `{}` em `watermark-tool.tsx` | Nada (código não disponível) |
| Estrutura comum dos workers | `Tools/utils/tool_msg.py`, `Tools/utils/rabbit_mq.py`, `Tools/utils/env.py` | — | Contrato de mensagens (`messageId`, `correlationId`, `status`, `output`, `error`, `metadata.processingTime`), ligação ao RabbitMQ |

---

## 3. Decisões Transversais

Componentes partilhados por vários casos de uso, desenhados uma única vez. As secções 4.x referenciam-nos pelo identificador **T-xx**.

### T-00 — Pré-requisito: fundação de vídeo mínima

**Decisão: Criar** (não existe nada a reutilizar, ver 2.5). Os UC-VID-006 a 015 precisam, no mínimo, de:

| **Elemento** | **Desenho** | **Requisitos** |
|---|---|---|
| Coleção `videos` (MongoDB do serviço de projetos) | Novo modelo `projects/models/video.js`, separado de `project.imgs` | REQ-VID-STORAGE-001 a 004, REQ-VID-UPLOAD-013, REQ-VID-INFO-007/008 |
| Estágios de armazenamento de vídeo | Acrescentar a `imageStorageService/utils/stages.js`: `video_src`, `video_out`, `video_preview`, `video_thumb`, `video_zip` | REQ-VID-UPLOAD-007, 016; REQ-VID-BATCH-015 |
| Worker de vídeo com FFmpeg | `Tools/video/` (ver T-02) | REQ-VID-NFR-010, 011 |
| Fila de vídeo | `video_operations_queue` e exchange de controlo `video_control` em `rabbitMQ/definitions.json` | REQ-VID-NFR-011 |
| Tarefas de vídeo | Modelo `VideoTask` (ver T-03) | REQ-VID-TASK-001 a 007 |
| Ingestão | FFprobe extrai metadados; geração de miniatura, de fotograma de pré-visualização e, para MOV/AVI, da cópia MP4 (T-06) | REQ-VID-UPLOAD-008 a 017 |

Esquema proposto para a coleção `videos` (campos usados pelos novos casos de uso):

| **Campo** | **Tipo** | **Uso** |
|---|---|---|
| `_id`, `project_id`, `owner_id`, `created_by` | ObjectId | Identidade, permissões (STORAGE-003), quota do executor (QUOTA-006) |
| `original_name` | String | Nome sugerido no descarregamento (DOWNLOAD-005) |
| `status` | `queued \| processing \| completed \| failed` | Disponibilidade para descarregar e consultar (DOWNLOAD-003, INFO Exceção 3) |
| `storage.original_key`, `storage.preview_key`, `storage.thumb_key`, `storage.first_frame_key` | String | Ficheiro armazenado, cópia MP4 (DQ-012), miniatura, fotograma 0 para pré-visualizações (T-07) |
| `meta.container`, `meta.video_codec`, `meta.audio_codec` (ou `null`) | String | Formato (INFO-004, CONVERT-001) |
| `meta.width`, `meta.height`, `meta.rotation`, `meta.display_width`, `meta.display_height` | Number | Resolução apresentada (INFO-003, UC-VID-011 Q2) |
| `meta.fps_num`, `meta.fps_den`, `meta.duration_ms`, `meta.size_bytes`, `meta.bitrate`, `meta.has_audio` | Number / Boolean | INFO-002/005/006, validação de passos (CHAIN-003), pré-validação de lotes (BATCH-004) |
| `source_video_id` / `source_video_ids` | ObjectId / [ObjectId] | Proveniência (STORAGE-002) |
| `recipe` | `[{operation, parameters, clips?}]` | Descrição dos passos (STORAGE-004, INFO-008) |
| `task_id`, `batch_id` | ObjectId | Ligação à tarefa e ao lote |

**Porquê uma coleção separada e não `project.imgs`:** o projeto usa controlo de versão otimista (`updateIfVersion`, `requireProjectVersion`). Se os workers atualizassem o estado do vídeo dentro do documento do projeto, cada atualização incrementaria a versão e provocaria respostas 409 aos colaboradores que estão a editar. Uma coleção própria evita esses conflitos e segue a tabela de impacto 4.2 da ERS ("esquema específico para recursos de vídeo (`videos`)").

### T-01 — Contrato uniforme de operação (REQ-VID-COM-006)

**Decisão: Criar**, seguindo o padrão `{procedure, params}` já usado em `project.tools` e em `users/models/preset.js`.

- **Contrato:** cada passo é `{ operation, parameters }`. Uma operação isolada é uma cadeia com um passo; uma cadeia tem N passos; um lote aplica a mesma cadeia a vários vídeos. A junção é um passo especial `{ operation: "concat", parameters: {}, clips: [{ videoId, steps: [...] }] }`.
- **Registo de operações no serviço de projetos** (`projects/video/operations/<op>.js`, um módulo por operação), cada um com:
  - `validate(parameters, inputProps, profile)` → lista de erros `{field, code}` (`INVALID_ADJUST_PARAMS`, `NO_CHANGES`, ...);
  - `estimate(inputProps, parameters)` → propriedades à saída (duração, resolução, fps, áudio, contentor), usadas na validação do passo seguinte (CHAIN-003, BATCH-004);
  - `cost` → créditos (1 por operação, 1 pela junção, DQ-014);
  - `copyable(inputProps, parameters)` → indica se a operação pode ser feita por cópia de streams (T-05).
- **Registo de operações no worker** (`Tools/video/ops/<op>.py`): cada módulo traduz `parameters` em filtros FFmpeg (ver T-02).
- **Validação:** feita no serviço de projetos com funções escritas à mão, como no resto do código, sem acrescentar uma biblioteca de validação. O frontend chama `POST /projects/:user/:project/videos/validate` para validar em tempo real (uma única fonte de verdade) e só faz no cliente as verificações triviais (intervalos dos controlos).

| **Alternativa** | **Vantagens** | **Desvantagens** |
|---|---|---|
| **Registo de operações em JS + endpoint de validação (escolhida)** | Uma única implementação das regras; o frontend e a API nunca divergem; não há dependências novas | Uma ida ao servidor por cada alteração (aceitável: resposta síncrona sem fila) |
| Duplicar as regras em TypeScript no frontend | Validação instantânea no cliente | Duas implementações a manter; risco de divergência (contradiz COM-006) |
| JSON Schema + `ajv` (nova dependência) | Esquemas declarativos partilháveis | Não exprime regras dependentes do passo anterior (CHAIN-003) nem do perfil; dependência nova sem ganho suficiente |

### T-02 — Worker de vídeo e executor de cadeias com um único *filtergraph*

**Decisão: Criar** o worker `Tools/video/` e **Adaptar** os utilitários `Tools/utils/` (contrato de mensagens e ligação RabbitMQ).

- **Um worker de vídeo único** (`Tools/video/video.py`), com um módulo por operação (`Tools/video/ops/`), em vez de um contentor por ferramenta como nas imagens. Os passos de uma cadeia são compostos numa **única invocação FFmpeg** (`-filter_complex`), para cumprir REQ-VID-NFR-013 (no máximo uma recodificação por cadeia).
- **FFmpeg e FFprobe** instalados na imagem Docker (`apt-get install ffmpeg` sobre `python:3.11-slim`, o mesmo padrão de `Tools/brightness/Dockerfile`), chamados com `subprocess`. O progresso é lido de `-progress pipe:1` (`out_time_ms` a dividir pela duração estimada) e emitido pelo menos uma vez por segundo (REQ-VID-NFR-009).
- **Entrada e saída por URL pré-assinado**, sem passar pelo volume partilhado `image_data` nem pelo `multer` em memória: o worker descarrega o original com um URL pré-assinado interno (GET), processa num diretório temporário próprio da tarefa (`/tmp/video/<taskId>/`) e envia o resultado com um URL pré-assinado de escrita (PUT) gerado pelo `imageStorageService` (ver T-08). Para os pedidos HTTP usa-se `requests`, que já está no projeto (`Tools/expand_ai/requirements.txt`).
- **Composição por tipo de operação:**

| **Operação** | **Filtros / opções FFmpeg** |
|---|---|
| Recorte | `trim`/`atrim` + `setpts=PTS-STARTPTS` (ou `-ss/-to` quando é só cópia, T-05) |
| Remover áudio | `-an` (o ramo de áudio é descartado) |
| Velocidade | `setpts=PTS/f`; `atempo` encadeado para fatores fora de [0.5, 2] (e.g. `atempo=0.5,atempo=0.5` para 0.25×) |
| Marca de água | `overlay` (imagem com `format=rgba`, `colorchannelmixer=aa=<opacidade>`) ou `drawtext` |
| Ajuste | brilho por `colorchannelmixer=rr=f:gg=f:bb=f`; contraste por `eq=contrast=c`; saturação por `eq=saturation=s` (ver 4.3) |
| Filtro | `colorchannelmixer` com a matriz do catálogo (T-07) ou `negate` |
| Redimensionamento | `scale=w:h,setsar=1` |
| Orientação | `transpose=1` (90°), `transpose=1,transpose=1` (180°), `transpose=2` (270°), seguido de `hflip`/`vflip` |
| Junção | sub-grafo por clip → `scale+pad+fps+setsar` (normalização ao primeiro clip), `anullsrc` para clips sem áudio, `aresample/aformat` → `concat=n=N:v=1:a=1` |
| Conversão (último passo) | escolha do contentor e dos codecs de saída (T-05) |

- **Codificação de saída por omissão:** `libx264` + `aac`, `-pix_fmt yuv420p`, `-movflags +faststart` (reprodução progressiva no `<video>`). O CRF e o *preset* ficam por definir (questão Q-ADD-11).

```mermaid
flowchart LR
    subgraph projects["projects (orquestrador)"]
        A["Pedido {steps}"] --> B[Validar com o registo de operações T-01]
        B --> C[Reservar créditos T-04]
        C --> D[VideoTask queued T-03]
    end
    D -->|video_operations_queue| W
    subgraph W["Tools/video (worker)"]
        E[Descarregar originais<br/>URL pré-assinado GET] --> F[Compilar plano:<br/>cópia T-05 ou filtergraph único]
        F --> G[ffmpeg -filter_complex ... -progress pipe:1]
        G --> H[Upload resultado + cópia MP4 T-06<br/>URL pré-assinado PUT]
    end
    G -.progresso 1/s.-> WS[ws_queue → wsGateway]
    H -->|project_queue| I[projects: cria recurso em videos,<br/>commit/refund, notifica]
```

| **Alternativa** | **Vantagens** | **Desvantagens** |
|---|---|---|
| **Worker único com filtergraph composto (escolhida)** | Uma recodificação por cadeia (NFR-013); sem intermédios no projeto (CHAIN-011); um só `Dockerfile` com FFmpeg | Afasta-se do padrão "um contentor por ferramenta" das imagens; o compilador de grafos é a peça mais complexa |
| Reutilizar o executor de imagem (`process_msg`): um worker por operação, ficheiros intermédios no volume | Reutiliza o orquestrador tal como está | Recodifica a cada passo (viola NFR-013) ou exige intermédios sem perdas enormes (vídeos até 2 GB); progresso global difícil |
| Biblioteca `ffmpeg-python` (nova) | Construção de grafos mais legível | Sem manutenção ativa; não resolve o progresso nem o cancelamento; dependência nova |
| PyAV (nova) | Controlo fotograma a fotograma | Implementação muito maior; reimplementa filtros que o FFmpeg já oferece |
| Worker em Node (`fluent-ffmpeg`) | Mesma linguagem do orquestrador | Os workers do projeto são Python (`Tools/`); biblioteca marcada como descontinuada |

### T-03 — Tarefas, máquina de estados, progresso e cancelamento

**Decisão: Adaptar** o padrão de orquestração existente (registo em MongoDB criado antes de publicar a mensagem, correlação por `messageId`, *guard* por token em `process_msg`) e **Criar** o modelo `VideoTask`.

- **Modelo `projects/models/videoTask.js`:** `status` (`queued`, `processing`, `completed`, `failed`, `cancelled`), `kind` (`single`, `chain`, `concat`, `batch_item`), `steps`, `step`, `total_steps`, `progress`, `cost`, `reserved_credits`, `runner_id`, `owner_id`, `project_id`, `input_video_ids`, `result_video_id`, `batch_id`, `correlation_id`, `error`. O modelo `Process` existente (`projects/models/process.js`) não serve: exige `img_id`/`og_img_uri` e é apagado a cada passo.
- **Uma tarefa ativa por projeto** (REQ-VID-NFR-008, DQ-016): `findOneAndUpdate({ _id: projectId, active_video_task: null }, { $set: { active_video_task: taskId } })`, uma operação atómica que não usa `updateIfVersion` (para não colidir com a versão de co-edição). Um lote ocupa este lugar durante toda a execução.
- **Eventos do worker:** transições de estado (`started`, `completed`, `failed`, `cancelled`) vão para `project_queue`, onde o orquestrador persiste o estado e decide o resto (quota, criação do recurso). Os eventos de progresso vão diretamente para `ws_queue` com `user`, `projectId`, `taskId`, `step`, `totalSteps` e `progress`, para não escrever no MongoDB uma vez por segundo.
- **WebSocket:** estender `wsGateway/index.js` com os eventos `video-task-update` e `video-batch-update`, emitidos para a sala do utilizador executor e para `project:<id>`.
- **Cancelamento** (REQ-VID-TASK-004/005), que o executor de imagem não suporta (não interrompe os workers):
  1. O orquestrador marca a tarefa como `cancelled` e publica `{taskId}` na exchange *fanout* `video_control`.
  2. Cada réplica do worker mantém um conjunto de `taskId` cancelados (com TTL), alimentado por uma ligação RabbitMQ própria numa *thread* separada (o `BlockingConnection` do pika não é *thread-safe*).
  3. Se a tarefa estiver a correr, o worker termina o processo `ffmpeg`, apaga `/tmp/video/<taskId>/` e responde `cancelled`. Se ainda estiver na fila, o worker descarta-a ao consumi-la.
  4. Como no executor de imagem, o orquestrador ignora respostas de tarefas que já não estão ativas.
- **Robustez do consumo:** usar `auto_ack=False` com `basic_qos(prefetch_count=1)` e confirmar a mensagem só no fim da tarefa. Os workers atuais usam `auto_ack=True` (`Tools/utils/rabbit_mq.py`), que perde a mensagem se o worker cair a meio. O FFmpeg corre numa *thread* separada para o pika continuar a responder aos *heartbeats* durante tarefas longas.

```mermaid
stateDiagram-v2
    [*] --> queued: aceitação (créditos reservados)
    queued --> processing: worker inicia
    queued --> cancelled: cancelar (refund)
    processing --> completed: sucesso (recurso criado)
    processing --> failed: erro (refund, purga)
    processing --> cancelled: cancelar (kill ffmpeg, refund, purga)
    completed --> [*]
    failed --> [*]
    cancelled --> [*]
```

### T-04 — Reserva de quota com vários créditos (REQ-VID-QUOTA-007/008)

**Decisão: Reutilizar** os endpoints do serviço de utilizadores tal como estão.

- **Reserva:** `GET users:/:user/process/:n` com `n` = custo total (cadeia: N passos; lote: custo × vídeos elegíveis). Já verifica o saldo e debita os `n` créditos de uma vez (`check_process` em `users/routes/users.js`) e já aceita sempre para `premium` (REQ-VID-QUOTA-005).
- **Confirmação:** não é preciso nada. No serviço de utilizadores, a reserva já é o débito definitivo, e a "confirmação" (REQ-VID-QUOTA-003) corresponde a não devolver.
- **Devolução:** `POST users:/:user/process/refund/:k` em falha ou cancelamento (cadeia e junção: `k` = total; lote: `k` = custo × vídeos não concluídos, chamado por item ou no fim).
- **Executor da quota:** o `runner_id` (utilizador que submete, obtido com `getCallerId`), como já acontece em `POST /:user/:project/process` (REQ-VID-QUOTA-006).

| **Alternativa** | **Vantagens** | **Desvantagens** |
|---|---|---|
| **Reutilizar `process/:n` + `refund/:n` (escolhida)** | Zero alterações no serviço de utilizadores; já suporta N créditos e Premium | A reserva é um `GET` com efeitos secundários e um ciclo ler-modificar-escrever não atómico (risco de corrida entre pedidos concorrentes do mesmo utilizador) |
| Novo trio `reserve/commit/rollback` com `$inc` condicional | Atómico; semântica explícita da ERS | Altera um serviço estável; mais código para um ganho que só aparece com concorrência real |

O risco de corrida fica registado em Q-ADD-03 e é **Adaptar** só se a equipa o considerar relevante no MVP (trocar o ciclo ler-modificar-escrever por `updateOne` com `$inc` e condição sobre o saldo).

### T-05 — Matriz de conversão de formatos e plano de cópia de streams

**Decisão: Criar** um módulo de política partilhado (`projects/video/formats.js`, espelhado em `Tools/video/formats.py`), que é a única fonte da matriz DQ-002/DQ-013:

| **Contentor** | **Entrada admitida** | **Saída** |
|---|---|---|
| MP4 | H.264 / AAC (ou sem áudio) | H.264 / AAC |
| MOV | H.264 / AAC (ou sem áudio) | H.264 / AAC |
| AVI | H.264 ou MPEG-4 Part 2 / AAC ou MP3 (ou sem áudio) | MPEG-4 Part 2 (`mpeg4`) / MP3 (`libmp3lame`) |

O planeamento por stream (vídeo e áudio separadamente) é: **cópia** quando o codec de origem é admitido no contentor de saída e nenhum passo da cadeia altera essa stream; caso contrário, **recodificação** para o codec da saída. Exemplos: MP4→MOV = cópia das duas streams (REQ-VID-CONVERT-006); AVI (H.264/MP3)→MP4 = cópia do vídeo e recodificação do áudio para AAC; remover áudio de um MP4 H.264 = cópia do vídeo (REQ-VID-AUDIO-005). O mesmo módulo responde a REQ-VID-CONVERT-001/003 ("Cópia direta" ou "Recodificação").

### T-06 — Cópia de pré-visualização MP4 (REQ-VID-UPLOAD-016/017, CONVERT-008)

**Decisão: Criar**, como saída adicional da mesma invocação FFmpeg:

- **Resultado em MOV H.264/AAC:** a cópia MP4 é feita por *remux* (`-c copy`), sem recodificar.
- **Resultado em AVI:** o grafo usa `split` e codifica a saída AVI (MPEG-4/MP3) e a cópia MP4 (H.264/AAC) em paralelo.
- **Ingestão de originais MOV/AVI:** aplica-se a mesma regra (é responsabilidade da fundação T-00).
- A cópia fica no estágio `video_preview`, em `storage.preview_key`. O leitor usa `preview_key` quando existe e `original_key` nos restantes casos. O descarregamento e as operações usam sempre `original_key`. A cópia é apagada juntamente com o recurso (Q-ERS-004).

### T-07 — Pré-visualizações estáticas em ≤ 1 s (REQ-VID-NFR-015)

**Decisão: Adaptar** o padrão `applyToolsPreview` (sharp, síncrono, sem workers) de `projects/routes/projects.js`.

- Na ingestão (T-00) guarda-se o **fotograma 0** em JPEG (`storage.first_frame_key`), além da miniatura a 00:00:01 exigida por REQ-VID-UPLOAD-014 (ver Q-ADD-06).
- Novo endpoint `POST /projects/:user/:project/videos/:video/preview` com `{steps}`: carrega o fotograma (com cache em memória por `videoId`), aplica as transformações com `sharp` e devolve a imagem (ou um URL `preview` com o padrão de `uploadAssistantPreview`). É uma resposta HTTP síncrona: não cria tarefa nem consome quota.
- **Correspondência sharp ↔ FFmpeg** (para a pré-visualização coincidir com o resultado):

| **Operação** | **sharp (pré-visualização)** | **FFmpeg (resultado)** |
|---|---|---|
| Brilho `f` | `linear(f, 0)` | `colorchannelmixer=rr=f:gg=f:bb=f` |
| Contraste `c` | `linear(c, 128·(1−c))` (já usado em `applyToolsPreview`) | `eq=contrast=c` |
| Saturação `s` | `modulate({ saturation: s })` | `eq=saturation=s` |
| Filtro (matriz M) | `recomb(M)` / `negate()` | `colorchannelmixer=<M>` / `negate` |
| Redimensionamento | `resize(w, h, { fit: "fill" })` | `scale=w:h` |
| Rotação / espelho | `rotate(90·k)`, `flop()` (horizontal), `flip()` (vertical) | `transpose`, `hflip`, `vflip` |

- **Catálogo de filtros** (REQ-VID-FILTER-001, DQ-021) definido como **matrizes de cor 3×3** num único ficheiro JSON (`projects/video/filters.json`, copiado para a imagem do worker). Cada filtro é aplicado da mesma forma pelo sharp (`recomb`) e pelo FFmpeg (`colorchannelmixer`). Preto e Branco (pesos de luminância), Sépia (matriz clássica) e Negativo (`negate`) têm definição canónica. Vintage, Frio e Quente têm de ser definidos pela equipa como matrizes (Q-ADD-07).

| **Alternativa** | **Vantagens** | **Desvantagens** |
|---|---|---|
| **sharp no serviço de projetos (escolhida)** | Já está no projeto (`sharp ^0.33.0`) e já é usado assim; ≤ 1 s sem fila; não bloqueia atrás de codificações longas | Dois motores (sharp e FFmpeg): é preciso calibrar e testar a equivalência com fotogramas de referência |
| FFmpeg num fotograma, via fila e worker de vídeo | Pixel a pixel igual ao resultado | Fica na fila atrás de tarefas longas (viola o 1 s), salvo um consumidor dedicado; mais latência |
| Consumidor FFmpeg dedicado a pré-visualizações (`video_preview_queue`) | Igual ao resultado e sem bloqueio | Mais um contentor e o caminho assíncrono `preview-ready`; mais complexo para o MVP |
| WebGL no cliente | ≤ 100 ms (Alvo de produção da NFR-015) | Terceiro motor de transformação; fora do Alvo MVP |

### T-08 — Armazenamento: URLs pré-assinados, estágios de vídeo, `Range` e escrita direta

**Decisão: Adaptar** `imageStorageService` e `nginx`.

- `imageStorageService/utils/stages.js`: acrescentar os estágios de vídeo (T-00).
- `imageStorageService/services/getPresignedUrl.js`: aceitar `expires` (15 min = 900 s para descarregamentos, REQ-VID-DOWNLOAD-002) e `ResponseContentDisposition` (`attachment; filename="<nome sugerido>"`, REQ-VID-DOWNLOAD-005) e `ResponseContentType`. Hoje o valor está fixo em `Expires: 60 * 60`.
- Novo endpoint de URL pré-assinado de escrita (`getSignedUrl("putObject")`) para o worker enviar resultados grandes diretamente para o SeaweedFS. O upload atual (`services/uploadImage.js`, `multer.memoryStorage()`) carrega o ficheiro inteiro em memória e não serve para ficheiros até 2 GB.
- `nginx/nginx.conf`, `location /s3/`: acrescentar `proxy_buffering off;` e `proxy_request_buffering off;` para transferências grandes, e confirmar que o cabeçalho `Range` chega ao SeaweedFS e que as respostas `206` voltam ao cliente (REQ-VID-DOWNLOAD-007, REQ-VID-NFR-016). O tráfego passa pelo nginx mas **não** pelo API Gateway, como pede a NFR-016.

### T-09 — Gestão de lotes (REQ-VID-TASK-007, BATCH-008 a 014)

**Decisão: Adaptar** o padrão de avanço sequencial de `process_msg` (o orquestrador publica o passo seguinte quando recebe a resposta do anterior) e **Criar** o modelo `projects/models/videoBatch.js` (`status` agregado, `items[]` com `videoId`, `taskId`, `status`, `error`, `result_video_id`, `cost_per_item`, `reserved_credits`, `refunded_credits`).

- A aceitação reserva `custo × elegíveis` (T-04), ocupa o lugar de tarefa ativa do projeto (T-03) e publica **só o primeiro item**.
- Quando um item termina (sucesso ou falha), o orquestrador grava o resultado de forma independente, devolve os créditos do item falhado e publica o item seguinte. Assim, no máximo um item está em `processing` (BATCH-009).
- No fim, o estado agregado é `completed` se houver ≥ 1 concluído e `failed` nos restantes casos; o evento `video-batch-update` leva o resumo (BATCH-012).
- Cancelar o lote cancela o item em curso (T-03), marca os pendentes como `cancelled` e devolve os créditos de todos os itens não concluídos (BATCH-014).
- Cada item reutiliza tal qual o executor de cadeias (T-02): o lote não precisa de lógica de processamento própria.

### T-10 — Correlação e auditoria (REQ-VID-NFR-002, REQ-VID-ERROR-002, DOWNLOAD-009)

**Decisão: Adaptar.** O API Gateway gera `X-Correlation-Id` com `crypto.randomUUID()` (biblioteca padrão do Node, sem dependência nova) e propaga-o aos serviços pelo mesmo mecanismo de `X-Caller-Id`. O serviço de projetos guarda-o em `VideoTask.correlation_id` e envia-o nas mensagens AMQP (campo `correlationId`, que já existe no contrato de `Tools/utils/tool_msg.py`). Os logs passam a ser linhas JSON em `stdout` (`{level, correlationId, userId, resource, event}`), que o stack ELK comentado em `docker-compose.yaml` pode consumir mais tarde. Acrescentar `X-Correlation-Id` aos cabeçalhos CORS permitidos em `nginx/nginx.conf`.

---

## 4. Decisões por Caso de Uso

### 4.1 UC-VID-006 — Descarregar um vídeo do projeto

**Requisitos abrangidos:** REQ-VID-DOWNLOAD-001 a 009, REQ-VID-QUOTA-008, REQ-VID-UPLOAD-017, REQ-VID-NFR-001, REQ-VID-NFR-016, DQ-023.

**O que já existe e pode ser aproveitado:**
- `imageStorageService/services/getPresignedUrl.js` (`getPublicUrl`): URLs pré-assinados públicos reescritos para o caminho `nginx /s3/`.
- `projects/middleware/shareAuth.js` (`checkSharePermission`): autorização de leitura em projetos partilhados.
- `GET /:user/:project/process/url` em `projects/routes/projects.js`: padrão de rota que devolve URLs assinados ao frontend.
- `apiGateway/routes/projects.js` + `auth/auth.js`: encaminhamento com JWT.

**Decisão: Adaptar.** Novo endpoint `GET /projects/:user/:project/videos/:video/download` (com `checkSharePermission` e sem `requireEditPermission`), que valida `status === "completed"` (senão `409 RESOURCE_NOT_READY`), verifica se o objeto existe (`headObject`, senão `RESOURCE_UNAVAILABLE`), gera o URL com 15 min e `Content-Disposition` (T-08), regista o evento (T-10) e devolve `{url, fileName, format, sizeBytes, expiresAt}`. Não chama o serviço de utilizadores (DOWNLOAD-004). Para FA3 (URL expirado), basta repetir o pedido.

**Pipeline proposta:**

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant GW as API Gateway
    participant PR as projects
    participant ST as imageStorageService
    participant NG as nginx /s3/
    participant S3 as SeaweedFS
    FE->>GW: GET /projects/:user/:project/videos/:id/download
    GW->>PR: + X-Caller-Id, X-Correlation-Id
    PR->>PR: checkSharePermission, status=completed
    PR->>ST: URL público (expires=900, ResponseContentDisposition)
    ST-->>PR: URL assinado
    PR->>PR: log JSON {correlationId, userId, videoId}
    PR-->>FE: {url, fileName, sizeBytes}
    FE->>NG: GET url (âncora, Range na retoma)
    NG->>S3: proxy (sem buffering)
    S3-->>FE: 200 / 206 Partial Content
```

**Frameworks/bibliotecas:** `aws-sdk` v2 (já existe), Express (já existe). Nenhuma nova.

**Alternativas consideradas:**

| **Alternativa** | **Vantagens** | **Desvantagens** |
|---|---|---|
| **URL pré-assinado S3 servido por nginx (escolhida)** | Cumpre NFR-016 (não atravessa o API Gateway); `Range` nativo no S3; reutiliza `getPresignedUrl.js` | O URL é portador: quem o tiver usa-o durante 15 min (ver Q-ADD-05) |
| *Streaming* pelo serviço de projetos com verificação do JWT | Liga o descarregamento ao utilizador | Viola NFR-016; 2 GB a atravessar dois serviços Node |
| Descarregar no frontend como `blob` (padrão de `downloadProjectImages`) | Reutiliza código do frontend | Carrega até 2 GB na memória do navegador; sem retoma |

**Alterações por componente:**

| **Componente** | **Alteração** |
|---|---|
| Frontend | Ação "Descarregar" na galeria e no leitor; obtém o URL e navega para ele com uma âncora `href` (não um `blob`), para o navegador gerir a retoma; desativada quando `status !== completed` |
| API Gateway | Rota `GET /:user/:project/videos/:video/download` em `apiGateway/routes/projects.js` |
| projects | Endpoint novo; construção do nome sugerido a partir de `original_name` e `recipe` |
| imageStorageService | `expires` e `ResponseContentDisposition` parametrizáveis (T-08); `headObject` para verificar a existência |
| nginx | `proxy_buffering off` em `/s3/` (T-08) |
| Base de dados | Nenhuma (lê `videos`) |

**Riscos e pontos de atenção:**
- O URL S3 não está ligado ao utilizador: o critério de REQ-VID-DOWNLOAD-002 ("usado pelo utilizador B → 403") não é verificável com URLs portadores (Q-ADD-05).
- O sufixo do nome para cadeias, junções e lotes não está definido (Q-ADD-08).
- Usar sempre `original_key`, nunca `preview_key` (DOWNLOAD-006).

**Esforço estimado:** S.

---

### 4.2 UC-VID-007 — Consultar as informações de um vídeo

**Requisitos abrangidos:** REQ-VID-INFO-001 a 009, REQ-VID-QUOTA-008, REQ-VID-STORAGE-002, REQ-VID-STORAGE-004.

**O que já existe e pode ser aproveitado:**
- `checkSharePermission` (leitura) e o padrão de leitura de `GET /:user/:project` em `projects/routes/projects.js`.
- Componentes `frontend/components/ui/dialog.tsx`, `sheet.tsx`, `hover-card.tsx` para o painel.
- Os metadados persistidos na ingestão (coleção `videos`, T-00).

**Decisão: Adaptar.** Endpoint `GET /projects/:user/:project/videos/:video` que devolve `meta`, `status`, `source_video_id(s)` (com nomes) e `recipe`. Não cria tarefa nem chama o serviço de utilizadores (INFO-007). A **formatação** (hh:mm:ss.mmm, MB/GB com 2 casas, fps = `fps_num/fps_den` com 2 casas, `MOV (H.264 / AAC)`) é feita no frontend (`frontend/lib/`), como o resto da apresentação. Campos em falta são mostrados como "Indisponível", e o serviço regista `METADATA_UNAVAILABLE` com o `correlationId` (INFO-009). Se `status` ≠ `completed`, devolve só o estado da tarefa.

**Pipeline proposta:** Frontend → API Gateway → projects (`videos.findOne`) → Frontend. Sem RabbitMQ nem storage.

**Frameworks/bibliotecas:** Mongoose, React, Radix (já existem). Nenhuma nova.

**Alternativas consideradas:**

| **Alternativa** | **Vantagens** | **Desvantagens** |
|---|---|---|
| **Ler os metadados persistidos (escolhida)** | Imposto por INFO-007 e RN3; O(1); sem custo computacional | Depende da qualidade da extração na ingestão |
| Correr FFprobe a pedido | Sempre atualizado | Viola RN3; exige FFprobe no serviço de projetos ou uma ida ao worker |
| Formatar no backend | Cliente mais simples | Mistura apresentação com dados; o frontend já formata os restantes valores |

**Alterações por componente:**

| **Componente** | **Alteração** |
|---|---|
| Frontend | Painel "Informações" (galeria e leitor, FA3); formatadores; lista de proveniência e de passos |
| API Gateway | Rota `GET /:user/:project/videos/:video` |
| projects | Endpoint de leitura; resolução dos nomes de `source_video_ids` |
| Workers / storage | Nenhuma |
| Base de dados | Usa `videos.meta`, `recipe`, `source_video_id(s)` (T-00) |

**Riscos e pontos de atenção:**
- Vídeos com etiqueta de rotação: mostrar `display_width × display_height` e não as dimensões codificadas (UC-VID-011 Q2; Q-ADD-13).
- Os resultados de cadeias e junções têm de gravar `meta` a partir de um FFprobe ao resultado (no worker), e não das estimativas.

**Esforço estimado:** S.

---

### 4.3 UC-VID-008 — Ajustar as propriedades visuais de um vídeo

**Requisitos abrangidos:** REQ-VID-ADJUST-001 a 009, REQ-VID-COM-006, REQ-VID-NFR-015, DQ-020.

**O que já existe e pode ser aproveitado:**
- Semântica e nomes dos parâmetros: `frontend/lib/tool-types.ts` (`brightness`, `contrastFactor`, `saturationFactor`, [0, 2], neutro 1).
- UI: `frontend/components/toolbar/brightness-tool.tsx`, `contrast-tool.tsx`, `saturation-tool.tsx` (Radix `Slider`, botão de repor).
- Pré-visualização: `applyToolsPreview` (sharp) em `projects/routes/projects.js`, que já faz brilho, contraste e saturação.
- Implementações de imagem com `ImageEnhance` em `Tools/brightness/`, `Tools/contrast/`, `Tools/saturation/` (só como referência de semântica: não processam vídeo).

**Decisão: Adaptar.** Operação `adjust` com `{brightness, contrastFactor, saturationFactor}` (mesmos nomes das ferramentas de imagem) no registo T-01: `validate` aplica [0, 2], passo 0.05 e `NO_CHANGES` se os três forem 1.0; `estimate` mantém as propriedades. No worker, um módulo `Tools/video/ops/adjust.py` gera os filtros (T-02). Os painéis reutilizam o `Slider` com `step={0.05}` (as ferramentas de imagem usam 0.01). A pré-visualização usa T-07.

**Pipeline proposta:** painel → `POST .../videos/:id/preview` (sharp, ≤ 1 s) → confirmação → `POST .../videos/:id/operations` `{steps:[{operation:"adjust",...}]}` → executor T-02 → recurso novo.

**Frameworks/bibliotecas:** sharp (já existe), FFmpeg (novo, T-02), Radix Slider (já existe).

**Alternativas consideradas:**

| **Alternativa** | **Vantagens** | **Desvantagens** |
|---|---|---|
| **`colorchannelmixer` (brilho) + `eq` (contraste, saturação) (escolhida)** | Brilho multiplicativo como `ImageEnhance.Brightness`; contraste com pivô fixo, igual ao da pré-visualização sharp; filtros standard | O contraste de `ImageEnhance` usa a **média da imagem** como pivô: com pivô fixo o resultado difere ligeiramente da ferramenta de imagem (Q-ADD-18) |
| `eq` para os três | Um só filtro | `eq=brightness` é **aditivo** (−1…1) e não multiplicativo: quebra a DQ-020 e a assunção A1 do UC-VID-008 |
| Pivô = média de cada fotograma (igual ao PIL) | Igual à ferramenta de imagem fotograma a fotograma | O pivô varia de fotograma para fotograma (cintilação), o que viola ADJUST-008 (aplicação uniforme) |
| Reutilizar os workers PIL fotograma a fotograma | Reutilização literal | Ordens de grandeza mais lento; volume de PNGs intermédios; sem áudio |

**Alterações por componente:**

| **Componente** | **Alteração** |
|---|---|
| Frontend | Painel de ajuste de vídeo (três sliders, "Repor", pré-visualização), reutilizando os componentes da toolbar |
| API Gateway | Rotas genéricas `POST .../videos/:id/preview` e `POST .../videos/:id/operations` (partilhadas por 008 a 012) |
| projects | `projects/video/operations/adjust.js`; extensão do `applyToolsPreview` para o fotograma de vídeo |
| Workers | `Tools/video/ops/adjust.py` |
| Storage / BD | Nenhuma específica (T-00) |

**Riscos e pontos de atenção:** equivalência sharp ↔ FFmpeg (testes com fotogramas de referência); espaço de cor (o `colorchannelmixer` trabalha em RGB e o `eq` em YUV, o que implica conversões no grafo; garantir `format=yuv420p` à saída).

**Esforço estimado:** M.

---

### 4.4 UC-VID-009 — Aplicar um filtro visual a um vídeo

**Requisitos abrangidos:** REQ-VID-FILTER-001 a 007, REQ-VID-COM-006, REQ-VID-NFR-015, DQ-021.

**O que já existe e pode ser aproveitado:**
- Não há filtros de cor nas ferramentas de imagem (`binarization` é limiarização, não um filtro de estilo).
- sharp (`recomb`, `negate`, `greyscale`) no serviço de projetos; componentes de grelha e de seleção do frontend.

**Decisão: Criar** o catálogo (T-07, `projects/video/filters.json`) e a operação `filter` (`{filter: "bw"|"sepia"|"negative"|"vintage"|"cold"|"warm"}`), sobre os componentes transversais. `validate` rejeita filtros ausentes ou desconhecidos (`INVALID_FILTER`). As miniaturas do catálogo (FILTER-002) são 6 aplicações sharp ao fotograma 0 reduzido (~160 px), devolvidas de uma só vez por `GET .../videos/:id/filters/thumbnails` e guardadas em cache por `videoId`.

**Pipeline proposta:** igual à do 4.3, com `operation: "filter"`; no worker, `Tools/video/ops/filter.py` lê a matriz do mesmo JSON.

**Frameworks/bibliotecas:** sharp (já existe), FFmpeg (novo, T-02).

**Alternativas consideradas:**

| **Alternativa** | **Vantagens** | **Desvantagens** |
|---|---|---|
| **Catálogo como matrizes 3×3 num JSON partilhado (escolhida)** | A mesma definição gera a pré-visualização (`recomb`) e o resultado (`colorchannelmixer`); fácil de testar; catálogo fechado | Filtros "Vintage" reduzidos a uma transformação linear (sem vinheta nem grão) |
| Receitas FFmpeg livres (`curves`, `vignette`, `noise`) | Efeitos mais ricos | Sem equivalente em sharp, por isso a pré-visualização não corresponde ao resultado |
| LUTs 3D (`lut3d` com ficheiros `.cube`) | Padrão da indústria | Ficheiros adicionais; sharp não aplica LUTs 3D |

**Alterações por componente:**

| **Componente** | **Alteração** |
|---|---|
| Frontend | Painel com grelha de 6 miniaturas, seleção única, pré-visualização |
| API Gateway | Rota das miniaturas (as restantes são as genéricas do 4.3) |
| projects | `filters.json`, `operations/filter.js`, endpoint das miniaturas |
| Workers | `Tools/video/ops/filter.py`; o JSON é copiado no `Dockerfile` |
| Storage / BD | Nenhuma |

**Riscos e pontos de atenção:** as matrizes de Vintage, Frio e Quente não estão definidas nos documentos (Q-ADD-07); a ordem do filtro relativamente a outros passos numa cadeia é a definida pelo utilizador.

**Esforço estimado:** M.

---

### 4.5 UC-VID-010 — Redimensionar um vídeo

**Requisitos abrangidos:** REQ-VID-RESIZE-001 a 009, REQ-VID-COM-006, REQ-VID-NFR-015, DQ-022.

**O que já existe e pode ser aproveitado:**
- Parâmetros `width`/`height` (`frontend/lib/tool-types.ts`, `ResizeToolParams`) e UI `frontend/components/toolbar/resize-tool.tsx`.
- `Tools/resize/resize.py` (só semântica).
- sharp `resize` para a pré-visualização; tipo de utilizador obtido por `GET users:/:user/type` (usado em `POST /:user/:project/tool`) para o teto por perfil.

**Decisão: Adaptar.** Operação `resize` `{width, height}`; `validate` exige números pares, ≥ 128, dentro do teto do perfil (1920×1080 Registado, 3840×2160 Premium; comparação maior-dimensão × menor-dimensão, RN3) e `NO_CHANGES`; `estimate` altera a resolução. O bloqueio de proporção, o arredondamento para par, as predefinições e os avisos de distorção e ampliação ficam no frontend, que estende `resize-tool.tsx`. No worker, `scale=w:h,setsar=1`.

**Pipeline proposta:** igual à do 4.3, com `operation: "resize"`.

**Frameworks/bibliotecas:** sharp, Radix (já existem); FFmpeg (novo, T-02).

**Alternativas consideradas:**

| **Alternativa** | **Vantagens** | **Desvantagens** |
|---|---|---|
| **`scale` com dimensões exatas + `setsar=1` (escolhida)** | Dimensões exatas (RESIZE-008); evita SAR herdado que faria os leitores esticar a imagem | Com a proporção desbloqueada, a imagem é esticada (aceite em UC-VID-010 Q1) |
| `scale=-2:h` (FFmpeg calcula a largura) | Garante paridade | A largura calculada pode diferir da mostrada na UI; quebra o "dimensões exatas confirmadas" |
| Letterbox (`pad`) | Sem distorção | Fora do MVP (UC-VID-010 Q1) |

**Alterações por componente:**

| **Componente** | **Alteração** |
|---|---|
| Frontend | Painel de redimensionamento (campos, cadeado de proporção, predefinições 1080p/720p/480p/360p, avisos) |
| projects | `operations/resize.js` com o teto por perfil (obtido do serviço de utilizadores) |
| Workers | `Tools/video/ops/resize.py` |
| API Gateway / Storage / BD | Nenhuma específica |

**Riscos e pontos de atenção:** cálculo da proporção sobre as dimensões de apresentação (rotação nos metadados, Q-ADD-13); resoluções 4K aumentam muito o tempo de codificação (dimensionamento dos workers, Q-ADD-10).

**Esforço estimado:** S.

---

### 4.6 UC-VID-011 — Rodar e espelhar um vídeo

**Requisitos abrangidos:** REQ-VID-ORIENT-001 a 009, REQ-VID-COM-006, REQ-VID-NFR-015.

**O que já existe e pode ser aproveitado:**
- UI `frontend/components/toolbar/rotate-tool.tsx` (slider 0–360) e `Tools/rotate/rotate.py` (`expand=True`, sem recorte).
- sharp `rotate`, `flip`, `flop` para a pré-visualização.
- Não existe ferramenta de espelho para imagem.

**Decisão: Adaptar.** Operação `orient` `{rotation: 0|90|180|270, flipH: bool, flipV: bool}`, com a rotação aplicada antes do espelho (RN3). `validate` rejeita ângulos fora do conjunto (`INVALID_ORIENT_PARAMS`) e `NO_CHANGES`; `estimate` troca largura e altura em 90°/270°. A UI troca o slider por botões (90°/180°/270°) e interruptores de espelho. No worker: `transpose`/`hflip`/`vflip` (T-02).

**Pipeline proposta:** igual à do 4.3, com `operation: "orient"`.

**Frameworks/bibliotecas:** sharp, Radix (já existem); FFmpeg (novo, T-02).

**Alternativas consideradas:**

| **Alternativa** | **Vantagens** | **Desvantagens** |
|---|---|---|
| **Recodificar com `transpose`/`hflip`/`vflip` (escolhida)** | Resultado igual em todos os leitores; coerente com DQ-013 e com a cadeia | Uma recodificação |
| Só alterar a etiqueta de rotação (*display matrix*), sem recodificar | Instantâneo e sem perdas | Não cobre o espelho; leitores e editores ignoram a etiqueta de forma inconsistente; não serve para encadear |
| Reutilizar a rotação livre (0–360) da imagem | Reutiliza a UI | Ângulos arbitrários exigem recorte ou barras (excluído, UC-VID-011 Q1) |

**Alterações por componente:**

| **Componente** | **Alteração** |
|---|---|
| Frontend | Painel de orientação (botões de ângulo, interruptores de espelho, pré-visualização com as dimensões finais) |
| projects | `operations/orient.js` |
| Workers | `Tools/video/ops/orient.py` |
| API Gateway / Storage / BD | Nenhuma específica |

**Riscos e pontos de atenção:** o FFmpeg aplica automaticamente a rotação dos metadados quando recodifica (`autorotate`). O grafo tem de partir da orientação de apresentação (UC-VID-011 Q2), e o fotograma 0 da pré-visualização tem de ser extraído já rodado, para a pré-visualização coincidir com o resultado.

**Esforço estimado:** S.

---

### 4.7 UC-VID-012 — Converter o formato de um vídeo

**Requisitos abrangidos:** REQ-VID-CONVERT-001 a 009, REQ-VID-NFR-003, REQ-VID-NFR-012, DQ-002, DQ-012, DQ-013.

**O que já existe e pode ser aproveitado:** nada específico. Não há conversão de formatos no projeto (as imagens também não têm). Aproveitam-se os componentes transversais T-01, T-02, T-05 e T-06.

**Decisão: Criar** a operação `convert` `{target: "mp4"|"mov"|"avi"}`, cujo comportamento é todo definido pela matriz T-05: `validate` dá `SAME_FORMAT` ou `UNSUPPORTED_TARGET_FORMAT`; `estimate` altera o contentor e os codecs; o planeamento decide entre cópia e recodificação por stream; para MOV e AVI é gerada a cópia MP4 (T-06). Como passo de cadeia, tem de ser o último (CONVERT-009, verificado na validação de estrutura do 4.9). O painel mostra o formato atual, os destinos (sem o atual) e "Cópia direta" ou "Recodificação" (CONVERT-003, dado pelo endpoint de validação).

**Pipeline proposta:**

```mermaid
flowchart LR
    A[convert target] --> B{T-05: codecs de origem<br/>admitidos no destino?}
    B -- vídeo e áudio sim --> C["-c copy (remux)"]
    B -- só vídeo --> D["-c:v copy, áudio recodificado"]
    B -- não --> E[recodificar para a matriz do destino]
    C --> F{destino MOV/AVI?}
    D --> F
    E --> F
    F -- sim --> G[saída extra: cópia MP4 T-06]
    F -- não --> H[upload resultado]
    G --> H
    H --> I[FFprobe ao resultado → meta]
```

**Frameworks/bibliotecas:** FFmpeg com `libx264`, `aac`, `mpeg4` e `libmp3lame` (novo, T-02; o pacote `ffmpeg` do Debian inclui-os).

**Alternativas consideradas:**

| **Alternativa** | **Vantagens** | **Desvantagens** |
|---|---|---|
| **Matriz fixa com cópia quando possível (escolhida)** | Cumpre CONVERT-005/006; resultado previsível e testável | O utilizador não escolhe codec nem qualidade (aceite em UC-VID-012 Q1) |
| Recodificar sempre | Implementação mais simples | Perda de qualidade e tempo desnecessários; viola CONVERT-006 |
| Saída AVI com H.264 em vez de MPEG-4 Part 2 | Melhor qualidade por bit | Contraria RN3 e DQ-002 |

**Alterações por componente:**

| **Componente** | **Alteração** |
|---|---|
| Frontend | Painel de conversão; o leitor usa `preview_key` para resultados MOV e AVI |
| projects | `operations/convert.js`; `projects/video/formats.js` (T-05) |
| Workers | `Tools/video/ops/convert.py`; `formats.py`; saída dupla (T-06) |
| Storage | Estágio `video_preview` (T-00) |
| BD | `storage.preview_key`, `meta.container` e codecs do resultado |

**Riscos e pontos de atenção:** cópia de H.264 para MOV ou AVI com B-frames (os AVI com B-frames podem precisar de `-bsf`; validar com FFprobe, NFR-012); MP3 em AVI com taxa de amostragem variável; testes de reprodução em VLC por cada caminho da matriz.

**Esforço estimado:** M.

---

### 4.8 UC-VID-013 — Juntar vídeos

**Requisitos abrangidos:** REQ-VID-CONCAT-001 a 011, REQ-VID-STORAGE-002, REQ-VID-STORAGE-004, REQ-VID-NFR-014, DQ-015, DQ-018, DQ-019.

**O que já existe e pode ser aproveitado:**
- Linha temporal reordenável: `@dnd-kit/core` e `@dnd-kit/sortable` (já em `frontend/components/toolbar/sortable-tool-item.tsx` e `applied-tools-list.tsx`).
- Executor de cadeias (T-02): a junção é um passo dele.

**Decisão: Criar** a operação `concat` no executor (T-02) e a linha temporal no frontend (reutilizando o dnd-kit). Uma junção isolada é uma cadeia com um único passo `concat`, em que cada clip tem uma sub-cadeia vazia, o que dá o mesmo caminho de código que o UC-VID-014 FA1. `validate` aplica `INSUFFICIENT_INPUTS`, `TOO_MANY_INPUTS` (10/50), `LIMIT_EXCEEDED` (soma das durações estimadas) e `UNSUPPORTED_FORMAT` por clip; `estimate` dá a soma das durações e a resolução e fps do primeiro clip (CONCAT-004). O resultado regista `source_video_ids` pela ordem (com repetições, CONCAT-001) e `recipe`. Custo: 1 crédito.

**Pipeline proposta:**

```mermaid
flowchart LR
    V1[clip 1] --> N1[scale+pad → W×H do clip 1<br/>fps, setsar, aformat]
    V2[clip 2] --> N2[scale+pad, fps, setsar<br/>áudio ou anullsrc]
    Vn[clip n] --> Nn[...]
    N1 --> C[concat n=N v=1 a=1]
    N2 --> C
    Nn --> C
    C --> O[libx264/aac → MP4]
```

**Frameworks/bibliotecas:** @dnd-kit (já existe), FFmpeg (novo, T-02).

**Alternativas consideradas:**

| **Alternativa** | **Vantagens** | **Desvantagens** |
|---|---|---|
| **Filtro `concat` com normalização no grafo (escolhida)** | Suporta clips heterogéneos (CONCAT-008/009); uma codificação; integra-se na cadeia | Todos os clips são descodificados ao mesmo tempo: memória e tempo crescem com N (50 no Premium) |
| *Demuxer* `concat` com cópia | Muito rápido | Exige clips com codecs, resolução e fps idênticos; não normaliza |
| Normalizar cada clip para um ficheiro intermédio e concatenar por cópia | Memória constante | Dupla codificação (viola NFR-013 na composição); intermédios grandes |

**Alterações por componente:**

| **Componente** | **Alteração** |
|---|---|
| Frontend | Seleção de vídeos, linha temporal ordenável, remoção, duração total e resolução estimadas em tempo real |
| API Gateway | Rota `POST .../videos/operations` sem `:video` (várias entradas) |
| projects | `operations/concat.js`; descarregamento de vários originais pelo worker (URLs por clip) |
| Workers | `Tools/video/ops/concat.py` (compilador do sub-grafo) |
| Storage | Espaço temporário no worker = soma dos clips + resultado |
| BD | `source_video_ids`, `recipe` |

**Riscos e pontos de atenção:** junção de 50 clips até 60 min; áudio com taxas de amostragem e números de canais diferentes (normalizar com `aresample=48000,aformat=channel_layouts=stereo`); o mesmo vídeo repetido é descarregado uma só vez e usado várias vezes como entrada.

**Esforço estimado:** L.

---

### 4.9 UC-VID-014 — Encadear operações de edição num vídeo

**Requisitos abrangidos:** REQ-VID-CHAIN-001 a 014, REQ-VID-COM-006, REQ-VID-TASK-006, REQ-VID-QUOTA-007/008, REQ-VID-STORAGE-004, REQ-VID-NFR-013/014, DQ-014 a DQ-018, DQ-025.

**O que já existe e pode ser aproveitado:**
- O conceito de cadeia ordenada `[{position, procedure, params}]` (`projects/models/project.js`, `toolSchema`) e a UI de passos ordenáveis (`frontend/components/toolbar/applied-tools-list.tsx`, `sortable-tool-item.tsx`).
- Predefinições: `users/models/preset.js` (`tools: [{procedure, params}]`), `users/routes/presets.js`, `frontend/components/presets/presets-dialog.tsx`, `frontend/lib/presets.ts`.
- Reserva de N créditos (T-04) e padrão de orquestração (T-03).

**Decisão: Adaptar.** O editor de cadeia reutiliza os componentes de lista ordenável; a estrutura do pedido é a do contrato T-01; a execução é o executor T-02 (uma `VideoTask` com `kind: "chain"`). Validação em duas fases, no serviço de projetos:
1. **Por passo:** percorre os passos com `estimate` e valida cada um face às propriedades estimadas à saída do anterior (`INVALID_STEP_PARAMS` com índice e campo).
2. **Estrutura:** cadeia não vazia; no máximo uma `concat`; `convert` só no fim; sem extração de fotogramas; ≤ 10 passos contando sub-cadeias, junção e passos finais (`INVALID_CHAIN`, `CHAIN_TOO_LONG`).

Custo = número total de passos; a reserva é feita de uma vez (T-04, devolução total em falha, CHAIN-013). O progresso emite `step`/`totalSteps`. Como os passos correm num único grafo, o "passo corrente" é aproximado pela fase do plano (descarregamento, codificação, upload) ou pela posição temporal; ver os riscos. As predefinições (CHAIN-014) **adaptam** o modelo existente: acrescentar `kind: "image" | "video"` ao `presetSchema` (por omissão `"image"`, compatível com os dados atuais) e guardar `operation`/`parameters` em `procedure`/`params`. Cadeias com junção não podem ser guardadas.

**Pipeline proposta:**

```mermaid
flowchart TD
    UI[Editor de cadeia<br/>applied-tools-list + dnd-kit] -->|POST .../videos/validate| V[projects: estimate + validate<br/>por passo e estrutura]
    V -->|custo, duração estimada| UI
    UI -->|confirmar| R[T-04 reserva N créditos]
    R --> T[VideoTask kind=chain<br/>lugar ativo do projeto]
    T -->|video_operations_queue| W[Worker: compila sub-cadeias → concat → passos finais<br/>num único -filter_complex]
    W -->|progresso step k/N| WS[wsGateway video-task-update]
    W -->|completed| OK[cria recurso + recipe]
    W -->|failed / cancelled| KO[refund N, purga /tmp, nada gravado]
```

**Frameworks/bibliotecas:** @dnd-kit, react-query, Mongoose (já existem); FFmpeg (novo, T-02).

**Alternativas consideradas:**

| **Alternativa** | **Vantagens** | **Desvantagens** |
|---|---|---|
| **Cadeia compilada num grafo, uma tarefa (escolhida)** | NFR-013, CHAIN-010/011/013 cumpridos por construção; atómica | Progresso por passo só aproximado; o compilador tem de tratar a interação entre operações temporais (recorte, velocidade) e de imagem |
| Reutilizar `project.tools` e `process_msg` (uma mensagem por passo) | Reutiliza o orquestrador existente | Recodifica por passo; intermédios no volume; cancelamento sem interromper o worker |
| Guardar a cadeia de vídeo em `project.tools` | Reutiliza a persistência e a co-edição | Mistura cadeias de imagem e de vídeo no mesmo projeto; cada edição incrementa a versão do projeto |
| Predefinições numa coleção nova | Separação total | Duplica `users/routes/presets.js` (CRUD, partilha, nome único) |

**Alterações por componente:**

| **Componente** | **Alteração** |
|---|---|
| Frontend | Editor de cadeia (lista ordenável, configuração por passo com os painéis do 4.3 a 4.7, sub-cadeias por clip, contador de créditos, duração estimada); carregar e guardar predefinições |
| API Gateway | `POST .../videos/validate`; rota de operações com várias entradas |
| projects | Validador de estrutura; agregação de custo; `VideoTask` `kind: "chain"` |
| users | `kind` em `users/models/preset.js` e filtro por `kind` em `GET /users/:user/presets` |
| Workers | Compilador de cadeias (`Tools/video/compiler.py`) |
| BD | `recipe` no recurso final (STORAGE-004) |

**Riscos e pontos de atenção:**
- Compilação de passos temporais: a velocidade antes do recorte altera os instantes (CHAIN-003 já valida a duração estimada; o compilador tem de aplicar a mesma ordem).
- Uma cadeia só com operações copiáveis (e.g. remover áudio → converter para MOV) deve usar cópia (T-05) e não recodificar.
- Para o Registado, cadeias acima de 5 passos falham sempre por quota (DQ-025); a UI deve avisar antes.
- Progresso "k de N" (CHAIN-012): o critério de aceitação pede `step: 2` quando "o segundo passo inicia", o que não é observável num grafo único (Q-ADD-16).

**Esforço estimado:** L.

---

### 4.10 UC-VID-015 — Processar vários vídeos em lote

**Requisitos abrangidos:** REQ-VID-BATCH-001 a 015, REQ-VID-TASK-007, REQ-VID-QUOTA-007/008, REQ-VID-NFR-014, DQ-014 a DQ-018.

**O que já existe e pode ser aproveitado:**
- O "Bulk Processing" de imagem (`README.md`): uma cadeia aplicada a todas as imagens do projeto (`POST /:user/:project/process`, ciclo `for (let img of project.imgs)`).
- O avanço sequencial em `process_msg` (padrão de T-09).
- Reserva de N créditos e devolução parcial (T-04).
- ZIP com `jszip` em `GET /:user/:project/process`; caixas de seleção (`frontend/components/ui/checkbox.tsx`).
- Predefinições (4.9).

**Decisão: Adaptar.** Lote = `VideoBatch` (T-09) com uma `VideoTask` `kind: "batch_item"` por vídeo, cada uma executada pelo executor T-02 sem alterações. Pré-validação (BATCH-004) no mesmo endpoint de validação, aplicado aos metadados de cada vídeo (sem processar ficheiros, A1): devolve os vídeos compatíveis, os incompatíveis com motivo e o custo total. Rejeita `concat` e extração de fotogramas (`INVALID_BATCH_OPERATION`), < 2 ou > 10/50 vídeos e `NO_ELIGIBLE_INPUTS`. O descarregamento em ZIP (BATCH-015) gera o arquivo em *streaming* dos objetos S3 para o estágio `video_zip`, a pedido, e entrega-o por URL assinado (como no 4.1), sem quota.

**Pipeline proposta:**

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant PR as projects
    participant US as users
    participant MQ as RabbitMQ
    participant W as Tools/video
    FE->>PR: POST .../videos/batch/validate {videoIds, steps}
    PR-->>FE: elegíveis, incompatíveis (motivo), custo
    FE->>PR: POST .../videos/batch {videoIds elegíveis, steps}
    PR->>US: GET /:user/process/(custo × n)
    PR->>PR: VideoBatch + itens, lugar ativo do projeto
    loop um item de cada vez
        PR->>MQ: video_operations_queue (item k)
        MQ->>W: executa cadeia
        W->>MQ: project_queue completed / failed
        MQ->>PR: grava o resultado do item (se falhou, refund do item)
        PR->>MQ: ws_queue video-batch-update (k/total, %)
    end
    PR->>PR: estado agregado (completed se ≥1, senão failed)
    FE->>PR: GET .../videos/batch/:id/zip
    PR->>PR: archiver em streaming S3 → S3 (video_zip)
    PR-->>FE: URL assinado (15 min)
```

**Frameworks/bibliotecas:** Mongoose, amqplib, react-query (já existem); FFmpeg (novo, T-02); **`archiver`** (novo, justificado abaixo).

**Alternativas consideradas:**

| **Alternativa** | **Vantagens** | **Desvantagens** |
|---|---|---|
| **Itens sequenciais orquestrados pelo serviço de projetos (escolhida)** | Reutiliza o padrão de `process_msg`; resultados independentes; cancelamento entre itens trivial | O lote só avança se o serviço de projetos estiver ativo para consumir respostas (o mesmo que hoje) |
| Enviar o lote inteiro ao worker numa mensagem | Menos mensagens | O worker teria de gerir quota e recursos por item; foge à separação de responsabilidades atual |
| ZIP com `jszip` (já existe) | Sem dependência nova | Gera em memória (`generateAsync`) e **não suporta ZIP64**: um lote Premium (até 50 × 2 GB) passa os 4 GB do formato ZIP |
| **ZIP com `archiver` em streaming (escolhida)** | Streaming com memória constante; ZIP64; biblioteca consolidada no ecossistema Node | Dependência nova |
| Sem ZIP: lista de URLs assinados | Sem custo de armazenamento | Não cumpre BATCH-015 |

**Alterações por componente:**

| **Componente** | **Alteração** |
|---|---|
| Frontend | Seleção múltipla na galeria; configuração única (painéis do 4.3 a 4.7 ou predefinição); lista de pré-validação com exclusão; resumo de custo; progresso agregado; "Descarregar Lote" |
| API Gateway | Rotas `batch/validate`, `batch`, `batch/:id` (estado), `DELETE batch/:id` (cancelar), `batch/:id/zip` |
| projects | `models/videoBatch.js`, orquestração T-09, geração do ZIP |
| users | Nenhuma (T-04) |
| Workers | Nenhuma (cada item é uma cadeia normal) |
| Storage | Estágio `video_zip`; limpeza dos ZIPs expirados |
| WS Gateway | Evento `video-batch-update` (T-03) |

**Riscos e pontos de atenção:** o espaço e o tempo de geração de um ZIP de vários GB (Q-ADD-09); a retenção do ZIP depois da expiração do URL; falha geral do worker a meio do lote (os itens em `processing` ficam presos se não houver *timeout*; propor um *timeout* por item derivado da duração do vídeo).

**Esforço estimado:** L.

---

## 5. Tabela-Resumo

| **Caso de uso** | **Decisão** | **Componentes afetados** | **Dependências novas** | **Esforço** |
|---|:---:|---|---|:---:|
| T-00 Fundação de vídeo (pré-requisito) | Criar | frontend, apiGateway, projects, imageStorageService, rabbitMQ, Tools/video | FFmpeg/FFprobe | L |
| UC-VID-006 Descarregar | Adaptar | frontend, apiGateway, projects, imageStorageService, nginx | — | S |
| UC-VID-007 Informações | Adaptar | frontend, apiGateway, projects | — | S |
| UC-VID-008 Ajustar | Adaptar | frontend, apiGateway, projects, Tools/video | FFmpeg (T-02) | M |
| UC-VID-009 Filtros | Criar | frontend, apiGateway, projects, Tools/video | FFmpeg (T-02) | M |
| UC-VID-010 Redimensionar | Adaptar | frontend, projects, Tools/video | FFmpeg (T-02) | S |
| UC-VID-011 Rodar/espelhar | Adaptar | frontend, projects, Tools/video | FFmpeg (T-02) | S |
| UC-VID-012 Converter | Criar | frontend, projects, Tools/video, imageStorageService | FFmpeg (T-02) | M |
| UC-VID-013 Juntar | Criar | frontend, apiGateway, projects, Tools/video | FFmpeg (T-02) | L |
| UC-VID-014 Encadear | Adaptar | frontend, apiGateway, projects, users, Tools/video | FFmpeg (T-02) | L |
| UC-VID-015 Lote | Adaptar | frontend, apiGateway, projects, wsGateway, imageStorageService | `archiver` | L |

**Decisões transversais:**

| **ID** | **Componente** | **Decisão** |
|---|---|:---:|
| T-00 | Fundação de vídeo mínima | Criar |
| T-01 | Contrato uniforme e registo de operações | Criar |
| T-02 | Worker de vídeo e executor de cadeias | Criar (utilitários `Tools/utils/` adaptados) |
| T-03 | Tarefas, estados, progresso e cancelamento | Adaptar (padrão de `process_msg`) + modelo novo |
| T-04 | Reserva de quota com vários créditos | Reutilizar |
| T-05 | Matriz de formatos e plano de cópia | Criar |
| T-06 | Cópia de pré-visualização MP4 | Criar |
| T-07 | Pré-visualizações estáticas (sharp) | Adaptar |
| T-08 | Armazenamento (URLs, estágios, `Range`, PUT) | Adaptar |
| T-09 | Gestão de lotes | Adaptar |
| T-10 | Correlação e auditoria | Adaptar |

---

## 6. Dependências Novas Propostas

| **Dependência** | **Tipo** | **Onde** | **Justificação** | **Nível de preferência** |
|---|---|---|---|:---:|
| **FFmpeg / FFprobe** (pacote `ffmpeg` do Debian, com `libx264`, `aac`, `mpeg4`, `libmp3lame`) | Binário de sistema | `Tools/video/Dockerfile` | Sem alternativa: todo o processamento e a inspeção de vídeo dependem dele, e REQ-VID-NFR-010 exige-o explicitamente em contentor Docker. É chamado por `subprocess`, sem *wrapper* Python | 4 |
| **archiver** (npm) | Biblioteca Node | `projects/package.json` | O `jszip` existente não suporta ZIP64 e gera o arquivo em memória; os lotes Premium podem passar os 4 GB. O `archiver` gera em *streaming* com ZIP64 | 4 |
| Tipos de letra (e.g. `fonts-dejavu-core`) | Pacote de sistema | `Tools/video/Dockerfile` | Só se a marca de água de texto (UC-VID-004, fundação) usar `drawtext`. Não é exigido pelos UC-VID-006 a 015 | 4 (condicional) |

Dependências consideradas e **não** propostas: `ffmpeg-python`, PyAV, `fluent-ffmpeg` (T-02), `ajv` (T-01), `boto3` (o worker usa URLs pré-assinados com `requests`, que já está no projeto).

---

## 7. Questões em Aberto

| **ID** | **Questão** | **Impacto** | **Origem** |
|---|---|:---:|---|
| **Q-ADD-01** | A fundação de vídeo (UC-VID-000 a 005) não está implementada (2.5). Deve ser construída antes dos UC-VID-006 a 015 segundo T-00 e T-02, ou a equipa prefere outra ordem (e.g. o executor de cadeias primeiro, com o recorte como primeira operação)? | Alto | Código |
| **Q-ADD-02** | O processamento de imagens de um projeto (`activeToken`) conta como "tarefa ativa" para o limite de 1 tarefa de vídeo por projeto (REQ-VID-NFR-008)? | Médio | `projects/routes/projects.js` |
| **Q-ADD-03** | A reserva em `users/routes/users.js` é um `GET` com efeitos secundários e um ciclo ler-modificar-escrever não atómico. A equipa aceita o risco de corrida no MVP ou quer um `$inc` condicional? E aceita modelar a "confirmação" (REQ-VID-QUOTA-003) como a ausência de devolução? | Médio | `users/routes/users.js` |
| **Q-ADD-04** | O upload de vídeos até 2 GB atravessa o API Gateway e o serviço de projetos com `multer.memoryStorage()` (`apiGateway/routes/projects.js`, `projects/routes/projects.js`, `imageStorageService/route/upload.js`). Qual é a estratégia de upload da fundação: *streaming* pelos serviços ou upload direto com URL pré-assinado PUT? | Alto | Código (UC-VID-000) |
| **Q-ADD-05** | REQ-VID-DOWNLOAD-002 e NFR-001 pedem um URL "associado ao utilizador" (403 para outro utilizador). Os URLs pré-assinados S3 são portadores. Aceita-se a validade de 15 min como controlo, ou é preciso um *proxy* autenticado (que contraria NFR-016)? | Médio | `imageStorageService/services/getPresignedUrl.js` |
| **Q-ADD-06** | As pré-visualizações usam o "primeiro fotograma", mas a miniatura de REQ-VID-UPLOAD-014 é extraída a 00:00:01. Confirma-se guardar um fotograma 0 separado? | Baixo | REQ-VID-ADJUST-005, UPLOAD-014 |
| **Q-ADD-07** | Quais são as matrizes de cor exatas dos filtros Vintage, Frio e Quente? Aceita-se restringir o catálogo a transformações lineares (sem vinheta nem grão) para a pré-visualização coincidir com o resultado? | Médio | DQ-021, UC-VID-009 A1 |
| **Q-ADD-08** | Que sufixo se usa no nome sugerido para resultados de cadeias, junções e lotes (REQ-VID-DOWNLOAD-005)? E qual é o nome base de uma junção com várias origens? | Baixo | UC-VID-006 RN5 |
| **Q-ADD-09** | Um ZIP de lote Premium pode chegar a ~100 GB. Há limite? Quanto tempo fica guardado no estágio `video_zip` e quem o apaga? | Médio | REQ-VID-BATCH-015 |
| **Q-ADD-10** | Quantas réplicas do worker de vídeo se lançam no `docker-compose.yaml`? Com uma só, uma tarefa Premium de 60 min bloqueia todos os outros projetos. | Médio | REQ-VID-NFR-006, 008 |
| **Q-ADD-11** | Que parâmetros de qualidade de codificação se usam (CRF e *preset* do `libx264`, `-q:v` do `mpeg4`, bitrate do áudio)? UC-VID-012 Q1 remete para "valores por omissão da equipa", que não estão definidos. | Médio | UC-VID-012 Q1 |
| **Q-ADD-12** | A marca de água de imagem é uma imagem Docker externa (`prcsousa/picturas-watermark-tool-ms`) sem código no repositório. Confirma-se que a marca de água de vídeo (UC-VID-004, passo de cadeia) é implementada de raiz no worker de vídeo? | Médio | `docker-compose.yaml` |
| **Q-ADD-13** | Para vídeos com etiqueta de rotação, o painel de informações e as validações de redimensionamento usam as dimensões de apresentação ou as codificadas? (O ADD assume as de apresentação.) | Baixo | UC-VID-011 Q2, REQ-VID-INFO-003 |
| **Q-ADD-14** | Como se recuperam tarefas presas em `processing` se um worker morrer (sem *ack*, sem *timeout*)? Propõe-se um *timeout* por tarefa proporcional à duração e uma rotina de limpeza de temporários e objetos órfãos (REQ-VID-ERROR-003). A equipa valida? | Médio | REQ-VID-NFR-007 |
| **Q-ADD-15** | O endpoint de validação (T-01) responde em tempo real ao editor. Há um orçamento de latência para a validação (≤ 1 s como em NFR-005)? | Baixo | REQ-VID-CHAIN-003, BATCH-004 |
| **Q-ADD-16** | Num grafo FFmpeg único não há fronteiras observáveis entre passos. Aceita-se que o "passo corrente" de REQ-VID-CHAIN-012 seja aproximado (fase do plano ou proporção do tempo), ou é preciso executar passo a passo (o que contraria NFR-013)? | Médio | REQ-VID-CHAIN-012 vs NFR-013 |
| **Q-ADD-17** | O projeto não tem CI nem testes automáticos (2.3). Será criada uma pipeline mínima (build das imagens e testes do registo de operações e do compilador de grafos com vídeos de referência) no âmbito desta fase? | Médio | `.github/` |
| **Q-ADD-18** | O contraste de imagem (`ImageEnhance.Contrast`) usa a média da imagem como pivô; no vídeo propõe-se um pivô fixo (128), como já faz o `applyToolsPreview`. A equipa aceita esta diferença face à DQ-020 ("mesma semântica")? | Baixo | DQ-020, `Tools/contrast/contrast.py` |
| **Q-ADD-19** | O `aws-sdk` v2 (`imageStorageService`) e o `mongo:4.4` estão em fim de suporte. Migrar (`@aws-sdk/client-s3` v3 com `@aws-sdk/s3-request-presigner`) fica para a Fase 2 ou entra agora, já que T-08 altera `getPresignedUrl.js`? | Baixo | `imageStorageService/package.json`, `docker-compose.yaml` |
