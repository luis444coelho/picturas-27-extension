---
id: ST-VID-014
unit: 003-video-composition
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 008-video-concat-chain
implemented: false
---

# Story: ST-VID-014 — Encadear operações

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** definir uma sequência válida de operações para um ou mais vídeos elegíveis
**So that** executar várias transformações com um único resultado final consistente

## Acceptance Criteria

- [ ] Quando submeto uma cadeia dentro do limite de passos e compatibilidades, então o sistema valida a composição, apresenta o custo e cria uma tarefa única.
- [ ] Cadeia inválida, incluindo posição não permitida de conversão/junção ou extração excluída, é rejeitada antes da tarefa.
- [ ] A execução é atómica, gera um único resultado, respeita o limite de recodificação e mantém o original.

## Traceability

- **Use case:** UC-VID-014.
- **Requirements:** `REQ-VID-CHAIN-*; REQ-VID-NFR-003,013,022,023,024`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Funcionalidades ou limites que não constem da ERS v2.3.
