---
unit: 002-video-transformations
intent: 001-video-processing-support
created: 2026-10-22T16:32:12Z
last_updated: 2026-10-22T20:40:42Z
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
| 004-video-basic-edits | ST-VID-001, ST-VID-002, ST-VID-003 | ✅ complete | - |
| 005-video-visual-edits | ST-VID-004, ST-VID-008, ST-VID-009, ST-VID-010, ST-VID-011 | ⏳ in-progress | - |
| 006-video-frame-export | ST-VID-005 | 🚫 blocked (D-06) | - |
| 007-video-format-conversion | ST-VID-012 | [ ] planned | - |

## Execution History

| Date | Bolt | Event | Details |
|------|------|-------|---------|
| 2026-10-22T16:32:12Z | 004-video-basic-edits | started | Stage 1: Domain Model |
| 2026-10-22T16:42:11Z | 004-video-basic-edits | stage-complete | Domain Model → Technical Design (D-49 a D-53) |
| 2026-10-22T16:58:47Z | 004-video-basic-edits | stage-complete | Technical Design → ADR Analysis |
| 2026-10-22T18:25:00Z | 004-video-basic-edits | stage-complete | ADR Analysis → Implement (ADR-007 e ADR-008, revisados e aprovados) |
| 2026-10-22T18:12:10Z | 004-video-basic-edits | stage-complete | Implement → Test (D-54) |
| 2026-10-22T20:02:18Z | 004-video-basic-edits | stage-complete | Test → complete (D-55 a D-57, ADR-009; testes manuais aprovados) |
| 2026-10-22T20:02:18Z | 004-video-basic-edits | completed | All 5 stages done |
| 2026-10-22T20:11:21Z | 005-video-visual-edits | started | Stage 1: Plan |
| 2026-10-22T20:22:31Z | 005-video-visual-edits | stage-complete | Plan → Implement (D-58 a D-64) |

## Execution Summary

| Metric | Value |
|--------|-------|
| Original bolts planned | 4 |
| Current bolt count | 4 |
| Bolts completed | 1 |
| Bolts in progress | 1 |
| Bolts remaining | 1 (mais 1 `blocked`, D-06) |
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

- 2026-10-22T18:12:10Z: Etapa 4 da B004 aprovada explicitamente pela equipa (commit `6a72c67`). Passagem à etapa 5 registada em `bolt.md`; criar suite persistente, executar FFmpeg 5.1 real, integração/regressões e frontend, mantendo o checkpoint de testes manuais e aprovação final pendentes.

- 2026-10-22T19:17:29Z: B004 etapa 5 preparada para checkpoint: 154 testes JS, 56 Python/FFmpeg 5.1.9, 50 frontend e 15 integração real passaram (275 casos distintos). Build de produção, TypeScript e ESLint executados e aprovados. D-55 (duração visual), D-56 (consulta explícita de controlo na ligação existente; ADR-009) e D-57 (recuo se o fim não for representável por cópia) respondidas pela equipa na opção (a) e implementadas. Precisão de recorte/PTS, B-frames e sincronismo corrigidos; `plan.js` intacto. Auditoria confirma só acréscimos face à main, incluindo ficheiros novos e B001–B003. Dados/buckets/diretórios próprios limpos; `test_reencode` desligada nos serviços. Resultados reais, falhas investigadas e limites em `ddd-03-test-report.md`; execução manual pendente em `manual-test-checklist.md`. `current_stage: test` e `status: in-progress` mantidos, sem fecho/merge. Aguardar testes manuais e aprovação explícita da equipa.

