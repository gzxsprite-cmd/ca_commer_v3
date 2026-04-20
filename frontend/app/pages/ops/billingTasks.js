import { fetchJson, postJson } from "../../shared/api.js";
import { billingBadgeClass, billingStepLabel } from "../../shared/status.js";
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

const quickNext = {
  planned: "customer_confirmed",
  customer_confirmed: "rb_mapped",
  rb_mapped: "settlement_adjusted",
  settlement_adjusted: "declaration_booked",
};

function defaultYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function amountWithMust(total, must) {
  const totalText = Number(total || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  const mustText = Number(must || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  return `${totalText}（must ${mustText}）`;
}

function subNav(active) {
  return `<div class="billing-subnav">
    <button class="${active === "list" ? "" : "secondary"}" id="go-list">开票事项列表</button>
    <button class="${active === "calendar" ? "" : "secondary"}" id="go-calendar">开票日历</button>
  </div>`;
}

export default {
  title: "开票跟进｜开票事项列表",
  type: "列表/执行",
  async render({ query }) {
    const ym = query.get("year_month") || defaultYearMonth();
    return `
      ${renderTaskBar("本页优先呈现选定年月的计划生成事项，再展示计划外事项（AM/PjM/CM手动）。")}
      ${subNav("list")}
      <div class="compact-filter-bar" style="grid-template-columns: 170px 160px 170px 170px auto auto;">
        <input id="f-year-month" type="month" value="${safeText(ym)}" />
        <select id="f-status">${statusOptions
          .map(([v, l]) => `<option value="${v}" ${query.get("status") === v ? "selected" : ""}>${l}</option>`)
          .join("")}</select>
        <input id="f-customer" placeholder="客户" value="${safeText(query.get("customer") || "")}" />
        <input id="f-contract" placeholder="合同号" value="${safeText(query.get("contract") || "")}" />
        <button id="f-apply">查询</button>
        <button id="goto-new" class="secondary">CM手动新建</button>
      </div>
      <div class="table-wrap" style="margin-top:10px;">
        <table class="table">
          <thead>
            <tr>
              <th>年-月</th><th>客户</th><th>项目</th><th>产品</th><th>合同号</th><th>月度计划开票金额</th><th>实际开票金额</th><th>状态</th><th>轻量操作</th><th>详情</th>
            </tr>
          </thead>
          <tbody id="billing-task-body"><tr><td colspan="10" class="empty-note">加载中...</td></tr></tbody>
        </table>
      </div>
    `;
  },
  bind({ query }) {
    const body = document.getElementById("billing-task-body");

    document.getElementById("go-list").onclick = () => {
      const params = new URLSearchParams(location.hash.split("?")[1] || "");
      location.hash = `/ops/billing/tasks${params.toString() ? `?${params.toString()}` : ""}`;
    };
    document.getElementById("go-calendar").onclick = () => {
      const params = new URLSearchParams(location.hash.split("?")[1] || "");
      location.hash = `/ops/billing/calendar${params.toString() ? `?${params.toString()}` : ""}`;
    };

    const getParams = () => {
      const p = new URLSearchParams();
      const ym = document.getElementById("f-year-month")?.value || defaultYearMonth();
      p.set("year_month", ym);
      ["status", "customer", "contract"].forEach((k) => {
        const v = document.getElementById(`f-${k}`)?.value?.trim();
        if (v) p.set(k, v);
      });
      return p;
    };

    const renderRows = (rows) => {
      body.innerHTML = rows.length
        ? rows
            .map((r) => {
              const canQuick = Boolean(quickNext[r.status_code]);
              return `<tr>
              <td>${safeText(`${r.year}-${r.month}`)}</td>
              <td>${safeText(r.customer_name)}</td>
              <td>${safeText(r.project_name)}</td>
              <td>${safeText(r.product_type || "-")}</td>
              <td>${safeText(r.contract_no)}</td>
              <td>${safeText(amountWithMust(r.plan_amount, r.plan_must_billing_amount))}</td>
              <td>${safeText(amountWithMust(r.actual_amount || 0, r.actual_must_billing_amount || 0))}</td>
              <td><span class="badge ${billingBadgeClass(r.status_code)}">${safeText(billingStepLabel(r.status_code, r.status_label))}</span></td>
              <td>
                ${canQuick ? `<button class="task-next" data-id="${safeText(r.billing_task_id)}" data-next="${quickNext[r.status_code]}">推进</button>` : '<span class="card-hint">请在详情完成</span>'}
              </td>
              <td><button class="secondary task-detail" data-id="${safeText(r.billing_task_id)}">详情</button></td>
            </tr>`;
            })
            .join("")
        : '<tr><td colspan="10" class="empty-note">暂无事项</td></tr>';

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
    document.getElementById("f-apply").onclick = () => {
      const params = getParams();
      location.hash = `/ops/billing/tasks?${params.toString()}`;
      load();
    };
    document.getElementById("goto-new").onclick = () => (location.hash = "/ops/billing/execution");
    load();
  },
};
