---
unit: 001-video-lifecycle
intent: 001-video-processing-support
phase: inception
status: ready
created: 2026-10-18T18:00:00Z
updated: 2026-10-18T18:00:00Z
---

# Unit Brief: Ciclo de vida e recursos de vídeo

## Purpose and scope

Provide authenticated video ingestion and access in projects, plus shared contracts used by processing units.

**In scope:** UC-VID-000, UC-VID-006, UC-VID-007; common authorization, quota, storage, task lifecycle and errors. **Out of scope:** video transformations and composition.

## Assigned requirements

- `REQ-VID-UPLOAD-*`, `REQ-VID-DOWNLOAD-*`, `REQ-VID-INFO-*`.
- Shared `REQ-VID-COM-*`: AUTH, QUOTA, STORAGE, TASK and ERROR.
- Applicable quality requirements: `REQ-VID-NFR-001/002/005/006/007/008/016`.

## Domain concepts and operations

`Projeto`, `RecursoMultimédia`, `Vídeo`, `Utilizador`, `TrabalhoProcessamento`, `SaldoQuotaDiária`.
Ingest/validate video; persist metadata and preview; authorize lookup/download; create and track tasks.

## Dependencies and success criteria

Depends on existing authentication, project permissions and object storage. Must enforce the approved media matrix/profile limits, preserve object/metadata integrity, authorize temporary URLs and leave quota unchanged for upload, lookup and download.

## Bolt suggestions

B001 `001-video-lifecycle` (DDD); B002 `002-video-access` (Simple); B003 `003-video-task-foundation` (DDD).
