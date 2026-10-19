---
id: ST-VID-004
unit: 002-video-transformations
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 005-video-visual-edits
implemented: false
---

# Story: ST-VID-004 — Aplicar marca de água

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** configurar e aplicar marca de água de texto ou imagem
**So that** identificar ou proteger visualmente o vídeo

## Acceptance Criteria

- [ ] Quando configuro uma marca válida e confirmo, então o sistema aplica-a de forma consistente durante o vídeo e gera novo recurso.
- [ ] Configuração ou imagem fora dos limites aprovados é rejeitada antes de criar tarefa.
- [ ] A tarefa expõe estado/progresso aplicável e falha/cancelamento não altera o original nem publica resultado parcial.

## Traceability

- **Use case:** UC-VID-004.
- **Requirements:** `REQ-VID-WATERMARK-*; REQ-VID-COM-*`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Funcionalidades ou limites que não constem da ERS v2.3.
