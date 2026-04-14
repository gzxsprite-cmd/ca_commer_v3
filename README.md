# CA_Commer / CA商务协作平台

## Repository Intro
This repository contains the Stage-0/Stage-1 foundation for **CA_Commer** (external temporary name: **CA商务协作平台**).

- Stage-0: documentation baseline
- Stage-1: platform skeleton implementation (frontend shell + CSV-backed lightweight Python service)

## Current Goal
Build a clean, extensible skeleton for two workspaces while keeping scope lightweight:
1. **Contract & Billing Operations**
2. **Planning & Review**

Current product roles in scope:
- **AM**
- **CM**
- **SCP**
- **CA**

## Implemented Stage-1 Skeleton (Current)
- Shared app shell
- Workspace switcher + role switcher
- Role-aware top navigation
- Skeleton routes/pages for baseline page intents
- CSV-backed data layer
- Lightweight Python service for local read/write APIs

## Recommended Reading Order
1. `docs/PROJECT_SETUP.md`
2. `docs/PLATFORM_ARCHITECTURE_BASELINE.md`
3. `docs/ROLE_AND_NAV_BASELINE.md`
4. `docs/PAGE_INTENTS_BASELINE.md`
5. `docs/DATA_CONTRACT_BASELINE.md`
6. `docs/STATE_MACHINE_BASELINE.md`
7. `docs/UI_STYLE_SYSTEM.md`
8. `docs/CODING_CONSTITUTION.md`
9. `docs/DOC_UPDATE_RULES.md`
10. `docs/CHANGELOG.md`

## Local Run
```bash
python3 backend/server.py
```
Open: `http://127.0.0.1:8010`

## Scope Notes
Intentionally deferred:
- final workflow engine
- final backend/database design
- full production hardening
