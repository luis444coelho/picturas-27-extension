---
unit: 001-video-lifecycle
intent: 001-video-processing-support
created: 2026-10-21T16:12:26Z
last_updated: 2026-10-22T15:25:53Z
---

# Construction Log: 001-video-lifecycle

## Original Plan

**From Inception**: 3 bolts planned
**Planned Date**: 2026-10-19T17:31:16Z

| Bolt ID | Stories | Type |
|---------|---------|------|
| 001-video-lifecycle | ST-VID-000 | ddd-construction-bolt |
| 002-video-access | ST-VID-006, ST-VID-007 | simple-construction-bolt |
| 003-video-task-foundation | ST-VID-COM-001 | ddd-construction-bolt |

## Replanning History

| Date | Action | Change | Reason | Approved |
|------|--------|--------|--------|----------|

## Current Bolt Structure

| Bolt ID | Stories | Status | Changed |
|---------|---------|--------|---------|
| 001-video-lifecycle | ST-VID-000 | ✅ complete | - |
| 002-video-access | ST-VID-006, ST-VID-007 | ✅ complete | - |
| 003-video-task-foundation | ST-VID-COM-001 | ⏳ in-progress | - |

## Execution History

| Date | Bolt | Event | Details |
|------|------|-------|---------|
| 2026-10-21T16:12:26Z | 001-video-lifecycle | started | Stage 1: Domain Model |
| 2026-10-21T16:19:54Z | 001-video-lifecycle | stage-complete | Domain Model → Technical Design |
| 2026-10-21T23:38:33Z | 001-video-lifecycle | stage-complete | Technical Design → ADR Analysis |
| 2026-10-21T23:46:03Z | 001-video-lifecycle | stage-complete | ADR Analysis → Implement (ADR-001, ADR-002) |
| 2026-10-22T08:37:38Z | 001-video-lifecycle | stage-complete | Implement → Test |
| 2026-10-22T10:32:46Z | 001-video-lifecycle | completed | All 5 stages done |
| 2026-10-22T13:32:32Z | 002-video-access | started | Stage 1: Plan |
| 2026-10-22T13:38:11Z | 002-video-access | stage-complete | Plan → Implement (D-34, D-35) |
| 2026-10-22T14:44:41Z | 002-video-access | stage-complete | Implement → Test |
| 2026-10-22T15:11:08Z | 002-video-access | stage-complete | Test → complete (D-36) |
| 2026-10-22T15:11:16Z | 002-video-access | completed | All 3 stages done |
| 2026-10-22T15:15:43Z | 003-video-task-foundation | started | Stage 1: Domain Model |
| 2026-10-22T15:25:53Z | 003-video-task-foundation | stage-complete | Domain Model → Technical Design (D-37 a D-43) |

## Execution Summary

| Metric | Value |
|--------|-------|
| Original bolts planned | 3 |
| Current bolt count | 3 |
| Bolts completed | 2 |
| Bolts in progress | 1 |
| Bolts remaining | 1 |
| Replanning events | 0 |

## Notes

