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

- [ ] Com vídeo que contém áudio, quando submeto a operação, então o resultado concluído contém a componente visual e não contém streams de áudio.
- [ ] Quando o vídeo não tem áudio ou os parâmetros/recurso não são elegíveis, então recebo o resultado de validação especificado e não é publicado resultado inválido.
- [ ] A operação é assíncrona, não destrutiva e segue a política comum de quota e falhas.

## Traceability

- **Use case:** UC-VID-002.
- **Requirements:** `REQ-VID-AUDIO-*; REQ-VID-COM-*`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Funcionalidades ou limites que não constem da ERS v2.3.
