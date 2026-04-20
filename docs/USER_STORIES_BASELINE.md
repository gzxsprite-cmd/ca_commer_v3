# USER_STORIES_BASELINE

## Purpose
Define **baseline** role stories for Stage-1 platform skeleton decisions.
These stories guide page intent and navigation only; they are not final workflow specs.

## Role Scope Note
Current-stage product roles are only: **AM, CM, SCP, CA**.
Project-side information can be referenced as supporting context but is not treated as a primary product role in this stage.

## Contract & Billing Operations Workspace

### AM
- **Why AM enters**
  - Start new contract intake and track progress after submission.
- **Main goals**
  - Submit contract cases for internal flow start.
  - Track key contract milestones (CA signed, customer sent, dual-signed returned, archived).
  - See unresolved prior project gaps before starting new contracts.
  - See receivable pressure for AM-related contracts.
- **Current round should define**
  - AM home focus, intake entry, and tracking visibility baseline.
- **Current round should NOT define**
  - Final intake field set, final compliance logic, final notification/automation rules.

### CM
- **Why CM enters**
  - Operate contract quality gate, lifecycle updates, billing execution, and billing planning.
- **Main goals**
  - Work through new submissions waiting for completeness/compliance check.
  - Maintain lifecycle statuses after major handoff events.
  - Locate archived contracts and lifecycle history quickly.
  - Execute billing recording + contract allocation.
  - Review billing history, receivable gaps, and set upcoming billing plans.
- **Current round should define**
  - CM queue, lifecycle trace, billing execution/records/plan entry points.
- **Current round should NOT define**
  - Final audit policy, final allocation rules, final month-close logic.

### CA (Operations)
- **Why CA enters**
  - Sign pending contracts and review signed history.
- **Main goals**
  - See pending signature queue size and priorities.
  - Review confidence signals before signing (AM maintained, CM checked).
  - Inspect previously signed contracts.
- **Current round should define**
  - CA operation home and review queue/readback baseline.
- **Current round should NOT define**
  - Final legal checklists, final delegation/escalation approval rules.

## Planning & Review Workspace

### SCP
- **Why SCP enters**
  - Plan contract/billing targets and manage forecast/adjustment logic.
- **Main goals**
  - Track managed contract portfolio and near-term plan coverage.
  - Build annual collection view from quarterly bottom-up signals.
  - Allocate global targets into customer-level direction.
  - Compare project cost coverage using cost vs contract vs expected collection.
  - Manage adjustments when actuals diverge from plan.
- **Current round should define**
  - SCP home plus planning, allocation, coverage, and adjustment page intents.
- **Current round should NOT define**
  - Final planning formulas, final governance cadence, final forecast methodology.

### CA (Planning & Review)
- **Why CA enters**
  - Consume management-level summaries for decisions.
- **Main goals**
  - Read high-signal review dashboard content and key exceptions.
  - Understand where management action is needed.
- **Current round should define**
  - CA review home and dashboard-oriented navigation baseline.
- **Current round should NOT define**
  - Final KPI pack, final scorecard methodology, final board-report format.

## Stage-1 Data Loop Note
Stage-1 skeleton pages should read/write through a lightweight Python service backed by CSV files.

## Stage-1 Boundary Note
The baseline captures intent, not final process design. Detailed user stories, final state machine, and final API/DB contracts remain deferred.
