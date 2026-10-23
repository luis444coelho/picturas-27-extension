---
id: 008-video-concat-chain
unit: 003-video-composition
intent: 001-video-processing-support
type: ddd-construction-bolt
status: in-progress
stories: [ST-VID-013, ST-VID-014]
created: 2026-10-19T17:31:16Z
started: 2026-10-23T00:31:55Z
completed: null
current_stage: test
stages_completed:
  - name: model
    completed: 2026-10-23T00:39:08Z
    artifact: ddd-01-domain-model.md
  - name: design
    completed: 2026-10-23T00:47:57Z
    artifact: ddd-02-technical-design.md
  - name: adr
    completed: 2026-10-23T00:53:52Z
    artifact: adr-016-composition-router.md, adr-017-composition-worker-path.md, adr-018-preset-structure-validation.md, adr-019-task-error-phase.md
  - name: implement
    completed: 2026-10-23T01:15:27Z
    artifact: implementation-report.md
requires_bolts: [004-video-basic-edits, 005-video-visual-edits, 007-video-format-conversion]
enables_bolts: [009-video-batch]
requires_units: [001-video-lifecycle, 002-video-transformations]
blocks: true
# avg_complexity: maior esforço do ADD no bolt (S=1, M=2, L=3); os outros campos são preenchidos no início do bolt na Construção (specsDuvidas D-01)
complexity: {avg_complexity: 3, avg_uncertainty: 3, max_dependencies: 3, testing_scope: 3}
---

# Bolt: 008-video-concat-chain

## Visão geral

Junção de vídeos e validação de estrutura das cadeias (UC-VID-013 e 014). O executor de cadeias vem da B003; este bolt acrescenta a operação `concat`, a validação de estrutura e as predefinições de vídeo (ADD v1.1, 4.8 e 4.9).

## Objetivo

Implementar a operação `concat` com sub-cadeias por clip, a validação em três fases das cadeias, o editor de cadeia e a linha temporal no frontend, e as predefinições de cadeias de vídeo do utilizador.

## Stories incluídas

- **ST-VID-013 — Juntar vídeos**: [Juntar vídeos](../../intents/001-video-processing-support/units/003-video-composition/stories/ST-VID-013-video-concat.md) (must).
- **ST-VID-014 — Encadear operações**: [Encadear operações](../../intents/001-video-processing-support/units/003-video-composition/stories/ST-VID-014-video-chain.md) (must).

## Tipo de bolt

**Tipo**: DDD Construction Bolt
**Definição**: `.specsmd/aidlc/templates/construction/bolt-types/ddd-construction-bolt.md`

## Etapas

- [x] **1. Domain Model**: Complete (D-78 a D-84) → `ddd-01-domain-model.md`
- [x] **2. Technical Design**: Complete (D-85; fase 2 antes da fase 3 sem junção) → `ddd-02-technical-design.md` → `ddd-02-technical-design.md`
- [x] **3. ADR Analysis**: Complete (ADR-019 dependente da V6) → `adr-016-composition-router.md`, `adr-017-composition-worker-path.md`, `adr-018-preset-structure-validation.md`, `adr-019-task-error-phase.md`
- [x] **4. Implement**: Aprovado pela equipa → `implementation-preflight.md`, `implementation-report.md` → código nos componentes indicados em "Saídas esperadas"
- [ ] **5. Test**: Checkpoint (testes manuais pendentes) → `ddd-03-test-report.md`, `manual-test-checklist.md` → `ddd-03-test-report.md`

## Requisitos rastreados

REQ-VID-CONCAT-001 a 013; REQ-VID-CHAIN-001 a 018; REQ-VID-NFR-014, 022 a 024.

A NFR-014 passa para este bolt (dona: ST-VID-013) na parte da junção e da cadeia (UC-VID-013 RN2-RN3, UC-VID-014 RN5); a ST-VID-014 verifica-a; a parte de lotes (UC-VID-015 RN2) continua não coberta, na ST-VID-015 e na B009 (specsDuvidas D-07, D-10).

Verifica nos critérios de aceitação a NFR-010 (dona: B001), a NFR-013 e a NFR-018 (donas: B003), sem ser dono delas (specsDuvidas D-03).

Os critérios de aceitação autoritativos são os dos ficheiros `docs/requirements/REQ-VID-*.md`; a propriedade de cada requisito está em `intents/001-video-processing-support/traceability.md`.

## Decisões do ADD v1.1