- Checkpoint do Estágio 1 aprovado com as decisões D-11 a D-14 (`docs/specsDuvidas.md`); a Q-ADD-04 ficou resolvida pela D-11 (PUT pré-assinado).
- Regras da equipa para a B001: o `docs/add.md` é o mestre, seguido de `docs/specsDuvidas.md`, do bolt e das suas stories, de `docs/requirements/` e de `docs/use-cases/`; não se usa o `docs/merge.md`. O que não estiver nas fontes vai para `docs/specsDuvidas.md` (D-15 e seguintes) e para no checkpoint seguinte. Ramo `bolt/001-video-lifecycle`, com um commit por etapa, sem push.
- Checkpoint do Estágio 2 aprovado com as decisões D-15 a D-22 (`docs/specsDuvidas.md`). A limpeza dos carregamentos abandonados (D-15) passou para o âmbito da B003 (rotina da Q-ADD-14), registada em `bolts/003-video-task-foundation/bolt.md`.
- Checkpoint do Estágio 4 aprovado com as decisões D-23 e D-24. Nenhuma linha de código existente foi alterada (só linhas acrescentadas em 8 ficheiros).
- 2026-10-22T09:08:10Z: Estágio 5 executado: 40 testes unitários (projetos), 25 (worker com FFmpeg 5.1), 24 E2E e 2 de transferências grandes, todos a passar (`ddd-03-test-report.md`). 5 defeitos corrigidos; D-25 a D-29 registados para a equipa. À espera da aprovação do checkpoint final para fechar o bolt com `bolt-complete.cjs`.
- 2026-10-22T10:25:00Z: Pedido da equipa no checkpoint do Estágio 5: D-30 (criar projeto a partir de um vídeo; REQ-VID-UPLOAD-021, UC-VID-000 FA6, novo AC na ST-VID-000) e D-31 (vídeos concluídos na área principal do projeto). Implementados por acréscimo no frontend e testados: 8 unitários, 3 E2E pela API e 6 no navegador, todos a passar; regressão sem falhas. Corrigido o aviso de formato não suportado no `react-dropzone`. D-32 (pormenores de interface) registada como pendente. O bolt continua à espera da aprovação final.
- 2026-10-22T10:45:00Z: Checkpoint final aprovado. D-25, D-26 e D-32 aceites; D-27 (`error_log crit` no `/s3-video/`) e D-28 (religação do código de vídeo ao RabbitMQ) implementadas e verificadas; D-29 passa para a B002. Regressão 108/108. Dados de teste `e2e-*` apagados da base de dados e do storage.
- 2026-10-22T10:32:46Z: `bolt-complete.cjs 001-video-lifecycle` executado (com `NODE_PATH` para as dependências do specsmd): bolt `in-progress → complete`; unit e intent sem alteração (2 bolts da unit por fazer). A ST-VID-000 não foi atualizada ("File not found": o script procura `ST-VID-000*.md` e o ficheiro é `001-video-ingestion.md`); registado como D-33, pendente.
- 2026-10-22T10:55:00Z: D-33 respondida (a): stories renomeadas para `ST-VID-xxx-<nome>.md` com `git mv` e ligações atualizadas (0 ligações partidas); ST-VID-000 atualizada à mão para `status: complete` e `implemented: true`, como o script faria.
- 2026-10-22T13:38:11Z: B002 Estágio 1 aprovado. Verificação da D-29 feita no stack (SigV2 com `response-content-disposition` → 403; SigV4 só funciona com `Host: seaweedfs:9000`; `Range` → 206; expirado → 403). D-34 (a): atributo `download` da âncora. D-35 (a): resposta à Q-ADD-08. Ramo `bolt/002-video-access`, commit e push no fim de cada etapa, sem merge para a `main`.
- 2026-10-22T13:44:28Z: B002 Estágio 2 implementado (`implementation-walkthrough.md`): rotas de informações e de descarregamento, `fileName.js`, `access.js` e componentes do frontend, só por acréscimo (0 linhas removidas). Verificado no stack; à espera do checkpoint.
- 2026-10-22T14:52:05Z: B002 Estágio 3 executado (`test-walkthrough.md`): 60 testes novos (28 unitários do serviço de projetos, 10 do frontend, 18 E2E e 4 no navegador, incluindo a verificação da D-34 com `Férias São João.avi`) e regressão da B001 108/108; 168/168 a passar. Dados de teste apagados (23 utilizadores, 21 projetos, 29 vídeos, 11 *buckets*). D-36 registada, em aberto. À espera do checkpoint final para fechar o bolt com `bolt-complete.cjs`.
- 2026-10-22T15:11:31Z: Checkpoint final da B002 aprovado (teste manual da equipa: informações, reprodução e descarregamento a funcionar). D-36 respondida (a). `bolt-complete.cjs 002-video-access` executado (com `NODE_PATH` para as dependências do specsmd): bolt `in-progress → complete`, ST-VID-006 e ST-VID-007 `ready → complete` com `implemented: true`; unit e intent sem alteração (falta a B003). Ramo `bolt/002-video-access` sem merge para a `main`.
- 2026-10-22T15:25:53Z: B003 Estágio 1 aprovado (`ddd-01-domain-model.md`) com as decisões D-37 a D-43; D-42 com opção nova da equipa (código novo no fim do `MESSAGES` de `projects/video/errors.js`, nome na D-44). Regras da equipa para a B003: fontes por ordem `docs/add.md` (mestre), `docs/specsDuvidas.md`, `memory-bank/standards/decision-index.md`, o bolt e a story, `docs/requirements/` e `docs/use-cases/`, sem o `docs/merge.md`; regra 2.6 também para o código das B001 e B002 (só acréscimo); nada de lotes (D-06) nem operações concretas (B004, B005, B007); a `test_reencode` só com `VIDEO_TEST_OPERATIONS=1`, inativa no `docker-compose.yaml`; a rotina da Q-ADD-14 inclui os carregamentos abandonados (D-15); dúvidas novas a partir da D-44, com paragem no checkpoint seguinte; rebuilds com `--no-deps` (SeaweedFS no porto 9091 do host por um `docker-compose.override.yml` local, fora do git). Ramo `bolt/003-video-task-foundation`, commit e push no fim de cada etapa, sem merge para a `main`.
