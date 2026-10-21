---
unit: 001-video-lifecycle
intent: 001-video-processing-support
phase: inception
status: ready
created: 2026-10-18T18:00:00Z
updated: 2026-10-21T11:10:16Z
default_bolt_type: ddd-construction-bolt
---

# Unit Brief: Ciclo de vida e acesso a vídeo

## Objetivo e âmbito

Disponibilizar recursos de vídeo autorizados em projetos e definir os contratos partilhados de tarefa, quota, storage e erro consumidos pelas operações seguintes. É uma fatia vertical da aplicação web: inclui a interface de upload, reprodução, consulta e download, os endpoints e a persistência correspondente.

**Casos:** UC-VID-000, UC-VID-006, UC-VID-007. **Stories:** ST-VID-000, ST-VID-006, ST-VID-007, ST-VID-COM-001.

## Requisitos atribuídos

- **71 FR (propriedade exclusiva):** `REQ-VID-COM-*` (33, incluindo AUTH, QUOTA, STORAGE, TASK e ERROR), `REQ-VID-UPLOAD-*` (20), `REQ-VID-DOWNLOAD-*` (9), `REQ-VID-INFO-*` (9).
- **NFR (16):** `REQ-VID-NFR-001`, `002`, `003`, `005` a `011`, `013`, `016`, `017`, `018`, `021`, `025`. A NFR-010 passa para a B001 e a NFR-013 e a NFR-018 para a B003, que constroem o worker e o executor (specsDuvidas D-03).
- Não cobertos nesta construção (specsDuvidas D-06): `REQ-VID-TASK-007` e a parte de lotes da `REQ-VID-QUOTA-007`.
- Outras Units consomem contratos comuns, mas não voltam a ser donas desses FR.

## Conceitos, interfaces e limites

- Conceitos: Projeto, RecursoMultimédia, Vídeo, Utilizador, TrabalhoProcessamento, SaldoQuotaDiária.
- Responsabilidades: validar JWT e permissão do projeto (`videoAuth`, `checkSharePermission`, `requireEditPermission`); validar contentor/codec (`formats.js`, T-05) e limite do perfil; persistir recurso e metadados na coleção `videos` (T-00), incluindo rotação e dimensões de apresentação (Q-ADD-13); gerar miniatura, fotograma 0 e cópia de pré-visualização MP4 (T-06, T-07, Q-ADD-20, Q-ADD-22); expor consulta e descarregamento por URL portador de 15 min via `/s3-video/` (4.1, 4.2, T-08, Q-ADD-05); construir o contrato `{operation, version, parameters}`, o registo de operações, o worker único e o executor de cadeias (T-01, T-02); tarefas `VideoTask`, `video_project_locks`, filas de vídeo e `video_control`, eventos `wsGateway/video.js` (T-03); reserva e devolução de quota sem passo de confirmação (T-04, Q-ADD-03); correlação e formato de erro (T-10); rotina periódica da Q-ADD-14 para tarefas paradas, lugares sem dono e recursos de vídeo de projetos apagados (specsDuvidas D-04). Não constrói o `VideoBatch`, o estágio `video_zip`, o campo `batch_id`, o endpoint de lote, os itens `batch_item`, a devolução por item, a rotina de lotes e ZIP nem o `archiver` (specsDuvidas D-06).
- Entrada: ficheiro local ou pedido autorizado de consulta/download. Saída: recurso de vídeo íntegro e metadados consultáveis, URL temporário de storage quando autorizado e contrato de tarefa comum.
- Não implementa as operações concretas (Unit 002), a junção, a validação de estrutura das cadeias nem os lotes (Unit 003); fornece-lhes o executor.

## Dependências e critérios de sucesso

- Depende da baseline: autenticação JWT, permissões (incluindo leitura vs edição), projeto, MongoDB, SeaweedFS/S3, WebSockets e quota diária existente.
- O upload e a leitura/download não debitam quota. A identidade que submete trabalho é a identidade cuja quota é contabilizada.
- Aceita somente a matriz de formatos aprovada e os limites de perfil da ERS; publicação de um recurso exige integridade entre objeto e metadados.
- Critérios: UC-VID-000, 006, 007 e ST-VID-COM-001 cumprem os AC rastreados; pedido sem autorização não expõe metadados nem URL; falhas deixam projeto e storage sem estado parcial; nenhuma linha de código existente é alterada (regra 2.6).

## Bolts

- B001 `001-video-lifecycle` (DDD): UC-VID-000 e a parte do T-00 de que a ingestão precisa: coleção `videos`, `videoStages.js` e URLs de escrita (T-08), `formats.js` (T-05), routers de vídeo com o `videoAuth`, filas `video_operations_queue`, `video_project_queue` e `video_ws_queue`, `wsGateway/video.js` e worker `Tools/video/` com a ingestão (T-06); dona dos `REQ-VID-AUTH-*` e da NFR-010 (specsDuvidas D-02, D-03). O bolt do `amqp.js`, dos URLs internos de leitura, do `route/video.js`, do volume `video_tmp` e dos argumentos da `video_operations_queue` está em specsDuvidas.md, D-08.
- B002 `002-video-access` (Simple): UC-VID-006/007 (ADD 4.1, 4.2); depende de B001.
- B003 `003-video-task-foundation` (DDD): `VideoTask`, `video_project_locks`, exchange `video_control`, quota (T-04), cancelamento e progresso (T-03), registo de operações (T-01), executor de cadeias e codificação por omissão (T-02), erros e correlação (T-10); rotina da Q-ADD-14 sem a parte de lotes (specsDuvidas D-02, D-04); dona da NFR-013 e da NFR-018 (specsDuvidas D-03); depende de B001 e desbloqueia B004 a B007 (a B006 está `blocked`, specsDuvidas D-06).
