import { fetchJson } from "../../shared/api.js";
import { badgeClass, cnStatus } from "../../shared/status.js";
import { renderTaskBar, safeText } from "../../shared/ui.js";

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "submitted_in_review", label: "submitted in review" },
  { value: "pending_cm_confirm", label: "pending cm confirm" },
  { value: "pending_ca_sign", label: "pending ca sign" },
  { value: "pending_cm_send", label: "pending cm send" },
  { value: "pending_cm_archive", label: "pending cm archive" },
  { value: "completed", label: "completed" },
];

function compactOneToMany(text) {
  const tags = String(text || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (!tags.length) return "-";
  if (tags.length === 1) return tags[0];
  return `${tags[0]} +${tags.length - 1}`;
}

function renderRow(row) {
  const status = cnStatus(row.execution_status || "");
  return `<tr>
    <td>${safeText(row.contract_case_id || "-")}</td>
    <td>${safeText(row.formal_contract_id || row.contract_code || "-")}</td>
    <td>${safeText(row.customer_name || "-")}</td>
    <td>${safeText(row.project_name || "-")}</td>
    <td>${safeText(row.product_name || "-")}</td>
    <td>${safeText(compactOneToMany(row.se3_summary))}</td>
    <td>${safeText(compactOneToMany(row.pms_summary))}</td>
    <td>${safeText(row.total_amount || "-")} / ${safeText(row.payment_terms || "-")}</td>
    <td><span class="badge ${badgeClass(status)}">${safeText(status)}</span></td>
    <td><a href="#/ops/contracts/tracking/detail?id=${encodeURIComponent(row.contract_case_id || "")}"><button class="secondary">查看详情</button></a></td>
  </tr>`;
}

export default {
  title: "合同进度追踪",
  type: "列表页",
  async render({ query }) {
    return `
      ${renderTaskBar("快速定位合同流转事件：关键词检索 + 状态筛选。")}
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
        <div>
          <h3 style="margin:0;">合同流转事件列表</h3>
          <div class="card-hint">浏览摘要并进入完整详情页</div>
        </div>
        <div class="compact-filter-bar" style="margin:0;min-width:560px;max-width:720px;">
          <input id="f-q" placeholder="搜索 ID / 客户 / 项目" value="${safeText(query.get("q") || "")}" />
          <select id="f-status">${statusOptions
            .map((o) => `<option value="${o.value}" ${o.value === (query.get("status") || "") ? "selected" : ""}>${o.label}</option>`)
            .join("")}</select>
          <button id="f-apply">查询</button>
        </div>
      </div>

      <div class="table-wrap" style="margin-top:10px;">
        <table class="table">
          <thead><tr>
            <th>Dummy合同号</th><th>正式合同号</th><th>客户名</th><th>项目名</th><th>产品名</th><th>报价单匹配摘要</th><th>PMS匹配摘要</th><th>金额/支付节点摘要</th><th>流转状态</th><th>查看详情</th>
          </tr></thead>
          <tbody id="tracking-list-body"><tr><td colspan="10" class="empty-note">加载中...</td></tr></tbody>
        </table>
      </div>
    `;
  },
  bind({ query }) {
    const qInput = document.getElementById("f-q");
    const statusInput = document.getElementById("f-status");
    const body = document.getElementById("tracking-list-body");

    const load = async () => {
      const params = new URLSearchParams();
      if (qInput.value.trim()) params.set("q", qInput.value.trim());
      if (statusInput.value.trim()) params.set("status", statusInput.value.trim());
      const rows = await fetchJson(`/api/ops/contracts/tracking?${params.toString()}`, []);
      body.innerHTML = rows.length ? rows.map(renderRow).join("") : '<tr><td colspan="10" class="empty-note">暂无匹配记录</td></tr>';
    };

    document.getElementById("f-apply").onclick = () => {
      const params = new URLSearchParams();
      if (qInput.value.trim()) params.set("q", qInput.value.trim());
      if (statusInput.value.trim()) params.set("status", statusInput.value.trim());
      location.hash = `/ops/contracts/tracking${params.toString() ? `?${params.toString()}` : ""}`;
      load();
    };

    qInput.value = query.get("q") || "";
    statusInput.value = query.get("status") || "";
    load();
  },
};
