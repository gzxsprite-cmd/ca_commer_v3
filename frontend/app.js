const roles = [
  { code: "AM", label: "AM（客户经理）", hint: "负责合同发起与进度跟进" },
  { code: "CM", label: "CM（商务管理）", hint: "负责合规审核与账款执行" },
  { code: "SCP", label: "SCP（计划分析）", hint: "负责计划分解与偏差调整" },
  { code: "CA", label: "CA（审批管理）", hint: "负责签署审批与管理复盘" },
];

const workspaces = [
  { code: "ops", label: "合同与开票执行", desc: "执行工作区" },
  { code: "plan", label: "计划与复盘管理", desc: "管理工作区" },
];

const routes = [
  { path: "/ops/am/home", workspace: "ops", roles: ["AM"], nav: "我的执行首页", title: "AM 今日执行首页", type: "home", taskHint: "先看待办合同与应收风险，再进入登记或追踪。" },
  { path: "/ops/cm/home", workspace: "ops", roles: ["CM"], nav: "CM 执行首页", title: "CM 商务执行首页", type: "home", taskHint: "优先处理待审核与待更新节点，再处理开票与计划。" },
  { path: "/ops/ca/home", workspace: "ops", roles: ["CA"], nav: "CA 签署首页", title: "CA 签署与复核首页", type: "home", taskHint: "优先处理待签合同，再查看近期签署回顾。" },

  { path: "/ops/contracts/intake", workspace: "ops", roles: ["AM", "CM"], nav: "合同登记与申请", title: "合同登记与申请", type: "form", api: "/api/ops/contracts/intake", taskHint: "补齐关键信息后提交，进入CM审核。" },
  { path: "/ops/contracts/tracking", workspace: "ops", roles: ["AM", "CM", "CA"], nav: "合同进度追踪", title: "合同进度追踪", type: "list", api: "/api/ops/contracts/tracking", taskHint: "关注阻塞状态、当前责任人、下一步动作。" },
  { path: "/ops/contracts/review-queue", workspace: "ops", roles: ["CM", "CA"], nav: "合同审核队列", title: "合同审核队列", type: "review", api: "/api/ops/contracts/review-queue", taskHint: "先处理高风险或长期滞留项，明确结论与动作。" },
  { path: "/ops/contracts/archive", workspace: "ops", roles: ["CM", "AM", "CA"], nav: "合同归档与详情", title: "合同归档与详情", type: "detail", api: "/api/ops/contracts/archive", taskHint: "先定位目标合同，再查看责任链路与后续事项。" },
  { path: "/ops/billing/execution", workspace: "ops", roles: ["CM"], nav: "开票登记", title: "开票登记", type: "form", api: "/api/ops/billing/execution", taskHint: "按实际开票信息登记并关联合同。" },
  { path: "/ops/billing/records", workspace: "ops", roles: ["CM"], nav: "开票记录", title: "开票记录", type: "list", api: "/api/ops/billing/records", taskHint: "追踪开票记录与合同分配是否清晰。" },
  { path: "/ops/receivables/balances", workspace: "ops", roles: ["AM", "CM", "CA"], nav: "应收账款", title: "应收账款与合同余额", type: "list", api: "/api/ops/receivables/balances", taskHint: "优先关注高余额和高风险项。" },
  { path: "/ops/billing/plan", workspace: "ops", roles: ["CM"], nav: "开票计划", title: "开票计划", type: "list", api: "/api/ops/billing/plan", taskHint: "以月度节奏维护计划，确保与执行一致。" },

  { path: "/plan/scp/home", workspace: "plan", roles: ["SCP"], nav: "SCP 计划首页", title: "SCP 计划与调整首页", type: "home", taskHint: "先看计划偏差，再处理分解、覆盖和调整。" },
  { path: "/plan/ca/home", workspace: "plan", roles: ["CA"], nav: "CA 管理首页", title: "CA 管理复盘首页", type: "home", taskHint: "先看管理摘要，再关注需要决策的异常。" },
  { path: "/plan/contracts", workspace: "plan", roles: ["SCP", "CA"], nav: "合同计划", title: "合同计划视图", type: "list", api: "/api/plan/contracts", taskHint: "按合同维度查看未来回款与计划状态。" },
  { path: "/plan/billing", workspace: "plan", roles: ["SCP", "CA"], nav: "开票计划复盘", title: "开票计划复盘", type: "list", api: "/api/plan/billing", taskHint: "核对计划与执行偏差并标注下一步。" },
  { path: "/plan/targets", workspace: "plan", roles: ["SCP", "CA"], nav: "目标分解", title: "目标分解与分配", type: "list", api: "/api/plan/targets", taskHint: "从区域目标到客户目标分层拆解。" },
  { path: "/plan/cost-coverage", workspace: "plan", roles: ["SCP", "CA"], nav: "成本覆盖", title: "成本覆盖评估", type: "list", api: "/api/plan/cost-coverage", taskHint: "识别覆盖不足项目并准备调整建议。" },
  { path: "/plan/adjustments", workspace: "plan", roles: ["SCP", "CA"], nav: "调整申请", title: "计划调整申请", type: "form", api: "/api/plan/adjustments", taskHint: "说明原因、影响和建议动作，便于管理判断。" },
  { path: "/plan/review-dashboard", workspace: "plan", roles: ["SCP", "CA"], nav: "管理复盘看板", title: "管理复盘看板", type: "review", api: "/api/plan/review-dashboard", taskHint: "聚焦异常趋势和待决策事项。" },
];

