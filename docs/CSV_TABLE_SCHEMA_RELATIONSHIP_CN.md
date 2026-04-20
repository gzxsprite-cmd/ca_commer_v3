# CA_Commer_v3 CSV 表结构、字段与关联关系梳理（中文）

> 文档目标：面向当前 Stage-1 代码实现，对 `backend/data/*.csv` 的**表含义**、**字段含义**、**关联关系含义**做统一中文说明。  
> 范围说明：仅描述仓库当前已落地结构，不代表最终生产库设计。

---

## 1. 全局说明

### 1.1 命名与类型约定（当前实现）
- 当前为 CSV 存储，字段类型未做数据库级强校验，主要依赖前后端约定。
- `*_id` 通常表示主键或业务唯一键。
- `*_status` 通常表示流程状态。
- `*_code` 通常表示配置枚举键（如角色、工作区）。
- 金额字段（如 `amount`, `planned_amount`）在 CSV 中以文本形式存储，读取后按业务场景做数值解释。

### 1.2 当前“主业务表”与“配置表”
- 主业务表：`contract_cases.csv`（合同执行主快照）
- 配置表：`workspaces.csv`、`roles.csv`、`nav_items.csv`、可见性矩阵相关表
- 事件/日志表：`contract_status_events.csv`、`billing_events.csv`、`adjustment_records.csv`

---

## 2. 按表说明（含字段含义）

## 2.1 平台配置与权限可见性

### 2.1.1 `workspaces.csv`（工作区定义）
**表含义**：定义系统一级工作区（如 Operations、Planning）。

| 字段 | 含义 |
|---|---|
| `workspace_code` | 工作区编码（主键），供其他表引用。 |
| `workspace_label` | 工作区中文/展示名称。 |
| `display_order` | 工作区展示排序值（越小越靠前）。 |
| `is_enabled` | 是否启用（1/0）。 |

**关联关系含义**：
- 被 `workspace_role_visibility.workspace_code` 引用，用于限制“某工作区可见哪些角色”。
- 被 `nav_items.workspace_code` 引用，用于归属左侧导航到具体工作区。
- 被 `users_roles.default_workspace` 间接引用，用于用户默认落位。

---

### 2.1.2 `roles.csv`（角色定义）
**表含义**：定义系统角色主数据（AM/CM/CA/SCP 等）。

| 字段 | 含义 |
|---|---|
| `role_code` | 角色编码（主键）。 |
| `role_label` | 角色展示名称。 |
| `display_order` | 角色展示排序值。 |
| `is_enabled` | 角色是否启用（1/0）。 |

**关联关系含义**：
- 被 `workspace_role_visibility.role_code` 引用，控制角色在工作区中的可用性。
- 被 `nav_role_visibility.role_code` 引用，控制角色可见导航项。
- 被 `users_roles.role_code` 引用，定义用户身份。

---

### 2.1.3 `workspace_role_visibility.csv`（工作区-角色可见矩阵）
**表含义**：定义“某角色在某工作区是否可进入”。

| 字段 | 含义 |
|---|---|
| `workspace_code` | 工作区编码（联合主键一部分）。 |
| `role_code` | 角色编码（联合主键一部分）。 |
| `is_visible` | 是否可见（1/0）。 |

**关联关系含义**：
- 该表是 `workspaces` 与 `roles` 的多对多桥接表。
- 前端壳层读取后，用于控制顶部工作区与角色切换后的可访问范围。

---

### 2.1.4 `nav_items.csv`（导航项定义）
**表含义**：定义所有左侧导航条目及其路由。

| 字段 | 含义 |
|---|---|
| `nav_key` | 导航项唯一键（主键）。 |
| `nav_label` | 导航显示文案。 |
| `workspace_code` | 所属工作区编码。 |
| `route` | 前端路由路径。 |
| `display_order` | 导航显示顺序。 |
| `is_enabled` | 导航项是否启用（1/0）。 |

**关联关系含义**：
- 与 `workspaces` 是多对一关系（一个工作区下多个导航项）。
- 与 `nav_role_visibility` 形成多对多可见性控制。

---

### 2.1.5 `nav_role_visibility.csv`（导航-角色可见矩阵）
**表含义**：定义“某角色能否看到某导航项”。

| 字段 | 含义 |
|---|---|
| `nav_key` | 导航项键（联合主键一部分）。 |
| `role_code` | 角色编码（联合主键一部分）。 |
| `is_visible` | 是否可见（1/0）。 |

