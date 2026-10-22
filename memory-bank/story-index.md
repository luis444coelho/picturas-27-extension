# Story Index — Video Processing Support

Stories de inception para o intent `001-video-processing-support`, revistas em 2026-10-21 contra o ADD v1.1 (`docs/add.md`), a ERS v2.4 e os casos de uso v1.5. Os critérios detalhados, a rastreabilidade e as decisões do ADD de cada story permanecem nos respetivos ficheiros; as respostas às dúvidas D-01 a D-06 e as dúvidas por resolver estão em `docs/specsDuvidas.md`. A ST-VID-005 e a ST-VID-015 estão `blocked`: fora do âmbito desta construção por decisão da equipa (specsDuvidas D-06).

- [ST-VID-000 — Carregar e visualizar vídeo](intents/001-video-processing-support/units/001-video-lifecycle/stories/ST-VID-000-video-ingestion.md) — `001-video-lifecycle` — Bolt `001-video-lifecycle`
- [ST-VID-006 — Descarregar vídeo](intents/001-video-processing-support/units/001-video-lifecycle/stories/ST-VID-006-video-download.md) — `001-video-lifecycle` — Bolt `002-video-access`
- [ST-VID-007 — Consultar informações do vídeo](intents/001-video-processing-support/units/001-video-lifecycle/stories/ST-VID-007-video-information.md) — `001-video-lifecycle` — Bolt `002-video-access`
- [ST-VID-COM-001 — Acompanhar tarefas e quota de vídeo](intents/001-video-processing-support/units/001-video-lifecycle/stories/ST-VID-COM-001-video-task-quota-foundation.md) — `001-video-lifecycle` — Bolt `003-video-task-foundation`
- [ST-VID-001 — Recortar vídeo](intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-001-video-trim.md) — `002-video-transformations` — Bolt `004-video-basic-edits`
- [ST-VID-002 — Remover áudio](intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-002-video-remove-audio.md) — `002-video-transformations` — Bolt `004-video-basic-edits`
- [ST-VID-003 — Alterar velocidade](intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-003-video-speed.md) — `002-video-transformations` — Bolt `004-video-basic-edits`
- [ST-VID-004 — Aplicar marca de água](intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-004-video-watermark.md) — `002-video-transformations` — Bolt `005-video-visual-edits`
- [ST-VID-005 — Extrair fotogramas](intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-005-video-frame-export.md) — `002-video-transformations` — Bolt `006-video-frame-export` — 🚫 `blocked` (specsDuvidas D-06)
- [ST-VID-008 — Ajustar propriedades visuais](intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-008-video-adjust.md) — `002-video-transformations` — Bolt `005-video-visual-edits`
- [ST-VID-009 — Aplicar filtro visual](intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-009-video-filter.md) — `002-video-transformations` — Bolt `005-video-visual-edits`
- [ST-VID-010 — Redimensionar vídeo](intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-010-video-resize.md) — `002-video-transformations` — Bolt `005-video-visual-edits`
- [ST-VID-011 — Rodar ou espelhar vídeo](intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-011-video-orientation.md) — `002-video-transformations` — Bolt `005-video-visual-edits`
- [ST-VID-012 — Converter formato](intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-012-video-convert.md) — `002-video-transformations` — Bolt `007-video-format-conversion`
- [ST-VID-013 — Juntar vídeos](intents/001-video-processing-support/units/003-video-composition/stories/ST-VID-013-video-concat.md) — `003-video-composition` — Bolt `008-video-concat-chain`
- [ST-VID-014 — Encadear operações](intents/001-video-processing-support/units/003-video-composition/stories/ST-VID-014-video-chain.md) — `003-video-composition` — Bolt `008-video-concat-chain`
- [ST-VID-015 — Processar vídeos em lote](intents/001-video-processing-support/units/003-video-composition/stories/ST-VID-015-video-batch.md) — `003-video-composition` — Bolt `009-video-batch` — 🚫 `blocked` (specsDuvidas D-06)