const archetypeLabel = {
  home: "角色首页",
  list: "列表/追踪",
  form: "流程/表单",
  review: "评审/决策",
  detail: "详情/抽屉",
};

const statusLabel = {
  draft: "草稿",
  submitted: "已提交",
  cm_in_review: "CM审核中",
  ca_pending_signature: "待CA签署",
  ca_signed: "CA已签署",
  sent_to_customer: "已发客户",
  dual_signed_returned: "双签回收",
  execution_closed: "执行关闭",
  not_archived: "未归档",
  archived_indexed: "已归档",
  outstanding: "有未收款",
  overdue_risk: "逾期风险",
  clear: "已清",
  plan_pending: "计划待执行",
  planning_under_review: "计划评审中",
  planning_published: "计划已发布",
  planning_revised: "计划已修订",
  adjustment_in_assessment: "调整评估中",
  adjustment_proposed: "已提出调整",
  allocated_to_contracts: "已分配到合同",
};

const state = { role: "AM", workspace: "ops" };

function getPath() {
  return location.hash.replace(/^#/, "") || getDefaultPath();
}

function getDefaultPath() {
  if (state.workspace === "ops") {
    if (state.role === "CM") return "/ops/cm/home";
    if (state.role === "CA") return "/ops/ca/home";
    return "/ops/am/home";
  }
  if (state.role === "CA") return "/plan/ca/home";
  return "/plan/scp/home";
}

function currentWorkspace() {
  return workspaces.find((w) => w.code === state.workspace);
}

function currentRole() {
  return roles.find((r) => r.code === state.role);
}

function availableRoutes() {
  return routes.filter((r) => r.workspace === state.workspace && r.roles.includes(state.role));
}

function routeByPath(path) {
  return routes.find((r) => r.path === path);
}

function safeText(v) {
  return String(v ?? "").replace(/[<>&"']/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function cnStatus(raw) {
  return statusLabel[raw] || raw || "-";
}

function badgeClass(text) {
  if (!text) return "status-info";
  if (text.includes("风险") || text.includes("阻塞") || text.includes("逾期")) return "status-danger";
  if (text.includes("待") || text.includes("评估") || text.includes("审核")) return "status-warning";
  if (text.includes("已") || text.includes("完成") || text.includes("关闭") || text.includes("清")) return "status-success";
  return "status-info";
}

function renderGlobalContext() {
  const el = document.getElementById("global-context");
  const ws = currentWorkspace();
  const role = currentRole();
  el.innerHTML = `
    <span class="context-chip strong">${safeText(ws.label)}</span>
    <span class="context-chip">${safeText(ws.desc)}</span>
    <span class="context-chip strong">当前角色：${safeText(role.label)}</span>
  `;
}

function renderSwitchers() {
  const wsEl = document.getElementById("workspace-switcher");
  const roleEl = document.getElementById("role-switcher");

  wsEl.innerHTML = workspaces.map((w) => `<option value="${w.code}">${w.label}</option>`).join("");
  roleEl.innerHTML = roles.map((r) => `<option value="${r.code}">${r.label}</option>`).join("");

  wsEl.value = state.workspace;
  roleEl.value = state.role;

  wsEl.onchange = () => {
    state.workspace = wsEl.value;
    location.hash = getDefaultPath();
    render();
  };

  roleEl.onchange = () => {
    state.role = roleEl.value;
    location.hash = getDefaultPath();
    render();
  };
}

function renderSideNav() {
  const nav = document.getElementById("side-nav");
  const current = getPath();
  nav.innerHTML = availableRoutes()
    .map((r) => `<button class="nav-link ${r.path === current ? "active" : ""}" data-path="${r.path}">${safeText(r.nav)}</button>`)
    .join("");

  nav.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => {
      location.hash = btn.dataset.path;
      render();
    };
  });
}

function renderPageIdentity(route) {
  const box = document.getElementById("page-identity");
  box.innerHTML = `
    <h2>${safeText(route.title)}</h2>
    <div class="page-meta">
      <span>页面类型：${archetypeLabel[route.type]}</span>
      <span>当前角色：${safeText(currentRole().label)}</span>
      <span>工作空间：${safeText(currentWorkspace().label)}</span>
    </div>
  `;
}

async function fetchJson(url, fallback = []) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error("request failed");
    return await r.json();
  } catch {
    return fallback;
  }
}

