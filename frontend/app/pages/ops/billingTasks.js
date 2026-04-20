import { fetchJson, postJson } from "../../shared/api.js";
import { renderTaskBar, safeText } from "../../shared/ui.js";

const statusOptions = [
  ["", "全部状态"],
  ["planned", "计划开票"],
  ["customer_confirmed", "客户确认"],
  ["rb_mapped", "RB内部mapping"],
  ["settlement_adjusted", "结算调整"],
  ["declaration_booked", "开票声明和预约"],
  ["closed", "关闭"],
  ["partial_closed", "部分关闭"],
];

const sourceOptions = [
  ["", "全部来源"],
  ["plan_generated", "计划生成"],
  ["am_triggered", "AM触发"],
  ["pjm_triggered", "PjM触发"],
  ["cm_manual", "CM手动"],
];

const quickNext = {
  planned: "customer_confirmed",
  customer_confirmed: "rb_mapped",
  rb_mapped: "settlement_adjusted",
  settlement_adjusted: "declaration_booked",
};

export default {
  title: "开票事项",
  type: "列表/执行",
  async render({ query }) {
    return `
      ${renderTaskBar("查看并推进开票事项：来源清晰、状态清晰、must billing高亮。")}
      <div class="compact-filter-bar">
        <select id="f-status">${statusOptions
          .map(([v, l]) => `<option value="${v}" ${query.get("status") === v ? "selected" : ""}>${l}</option>`)
          .join("")}</select>
        <select id="f-source">${sourceOptions
          .map(([v, l]) => `<option value="${v}" ${query.get("source") === v ? "selected" : ""}>${l}</option>`)
          .join("")}</select>
        <input id="f-customer" placeholder="客户" value="${safeText(query.get("customer") || "")}" />
        <input id="f-contract" placeholder="合同编号" value="${safeText(query.get("contract") || "")}" />
        <select id="f-must"><option value="">是否must billing</option><option value="1">是</option><option value="0">否</option></select>
        <button id="f-apply">查询</button>
        <button id="goto-new" class="secondary">新建开票事件</button>
      </div>
      <div class="table-wrap" style="margin-top:10px;">
        <table class="table">
          <thead>
            <tr>
              <th>事项ID</th><th>来源</th><th>客户</th><th>项目/合同</th><th>must billing</th><th>计划金额</th><th>实际金额</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody id="billing-task-body"><tr><td colspan="9" class="empty-note">加载中...</td></tr></tbody>
        </table>
      </div>
    `;
  },
  bind({ query }) {
    const body = document.getElementById("billing-task-body");
    const getParams = () => {
      const p = new URLSearchParams();
      ["status", "source", "customer", "contract", "must_billing"].forEach((k) => {
        const id = `f-${k === "must_billing" ? "must" : k}`;
        const v = document.getElementById(id)?.value?.trim();
        if (v) p.set(k, v);
      });
      return p;
    };

    const renderRows = (rows) => {
      body.innerHTML = rows.length
        ? rows
            .map((r) => `<tr>
              <td>${safeText(r.billing_task_id)}</td>
              <td>${safeText(r.source_type)}</td>
              <td>${safeText(r.customer_name)}</td>
              <td>${safeText(r.project_name)} / ${safeText(r.contract_no)}</td>
              <td>${r.must_billing_flag === "1" ? '<span class="badge status-warning">must</span>' : "-"}</td>
              <td>${safeText(r.plan_amount)}</td>
              <td>${safeText(r.actual_amount || "0")}</td>
              <td><span class="badge">${safeText(r.status_label || r.status_code)}</span></td>
              <td>
                <button class="secondary task-detail" data-id="${safeText(r.billing_task_id)}">详情</button>
                ${quickNext[r.status_code] ? `<button class="task-next" data-id="${safeText(r.billing_task_id)}" data-next="${quickNext[r.status_code]}">推进</button>` : ""}
              </td>
            </tr>`)
            .join("")
        : '<tr><td colspan="9" class="empty-note">暂无事项</td></tr>';

      document.querySelectorAll(".task-detail").forEach((btn) => {
        btn.onclick = () => (location.hash = `/ops/billing/tasks/detail?id=${encodeURIComponent(btn.dataset.id)}`);
      });
      document.querySelectorAll(".task-next").forEach((btn) => {
        btn.onclick = async () => {
          await postJson("/api/ops/cm/billing/tasks/progress", {
            billing_task_id: btn.dataset.id,
            target_status: btn.dataset.next,
          });
          load();
        };
      });
    };

    const load = async () => {
      const params = getParams();
      const rows = await fetchJson(`/api/ops/cm/billing/tasks?${params.toString()}`, []);
      renderRows(rows);
    };

    document.getElementById("f-status").value = query.get("status") || "";
    document.getElementById("f-source").value = query.get("source") || "";
    document.getElementById("f-must").value = query.get("must_billing") || "";
    document.getElementById("f-apply").onclick = () => {
      const params = getParams();
      location.hash = `/ops/billing/tasks${params.toString() ? `?${params.toString()}` : ""}`;
      load();
    };
    document.getElementById("goto-new").onclick = () => (location.hash = "/ops/billing/execution");
    load();
  },
};
