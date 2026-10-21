---
intent: 001-video-processing-support
created: 2026-10-09T16:57:05Z
updated: 2026-10-21T11:19:15Z
completed: null
status: in-progress
---

# Inception Log: 001-video-processing-support

## Âmbito atual

Extensão de vídeo da ERS v2.4 e do ADD v1.1 (`docs/add.md`, documento mestre): UC-VID-000 a UC-VID-015 (casos de uso v1.5). A ERS canónica está em `docs/requirements.md` e `docs/requirements/` (214 FR, 26 NFR); os casos de uso estão em `docs/use-cases/`. `requirements.md` neste diretório é o índice SpecsMD atual; a primeira proposta de 5 funcionalidades foi preservada em `requirements-initial-proposal.md` como histórico e não deve ser usada na Construção.

## Estado dos artefactos

| Artefacto | Estado | Localização / referência |
|---|---|---|
| Requisitos atuais | Índice SpecsMD alinhado; texto normativo canónico na ERS | `requirements.md`, `docs/requirements.md`, `docs/requirements/` |
| Casos de uso | Completo: 16 casos | `docs/use-cases/UC-VID-000.md` a `UC-VID-015.md` |
| Contexto e modelo de domínio | Contexto e limites registados | `system-context.md`, `docs/inception/artefactos-finais.md`, capítulos 2–3 do relatório |
| Units e briefs | Revistos | `units.md`, `units/001-*` a `003-*` |
| Stories | Criadas: 16 UCs + 1 transversal | `units/*/stories/`, índice em `memory-bank/story-index.md` |
| Bolts | Planeados: 9 (7 `planned`, B006 e B009 `blocked` por D-06) | `memory-bank/bolts/001-*` a `009-*` |
| Rastreabilidade | Matriz de requisitos ligada a Story, Unit e Bolt | `traceability.md`; capítulo 7 do relatório preserva origem/critério/estado |
| Relatório académico | Capítulos 1–7 revistos | `Documentos consulta/src-doc-ext-requisitos-template/capitulos/` |

## Resumo atual

| Métrica | Total |
|---|---:|
| Requisitos funcionais | 214 |
| Requisitos não funcionais | 26 |
| Casos de uso | 16 |
| Units | 3 |
| Stories | 17 |
| Bolts planeados | 9 |

## Revisão das Units e Bolts

Em 2026-10-19, foram alinhados os briefs, Stories e Bolts com a ERS v2.3 e com o relatório revisto. As 3 Units atribuem cada FR uma única vez (71 + 93 + 50 = 214); os 26 NFR estão atribuídos por responsabilidade técnica (13 + 8 + 5). Foram corrigidos IDs e dependências de Bolt, substituídas referências a casos de uso como Stories por ficheiros Story rastreáveis, criado o contexto do sistema e substituídas as matrizes de rastreabilidade obsoletas por uma matriz com 240 IDs.

## Revisão contra o ADD v1.1 (2026-10-21T01:07:50Z)

**Fontes usadas (por ordem de autoridade):** `docs/add.md` (ADD v1.1, documento mestre: regra 2.6, T-00 a T-10, 4.1 a 4.10, secções 5 e 6, Q-ADD-01 a 25 dadas como aceites); `docs/requirements.md` (ERS v2.4) e `docs/requirements/REQ-VID-*.md`; `docs/use-cases.md` (v1.5) e `docs/use-cases/UC-VID-000.md` a `015.md`; `docs/inception/artefactos-finais.md` e `docs/diagrams/`; o código existente tal como o ADD o descreve na 2.5 (fundação de vídeo por implementar). O `docs/merge.md` não foi usado.

**O que mudou:**