function homeCardHints(path) {
  const map = {
    "/ops/am/home": ["我发起的待推进合同", "待CA签署合同", "我的应收未回款"],
    "/ops/cm/home": ["待审核提交", "本月开票计划金额", "待处理应收风险"],
    "/ops/ca/home": ["待签署合同", "已签署回顾", "需关注异常项"],
    "/plan/scp/home": ["管理合同总数", "未来三个月计划回款", "待处理调整单"],
    "/plan/ca/home": ["管理看板关键指标", "目标达成趋势", "需要决策事项"],
  };
  return map[path] || ["关键指标1", "关键指标2", "关键指标3"];
}

async function renderHome(route) {
  const cards = await fetchJson(`/api/home/cards?workspace=${state.workspace}&role=${state.role}`);
  const hints = homeCardHints(route.path);

  const cardHtml = cards.length
    ? cards
        .slice(0, 6)
        .map(
          (c, i) => `
          <article class="card">
            <div class="card-title">${safeText(c.metric_label || hints[i] || "指标")}</div>
            <div class="card-value">${safeText(c.metric_value || "-")}</div>
            <div class="card-hint">趋势：${safeText(c.trend_hint || "-" )}</div>
          </article>`
        )
        .join("")
    : hints
        .map(
          (h) => `
          <article class="card">
            <div class="card-title">${safeText(h)}</div>
            <div class="card-value">--</div>
            <div class="card-hint">等待数据加载</div>
          </article>`
        )
        .join("");

  return `
    <div class="task-bar">今日建议：${safeText(route.taskHint)}</div>
    <div class="grid">${cardHtml}</div>
    <div class="empty-note">提示：先处理“待办/阻塞”事项，再进入明细页面逐项推进。</div>
  `;
}

