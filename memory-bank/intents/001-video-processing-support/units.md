---
intent: 001-video-processing-support
phase: construction
status: complete
updated: 2026-10-23
---

# Units — Suporte a vídeo

O âmbito atual contém 14 casos de uso, 180 requisitos funcionais e 22 não funcionais, conforme a ERS do relatório. A construção está concluída nos Bolts 001 a 005, 007 e 008; os limites da validação permanecem explícitos no Capítulo 10.

| Unit | Responsabilidade | Casos de uso | Requisitos funcionais | Bolts |
|---|---|---|---:|---|
| [Ciclo de vida e acesso a vídeo](units/001-video-lifecycle/unit-brief.md) | UPLOAD, DOWNLOAD, INFO e requisitos comuns de autorização, quota, armazenamento, tarefas e erros | UC-VID-000, UC-VID-005 e UC-VID-006 | 70 | B001, B002, B003 |
| [Transformações de vídeo](units/002-video-transformations/unit-brief.md) | TRIM, AUDIO, SPEED, WATERMARK, ADJUST, FILTER, RESIZE, ORIENT e CONVERT | UC-VID-001 a UC-VID-004 e UC-VID-007 a UC-VID-011 | 80 | B004, B005, B007 |
| [Composição de vídeo](units/003-video-composition/unit-brief.md) | CONCAT e CHAIN | UC-VID-012 e UC-VID-013 | 30 | B008 |

**Cobertura funcional:** 70 + 80 + 30 = 180. As três Units incluem 15 Stories (14 funcionais e uma transversal) e sete Bolts. Dependências: baseline → ciclo de vida → transformações → composição.