- **Bolts (9):** reescritos segundo a tabela 5 de `artefactos-finais.md` (IDs, âmbito, tipos e dependências). A B003 passa a incluir o registo de operações, o worker único e o executor de cadeias (T-01, T-02); a B008 fica com a junção e a validação de estrutura; a B009 depende de B002, B004, B005 e B008. Cada bolt cita as decisões do ADD, os componentes novos e a regra 2.6 nos limites, e tem as etapas do respetivo tipo. Todos ficam `planned`. A quota deixa de ter passo de confirmação (Q-ADD-03). A complexidade numérica fica por preencher (D-01).
- **Stories (17):** IDs mantidos; critérios de aceitação e rastreabilidade alinhados com os REQ v2.4, os UC v1.5 e o ADD (reserva definitiva na conclusão, URL portador, dimensões de apresentação, cópia MP4 alargada, progresso 1×/s, passo aproximado, ZIP em segundo plano, entre outros).
- **Units e briefs:** responsabilidades e bolts por Unit descritos com os componentes do ADD; regra 2.6 acrescentada.
- **`system-context.md`, `requirements.md`, `decisions.md`, `traceability.md` e `story-index.md`:** passam a citar o ADD v1.1, a ERS v2.4 e os UC v1.5; a matriz ganhou a coluna "Decisões do ADD v1.1"; `decisions.md` mantém as decisões históricas e assinala as diferenças face às atuais.
- Os ficheiros de histórico (`requirements-initial-proposal.md`, `requirements-review.md`, `case-review.md`, `use-cases-academic.md`) não foram alterados.

**Dúvidas:** 5, registadas em `docs/specsDuvidas.md` (D-01 complexidade dos bolts; D-02 componentes de fundação usados pela B001/B002 mas atribuídos à B003; D-03 propriedade da NFR-010, 013 e 018; D-04 bolt da rotina da Q-ADD-14; D-05 desenho da extração de fotogramas). As Q-ADD que o próprio ADD deixa por definir (02, 04, 07, 08, 09, 10, 11, 15 e 17) estão citadas como pendentes nos bolts, sem valores inventados.

## Aplicação das respostas D-01 a D-06 (2026-10-21T11:10:16Z)

**Fontes:** as respostas em `docs/specsDuvidas.md` (D-01 a D-05 e a decisão nova da equipa D-06), com o `docs/add.md` (ADD v1.1) como documento mestre. O `docs/merge.md` não foi usado. Os documentos em `docs/` não foram alterados, exceto o acréscimo das dúvidas novas ao `specsDuvidas.md`, e o código também não.

**O que mudou:**

- **D-01:** `avg_complexity` preenchido com o maior esforço do ADD por bolt (B001 = 3, B002 = 1, B005 = 2, B007 = 2, B008 = 3, B009 = 3; B003, B004 e B006 = `null`); os outros três campos ficam `null` até ao início de cada bolt.
- **D-02:** a tabela de Bolts não muda. A B001 passa a construir a coleção `videos`, o `videoStages.js` e os URLs de escrita, o `formats.js`, os routers com o `videoAuth`, as três filas de vídeo, o `wsGateway/video.js` e o worker `Tools/video/` com a ingestão; a B003 fica com o `VideoTask`, os locks, o `video_control`, a quota, o cancelamento, o progresso, o registo de operações e o executor. Os `REQ-VID-AUTH-*` passam para a ST-VID-000 e a B001.
- **D-03:** a NFR-010 passa para a ST-VID-000 e a B001; a NFR-013 e a NFR-018 para a ST-VID-COM-001 e a B003. A B004 e a B008 verificam as três. NFR por Unit: 16 + 6 + 4.
- **D-04:** a B003 constrói a rotina da Q-ADD-14 sem a parte de lotes e ZIP.
- **D-05:** sem desenho da extração nesta construção; complemento ao ADD antes de retomar a B006.
- **D-06:** a B006, a B009, a ST-VID-005 e a ST-VID-015 ficam `blocked`, com o motivo; a B001 e a B003 não constroem as peças só usadas pelos lotes nem a extração; os `REQ-VID-FRAMES-*`, os `REQ-VID-BATCH-*`, a `REQ-VID-TASK-007` e a parte de lotes da `REQ-VID-QUOTA-007` ficam "Não coberto nesta construção (D-06)"; a predefinição de cadeia já não pode ser carregada num lote.
- Ficheiros alterados: os 9 `bolt.md`, 6 stories (ST-VID-000, COM-001, 001, 005, 014, 015), `units.md`, os 3 `unit-brief.md`, `traceability.md`, `story-index.md`, `decisions.md` e este registo. As referências "(ver specsDuvidas.md, D-xx)" às dúvidas resolvidas foram substituídas por "(specsDuvidas D-xx)".