function detectColumns(row) {
  const keys = Object.keys(row || {});
  if (keys.includes("contract_code")) return ["contract_code", "execution_status", "current_owner_role", "next_step_label"];
  if (keys.includes("billing_event_id")) return ["billing_event_id", "billing_date", "amount", "allocation_status"];
  if (keys.includes("billing_plan_id")) return ["billing_plan_id", "period_key", "planned_amount", "plan_status"];
  if (keys.includes("planning_record_id")) return ["planning_record_id", "planning_type", "period_key", "planning_status"];
  if (keys.includes("adjustment_id")) return ["adjustment_id", "adjustment_reason", "delta_value", "adjustment_status"];
  return keys.slice(0, 4);
}

const colLabel = {
  contract_code: "合同编号",
  execution_status: "当前状态",
  current_owner_role: "当前责任人",
  next_step_label: "下一步",
  billing_event_id: "开票记录号",
  billing_date: "开票日期",
  amount: "金额",
  allocation_status: "分配状态",
  billing_plan_id: "计划编号",
  period_key: "期间",
  planned_amount: "计划金额",
  plan_status: "计划状态",
  planning_record_id: "计划记录号",
  planning_type: "计划类型",
  planning_status: "计划状态",
  adjustment_id: "调整单号",
  adjustment_reason: "调整原因",
  delta_value: "调整值",
  adjustment_status: "调整状态",
};

function renderTable(columns, rows) {
  return `
    <div class="table-wrap">
      <table class="table">
        <thead><tr>${columns.map((c) => `<th>${colLabel[c] || c}</th>`).join("")}</tr></thead>
        <tbody>
          ${
            rows.length
              ? rows
                  .map(
                    (row) => `<tr>${columns
                      .map((c) => {
                        const val = c.includes("status") ? cnStatus(row[c]) : row[c];
                        if (c.includes("status")) {
                          return `<td><span class="badge ${badgeClass(cnStatus(row[c]))}">${safeText(val)}</span></td>`;
                        }
                        return `<td>${safeText(val ?? "-")}</td>`;
                      })
                      .join("")}</tr>`
                  )
                  .join("")
              : `<tr><td colspan="${columns.length}" class="empty-note">当前暂无记录</td></tr>`
          }
        </tbody>
      </table>
    </div>
  `;
}

async function renderList(route) {
  const rows = await fetchJson(route.api);
  const columns = detectColumns(rows[0]);
  return `
    <div class="task-bar">任务关注：${safeText(route.taskHint)}</div>
    ${renderTable(columns, rows.slice(0, 18))}
  `;
}

function formSchema(path) {
  if (path === "/ops/contracts/intake") {
    return {
      fields: [
        { key: "contract_code", label: "合同编号", placeholder: "如 CA-2026-001" },
        { key: "customer_name", label: "客户名称", placeholder: "请输入客户名称" },
      ],
      submitText: "提交合同申请",
    };
  }
  if (path === "/ops/billing/execution") {
    return {
      fields: [
        { key: "billing_date", label: "开票日期", placeholder: "YYYY-MM-DD" },
        { key: "amount", label: "开票金额", placeholder: "请输入金额" },
        { key: "linked_contract_case_ids", label: "关联合同", placeholder: "如 CC-001,CC-002" },
      ],
      submitText: "提交开票登记",
    };
  }
  return {
    fields: [
      { key: "scope_key", label: "调整范围", placeholder: "如 portfolio / 客户组" },
      { key: "adjustment_reason", label: "调整原因", placeholder: "请输入调整原因" },
      { key: "delta_value", label: "调整值", placeholder: "如 -15000" },
    ],
    submitText: "提交调整申请",
  };
}

