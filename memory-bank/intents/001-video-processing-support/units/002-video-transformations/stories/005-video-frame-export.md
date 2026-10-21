---
id: ST-VID-005
unit: 002-video-transformations
intent: 001-video-processing-support
status: blocked
# motivo: Fora do âmbito desta construção por decisão da equipa (specsDuvidas D-06)
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 006-video-frame-export
implemented: false
---

# Story: ST-VID-005 — Extrair fotogramas

> 🚫 **Bloqueada.** Fora do âmbito desta construção por decisão da equipa (specsDuvidas D-06).

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** definir intervalo, passo e formato para extrair fotogramas
**So that** usar os fotogramas no projeto e nas ferramentas de imagem existentes

## Acceptance Criteria

- [ ] Com intervalo `[início, fim[`, passo N ≥ 1 s e formato JPEG ou PNG dentro do limite de fotogramas do perfil (50 Registado, 500 Premium), quando confirmo a extração, então todas as imagens são adicionadas ao projeto com o instante e a proveniência do vídeo.
- [ ] Parâmetros inválidos ou contagem acima do limite são rejeitados antes de criar tarefa.
- [ ] A extração é atómica e conserva a resolução da stream de origem; falha ou cancelamento não deixa imagens parciais nem altera o vídeo de origem, e devolve o crédito reservado.

## Traceability

- **Use case:** UC-VID-005.
- **Requirements:** `REQ-VID-FRAMES-001` a `013`; `REQ-VID-NFR-004`, `019`, `020`. Consome `REQ-VID-COM-*`. Os `REQ-VID-FRAMES-*` não são cobertos nesta construção (specsDuvidas D-06); a NFR-004, a 019 e a 020, que só servem a extração, também não são cobertas (specsDuvidas D-07). Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes (ERS v2.4).
- **Decisões do ADD v1.1:** o ADD não desenha a extração; se a B006 for retomada, a equipa escreve antes um complemento ao ADD (specsDuvidas D-05); exclusão de cadeias e lotes em 4.9 e 4.10.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Alterar código existente (regra 2.6 do ADD: só acrescentar).
- Funcionalidades ou limites que não constem da ERS v2.4, dos casos de uso v1.5 ou do ADD v1.1.
