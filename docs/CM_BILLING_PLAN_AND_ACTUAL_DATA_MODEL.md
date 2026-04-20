# CM开票计划与实际执行数据模型（范围冻结版）

## 1. 文档目的与范围

本文件用于**冻结 CM 开票计划与实际执行**这一局部业务域的数据模型，目标是先把该范围内的业务口径、实体边界、主外键关系和唯一性规则说清楚，减少后续实现与沟通歧义。

**本次范围仅包含：**
- CM月度开票计划（Plan）
- CM月度开票实际（Actual）
- 年内累计（YTD）支持
- CF版本规划支持

**本次明确不做：**
- 与合同流转全域模型的整合
- 与SCP复盘/评审模块的一体化
- 应收模型与回款模型的展开
- 平台级统一主数据ID体系

> 结论：这是一个“先局部稳定，再考虑跨域整合”的建模冻结文档。

---

## 2. 建模原则

1. **尊重业务事实与业务字段名称**
   - 不随意重命名业务字段。
   - 不引入与当前业务口径无关的新概念。
   - 仅在技术实现层引入必要 PK/FK 字段表达。

2. **以业务颗粒度为核心，不做抽象先行**
   - 以 `Customer_Project` 作为业务锚点。
   - `Contract` 在本范围内挂接到 `Customer_Project`，而不是脱离业务上下文独立漂移。

3. **按事实语义拆表，不用单一宽表兜底**
   - 月度计划、月度实际、年度累计、CF方案分别建表。
   - 保留业务含义清晰度，避免一张表混合“计划值 + 实际值 + 累计值 + 场景值”。

4. **范围优先于全局最优**
   - 当前先保证 CM 开票计划与实际执行闭环。
   - 跨模块统一（合同域/SCP域/平台域）明确后置。

---

## 3. 业务主链与 ER 关系

按当前业务事实，采用以下关系主链：

```text
Customer
  ↓ 1:N
Customer_Project
  ↓ N:1
RB_Product

Customer_Project
  ↓ N:1
IGPM_Link

Customer_Project
  ↓ 1:N
Contract
  ↓ 1:N
Contract_Monthly_Plan

Contract
  ↓ 1:N
Contract_Monthly_Actual

Contract
  ↓ 1:N
Contract_YTD_Summary

Contract
  ↓ 1:N
Contract_CF_Plan
```

**关键说明：**
- `Customer_Project` 是本范围最贴近真实业务管理颗粒度的锚点（客户-项目组合），不是泛化 `Project`。
- `Contract` 在本范围内必须挂接 `Customer_Project`，因为开票计划/实际/YTD/CF 的业务追踪都回到该颗粒度。

---

## 4. 数据实体说明

### 4.1 Customer
表示客户主数据及销售组织归属信息，用于确定客户维度口径。

### 4.2 IGPM_Link
表示 `PID` 与 `MCR_ID` 的业务映射关系，满足 `PID : MCR_ID = 1:N` 的事实。

### 4.3 RB_Product
表示 RB 产品维度信息（产品分类、BU、PAO、利润中心等），作为项目关联产品的参考维表。

### 4.4 Customer_Project
表示客户与项目的业务组合体，是本范围核心业务锚点；承载项目类型、VMS属性、SOP时间、产品和IGPM关联。

### 4.5 Contract
表示合同主信息（合同编号、名称、签署时间、OTP总量、YoY付款比例）；在本范围内挂接 `Customer_Project`。

### 4.6 Contract_Monthly_Plan
表示合同在某年某月某版本下的开票计划事实（含 must billing 口径）。

### 4.7 Contract_Monthly_Actual
表示合同在某年某月某版本下的开票实际事实（含 must billing 口径）。

### 4.8 Contract_YTD_Summary
表示合同在某年某版本口径下的年度累计对比与差异解释（plan/actual/YTD差异、原因、备注）。

### 4.9 Contract_CF_Plan
表示合同在 CF 场景版本（CF02/05/09）下的规划值（B_up / Must_billing）。

---

## 5. 字段清单（按表）

## 5.1 Customer
- `customer_id`
- `group`（coem/jv）
- `ile`
- `new_sales_area`（ccn1/2/3/4）
- `GCT`（ccn1/2/3/4）

## 5.2 IGPM_Link
- `PID`
- `PID_IGPM_name`（文档中将 “PID IGPM name” 以下划线表达）
- `MCR_ID`

> 业务事实：`PID : MCR_ID = 1:N`

## 5.3 RB_Product
- `Product_id`
- `Product_class`
- `Product_subclass`
- `BU`
- `PAO`
- `PAO_Update`（对应“PAO-Update”）
- `Profit_center`

## 5.4 Customer_Project
- `customer_project_id`
- `model_project`（对应“model/project”）
- `Product_id`（FK -> `RB_Product.Product_id`）
- `if_include_VMS_function`（Y/N，默认 Y）
- `Project_Category`
- `PID`
- `MCR_ID`
- `actual_SOP_time`（YYYY.MM）

## 5.5 Contract
- `contract_id`
- `bosch_contract_no`
- `contract_name`
- `contract_signed_yyyymm`
- `otp_payment_yoy_ratio`（如 `30%-30%-40%`）
- `contract_lifetime_total_otp`
- `customer_project_id`（FK -> `Customer_Project.customer_project_id`）

## 5.6 Contract_Monthly_Plan
- `customer_project_id`（FK）
- `contract_id`（FK）
- `year`
- `month`
- `plan_amount`
- `plan_must_billing_amount`
- `version`（year-month based on CF0X）

