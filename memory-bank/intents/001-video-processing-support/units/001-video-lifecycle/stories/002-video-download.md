---
id: ST-VID-006
unit: 001-video-lifecycle
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 002-video-access
implemented: false
---

# Story: ST-VID-006 — Descarregar vídeo

## User Story

**As a** Utilizador Registado ou Premium com permissão de leitura, edição ou propriedade
**I want** descarregar um vídeo concluído do projeto
**So that** obter uma cópia do recurso autorizado no formato armazenado

## Acceptance Criteria

- [ ] Com acesso de leitura a um vídeo concluído, quando peço o descarregamento, então recebo acesso temporário ao objeto autorizado.
- [ ] Quando não tenho acesso ou o vídeo não está concluído, então o pedido é recusado e não é emitido URL.
- [ ] Quando retomo uma transferência interrompida, então o storage serve o intervalo solicitado e não há débito de quota.

## Traceability

- **Use case:** UC-VID-006.
- **Requirements:** `REQ-VID-DOWNLOAD-*; REQ-VID-NFR-001,016,025`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Funcionalidades ou limites que não constem da ERS v2.3.
