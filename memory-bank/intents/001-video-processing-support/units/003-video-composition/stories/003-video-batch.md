---
id: ST-VID-015
unit: 003-video-composition
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 009-video-batch
implemented: false
---

# Story: ST-VID-015 — Processar vídeos em lote

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** aplicar uma operação elegível ou cadeia a vários vídeos
**So that** uniformizar resultados e acompanhar cada item individualmente

## Acceptance Criteria

- [ ] Quando seleciono 2 ou mais vídeos dentro do limite do perfil e uma configuração elegível, então o sistema pré-valida entradas e custo total antes de aceitar o lote.
- [ ] O lote é processado sequencialmente e informa progresso agregado e estado por vídeo; cada sucesso cria recurso independente.
- [ ] Falha/cancelamento de um item devolve os créditos desse item e não remove resultados já concluídos; junção e extração de fotogramas não são elegíveis.

## Traceability

- **Use case:** UC-VID-015.
- **Requirements:** `REQ-VID-BATCH-*; REQ-VID-QUOTA-007,008; REQ-VID-NFR-014,021`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Funcionalidades ou limites que não constem da ERS v2.3.