## 5.7 Contract_Monthly_Actual
- `customer_project_id`（FK）
- `contract_id`（FK）
- `year`
- `month`
- `actual_amount`
- `actual_must_billing_amount`
- `version`（year-month based on CF0X）

## 5.8 Contract_YTD_Summary
- `customer_project_id`（FK）
- `contract_id`（FK）
- `year`
- `plan_YTD_amount`
- `plan_YTD_must_billing_amount`
- `actual_YTD_amount`
- `actual_YTD_must_billing_amount`
- `YTD_amount`
- `YTD_must_billing_amount`
- `must_billing_reason`
- `must_billing_comments`
- `SCP_comments`
- `version`（year-month based on CF0X）
- `CF_version`（CF02/05/09）

## 5.9 Contract_CF_Plan
- `customer_project_id`（FK）
- `contract_id`（FK）
- `CF_version`（CF02/05/09）
- `CF_B_up`
- `CF_Must_billing`

---

## 6. 主外键关系

> 以下为本范围建议的 PK/FK 假设，用于统一实现口径。

- `Customer`
  - PK: `customer_id`

- `RB_Product`
  - PK: `Product_id`

- `IGPM_Link`
  - 建议 PK: (`PID`, `MCR_ID`)
  - 说明：满足一个 PID 下可存在多个 MCR_ID。

- `Customer_Project`
  - PK: `customer_project_id`
  - FK1: `Product_id` -> `RB_Product.Product_id`
  - FK2: (`PID`, `MCR_ID`) -> `IGPM_Link.(PID, MCR_ID)`
  - FK3（可选实现层）: `customer_id` -> `Customer.customer_id`（若物理表保留 customer_id 字段）

- `Contract`
  - PK: `contract_id`
  - FK: `customer_project_id` -> `Customer_Project.customer_project_id`

- `Contract_Monthly_Plan`
  - 建议技术 PK: `plan_row_id`（代理键）
  - FK1: `contract_id` -> `Contract.contract_id`
  - FK2: `customer_project_id` -> `Customer_Project.customer_project_id`

- `Contract_Monthly_Actual`
  - 建议技术 PK: `actual_row_id`（代理键）
  - FK1: `contract_id` -> `Contract.contract_id`
  - FK2: `customer_project_id` -> `Customer_Project.customer_project_id`

- `Contract_YTD_Summary`
  - 建议技术 PK: `ytd_row_id`（代理键）
  - FK1: `contract_id` -> `Contract.contract_id`
  - FK2: `customer_project_id` -> `Customer_Project.customer_project_id`

- `Contract_CF_Plan`
  - 建议技术 PK: `cf_row_id`（代理键）
  - FK1: `contract_id` -> `Contract.contract_id`
  - FK2: `customer_project_id` -> `Customer_Project.customer_project_id`

---

## 7. 唯一性约束建议

为避免同一口径重复写入，建议最小唯一性规则如下：

- `Contract_Monthly_Plan`
  - UNIQUE(`contract_id`, `year`, `month`, `version`)

- `Contract_Monthly_Actual`
  - UNIQUE(`contract_id`, `year`, `month`, `version`)

- `Contract_CF_Plan`
  - UNIQUE(`contract_id`, `CF_version`)

- `Contract_YTD_Summary`
  - UNIQUE(`contract_id`, `year`, `version`, `CF_version`)

- `Contract`
  - UNIQUE(`bosch_contract_no`)（如业务允许一对一映射）

- `Customer_Project`
  - UNIQUE(`customer_project_id`)

---

## 8. 事实表 / 汇总表划分

### 8.1 主数据 / 参考数据（Master/Reference）
- `Customer`
- `RB_Product`
- `IGPM_Link`

### 8.2 业务锚点表（Business Anchor）
- `Customer_Project`
- `Contract`

### 8.3 月度事实表（Monthly Fact）
- `Contract_Monthly_Plan`
- `Contract_Monthly_Actual`

### 8.4 汇总表（Summary）
- `Contract_YTD_Summary`

### 8.5 场景/版本规划表（Scenario & Version Planning）
- `Contract_CF_Plan`

---

## 9. 为什么不直接用一张宽表

虽然业务原始模板可能表现为“单张月度规划大表”，但在存储模型上不建议直接做一张宽表，原因如下：

1. **业务语义冲突**
   - Plan / Actual / YTD / CF 本质是不同口径，不应混在同一行语义里。

2. **版本管理冲突**
   - 月度版本（`version`）与CF版本（`CF_version`）同时存在，宽表容易出现重复覆盖和冲突更新。

3. **维护复杂度高**
   - 一张宽表会导致字段持续膨胀，后续新增业务口径时变更风险高。

4. **质量控制困难**
   - 唯一性、口径校验、审计追踪在宽表中更难定义与执行。

结论：在本范围内分拆为 Plan / Actual / YTD / CF 四类事实/汇总表，更符合业务含义，也更稳定可维护。

---

## 10. 当前边界与暂不处理事项

本文件明确**不解决**以下事项：

1. 完整开票事件（billing event）执行层标准化设计
2. 应收/回款模型（receivable model）
3. 与合同流转（contract-domain）全域打通
4. 与SCP复盘评审全链路整合
5. 跨模块 canonical ID 统一与平台级主数据治理

> 以上内容将在后续跨模块建模阶段处理，本阶段不提前合并，避免范围污染。
