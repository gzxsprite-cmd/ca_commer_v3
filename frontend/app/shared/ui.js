import { badgeClass, cnStatus } from "./status.js";

export function safeText(v) {
  return String(v ?? "").replace(/[<>&"']/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[ch]));
}

export function renderTaskBar(text) {
  return `<div class="task-bar">${safeText(text)}</div>`;
}

export function renderIdentity(route, roleLabel, workspaceLabel) {
  return `
    <h2>${safeText(route.title)}</h2>
    <div class="page-meta">
      <span>页面类型：${safeText(route.typeLabel || route.type)}</span>
      <span>当前角色：${safeText(roleLabel)}</span>
      <span>工作空间：${safeText(workspaceLabel)}</span>
    </div>
  `;
}

export function detectColumns(row) {
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

export function renderTable(columns, rows) {
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

export function renderCards(cards) {
  return `<div class="grid">${cards
    .map(
      (c) => `<article class="card">
      <div class="card-title">${safeText(c.title)}</div>
      <div class="card-value">${safeText(c.value)}</div>
      <div class="card-hint">${safeText(c.hint || "")}</div>
    </article>`
    )
    .join("")}</div>`;
}
