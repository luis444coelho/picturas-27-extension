---
intent: 001-video-processing-support
phase: inception
status: units-decomposed
updated: 2026-10-18T18:00:00Z
---

# Video Processing Support — Units

The final Portuguese inception artifact is [`docs/inception/artefactos-finais.md`](../../../../docs/inception/artefactos-finais.md). Units below assign each video use case once; common requirements are implemented by Unit 001 and consumed through shared contracts.

## Units

### 001-video-lifecycle

Owns UC-VID-000, 006, 007 and shared session, quota, storage, task and error contracts. Depends on existing authentication, projects and object storage. Complexity: L.

### 002-video-transformations

Owns UC-VID-001 to 005 and 008 to 012. Depends on Unit 001 and image-resource integration for frame extraction. Complexity: XL.

### 003-video-composition

Owns UC-VID-013 to 015. Depends on Unit 001 and eligible operations in Unit 002. Complexity: XL.

## Dependency graph

```text
001-video-lifecycle -> 002-video-transformations -> 003-video-composition
```

Bolts B001–B009 are planned in `memory-bank/bolts/` and detailed in the linked final artifact.
