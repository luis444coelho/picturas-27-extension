---
id: ST-VID-COM-001
unit: 001-video-lifecycle
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 003-video-task-foundation
implemented: false
---

# Story: ST-VID-COM-001 — Acompanhar tarefas e quota de vídeo

## User Story

**As a** Utilizador Registado ou Premium autenticado
**I want** submeter e acompanhar tarefas de vídeo com estado, progresso, cancelamento e contabilização consistente
**So that** saber o resultado e não pagar por trabalho não concluído

## Acceptance Criteria

- [ ] Uma tarefa aceite percorre estados válidos e respeita o máximo de uma tarefa ativa por projeto.
- [ ] A quota é reservada e confirmada segundo o custo da operação/cadeia/lote; falha ou cancelamento devolve créditos não consumidos.
- [ ] Falha/cancelamento limpa temporários, não altera o original nem publica resultados parciais; upload, reprodução, pré-visualização, consulta e download não consomem quota.
- [ ] A autorização distingue leitura (consultar informações e descarregar) de edição ou propriedade (carregar e alterar recursos); uma permissão de leitura nunca permite submeter transformações.

## Traceability

- **Use case:** UC-VID-000 a UC-VID-015 (regras transversais).
- **Requirements:** `REQ-VID-COM-*; REQ-VID-AUTH-*; REQ-VID-QUOTA-*; REQ-VID-STORAGE-*; REQ-VID-TASK-*; REQ-VID-ERROR-*; REQ-VID-NFR-002,005,006,007,009,011,021`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Funcionalidades ou limites que não constem da ERS v2.3.
