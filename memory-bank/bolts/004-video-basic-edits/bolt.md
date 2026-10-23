---
id: 004-video-basic-edits
unit: 002-video-transformations
intent: 001-video-processing-support
type: ddd-construction-bolt
status: complete
stories:
  - ST-VID-001
  - ST-VID-002
  - ST-VID-003
created: 2026-10-19T17:31:16.000Z
started: 2026-10-22T16:32:12.000Z
completed: "2026-10-22T20:02:18Z"
current_stage: null
stages_completed:
  - name: model
    completed: 2026-10-22T16:42:11.000Z
    artifact: ddd-01-domain-model.md
  - name: design
    completed: 2026-10-22T16:58:47.000Z
    artifact: ddd-02-technical-design.md
  - name: adr
    completed: 2026-10-22T18:25:00.000Z
    artifact: adr-007-keyframe-copy-worker-decision.md, adr-008-plan-extras.md
  - name: implement
    completed: 2026-10-22T18:12:10.000Z
    artifact: implementation-report.md
  - name: test
    completed: 2026-10-22T20:02:18Z
    artifact: ddd-03-test-report.md, manual-test-checklist.md
requires_bolts:
  - 003-video-task-foundation
enables_bolts:
  - 008-video-concat-chain
requires_units:
  - 001-video-lifecycle
blocks: true
complexity:
  avg_complexity: null
  avg_uncertainty: 2
  max_dependencies: 2
  testing_scope: 3
---

# Bolt: 004-video-basic-edits

## Visão geral

Recorte, remoção de áudio e alteração de velocidade (UC-VID-001, UC-VID-002, UC-VID-003) como módulos do registo de operações e do worker único da B003.

## Objetivo

Acrescentar ao registo de operações (T-01) e ao worker (T-02) as operações de recorte, remoção de áudio e velocidade, com os painéis de frontend correspondentes, usando o fluxo de aceitação, quota e cancelamento da B003.

## Stories incluídas

- **ST-VID-001 — Recortar vídeo**: [Recortar vídeo](../../intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-001-video-trim.md) (must).
- **ST-VID-002 — Remover áudio**: [Remover áudio](../../intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-002-video-remove-audio.md) (must).
- **ST-VID-003 — Alterar velocidade**: [Alterar velocidade](../../intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-003-video-speed.md) (must).

## Tipo de bolt

**Tipo**: DDD Construction Bolt
**Definição**: `.specsmd/aidlc/templates/construction/bolt-types/ddd-construction-bolt.md`

## Etapas

- [x] **1. Domain Model**: Complete → `ddd-01-domain-model.md`
- [x] **2. Technical Design**: Complete → `ddd-02-technical-design.md`
- [x] **3. ADR Analysis**: Complete → `adr-007-keyframe-copy-worker-decision.md`, `adr-008-plan-extras.md`
- [x] **4. Implement**: Aprovado pela equipa → `implementation-report.md`
- [x] **5. Test**: Complete (testes manuais da equipa aprovados; etapa aprovada no checkpoint final) → `ddd-03-test-report.md`, `manual-test-checklist.md`

## Requisitos rastreados

REQ-VID-TRIM-001 a 010; REQ-VID-AUDIO-001 a 006; REQ-VID-SPEED-001 a 008.

Verifica nos critérios de aceitação a NFR-009 (dona: B001), a NFR-012 e a NFR-016 (donas: B003), sem ser dono delas (specsDuvidas D-03).

Os critérios de aceitação autoritativos são os dos ficheiros `docs/requirements/REQ-VID-*.md`; a propriedade de cada requisito está em `intents/001-video-processing-support/traceability.md`.

## Decisões do ADD v1.1

- **T-02, recorte:** `trim`/`atrim` + `setpts=PTS-STARTPTS` com recodificação do vídeo para a precisão ao milissegundo; cópia com `-ss/-to` só quando o instante inicial coincide com um *keyframe* (verificado com FFprobe); o áudio pode ser copiado (REQ-VID-TRIM-010).
- **T-02, remover áudio:** `-an`; **T-05:** remover o áudio de um MP4 H.264 copia o vídeo (REQ-VID-AUDIO-005).
- **T-02, velocidade:** `setpts=PTS/f`; `atempo` aceita 0.5 a 100 no FFmpeg 5.x e só é encadeado abaixo de 0.5× (e.g. `atempo=0.5,atempo=0.5` para 0.25×).
- **T-01:** cada operação tem `validate`, `estimate` (duração, resolução, fps, áudio) e `cost` de 1 crédito. **T-05 / DQ-012:** o resultado é MP4 H.264/AAC mesmo a partir de MOV ou AVI.
- **Q-ADD-25:** quando o vídeo é recodificado e tem uma dimensão ímpar, corta-se 1 px para o par abaixo.

