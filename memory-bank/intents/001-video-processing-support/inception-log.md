---
intent: 001-video-processing-support
created: 2026-10-09T16:57:05Z
updated: 2026-10-19T17:31:16Z
completed: null
status: in-progress
---

# Inception Log: 001-video-processing-support

## Âmbito atual

Extensão de vídeo da ERS v2.3: UC-VID-000 a UC-VID-015. A ERS canónica está em `docs/requirements.md` e `docs/requirements/` (214 FR, 26 NFR); os casos de uso estão em `docs/use-cases/`. `requirements.md` neste diretório é o índice SpecsMD atual; a primeira proposta de 5 funcionalidades foi preservada em `requirements-initial-proposal.md` como histórico e não deve ser usada na Construção.

## Estado dos artefactos

| Artefacto | Estado | Localização / referência |
|---|---|---|
| Requisitos atuais | Índice SpecsMD alinhado; texto normativo canónico na ERS | `requirements.md`, `docs/requirements.md`, `docs/requirements/` |
| Casos de uso | Completo: 16 casos | `docs/use-cases/UC-VID-000.md` a `UC-VID-015.md` |
| Contexto e modelo de domínio | Contexto e limites registados | `system-context.md`, `docs/inception/artefactos-finais.md`, capítulos 2–3 do relatório |
| Units e briefs | Revistos | `units.md`, `units/001-*` a `003-*` |
| Stories | Criadas: 16 UCs + 1 transversal | `units/*/stories/`, índice em `memory-bank/story-index.md` |
| Bolts | Planeados: 9 | `memory-bank/bolts/001-*` a `009-*` |
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

## Estado de prontidão

- [x] Requisitos atuais indexados, com texto canónico na ERS e rastreabilidade completa
- [x] Casos de uso consolidados
- [x] Contexto e modelo de domínio documentados
- [x] Units e dependências definidas
- [x] Stories com critérios de aceitação e ligação a requisitos
- [x] Bolts com histórias, requisitos, dependências e critérios de passagem
- [ ] Revisão humana destes artefactos concluída
- [ ] Inception marcada completa

O estado mantém-se `in-progress` até à revisão/aceitação humana dos artefactos. Não se declara a fase de Inception concluída nem se inicia Construção por este registo.

## Próximo passo

Rever o mapa de Units, Stories e sequência dos 9 Bolts; após aprovação, a Construção pode iniciar por `001-video-lifecycle`.