- 2026-10-22T20:02:18Z: Checkpoint final da B004 aprovado, retomado noutra máquina sem repetir a etapa 5 (resultados automáticos de `a5d60d2`). Testes manuais no browser feitos pela equipa, todos aprovados: recorte, recorte inválido, remover áudio, vídeo sem áudio, velocidade, cancelamento, regressão de vídeo e de imagem; registados em `manual-test-checklist.md` e `ddd-03-test-report.md` (os itens não reportados individualmente ficam indicados como tal). `bolt-complete.cjs 004-video-basic-edits` executado (com `NODE_PATH` para as dependências do specsmd): bolt `in-progress → complete`, ST-VID-001, ST-VID-002 e ST-VID-003 `ready → complete` com `implemented: true`; unit e intent sem alteração (3 bolts da unit por fazer, 2 units do intent). Entrada `test` de `stages_completed` acrescentada à mão, como na B001 e na B003. Ramo `bolt/004-video-basic-edits` sem merge para a `main` (a `main` já tem o merge `f343e27`, feito pela equipa antes deste fecho).
- 2026-10-22T20:11:21Z: B005 iniciada (Simple Construction Bolt, 3 etapas), no ramo `bolt/005-video-visual-edits` criado a partir da `main` com a B004. Regras da equipa: fontes por ordem `docs/add.md` (2.5, 2.6, T-01, T-02, T-05, T-07, 4.3 a 4.6 e as Q-ADD 07, 12, 13, 18, 23, 24 e 25), `docs/specsDuvidas.md` (D-01 a D-57), `decision-index.md` (ADR-001 a ADR-009), o bolt e as stories, `docs/requirements/` e `docs/use-cases/`, sem o `docs/merge.md`; regra 2.6 também para o código das B001 a B004; operações novas nos registos com linhas novas e extras do plano no padrão do ADR-008; T-07 em código novo, sem `applyToolsPreview`; D-39 pelo `encoding.js`; CRLF mantido; `test_reencode` desligada; dúvidas a partir da D-58 e ADR a partir do ADR-010; commit e push por etapa, sem merge. Etapa 1 escrita (`implementation-plan.md`); D-58 a D-64 registadas e pendentes: matrizes dos filtros (Q-ADD-07), texto da marca com `overlay` de um PNG gerado com o sharp ou com `drawtext` (Q-ADD-12), origem e armazenamento da imagem da marca, parâmetros e geometria da marca, pré-visualização da marca e o T-07, ponto de ligação dos extras do plano (o `planExtras.js` sai antes, quando não há `trim`, `remove_audio` nem `speed`) e pormenores da pré-visualização e do redimensionamento. Paragem no checkpoint da etapa 1.
- 2026-10-22T20:22:31Z: B005 Estágio 1 aprovado (`implementation-plan.md`) com as respostas D-58 (a), D-59 (a), D-60 (a) com limpeza só de marcas de projetos apagados ou sem referência em `VideoTask` nem em `recipe` ao fim de 24 h, D-61 (a) com ADR-010, D-62 (a), D-63 (a) com ADR-011 (separado do ADR-010) e D-64 (a), com o registo de que as predefinições na menor dimensão fogem à letra da RESIZE-003 e coincidem com ela num vídeo horizontal. Estágio 2 (Implement) em curso.
- 2026-10-22T20:40:42Z: B005 Estágio 2 implementado, à espera do checkpoint (`implementation-walkthrough.md`). Cinco operações no registo e no worker, endpoint de pré-visualização do T-07, miniaturas dos filtros, carregamento e pré-visualização da marca, limpeza das marcas e cinco painéis. ADR-010 (*middleware* do `_mark`) e ADR-011 (`planExtrasVisual.js` e `visual_input.py`) acrescentados ao `decision-index.md`. `git diff --numstat main` no código: 43 ficheiros, +2867, 0 removidas; os sete ficheiros existentes só com linhas acrescentadas. `express.raw` não existe no Express 4.16, o que pôs o `projects` em ciclo de reinício na primeira reconstrução; corrigido com um leitor próprio. TypeScript, ESLint, sintaxe, 401 sem JWT e sondagens isoladas (sharp e grafo FFmpeg da marca) passaram; testes persistentes, integração e browser ficam para o Estágio 3.
