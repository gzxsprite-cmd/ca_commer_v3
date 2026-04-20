# Post-Refactor Contract Schema Audit

## 1. Audit scope
- 审计对象：当前仓库中与目标结构相关的 CSV 文件、`backend/server.py` 读写路径、合同相关前端页面的数据依赖。
- 实际检查内容：
  - `backend/data/*.csv`（目标 18 张表 + legacy 兼容表）
  - `backend/server.py`（CSV_FILES 映射、聚合函数、GET/POST endpoint）
  - 前端合同页面与首页统计页面：
    - `frontend/app/pages/ops/contractIntake.js`
    - `frontend/app/pages/ops/contractTracking.js`
    - `frontend/app/pages/ops/contractTrackingDetail.js`
    - `frontend/app/pages/ops/amHome.js`
    - `frontend/app/pages/ops/cmHome.js`

## 2. Expected target structure

### Platform/config
- workspaces
- roles
- users
- nav_items
- workspace_role_visibility
- nav_role_visibility

### Reference data
- se3_snapshots
- pms_projects

### Contract domain
- contract_cases
- contract_structured_fields
- contract_documents
- contract_payment_nodes
- contract_quote_links
- contract_project_links
- contract_allocations
- contract_workflow_events
- contract_archive_reviews
- contract_exception_records

## 3. Actual CSV inventory

| expected_table_name | actual_file_name | repo_path | exists? | notes |
|---|---|---|---|---|
| workspaces | workspaces.csv | backend/data/workspaces.csv | yes | 与目标同名。 |
| roles | roles.csv | backend/data/roles.csv | yes | 与目标同名。 |
| users | users.csv | backend/data/users.csv | yes | 已有 core users；另有 legacy `users_roles.csv` 并存。 |
| nav_items | nav_items.csv | backend/data/nav_items.csv | yes | 与目标同名。 |
| workspace_role_visibility | workspace_role_visibility.csv | backend/data/workspace_role_visibility.csv | yes | 与目标同名。 |
| nav_role_visibility | nav_role_visibility.csv | backend/data/nav_role_visibility.csv | yes | 与目标同名。 |
| se3_snapshots | se3_snapshots.csv | backend/data/se3_snapshots.csv | yes | 与目标同名。 |
| pms_projects | pms_projects.csv | backend/data/pms_projects.csv | yes | 与目标同名。 |
| contract_cases | contract_cases.csv | backend/data/contract_cases.csv | yes | 已瘦身为 snapshot。 |
| contract_structured_fields | contract_structured_fields.csv | backend/data/contract_structured_fields.csv | yes | 已拆分。 |
| contract_documents | contract_documents.csv | backend/data/contract_documents.csv | yes | 已拆分。 |
| contract_payment_nodes | contract_payment_nodes.csv | backend/data/contract_payment_nodes.csv | yes | 已拆分，但运行时弱使用。 |
| contract_quote_links | contract_quote_links.csv | backend/data/contract_quote_links.csv | yes | 已拆分。 |
| contract_project_links | contract_project_links.csv | backend/data/contract_project_links.csv | yes | 已拆分。 |
| contract_allocations | contract_allocations.csv | backend/data/contract_allocations.csv | yes | 已拆分。 |
| contract_workflow_events | contract_workflow_events.csv | backend/data/contract_workflow_events.csv | yes | 已拆分，但运行时弱使用。 |
| contract_archive_reviews | contract_archive_reviews.csv | backend/data/contract_archive_reviews.csv | yes | 已拆分。 |
| contract_exception_records | contract_exception_records.csv | backend/data/contract_exception_records.csv | yes | 文件存在，但当前 seed 无记录。 |

## 4. Real schema by table

> 说明：以下 header 为文件中真实顺序（实测读取）。

### 4.1 platform/config

- `backend/data/workspaces.csv`
  - columns: `workspace_code, workspace_label, display_order, is_enabled`
  - column count: 4
  - role: 工作区配置。

- `backend/data/roles.csv`
  - columns: `role_code, role_label, display_order, is_enabled`
  - column count: 4
  - role: 角色配置。

