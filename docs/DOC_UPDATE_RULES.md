# DOC_UPDATE_RULES

## Purpose
Ensure documentation and implementation stay synchronized during iterative development.

## Required Doc Updates by Change Type

### 1) Navigation Change
Must update:
- `docs/ROLE_AND_NAV_BASELINE.md`
- `docs/WORKSPACE_BOUNDARIES.md` (if boundary impact exists)
- `docs/CHANGELOG.md`

### 2) Page Structure / Archetype Change
Must update:
- `docs/PAGE_GRAMMAR.md`
- `docs/PLATFORM_ARCHITECTURE_BASELINE.md` (if skeleton impact exists)
- `docs/CHANGELOG.md`

### 3) State Expression Change (status/owner/next-step pattern)
Must update:
- `docs/UI_STYLE_SYSTEM.md`
- `docs/PAGE_GRAMMAR.md` (if page behavior changes)
- `docs/CHANGELOG.md`

### 4) Mock Data / CSV Modeling Change
Must update:
- `docs/PLATFORM_ARCHITECTURE_BASELINE.md`
- `docs/PROJECT_SETUP.md` (if stage scope impact exists)
- `docs/CHANGELOG.md`

### 5) Workspace Boundary Change
Must update:
- `docs/WORKSPACE_BOUNDARIES.md`
- `docs/PLATFORM_ARCHITECTURE_BASELINE.md`
- `docs/ROLE_AND_NAV_BASELINE.md` (if role emphasis changes)
- `docs/CHANGELOG.md`

## Changelog Hygiene
- Add one concise entry per merged change.
- Use date + short scope summary.
- Record only meaningful baseline-impacting changes.
