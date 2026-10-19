---
id: ST-VID-000
unit: 001-video-lifecycle
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 001-video-lifecycle
implemented: false
---

# Story: ST-VID-000 — Carregar e visualizar vídeo

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** carregar, validar e visualizar um vídeo no projeto
**So that** poder gerir os seus recursos sem alterar a quota ao carregar ou reproduzir

## Acceptance Criteria

- [ ] Com JWT válido e permissão de edição, quando carrego um ficheiro dentro dos limites e matriz de formatos, então o sistema valida-o, guarda-o e associa metadados e miniatura ao projeto.
- [ ] Quando o ficheiro excede os limites, tem formato/codec não suportado ou falha a transferência, então o sistema rejeita o carregamento e não deixa objeto ou registo parcial.
- [ ] Quando abro um vídeo concluído, então posso reproduzi-lo no leitor integrado e o upload/reprodução não debitam quota.

## Traceability

- **Use case:** UC-VID-000.
- **Requirements:** `REQ-VID-UPLOAD-*; REQ-VID-COM-*; REQ-VID-NFR-001,003,007,008`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Funcionalidades ou limites que não constem da ERS v2.3.
