# CHANGELOG

## 2026-04-14 — Stage-0 Baseline Initialization
- Added initial vibe coding foundation documentation pack for CA_Commer / CA商务协作平台.
- Established Stage-0 setup, platform skeleton baseline, workspace boundaries, role/nav baseline, UI style system, page grammar, coding constitution, documentation update rules, and evaluation principles.
- Confirmed this repository is currently a Pages-demo-first foundation and intentionally defers final business-level specifications.

## 2026-04-14 — Stage-1 Baseline Product Layer Docs
- Added `USER_STORIES_BASELINE.md` to capture role-level baseline stories for Operations and Planning & Review without freezing final workflow details.
- Added `PAGE_INTENTS_BASELINE.md` to define role-separated page intents and page-archetype alignment for Stage-1 skeleton routing.
- Added `STATE_MACHINE_BASELINE.md` with lightweight status-expression clusters for demo consistency (non-final state machine).
- Added `DATA_CONTRACT_BASELINE.md` to define minimum Stage-1 mock data objects and display-critical fields for skeleton pages.

## 2026-04-14 — Stage-1 Skeleton Implementation (CSV + Python Service)
- Implemented a lightweight frontend skeleton (`frontend/`) with shared shell, workspace switcher, role switcher, role-aware top nav, and baseline skeleton routes/pages.
- Implemented a lightweight Python local service (`backend/server.py`) and CSV-backed data model (`backend/data/*.csv`) for read/write demo flows.
- Added safe CSV write pattern in service updates (read current file, build updated rows, write temp file, atomic replace).
- Updated docs to remove PjM from current role scope and align Stage-1 to CSV-backed transitional architecture with Python service read/write.
- Updated README with runnable Stage-1 local run instructions.

## 2026-04-14 — Local Run Documentation Added
- Added `docs/RUN_LOCAL.md` with Stage-1 local startup instructions, quick start, prerequisites, URLs, CSV location, read/write behavior, and troubleshooting.
- Updated `README.md` with a concise Quick Start and link to local run guide.

## 2026-04-14 — Stage-1 Platform-wide UI Direction Correction
- Refactored frontend shell to a stronger workspace UI frame (top bar + sidebar + context expression).
- Completed Chinese-first wording pass for navigation, page titles, actions, helper text, status/table language.
- Applied task-first page grammar across representative home/list/form/review/detail page types.
- Added `docs/UI_REFACTOR_GUIDELINES_STAGE1.md` and updated UI/style grammar docs for reusable platform-wide guidance.

## 2026-04-14 — Frontend Page Isolation Refactor
- Refactored frontend from monolithic `frontend/app.js` to page-isolated module structure under `frontend/app/`.
- Split each concrete page into its own module file for Ops and Plan workspaces (home/list/form/review/detail pages).
- Kept only shell/state/ui/api primitives shared and retained lightweight shared route registration.
- Updated backend static-file serving to support modular frontend imports (`/app/...`).
- Updated coding and boundary docs to make page-level isolation a hard rule for future iterations.

## 2026-04-14 — Runtime Wiring Hotfix After Page Split
- Fixed frontend boot failure by loading `/app/main.js` as an ES module in `frontend/index.html` (`type="module"`).
- This restores workspace selector, role selector, task navigation, and initial page render wiring.

## 2026-04-14 — AM Operations Scoped Loop (Home/Intake/Tracking/Archive)
- AM 首页新增六类流转状态卡片与联动跳转（点击后带状态筛选进入合同进度追踪）。
- 合同登记与申请页完成 OTP 四步深度流程：提取确认、SE3/PMS 匹配、金额分配、提交成功反馈（含 dummy 合同号与完整流转链）。
- 合同进度追踪页改为筛选 + 列表 + 详情结构，支持 dummy/formal/customer/project/status 过滤与详情展示。
- 历史合同档案库改为画廊 + 详情模式，支持多维检索、版本切换（草拟/单签/双签）、在线 iframe 预览与下载。
- 后端扩展 AM 流程相关 API 与 CSV：状态计数、SE3/PMS 候选查询、追踪筛选、档案版本查询；并补充示例档案 PDF 资源。

## 2026-04-14 — AM Pages Usability / IA Refactor (Intake, Tracking, Archive)
- Refactored 合同登记与申请 to stronger business layout: wider Step1 preview, stacked Step2 matching sections, card-based Step3 allocation with payment-node split view, full Step4 confirmation overview, and improved success confirmation hierarchy.
- Refactored 合同进度追踪 to compact real filter bar (keyword + status), complete business columns, concise one-to-many mapping display, and richer right-side detail context.
- Refactored 历史合同档案库 to compact search bar + left gallery + large right preview panel, with clear version switching and download placement.
- Added backend keyword filtering support (`q`) for tracking/archive queries while keeping CSV-backed architecture.

## 2026-04-14 — Intake Step1/2 Demo-Entry Refinement (Tesla+IPB)
- Added a temporary secondary demo entry in Step 1: `载入演示案例（Tesla + IPB）`, while keeping normal upload/extract flow unchanged.
- Kept extracted fields editable in demo path and wired Step 2 candidate loading through existing CSV-backed APIs.
- Refined Step 2 into unified selectable lists (SE3 / PMS), removing duplicate selected-summary blocks.
- Added minimal CSV-backed Tesla+IPB dummy candidates for SE3 snapshots and PMS projects to avoid empty Step 2 in demo path.

## 2026-04-14 — Contract Tracking Split Refactor (List Page + Detail Page)
- Refactored 合同进度追踪 from mixed list+side-detail into two isolated pages/routes: summary list page and standalone detail page.
- List page now focuses on compact real filtering and summary columns with explicit 查看详情 action.
- Detail page now carries full lifecycle, base contract info, matching lists, allocation summary, and file area placeholders.
- Added minimal backend detail endpoint for exact contract event lookup.

## 2026-04-14 — Ops AM Navigation Cleanup (Tracking Detail Hidden + Archive Removed)
- Hid `合同进度详情` from visible sidebar navigation while keeping it as a child route entered from tracking list `查看详情`.
- Removed standalone `合同归档与详情` route and page implementation to eliminate redundant detail surface.
- Kept 合同进度追踪 list -> detail flow as the single detail path.
