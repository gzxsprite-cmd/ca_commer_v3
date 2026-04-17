import { fetchJson, postJson } from "../../shared/api.js";
import { badgeClass, cnStatus } from "../../shared/status.js";
import { renderTaskBar, safeText } from "../../shared/ui.js";

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "pending_cm_confirm", label: "待CM确认" },
  { value: "pending_ca_sign", label: "待CA签字" },
  { value: "pending_cm_send", label: "待CM寄送" },
  { value: "pending_cm_archive", label: "待CM归档" },
  { value: "completed", label: "关闭-已归档" },
  { value: "archive_exception", label: "关闭-归档异常" },
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

function renderCmAction(row) {
  const st = row.execution_status;
  if (st === "pending_ca_sign") {
    return `<button class="secondary cm-send-btn" data-id="${safeText(row.contract_case_id)}">切到待CM寄送</button>`;
  }
  if (st === "pending_cm_archive") {
    return `<span class="badge">需进入详情归档</span>`;
  }
  return "-";
}

function renderRow(row, isCm) {
  const status = cnStatus(row.execution_status || "");
  const stage = row.execution_status === "submitted_in_review" ? "pending_cm_confirm" : row.execution_status;
  const formalId = stage === "pending_cm_confirm" ? "" : row.formal_contract_id || "";
  return `<tr>
    <td>${safeText(row.contract_case_id || "-")}</td>
    <td>${safeText(formalId || "-")}</td>
    <td>${safeText(row.customer_name || "-")}</td>
    <td>${safeText(row.project_name || "-")}</td>
    <td>${safeText(row.product_name || "-")}</td>
    <td>${safeText(compactOneToMany(row.se3_summary))}</td>
    <td>${safeText(compactOneToMany(row.pms_summary))}</td>
    <td>${safeText(row.total_amount || "-")} / ${safeText(row.payment_terms || "-")}</td>
    <td><span class="badge ${badgeClass(status)}">${safeText(status)}</span></td>
    <td>${isCm ? renderCmAction(row) : "-"}</td>
    <td><a href="#/ops/contracts/tracking/detail?id=${encodeURIComponent(row.contract_case_id || "")}"><button class="secondary">查看详情</button></a></td>
  </tr>`;
}

export default {
  title: "合同跟进列表",
  type: "列表页",
  async render({ query, state }) {
    const isCm = state.role === "CM";
    return `
      ${renderTaskBar(isCm ? "CM主队列：支持按正式合同号检索与模拟扫码定位。" : "合同流转事件摘要列表。")}
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
        <div>
          <h3 style="margin:0;">${isCm ? "CM 合同跟进队列" : "合同流转事件列表"}</h3>
          <div class="card-hint">${isCm ? "列表仅处理轻量动作，归档关闭必须进入详情页" : "浏览摘要并进入详情页"}</div>
        </div>
        <div class="compact-filter-bar" style="margin:0;min-width:640px;max-width:860px;">
          <input id="f-q" placeholder="搜索正式合同号 / 客户 / 项目" value="${safeText(query.get("q") || "")}" />
          <select id="f-status">${statusOptions
            .map((o) => `<option value="${o.value}" ${o.value === (query.get("status") || "") ? "selected" : ""}>${o.label}</option>`)
            .join("")}</select>
          <button id="f-apply">查询</button>
        </div>
      </div>
      ${isCm ? '<div class="actions" style="margin-top:8px;"><button class="secondary" id="scan-sim-btn">模拟扫码定位正式合同</button></div>' : ""}

      <div class="table-wrap" style="margin-top:10px;">
        <table class="table">
          <thead><tr>
            <th>Dummy合同号</th><th>正式合同号</th><th>客户名</th><th>项目名</th><th>产品名</th><th>报价单匹配摘要</th><th>PMS匹配摘要</th><th>金额/支付节点摘要</th><th>流转状态</th><th>${
              isCm ? "轻量操作" : "操作"
            }</th><th>详情</th>
          </tr></thead>
          <tbody id="tracking-list-body"><tr><td colspan="11" class="empty-note">加载中...</td></tr></tbody>
        </table>
      </div>
    `;
  },
  bind({ query, state }) {
    const isCm = state.role === "CM";
    const qInput = document.getElementById("f-q");
    const statusInput = document.getElementById("f-status");
    const body = document.getElementById("tracking-list-body");

    let cachedRows = [];

    const bindCmActions = () => {
      if (!isCm) return;
      body.querySelectorAll(".cm-send-btn").forEach((btn) => {
        btn.onclick = async () => {
          const contractId = btn.dataset.id;
          const needBackup = confirm("是否先上传CA单签备份？点击“确定”进入详情上传；点击“取消”直接切到待CM寄送。");
          if (needBackup) {
            location.hash = `/ops/contracts/tracking/detail?id=${encodeURIComponent(contractId)}&intent=upload-ca-backup`;
            return;
          }
          await postJson("/api/ops/contracts/cm-action", { action: "cm_to_send", contract_case_id: contractId });
          load();
        };
      });
    };

    const load = async () => {
      const params = new URLSearchParams();
      if (qInput.value.trim()) params.set("q", qInput.value.trim());
      if (statusInput.value.trim()) params.set("status", statusInput.value.trim());
      cachedRows = await fetchJson(`/api/ops/contracts/tracking?${params.toString()}`, []);
      body.innerHTML = cachedRows.length
        ? cachedRows.map((row) => renderRow(row, isCm)).join("")
        : '<tr><td colspan="11" class="empty-note">暂无匹配记录</td></tr>';
      bindCmActions();
    };

    document.getElementById("f-apply").onclick = () => {
      const params = new URLSearchParams();
      if (qInput.value.trim()) params.set("q", qInput.value.trim());
      if (statusInput.value.trim()) params.set("status", statusInput.value.trim());
      location.hash = `/ops/contracts/tracking${params.toString() ? `?${params.toString()}` : ""}`;
      load();
    };

    if (isCm) {
      const scanBtn = document.getElementById("scan-sim-btn");
      if (scanBtn) {
        scanBtn.onclick = () => {
          const sample = cachedRows.find((r) => r.formal_contract_id)?.formal_contract_id || "C-2026-001";
          qInput.value = sample;
          load();
        };
      }
    }

    qInput.value = query.get("q") || "";
    statusInput.value = query.get("status") || "";
    load();
  },
};