**关联关系含义**：
- 是 `nav_items` 与 `roles` 的多对多桥接表。
- 与 `workspace_role_visibility` 共同形成“先看工作区可进入，再看导航可见”的两层权限表达。

---

### 2.1.6 `users_roles.csv`（用户与默认角色/工作区）
**表含义**：当前演示用户信息与默认角色归属。

| 字段 | 含义 |
|---|---|
| `user_id` | 用户唯一标识（主键）。 |
| `display_name` | 用户展示名。 |
| `role_code` | 用户当前角色编码。 |
| `default_workspace` | 用户默认工作区编码。 |

**关联关系含义**：
- `role_code` 对应 `roles.role_code`。
- `default_workspace` 对应 `workspaces.workspace_code`。
- 当前主要用于壳层身份显示和初始化上下文，不是完整账号体系。

---

## 2.2 合同执行主流程

### 2.2.1 `contract_cases.csv`（合同执行主表/主快照）
**表含义**：系统最核心业务表。一行代表一个合同处理案例，承载从登记、匹配、分配、CM 执行、归档到异常说明的“当前状态快照”。

| 字段 | 含义 |
|---|---|
| `contract_case_id` | 合同案例唯一ID（主键）。 |
| `contract_code` | 内部合同编号（业务展示码）。 |
| `formal_contract_id` | 正式合同号（可能为空，待流程推进后补齐）。 |
| `contract_type` | 合同类型。 |
| `customer_contract_no` | 客户侧合同编号。 |
| `customer_name` | 客户名称。 |
| `project_name` | 项目名称。 |
| `product_name` | 产品名称。 |
| `contract_name` | 合同名称。 |
| `total_amount` | 合同总金额。 |
| `payment_terms` | 付款条件/账期说明。 |
| `uploaded_file_name` | 上传文件名。 |
| `se3_summary` | SE3 匹配摘要信息（展示用）。 |
| `pms_summary` | PMS 匹配摘要信息（展示用）。 |
| `extract_summary` | OCR/提取结果摘要。 |
| `allocation_summary` | 金额分配摘要（里程碑/节点分配结果）。 |
| `am_owner_id` | AM 负责人ID。 |
| `cm_owner_id` | CM 负责人ID。 |
| `execution_status` | 当前执行状态（主流程状态）。 |
| `archive_status` | 归档状态。 |
| `current_owner_role` | 当前责任角色（AM/CM/CA等）。 |
| `next_step_label` | 下一步操作文案（给 UI 显示）。 |
| `flow_chain` | 流程链路摘要（展示）。 |
| `current_step` | 当前步骤编码/名称。 |
| `next_step` | 下一步骤编码/名称。 |
| `created_at` | 记录创建时间。 |
| `updated_at` | 最近更新时间。 |
| `watermarked_pdf_path` | 带水印 PDF 路径（CM阶段产物）。 |
| `ca_single_sign_backup` | CA 单签备份文件路径。 |
| `dual_signed_archive_file` | 双签归档文件路径。 |
| `comparison_status` | 比对状态（如一致/不一致）。 |
| `comparison_diff` | 比对差异摘要。 |
| `exception_reason` | 异常关闭/归档异常原因。 |

**关联关系含义**：
- 是多张业务表的“父表”（按 `contract_case_id` 关联）。
- 前端合同跟进列表/详情、AM/CM 首页统计均围绕该表读取。
- CM 操作会直接更新该表中的状态与执行产物字段。

---

### 2.2.2 `contract_status_events.csv`（合同状态事件流水）
**表含义**：记录合同流程中的关键事件，偏审计/追踪用途。

| 字段 | 含义 |
|---|---|
| `event_id` | 事件唯一ID（主键）。 |
| `contract_case_id` | 对应合同案例ID。 |
| `event_type` | 事件类型（如 intake、cm_action）。 |
| `event_status` | 事件后状态/事件状态。 |
| `event_time` | 事件时间。 |
| `actor_role` | 触发角色。 |

**关联关系含义**：
- 多对一关联 `contract_cases.contract_case_id`。
- 与 `contract_cases` 的关系可理解为：`contract_cases` 存当前快照，`contract_status_events` 存历史轨迹。

---

### 2.2.3 `contract_archive_versions.csv`（合同归档版本）
**表含义**：记录同一合同在归档维度下的不同版本文件。

| 字段 | 含义 |
|---|---|
| `version_id` | 版本记录唯一ID（主键）。 |
| `contract_case_id` | 所属合同案例ID。 |
| `version_type` | 版本类型（如草稿/单签/双签）。 |
| `version_label` | 版本展示名称。 |
| `file_url` | 文件访问路径/URL。 |

