---
intent: 001-video-processing-support
phase: inception
status: units-decomposed
updated: 2026-10-19T17:31:16Z
---

# Suporte a vídeo — Units

Esta decomposição foi revista contra a ERS v2.3 (`docs/requirements.md` e `docs/requirements/`), os 16 casos em `docs/use-cases/`, e os capítulos 3, 5, 6 e 7 do relatório. Estes documentos são a fonte de verdade para o âmbito. O rascunho inicial anterior está arquivado em `requirements-initial-proposal.md`; não deve orientar a Construção.

As três Units são fatias verticais da extensão dentro da aplicação web existente, e não serviços a implantar separadamente. O trabalho de interface correspondente está incluído nos critérios das stories e nos Bolts da respetiva capacidade; não se cria uma Unit de interface transversal que duplicaria os mesmos requisitos funcionais. A baseline permanece dependência externa às Units onde já fornece autenticação, projetos, partilha, storage, imagens e WebSockets.

## Units e atribuição exclusiva de requisitos funcionais

Cada um dos 214 requisitos funcionais pertence a uma única Unit. As regras transversais (autorização, quota, storage, tarefas e erros) são propriedade da Unit 001; as outras Units consomem os respetivos contratos.

| Unit | Responsabilidade e casos de uso | Requisitos funcionais atribuídos | Stories |
|---|---|---|---|
| [`001-video-lifecycle`](units/001-video-lifecycle/unit-brief.md) | Ciclo de vida, autorização, ingestão, consulta e acesso a recursos; UC-VID-000, UC-VID-006, UC-VID-007. | `REQ-VID-COM-*` (inclui AUTH, QUOTA, STORAGE, TASK e ERROR; 33), `REQ-VID-UPLOAD-*` (20), `REQ-VID-DOWNLOAD-*` (9), `REQ-VID-INFO-*` (9). **Total: 71 FR.** | ST-VID-000, ST-VID-006, ST-VID-007, ST-VID-COM-001 |
| [`002-video-transformations`](units/002-video-transformations/unit-brief.md) | Operações isoladas não destrutivas e exportação de fotogramas; UC-VID-001 a UC-VID-005 e UC-VID-008 a UC-VID-012. | `REQ-VID-TRIM-*` (10), `AUDIO-*` (6), `SPEED-*` (8), `WATERMARK-*` (11), `FRAMES-*` (13), `ADJUST-*` (10), `FILTER-*` (7), `RESIZE-*` (9), `ORIENT-*` (9), `CONVERT-*` (10). **Total: 93 FR.** | ST-VID-001 a ST-VID-005, ST-VID-008 a ST-VID-012 |
| [`003-video-composition`](units/003-video-composition/unit-brief.md) | Junção, cadeias atómicas e lotes sequenciais; UC-VID-013 a UC-VID-015. | `REQ-VID-CONCAT-*` (13), `CHAIN-*` (18), `BATCH-*` (19). **Total: 50 FR.** | ST-VID-013 a ST-VID-015 |

**Verificação de cobertura FR:** 71 + 93 + 50 = 214. A atribuição decorre dos prefixos no catálogo ERS e não duplica requisitos entre Units. Os requisitos NFR são atribuídos por responsabilidade técnica nos briefs (13 à Unit 001, 8 à Unit 002 e 5 à Unit 003); as Units dependentes consomem os contratos e limites comuns sem duplicar a propriedade dos requisitos.

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

## Stories e Bolts

As 16 stories correspondem aos 16 casos de uso, mais uma story transversal para os contratos de tarefa/quota. Cada story pertence a uma única Unit e a um único Bolt. O detalhe da sequência, critérios de passagem e IDs está em `memory-bank/bolts/001-video-lifecycle/bolt.md` a `009-video-batch/bolt.md`.
