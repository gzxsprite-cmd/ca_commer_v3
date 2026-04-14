import { fetchJson } from "../../shared/api.js";
import { renderTaskBar, safeText } from "../../shared/ui.js";

function splitTags(text) {
  return String(text || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function renderTags(title, text) {
  const tags = splitTags(text);
  return `
    <h4>${title}</h4>
    <div class="chip-row">${tags.length ? tags.map((t) => `<span class="badge">${safeText(t)}</span>`).join(" ") : '<span class="empty-note">暂无</span>'}</div>
  `;
}

export default {
  title: "合同进度详情",
  type: "详情页",
  async render({ query }) {
    const id = query.get("id") || "";
    const row = id ? await fetchJson(`/api/ops/contracts/tracking/detail?contract_case_id=${encodeURIComponent(id)}`, null) : null;
    if (!row || !row.contract_case_id) {
      return `${renderTaskBar("返回列表重新选择合同。")}<div class="empty-note">未找到合同详情。</div><div class="actions"><a href="#/ops/contracts/tracking"><button class="secondary">返回列表</button></a></div>`;
    }

    return `
      ${renderTaskBar("单合同完整流转详情。")}
      <div class="actions" style="justify-content:space-between;">
        <h3 style="margin:0;">合同流转详情：${safeText(row.contract_case_id)}</h3>
        <a href="#/ops/contracts/tracking"><button class="secondary">返回列表</button></a>
      </div>

      <div class="focus-panel" style="margin-top:10px;">
        <h4>流转链路（5步）</h4>
        <ol>
          <li>AM登记</li><li>CM校验</li><li>CA签字</li><li>CM寄送</li><li>CM归档</li>
        </ol>
        <p><strong>当前步骤：</strong>${safeText(row.current_step || "-")}</p>
        <p><strong>当前责任人：</strong>${safeText(row.current_owner_role || "-")}</p>
        <p><strong>下一步到谁：</strong>${safeText(row.next_step_label || row.next_step || "-")}</p>
      </div>

      <div class="detail-layout" style="margin-top:10px;grid-template-columns:1fr 1fr;">
        <section class="focus-panel">
          <h4>合同基础信息</h4>
          <p><strong>Dummy合同号：</strong>${safeText(row.contract_case_id || "-")}</p>
          <p><strong>正式合同号：</strong>${safeText(row.formal_contract_id || row.contract_code || "-")}</p>
          <p><strong>客户名：</strong>${safeText(row.customer_name || "-")}</p>
          <p><strong>合同名：</strong>${safeText(row.contract_name || "-")}</p>
          <p><strong>产品名：</strong>${safeText(row.product_name || "-")}</p>
          <p><strong>合同金额：</strong>${safeText(row.total_amount || "-")}</p>
          <p><strong>支付节点与比例：</strong>${safeText(row.payment_terms || "-")}</p>

          ${renderTags("SE3报价单匹配清单", row.se3_summary)}
          ${renderTags("PMS项目匹配清单", row.pms_summary)}
        </section>

        <aside class="decision-panel">
          <h4>关联结果</h4>
          <p><strong>金额分配结果：</strong>${safeText(row.allocation_summary || "-")}</p>
          <p><strong>分期节点金额拆分：</strong>基于支付节点比例与分配金额折算（见分配结果）。</p>

          <h4>文件区</h4>
          <p><strong>原文件预览入口：</strong>${safeText(row.uploaded_file_name || "-")}</p>
          <div class="actions">
            <button class="secondary" disabled>预览入口（预留）</button>
            <button class="secondary" disabled>下载（预留）</button>
          </div>
        </aside>
      </div>
    `;
  },
};
