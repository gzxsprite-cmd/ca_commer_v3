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

function parseTags(text) {
  return String(text || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function compactTags(text) {
  const tags = parseTags(text);
  if (!tags.length) return "-";
  if (tags.length === 1) return tags[0];
  return `${tags[0]} +${tags.length - 1}`;
}

function tagChips(text) {
  const tags = parseTags(text);
  return tags.length ? tags.map((t) => `<span class="badge">${safeText(t)}</span>`).join(" ") : "-";
}

function renderRow(row) {
  const st = cnStatus(row.execution_status || "");
  return `<tr data-id="${safeText(row.contract_case_id)}">
    <td>${safeText(row.contract_case_id)}</td>
    <td>${safeText(row.formal_contract_id || row.contract_code || "-")}</td>
    <td>${safeText(row.customer_name || "-")}</td>
    <td>${safeText(row.project_name || "-")}</td>
    <td>${safeText(row.product_name || "-")}</td>
    <td>${safeText(row.total_amount || "-")}</td>
    <td>${safeText(row.payment_terms || "-")}</td>
    <td>${safeText(compactTags(row.se3_summary))}</td>
    <td>${safeText(compactTags(row.pms_summary))}</td>
    <td><span class="badge ${badgeClass(st)}">${safeText(st)}</span></td>
    <td>${safeText(row.current_owner_role || "-")}</td>
    <td>${safeText(row.next_step_label || "-")}</td>
  </tr>`;
}

function renderDetail(row) {
  if (!row) return '<div class="empty-note">点击列表中的合同查看完整链路详情。</div>';
  return `
    <div class="focus-panel">
      <h3>${safeText(row.contract_case_id)}</h3>
      <p><strong>生命周期：</strong>${safeText(row.flow_chain || "-")}</p>
      <p><strong>当前责任人：</strong>${safeText(row.current_owner_role || "-")} ｜ <strong>下一步：</strong>${safeText(row.next_step_label || "-")}</p>
      <p><strong>当前步骤：</strong>${safeText(row.current_step || "-")} ｜ <strong>下一步骤：</strong>${safeText(row.next_step || "-")}</p>

      <h4>原始与提取信息</h4>
      <p><strong>原文件：</strong>${safeText(row.uploaded_file_name || "-")}</p>
      <p><strong>客户：</strong>${safeText(row.customer_name || "-")} ｜ <strong>项目：</strong>${safeText(row.project_name || "-")} ｜ <strong>产品：</strong>${safeText(row.product_name || "-")}</p>
      <p><strong>合同金额：</strong>${safeText(row.total_amount || "-")} ｜ <strong>分期节点：</strong>${safeText(row.payment_terms || "-")}</p>

      <h4>匹配与分配</h4>
      <div class="chip-row"><strong>SE3：</strong> ${tagChips(row.se3_summary)}</div>
      <div class="chip-row"><strong>PMS：</strong> ${tagChips(row.pms_summary)}</div>
      <p><strong>分配结果：</strong>${safeText(row.allocation_summary || "-")}</p>
      <p><strong>节点拆分：</strong>${safeText(row.payment_terms || "-")}（按分配金额自动折算）</p>
    </div>
  `;
}

export default {
  title: "合同进度追踪",
  type: "列表+详情",
  async render({ query }) {
    return `
      ${renderTaskBar("紧凑筛选：关键词（ID/客户/项目）+流转状态；列表展示 one-to-many 匹配摘要。")}
      <div class="compact-filter-bar">
        <input id="f-q" placeholder="搜索 ID / 客户 / 项目" value="${safeText(query.get("q") || "")}" />
        <select id="f-status">${statusOptions
          .map((o) => `<option value="${o.value}" ${o.value === (query.get("status") || "") ? "selected" : ""}>${o.label}</option>`)
          .join("")}</select>
        <button id="f-apply">查询</button>
      </div>
      <div class="tracking-layout">
        <section>
          <div class="table-wrap"><table class="table"><thead><tr>
            <th>Dummy合同号</th><th>正式合同号</th><th>客户名</th><th>项目名</th><th>产品名</th><th>合同金额</th><th>分期节点与比例</th><th>SE3匹配</th><th>PMS匹配</th><th>流转状态</th><th>当前责任人</th><th>下一步</th>
          </tr></thead><tbody id="tracking-body"><tr><td colspan="12" class="empty-note">加载中...</td></tr></tbody></table></div>
        </section>
        <aside class="detail-side" id="tracking-detail"></aside>
      </div>
    `;
  },
  bind({ query }) {
    const qInput = document.getElementById("f-q");
    const statusInput = document.getElementById("f-status");
    const body = document.getElementById("tracking-body");
    const detail = document.getElementById("tracking-detail");

    const load = async () => {
      const params = new URLSearchParams();
      const q = qInput.value.trim();
      const status = statusInput.value.trim();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const rows = await fetchJson(`/api/ops/contracts/tracking?${params.toString()}`, []);
      body.innerHTML = rows.length ? rows.map(renderRow).join("") : '<tr><td colspan="12" class="empty-note">暂无匹配记录</td></tr>';
      detail.innerHTML = renderDetail(null);
      body.querySelectorAll("tr[data-id]").forEach((tr) => {
        tr.onclick = () => {
          const row = rows.find((x) => x.contract_case_id === tr.dataset.id);
          detail.innerHTML = renderDetail(row);
        };
      });
    };

    document.getElementById("f-apply").onclick = () => {
      const params = new URLSearchParams();
      if (qInput.value.trim()) params.set("q", qInput.value.trim());
      if (statusInput.value.trim()) params.set("status", statusInput.value.trim());
      location.hash = `/ops/contracts/tracking${params.toString() ? `?${params.toString()}` : ""}`;
      load();
    };

    qInput.value = query.get("q") || query.get("dummy_id") || "";
    statusInput.value = query.get("status") || "";
    load();
  },
};