## Saídas esperadas

- `projects/video/operations/` para recorte, remoção de áudio e velocidade.
- `Tools/video/ops/` para as mesmas operações.
- Frontend: painéis novos de recorte (seletores, *scrubbing*, *loop preview*), remoção de áudio e velocidade.
- Testes ligados aos critérios de `REQ-VID-TRIM-*`, `REQ-VID-AUDIO-*`, `REQ-VID-SPEED-*` e verificação da NFR-009, da NFR-012 e da NFR-016 (specsDuvidas D-03).

## Critérios de passagem

- [ ] Stories incluídas implementadas e respetivos critérios de aceitação cumpridos.
- [ ] Critérios de aceitação dos requisitos rastreados (ficheiros `docs/requirements/REQ-VID-*.md`) verificados por testes.
- [x] Nenhuma linha de código existente removida/reescrita face a `origin/main` (regra 2.6 do ADD); fluxo de imagem verificado na integração. Auditoria no relatório de testes.
- [x] Testes automatizados persistentes e relatório do bolt registados; resultados e limitações em `ddd-03-test-report.md`. Testes manuais pendentes da equipa.
- [ ] Código revisto.
- [ ] Cada operação, isolada, corre como cadeia de um passo pelo executor da B003 e gera um novo recurso em `videos` com `source_video_ids` e `recipe`.

## Dependências

### Requer

- **Bolts:** 003-video-task-foundation (registo de operações, worker, executor, tarefas e quota).
- **Units:** 001-video-lifecycle.

### Desbloqueia

- 008-video-concat-chain.

## Limites

- **Regra 2.6 do ADD ("só acrescentar"):** o código existente não é alterado. Só se acrescentam ficheiros novos e pontos de ligação novos (uma linha `app.use` ou `require`, uma fila, exchange ou *binding* em `rabbitMQ/definitions.json`, um serviço ou volume no `docker-compose.yaml`, um `location` ou `log_format` no `nginx/nginx.conf`, componentes novos no frontend), sem tocar nas linhas existentes nem mudar o comportamento do fluxo de imagem.
- Não implementa cadeias com vários passos, junção (Unit 003).
- Monta nos seus painéis as peças comuns de tarefa do frontend construídas e testadas pela B003 (`lib/video-tasks.ts`, `use-video-task.ts`, `video-task-progress.tsx`), sem as reconstruir (specsDuvidas D-47).

## Notas

- Etapa 4 aprovada explicitamente pela equipa em `2026-10-22T18:12:10Z`; aprovação e passagem à etapa 5 registadas no construction-log. Na etapa 5 foram respondidas D-55 (duração visual), D-56 (consulta de controlo; ADR-009) e D-57 (recuo se o fim não for representável por cópia). Todas aprovadas na opção (a), sem reabrir D-49 a D-54. O bolt permanece aberto até aos testes manuais e à aprovação explícita da etapa 5.

- O ADD v1.1 não tem secção de decisão própria para os UC-VID-001, UC-VID-002, UC-VID-003 (âmbito 1.2); as decisões vêm do T-00, T-01, T-02 e T-05. Sem esforço no ADD para este bolt, por isso `avg_complexity` fica `null`; `avg_uncertainty`, `max_dependencies` e `testing_scope` são preenchidos no início do bolt na Construção (specsDuvidas D-01).

- 2026-10-22T20:02:18Z: checkpoint final aprovado pela equipa. Testes manuais no browser feitos noutra máquina, todos aprovados (recorte, recorte inválido, remover áudio, vídeo sem áudio, velocidade, cancelamento, regressão de vídeo e de imagem). Etapa 5 não repetida (resultados automáticos de `a5d60d2`). `bolt-complete.cjs` executado; bolt fechado no ramo `bolt/004-video-basic-edits`.
