---
id: ST-VID-007
unit: 001-video-lifecycle
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 002-video-access
implemented: false
---

# Story: ST-VID-007 — Consultar informações do vídeo

## User Story

**As a** Utilizador Registado ou Premium com permissão de leitura, edição ou propriedade
**I want** consultar os metadados técnicos de um vídeo
**So that** avaliar o recurso sem iniciar processamento nem consumir quota

## Acceptance Criteria

- [ ] Com permissão de leitura, edição ou de proprietário, quando abro as informações de um vídeo, então vejo a duração `hh:mm:ss.mmm`, a resolução de apresentação, o formato (contentor e codecs, ou sem áudio), o tamanho (1 MB = 1024² bytes, 1 GB = 1024³ bytes) e a taxa de fotogramas, lidos dos metadados persistidos.
- [ ] Para um vídeo resultante, vejo a proveniência e os passos aplicados; uma origem que já não exista aparece como "Vídeo removido".
- [ ] Um metadado em falta aparece como "Indisponível" e é registado `METADATA_UNAVAILABLE` com o `correlationId`.
- [ ] Sem acesso ao projeto, ou como anónimo, a consulta é recusada sem expor metadados; a consulta não cria tarefa nem consome quota.

## Traceability

- **Use case:** UC-VID-007.
- **Requirements:** `REQ-VID-INFO-001` a `009`. Consome `REQ-VID-AUTH-*`, `REQ-VID-QUOTA-008`, `REQ-VID-STORAGE-002`, `004`, `REQ-VID-NFR-017`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes (ERS v2.4).
- **Decisões do ADD v1.1:** 4.2, Q-ADD-13 (resolução de apresentação).

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Alterar código existente (regra 2.6 do ADD: só acrescentar).
- Funcionalidades ou limites que não constem da ERS v2.4, dos casos de uso v1.5 ou do ADD v1.1.