**Dúvidas novas:** 3, acrescentadas a `docs/specsDuvidas.md` sem resposta: D-07 (se a NFR-004, a 019, a 020 e a 014 também ficam não cobertas); D-08 (bolt do `amqp.js`, dos URLs internos de leitura, do `route/video.js`/`videoUrls.js`, do volume `video_tmp` e dos argumentos da `video_operations_queue`); D-09 (propriedade da NFR-011). Até às respostas, mantém-se a atribuição atual.

## Aplicação das respostas D-07 a D-09 (2026-10-21T11:19:15Z)

**Fontes:** as respostas em `docs/specsDuvidas.md` (D-07 a D-09), com o `docs/add.md` (ADD v1.1) como documento mestre e o princípio da equipa: só ficam de fora o UC-VID-005 (B006) e o UC-VID-015 (B009), e tudo o resto é implementado. O `docs/merge.md` não foi usado. Em `docs/` só se preencheram as respostas e se acrescentou a dúvida nova ao `specsDuvidas.md`; o código não foi alterado.

**O que mudou:**

- **D-07:** a NFR-004, a NFR-019 e a NFR-020 ficam "Não coberto nesta construção (D-06)"; a NFR-014 fica parcialmente não coberta, só na parte de lotes.
- **D-08:** a B001 passa a construir o `projects/video/amqp.js`, os URLs internos de leitura com o `route/video.js` e o `videoUrls.js`, o volume `video_tmp` e a declaração completa da `video_operations_queue` com os argumentos do T-03; a B003 estende-os por acréscimo. A B002 deixa de montar o `route/video.js` e usa o módulo da B001 para o URL de descarregamento.
- **D-09:** a NFR-011 passa da ST-VID-COM-001/B003 para a ST-VID-000/B001 (a contagem por Unit mantém-se em 16 + 6 + 4); a B003 verifica-a num critério de passagem novo.
- Ficheiros alterados: `bolt.md` da B001, B002, B003, B006 e B009; stories ST-VID-000, COM-001, 005 e 015; `units.md`, os 3 `unit-brief.md`, `traceability.md`, `decisions.md` e este registo.

**Dúvida nova:** 1, acrescentada a `docs/specsDuvidas.md` sem resposta: D-10 (que bolt e story constroem a parte coberta da NFR-014, já que a sua dona é a ST-VID-015, na B009 `blocked`). Até à resposta, mantém-se a atribuição atual.

## Estado de prontidão

- [x] Requisitos atuais indexados, com texto canónico na ERS e rastreabilidade completa
- [x] Casos de uso consolidados
- [x] Contexto e modelo de domínio documentados
- [x] Units e dependências definidas
- [x] Stories com critérios de aceitação e ligação a requisitos
- [x] Bolts com histórias, requisitos, dependências e critérios de passagem
- [x] Artefactos revistos contra o ADD v1.1, a ERS v2.4 e os UC v1.5
- [x] Dúvidas D-01 a D-06 de `docs/specsDuvidas.md` respondidas e aplicadas
- [x] Dúvidas D-07 a D-09 de `docs/specsDuvidas.md` respondidas e aplicadas
- [ ] Dúvida nova D-10 de `docs/specsDuvidas.md` respondida e aplicada
- [ ] Revisão humana destes artefactos concluída
- [ ] Inception marcada completa

O estado mantém-se `in-progress` até à revisão/aceitação humana dos artefactos. Não se declara a fase de Inception concluída nem se inicia Construção por este registo.

## Próximo passo

Responder à dúvida D-10 de `docs/specsDuvidas.md` e aplicá-las aos bolts, stories e rastreabilidade; depois, rever o mapa de Units, Stories e sequência dos 9 Bolts (7 a construir; B006 e B009 `blocked`). Só após essa aprovação a Construção pode iniciar, pela ordem da Q-ADD-01 (fundação T-00 e worker T-02 primeiro).
