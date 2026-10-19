---
id: ST-VID-001
unit: 002-video-transformations
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 004-video-basic-edits
implemented: false
---

# Story: ST-VID-001 — Recortar vídeo

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** definir um intervalo temporal e criar um segmento
**So that** obter apenas o trecho pretendido preservando a origem

## Acceptance Criteria

- [ ] Com vídeo elegível e intervalo dentro da duração, quando submeto o recorte, então é criada uma tarefa e, ao concluir, um novo vídeo contém o intervalo pedido.
- [ ] Se os tempos forem inválidos, o sistema rejeita antes de iniciar tarefa ou debitar quota.
- [ ] Falha/cancelamento não altera o original nem publica segmento parcial.

## Traceability

- **Use case:** UC-VID-001.
- **Requirements:** `REQ-VID-TRIM-*; REQ-VID-COM-*`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Funcionalidades ou limites que não constem da ERS v2.3.
