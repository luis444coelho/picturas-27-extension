---
unit: 002-video-transformations
intent: 001-video-processing-support
phase: inception
status: complete
created: 2026-10-18T18:00:00Z
updated: 2026-10-23
default_bolt_type: ddd-construction-bolt
---

# Unit Brief: Transformações de vídeo

## Objetivo e âmbito

Transformações de vídeo no projeto PictuRAS, com preservação dos originais e resultados persistidos. **Casos:** UC-VID-001 a UC-VID-004 e UC-VID-007 a UC-VID-011.

## Requisitos e Stories

Esta Unit tem 80 requisitos funcionais exclusivos: TRIM, AUDIO, SPEED, WATERMARK, ADJUST, FILTER, RESIZE, ORIENT e CONVERT. Os requisitos não funcionais são rastreados por responsabilidade na [matriz do intent](../../traceability.md), com resultados e limitações no Capítulo 10 do relatório.

- [ST-VID-001](stories/ST-VID-001-video-trim.md)
- [ST-VID-002](stories/ST-VID-002-video-remove-audio.md)
- [ST-VID-003](stories/ST-VID-003-video-speed.md)
- [ST-VID-004](stories/ST-VID-004-video-watermark.md)
- [ST-VID-008](stories/ST-VID-008-video-adjust.md)
- [ST-VID-009](stories/ST-VID-009-video-filter.md)
- [ST-VID-010](stories/ST-VID-010-video-resize.md)
- [ST-VID-011](stories/ST-VID-011-video-orientation.md)
- [ST-VID-012](stories/ST-VID-012-video-convert.md)

## Contratos e dependências

A Unit 001 fornece autenticação/autorização, recursos de vídeo, armazenamento, tarefas, quota, mensagens e erros. A Unit 002 utiliza esses contratos e fornece operações elegíveis à Unit 003, que compõe junção, subcadeias por clip e passos finais. A cadeia é executada como uma tarefa e publica apenas o vídeo final; falha e cancelamento desencadeiam limpeza e compensação. Não há dependências circulares.

## Bolts e verificação

- [B004 — 004-video-basic-edits](../../../../bolts/004-video-basic-edits/bolt.md): concluído.
- [B005 — 005-video-visual-edits](../../../../bolts/005-video-visual-edits/bolt.md): concluído.
- [B007 — 007-video-format-conversion](../../../../bolts/007-video-format-conversion/bolt.md): concluído.

Os critérios normativos e a respetiva evidência são os da ERS e da matriz de verificação do relatório. «Construção concluída» não significa que todos os alvos tenham validação integral; os desvios e ensaios incompletos permanecem identificados.
