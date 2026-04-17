# CA_Commer_v3 Current CSV & Data Relationship Audit

> Audit scope: current repository state only (no redesign).  
> Labels used: **Observed in code**, **Likely intended**, **Not yet enforced**.

## 1. Repo data overview

### Platform config
- `backend/data/workspaces.csv`
- `backend/data/roles.csv`
- `backend/data/workspace_role_visibility.csv`
- `backend/data/nav_items.csv`
- `backend/data/nav_role_visibility.csv`
- `backend/data/users_roles.csv`

### Contract flow
- `backend/data/contract_cases.csv`
- `backend/data/contract_status_events.csv`
- `backend/data/contract_archive_versions.csv`

### Billing flow
- `backend/data/billing_events.csv`
- `backend/data/billing_plans.csv`
- `backend/data/contract_balances.csv`
- `backend/data/receivable_summaries.csv`

### Planning/review
- `backend/data/planning_records.csv`
- `backend/data/adjustment_records.csv`

### Demo/supporting data
- `backend/data/dashboard_summary_cards.csv`
- `backend/data/se3_snapshots.csv`
- `backend/data/pms_projects.csv`

---

## 2. CSV-by-CSV schema inventory

| File | Purpose in current system | Columns | Guessed PK | Likely FK/reference | Status fields | Display-only fields | Read/Write in code | Dependent features/pages |
|---|---|---|---|---|---|---|---|---|
| `backend/data/workspaces.csv` | Workspace config for shell | `workspace_code, workspace_label, display_order, is_enabled` | `workspace_code` | referenced by `users_roles.default_workspace`, visibility tables | `is_enabled` | `workspace_label`, `display_order` | Read-only | Shell workspace tabs (`main.js`, `/api/shell/config`) |
| `backend/data/roles.csv` | Role config for shell | `role_code, role_label, display_order, is_enabled` | `role_code` | referenced by visibility tables, users | `is_enabled` | `role_label`, `display_order` | Read-only | Shell role switcher (`main.js`) |
| `backend/data/workspace_role_visibility.csv` | Workspace-role visibility matrix | `workspace_code, role_code, is_visible` | composite (`workspace_code`,`role_code`) | refs `workspaces`,`roles` | `is_visible` | - | Read-only | Shell role filter per workspace |
| `backend/data/nav_items.csv` | Nav metadata | `nav_key, nav_label, workspace_code, route, display_order, is_enabled` | `nav_key` | refs `workspaces`, route table alignment | `is_enabled` | `nav_label`, `display_order` | Read-only | Left nav rendering |
| `backend/data/nav_role_visibility.csv` | Nav-role visibility matrix | `nav_key, role_code, is_visible` | composite (`nav_key`,`role_code`) | refs `nav_items`,`roles` | `is_visible` | - | Read-only | Left nav per role |
| `backend/data/users_roles.csv` | Demo identity data | `user_id, display_name, role_code, default_workspace` | `user_id` | refs `roles`, `workspaces` | - | `display_name` | Read-only | Header identity text |
| `backend/data/contract_cases.csv` | **Main contract execution object** | `contract_case_id,...,comparison_diff,exception_reason` (33 cols) | `contract_case_id` | refs users (`am_owner_id`,`cm_owner_id`), links from many CSVs by `contract_case_id` | `execution_status`,`archive_status`,`comparison_status` | many summary/meta fields (`se3_summary`,`pms_summary`,`flow_chain`, etc.) | **Read + Write** | Intake, tracking list/detail, AM/CM home counts, review queue, archive search |
| `backend/data/contract_status_events.csv` | Contract event log | `event_id, contract_case_id, event_type, event_status, event_time, actor_role` | `event_id` | refs `contract_cases.contract_case_id` | `event_status` | `event_time`,`actor_role` | **Append-only write + read (limited)** | Written on intake/cm-action; no rich UI consumption yet |
| `backend/data/contract_archive_versions.csv` | Archive version metadata | `version_id, contract_case_id, version_type, version_label, file_url` | `version_id` | refs `contract_case_id` | - | `version_label`,`file_url` | Read-only | `/api/ops/contracts/archive/versions` |
| `backend/data/billing_events.csv` | Actual invoice posting records | `billing_event_id,billing_date,amount,allocation_status,linked_contract_case_ids` | `billing_event_id` | weak ref string to contract IDs | `allocation_status` | `billing_date` | **Read + Append write** | 开票登记/开票记录 |
| `backend/data/billing_plans.csv` | Planned billing records | `billing_plan_id,period_key,contract_case_id,planned_amount,plan_status` | `billing_plan_id` | refs `contract_case_id` | `plan_status` | `period_key` | Read-only | 开票计划 |
| `backend/data/contract_balances.csv` | Receivable by contract | `contract_case_id,contract_amount,billed_amount_total,receivable_outstanding` | `contract_case_id` | refs `contract_cases` | - | amount fields | Read-only | 应收账款 |
| `backend/data/receivable_summaries.csv` | Aggregate receivable summary | `summary_id,owner_scope_type,owner_scope_id,outstanding_amount,receivable_status` | `summary_id` | implicit ownership refs | `receivable_status` | - | Not read by current endpoints | Currently orphaned in UI/API |
| `backend/data/planning_records.csv` | Planning data (multi-type) | `planning_record_id,planning_type,scope_key,period_key,planned_value,planning_status` | `planning_record_id` | implicit refs via `scope_key` | `planning_status` | `period_key` | Read-only | Plan pages (`/plan/contracts`,`/plan/billing`,`/plan/targets`,`/plan/cost-coverage`) |
| `backend/data/adjustment_records.csv` | Planning adjustments | `adjustment_id,scope_key,adjustment_reason,delta_value,adjustment_status,proposed_by_role` | `adjustment_id` | implicit scope refs | `adjustment_status` | - | **Read + Append write** | 调整申请 |
| `backend/data/dashboard_summary_cards.csv` | Generic card metrics | `card_id,workspace_code,role_code,card_key,metric_value,metric_label,trend_hint` | `card_id` | refs workspace/role | - | metric labels/hints | Read-only | Generic home cards + plan review dashboard |
| `backend/data/se3_snapshots.csv` | Demo SE3 quote snapshots | `snapshot_id,pid,configuration_name,otp_amount,otc_amount,payment_year,sys_ebit_amount,sys_ebit_percent,customer_name,product_name` | `snapshot_id` | matched via search fields during intake | - | descriptive fields | Read-only | 合同登记与申请 (SE3 query/match) |
| `backend/data/pms_projects.csv` | Demo PMS projects | `project_id,project_name,system_project_type,project_status,related_pid,related_mcrl0,pjm_owner,remark_from_pjm,customer_name,product_name` | `project_id` | matched via search fields during intake | `project_status` | descriptive fields | Read-only | 合同登记与申请 (PMS query/match) |

