# UI_REFACTOR_GUIDELINES_STAGE1

## Why
本指南用于约束 Stage-1 全平台 UI 方向修正，避免“只改单页”或“页面风格漂移”。

## Platform-wide Correction Scope
必须统一 적용到：
- 共享壳层（顶栏/侧栏/主区）
- 执行空间与计划复盘空间
- 角色首页、列表页、流程页、评审页、详情页

## Required Outcomes
1. 用户一眼知道当前工作空间。
2. 用户一眼知道当前角色身份。
3. 用户一眼知道下一步要做什么。
4. 文案以中文业务语义为主。

## Implementation Rules
- 优先改“结构与语义”，再改“视觉细节”。
- 先落地代表性页面类型，再扩展到其余页面。
- 保持轻量，不做深流程逻辑扩展。

## Stage-1 Representative Pages
- 角色首页：`/ops/am/home`, `/ops/cm/home`, `/plan/scp/home`
- 列表追踪：`/ops/contracts/tracking`, `/ops/receivables/balances`
- 流程表单：`/ops/contracts/intake`, `/plan/adjustments`
- 评审决策：`/ops/contracts/review-queue`, `/plan/review-dashboard`
- 详情侧栏：`/ops/contracts/archive`

## Keep Unchanged for Now
- 后端数据结构与接口路径
- 深层业务规则与审批引擎
- 生产化部署与权限体系
