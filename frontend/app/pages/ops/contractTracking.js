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

function rowStatus(row) {
  const normalized = cnStatus(row.execution_status || row.flow_status || "");
  return normalized;
}

function renderRow(row) {
  return `<tr data-id="${safeText(row.contract_case_id)}">
    <td>${safeText(row.contract_case_id)}</td>
    <td>${safeText(row.contract_code || "-")}</td>
    <td>${safeText(row.formal_contract_id || "-")}</td>
    <td>${safeText(row.customer_name || "-")}</td>
    <td>${safeText(row.project_name || "-")}</td>
    <td>${safeText(row.se3_summary || "-")}</td>
    <td>${safeText(row.pms_summary || "-")}</td>
    <td><span class="badge ${badgeClass(rowStatus(row))}">${safeText(rowStatus(row))}</span></td>
    <td>${safeText(row.current_owner_role || "-")}</td>
    <td>${safeText(row.next_step_label || "-")}</td>
  </tr>`;
}

function renderDetail(row) {
  if (!row) return '<div class="empty-note">点击一条合同记录，查看完整注册信息与流转详情。</div>';
  return `
    <div class="focus-panel">
      <h3>合同详情：${safeText(row.contract_case_id)}</h3>
      <div class="form-grid">
        <div><strong>客户名：</strong>${safeText(row.customer_name || "-")}</div>
        <div><strong>客户合同号：</strong>${safeText(row.customer_contract_no || "-")}</div>
        <div><strong>合同名称：</strong>${safeText(row.contract_name || "-")}</div>
        <div><strong>产品名：</strong>${safeText(row.product_name || "-")}</div>
        <div><strong>项目名：</strong>${safeText(row.project_name || "-")}</div>
        <div><strong>总金额：</strong>${safeText(row.total_amount || "-")}</div>
        <div><strong>SE3匹配：</strong>${safeText(row.se3_summary || "-")}</div>
        <div><strong>PMS匹配：</strong>${safeText(row.pms_summary || "-")}</div>
      </div>
      <hr />
      <p><strong>提取结果：</strong>${safeText(row.extract_summary || "-")}</p>
      <p><strong>分配结果：</strong>${safeText(row.allocation_summary || "-")}</p>
      <p><strong>完整流转链：</strong>${safeText(row.flow_chain || "-")}</p>
      <p><strong>当前步骤：</strong>${safeText(row.current_step || "-")} ｜ <strong>下一步：</strong>${safeText(row.next_step || "-")}</p>
    </div>
  `;
}

export default {
  title: "合同进度追踪",
  type: "列表+详情",
  async render({ query }) {
    const status = query.get("status") || "";
    const dummyId = query.get("dummy_id") || "";
    return `
      ${renderTaskBar("支持按 Dummy/Formal 合同号、客户名、项目名、流转状态筛选；点击行查看详情。")}
      <div class="form-grid">
        <div class="form-item"><label>Dummy 合同号</label><input id="f-dummy" value="${safeText(dummyId)}" placeholder="如 DMY-20260414-0001" /></div>
        <div class="form-item"><label>Formal 合同号</label><input id="f-formal" placeholder="如 C-2026-001" /></div>
        <div class="form-item"><label>客户名</label><input id="f-customer" placeholder="客户名关键词" /></div>
        <div class="form-item"><label>项目名</label><input id="f-project" placeholder="项目名关键词" /></div>
        <div class="form-item"><label>流转状态</label>
          <select id="f-status">${statusOptions
            .map((o) => `<option value="${o.value}" ${o.value === status ? "selected" : ""}>${o.label}</option>`)
            .join("")}</select>
        </div>
      </div>
      <div class="actions"><button id="apply-filters">应用筛选</button></div>
      <div class="detail-layout" style="margin-top:12px;">
        <section>
          <div class="table-wrap"><table class="table"><thead><tr>
            <th>Dummy合同号</th><th>Formal合同号</th><th>正式合同号</th><th>客户名</th><th>项目名</th><th>SE3匹配</th><th>PMS匹配</th><th>流转状态</th><th>当前责任人</th><th>下一步</th>
          </tr></thead><tbody id="tracking-body"><tr><td colspan="10" class="empty-note">加载中...</td></tr></tbody></table></div>
        </section>
        <aside class="detail-side" id="tracking-detail"></aside>
      </div>
    `;
  },
  bind({ query }) {
    const statusInput = document.getElementById("f-status");
    const dummyInput = document.getElementById("f-dummy");
    const formalInput = document.getElementById("f-formal");
    const customerInput = document.getElementById("f-customer");
    const projectInput = document.getElementById("f-project");
    const body = document.getElementById("tracking-body");
    const detail = document.getElementById("tracking-detail");

    const readFilters = () => ({
      status: statusInput.value.trim(),
      dummy_id: dummyInput.value.trim(),
      formal_id: formalInput.value.trim(),
      customer_name: customerInput.value.trim(),
      project_name: projectInput.value.trim(),
    });

    const syncHash = (f) => {
      const params = new URLSearchParams();
      Object.entries(f).forEach(([k, v]) => v && params.set(k, v));
      location.hash = `/ops/contracts/tracking${params.toString() ? `?${params.toString()}` : ""}`;
    };

    const load = async () => {
      const f = readFilters();
      const params = new URLSearchParams();
      Object.entries(f).forEach(([k, v]) => v && params.set(k, v));
      const rows = await fetchJson(`/api/ops/contracts/tracking?${params.toString()}`, []);
      body.innerHTML = rows.length ? rows.map(renderRow).join("") : '<tr><td colspan="10" class="empty-note">暂无匹配记录</td></tr>';
      detail.innerHTML = renderDetail(null);
      body.querySelectorAll("tr[data-id]").forEach((tr) => {
        tr.onclick = () => {
          const row = rows.find((x) => x.contract_case_id === tr.dataset.id);
          detail.innerHTML = renderDetail(row);
        };
      });
    };

    document.getElementById("apply-filters").onclick = () => {
      const f = readFilters();
      syncHash(f);
      load();
    };

    statusInput.value = query.get("status") || statusInput.value;
    dummyInput.value = query.get("dummy_id") || dummyInput.value;
    load();
  },
};