- `backend/data/users.csv`
  - columns: `user_id, display_name, role_code, default_workspace, is_enabled`
  - column count: 5
  - role: 用户基础身份信息（shell 配置返回的 users 来源）。

- `backend/data/nav_items.csv`
  - columns: `nav_key, nav_label, workspace_code, route, display_order, is_enabled`
  - column count: 6
  - role: 导航项定义。

- `backend/data/workspace_role_visibility.csv`
  - columns: `workspace_code, role_code, is_visible`
  - column count: 3
  - role: 工作区-角色可见矩阵。

- `backend/data/nav_role_visibility.csv`
  - columns: `nav_key, role_code, is_visible`
  - column count: 3
  - role: 导航-角色可见矩阵。

### 4.2 reference data

- `backend/data/se3_snapshots.csv`
  - columns: `snapshot_id, pid, configuration_name, otp_amount, otc_amount, payment_year, sys_ebit_amount, sys_ebit_percent, customer_name, product_name`
  - column count: 10
  - role: SE3 匹配候选池。

- `backend/data/pms_projects.csv`
  - columns: `project_id, project_name, system_project_type, project_status, related_pid, related_mcrl0, pjm_owner, remark_from_pjm, customer_name, product_name`
  - column count: 10
  - role: PMS 匹配候选池。

### 4.3 contract domain

- `backend/data/contract_cases.csv`
  - columns: `contract_case_id, contract_code, dummy_contract_id, official_contract_id, contract_type, customer_name, project_name, product_name, contract_title, main_owner_id, am_owner_id, cm_owner_id, current_owner_role, execution_status, current_step, next_step, next_step_label, archive_effective_flag, archive_status, flow_chain, created_at, updated_at`
  - column count: 22
  - role: 当前执行快照主表（状态/负责人/步骤/主标识）。

- `backend/data/contract_structured_fields.csv`
  - columns: `structured_field_id, contract_case_id, customer_contract_no, contract_name, total_amount, payment_terms, uploaded_file_name, extract_summary, tax_rate, pre_tax_amount, post_tax_amount, maintained_by_role, maintained_at`
  - column count: 13
  - role: 结构化提取/维护字段。

- `backend/data/contract_documents.csv`
  - columns: `document_id, contract_case_id, document_type, version_label, file_url, is_current, uploaded_by_role, uploaded_at`
  - column count: 8
  - role: 文档版本与文件路径。

- `backend/data/contract_payment_nodes.csv`
  - columns: `payment_node_id, contract_case_id, node_name, node_ratio, node_amount, node_sequence, payment_year`
  - column count: 7
  - role: 节点级回款/付款拆分。

- `backend/data/contract_quote_links.csv`
  - columns: `quote_link_id, contract_case_id, snapshot_id, pid, link_source, is_primary`
  - column count: 6
  - role: 合同-SE3 链接。

- `backend/data/contract_project_links.csv`
  - columns: `project_link_id, contract_case_id, project_id, project_name, link_source, is_primary`
  - column count: 6
  - role: 合同-PMS 链接。

- `backend/data/contract_allocations.csv`
  - columns: `allocation_id, contract_case_id, target_type, target_id, target_name, allocated_amount, currency, source_note`
  - column count: 8
  - role: 分配行（项目/Buffer）。

- `backend/data/contract_workflow_events.csv`
  - columns: `event_id, contract_case_id, event_type, event_status, event_time, actor_role, event_comment`
  - column count: 7
  - role: 流程事件日志。

- `backend/data/contract_archive_reviews.csv`
  - columns: `archive_review_id, contract_case_id, comparison_base_document_type, comparison_target_document_type, comparison_status, diff_summary, diff_page_refs, reviewed_by_role, reviewed_at`
  - column count: 9
  - role: 归档比对结果。

- `backend/data/contract_exception_records.csv`
  - columns: `exception_record_id, contract_case_id, system_anomaly_reason, cm_comment, created_by_role, created_at, exception_status`
  - column count: 7
  - role: 异常关闭记录（结构已到位，当前 seed 为空）。

## 5. Implementation status by expected table

> 状态定义：fully implemented / partially implemented / not implemented / implemented but unused

