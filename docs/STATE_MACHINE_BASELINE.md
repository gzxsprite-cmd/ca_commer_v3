# STATE_MACHINE_BASELINE

## Purpose
Define lightweight **state expressions** for demo-stage consistency.
This is not a final process state machine.

## Usage Rules
- States are baseline labels for display and filtering.
- Keep meanings plain-language and stable.
- Do not infer final approvals, SLA rules, or automation behavior from this baseline.

## 1) Contract Execution Status
| State | Meaning | Who Cares | Type |
|---|---|---|---|
| draft | Intake started but not submitted | AM | process-state |
| submitted | Sent for internal handling | AM, CM | process-state |
| cm_in_review | Under CM completeness/compliance check | CM, AM | process-state |
| ca_pending_signature | Waiting CA sign action | CA, CM, AM | process-state |
| ca_signed | CA signature completed | CA, CM, AM | result-state |
| sent_to_customer | Outbound to customer completed | CM, AM | process-state |
| dual_signed_returned | Customer-signed copy returned | CM, AM | result-state |
| execution_closed | Contract lifecycle execution closed | AM, CM, CA | result-state |

## 2) Archive Visibility Status
| State | Meaning | Who Cares | Type |
|---|---|---|---|
| not_archived | Not yet archived | CM, AM | process-state |
| archived_indexed | Archived and searchable | CM, AM, CA | result-state |
| archived_reopened | Archived record reopened for follow-up | CM | process-state |

## 3) Billing Execution Status
| State | Meaning | Who Cares | Type |
|---|---|---|---|
| plan_pending | Planned but not billed yet | CM, SCP | process-state |
| billed_recorded | Billing executed and recorded | CM, SCP | result-state |
| allocated_to_contracts | Billing allocation linked to contracts | CM | result-state |
| billing_exception | Billing record needs correction/clarification | CM | process-state |

## 4) Receivable Status
| State | Meaning | Who Cares | Type |
|---|---|---|---|
| clear | No outstanding receivable | AM, CM, SCP | result-state |
| outstanding | Uncollected amount remains | AM, CM, SCP | process-state |
| overdue_risk | Collection delay risk is elevated | AM, CM, CA | process-state |

## 5) Planning Status
| State | Meaning | Who Cares | Type |
|---|---|---|---|
| planning_draft | Planning input is being prepared | SCP | process-state |
| planning_published | Baseline plan is published for tracking | SCP, CA | result-state |
| planning_under_review | Plan is being reviewed for management alignment | SCP, CA | process-state |
| planning_revised | Plan updated after review/actual change | SCP, CA | result-state |

## 6) Adjustment Status
| State | Meaning | Who Cares | Type |
|---|---|---|---|
| adjustment_proposed | Adjustment idea recorded | SCP | process-state |
| adjustment_in_assessment | Impact being assessed | SCP, CA | process-state |
| adjustment_applied | Adjustment reflected in active plan | SCP, CA | result-state |
| adjustment_cancelled | Adjustment withdrawn/not adopted | SCP | result-state |

## Stage-1 Boundary Note
These states support skeleton pages, home summaries, and simple demo filtering only.
