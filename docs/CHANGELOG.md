# CHANGELOG

## 2026-04-14 — Stage-0 Baseline Initialization
- Added initial vibe coding foundation documentation pack for CA_Commer / CA商务协作平台.
- Established Stage-0 setup, platform skeleton baseline, workspace boundaries, role/nav baseline, UI style system, page grammar, coding constitution, documentation update rules, and evaluation principles.
- Confirmed this repository is currently a Pages-demo-first foundation and intentionally defers final business-level specifications.

## 2026-04-14 — Stage-1 Baseline Product Layer Docs
- Added `USER_STORIES_BASELINE.md` to capture role-level baseline stories for Operations and Planning & Review without freezing final workflow details.
- Added `PAGE_INTENTS_BASELINE.md` to define role-separated page intents and page-archetype alignment for Stage-1 skeleton routing.
- Added `STATE_MACHINE_BASELINE.md` with lightweight status-expression clusters for demo consistency (non-final state machine).
- Added `DATA_CONTRACT_BASELINE.md` to define minimum Stage-1 mock data objects and display-critical fields for skeleton pages.

## 2026-04-14 — Stage-1 Skeleton Implementation (CSV + Python Service)
- Implemented a lightweight frontend skeleton (`frontend/`) with shared shell, workspace switcher, role switcher, role-aware top nav, and baseline skeleton routes/pages.
- Implemented a lightweight Python local service (`backend/server.py`) and CSV-backed data model (`backend/data/*.csv`) for read/write demo flows.
- Added safe CSV write pattern in service updates (read current file, build updated rows, write temp file, atomic replace).
- Updated docs to remove PjM from current role scope and align Stage-1 to CSV-backed transitional architecture with Python service read/write.
- Updated README with runnable Stage-1 local run instructions.

## 2026-04-14 — Local Run Documentation Added
- Added `docs/RUN_LOCAL.md` with Stage-1 local startup instructions, quick start, prerequisites, URLs, CSV location, read/write behavior, and troubleshooting.
- Updated `README.md` with a concise Quick Start and link to local run guide.

## 2026-04-14 — Stage-1 Platform-wide UI Direction Correction
- Refactored frontend shell to a stronger workspace UI frame (top bar + sidebar + context expression).
- Completed Chinese-first wording pass for navigation, page titles, actions, helper text, status/table language.
- Applied task-first page grammar across representative home/list/form/review/detail page types.
- Added `docs/UI_REFACTOR_GUIDELINES_STAGE1.md` and updated UI/style grammar docs for reusable platform-wide guidance.
