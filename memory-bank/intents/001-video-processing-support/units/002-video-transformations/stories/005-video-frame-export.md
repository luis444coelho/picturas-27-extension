---
id: ST-VID-005
unit: 002-video-transformations
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 006-video-frame-export
implemented: false
---

# Story: ST-VID-005 — Extrair fotogramas

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** definir intervalo, passo e formato para extrair fotogramas
**So that** usar os fotogramas no projeto e nas ferramentas de imagem existentes

## Acceptance Criteria

- [ ] Com parâmetros válidos dentro do limite do perfil, quando confirmo a extração, então todas as imagens são adicionadas ao projeto com instante e proveniência do vídeo.
- [ ] Parâmetros que excedam limites ou não produzam extração válida são rejeitados antes de criar tarefa.
- [ ] A extração é atómica, mantém a resolução definida, e falha/cancelamento não deixa imagens parciais nem altera o vídeo de origem.

## Traceability

- **Use case:** UC-VID-005.
- **Requirements:** `REQ-VID-FRAMES-*; REQ-VID-COM-*; REQ-VID-NFR-004,019,020`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Funcionalidades ou limites que não constem da ERS v2.3.
