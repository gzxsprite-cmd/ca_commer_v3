import { fetchJson } from "../../shared/api.js";
import { renderTaskBar, safeText } from "../../shared/ui.js";

const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

function cellRows(rows = []) {
  if (!rows.length) return '<div class="empty-note">-</div>';
  return rows
    .map((r) => {
      const actual = Number(r.actual_amount || 0);
      const plan = Number(r.plan_amount || 0);
      const deficit = Number(r.deficit || 0);
      return `<div class="calendar-row">
        <div><strong>${safeText(r.project_name || "-")}</strong> / ${safeText(r.product_type || "-")}</div>
        <div>${safeText(r.contract_no || "-")} ｜ <span class="badge ${actual > 0 ? "" : "status-info"}">${actual > 0 ? `实际 ${actual}` : `计划 ${plan}`}</span></div>
        ${deficit > 0 ? `<div style="color:#b42318;">(-${deficit})</div>` : ""}
      </div>`;
    })
    .join("");
}

export default {
  title: "CM 开票日历视图",
  type: "日历/执行视图",
  async render() {
    const year = new Date().getFullYear();
    const data = await fetchJson(`/api/ops/cm/billing/calendar?year=${year}`, { groups: {} });
    const groups = data.groups || {};
    const customers = Object.keys(groups);
    return `
      ${renderTaskBar("按客户查看年度开票计划与实际：灰=实际，蓝=计划，红=历史缺口。")}
      <div class="actions"><span class="badge">${safeText(data.year || year)} 年</span></div>
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
};
