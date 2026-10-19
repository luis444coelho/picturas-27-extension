---
id: ST-VID-012
unit: 002-video-transformations
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 007-video-format-conversion
implemented: false
---

# Story: ST-VID-012 — Converter formato

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** escolher um formato de saída suportado
**So that** obter uma versão compatível com o destino pretendido

## Acceptance Criteria

- [ ] Quando escolho uma combinação de contentor e codecs da matriz, então o sistema converte e publica um novo vídeo descodificável.
- [ ] Combinação não suportada é rejeitada antes de criar tarefa.
- [ ] A conversão respeita os leitores/formato definidos e preserva o original.

## Traceability

- **Use case:** UC-VID-012.
- **Requirements:** `REQ-VID-CONVERT-*; REQ-VID-NFR-003,012,018,026`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Funcionalidades ou limites que não constem da ERS v2.3.
