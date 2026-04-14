# PLATFORM_ARCHITECTURE_BASELINE

## Baseline Intent
Define only the **high-level platform skeleton** for a Pages demo. This baseline is intentionally lightweight and extensible.

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
No final field or workflow detail is frozen at Stage-0.

## Tracking & Planning Workspace (Baseline)
Covers planning and management context such as:
- planning and adjustment
- SCP-oriented analysis
- CA management review
No final analytics model is frozen at Stage-0.

## Role-Oriented Entry Design
- Each role has a role home as first entry point.
- Role home links to relevant workspace tasks and lists.
- Workspace home provides cross-role operational view, but role-home remains the personal operational anchor.

## Data Modeling in Demo Stage
Use lightweight base modeling for demo:
- csv files and/or mock JSON data
- stable identifiers and simple status labels
- data structures kept minimal and evolvable

## Path to Full-Stack Application
Stage-0 → later stages:
1. Pages demo with mock/csv data
2. modular frontend with reusable components
3. Python-friendly backend service integration
4. progressive replacement of mock data with real services
Maintain page contracts as stable as possible during migration.
