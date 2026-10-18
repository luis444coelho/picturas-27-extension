---
unit: 002-video-transformations
intent: 001-video-processing-support
phase: inception
status: ready
created: 2026-10-18T18:00:00Z
updated: 2026-10-18T18:00:00Z
---

# Unit Brief: Transformações de vídeo

## Purpose and scope

Implement non-destructive isolated video operations and export selected frames as project images.

**In scope:** UC-VID-001–005 and UC-VID-008–012. **Out of scope:** resource ingestion/access, joins, chains and batches.

## Assigned requirements

`REQ-VID-TRIM-*`, `AUDIO-*`, `SPEED-*`, `WATERMARK-*`, `FRAMES-*`, `ADJUST-*`, `FILTER-*`, `RESIZE-*`, `ORIENT-*`, `CONVERT-*`; applicable `REQ-VID-NFR-*`.

## Domain concepts and operations

`Vídeo`, `Imagem`, `FerramentaVídeo`, `FerramentaImagem`, `TrabalhoProcessamento`. Validate operation parameters; submit async work; persist a new derived resource on success; add extracted images with source video and timestamp.

## Dependencies and success criteria

Depends on Unit 001 task, storage, authorization and quota contracts; UC-VID-005 additionally depends on existing image resources. Preserve originals, enforce profile/format rules and do not publish partial output.

## Bolt suggestions

B004 `004-video-basic-edits` (DDD); B005 `005-video-visual-edits` (Simple); B006 `006-video-frame-export` (DDD); B007 `007-video-format-conversion` (Simple).
