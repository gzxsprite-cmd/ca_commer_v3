# PROJECT_SETUP

## Stage Definition
**Stage-0** established documentation and baseline product language.
**Stage-1** is the skeleton implementation stage: shared shell + role/workspace routing + CSV-backed lightweight service loop.

## Stage Scope
Included in current stage:
- Platform-level structure
- Two-workspace separation
- Role baseline (**AM, CM, SCP, CA**)
- Shared shell and top-level navigation baseline
- Lightweight UI and page grammar rules
- CSV-backed baseline data model
- Lightweight Python service for local CSV read/write

## What Stage-1 Should Achieve
- A runnable local skeleton for role homes and baseline routes
- A minimal real read/write loop using CSV as source of truth
- A transitional architecture between pure pages demo and future full application
- Stable structure for incremental page-by-page expansion

## Intentionally Deferred
- Detailed workflow and approval rule variants
- Final business fields and validations
- Final backend APIs and persistence model
- Final role permission matrix
- Production-scale performance/security hardening

## Success Definition
Stage-1 is successful when:
1. Users can switch workspace/role in one shared shell.
2. Baseline skeleton pages load role-relevant data from CSV-backed service.
3. At least simple write paths update CSV safely and are visible on readback.
4. The implementation remains lightweight, clear, and extensible.