function renderForm(route) {
  const schema = formSchema(route.path);
  return `
    <div class="task-bar">操作说明：${safeText(route.taskHint)}</div>
    <div class="form-grid">
      ${schema.fields
        .map(
          (f) => `
          <div class="form-item">
            <label>${safeText(f.label)}</label>
            <input name="${f.key}" placeholder="${safeText(f.placeholder)}" />
          </div>`
        )
        .join("")}
    </div>
    <div class="actions">
      <button id="submit-form">${schema.submitText}</button>
      <button class="secondary" id="reset-form">清空输入</button>
      <span id="form-msg"></span>
    </div>
  `;
}

async function bindForm(route) {
  const submitBtn = document.getElementById("submit-form");
  const resetBtn = document.getElementById("reset-form");
  const msg = document.getElementById("form-msg");

  if (resetBtn) {
    resetBtn.onclick = () => {
      document.querySelectorAll("#page-content input").forEach((el) => (el.value = ""));
      msg.textContent = "";
    };
  }

  if (!submitBtn) return;
  submitBtn.onclick = async () => {
    const payload = {};
    document.querySelectorAll("#page-content input").forEach((el) => {
      if (el.name) payload[el.name] = el.value;
    });
    if (route.path === "/plan/adjustments") payload.proposed_by_role = state.role;

    try {
      const res = await fetch(route.api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      msg.textContent = "已保存，可在对应列表页查看。";
    } catch {
      msg.textContent = "保存失败，请检查输入或稍后重试。";
    }
  };
}

async function renderReview(route) {
  const rows = await fetchJson(route.api);
  const focus = rows.slice(0, 5);
  return `
    <div class="task-bar">评审关注：${safeText(route.taskHint)}</div>
    <div class="review-layout">
      <section class="focus-panel">
        <h3>待关注事项</h3>
        ${focus.length ? renderTable(detectColumns(focus[0]), focus) : '<div class="empty-note">暂无待评审事项</div>'}
      </section>
      <section class="decision-panel">
        <h3>决策提醒</h3>
        <p>请优先处理长期停留、风险状态、责任不清的条目。</p>
        <div class="actions">
          <button>进入重点处理</button>
          <button class="secondary">仅查看高风险</button>
        </div>
      </section>
    </div>
  `;
}

async function renderDetail(route) {
  const rows = await fetchJson(route.api);
  const first = rows[0] || {};
  return `
    <div class="task-bar">详情目标：${safeText(route.taskHint)}</div>
    <div class="detail-layout">
      <section>
        ${renderTable(detectColumns(rows[0]), rows.slice(0, 12))}
      </section>
      <aside class="detail-side">
        <h3>记录侧栏</h3>
        <p><strong>合同：</strong>${safeText(first.contract_code || "-")}</p>
        <p><strong>当前状态：</strong>${safeText(cnStatus(first.execution_status || first.archive_status || "-"))}</p>
        <p><strong>当前责任人：</strong>${safeText(first.current_owner_role || "-")}</p>
        <p><strong>下一步：</strong>${safeText(first.next_step_label || "确认归档信息")}</p>
        <div class="empty-note">此侧栏用于快速查看关键信息，避免跳转丢失上下文。</div>
      </aside>
    </div>
  `;
}

async function renderPage() {
  const path = getPath();
  const route = availableRoutes().find((r) => r.path === path);
  if (!route) {
    location.hash = getDefaultPath();
    return renderPage();
  }

  renderPageIdentity(route);
  const content = document.getElementById("page-content");

  if (route.type === "home") {
    content.innerHTML = await renderHome(route);
    return;
  }
  if (route.type === "list") {
    content.innerHTML = await renderList(route);
    return;
  }
  if (route.type === "form") {
    content.innerHTML = renderForm(route);
    await bindForm(route);
    return;
  }
  if (route.type === "review") {
    content.innerHTML = await renderReview(route);
    return;
  }
  content.innerHTML = await renderDetail(route);
}

function render() {
  renderGlobalContext();
  renderSwitchers();
  renderSideNav();
  renderPage();
}

window.addEventListener("hashchange", render);
render();
