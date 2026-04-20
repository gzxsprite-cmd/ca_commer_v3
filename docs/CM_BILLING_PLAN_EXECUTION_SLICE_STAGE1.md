# CM开票计划与实际执行（Stage-1 落地说明）

## 范围
本说明仅覆盖“CM开票计划与实际执行”切片，不涉及全平台整合。

## 页面与路由
- 计划与复盘管理：`/plan/billing`（CM维护开票计划，支持CSV文本模拟Excel导入）
- 合同与开票执行：
  - `/ops/cm/home`（新增本月开票提醒模块）
  - `/ops/billing/calendar`（CM开票日历）
  - `/ops/billing/tasks`（开票事项列表）
  - `/ops/billing/execution`（新建开票事项）
  - `/ops/billing/tasks/detail`（开票事项详情与流转）

## 数据对象（CSV）
- 参考锚点：
  - `customer_projects.csv`
  - `contracts.csv`
- 计划与实际：
  - `contract_monthly_plans.csv`
  - `contract_monthly_actuals.csv`
- 执行对象：
  - `billing_tasks.csv`
  - `billing_events.csv`（关闭时追加执行事件）

## 关键规则
1. 计划粒度：`customer_project + contract + year + month`
2. 实际粒度：`customer_project + contract + year + month`
3. 事项来源：`plan_generated / am_triggered / pjm_triggered / cm_manual`
4. plan_generated事项固定项目+合同；非plan_generated可由CM创建并锁定。
5. Step4（开票声明和预约）要求填报 Workon号 + 总开票金额，支持多发票号+金额粘贴。
6. 关闭时回写 `contract_monthly_actuals`；部分关闭写 `partial_reason` 并保留专门状态。

## API（本切片新增）
- GET `/api/cm/billing/plan-grid`
- POST `/api/cm/billing/plan-upload`
- GET `/api/ops/cm/billing/summary`
- GET `/api/ops/cm/billing/calendar`
- GET `/api/ops/cm/billing/tasks`
- POST `/api/ops/cm/billing/tasks`
- GET `/api/ops/cm/billing/tasks/detail`
- POST `/api/ops/cm/billing/tasks/progress`
- POST `/api/ops/cm/billing/tasks/close`

## 非范围
- 不处理SCP全流程复盘细化
- 不处理应收模型深度整合
- 不处理合同域全量统一建模
