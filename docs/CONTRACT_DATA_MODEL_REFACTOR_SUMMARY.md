# CONTRACT_DATA_MODEL_REFACTOR_SUMMARY

## 背景
本次改造聚焦合同流转域（contract-flow domain），目标是将原先过度承载的 `contract_cases.csv` 拆分为“主快照 + 子表”结构，同时保持现有前端页面与 API 路由可运行。

## old -> new mapping（核心）

| 旧来源 | 旧字段 | 新表 | 新字段 | 动作 |
|---|---|---|---|---|
| contract_cases | contract_case_id | contract_cases | contract_case_id | keep |
| contract_cases | formal_contract_id | contract_cases | official_contract_id | move(rename) |
| contract_cases | contract_name | contract_structured_fields | contract_name | move |
| contract_cases | customer_contract_no | contract_structured_fields | customer_contract_no | move |
| contract_cases | total_amount | contract_structured_fields | total_amount | move |
| contract_cases | payment_terms | contract_structured_fields | payment_terms | move |
| contract_cases | uploaded_file_name | contract_structured_fields | uploaded_file_name | move |
| contract_cases | extract_summary | contract_structured_fields | extract_summary | move |
| contract_cases | se3_summary | contract_quote_links | pid (+snapshot_id) | split |
| contract_cases | pms_summary | contract_project_links | project_name (+project_id) | split |
| contract_cases | allocation_summary | contract_allocations | target_*/allocated_amount | split |
| contract_cases | payment_terms + total_amount | contract_payment_nodes | node_name/node_ratio/node_amount | derive |
| contract_cases | watermarked_pdf_path | contract_documents | document_type=watermarked_formal | move |
| contract_cases | ca_single_sign_backup | contract_documents | document_type=ca_single_signed | move |
| contract_cases | dual_signed_archive_file | contract_documents | document_type=dual_signed | move |
| contract_archive_versions | version_* | contract_documents | document_* | move |
| contract_cases | comparison_status/comparison_diff | contract_archive_reviews | comparison_status/diff_summary | move |
| contract_cases | exception_reason (+comparison_diff) | contract_exception_records | cm_comment/system_anomaly_reason | split |
| contract_status_events | event_* | contract_workflow_events | event_* + event_comment | move |

## 本次创建/变更的文件

### 新建 CSV
- `backend/data/users.csv`
- `backend/data/contract_structured_fields.csv`
- `backend/data/contract_documents.csv`
- `backend/data/contract_payment_nodes.csv`
- `backend/data/contract_quote_links.csv`
- `backend/data/contract_project_links.csv`
- `backend/data/contract_allocations.csv`
- `backend/data/contract_workflow_events.csv`
- `backend/data/contract_archive_reviews.csv`
- `backend/data/contract_exception_records.csv`

### 调整 CSV
- `backend/data/contract_cases.csv`（瘦身为主快照）
- `backend/data/contract_status_events.csv`（保留兼容镜像）
- `backend/data/contract_archive_versions.csv`（保留兼容镜像）

### 后端改造
- `backend/server.py`
  - 新增 contract-domain 聚合读取逻辑（由主表 + 子表组装前端兼容 view-model）
  - intake/cm-action 改写为写入新模型子表
  - 兼容保留旧事件/归档版本输出路径

## 兼容策略

1. **API 兼容优先**：
   - `/api/ops/contracts/tracking` 与 `/tracking/detail` 仍返回前端原有字段名（如 `formal_contract_id`、`payment_terms`、`comparison_diff`、`exception_reason`）。
   - 这些字段由后端在响应阶段从新子表聚合得到。

2. **写路径兼容**：
   - `/api/ops/contracts/intake` 改为：写 `contract_cases` 主快照 + `contract_structured_fields` + link/allocation/payment/document + `contract_workflow_events`。
   - `/api/ops/contracts/cm-action` 改为：更新 `contract_cases` 状态快照，并将文档/归档评审/异常关闭写入对应子表。

3. **旧表过渡**：
   - `contract_status_events.csv` 仍同步写入（兼容历史依赖）。
   - `contract_archive_versions.csv` 作为兼容视图保留。

## 已知限制

1. 旧数据中 `se3_summary` / `pms_summary` 部分仅有摘要文本，迁移到 links 表时部分 `snapshot_id/project_id` 只能做弱匹配或留空。  
2. `contract_payment_nodes` 由 payment_terms 派生，历史数据若术语格式不规范会影响节点精度。  
3. `contract_archive_versions` 与 `contract_documents` 在过渡期存在并行信息，后续建议逐步只保留 `contract_documents`。  

## 本轮未实现（明确边界）
- 未改 billing / receivables / planning / adjustment 表结构。
- 未改 workspace/role/nav 权限架构。
- 未新增数据库，仅在 CSV 域内完成结构化重构。

## 后续推荐（下一阶段，未在本次实现）
1. Billing 域：`billing_events`/`billing_plans`/`contract_balances` 结构化对齐。  
2. Planning 域：`planning_records` + `adjustment_records` 统一作用域维表。  
3. 引入轻量 schema 校验（CSV header & mandatory fields）与离线迁移脚本固化。
