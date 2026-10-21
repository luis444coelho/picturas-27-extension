---
intent: 001-video-processing-support
phase: inception
status: units-decomposed
updated: 2026-10-21T11:19:15Z
---

# Suporte a vídeo — Units

Esta decomposição foi revista contra o ADD v1.1 (`docs/add.md`, documento mestre das decisões de arquitetura), a ERS v2.4 (`docs/requirements.md` e `docs/requirements/`), os 16 casos de uso v1.5 em `docs/use-cases/` e `docs/inception/artefactos-finais.md`. Estes documentos são a fonte de verdade para o âmbito. Todas as Units seguem a regra 2.6 do ADD ("só acrescentar"): o código existente não é alterado. O rascunho inicial anterior está arquivado em `requirements-initial-proposal.md`; não deve orientar a Construção.

As três Units são fatias verticais da extensão dentro da aplicação web existente, e não serviços a implantar separadamente. O trabalho de interface correspondente está incluído nos critérios das stories e nos Bolts da respetiva capacidade; não se cria uma Unit de interface transversal que duplicaria os mesmos requisitos funcionais. A baseline permanece dependência externa às Units onde já fornece autenticação, projetos, partilha, storage, imagens e WebSockets.

## Units e atribuição exclusiva de requisitos funcionais

Cada um dos 214 requisitos funcionais pertence a uma única Unit. As regras transversais (autorização, quota, storage, tarefas e erros) são propriedade da Unit 001; as outras Units consomem os respetivos contratos.

| Unit | Responsabilidade e casos de uso | Requisitos funcionais atribuídos | Stories |
|---|---|---|---|
| [`001-video-lifecycle`](units/001-video-lifecycle/unit-brief.md) | Ciclo de vida, autorização, ingestão, consulta e acesso a recursos; UC-VID-000, UC-VID-006, UC-VID-007. | `REQ-VID-COM-*` (inclui AUTH, QUOTA, STORAGE, TASK e ERROR; 33), `REQ-VID-UPLOAD-*` (20), `REQ-VID-DOWNLOAD-*` (9), `REQ-VID-INFO-*` (9). **Total: 71 FR.** | ST-VID-000, ST-VID-006, ST-VID-007, ST-VID-COM-001 |
| [`002-video-transformations`](units/002-video-transformations/unit-brief.md) | Operações isoladas não destrutivas e exportação de fotogramas; UC-VID-001 a UC-VID-005 e UC-VID-008 a UC-VID-012. | `REQ-VID-TRIM-*` (10), `AUDIO-*` (6), `SPEED-*` (8), `WATERMARK-*` (11), `FRAMES-*` (13), `ADJUST-*` (10), `FILTER-*` (7), `RESIZE-*` (9), `ORIENT-*` (9), `CONVERT-*` (10). **Total: 93 FR.** | ST-VID-001 a ST-VID-005, ST-VID-008 a ST-VID-012 |
| [`003-video-composition`](units/003-video-composition/unit-brief.md) | Junção, cadeias atómicas e lotes sequenciais; UC-VID-013 a UC-VID-015. | `REQ-VID-CONCAT-*` (13), `CHAIN-*` (18), `BATCH-*` (19). **Total: 50 FR.** | ST-VID-013 a ST-VID-015 |

**Verificação de cobertura FR:** 71 + 93 + 50 = 214. A atribuição decorre dos prefixos no catálogo ERS e não duplica requisitos entre Units. Os requisitos NFR são atribuídos por responsabilidade técnica nos briefs (16 à Unit 001, 6 à Unit 002 e 4 à Unit 003, depois de a NFR-010, a NFR-013 e a NFR-018 passarem para os bolts que constroem o worker e o executor, specsDuvidas D-03); as Units dependentes consomem os contratos e limites comuns sem duplicar a propriedade dos requisitos.

## Dependências

