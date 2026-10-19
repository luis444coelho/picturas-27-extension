---
intent: 001-video-processing-support
phase: inception
status: mapped
updated: 2026-10-19T17:31:16Z
---

# Matriz de rastreabilidade — Suporte a vídeo

## Fonte e estado

Esta matriz alinha a ERS v2.3, os casos de uso, as Units/Stories/Bolts e os capítulos 3, 5, 6 e 7 do relatório. A origem e os critérios de aceitação autoritativos permanecem nos requisitos individuais. O capítulo 7 do relatório mantém a rastreabilidade académica requisito→origem/critério/estado; esta matriz acrescenta o planeamento requisito→Story proprietária→Unit→Bolt e identifica Stories consumidoras de requisitos transversais. Todas as linhas estão **especificadas; implementação e testes de aceitação não iniciados**.

## Caso de uso → Story → Bolt

| Caso de uso | Story | Unit | Bolt |
|---|---|---|---|
| UC-VID-000 | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` |
| UC-VID-001 | ST-VID-001 | `002-video-transformations` | `004-video-basic-edits` |
| UC-VID-002 | ST-VID-002 | `002-video-transformations` | `004-video-basic-edits` |
| UC-VID-003 | ST-VID-003 | `002-video-transformations` | `004-video-basic-edits` |
| UC-VID-004 | ST-VID-004 | `002-video-transformations` | `005-video-visual-edits` |
| UC-VID-005 | ST-VID-005 | `002-video-transformations` | `006-video-frame-export` |
| UC-VID-006 | ST-VID-006 | `001-video-lifecycle` | `002-video-access` |
| UC-VID-007 | ST-VID-007 | `001-video-lifecycle` | `002-video-access` |
| UC-VID-008 | ST-VID-008 | `002-video-transformations` | `005-video-visual-edits` |
| UC-VID-009 | ST-VID-009 | `002-video-transformations` | `005-video-visual-edits` |
| UC-VID-010 | ST-VID-010 | `002-video-transformations` | `005-video-visual-edits` |
| UC-VID-011 | ST-VID-011 | `002-video-transformations` | `005-video-visual-edits` |
| UC-VID-012 | ST-VID-012 | `002-video-transformations` | `007-video-format-conversion` |
| UC-VID-013 | ST-VID-013 | `003-video-composition` | `008-video-concat-chain` |
| UC-VID-014 | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` |
| UC-VID-015 | ST-VID-015 | `003-video-composition` | `009-video-batch` |
| Regras transversais | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` |

## Requisito → Story → Unit → Bolt

A coluna “Story proprietária” identifica o trabalho dono do requisito; “Stories consumidoras” regista os casos adicionais abrangidos por requisitos comuns. Essa utilização não duplica a propriedade do requisito.

| Requisito | Ficheiro de origem | Story proprietária | Unit | Bolt | Stories consumidoras | Estado |
|---|---|---|---|---|---|---|
| `REQ-VID-ADJUST-001` | [`REQ-VID-ADJUST.md`](../../../docs/requirements/REQ-VID-ADJUST.md) | ST-VID-008 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-008 | Especificado; implementação pendente |
| `REQ-VID-ADJUST-002` | [`REQ-VID-ADJUST.md`](../../../docs/requirements/REQ-VID-ADJUST.md) | ST-VID-008 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-008 | Especificado; implementação pendente |
| `REQ-VID-ADJUST-003` | [`REQ-VID-ADJUST.md`](../../../docs/requirements/REQ-VID-ADJUST.md) | ST-VID-008 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-008 | Especificado; implementação pendente |
| `REQ-VID-ADJUST-004` | [`REQ-VID-ADJUST.md`](../../../docs/requirements/REQ-VID-ADJUST.md) | ST-VID-008 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-008 | Especificado; implementação pendente |
| `REQ-VID-ADJUST-005` | [`REQ-VID-ADJUST.md`](../../../docs/requirements/REQ-VID-ADJUST.md) | ST-VID-008 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-008 | Especificado; implementação pendente |
| `REQ-VID-ADJUST-006` | [`REQ-VID-ADJUST.md`](../../../docs/requirements/REQ-VID-ADJUST.md) | ST-VID-008 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-008 | Especificado; implementação pendente |
| `REQ-VID-ADJUST-007` | [`REQ-VID-ADJUST.md`](../../../docs/requirements/REQ-VID-ADJUST.md) | ST-VID-008 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-008 | Especificado; implementação pendente |
| `REQ-VID-ADJUST-008` | [`REQ-VID-ADJUST.md`](../../../docs/requirements/REQ-VID-ADJUST.md) | ST-VID-008 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-008 | Especificado; implementação pendente |
| `REQ-VID-ADJUST-009` | [`REQ-VID-ADJUST.md`](../../../docs/requirements/REQ-VID-ADJUST.md) | ST-VID-008 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-008 | Especificado; implementação pendente |
| `REQ-VID-ADJUST-010` | [`REQ-VID-ADJUST.md`](../../../docs/requirements/REQ-VID-ADJUST.md) | ST-VID-008 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-008 | Especificado; implementação pendente |
| `REQ-VID-AUDIO-001` | [`REQ-VID-AUDIO.md`](../../../docs/requirements/REQ-VID-AUDIO.md) | ST-VID-002 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-002 | Especificado; implementação pendente |
| `REQ-VID-AUDIO-002` | [`REQ-VID-AUDIO.md`](../../../docs/requirements/REQ-VID-AUDIO.md) | ST-VID-002 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-002 | Especificado; implementação pendente |
| `REQ-VID-AUDIO-003` | [`REQ-VID-AUDIO.md`](../../../docs/requirements/REQ-VID-AUDIO.md) | ST-VID-002 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-002 | Especificado; implementação pendente |
| `REQ-VID-AUDIO-004` | [`REQ-VID-AUDIO.md`](../../../docs/requirements/REQ-VID-AUDIO.md) | ST-VID-002 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-002 | Especificado; implementação pendente |
| `REQ-VID-AUDIO-005` | [`REQ-VID-AUDIO.md`](../../../docs/requirements/REQ-VID-AUDIO.md) | ST-VID-002 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-002 | Especificado; implementação pendente |
| `REQ-VID-AUDIO-006` | [`REQ-VID-AUDIO.md`](../../../docs/requirements/REQ-VID-AUDIO.md) | ST-VID-002 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-002 | Especificado; implementação pendente |
| `REQ-VID-AUTH-001` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-AUTH-002` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-AUTH-003` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-BATCH-001` | [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-BATCH-002` | [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-BATCH-003` | [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-BATCH-004` | [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-BATCH-005` | [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-BATCH-006` | [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-BATCH-007` | [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-BATCH-008` | [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-BATCH-009` | [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-BATCH-010` | [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-BATCH-011` | [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-BATCH-012` | [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-BATCH-013` | [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-BATCH-014` | [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-BATCH-015` | [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-BATCH-016` | [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-BATCH-017` | [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-BATCH-018` | [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-BATCH-019` | [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-CHAIN-001` | [`REQ-VID-CHAIN.md`](../../../docs/requirements/REQ-VID-CHAIN.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-CHAIN-002` | [`REQ-VID-CHAIN.md`](../../../docs/requirements/REQ-VID-CHAIN.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-CHAIN-003` | [`REQ-VID-CHAIN.md`](../../../docs/requirements/REQ-VID-CHAIN.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-CHAIN-004` | [`REQ-VID-CHAIN.md`](../../../docs/requirements/REQ-VID-CHAIN.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-CHAIN-005` | [`REQ-VID-CHAIN.md`](../../../docs/requirements/REQ-VID-CHAIN.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-CHAIN-006` | [`REQ-VID-CHAIN.md`](../../../docs/requirements/REQ-VID-CHAIN.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-CHAIN-007` | [`REQ-VID-CHAIN.md`](../../../docs/requirements/REQ-VID-CHAIN.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-CHAIN-008` | [`REQ-VID-CHAIN.md`](../../../docs/requirements/REQ-VID-CHAIN.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-CHAIN-009` | [`REQ-VID-CHAIN.md`](../../../docs/requirements/REQ-VID-CHAIN.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-CHAIN-010` | [`REQ-VID-CHAIN.md`](../../../docs/requirements/REQ-VID-CHAIN.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-CHAIN-011` | [`REQ-VID-CHAIN.md`](../../../docs/requirements/REQ-VID-CHAIN.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-CHAIN-012` | [`REQ-VID-CHAIN.md`](../../../docs/requirements/REQ-VID-CHAIN.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-CHAIN-013` | [`REQ-VID-CHAIN.md`](../../../docs/requirements/REQ-VID-CHAIN.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-CHAIN-014` | [`REQ-VID-CHAIN.md`](../../../docs/requirements/REQ-VID-CHAIN.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-CHAIN-015` | [`REQ-VID-CHAIN.md`](../../../docs/requirements/REQ-VID-CHAIN.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-CHAIN-016` | [`REQ-VID-CHAIN.md`](../../../docs/requirements/REQ-VID-CHAIN.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-CHAIN-017` | [`REQ-VID-CHAIN.md`](../../../docs/requirements/REQ-VID-CHAIN.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-CHAIN-018` | [`REQ-VID-CHAIN.md`](../../../docs/requirements/REQ-VID-CHAIN.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-COM-001` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001, ST-VID-001, ST-VID-002, ST-VID-003, ST-VID-004, ST-VID-005, ST-VID-008, ST-VID-009, ST-VID-010, ST-VID-011, ST-VID-012, ST-VID-013, ST-VID-014, ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-COM-002` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001, ST-VID-001, ST-VID-002, ST-VID-003, ST-VID-004, ST-VID-005, ST-VID-008, ST-VID-009, ST-VID-010, ST-VID-011, ST-VID-012, ST-VID-013, ST-VID-014, ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-COM-003` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001, ST-VID-001, ST-VID-002, ST-VID-003, ST-VID-004, ST-VID-005, ST-VID-008, ST-VID-009, ST-VID-010, ST-VID-011, ST-VID-012, ST-VID-013, ST-VID-014, ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-COM-004` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-COM-005` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-COM-006` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001, ST-VID-001, ST-VID-002, ST-VID-003, ST-VID-004, ST-VID-005, ST-VID-008, ST-VID-009, ST-VID-010, ST-VID-011, ST-VID-012, ST-VID-013, ST-VID-014, ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-CONCAT-001` | [`REQ-VID-CONCAT.md`](../../../docs/requirements/REQ-VID-CONCAT.md) | ST-VID-013 | `003-video-composition` | `008-video-concat-chain` | ST-VID-013 | Especificado; implementação pendente |
| `REQ-VID-CONCAT-002` | [`REQ-VID-CONCAT.md`](../../../docs/requirements/REQ-VID-CONCAT.md) | ST-VID-013 | `003-video-composition` | `008-video-concat-chain` | ST-VID-013 | Especificado; implementação pendente |
| `REQ-VID-CONCAT-003` | [`REQ-VID-CONCAT.md`](../../../docs/requirements/REQ-VID-CONCAT.md) | ST-VID-013 | `003-video-composition` | `008-video-concat-chain` | ST-VID-013 | Especificado; implementação pendente |
| `REQ-VID-CONCAT-004` | [`REQ-VID-CONCAT.md`](../../../docs/requirements/REQ-VID-CONCAT.md) | ST-VID-013 | `003-video-composition` | `008-video-concat-chain` | ST-VID-013 | Especificado; implementação pendente |
| `REQ-VID-CONCAT-005` | [`REQ-VID-CONCAT.md`](../../../docs/requirements/REQ-VID-CONCAT.md) | ST-VID-013 | `003-video-composition` | `008-video-concat-chain` | ST-VID-013 | Especificado; implementação pendente |
| `REQ-VID-CONCAT-006` | [`REQ-VID-CONCAT.md`](../../../docs/requirements/REQ-VID-CONCAT.md) | ST-VID-013 | `003-video-composition` | `008-video-concat-chain` | ST-VID-013 | Especificado; implementação pendente |
| `REQ-VID-CONCAT-007` | [`REQ-VID-CONCAT.md`](../../../docs/requirements/REQ-VID-CONCAT.md) | ST-VID-013 | `003-video-composition` | `008-video-concat-chain` | ST-VID-013 | Especificado; implementação pendente |
| `REQ-VID-CONCAT-008` | [`REQ-VID-CONCAT.md`](../../../docs/requirements/REQ-VID-CONCAT.md) | ST-VID-013 | `003-video-composition` | `008-video-concat-chain` | ST-VID-013 | Especificado; implementação pendente |
| `REQ-VID-CONCAT-009` | [`REQ-VID-CONCAT.md`](../../../docs/requirements/REQ-VID-CONCAT.md) | ST-VID-013 | `003-video-composition` | `008-video-concat-chain` | ST-VID-013 | Especificado; implementação pendente |
| `REQ-VID-CONCAT-010` | [`REQ-VID-CONCAT.md`](../../../docs/requirements/REQ-VID-CONCAT.md) | ST-VID-013 | `003-video-composition` | `008-video-concat-chain` | ST-VID-013 | Especificado; implementação pendente |
| `REQ-VID-CONCAT-011` | [`REQ-VID-CONCAT.md`](../../../docs/requirements/REQ-VID-CONCAT.md) | ST-VID-013 | `003-video-composition` | `008-video-concat-chain` | ST-VID-013 | Especificado; implementação pendente |
| `REQ-VID-CONCAT-012` | [`REQ-VID-CONCAT.md`](../../../docs/requirements/REQ-VID-CONCAT.md) | ST-VID-013 | `003-video-composition` | `008-video-concat-chain` | ST-VID-013 | Especificado; implementação pendente |
| `REQ-VID-CONCAT-013` | [`REQ-VID-CONCAT.md`](../../../docs/requirements/REQ-VID-CONCAT.md) | ST-VID-013 | `003-video-composition` | `008-video-concat-chain` | ST-VID-013 | Especificado; implementação pendente |
| `REQ-VID-CONVERT-001` | [`REQ-VID-CONVERT.md`](../../../docs/requirements/REQ-VID-CONVERT.md) | ST-VID-012 | `002-video-transformations` | `007-video-format-conversion` | ST-VID-012 | Especificado; implementação pendente |
| `REQ-VID-CONVERT-002` | [`REQ-VID-CONVERT.md`](../../../docs/requirements/REQ-VID-CONVERT.md) | ST-VID-012 | `002-video-transformations` | `007-video-format-conversion` | ST-VID-012 | Especificado; implementação pendente |
| `REQ-VID-CONVERT-003` | [`REQ-VID-CONVERT.md`](../../../docs/requirements/REQ-VID-CONVERT.md) | ST-VID-012 | `002-video-transformations` | `007-video-format-conversion` | ST-VID-012 | Especificado; implementação pendente |
| `REQ-VID-CONVERT-004` | [`REQ-VID-CONVERT.md`](../../../docs/requirements/REQ-VID-CONVERT.md) | ST-VID-012 | `002-video-transformations` | `007-video-format-conversion` | ST-VID-012 | Especificado; implementação pendente |
| `REQ-VID-CONVERT-005` | [`REQ-VID-CONVERT.md`](../../../docs/requirements/REQ-VID-CONVERT.md) | ST-VID-012 | `002-video-transformations` | `007-video-format-conversion` | ST-VID-012 | Especificado; implementação pendente |
| `REQ-VID-CONVERT-006` | [`REQ-VID-CONVERT.md`](../../../docs/requirements/REQ-VID-CONVERT.md) | ST-VID-012 | `002-video-transformations` | `007-video-format-conversion` | ST-VID-012 | Especificado; implementação pendente |
| `REQ-VID-CONVERT-007` | [`REQ-VID-CONVERT.md`](../../../docs/requirements/REQ-VID-CONVERT.md) | ST-VID-012 | `002-video-transformations` | `007-video-format-conversion` | ST-VID-012 | Especificado; implementação pendente |
| `REQ-VID-CONVERT-008` | [`REQ-VID-CONVERT.md`](../../../docs/requirements/REQ-VID-CONVERT.md) | ST-VID-012 | `002-video-transformations` | `007-video-format-conversion` | ST-VID-012 | Especificado; implementação pendente |
| `REQ-VID-CONVERT-009` | [`REQ-VID-CONVERT.md`](../../../docs/requirements/REQ-VID-CONVERT.md) | ST-VID-012 | `002-video-transformations` | `007-video-format-conversion` | ST-VID-012 | Especificado; implementação pendente |
| `REQ-VID-CONVERT-010` | [`REQ-VID-CONVERT.md`](../../../docs/requirements/REQ-VID-CONVERT.md) | ST-VID-012 | `002-video-transformations` | `007-video-format-conversion` | ST-VID-012 | Especificado; implementação pendente |
| `REQ-VID-DOWNLOAD-001` | [`REQ-VID-DOWNLOAD.md`](../../../docs/requirements/REQ-VID-DOWNLOAD.md) | ST-VID-006 | `001-video-lifecycle` | `002-video-access` | ST-VID-006 | Especificado; implementação pendente |
| `REQ-VID-DOWNLOAD-002` | [`REQ-VID-DOWNLOAD.md`](../../../docs/requirements/REQ-VID-DOWNLOAD.md) | ST-VID-006 | `001-video-lifecycle` | `002-video-access` | ST-VID-006 | Especificado; implementação pendente |
| `REQ-VID-DOWNLOAD-003` | [`REQ-VID-DOWNLOAD.md`](../../../docs/requirements/REQ-VID-DOWNLOAD.md) | ST-VID-006 | `001-video-lifecycle` | `002-video-access` | ST-VID-006 | Especificado; implementação pendente |
| `REQ-VID-DOWNLOAD-004` | [`REQ-VID-DOWNLOAD.md`](../../../docs/requirements/REQ-VID-DOWNLOAD.md) | ST-VID-006 | `001-video-lifecycle` | `002-video-access` | ST-VID-006 | Especificado; implementação pendente |
| `REQ-VID-DOWNLOAD-005` | [`REQ-VID-DOWNLOAD.md`](../../../docs/requirements/REQ-VID-DOWNLOAD.md) | ST-VID-006 | `001-video-lifecycle` | `002-video-access` | ST-VID-006 | Especificado; implementação pendente |
| `REQ-VID-DOWNLOAD-006` | [`REQ-VID-DOWNLOAD.md`](../../../docs/requirements/REQ-VID-DOWNLOAD.md) | ST-VID-006 | `001-video-lifecycle` | `002-video-access` | ST-VID-006 | Especificado; implementação pendente |
| `REQ-VID-DOWNLOAD-007` | [`REQ-VID-DOWNLOAD.md`](../../../docs/requirements/REQ-VID-DOWNLOAD.md) | ST-VID-006 | `001-video-lifecycle` | `002-video-access` | ST-VID-006 | Especificado; implementação pendente |
| `REQ-VID-DOWNLOAD-008` | [`REQ-VID-DOWNLOAD.md`](../../../docs/requirements/REQ-VID-DOWNLOAD.md) | ST-VID-006 | `001-video-lifecycle` | `002-video-access` | ST-VID-006 | Especificado; implementação pendente |
| `REQ-VID-DOWNLOAD-009` | [`REQ-VID-DOWNLOAD.md`](../../../docs/requirements/REQ-VID-DOWNLOAD.md) | ST-VID-006 | `001-video-lifecycle` | `002-video-access` | ST-VID-006 | Especificado; implementação pendente |
| `REQ-VID-ERROR-001` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-ERROR-002` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-ERROR-003` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-FILTER-001` | [`REQ-VID-FILTER.md`](../../../docs/requirements/REQ-VID-FILTER.md) | ST-VID-009 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-009 | Especificado; implementação pendente |
| `REQ-VID-FILTER-002` | [`REQ-VID-FILTER.md`](../../../docs/requirements/REQ-VID-FILTER.md) | ST-VID-009 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-009 | Especificado; implementação pendente |
| `REQ-VID-FILTER-003` | [`REQ-VID-FILTER.md`](../../../docs/requirements/REQ-VID-FILTER.md) | ST-VID-009 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-009 | Especificado; implementação pendente |
| `REQ-VID-FILTER-004` | [`REQ-VID-FILTER.md`](../../../docs/requirements/REQ-VID-FILTER.md) | ST-VID-009 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-009 | Especificado; implementação pendente |
| `REQ-VID-FILTER-005` | [`REQ-VID-FILTER.md`](../../../docs/requirements/REQ-VID-FILTER.md) | ST-VID-009 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-009 | Especificado; implementação pendente |
| `REQ-VID-FILTER-006` | [`REQ-VID-FILTER.md`](../../../docs/requirements/REQ-VID-FILTER.md) | ST-VID-009 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-009 | Especificado; implementação pendente |
| `REQ-VID-FILTER-007` | [`REQ-VID-FILTER.md`](../../../docs/requirements/REQ-VID-FILTER.md) | ST-VID-009 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-009 | Especificado; implementação pendente |
| `REQ-VID-FRAMES-001` | [`REQ-VID-FRAMES.md`](../../../docs/requirements/REQ-VID-FRAMES.md) | ST-VID-005 | `002-video-transformations` | `006-video-frame-export` | ST-VID-005 | Especificado; implementação pendente |
| `REQ-VID-FRAMES-002` | [`REQ-VID-FRAMES.md`](../../../docs/requirements/REQ-VID-FRAMES.md) | ST-VID-005 | `002-video-transformations` | `006-video-frame-export` | ST-VID-005 | Especificado; implementação pendente |
| `REQ-VID-FRAMES-003` | [`REQ-VID-FRAMES.md`](../../../docs/requirements/REQ-VID-FRAMES.md) | ST-VID-005 | `002-video-transformations` | `006-video-frame-export` | ST-VID-005 | Especificado; implementação pendente |
| `REQ-VID-FRAMES-004` | [`REQ-VID-FRAMES.md`](../../../docs/requirements/REQ-VID-FRAMES.md) | ST-VID-005 | `002-video-transformations` | `006-video-frame-export` | ST-VID-005 | Especificado; implementação pendente |
| `REQ-VID-FRAMES-005` | [`REQ-VID-FRAMES.md`](../../../docs/requirements/REQ-VID-FRAMES.md) | ST-VID-005 | `002-video-transformations` | `006-video-frame-export` | ST-VID-005 | Especificado; implementação pendente |
| `REQ-VID-FRAMES-006` | [`REQ-VID-FRAMES.md`](../../../docs/requirements/REQ-VID-FRAMES.md) | ST-VID-005 | `002-video-transformations` | `006-video-frame-export` | ST-VID-005 | Especificado; implementação pendente |
| `REQ-VID-FRAMES-007` | [`REQ-VID-FRAMES.md`](../../../docs/requirements/REQ-VID-FRAMES.md) | ST-VID-005 | `002-video-transformations` | `006-video-frame-export` | ST-VID-005 | Especificado; implementação pendente |
| `REQ-VID-FRAMES-008` | [`REQ-VID-FRAMES.md`](../../../docs/requirements/REQ-VID-FRAMES.md) | ST-VID-005 | `002-video-transformations` | `006-video-frame-export` | ST-VID-005 | Especificado; implementação pendente |
| `REQ-VID-FRAMES-009` | [`REQ-VID-FRAMES.md`](../../../docs/requirements/REQ-VID-FRAMES.md) | ST-VID-005 | `002-video-transformations` | `006-video-frame-export` | ST-VID-005 | Especificado; implementação pendente |
| `REQ-VID-FRAMES-010` | [`REQ-VID-FRAMES.md`](../../../docs/requirements/REQ-VID-FRAMES.md) | ST-VID-005 | `002-video-transformations` | `006-video-frame-export` | ST-VID-005 | Especificado; implementação pendente |
| `REQ-VID-FRAMES-011` | [`REQ-VID-FRAMES.md`](../../../docs/requirements/REQ-VID-FRAMES.md) | ST-VID-005 | `002-video-transformations` | `006-video-frame-export` | ST-VID-005 | Especificado; implementação pendente |
| `REQ-VID-FRAMES-012` | [`REQ-VID-FRAMES.md`](../../../docs/requirements/REQ-VID-FRAMES.md) | ST-VID-005 | `002-video-transformations` | `006-video-frame-export` | ST-VID-005 | Especificado; implementação pendente |
| `REQ-VID-FRAMES-013` | [`REQ-VID-FRAMES.md`](../../../docs/requirements/REQ-VID-FRAMES.md) | ST-VID-005 | `002-video-transformations` | `006-video-frame-export` | ST-VID-005 | Especificado; implementação pendente |
| `REQ-VID-INFO-001` | [`REQ-VID-INFO.md`](../../../docs/requirements/REQ-VID-INFO.md) | ST-VID-007 | `001-video-lifecycle` | `002-video-access` | ST-VID-007 | Especificado; implementação pendente |
| `REQ-VID-INFO-002` | [`REQ-VID-INFO.md`](../../../docs/requirements/REQ-VID-INFO.md) | ST-VID-007 | `001-video-lifecycle` | `002-video-access` | ST-VID-007 | Especificado; implementação pendente |
| `REQ-VID-INFO-003` | [`REQ-VID-INFO.md`](../../../docs/requirements/REQ-VID-INFO.md) | ST-VID-007 | `001-video-lifecycle` | `002-video-access` | ST-VID-007 | Especificado; implementação pendente |
| `REQ-VID-INFO-004` | [`REQ-VID-INFO.md`](../../../docs/requirements/REQ-VID-INFO.md) | ST-VID-007 | `001-video-lifecycle` | `002-video-access` | ST-VID-007 | Especificado; implementação pendente |
| `REQ-VID-INFO-005` | [`REQ-VID-INFO.md`](../../../docs/requirements/REQ-VID-INFO.md) | ST-VID-007 | `001-video-lifecycle` | `002-video-access` | ST-VID-007 | Especificado; implementação pendente |
| `REQ-VID-INFO-006` | [`REQ-VID-INFO.md`](../../../docs/requirements/REQ-VID-INFO.md) | ST-VID-007 | `001-video-lifecycle` | `002-video-access` | ST-VID-007 | Especificado; implementação pendente |
| `REQ-VID-INFO-007` | [`REQ-VID-INFO.md`](../../../docs/requirements/REQ-VID-INFO.md) | ST-VID-007 | `001-video-lifecycle` | `002-video-access` | ST-VID-007 | Especificado; implementação pendente |
| `REQ-VID-INFO-008` | [`REQ-VID-INFO.md`](../../../docs/requirements/REQ-VID-INFO.md) | ST-VID-007 | `001-video-lifecycle` | `002-video-access` | ST-VID-007 | Especificado; implementação pendente |
| `REQ-VID-INFO-009` | [`REQ-VID-INFO.md`](../../../docs/requirements/REQ-VID-INFO.md) | ST-VID-007 | `001-video-lifecycle` | `002-video-access` | ST-VID-007 | Especificado; implementação pendente |
| `REQ-VID-NFR-001` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-NFR-002` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-NFR-003` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000, ST-VID-001, ST-VID-002, ST-VID-003, ST-VID-004, ST-VID-005, ST-VID-008, ST-VID-009, ST-VID-010, ST-VID-011, ST-VID-012, ST-VID-013, ST-VID-014, ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-NFR-004` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-005 | `002-video-transformations` | `006-video-frame-export` | ST-VID-005 | Especificado; implementação pendente |
| `REQ-VID-NFR-005` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-NFR-006` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-NFR-007` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-NFR-008` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-NFR-009` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-NFR-010` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-001 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-001, ST-VID-002, ST-VID-003, ST-VID-004, ST-VID-005, ST-VID-008, ST-VID-009, ST-VID-010, ST-VID-011, ST-VID-012, ST-VID-013, ST-VID-014, ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-NFR-011` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-NFR-012` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-012 | `002-video-transformations` | `007-video-format-conversion` | ST-VID-012, ST-VID-001, ST-VID-002, ST-VID-003, ST-VID-004, ST-VID-005, ST-VID-008, ST-VID-009, ST-VID-010, ST-VID-011, ST-VID-013, ST-VID-014, ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-NFR-013` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-NFR-014` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-015 | `003-video-composition` | `009-video-batch` | ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-NFR-015` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-008 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-008, ST-VID-009, ST-VID-010, ST-VID-011 | Especificado; implementação pendente |
| `REQ-VID-NFR-016` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-006 | `001-video-lifecycle` | `002-video-access` | ST-VID-006 | Especificado; implementação pendente |
| `REQ-VID-NFR-017` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-NFR-018` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-001 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-001, ST-VID-002, ST-VID-003, ST-VID-004, ST-VID-005, ST-VID-008, ST-VID-009, ST-VID-010, ST-VID-011, ST-VID-012, ST-VID-013, ST-VID-014, ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-NFR-019` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-005 | `002-video-transformations` | `006-video-frame-export` | ST-VID-005 | Especificado; implementação pendente |
| `REQ-VID-NFR-020` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-005 | `002-video-transformations` | `006-video-frame-export` | ST-VID-005 | Especificado; implementação pendente |
| `REQ-VID-NFR-021` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-NFR-022` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-013 | `003-video-composition` | `008-video-concat-chain` | ST-VID-013 | Especificado; implementação pendente |
| `REQ-VID-NFR-023` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-014 | `003-video-composition` | `008-video-concat-chain` | ST-VID-014 | Especificado; implementação pendente |
| `REQ-VID-NFR-024` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-013 | `003-video-composition` | `008-video-concat-chain` | ST-VID-013 | Especificado; implementação pendente |
| `REQ-VID-NFR-025` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-006 | `001-video-lifecycle` | `002-video-access` | ST-VID-006 | Especificado; implementação pendente |
| `REQ-VID-NFR-026` | [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | ST-VID-012 | `002-video-transformations` | `007-video-format-conversion` | ST-VID-012, ST-VID-001, ST-VID-002, ST-VID-003, ST-VID-004, ST-VID-005, ST-VID-008, ST-VID-009, ST-VID-010, ST-VID-011, ST-VID-013, ST-VID-014, ST-VID-015 | Especificado; implementação pendente |
| `REQ-VID-ORIENT-001` | [`REQ-VID-ORIENT.md`](../../../docs/requirements/REQ-VID-ORIENT.md) | ST-VID-011 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-011 | Especificado; implementação pendente |
| `REQ-VID-ORIENT-002` | [`REQ-VID-ORIENT.md`](../../../docs/requirements/REQ-VID-ORIENT.md) | ST-VID-011 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-011 | Especificado; implementação pendente |
| `REQ-VID-ORIENT-003` | [`REQ-VID-ORIENT.md`](../../../docs/requirements/REQ-VID-ORIENT.md) | ST-VID-011 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-011 | Especificado; implementação pendente |
| `REQ-VID-ORIENT-004` | [`REQ-VID-ORIENT.md`](../../../docs/requirements/REQ-VID-ORIENT.md) | ST-VID-011 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-011 | Especificado; implementação pendente |
| `REQ-VID-ORIENT-005` | [`REQ-VID-ORIENT.md`](../../../docs/requirements/REQ-VID-ORIENT.md) | ST-VID-011 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-011 | Especificado; implementação pendente |
| `REQ-VID-ORIENT-006` | [`REQ-VID-ORIENT.md`](../../../docs/requirements/REQ-VID-ORIENT.md) | ST-VID-011 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-011 | Especificado; implementação pendente |
| `REQ-VID-ORIENT-007` | [`REQ-VID-ORIENT.md`](../../../docs/requirements/REQ-VID-ORIENT.md) | ST-VID-011 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-011 | Especificado; implementação pendente |
| `REQ-VID-ORIENT-008` | [`REQ-VID-ORIENT.md`](../../../docs/requirements/REQ-VID-ORIENT.md) | ST-VID-011 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-011 | Especificado; implementação pendente |
| `REQ-VID-ORIENT-009` | [`REQ-VID-ORIENT.md`](../../../docs/requirements/REQ-VID-ORIENT.md) | ST-VID-011 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-011 | Especificado; implementação pendente |
| `REQ-VID-QUOTA-001` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-QUOTA-002` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-QUOTA-003` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-QUOTA-004` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-QUOTA-005` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-QUOTA-006` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-QUOTA-007` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-QUOTA-008` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-RESIZE-001` | [`REQ-VID-RESIZE.md`](../../../docs/requirements/REQ-VID-RESIZE.md) | ST-VID-010 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-010 | Especificado; implementação pendente |
| `REQ-VID-RESIZE-002` | [`REQ-VID-RESIZE.md`](../../../docs/requirements/REQ-VID-RESIZE.md) | ST-VID-010 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-010 | Especificado; implementação pendente |
| `REQ-VID-RESIZE-003` | [`REQ-VID-RESIZE.md`](../../../docs/requirements/REQ-VID-RESIZE.md) | ST-VID-010 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-010 | Especificado; implementação pendente |
| `REQ-VID-RESIZE-004` | [`REQ-VID-RESIZE.md`](../../../docs/requirements/REQ-VID-RESIZE.md) | ST-VID-010 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-010 | Especificado; implementação pendente |
| `REQ-VID-RESIZE-005` | [`REQ-VID-RESIZE.md`](../../../docs/requirements/REQ-VID-RESIZE.md) | ST-VID-010 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-010 | Especificado; implementação pendente |
| `REQ-VID-RESIZE-006` | [`REQ-VID-RESIZE.md`](../../../docs/requirements/REQ-VID-RESIZE.md) | ST-VID-010 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-010 | Especificado; implementação pendente |
| `REQ-VID-RESIZE-007` | [`REQ-VID-RESIZE.md`](../../../docs/requirements/REQ-VID-RESIZE.md) | ST-VID-010 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-010 | Especificado; implementação pendente |
| `REQ-VID-RESIZE-008` | [`REQ-VID-RESIZE.md`](../../../docs/requirements/REQ-VID-RESIZE.md) | ST-VID-010 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-010 | Especificado; implementação pendente |
| `REQ-VID-RESIZE-009` | [`REQ-VID-RESIZE.md`](../../../docs/requirements/REQ-VID-RESIZE.md) | ST-VID-010 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-010 | Especificado; implementação pendente |
| `REQ-VID-SPEED-001` | [`REQ-VID-SPEED.md`](../../../docs/requirements/REQ-VID-SPEED.md) | ST-VID-003 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-003 | Especificado; implementação pendente |
| `REQ-VID-SPEED-002` | [`REQ-VID-SPEED.md`](../../../docs/requirements/REQ-VID-SPEED.md) | ST-VID-003 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-003 | Especificado; implementação pendente |
| `REQ-VID-SPEED-003` | [`REQ-VID-SPEED.md`](../../../docs/requirements/REQ-VID-SPEED.md) | ST-VID-003 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-003 | Especificado; implementação pendente |
| `REQ-VID-SPEED-004` | [`REQ-VID-SPEED.md`](../../../docs/requirements/REQ-VID-SPEED.md) | ST-VID-003 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-003 | Especificado; implementação pendente |
| `REQ-VID-SPEED-005` | [`REQ-VID-SPEED.md`](../../../docs/requirements/REQ-VID-SPEED.md) | ST-VID-003 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-003 | Especificado; implementação pendente |
| `REQ-VID-SPEED-006` | [`REQ-VID-SPEED.md`](../../../docs/requirements/REQ-VID-SPEED.md) | ST-VID-003 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-003 | Especificado; implementação pendente |
| `REQ-VID-SPEED-007` | [`REQ-VID-SPEED.md`](../../../docs/requirements/REQ-VID-SPEED.md) | ST-VID-003 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-003 | Especificado; implementação pendente |
| `REQ-VID-SPEED-008` | [`REQ-VID-SPEED.md`](../../../docs/requirements/REQ-VID-SPEED.md) | ST-VID-003 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-003 | Especificado; implementação pendente |
| `REQ-VID-STORAGE-001` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-STORAGE-002` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-STORAGE-003` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-STORAGE-004` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-STORAGE-005` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-TASK-001` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-TASK-002` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-TASK-003` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-TASK-004` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-TASK-005` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-TASK-006` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-TASK-007` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-TASK-008` | [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | ST-VID-COM-001 | `001-video-lifecycle` | `003-video-task-foundation` | ST-VID-COM-001 | Especificado; implementação pendente |
| `REQ-VID-TRIM-001` | [`REQ-VID-TRIM.md`](../../../docs/requirements/REQ-VID-TRIM.md) | ST-VID-001 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-001 | Especificado; implementação pendente |
| `REQ-VID-TRIM-002` | [`REQ-VID-TRIM.md`](../../../docs/requirements/REQ-VID-TRIM.md) | ST-VID-001 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-001 | Especificado; implementação pendente |
| `REQ-VID-TRIM-003` | [`REQ-VID-TRIM.md`](../../../docs/requirements/REQ-VID-TRIM.md) | ST-VID-001 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-001 | Especificado; implementação pendente |
| `REQ-VID-TRIM-004` | [`REQ-VID-TRIM.md`](../../../docs/requirements/REQ-VID-TRIM.md) | ST-VID-001 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-001 | Especificado; implementação pendente |
| `REQ-VID-TRIM-005` | [`REQ-VID-TRIM.md`](../../../docs/requirements/REQ-VID-TRIM.md) | ST-VID-001 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-001 | Especificado; implementação pendente |
| `REQ-VID-TRIM-006` | [`REQ-VID-TRIM.md`](../../../docs/requirements/REQ-VID-TRIM.md) | ST-VID-001 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-001 | Especificado; implementação pendente |
| `REQ-VID-TRIM-007` | [`REQ-VID-TRIM.md`](../../../docs/requirements/REQ-VID-TRIM.md) | ST-VID-001 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-001 | Especificado; implementação pendente |
| `REQ-VID-TRIM-008` | [`REQ-VID-TRIM.md`](../../../docs/requirements/REQ-VID-TRIM.md) | ST-VID-001 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-001 | Especificado; implementação pendente |
| `REQ-VID-TRIM-009` | [`REQ-VID-TRIM.md`](../../../docs/requirements/REQ-VID-TRIM.md) | ST-VID-001 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-001 | Especificado; implementação pendente |
| `REQ-VID-TRIM-010` | [`REQ-VID-TRIM.md`](../../../docs/requirements/REQ-VID-TRIM.md) | ST-VID-001 | `002-video-transformations` | `004-video-basic-edits` | ST-VID-001 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-001` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-002` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-003` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-004` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-005` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-006` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-007` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-008` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-009` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-010` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-011` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-012` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-013` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-014` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-015` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-016` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-017` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-018` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-019` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-UPLOAD-020` | [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | ST-VID-000 | `001-video-lifecycle` | `001-video-lifecycle` | ST-VID-000 | Especificado; implementação pendente |
| `REQ-VID-WATERMARK-001` | [`REQ-VID-WATERMARK.md`](../../../docs/requirements/REQ-VID-WATERMARK.md) | ST-VID-004 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-004 | Especificado; implementação pendente |
| `REQ-VID-WATERMARK-002` | [`REQ-VID-WATERMARK.md`](../../../docs/requirements/REQ-VID-WATERMARK.md) | ST-VID-004 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-004 | Especificado; implementação pendente |
| `REQ-VID-WATERMARK-003` | [`REQ-VID-WATERMARK.md`](../../../docs/requirements/REQ-VID-WATERMARK.md) | ST-VID-004 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-004 | Especificado; implementação pendente |
| `REQ-VID-WATERMARK-004` | [`REQ-VID-WATERMARK.md`](../../../docs/requirements/REQ-VID-WATERMARK.md) | ST-VID-004 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-004 | Especificado; implementação pendente |
| `REQ-VID-WATERMARK-005` | [`REQ-VID-WATERMARK.md`](../../../docs/requirements/REQ-VID-WATERMARK.md) | ST-VID-004 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-004 | Especificado; implementação pendente |
| `REQ-VID-WATERMARK-006` | [`REQ-VID-WATERMARK.md`](../../../docs/requirements/REQ-VID-WATERMARK.md) | ST-VID-004 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-004 | Especificado; implementação pendente |
| `REQ-VID-WATERMARK-007` | [`REQ-VID-WATERMARK.md`](../../../docs/requirements/REQ-VID-WATERMARK.md) | ST-VID-004 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-004 | Especificado; implementação pendente |
| `REQ-VID-WATERMARK-008` | [`REQ-VID-WATERMARK.md`](../../../docs/requirements/REQ-VID-WATERMARK.md) | ST-VID-004 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-004 | Especificado; implementação pendente |
| `REQ-VID-WATERMARK-009` | [`REQ-VID-WATERMARK.md`](../../../docs/requirements/REQ-VID-WATERMARK.md) | ST-VID-004 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-004 | Especificado; implementação pendente |
| `REQ-VID-WATERMARK-010` | [`REQ-VID-WATERMARK.md`](../../../docs/requirements/REQ-VID-WATERMARK.md) | ST-VID-004 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-004 | Especificado; implementação pendente |
| `REQ-VID-WATERMARK-011` | [`REQ-VID-WATERMARK.md`](../../../docs/requirements/REQ-VID-WATERMARK.md) | ST-VID-004 | `002-video-transformations` | `005-video-visual-edits` | ST-VID-004 | Especificado; implementação pendente |

## Verificações

- Catálogo: **214 FR e 26 NFR**; todos os IDs canónicos estão listados uma vez nesta matriz.
- A propriedade dos FR é exclusiva por Unit: Unit 001 = 71; Unit 002 = 93; Unit 003 = 50 (214 no total).
- A propriedade dos NFR é exclusiva por Unit: Unit 001 = 13; Unit 002 = 8; Unit 003 = 5 (26 no total).
- As 17 Stories (16 casos de uso e uma transversal) estão atribuídas uma única vez a um Bolt. NFR e requisitos comuns podem ter Stories consumidoras adicionais sem duplicar propriedade.
- Critérios de aceitação e testes de implementação serão executados e registados na Construção; não são presumidos como verificados nesta fase.
