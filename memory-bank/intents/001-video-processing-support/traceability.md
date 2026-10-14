---
intent: 001-video-processing-support
phase: inception
status: in-progress
created: 2026-10-09T16:57:05Z
updated: 2026-10-09T16:57:05Z
---

# Traceability Matrix: Video Processing Support

## Use Case to Requirement Matrix

| Use case | Step/rule | Requirement(s) | Acceptance evidence | Status |
|----------|-----------|----------------|---------------------|--------|
| UC-VID-001 | Steps 1-4; RN1-RN2 | FR-VID-COMMON-001, FR-VID-COMMON-004, FR-VID-TRIM-001 | Select video; reject invalid/out-of-range interval | Covered; duration precision pending |
| UC-VID-001 | Steps 5-7; RN3 | FR-VID-TRIM-002, FR-VID-COMMON-002/003 | New segment available; original unchanged | Covered; output codec pending |
| UC-VID-001 | Failure guarantee | FR-VID-ERROR-001/002, NFR-VID-002 | No partial result after failure | Covered; transaction mechanism pending |
| UC-VID-002 | Steps 1-3; RN1 | FR-VID-AUDIO-001, FR-VID-VALIDATION-001 | Detect audio stream; reject no-audio case per decision | Covered; no-audio policy pending |
| UC-VID-002 | Steps 4-6; RN2-RN3 | FR-VID-AUDIO-001, FR-VID-COMMON-002/003 | Silent result; visual stream preserved | Covered; codec policy pending |
| UC-VID-002 | Quota exception | FR-VID-QUOTA-001, FR-VID-ERROR-001 | No task if quota unavailable | Covered; quota policy pending |
| UC-VID-003 | Steps 2-4; RN1-RN2 | FR-VID-SPEED-001, FR-VID-COMMON-004 | Reject non-positive/out-of-range value | Covered; speed range pending |
| UC-VID-003 | Steps 5-7; RN3-RN4 | FR-VID-SPEED-002, FR-VID-COMMON-002/003 | Duration and playback behavior verified | Covered; audio behavior pending |
| UC-VID-004 | Steps 1-4; RN2-RN3 | FR-VID-WATERMARK-001, FR-VID-VALIDATION-001 | Validate text/image and visual bounds | Covered; numeric bounds pending |
| UC-VID-004 | Steps 5-9; RN1/RN6 | FR-VID-WATERMARK-002, FR-VID-TASK-001/002, FR-VID-COMMON-003 | Async task, progress, consistent watermark, stored result | Covered; task contract pending |
| UC-VID-004 | EX1-EX4 | FR-VID-ERROR-001/002, FR-VID-VALIDATION-001/002 | Actionable error; original intact | Covered; cleanup details pending |
| UC-VID-005 | Steps 1-4; RN1-RN3 | FR-VID-FRAMES-001, FR-VID-VALIDATION-001/002, FR-VID-QUOTA-001 | Estimate and validate frame count, format, limits | Covered; limits/formula pending |
| UC-VID-005 | Steps 5-8; RN5-RN9 | FR-VID-FRAMES-002, FR-VID-TASK-001/002, FR-VID-COMMON-003 | All frames added or none; progress and project integration | Covered; atomicity pending |
| UC-VID-005 | FA1 | FR-VID-FRAMES-003 | Preview does not create result or consume quota | Covered; sample size pending |
| UC-VID-005 | FA2-FA5 | FR-VID-TASK-003, FR-VID-QUOTA-001, FR-VID-ERROR-002 | Cancel, continue background, refund according to policy | Covered; state/refund policy pending |

## Cross-Cutting Requirements

| Requirement | Source rationale | Direct use-case step |
|-------------|------------------|----------------------|
| FR-VID-AUTH-001/002 | Existing JWT and project permission boundary plus protected preconditions | UC-VID-004 preconditions; UC-VID-005 preconditions |
| FR-VID-STORAGE-001/002 | All cases require input/result lifecycle and original preservation | Preconditions and postconditions across all cases |
| FR-VID-TASK-001/002/003 | Async/progress/cancel behavior in UC-VID-004/005 and needed for long video operations | UC-VID-004 steps 5-9; UC-VID-005 steps 4-7 |
| FR-VID-ERROR-001/002 | Exception and minimum-guarantee behavior across all cases | Exceptions and guarantees across all cases |
| NFR-VID-001/002/003/004/005/006 | Architecture evidence, security, integrity, resources, interoperability and testability needs | Cross-cutting |

## Gaps and Conflicts

- No source requirement defines the video resource schema or ownership relation; affected: FR-VID-COMMON-001, FR-VID-STORAGE-001.
- No source requirement defines one common task status/progress contract; affected: FR-VID-TASK-001/002/003.
- No source requirement defines whether trim/audio/speed consume quota; affected: FR-VID-QUOTA-001.
- The original document conflicts on UC-VID-004 and duplicates extraction; resolved provisionally through case-review normalization only.
- The original document proposes both anonymous access for the first three operations and authenticated storage/project behavior; no final authorization policy exists.
- Failure cleanup and all-or-nothing extraction require a transaction or compensation strategy not confirmed by the current architecture.
- No source requirement provides quantitative performance, capacity, retention, or availability targets; NFRs remain qualitative where no evidence exists.

## Requirements Without a Single Direct Step

NFR-VID-001 through NFR-VID-006 and parts of FR-VID-AUTH/STORAGE/TASK/ERROR are cross-cutting requirements derived from repeated preconditions, exceptions, guarantees and confirmed architectural boundaries. They are intentionally not duplicated under every use case.
