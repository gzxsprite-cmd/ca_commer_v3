# PAGE_INTENTS_BASELINE

## Purpose
Define baseline page intents for Stage-1 skeleton routing and role separation.
This document does not freeze final page specs or field-level design.

## Operations Workspace (Contract & Billing Operations)

### AM Home
- **Purpose**: AM role entry with intake, tracking, gap/receivable awareness.
- **Audience**: AM
- **Archetype**: Role Home
- **Emphasize**: pending AM actions, submitted contract progress, quick intake access.
- **Out of scope now**: full analytics dashboard and final approval logic details.

### CM Home
- **Purpose**: CM operational command page across queue, lifecycle, billing, and plans.
- **Audience**: CM
- **Archetype**: Role Home
- **Emphasize**: review queue load, lifecycle updates needed, monthly billing execution focus.
- **Out of scope now**: final policy engine and complete month-end process modeling.

### CA Home (Operations)
- **Purpose**: signature-focused entry for pending and completed CA contract actions.
- **Audience**: CA
- **Archetype**: Role Home
- **Emphasize**: contracts waiting signature and recently signed references.
- **Out of scope now**: final legal review template and exception escalation flows.

### Contract Intake
- **Purpose**: create and submit new contract case for internal flow start.
- **Audience**: AM (primary), CM (support)
- **Archetype**: Flow / Form
- **Emphasize**: minimum required inputs and clean submission handoff.
- **Out of scope now**: final full field model and compliance automation.

### Contract Status / Tracking
- **Purpose**: trace where contracts are in execution lifecycle.
- **Audience**: AM, CM
- **Archetype**: List / Trace
- **Emphasize**: status, owner, next step, and milestone visibility.
- **Out of scope now**: complex filtering grammar and advanced timeline analytics.

### Contract Review Queue
- **Purpose**: process contracts waiting CM review or CA signature.
- **Audience**: CM, CA
- **Archetype**: Review / Approval
- **Emphasize**: queue priority and confidence checkpoints for action.
- **Out of scope now**: final SLA/escalation matrix.

### Contract Archive
- **Purpose**: retrieve and inspect archived contracts and lifecycle trace.
- **Audience**: CM (primary), AM/CA (secondary)
- **Archetype**: List / Trace + Record Detail
- **Emphasize**: searchable archive entry and lifecycle evidence.
- **Out of scope now**: full legal repository behavior.

### Billing Execution
- **Purpose**: record completed billing and allocate to contract cases.
- **Audience**: CM
- **Archetype**: Flow / Form
- **Emphasize**: simple posting flow and allocation clarity.
- **Out of scope now**: final accounting integration logic.

### Billing Records
- **Purpose**: review historical billing events and allocation linkage.
- **Audience**: CM
- **Archetype**: List / Trace
- **Emphasize**: transaction traceability to contracts.
- **Out of scope now**: complex reconciliation toolkit.

### Receivables / Contract Balances
- **Purpose**: monitor uncollected amounts and contract-level balance risk.
- **Audience**: AM, CM
- **Archetype**: List / Trace
- **Emphasize**: outstanding balance visibility and prioritization.
- **Out of scope now**: final dunning strategy and collection workflow automation.

### Billing Plan
- **Purpose**: maintain upcoming billing plan baselines.
- **Audience**: CM
- **Archetype**: List / Flow hybrid
- **Emphasize**: monthly/near-term planning entries and revisions.
- **Out of scope now**: final planning algorithm and lock rules.

## Planning & Review Workspace

### SCP Home
- **Purpose**: SCP management entry across planning, allocation, coverage, adjustments.
- **Audience**: SCP
- **Archetype**: Role Home
- **Emphasize**: planning health and exception hotspots.
- **Out of scope now**: full BI cockpit.

### CA Review Home
- **Purpose**: CA management entry to review key planning/review outputs.
- **Audience**: CA
- **Archetype**: Role Home
- **Emphasize**: executive summary cards and decision-needed items.
- **Out of scope now**: final executive report pack format.

### Contract Planning
- **Purpose**: baseline contract-level future plan view.
- **Audience**: SCP
- **Archetype**: List / Trace
- **Emphasize**: managed contracts and upcoming plan lines.
- **Out of scope now**: final long-horizon forecasting model.

### Billing Planning
- **Purpose**: plan billing schedule and expected collection profile.
- **Audience**: SCP
- **Archetype**: List / Flow hybrid
- **Emphasize**: near/mid-term planned amounts and timing.
- **Out of scope now**: final scenario optimizer.

### Target Allocation
- **Purpose**: map top-down target to customer-level allocation directions.
- **Audience**: SCP
- **Archetype**: Flow / Review hybrid
- **Emphasize**: transparent allocation rationale and editable assumptions.
- **Out of scope now**: final optimization engine.

### Cost Coverage
- **Purpose**: compare project cost vs contract amount vs expected collection.
- **Audience**: SCP
- **Archetype**: List / Trace
- **Emphasize**: coverage signal and risk exposure.
- **Out of scope now**: final profitability model.

### Adjustments
- **Purpose**: record and track planning adjustments when actuals diverge.
- **Audience**: SCP
- **Archetype**: Flow / Form + List
- **Emphasize**: clear reason, amount/time impact, and status.
- **Out of scope now**: final approval governance flow.

### Review Dashboard
- **Purpose**: management summary view for CA review.
- **Audience**: CA (primary), SCP (secondary)
- **Archetype**: Workspace Home / Review
- **Emphasize**: decision-oriented cards, trend signals, exception highlights.
- **Out of scope now**: full custom dashboard builder.

## Boundary Rule
Role pages in the same workspace must not be simple clones with only filter differences; each role page should reflect different decision focus.