- **4.8 (junção):** `VideoTask` com `kind: "concat"`, tratada como cadeia de um passo `concat`; `validate` com `INSUFFICIENT_INPUTS`, `TOO_MANY_INPUTS` (10/50, `{limit}`), `LIMIT_EXCEEDED` (`{total, limit}`) e `UNSUPPORTED_FORMAT` por clip, contando cada ocorrência repetida; resolução e fps do primeiro clip à saída da sua sub-cadeia, em dimensões de apresentação (Q-ADD-13); `scale`+`pad`+`fps`+`setsar`+`format=yuv420p` por clip; `anullsrc` só quando pelo menos um clip tem áudio, senão `concat … a=0`; clip repetido descarregado uma vez e passado como várias entradas `-i`; `POST …/videos/operations` sem `:video`; custo 1 crédito.
- **4.9 (cadeia):** validação em três fases (por passo com `estimate` e `INVALID_STEP_PARAMS`; estrutura com `INVALID_CHAIN` `{rule}` e `CHAIN_TOO_LONG`; limites do perfil com `LIMIT_EXCEEDED`); custo igual ao número total de passos; `VideoTask` com `kind: "chain"`; passo corrente aproximado (Q-ADD-16) e erro indicado pela fase.
- **4.9 (predefinições):** `users/models/videoPreset.js` e `users/routes/videoPresets.js` (recusa do `anonymous`); `apiGateway/routes/videoPresets.js` montado em `/users` antes do router existente, com `videoAuth`; `{owner_id, name, steps}`, nome único por dono, sem partilha e sem cadeias com junção. A predefinição continua a poder ser guardada e usada numa nova cadeia (UC-VID-014 FA3); não pode ser carregada num lote, que fica fora desta construção (specsDuvidas D-06).
- **T-01:** os clips da junção ficam em `parameters.clips: [{videoId, steps}]`; o executor e o compilador de cadeias (`Tools/video/compiler.py`) vêm da B003 (`artefactos-finais.md` §5).
- **Q-ADD-25:** o W×H do primeiro clip é arredondado para par antes da normalização.

## Saídas esperadas

- `projects/video/operations/concat.js` e `Tools/video/ops/concat.py` (sub-grafo da junção).
- Validador de estrutura e agregação de custo no serviço de projetos.
- Predefinições de vídeo: modelo e rotas no serviço de utilizadores e router novo no gateway.
- Frontend: linha temporal da junção e editor de cadeia novos (dnd-kit, sub-cadeias por clip, contador de créditos, duração estimada, guardar e carregar predefinições).
- Testes ligados aos critérios de `REQ-VID-CONCAT-*`, `REQ-VID-CHAIN-*`, NFR rastreados e verificação da NFR-010, da NFR-013 e da NFR-018 (specsDuvidas D-03).

## Critérios de passagem

- [ ] Stories incluídas implementadas e respetivos critérios de aceitação cumpridos.
- [ ] Critérios de aceitação dos requisitos rastreados (ficheiros `docs/requirements/REQ-VID-*.md`) verificados por testes.
- [ ] Nenhuma linha de código existente alterada (regra 2.6 do ADD); o fluxo de imagem continua a funcionar como antes.
- [ ] Testes automatizados e relatório do bolt registados; nenhum resultado de teste é presumido nesta fase.
- [ ] Código revisto.
- [ ] Uma cadeia com junção executa numa única tarefa com uma única recodificação de vídeo e, em falha ou cancelamento, não grava resultado e devolve todos os créditos.

## Dependências

### Requer

- **Bolts:** 004-video-basic-edits, 005-video-visual-edits, 007-video-format-conversion (operações elegíveis como passo).
- **Units:** 001-video-lifecycle, 002-video-transformations.

### Desbloqueia

- 009-video-batch, que está `blocked` (specsDuvidas D-06).

## Limites

- **Regra 2.6 do ADD ("só acrescentar"):** o código existente não é alterado. Só se acrescentam ficheiros novos e pontos de ligação novos (uma linha `app.use` ou `require`, uma fila, exchange ou *binding* em `rabbitMQ/definitions.json`, um serviço ou volume no `docker-compose.yaml`, um `location` ou `log_format` no `nginx/nginx.conf`, componentes novos no frontend), sem tocar nas linhas existentes nem mudar o comportamento do fluxo de imagem.
- O `applied-tools-list.tsx`, o `sortable-tool-item.tsx`, o `users/models/preset.js`, o `users/routes/presets.js` e o `apiGateway/routes/users.js` não mudam; o diálogo de predefinições de imagem nunca recebe cadeias de vídeo.
- Transições entre clips ficam fora do MVP (Q-ERS-006).

## Notas