### 5.1 platform/config

- `workspaces`: **fully implemented**
  - CSV 结构：完整。
  - 代码证据：`/api/shell/config` 读取。
  - 前端使用：shell 初始化读取并驱动页面框架。

- `roles`: **fully implemented**
  - CSV 结构：完整。
  - 代码证据：`/api/shell/config` 读取。
  - 前端使用：角色切换与页面权限显示。

- `users`: **fully implemented (with legacy fallback)**
  - CSV 结构：`users.csv` 存在并返回。
  - 代码证据：`/api/shell/config` 优先读 `users.csv`，fallback `users_roles.csv`。
  - 备注：保留 legacy 回退，不影响目标表存在与使用。

- `nav_items`: **fully implemented**
  - CSV 结构：完整。
  - 代码证据：`/api/shell/config` 读取。
  - 前端使用：左侧导航构建。

- `workspace_role_visibility`: **fully implemented**
  - CSV 结构：完整。
  - 代码证据：`/api/shell/config` 读取。
  - 前端使用：工作区-角色可见性过滤。

- `nav_role_visibility`: **fully implemented**
  - CSV 结构：完整。
  - 代码证据：`/api/shell/config` 读取。
  - 前端使用：导航项可见性过滤。

### 5.2 reference data

- `se3_snapshots`: **fully implemented**
  - CSV 结构：完整。
  - 代码证据：`/api/ops/se3-snapshots` 查询读取。
  - 前端使用：合同登记 Step2 匹配。

- `pms_projects`: **fully implemented**
  - CSV 结构：完整。
  - 代码证据：`/api/ops/pms-projects` 查询读取。
  - 前端使用：合同登记 Step2 匹配。

### 5.3 contract domain

- `contract_cases`: **fully implemented**
  - CSV 结构：已为 snapshot 型字段集合。
  - 代码证据：
    - 读：tracking/detail/home-summary/counts
    - 写：intake append，cm-action update
  - 前端使用：列表、详情、AM/CM首页状态。

- `contract_structured_fields`: **fully implemented**
  - CSV 结构：结构化字段独立。
  - 代码证据：
    - 读：`build_contract_view` 聚合
    - 写：`upsert_structured`（intake）
  - 前端使用：通过聚合后的详情/列表字段显示。

- `contract_documents`: **fully implemented**
  - CSV 结构：文档元数据独立。
  - 代码证据：
    - 读：`build_contract_view`，`/archive/versions`
    - 写：intake 创建 draft；cm-action 写水印/单签/双签
  - 前端使用：详情页版本与下载入口。

- `contract_payment_nodes`: **implemented but unused (runtime weak use)**
  - CSV 结构：已独立。
  - 代码证据：
    - 写：intake `replace_child_rows`
    - 读：未在合同查询 API 中暴露，也未被 frontend 页面直接读取。
  - 结论：表存在且有数据，但当前运行链路未真正消费。

- `contract_quote_links`: **fully implemented**
  - CSV 结构：已独立。
  - 代码证据：
    - 读：`build_contract_view` 聚合为 `se3_summary`
    - 写：intake `replace_child_rows`
  - 前端使用：列表/详情摘要。

- `contract_project_links`: **fully implemented**
  - CSV 结构：已独立。
  - 代码证据：
    - 读：`build_contract_view` 聚合为 `pms_summary`
    - 写：intake `replace_child_rows`
  - 前端使用：列表/详情摘要。

- `contract_allocations`: **fully implemented**
  - CSV 结构：已独立。
  - 代码证据：
    - 读：`build_contract_view` 聚合 `allocation_summary`
    - 写：intake `replace_child_rows`
  - 前端使用：详情页金额分配摘要。

- `contract_workflow_events`: **implemented but unused (read path weak)**
  - CSV 结构：已独立。
  - 代码证据：
    - 写：`append_workflow_event`（intake/cm-action）
    - 读：当前 contract GET endpoint 未消费此表生成页面输出。
  - 结论：日志记录已实施，但展示/查询闭环不完整。

