# PLATFORM_ARCHITECTURE_BASELINE

## Baseline Intent
Define only the **high-level platform skeleton** for a Pages demo evolving into a lightweight runnable Stage-1 structure.

## High-Level Skeleton
- **Shared Shell (global frame)**
  - top navigation
  - workspace switch entry
  - role context indicator
  - consistent page container
- **Workspace Layer**
  - Daily Execution Workspace
  - Tracking & Planning Workspace
- **Page Layer**
  - role home pages
  - workspace home pages
  - standard page archetypes (see PAGE_GRAMMAR)

## Shared Shell
Shared shell is mandatory for all pages:
- unified layout and spacing
- unified navigation behavior
- unified status/owner/next-step expression pattern
- no custom one-off shell per page

## Daily Execution Workspace (Baseline)
Covers operational flow context such as:
- contract and billing-related execution
- initiation, approval/signature, archive, and follow-up touchpoints
No final field or workflow detail is frozen at this stage.

## Tracking & Planning Workspace (Baseline)
Covers planning and management context such as:
- planning and adjustment
- SCP-oriented analysis
- CA management review
No final analytics model is frozen at this stage.

## Role-Oriented Entry Design
- Each role has a role home as first entry point.
- Role home links to relevant workspace tasks and lists.
- Workspace home provides cross-role operational view, but role-home remains the personal operational anchor.

## Data Modeling in Stage-1
Use lightweight but real baseline data modeling:
- CSV files as the source-of-truth data model
- stable identifiers and simple status labels
- Python lightweight local service layer for CSV read/write

## Transitional Path to Full Application
This stage is a transition between pure pages demo and future full application:
1. shared shell + skeleton routes/pages
2. CSV-backed local service read/write loop
3. modular frontend and service hardening
4. progressive replacement of CSV/service internals by production-ready stack
Maintain page contracts as stable as possible during migration.
