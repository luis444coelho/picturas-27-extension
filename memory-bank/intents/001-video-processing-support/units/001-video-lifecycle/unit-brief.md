---
unit: 001-video-lifecycle
intent: 001-video-processing-support
phase: inception
status: ready
created: 2026-10-18T18:00:00Z
updated: 2026-10-19T17:31:16Z
default_bolt_type: ddd-construction-bolt
---

# Unit Brief: Ciclo de vida e acesso a vídeo

## Objetivo e âmbito

Disponibilizar recursos de vídeo autorizados em projetos e definir os contratos partilhados de tarefa, quota, storage e erro consumidos pelas operações seguintes. É uma fatia vertical da aplicação web: inclui a interface de upload, reprodução, consulta e download, os endpoints e a persistência correspondente.

**Casos:** UC-VID-000, UC-VID-006, UC-VID-007. **Stories:** ST-VID-000, ST-VID-006, ST-VID-007, ST-VID-COM-001.

## Requisitos atribuídos

- **71 FR (propriedade exclusiva):** `REQ-VID-COM-*` (33, incluindo AUTH, QUOTA, STORAGE, TASK e ERROR), `REQ-VID-UPLOAD-*` (20), `REQ-VID-DOWNLOAD-*` (9), `REQ-VID-INFO-*` (9).
- **NFR (13):** `REQ-VID-NFR-001`, `002`, `003`, `005` a `009`, `011`, `016`, `017`, `021`, `025`.
- Outras Units consomem contratos comuns, mas não voltam a ser donas desses FR.

## Conceitos, interfaces e limites

- Conceitos: Projeto, RecursoMultimédia, Vídeo, Utilizador, TrabalhoProcessamento, SaldoQuotaDiária.
- Responsabilidades: validar JWT e permissão do projeto; validar contentor/codec e limite do perfil; persistir recurso e metadados; gerar thumbnail e cópia de preview quando prevista; expor consulta e download autorizado; definir contratos de tarefa, cancelamento, estado, quota, erro e limpeza.
- Entrada: ficheiro local ou pedido autorizado de consulta/download. Saída: recurso de vídeo íntegro e metadados consultáveis, URL temporário de storage quando autorizado e contrato de tarefa comum.
- Não executa transformações, extração de fotogramas, junções, cadeias ou lotes.

## Dependências e critérios de sucesso

- Depende da baseline: autenticação JWT, permissões (incluindo leitura vs edição), projeto, MongoDB, SeaweedFS/S3, WebSockets e quota diária existente.
- O upload e a leitura/download não debitam quota. A identidade que submete trabalho é a identidade cuja quota é contabilizada.
- Aceita somente a matriz de formatos aprovada e os limites de perfil da ERS; publicação de um recurso exige integridade entre objeto e metadados.
- Critérios: UC-VID-000, 006, 007 e ST-VID-COM-001 cumprem os AC rastreados; pedido sem autorização não expõe metadados nem URL; falhas deixam projeto e storage sem estado parcial.

## Bolts

- B001 `001-video-lifecycle` (DDD): UC-VID-000 e contratos de recurso/autorização/storage.
- B002 `002-video-access` (Simple): UC-VID-006/007; depende de B001.
- B003 `003-video-task-foundation` (DDD): contratos de processamento e quota; depende de B001 e desbloqueia as Units 002/003.