- Esforço no ADD: UC-VID-013 = L, UC-VID-014 = L. `avg_complexity` = 3 (maior esforço do ADD no bolt, com S=1, M=2, L=3); `avg_uncertainty`, `max_dependencies` e `testing_scope` são preenchidos no início do bolt na Construção (specsDuvidas D-01).
- Para o Registado, cadeias acima de 5 passos falham sempre por quota (DQ-025); a interface deve avisar antes (ADD 4.9, riscos).
- 2026-10-23T00:39:08Z: Estágio 1 aprovado pela equipa com as respostas D-78 (a), D-79 (a), D-80 (a), D-81 (a), D-82 (a) condicionada a uma verificação V (fase na resposta `failed` e no `VideoTask` só com linhas novas), D-83 (a) com `PATCH` em vez de `PUT` e sem limite de número de predefinições, e D-84 (a). Estágio 2 em curso, com a lista das verificações V que a etapa 4 confirma no código.
- 2026-10-23T00:43:53Z: Estágio 2 escrito (`ddd-02-technical-design.md`) com as verificações V1 a V14 para o Estágio 4; D-85 pendente; paragem no checkpoint.
- 2026-10-23T00:47:57Z: Estágio 2 aprovado com uma correção (sem junção, a fase 2 corre no router antes da fase 3 e, se falhar, `next()` para a B003 devolver o `INVALID_STEP_PARAMS`) e a D-85 (a). Estágio 3: ADR-016 a ADR-019 escritos e acrescentados ao `decision-index.md`; paragem no checkpoint.
- 2026-10-23T00:53:52Z: Estágio 3 aprovado (ADR-016 a ADR-019). O ADR-019 depende da V6: se falhar, dúvida nova a partir da D-86, ADR-019 marcado `proposed` no ficheiro e no `decision-index.md` e paragem antes de escrever código. Estágio 4 em curso: `implementation-preflight.md` com as V1 a V14 confirmadas no código, commit e push do preflight antes de qualquer código.
- 2026-10-23T00:58:42Z: Preflight da etapa 4 (`implementation-preflight.md`): V1 a V14 confirmadas no código, todas com pontos de acréscimo; V6 passa (fase só com linhas novas, incluindo uma linha nova no `_reply` do `task.py`), ADR-019 continua `accepted`; sem dúvida nova. Quatro ajustes por acréscimo: `totalSteps` da junção, áudio e entradas distintas da junção, montagem do router de composição depois do da B005, desvio do `composition_task` só para junções e cadeias terminadas em AVI (nota no ADR-017). `Tools/video/compiler.py` não existe.
- 2026-10-23T01:10:39Z: Etapa 4 implementada, à espera do checkpoint (`implementation-report.md`). Código: 36 ficheiros, +3370, 0 removidas face à `origin/main`; 20 ficheiros CRLF intactos. TypeScript, ESLint e Prettier passaram; testes unitários do serviço de projetos 263/263 (uma linha nova no teste de registo da D-37, como nas B004, B005 e B007). Sondagens isoladas do grafo da junção, da cadeia AVI e do domínio passaram. Testes do worker no contentor, integração e navegador ficam para a etapa 5.
- 2026-10-23T01:15:27Z: Etapa 4 aprovada pela equipa. Etapa 5 em curso, com o âmbito pedido: junções heterogéneas e clip repetido, sub-cadeias e passos finais, cadeia genérica com recorte, marca e filtro, cadeias terminadas em MP4/MOV/AVI, regras D-79/D-85, CHAIN_TOO_LONG, ordem D-80, LIMIT_EXCEEDED D-81, custo N, cancelamento, passo k de N, `error.phase` em falhas simuladas, predefinições (incluindo D-84), nomes D-35/D-75, regressões B001–B007 e imagem, checklist manual.
- 2026-10-23T01:34:26Z: Etapa 5 executada, à espera do checkpoint (`ddd-03-test-report.md`). JS 282/282 (19 novos), worker 80/80 com FFmpeg 5.1.9 (8 novos), frontend 68/68 no Node (6 novos) mais 8/8 com o Bun, tsc ok; integração B008 9/9, B007 3/3, B005 16/16, B004 14/15 (falha conhecida de Brilho em ARM); 10/10 ficheiros publicados descodificados e reproduzidos no VLC; uma invocação do FFmpeg por tarefa. Dois defeitos corrigidos por acréscimo no router de composição: `empty_chain` com `:video` (CHAIN-007) e `concat_not_first` antes da verificação da rota (D-80). Checklist manual pendente (`manual-test-checklist.md`).
