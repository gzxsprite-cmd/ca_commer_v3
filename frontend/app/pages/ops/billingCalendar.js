import { fetchJson } from "../../shared/api.js";
import { billingBadgeClass, billingStepLabel } from "../../shared/status.js";
import { renderTaskBar, safeText } from "../../shared/ui.js";

const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

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
    const year = new Date().getFullYear();
    const customer = query.get("customer") || "";
    const product = query.get("product") || "";
    const project = query.get("project") || "";
    const contract = query.get("contract") || "";
    const params = new URLSearchParams({ year: String(year) });
    if (customer) params.set("customer", customer);
    if (product) params.set("product", product);
    if (project) params.set("project", project);
    if (contract) params.set("contract", contract);
    const data = await fetchJson(`/api/ops/cm/billing/calendar?${params.toString()}`, { groups: {} });
    const groups = data.groups || {};
    const customers = Object.keys(groups);
    return `
      ${renderTaskBar("开票日历与开票事项列表使用同一任务域数据，按客户/产品/项目/合同过滤后展示全年12个月分布。")}
      ${subNav("calendar")}
      <div class="compact-filter-bar" style="grid-template-columns: 170px 170px 200px 170px auto;">
        <input id="c-customer" placeholder="客户筛选" value="${safeText(customer)}" />
        <input id="c-product" placeholder="产品筛选" value="${safeText(product)}" />
        <input id="c-project" placeholder="项目名关键词" value="${safeText(project)}" />
        <input id="c-contract" placeholder="合同号关键词" value="${safeText(contract)}" />
        <button id="calendar-apply">查询</button>
      </div>
      ${
        customers.length
          ? customers
              .map(
                (name) => `<section class="focus-panel" style="margin-top:10px;">
                    <h3>${safeText(name)}</h3>
                    <div class="calendar-grid">
                      ${months
                        .map(
                          (m) => `<article class="calendar-cell">
                            <h4>${m}月</h4>
                            ${cellRows(groups[name]?.[m] || [])}
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
      location.hash = "/ops/billing/tasks";
    };
    document.getElementById("go-calendar").onclick = () => {
      const params = new URLSearchParams();
      ["customer", "product", "project", "contract"].forEach((k) => {
        const v = document.getElementById(`c-${k}`)?.value?.trim();
        if (v) params.set(k, v);
      });
      location.hash = `/ops/billing/calendar${params.toString() ? `?${params.toString()}` : ""}`;
    };
    document.getElementById("calendar-apply").onclick = () => {
      const params = new URLSearchParams();
      ["customer", "product", "project", "contract"].forEach((k) => {
        const v = document.getElementById(`c-${k}`)?.value?.trim();
        if (v) params.set(k, v);
      });
      location.hash = `/ops/billing/calendar${params.toString() ? `?${params.toString()}` : ""}`;
    };
  },
};
