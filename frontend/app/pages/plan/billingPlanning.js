import { fetchJson, postJson } from "../../shared/api.js";
import { renderTaskBar, safeText } from "../../shared/ui.js";

const LEFT_COLUMNS = [
  { key: "customer_name", label: "客户", width: 140 },
  { key: "project_name", label: "项目", width: 180 },
  { key: "product_type", label: "产品", width: 130 },
  { key: "contract_no", label: "合同号", width: 170 },
  { key: "otp_lifetime", label: "OTP lifetime", width: 140 },
  { key: "otp_target", label: "OTP target", width: 140 },
];

function monthCols(prefix) {
  return Array.from({ length: 12 }, (_, i) => `${prefix}_${String(i + 1).padStart(2, "0")}`);
}

function amountOrDash(value) {
  if (value === undefined || value === null || value === "") return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return safeText(value);
  return n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}

function parseAmount(value) {
  if (value === undefined || value === null || value === "") return 0;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

function toPublishRows(filteredRows, planCols, currentMonth) {
  return filteredRows.map((r) => {
    const planByMonth = {};
    for (let m = currentMonth; m <= 12; m += 1) {
      const k = planCols[m - 1];
      planByMonth[String(m).padStart(2, "0")] = parseAmount(r[k]);
    }
    return {
      customer_project_id: r.customer_project_id,
      contract_id: r.contract_id,
      plan_by_month: planByMonth,
      total_plan_amount: Object.values(planByMonth).reduce((sum, x) => sum + parseAmount(x), 0),
      project_name: r.project_name || "",
      contract_no: r.contract_no || "",
      customer_name: r.customer_name || "",
      product_type: r.product_type || "",
    };
  });
}

export default {
  title: "月度开票计划",
  type: "CM计划维护",
  async render() {
    const now = new Date();
    const year = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const data = await fetchJson(`/api/cm/billing/plan-grid?year=${year}`, { rows: [] });
    const rows = data.rows || [];
    const planCols = monthCols("plan");
    const actualCols = monthCols("actual");
    const periodKey = `${data.year || year}-${String(currentMonth).padStart(2, "0")}`;

    window.__CM_BILLING_PLAN_STATE__ = {
      rows: structuredClone(rows),
      filteredRows: structuredClone(rows),
      year: data.year || year,
      currentMonth,
      periodKey,
      publishMeta: data.publish_meta || { period_key: periodKey, exists: false },
      planCols,
      actualCols,
    };

    return `
      ${renderTaskBar("CM在同一张年度矩阵中维护月度开票计划：历史月显示实际执行，当月及后续月维护计划开票。")}
      <section class="focus-panel matrix-page">
        <div class="matrix-header">
          <div>
            <h3>月度开票计划（${safeText(data.year || year)}）</h3>
            <p class="card-hint">OTP lifetime=项目合同生命周期可回收金额；OTP target=最新CF计划要求收款金额。仅当月及后续月份可编辑。</p>
          </div>
          <div class="actions matrix-actions">
            <button id="toggle-import" class="secondary">计划导入</button>
            <button id="publish-plan">发布</button>
            <span id="publish-msg" class="card-hint"></span>
          </div>
        </div>

        <div id="import-panel" class="import-inline" style="display:none;">
          <textarea id="import-text" rows="4" placeholder="customer_project_id,contract_id,month,plan_amount,plan_must_billing_amount,version"></textarea>
          <div class="actions compact-actions">
            <button id="download-template" class="secondary">复制模板头</button>
            <button id="submit-import" class="secondary">提交导入</button>
            <span id="import-msg" class="card-hint"></span>
          </div>
        </div>

        <div class="matrix-filters">
          <label>客户
            <select id="filter-customer"><option value="">全部客户</option></select>
          </label>
          <label>产品
            <select id="filter-product"><option value="">全部产品</option></select>
          </label>
          <label class="matrix-search">关键词（项目名/合同号）
            <input id="keyword" placeholder="输入项目名或合同号" />
          </label>
          <button id="reset-filters" class="secondary">重置</button>
        </div>

        <div class="table-wrap matrix-table-wrap">
          <table class="table matrix-table" id="plan-matrix-table">
            <thead id="plan-matrix-head">
              <tr>
                ${LEFT_COLUMNS.map((c, idx) => `<th class="sticky-col sc-${idx}" style="min-width:${c.width}px;">${c.label}</th>`).join("")}
                ${Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1;
                  const tag = month < currentMonth ? "实际执行" : "计划开票";
                  const cls = month < currentMonth ? "month-actual" : "month-plan";
                  return `<th class="month-col ${cls}">${month}月<br/><span class="month-tag">${tag}</span></th>`;
                }).join("")}
              </tr>
            </thead>
            <tbody id="plan-matrix-body"></tbody>
          </table>
        </div>
      </section>
    `;
  },
  bind() {
    const state = window.__CM_BILLING_PLAN_STATE__;
    const customerSelect = document.getElementById("filter-customer");
    const productSelect = document.getElementById("filter-product");
    const keywordInput = document.getElementById("keyword");
    const resetBtn = document.getElementById("reset-filters");
    const body = document.getElementById("plan-matrix-body");
    const publishMsg = document.getElementById("publish-msg");

    const renderFilterOptions = () => {
      const customers = [...new Set(state.rows.map((r) => r.customer_name).filter(Boolean))].sort((a, b) => a.localeCompare(b));
      const products = [...new Set(state.rows.map((r) => r.product_type).filter(Boolean))].sort((a, b) => a.localeCompare(b));
      customerSelect.innerHTML = `<option value="">全部客户</option>${customers.map((v) => `<option value="${safeText(v)}">${safeText(v)}</option>`).join("")}`;
      productSelect.innerHTML = `<option value="">全部产品</option>${products.map((v) => `<option value="${safeText(v)}">${safeText(v)}</option>`).join("")}`;
    };

    const applyFilters = () => {
      const customer = customerSelect.value.trim().toLowerCase();
      const product = productSelect.value.trim().toLowerCase();
      const keyword = keywordInput.value.trim().toLowerCase();
      state.filteredRows = state.rows.filter((r) => {
        const customerOk = !customer || (r.customer_name || "").toLowerCase() === customer;
        const productOk = !product || (r.product_type || "").toLowerCase() === product;
        const keywordOk =
          !keyword ||
          (r.project_name || "").toLowerCase().includes(keyword) ||
          (r.contract_no || "").toLowerCase().includes(keyword);
        return customerOk && productOk && keywordOk;
      });
      renderRows();
    };

    const renderRows = () => {
      if (!state.filteredRows.length) {
        body.innerHTML = '<tr><td colspan="18" class="empty-note">无匹配数据</td></tr>';
        return;
      }

      body.innerHTML = state.filteredRows
        .map((r, rowIdx) => {
          const fixedCells = LEFT_COLUMNS.map((col, idx) => {
            const value = col.key === "otp_lifetime" || col.key === "otp_target" ? amountOrDash(r[col.key]) : safeText(r[col.key] || "-");
            return `<td class="sticky-col sc-${idx}">${value}</td>`;
          }).join("");

          const monthCells = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            if (month < state.currentMonth) {
              const actualKey = state.actualCols[i];
              return `<td class="amount-cell month-actual-cell">${amountOrDash(r[actualKey])}</td>`;
            }
            const planKey = state.planCols[i];
            const value = r[planKey] ?? "";
            return `<td class="amount-cell month-plan-cell"><input data-row="${rowIdx}" data-col="${planKey}" class="plan-input" value="${safeText(value)}" /></td>`;
          }).join("");
          return `<tr>${fixedCells}${monthCells}</tr>`;
        })
        .join("");

      body.querySelectorAll(".plan-input").forEach((el) => {
        el.oninput = (e) => {
          const input = e.currentTarget;
          const rowIdx = Number(input.dataset.row);
          const col = input.dataset.col;
          state.filteredRows[rowIdx][col] = input.value.trim();

          const key = `${state.filteredRows[rowIdx].customer_project_id}::${state.filteredRows[rowIdx].contract_id}`;
          const allIdx = state.rows.findIndex((x) => `${x.customer_project_id}::${x.contract_id}` === key);
          if (allIdx >= 0) state.rows[allIdx][col] = input.value.trim();
        };
      });
    };

    renderFilterOptions();
    renderRows();

    customerSelect.onchange = applyFilters;
    productSelect.onchange = applyFilters;
    keywordInput.oninput = applyFilters;
    resetBtn.onclick = () => {
      customerSelect.value = "";
      productSelect.value = "";
      keywordInput.value = "";
      applyFilters();
    };

    const panel = document.getElementById("import-panel");
    document.getElementById("toggle-import").onclick = () => {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    };

    document.getElementById("download-template").onclick = async () => {
      const text = "customer_project_id,contract_id,month,plan_amount,plan_must_billing_amount,version";
      await navigator.clipboard?.writeText(text);
    };

    document.getElementById("submit-import").onclick = async () => {
      const text = document.getElementById("import-text").value.trim();
      const msg = document.getElementById("import-msg");
      if (!text) {
        msg.textContent = "请先粘贴导入数据。";
        return;
      }
      const rows = text
        .split("\n")
        .map((line) => line.split(",").map((x) => x.trim()))
        .filter((arr) => arr.length >= 6)
        .map(([customer_project_id, contract_id, month, plan_amount, plan_must_billing_amount, version]) => ({
          customer_project_id,
          contract_id,
          month,
          plan_amount,
          plan_must_billing_amount,
          version,
        }));
      try {
        await postJson("/api/cm/billing/plan-upload", { year: state.year, rows });
        msg.textContent = "导入完成，正在刷新...";
        setTimeout(() => window.location.reload(), 500);
      } catch {
        msg.textContent = "导入失败，请检查格式。";
      }
    };

    document.getElementById("publish-plan").onclick = async () => {
      const rows = toPublishRows(state.rows, state.planCols, state.currentMonth);
      const confirmText = state.publishMeta.exists ? "是否覆盖当前年-月的最终计划" : "是否存为当前年-月的最终计划";
      if (!window.confirm(confirmText)) return;
      publishMsg.textContent = "发布中...";
      try {
        const res = await postJson("/api/cm/billing/plan-publish", {
          year: state.year,
          period_key: state.periodKey,
          rows,
        });
        state.publishMeta.exists = true;
        publishMsg.textContent = `发布成功：${safeText(res.period_key)}（${safeText(res.mode)}）`;
      } catch {
        publishMsg.textContent = "发布失败，请稍后重试。";
      }
    };
  },
};
