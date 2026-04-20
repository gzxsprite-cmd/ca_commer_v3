import { fetchJson, postJson } from "../../shared/api.js";
import { renderTaskBar, safeText } from "../../shared/ui.js";

function monthCols(prefix) {
  return Array.from({ length: 12 }, (_, i) => `${prefix}_${String(i + 1).padStart(2, "0")}`);
}

export default {
  title: "开票计划（CM维护）",
  type: "计划维护",
  async render() {
    const year = new Date().getFullYear();
    const data = await fetchJson(`/api/cm/billing/plan-grid?year=${year}`, { rows: [] });
    const rows = data.rows || [];
    const planCols = monthCols("plan");
    const actualCols = monthCols("actual");
    return `
      ${renderTaskBar("CM按月维护本年度剩余月份开票计划：先支持Excel上传，后续可在线编辑。")}
      <section class="focus-panel">
        <h3>计划导入</h3>
        <p class="card-hint">请按 customer_project + contract 粒度上传本年计划。当前为 demo 级解析：支持粘贴 CSV 文本模拟 Excel 导入。</p>
        <div class="actions">
          <input id="plan-year" value="${safeText(data.year || year)}" style="width:120px;" />
          <button id="download-template" class="secondary">复制模板头</button>
          <button id="open-import" class="secondary">打开导入面板</button>
        </div>
        <div id="import-panel" style="display:none;margin-top:10px;">
          <textarea id="import-text" rows="7" placeholder="customer_project_id,contract_id,month,plan_amount,plan_must_billing_amount,version"></textarea>
          <div class="actions">
            <button id="submit-import">提交导入</button>
            <span id="import-msg"></span>
          </div>
        </div>
      </section>
      <section class="focus-panel" style="margin-top:10px;">
        <h3>计划与历史执行对照（${safeText(data.year || year)}）</h3>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>客户</th><th>项目</th><th>产品</th><th>合同编号</th>
                ${planCols.map((c) => `<th>计划${c.split("_")[1]}月</th>`).join("")}
                ${actualCols.map((c) => `<th>实际${c.split("_")[1]}月</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${
                rows.length
                  ? rows
                      .map(
                        (r) => `<tr>
                        <td>${safeText(r.customer_name || "-")}</td>
                        <td>${safeText(r.project_name || "-")}</td>
                        <td>${safeText(r.product_type || "-")}</td>
                        <td>${safeText(r.contract_no || "-")}</td>
                        ${planCols.map((c) => `<td>${safeText(r[c] || "")}</td>`).join("")}
                        ${actualCols.map((c) => `<td class="text-muted">${safeText(r[c] || "")}</td>`).join("")}
                      </tr>`
                      )
                      .join("")
                  : '<tr><td colspan="28" class="empty-note">暂无计划数据</td></tr>'
              }
            </tbody>
          </table>
        </div>
      </section>
    `;
  },
  bind() {
    const panel = document.getElementById("import-panel");
    document.getElementById("open-import").onclick = () => {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    };
    document.getElementById("download-template").onclick = async () => {
      const text = "customer_project_id,contract_id,month,plan_amount,plan_must_billing_amount,version";
      await navigator.clipboard?.writeText(text);
    };
    document.getElementById("submit-import").onclick = async () => {
      const year = document.getElementById("plan-year").value.trim();
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
        await postJson("/api/cm/billing/plan-upload", { year, rows });
        msg.textContent = "导入完成，正在刷新...";
        setTimeout(() => window.location.reload(), 500);
      } catch {
        msg.textContent = "导入失败，请检查格式。";
      }
    };
  },
};
