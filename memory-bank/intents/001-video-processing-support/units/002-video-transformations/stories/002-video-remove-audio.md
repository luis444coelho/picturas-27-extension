---
id: ST-VID-002
unit: 002-video-transformations
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 004-video-basic-edits
implemented: false
---

# Story: ST-VID-002 — Remover áudio

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** criar uma versão do vídeo sem streams de áudio
**So that** partilhar ou usar uma versão silenciosa sem alterar o original

## Acceptance Criteria

- [ ] Com um vídeo que contém áudio, quando confirmo a operação, então o resultado concluído contém a componente visual sem streams de áudio; de um MP4 H.264, o vídeo é copiado sem recodificação.
- [ ] Quando o vídeo não tem áudio, ou o recurso não é elegível, recebo o erro de validação especificado antes de criar tarefa.
- [ ] A operação é assíncrona, com progresso pelo menos uma vez por segundo, não destrutiva e segue a política comum de quota e falhas.

## Traceability

- **Use case:** UC-VID-002.
- **Requirements:** `REQ-VID-AUDIO-001` a `006`. Consome `REQ-VID-COM-*`, `REQ-VID-NFR-009`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes (ERS v2.4).
- **Decisões do ADD v1.1:** T-02 (`-an`), T-05 (cópia do vídeo).

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Alterar código existente (regra 2.6 do ADD: só acrescentar).
- Funcionalidades ou limites que não constem da ERS v2.4, dos casos de uso v1.5 ou do ADD v1.1.