### Notes
- **Observed in code:** `contract_cases.csv` is the central mutable business table.  
- **Likely intended:** `contract_status_events.csv` should be the historical audit stream for `contract_cases`.  
- **Not yet enforced:** FK constraints, referential integrity, and unique constraints are not enforced beyond code conventions.

---

## 3. Current code read/write map

### Backend CSV layer
- File: `backend/server.py`
  - Read helper: `read_csv_dicts(path)`
  - Write helpers: `write_csv_atomic(path, rows, fieldnames)`, `append_csv_row(path,row)`

### Read endpoints (selected)
- `/api/shell/config` reads: `workspaces, roles, workspace_role_visibility, nav_items, nav_role_visibility, users_roles`
- `/api/ops/am/status-counts` reads: `contract_cases`
- `/api/ops/cm/home-summary` reads: `contract_cases`
- `/api/ops/contracts/tracking`, `/detail`, `/review-queue`, `/archive` read: `contract_cases`
- `/api/ops/contracts/archive/versions` reads: `contract_archive_versions`
- `/api/ops/billing/records` reads: `billing_events`
- `/api/ops/billing/plan` reads: `billing_plans`
- `/api/ops/receivables/balances` reads: `contract_balances`
- `/api/plan/*` reads: `planning_records`, `adjustment_records`, `dashboard_summary_cards`
- `/api/ops/se3-snapshots` reads: `se3_snapshots`
- `/api/ops/pms-projects` reads: `pms_projects`

### Write endpoints
- `/api/ops/contracts/intake`
  - writes append: `contract_cases`, `contract_status_events`
- `/api/ops/contracts/cm-action`
  - updates row + atomic rewrite: `contract_cases`
  - appends event: `contract_status_events`
- `/api/ops/billing/execution`
  - appends: `billing_events`
- `/api/plan/adjustments`
  - appends: `adjustment_records`

### Frontend read/write usage
- `frontend/app/main.js`: boot reads `/api/shell/config`
- Ops pages:
  - `amHome.js` -> `/api/ops/am/status-counts`
  - `cmHome.js` -> `/api/ops/cm/home-summary`
  - `contractTracking.js` -> `/api/ops/contracts/tracking`, POST `/api/ops/contracts/cm-action`
  - `contractTrackingDetail.js` -> `/api/ops/contracts/tracking/detail`, POST `/api/ops/contracts/cm-action`
  - `contractIntake.js` -> SE3/PMS lookup + POST intake
  - billing/plan/receivables pages mostly generated by `pageFactories` with list/form APIs

