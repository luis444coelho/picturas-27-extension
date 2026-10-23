---
id: 008-video-concat-chain
unit: 003-video-composition
intent: 001-video-processing-support
type: ddd-construction-bolt
status: complete
stories:
  - ST-VID-013
  - ST-VID-014
created: 2026-10-19T17:31:16.000Z
started: 2026-10-23T00:31:55.000Z
completed: "2026-10-23T15:47:09Z"
current_stage: null
stages_completed:
  - name: model
    completed: 2026-10-23T00:39:08.000Z
    artifact: ddd-01-domain-model.md
  - name: design
    completed: 2026-10-23T00:47:57.000Z
    artifact: ddd-02-technical-design.md
  - name: adr
    completed: 2026-10-23T00:53:52.000Z
    artifact: adr-016-composition-router.md, adr-017-composition-worker-path.md, adr-018-preset-structure-validation.md, adr-019-task-error-phase.md
  - name: implement
    completed: 2026-10-23T01:15:27.000Z
    artifact: implementation-report.md
  - name: test
    completed: 2026-10-23T15:47:09Z
    artifact: ddd-03-test-report.md, ddd-03-test-report-revision.md, manual-test-checklist.md
requires_bolts:
  - 004-video-basic-edits
  - 005-video-visual-edits
  - 007-video-format-conversion
enables_bolts:
  - 009-video-batch
requires_units:
  - 001-video-lifecycle
  - 002-video-transformations
blocks: true
complexity:
  avg_complexity: 3
  avg_uncertainty: 3
  max_dependencies: 3
  testing_scope: 3
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
- [x] **2. Technical Design**: Revisão aprovada (D-86 a D-89) → `ddd-02-technical-design.md`, secção "Revisão da etapa 2" → `ddd-02-technical-design.md`
- [x] **3. ADR Analysis**: Complete (ADR-016 a ADR-019; revisão: ADR-020 e nota da D-86 no ADR-016) → `adr-016-composition-router.md`, `adr-017-composition-worker-path.md`, `adr-018-preset-structure-validation.md`, `adr-019-task-error-phase.md`
- [x] **4. Implement**: Revisão aprovada → `implementation-preflight-revision.md`, `implementation-report-revision.md`; antes aprovado → `implementation-preflight.md`, `implementation-report.md` → código nos componentes indicados em "Saídas esperadas"
- [x] **5. Test**: Complete (revisão aprovada; testes manuais aprovados) → `ddd-03-test-report-revision.md`, `manual-test-checklist.md`; antes não aprovada → `ddd-03-test-report.md`, `manual-test-checklist.md` → `ddd-03-test-report.md`

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
- 2026-10-23T13:19:44Z: Etapa 5 **não aprovada** pela equipa depois da revisão no browser (`docs/prompt-b008-revisao.md`). Volta-se à etapa 2 só para o que muda: três ações independentes ("Aplicar várias operações", "Juntar vídeos", "Movie Maker"), controlos de configuração iguais aos da edição simples (D-87, exceção à regra 2.6 para os painéis de vídeo das B004, B005 e B007, ADR-020) e sem limites fixos de quantidade (D-86). O backend mantém-se. D-86 e D-87 registadas com a resposta da equipa; D-88 (proteção técnica sem limite) e D-89 (recorte e pré-visualizações num passo que não recebe o original) pendentes. Requisitos CHAIN-008, CONCAT-006, NFR-022, NFR-023 e DQ-015 com a nota "Revisto pela D-86". As entradas de `stages_completed` das etapas 2 a 4 ficam como histórico; as etapas 3, 4 e 5 são refeitas para as partes que mudam.
- 2026-10-23T14:03:00Z: Revisão da etapa 2 aprovada com D-88 (a) (medir na etapa 5 uma junção de 100 clips curtos e uma cadeia longa num Premium; se falhar, dúvida nova com a opção (b) e paragem) e D-89 (a). `docs/prompt-b008-revisao.md` retirado do ramo (os prompts não vão para o repositório). Etapa 3 da revisão: ADR-020 (D-87) e nota de impacto da D-86 no ADR-016, acrescentados ao `decision-index.md`; paragem no checkpoint.
- 2026-10-23T14:05:26Z: Etapa 3 da revisão aprovada. Sem reescrever o histórico (o prompt fica só no commit `dcc5988`; merge com `--no-ff`); `docs/prompt-specsmd-refazer-bolts.md` não é tocado. Etapa 4 da revisão em curso: preflight V15–V24 antes de qualquer código.
- 2026-10-23T14:07:43Z: Preflight da etapa 4 da revisão (`implementation-preflight-revision.md`): V15 a V24 confirmadas no código; os nove painéis separam-se sem mudar o que se vê (sem D-90). Ajustes: contrato com `useValidation`/`renderActions`, rota nova `…/:video/chain/watermark-preview` (a da B005 só aceita um passo), *middleware* do 413 no gateway; `frontend/lib/video-*.ts` das B004/B005/B007 sem mudanças. Commit e push do preflight antes de qualquer código.
- 2026-10-23T14:19:12Z: Etapa 4 da revisão implementada, à espera do checkpoint (`implementation-report-revision.md`). Três ações independentes, nove componentes de configuração extraídos dos painéis (D-87), D-86 no backend, rotas `…/chain/validate` e `…/:video/chain/watermark-preview`, 413 no gateway (D-88 a). Auditoria: ficheiros da D-87 com 9 ficheiros, +559, −213 (linhas listadas no anexo do relatório); resto do código com 52 ficheiros, +6300, −0. tsc e ESLint ok; JS 282/282, frontend 68/68; sondagem pela pilha ok. Etapa 5 por fazer.
- 2026-10-23T14:21:23Z: Etapa 4 da revisão aprovada. Etapa 5 da revisão em curso: regressão dos nove painéis (automática e manual), 12+ passos e 12+ vídeos num Premium, Movie Maker com 3 vídeos, quota, anónimo, falha com devolução, medições da D-88, regressões B001–B007 e imagem, limpeza dos dados de teste.
- 2026-10-23T15:18:34Z: Etapa 5 da revisão executada, à espera do checkpoint (`ddd-03-test-report-revision.md`). Edição simples igual nos nove painéis (browser, DOM comparado com a `origin/main`, 9/9), integração B008 15/15 (12 passos, 13 vídeos, Movie Maker com 3 vídeos, quota antes da tarefa, anónimo, falha com devolução, D-88), JS 282/282, worker 80/80, frontend 68/68 + 8/8, B007 3/3, B005 16/16, B004 14/15 (Brilho em ARM, conhecida). D-88: junção de 100 clips curtos ok (≈2,0 GB de pico; 640×360 ≈2,9 GB), cadeia de 60 passos ok (146 MB). Dados de teste limpos. Checklist manual nova.
- 2026-10-23T15:47:09Z: Checkpoint final aprovado pela equipa. Testes manuais da revisão todos aprovados (`manual-test-checklist.md`; browser não indicado). D-90 registada como risco aceite (memória do FFmpeg na junção, sem teto, por respeito à D-86). Apagados os 6 buckets vazios de 22/10. `bolt-complete.cjs` executado (com `NODE_PATH` para as dependências do specsmd): bolt `in-progress → complete`, ST-VID-013 e ST-VID-014 `ready → complete` com `implemented: true`; unit e intent sem alteração (B009 bloqueado). Entrada `test` de `stages_completed` acrescentada à mão. Ramo sem merge para a `main`.