**关联关系含义**：
- 多对一关联 `contract_cases`。
- 一个合同案例可有多个归档版本，前端可按版本切换预览/下载。

---

## 2.3 开票与应收

### 2.3.1 `billing_events.csv`（开票执行记录）
**表含义**：记录“实际发生的开票动作”。

| 字段 | 含义 |
|---|---|
| `billing_event_id` | 开票事件ID（主键）。 |
| `billing_date` | 开票日期。 |
| `amount` | 开票金额。 |
| `allocation_status` | 分摊状态/分配状态。 |
| `linked_contract_case_ids` | 关联合同ID列表（字符串形式，非规范化）。 |

**关联关系含义**：
- 与 `contract_cases` 为“文本列表弱关联”，不是严格一对多外键。
- 含义上表示“一次开票可能关联多个合同案例”。

---

### 2.3.2 `billing_plans.csv`（开票计划）
**表含义**：记录计划层面的开票安排（尚未执行）。

| 字段 | 含义 |
|---|---|
| `billing_plan_id` | 开票计划ID（主键）。 |
| `period_key` | 计划期间（如月份/季度标识）。 |
| `contract_case_id` | 对应合同案例ID。 |
| `planned_amount` | 计划开票金额。 |
| `plan_status` | 计划状态。 |

**关联关系含义**：
- 多对一关联 `contract_cases`（逻辑关系，当前无强校验）。
- 用于“计划 vs 实际”对照中的计划侧数据源。

---

### 2.3.3 `contract_balances.csv`（合同应收余额）
**表含义**：记录合同粒度的金额平衡结果。

| 字段 | 含义 |
|---|---|
| `contract_case_id` | 合同案例ID（主键，同时也是关联键）。 |
| `contract_amount` | 合同总额。 |
| `billed_amount_total` | 已开票累计金额。 |
| `receivable_outstanding` | 未回款/应收余额。 |

**关联关系含义**：
- 与 `contract_cases` 一对一（或零/一）关系。
- 用于应收页面直接展示合同级财务概况。

---

### 2.3.4 `receivable_summaries.csv`（应收汇总）
**表含义**：按某个统计口径聚合后的应收摘要。

| 字段 | 含义 |
|---|---|
| `summary_id` | 汇总记录ID（主键）。 |
| `owner_scope_type` | 口径类型（如按角色/按组织）。 |
| `owner_scope_id` | 口径对象ID。 |
| `outstanding_amount` | 汇总未收金额。 |
| `receivable_status` | 应收状态标签。 |

**关联关系含义**：
- 与主流程表无强关联键，属于“聚合视图型数据”。
- 当前代码中使用较少，更多是为后续仪表盘/统计预留。

---

## 2.4 规划与评审

### 2.4.1 `planning_records.csv`（规划记录）
**表含义**：承载多类规划数据（合同规划、开票规划、目标分配、成本覆盖等）的统一结构表。

| 字段 | 含义 |
|---|---|
| `planning_record_id` | 规划记录ID（主键）。 |
| `planning_type` | 规划类型（决定用于哪个页面）。 |
| `scope_key` | 规划作用范围键（对象ID或组合键）。 |
| `period_key` | 规划期间标识。 |
| `planned_value` | 规划值。 |
| `planning_status` | 规划状态。 |

**关联关系含义**：
- 通过 `planning_type` 实现“一表多页面”复用。
- `scope_key` 为业务语义键，可对接合同/团队/区域等不同粒度对象。

---

### 2.4.2 `adjustment_records.csv`（规划调整申请记录）
**表含义**：记录规划变更申请及其处理状态。

| 字段 | 含义 |
|---|---|
| `adjustment_id` | 调整记录ID（主键）。 |
| `scope_key` | 调整作用范围键。 |
| `adjustment_reason` | 调整原因说明。 |
| `delta_value` | 调整差值（增减量）。 |
| `adjustment_status` | 调整状态（待审/通过/驳回等）。 |
| `proposed_by_role` | 发起角色。 |

**关联关系含义**：
- 与 `planning_records` 通过 `scope_key` 存在业务语义关联（非强外键）。
- 体现“先有规划，再有调整”的流程闭环。

---

### 2.4.3 `dashboard_summary_cards.csv`（仪表盘卡片指标）
**表含义**：用于首页/评审看板的卡片化指标数据。