### Hardcoded/bypass observations
- **Observed in code:** most pages use backend API (which is CSV-backed).  
- **Observed in code:** some UI fallback text/cards are hardcoded placeholders (e.g., home fallback cards via `makeHomePage`, intake extraction mock functions).  
- **Not yet enforced:** no independent repository/service abstraction; API handlers directly manipulate CSV rows.

---

## 4. Current relationship map

### Contract-related
- **Explicit relationship enforced in code**
  - `contract_status_events.contract_case_id -> contract_cases.contract_case_id` (written together by intake/cm-action).
- **Implicit relationship only suggested by same field name**
  - `contract_archive_versions.contract_case_id -> contract_cases.contract_case_id`
  - `billing_plans.contract_case_id -> contract_cases.contract_case_id`
  - `contract_balances.contract_case_id -> contract_cases.contract_case_id`
- **No real relationship yet, only parallel data**
  - `receivable_summaries` not joined/queried with `contract_cases` in current UI.

### Billing-related
- `billing_events.linked_contract_case_ids` is a delimited string, not normalized.
- Billing pages read raw events/plans; no strict reconciliation with balances.

### Workspace / role / nav
- **Explicit in code** via `/api/shell/config` + frontend filters:
  - `workspace_role_visibility` controls role availability per workspace.
  - `nav_role_visibility` + `nav_items` controls visible nav entries.
  - route access additionally filtered by route role list in `routes.js`.

### Shared status relationships
- `backend.status_bucket()` normalizes execution status for counting/filtering.
- `frontend/shared/status.js` maps status labels and badge classes for display.
- Potential drift risk exists if backend bucket map and frontend label map diverge.

### AM / CM / SCP shared data
- AM/CM/CA share `contractTracking.js` and `contractTrackingDetail.js` route (role-specific behavior inside page).
- SCP/CA planning pages share `planning_records` segmented by `planning_type`.

---

## 5. Relationship diagram

```text
workspaces.csv
  └─< workspace_role_visibility.csv by workspace_code
roles.csv
  ├─< workspace_role_visibility.csv by role_code
  ├─< nav_role_visibility.csv by role_code
  └─< users_roles.csv by role_code

nav_items.csv
  └─< nav_role_visibility.csv by nav_key

contract_cases.csv (contract_case_id)
  ├─< contract_status_events.csv by contract_case_id
  ├─< contract_archive_versions.csv by contract_case_id
  ├─< billing_plans.csv by contract_case_id (implicit)
  ├─< contract_balances.csv by contract_case_id (implicit)
  └─< billing_events.csv via linked_contract_case_ids (string list, not normalized)

planning_records.csv (planning_record_id)
  └─ filtered by planning_type into plan pages/endpoints

adjustment_records.csv (adjustment_id)
  └─ standalone append/read for adjustment flows

dashboard_summary_cards.csv
  └─ filtered by workspace_code + role_code for generic home/review cards
```

---

## 6. Page-to-data dependency map

| Page | Path | CSV-backed APIs | Key fields expected | Mutates state? | Shared across roles? |
|---|---|---|---|---|---|
| AM home | `frontend/app/pages/ops/amHome.js` | `/api/ops/am/status-counts` -> `contract_cases` | status buckets (`pending_cm_confirm`, etc.) | No | AM-only page, but counts reflect shared contracts |
| 合同登记与申请 | `frontend/app/pages/ops/contractIntake.js` | `/api/ops/se3-snapshots`, `/api/ops/pms-projects`, POST `/api/ops/contracts/intake` | extracted fields, match lists, allocation summary | **Yes** (`contract_cases`,`contract_status_events`) | AM role page |
| 合同进度追踪/合同跟进列表 | `frontend/app/pages/ops/contractTracking.js` | `/api/ops/contracts/tracking`, POST `/api/ops/contracts/cm-action` | `contract_case_id`, `formal_contract_id`, `execution_status`, summary fields | Optional CM action writes | Shared page: AM/CM/CA |
| 合同进度详情/合同跟进详情 | `frontend/app/pages/ops/contractTrackingDetail.js` | `/api/ops/contracts/tracking/detail`, POST `/api/ops/contracts/cm-action` | lifecycle fields, status, compare fields, exception fields | CM actions mutate `contract_cases` | Shared page: AM/CM/CA |
| CM home | `frontend/app/pages/ops/cmHome.js` | `/api/ops/cm/home-summary` -> `contract_cases` | bucket counts by execution status | No | CM-only page |
| 应收账款 | `frontend/app/pages/ops/receivableBalances.js` (factory) | `/api/ops/receivables/balances` -> `contract_balances` | contract amount/billed/outstanding | No | AM/CM/CA |
| 开票登记 | `frontend/app/pages/ops/billingExecution.js` (factory) | POST `/api/ops/billing/execution` -> `billing_events` | billing_date, amount, linked contracts | **Yes** append | CM-only |
| 开票记录 | `frontend/app/pages/ops/billingRecords.js` (factory) | `/api/ops/billing/records` -> `billing_events` | billing event fields | No | CM-only |
| 开票计划 | `frontend/app/pages/ops/billingPlan.js` (factory) | `/api/ops/billing/plan` -> `billing_plans` | period/amount/status | No | CM-only |
| CA/其他首页（工厂） | e.g. `ops/caHome.js`, `plan/*home.js` | `/api/home/cards` or fallback | `metric_label`,`metric_value` | No | role-specific |
| SCP/CA plan pages | `frontend/app/pages/plan/*.js` via factories | `/api/plan/contracts|billing|targets|cost-coverage|adjustments|review-dashboard` | planning/adjustment/card fields | adjustments page writes | Shared SCP/CA by route roles |
| Shell/workspace/nav config | `frontend/app/main.js`, `shared/state.js` | `/api/shell/config` | workspaces, roles, nav visibility matrices | No | Global shared shell |

