import { fetchJson } from "../../shared/api.js";
import { billingBadgeClass, billingStepLabel } from "../../shared/status.js";
import { renderTaskBar, safeText } from "../../shared/ui.js";

const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

function defaultYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function subNav(active) {
  return `<div class="billing-subnav">
    <button class="${active === "list" ? "" : "secondary"}" id="go-list">开票事项列表</button>
    <button class="${active === "calendar" ? "" : "secondary"}" id="go-calendar">开票日历</button>
  </div>`;
}

function amountWithMust(total, must) {
  const totalText = Number(total || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  const mustText = Number(must || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  return `${totalText}（must ${mustText}）`;
}

function cellRows(rows = []) {
  if (!rows.length) return '<div class="empty-note">-</div>';
  return rows
    .map((r) => {
      const step = billingStepLabel(r.status_code, r.status_label);
      return `<div class="calendar-row">
        <div><strong>${safeText(r.project_name || "-")}</strong> / ${safeText(r.product_type || "-")}</div>
        <div>${safeText(r.contract_no || "-")}</div>
        <div class="card-hint">计划 ${safeText(amountWithMust(r.plan_amount, r.plan_must_billing_amount))}</div>
        <div class="card-hint">实际 ${safeText(amountWithMust(r.actual_amount, r.actual_must_billing_amount))}</div>
        <div><span class="badge ${billingBadgeClass(r.status_code)}">${safeText(step)}</span></div>
      </div>`;
    })
    .join("");
}

export default {
  title: "开票跟进｜开票日历",
  type: "日历/执行视图",
  async render({ query }) {
    const ym = query.get("year_month") || defaultYearMonth();
    const year = ym.split("-")[0];
    const data = await fetchJson(`/api/ops/cm/billing/calendar?year=${year}&year_month=${encodeURIComponent(ym)}`, { groups: {} });
    const groups = data.groups || {};
    const customers = Object.keys(groups);
    return `
      ${renderTaskBar("开票日历与开票事项列表使用同一任务域数据，状态与金额保持同步。")}
      ${subNav("calendar")}
      <div class="actions">
        <input id="calendar-year-month" type="month" value="${safeText(ym)}" />
        <button id="calendar-apply">查看</button>
      </div>
      ${
        customers.length
          ? customers
              .map(
                (customer) => `<section class="focus-panel" style="margin-top:10px;">
                    <h3>${safeText(customer)}</h3>
                    <div class="calendar-grid">
                      ${months
                        .map(
                          (m) => `<article class="calendar-cell">
                            <h4>${m}月</h4>
                            ${cellRows(groups[customer]?.[m] || [])}
                          </article>`
                        )
                        .join("")}
                    </div>
                  </section>`
              )
              .join("")
          : '<div class="empty-note">暂无日历数据</div>'
      }
    `;
  },
  bind() {
    document.getElementById("go-list").onclick = () => {
      const ym = document.getElementById("calendar-year-month").value || defaultYearMonth();
      location.hash = `/ops/billing/tasks?year_month=${encodeURIComponent(ym)}`;
    };
    document.getElementById("go-calendar").onclick = () => {
      const ym = document.getElementById("calendar-year-month").value || defaultYearMonth();
      location.hash = `/ops/billing/calendar?year_month=${encodeURIComponent(ym)}`;
    };
    document.getElementById("calendar-apply").onclick = () => {
      const ym = document.getElementById("calendar-year-month").value || defaultYearMonth();
      location.hash = `/ops/billing/calendar?year_month=${encodeURIComponent(ym)}`;
    };
  },
};
