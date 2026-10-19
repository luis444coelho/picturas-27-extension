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

- [ ] Com acesso de leitura a um recurso de vídeo, quando consulto as informações, então vejo os metadados definidos para o recurso.
- [ ] Quando não tenho acesso ao projeto ou recurso, então o sistema recusa a consulta sem expor metadados.
- [ ] A consulta é apenas de leitura, não cria tarefa e não consome quota.

## Traceability

- **Use case:** UC-VID-007.
- **Requirements:** `REQ-VID-INFO-*; REQ-VID-AUTH-*`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Funcionalidades ou limites que não constem da ERS v2.3.
