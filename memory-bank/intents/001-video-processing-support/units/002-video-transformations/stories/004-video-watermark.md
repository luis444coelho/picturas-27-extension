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

- [ ] Quando configuro uma marca de texto ou imagem válida (posição, escala de 5 a 50% e opacidade de 10 a 100%) e confirmo, então o sistema aplica-a na mesma posição em todos os fotogramas e gera um novo recurso, mantendo o áudio.
- [ ] Conteúdo vazio, imagem inválida ou geometria fora da área visível é rejeitado antes de criar tarefa.
- [ ] A tarefa emite progresso de 0 a 100% pelo menos uma vez por segundo; falha ou cancelamento não altera o original nem publica resultado parcial.

## Traceability

- **Use case:** UC-VID-004.
- **Requirements:** `REQ-VID-WATERMARK-001` a `011`. Consome `REQ-VID-COM-*`, `REQ-VID-NFR-009`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes (ERS v2.4).
- **Decisões do ADD v1.1:** T-02 (`overlay` ou `drawtext`), Q-ADD-12 (implementação de raiz no worker de vídeo), ADD 6 (tipos de letra, só com `drawtext`).

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Alterar código existente (regra 2.6 do ADD: só acrescentar).
- Funcionalidades ou limites que não constem da ERS v2.4, dos casos de uso v1.5 ou do ADD v1.1.
