---
unit: 002-video-transformations
intent: 001-video-processing-support
created: 2026-10-22T16:32:12Z
last_updated: 2026-10-22T18:25:00Z
---

# Construction Log: 002-video-transformations

## Original Plan

**From Inception**: 4 bolts planned
**Planned Date**: 2026-10-19T17:31:16Z

| Bolt ID | Stories | Type |
|---------|---------|------|
| 004-video-basic-edits | ST-VID-001, ST-VID-002, ST-VID-003 | ddd-construction-bolt |
| 005-video-visual-edits | ST-VID-004, ST-VID-008, ST-VID-009, ST-VID-010, ST-VID-011 | simple-construction-bolt |
| 006-video-frame-export | ST-VID-005 | ddd-construction-bolt |
| 007-video-format-conversion | ST-VID-012 | simple-construction-bolt |

## Replanning History

| Date | Action | Change | Reason | Approved |
|------|--------|--------|--------|----------|

## Current Bolt Structure

| Bolt ID | Stories | Status | Changed |
|---------|---------|--------|---------|
| 004-video-basic-edits | ST-VID-001, ST-VID-002, ST-VID-003 | ⏳ in-progress | - |
| 005-video-visual-edits | ST-VID-004, ST-VID-008, ST-VID-009, ST-VID-010, ST-VID-011 | [ ] planned | - |
| 006-video-frame-export | ST-VID-005 | 🚫 blocked (D-06) | - |
| 007-video-format-conversion | ST-VID-012 | [ ] planned | - |

## Execution History

| Date | Bolt | Event | Details |
|------|------|-------|---------|
| 2026-10-22T16:32:12Z | 004-video-basic-edits | started | Stage 1: Domain Model |
| 2026-10-22T16:42:11Z | 004-video-basic-edits | stage-complete | Domain Model → Technical Design (D-49 a D-53) |
| 2026-10-22T16:58:47Z | 004-video-basic-edits | stage-complete | Technical Design → ADR Analysis |
| 2026-10-22T18:25:00Z | 004-video-basic-edits | stage-complete | ADR Analysis → Implement (ADR-007 e ADR-008, revisados e aprovados) |

## Execution Summary

| Metric | Value |
|--------|-------|
| Original bolts planned | 4 |
| Current bolt count | 4 |
| Bolts completed | 0 |
| Bolts in progress | 1 |
| Bolts remaining | 2 (mais 1 `blocked`, D-06) |
| Replanning events | 0 |

## Notes

- 2026-10-22T16:32:12Z: B004 iniciada. Complexidade preenchida no início do bolt (D-01): `avg_uncertainty` 2 (cópia condicionada ao *keyframe* e cadência da velocidade por decidir), `max_dependencies` 2 (B003 e Unit 001), `testing_scope` 3 (worker com FFmpeg real, E2E pela pilha e painéis no navegador). Regras da equipa: fontes por ordem `docs/add.md` (mestre), `docs/specsDuvidas.md`, `memory-bank/standards/decision-index.md`, o bolt e as stories, `docs/requirements/` e `docs/use-cases/`, sem o `docs/merge.md`; regra 2.6 também para o código das B001 a B003 (só acréscimo); dúvidas novas a partir da D-49, com paragem no checkpoint seguinte; ramo `bolt/004-video-basic-edits`, commit e push no fim de cada etapa, sem merge para a `main`.
- 2026-10-22T16:42:11Z: B004 Estágio 1 aprovado (`ddd-01-domain-model.md`) com as decisões D-49 a D-53: cópia condicionada ao *keyframe* no plano, verificada pelo worker, com o áudio a seguir o vídeo (D-49); `trim {startMs, endMs}`, `remove_audio {}`, `speed {factor}` (D-50); intervalo mínimo de um fotograma (D-51); velocidade com `fps=<taxa original>` (D-52); fator 1.0 → `NO_CHANGES` (D-53). Na D-52 e na D-53 a equipa escreveu "(a)" com o conteúdo da opção (b) recomendada; registado pelo conteúdo.
- 2026-10-22T16:58:47Z: B004 Estágio 2 aprovado (`ddd-02-technical-design.md`), sem dúvidas novas. O bolt para aqui e é continuado por outra pessoa noutra máquina, a partir do ramo `bolt/004-video-basic-edits`.
- **Para o Estágio 3 (ADR Analysis), pedido da equipa:**
  - **ADR-007:** o worker escolhe entre duas alternativas do plano, ambas calculadas no serviço de projetos (cópia no *keyframe* do recorte, `keyframeCopy`, D-49): o serviço de projetos decide se a cópia é permitida e o worker só verifica o *keyframe* com o FFprobe. Vai além da letra do T-01 ("o worker não volta a tomar esta decisão") e afeta a B008.
  - **ADR-008:** o `projects/video/planExtras.js` como padrão para estender o plano sem mudar o `plan.js` da B003 (regra 2.6), a seguir pelas B005, B007 e B008 quando precisarem de dados que o `estimate` e os `copyable` booleanos não exprimem.
  - Depois dos dois ADR, acrescentá-los ao `memory-bank/standards/decision-index.md` e parar no checkpoint do Estágio 3. No Estágio 4, fazer primeiro as verificações V1 a V8 do desenho técnico (a mais importante é a V2(a): `audio: none` a partir do `estimate` do último passo, de que a `remove_audio` precisa).
- 2026-10-22T18:25:00Z: B004 Estágio 3 aprovado (ADR-007 e ADR-008, após revisão): cópia condicionada ao *keyframe* com `plan.keyframeCopy {atMs, endMs, video, audio, preview, dropStep}` calculado pelo serviço de projetos; worker escolhe entre cópia e recodificação com `metadata.videoMode = "copy" | "encode"`; `applyPlanExtras(plan, steps, inputProps, registry)` como padrão de extensão sem alterar o `plan.js` (regra 2.6). Etapa 4 (Implement) em curso: verificações V1–V8 primeiro.
- 2026-10-22T17:44:38Z: Retoma da B004 na etapa 4 confirmada pela equipa; preservadas as alterações locais anteriores. Verificações V1–V8 registadas em `memory-bank/bolts/004-video-basic-edits/implementation-preflight.md`, com evidência no código e duas sondagens isoladas em memória (sem integração/FFmpeg). Confirmados o helper de inserção `-ss/-to` após `build_command()`, a necessidade de adaptador do `step.input` até `speed.py` e o ponto de publicação de `metadata.videoMode` em `_reply()`. D-54 registada em `docs/specsDuvidas.md`: o destino `targets.preview` da alternativa de cópia exige esclarecer o limite do ADR-008; resposta pendente. Sem implementação nem conclusão da etapa 4; `plan.js`, ADR-007/008 e código existente intactos. Timestamp desta retoma obtido do relógio da sessão; os timestamps anteriores foram preservados sem correção.

- 2026-10-22T18:05:19Z: D-54 (a) aprovada pela equipa e refletida no ADR-008, desenho técnico, índice e preflight. Etapa 4 implementada: módulos JS/Python `trim`, `remove_audio`, `speed`; `planExtras` com destino de preview; adaptador de fps, seleção por keyframe, helper de `-ss/-to` e `metadata.videoMode` restrito à entrega; três painéis ligados às peças comuns da B003. TypeScript, ESLint, sintaxe e verificações isoladas passaram; integração, FFmpeg, regressões completas e browser não executados. Relatório e auditoria em `memory-bank/bolts/004-video-basic-edits/implementation-report.md`. `current_stage: implement` mantido até à revisão; etapa 5 não iniciada.