| 字段 | 含义 |
|---|---|
| `card_id` | 卡片记录ID（主键）。 |
| `workspace_code` | 所属工作区。 |
| `role_code` | 所属角色。 |
| `card_key` | 卡片键（指标编码）。 |
| `metric_value` | 指标值。 |
| `metric_label` | 指标标题/名称。 |
| `trend_hint` | 趋势提示（如 ↑ / ↓ / 文本）。 |

**关联关系含义**：
- 与 `workspaces`、`roles` 构成维度过滤关系。
- 主要用于“同页面不同角色看到不同指标内容”。

---

## 2.5 辅助匹配数据

### 2.5.1 `se3_snapshots.csv`（SE3 快照候选）
**表含义**：合同登记流程中用于匹配/候选展示的 SE3 数据快照。

| 字段 | 含义 |
|---|---|
| `snapshot_id` | 快照ID（主键）。 |
| `pid` | 产品/报价相关标识。 |
| `configuration_name` | 配置名称。 |
| `otp_amount` | OTP 金额。 |
| `otc_amount` | OTC 金额。 |
| `payment_year` | 付款年度。 |
| `sys_ebit_amount` | 系统 EBIT 金额。 |
| `sys_ebit_percent` | 系统 EBIT 比例。 |
| `customer_name` | 客户名称。 |
| `product_name` | 产品名称。 |

**关联关系含义**：
- 主要通过客户名/产品名等条件与登记中的合同信息进行“匹配检索”，不是严格主外键关系。

---

### 2.5.2 `pms_projects.csv`（PMS 项目候选）
**表含义**：合同登记流程中用于 PMS 匹配的项目候选池。

| 字段 | 含义 |
|---|---|
| `project_id` | 项目ID（主键）。 |
| `project_name` | 项目名称。 |
| `system_project_type` | 系统项目类型。 |
| `project_status` | 项目状态。 |
| `related_pid` | 关联 PID。 |
| `related_mcrl0` | 关联 MCRL0。 |
| `pjm_owner` | PJM 负责人。 |
| `remark_from_pjm` | PJM 备注。 |
| `customer_name` | 客户名称。 |
| `product_name` | 产品名称。 |

**关联关系含义**：
- 与 `se3_snapshots` 类似，主要是“检索匹配关系”，不直接绑定外键。

---

## 3. 关联关系总览（业务语义）

## 3.1 强语义主线（合同执行）
1. AM 发起登记后，写入 `contract_cases`（当前快照）并追加 `contract_status_events`（历史事件）。
2. CM 在跟进环节执行操作，更新 `contract_cases` 的状态/附件字段，同时继续追加事件到 `contract_status_events`。
3. 若进入归档，`contract_archive_versions` 按同一 `contract_case_id` 维护多版本文件。

**含义**：
- `contract_cases` 负责“现在是什么状态”；
- `contract_status_events` 负责“经历过哪些动作”；
- `contract_archive_versions` 负责“归档文件有哪些版本”。

## 3.2 计划与开票联动语义
- `billing_plans` 表示“计划要开多少”；
- `billing_events` 表示“实际开了多少”；
- `contract_balances` 表示“合同层面的余额结果”；
- `receivable_summaries` 表示“按口径汇总后的应收视图（当前弱使用）”。

**含义**：
这是“计划 -> 执行 -> 余额/汇总”的财务视角链路，但当前仍是松耦合 CSV 方案。

## 3.3 权限可见性语义
- `workspace_role_visibility`：控制“角色能进哪些工作区”；
- `nav_role_visibility` + `nav_items`：控制“角色在工作区内能看到哪些菜单”。

**含义**：
形成两层过滤：**先工作区、后导航项**，用于前端壳层的动态可见性。

---

## 4. 当前模型的边界与注意事项

1. **CSV 非关系型数据库**：无数据库级外键约束，需靠代码和文档约束。  
2. **部分关系为弱关联**：如 `billing_events.linked_contract_case_ids` 为字符串列表。  
3. **同一字段可能兼顾“展示 + 业务”**：例如 `next_step_label` 与 `flow_chain` 偏展示语义。  
4. **后续若迁移数据库**：建议先固化 `contract_cases` 主键与子表关联，再逐步把弱关联转为结构化关联。  

---

## 5. 一句话总结

当前 Stage-1 的 CSV 数据模型可以理解为：以 `contract_cases` 为中心的主流程快照模型，叠加事件日志、归档版本、计划/开票/应收侧表，以及工作区-角色-导航的可见性配置体系；其优势是快速可演示，代价是关系约束主要依赖代码与文档约定。