- `contract_archive_reviews`: **fully implemented**
  - CSV 结构：已独立。
  - 代码证据：
    - 读：`build_contract_view` 生成 `comparison_status/comparison_diff`
    - 写：intake init，cm-action 上传双签/归档关闭更新
  - 前端使用：详情页比对状态与差异说明。

- `contract_exception_records`: **partially implemented**
  - CSV 结构：存在且字段合理，但 seed 无记录。
  - 代码证据：
    - 读：`build_contract_view` 读取异常备注
    - 写：仅 `cm_close_exception` 触发写入
  - 前端使用：详情页异常说明展示依赖聚合字段；当前 demo 数据不足以证明运行闭环。

## 6. contract_cases slimming check

是否仍错误承载以下内容：

- extracted-field payload（结构化提取字段）：**removed**
- document-version fields（文档版本路径）：**removed**
- allocation detail（分配明细行）：**removed**
- compare detail（比对细节）：**removed**
- exception detail（异常详情）：**removed**

审计结论：`contract_cases` 基本完成“当前状态快照表”瘦身目标，未见旧版过载字段残留在该表头中。

## 7. Frontend/backend runtime consistency

- backend read/write path
  - 合同读接口已通过 `build_contract_view` 从多表聚合，返回旧前端字段名（`formal_contract_id`, `se3_summary`, `payment_terms`, `comparison_diff`, `exception_reason` 等）。
  - 合同写接口（intake/cm-action）已写新表，同时保留部分兼容镜像写（`contract_status_events`）。

- API assembly path
  - 聚合层真实存在且是运行主路径，不是静态文件名替换。
  - 但也存在兼容 shim：
    - `/api/ops/contracts/archive/versions` 在新表无结果时 fallback 到 `contract_archive_versions`。

- frontend consumption path
  - 前端页面仍消费“旧字段名语义”的 payload（列表/详情/home count），并未直接读取新子表。
  - 当前是“后端归一 + 前端字段不改”策略。

- stale legacy dependency
  - legacy `contract_status_events` 与 `contract_archive_versions` 仍存在且仍在兼容路径被读写。
  - 这不等于失败，但说明迁移仍有过渡层。

## 8. Gaps and structural inconsistencies

1. `contract_payment_nodes`：已建表并写入，但当前 contract 查询 API 未输出节点明细，前端也未直接消费（功能上“名义拆分 > 运行使用”）。
2. `contract_workflow_events`：有写入，但页面/接口无消费链路，事件表对用户侧价值未闭环。
3. `contract_exception_records`：结构存在，但当前 seed 为空；只有异常关闭动作触发写入，默认演示路径难验证。
4. legacy 兼容表仍被使用：`contract_status_events`（写镜像）、`contract_archive_versions`（fallback 读取），说明 split 并非完全切断旧路径。
5. workflow seed 数据与主合同ID不一致（`CC-001` vs `DMY-*`），影响事件链路可信度。

## 9. Verdict

- 是否“真正执行了 agreed structure”：**大体是（接近目标），但仍存在过渡兼容与弱使用表**。
- 已完成度高的表：
  - platform/config + reference data 全部到位且运行中使用；
  - contract_cases / structured_fields / documents / quote_links / project_links / allocations / archive_reviews 基本落地。
- 仅名义创建或运行弱化的表：
  - `contract_payment_nodes`（实现但未被运行读链路使用）；
  - `contract_workflow_events`（写入有，读展示无）；
  - `contract_exception_records`（部分实现，样本为空）。
- 仍需下一轮的区域：
  - 事件/节点/异常表的运行时消费闭环；
  - 清理或正式淘汰 legacy 兼容路径（在确认无调用后）。

## 10. Recommended next action

1. 为 `contract_payment_nodes` 增加 detail API 输出并让详情页消费（或明确暂不使用）。
2. 将 `contract_workflow_events` 接入至少一个只读事件时间线接口，验证拆分价值。
3. 增加一条 `contract_exception_records` seed 或脚本化场景，确保异常路径可演示。
4. 为 legacy 兼容路径加“迁移完成前提”与退场条件（`contract_status_events` / `contract_archive_versions`）。
5. 修正 workflow seed 的 `contract_case_id` 对齐问题，避免审计误判。