---

## 7. Current issues / risks found

1. **Duplicate/near-duplicate status semantics**
   - `submitted_in_review` and `pending_cm_confirm` are merged in some backend counting/filtering logic.
   - Risk: drift between cards/counts and list filters if not consistently mapped.

2. **Relationship integrity is implicit, not enforced**
   - Many cross-table links rely on naming conventions (`contract_case_id`) without FK checks.

3. **Mixed normalized/non-normalized design**
   - `billing_events.linked_contract_case_ids` stores multi-value IDs in one string field.

4. **Event log underused in UI**
   - `contract_status_events.csv` is written, but most pages read only current snapshot (`contract_cases`).

5. **Some CSVs are currently orphaned or lightly used**
   - `receivable_summaries.csv` has no direct endpoint-page usage path in current UI.

6. **Hardcoded/fallback UI snippets exist**
   - Factory home fallback cards and intake mock extraction logic can diverge from actual CSV state.

7. **Very wide main table**
   - `contract_cases.csv` mixes identity, workflow state, compare outputs, archive docs, and remarks.

8. **Shared detail page role branching complexity**
   - AM/CM/CA share one detail module with CM-only action branch; role-specific display regressions are easy to introduce.

---

## 8. Suggested interpretation of the current data model

- **Current main object:** `contract_cases.csv` (contract execution lifecycle snapshot).
- **Config data:** workspaces/roles/nav/visibility/users CSVs.
- **Event data:** `contract_status_events.csv` (append-only lifecycle actions), plus billing/adjustment append logs.
- **Derived view data:** home card counts are dynamically derived from `contract_cases` via API logic; some card pages can also consume `dashboard_summary_cards.csv`.
- **Role/view-only support data:** `se3_snapshots.csv`, `pms_projects.csv`, and PDF assets support intake/compare UX.

---

## 9. Recommendations for next-step redesign discussion

> Not a redesign proposal; priority review shortlist based on current risk/exposure.

### Highest-priority tables/CSVs for product-owner review (5–10)
1. `contract_cases.csv`
2. `contract_status_events.csv`
3. `billing_events.csv`
4. `billing_plans.csv`
5. `contract_balances.csv`
6. `planning_records.csv`
7. `adjustment_records.csv`
8. `nav_items.csv`
9. `nav_role_visibility.csv`
10. `workspace_role_visibility.csv`

### Relationships safest to keep (current code alignment)
- `contract_cases` as central read model for tracking/detail/home counts.
- `contract_status_events` as append-only audit stream.
- `workspace/role/nav` visibility matrices consumed by shell config.

### Most likely to be reworked before SCP planning/review expands
- Contract-to-billing linkage (`linked_contract_case_ids` string normalization question).
- Separation of current-state snapshot vs event/history read model in contract flows.
- Receivable summary modeling (`receivable_summaries` vs `contract_balances`) and actual UI/API usage split.
- Planning scope-key relationships (currently mostly implicit, limited join enforcement).

---

## Appendix: inspected paths

- `backend/server.py`
- `backend/data/*.csv` (all files)
- `frontend/app/main.js`
- `frontend/app/routes.js`
- `frontend/app/shared/{api.js,state.js,status.js,ui.js}`
- `frontend/app/pages/pageFactories.js`
- `frontend/app/pages/ops/*.js`
- `frontend/app/pages/plan/*.js`
