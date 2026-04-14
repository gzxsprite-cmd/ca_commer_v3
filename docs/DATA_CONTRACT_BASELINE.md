# DATA_CONTRACT_BASELINE

## Purpose
Define the minimum **demo data contract** for Stage-1 skeleton pages.
This is not a final backend schema or API contract.

## Contract Rules
- Keep object set small and reusable.
- Prefer stable ids + human-readable labels.
- Ensure demo-critical fields support role homes and page placeholders.
- Defer advanced normalization, permissions, and audit design.

## 1) users / roles
- **Purpose**: identify current user role context for role-home and nav behavior.
- **Minimum key fields**: `user_id`, `display_name`, `role_code`, `default_workspace`.
- **Display-critical fields**: `display_name`, `role_code`.
- **Deferred**: org hierarchy depth, final authorization model.

## 2) workspaces
- **Purpose**: define workspace switcher options and route context.
- **Minimum key fields**: `workspace_code`, `workspace_name`, `workspace_type`.
- **Display-critical fields**: `workspace_name`.
- **Deferred**: dynamic workspace permission logic.

## 3) contract_cases
- **Purpose**: baseline contract case record for operations pages.
- **Minimum key fields**: `contract_case_id`, `contract_code`, `customer_name`, `am_owner_id`, `cm_owner_id`, `execution_status`, `archive_status`.
- **Display-critical fields**: `contract_code`, `customer_name`, `execution_status`, `current_owner_role`, `next_step_label`.
- **Deferred**: full legal/financial field model.

## 4) contract_status_events
- **Purpose**: milestone/event trace for contract lifecycle visibility.
- **Minimum key fields**: `event_id`, `contract_case_id`, `event_type`, `event_status`, `event_time`, `actor_role`.
- **Display-critical fields**: `event_type`, `event_time`, `actor_role`.
- **Deferred**: full immutable audit semantics.

## 5) billing_plans
- **Purpose**: planned billing lines by period and contract/customer.
- **Minimum key fields**: `billing_plan_id`, `period_key`, `contract_case_id`, `planned_amount`, `plan_status`.
- **Display-critical fields**: `period_key`, `planned_amount`, `plan_status`.
- **Deferred**: planning algorithm metadata and version governance.

## 6) billing_events
- **Purpose**: actual billing records and linkage to contracts.
- **Minimum key fields**: `billing_event_id`, `billing_date`, `amount`, `allocation_status`, `linked_contract_case_ids`.
- **Display-critical fields**: `billing_date`, `amount`, `allocation_status`.
- **Deferred**: accounting journal integration fields.

## 7) contract_balances
- **Purpose**: summarize contract-level planned/billed/outstanding amounts.
- **Minimum key fields**: `contract_case_id`, `contract_amount`, `billed_amount_total`, `receivable_outstanding`.
- **Display-critical fields**: `contract_amount`, `billed_amount_total`, `receivable_outstanding`.
- **Deferred**: currency/fx and accounting reconciliation detail.

## 8) receivable_summaries
- **Purpose**: role/home-level receivable rollups.
- **Minimum key fields**: `summary_id`, `owner_scope_type`, `owner_scope_id`, `outstanding_amount`, `receivable_status`.
- **Display-critical fields**: `outstanding_amount`, `receivable_status`.
- **Deferred**: full aging bucket logic.

## 9) planning_records
- **Purpose**: planning and target/coverage baseline records in Planning & Review.
- **Minimum key fields**: `planning_record_id`, `planning_type`, `scope_key`, `period_key`, `planned_value`, `planning_status`.
- **Display-critical fields**: `planning_type`, `period_key`, `planned_value`, `planning_status`.
- **Deferred**: final formula lineage and multi-version strategy.

## 10) adjustment_records
- **Purpose**: capture adjustment proposals and applied decisions.
- **Minimum key fields**: `adjustment_id`, `scope_key`, `adjustment_reason`, `delta_value`, `adjustment_status`, `proposed_by_role`.
- **Display-critical fields**: `adjustment_reason`, `delta_value`, `adjustment_status`.
- **Deferred**: final approval chain and governance policy fields.

## 11) dashboard_summary_cards
- **Purpose**: lightweight summary cards for role homes and CA review dashboard.
- **Minimum key fields**: `card_id`, `workspace_code`, `role_code`, `card_key`, `metric_value`, `metric_label`, `trend_hint`.
- **Display-critical fields**: `metric_label`, `metric_value`, `trend_hint`.
- **Deferred**: final KPI dictionary and benchmark rules.

## Mock Data Format Guidance (Stage-1)
- Prefer JSON for page placeholders and card summaries.
- Optional CSV mirrors may be used for list-heavy demos.
- Keep field naming aligned with this baseline across all mock slices.

## Stage-1 Boundary Note
This contract is for skeleton display wiring only. Final schema/API decisions remain deferred.