```text
Baseline: autenticação, projetos/permissões, storage, recursos de imagem, WebSockets
                               │
                               ▼
                 001-video-lifecycle
                               │ contratos de recurso, tarefa e quota
                               ▼
               002-video-transformations
                               │ operações elegíveis
                               ▼
                 003-video-composition
```

Não há dependência circular. UC-VID-005 integra as imagens exportadas com a biblioteca e pipeline de imagem da baseline; não altera as ferramentas de imagem para que processem vídeo diretamente.

## Fundação de vídeo e executor de cadeias

No ADD v1.1 uma operação isolada é uma cadeia de um passo (T-01, T-02). Por isso, o registo de operações, o worker de vídeo único (`Tools/video/`, com um único `-filter_complex`) e o executor de cadeias pertencem à Unit 001; a B008 fica com a junção e a validação de estrutura (`artefactos-finais.md` §5, Q-ADD-01). A tabela de Bolts não muda (specsDuvidas D-02): a B001 constrói a parte do T-00 de que a ingestão precisa (coleção `videos`, `videoStages.js` e URLs de escrita, `formats.js`, routers com o `videoAuth`, filas de vídeo, `wsGateway/video.js` e o worker `Tools/video/` com a ingestão) e é dona dos `REQ-VID-AUTH-*`; a B003 fica com o `VideoTask`, o `video_project_locks`, a exchange `video_control`, a quota, o cancelamento e o progresso, o registo de operações e o executor de cadeias, e desbloqueia as operações da Unit 002. Cada NFR realizado por estes componentes pertence ao bolt que os constrói: NFR-010 na B001, NFR-013 e NFR-018 na B003 (specsDuvidas D-03). A B001 constrói também o `projects/video/amqp.js`, os URLs internos de leitura com o `route/video.js` e o `videoUrls.js`, o volume `video_tmp` e a declaração completa da `video_operations_queue`, porque a ingestão precisa deles; a B003 estende-os por acréscimo, sem os alterar (specsDuvidas D-08). A NFR-011 também passa para a B001, e a B003 verifica-a (specsDuvidas D-09).

## Âmbito fora desta construção

Por decisão da equipa (specsDuvidas D-06), a extração de fotogramas (UC-VID-005, ST-VID-005, B006, Unit 002) e o processamento em lote (UC-VID-015, ST-VID-015, B009, Unit 003) não são implementados nesta construção. Os bolts e as stories ficam com `status: blocked` e o motivo, para a rastreabilidade não se perder; os `REQ-VID-FRAMES-*`, os `REQ-VID-BATCH-*`, a `REQ-VID-TASK-007` e a parte de lotes da `REQ-VID-QUOTA-007` ficam não cobertos, assim como a NFR-004, a NFR-019 e a NFR-020 (só extração) e a parte de lotes da NFR-014 (specsDuvidas D-07). Princípio da equipa: só ficam de fora o UC-VID-005 e o UC-VID-015; tudo o resto é implementado. A B001 e a B003 não constroem as peças do ADD que só os lotes usam (`VideoBatch`, estágio `video_zip`, campo `batch_id`, endpoint de lote, itens `batch_item`, devolução por item, rotina de lotes e ZIP, `archiver`) nem a extração no worker. A predefinição de cadeia continua a poder ser guardada e usada numa nova cadeia (UC-VID-014 FA3); só deixa de poder ser carregada num lote. Os documentos em `docs/` continuam a incluir o UC-VID-005 e o UC-VID-015 no MVP.

## Stories e Bolts

As 16 stories correspondem aos 16 casos de uso, mais uma story transversal para os contratos de tarefa/quota. Cada story pertence a uma única Unit e a um único Bolt. Duas stories (ST-VID-005, ST-VID-015) e dois bolts (B006, B009) estão `blocked` (specsDuvidas D-06). O detalhe da sequência, critérios de passagem e IDs está em `memory-bank/bolts/001-video-lifecycle/bolt.md` a `009-video-batch/bolt.md`.
