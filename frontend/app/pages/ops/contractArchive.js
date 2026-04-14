import { fetchJson } from "../../shared/api.js";
import { renderTaskBar, safeText } from "../../shared/ui.js";

function cardTemplate(r) {
  return `<article class="card archive-card" data-id="${safeText(r.contract_case_id)}">
    <div class="card-title">${safeText(r.contract_case_id)}</div>
    <div><strong>${safeText(r.contract_name || "未命名合同")}</strong></div>
    <div class="card-hint">客户：${safeText(r.customer_name || "-")}</div>
    <div class="card-hint">产品：${safeText(r.product_name || "-")}</div>
    <div class="card-hint">Formal：${safeText(r.formal_contract_id || "-")}</div>
  </article>`;
}

function renderVersionOptions(versions, selected) {
  return versions
    .map((v) => `<option value="${safeText(v.version_type)}" ${v.version_type === selected ? "selected" : ""}>${safeText(v.version_label)}</option>`)
    .join("");
}

export default {
  title: "历史合同档案库",
  type: "画廊+版本详情",
  async render({ query }) {
    const dummyId = query.get("dummy_id") || "";
    return `
      ${renderTaskBar("按合同号/客户/产品/合同名搜索，进入详情后可切换草拟/单签/双签版本并在线预览。")}
      <div class="form-grid">
        <div class="form-item"><label>Dummy 合同号</label><input id="a-dummy" value="${safeText(dummyId)}" /></div>
        <div class="form-item"><label>Formal 合同号</label><input id="a-formal" /></div>
        <div class="form-item"><label>客户名</label><input id="a-customer" /></div>
        <div class="form-item"><label>产品名</label><input id="a-product" /></div>
        <div class="form-item"><label>合同名</label><input id="a-contract" /></div>
      </div>
      <div class="actions"><button id="archive-search">搜索</button></div>
      <div class="detail-layout" style="margin-top:12px;">
        <section>
          <div id="archive-gallery" class="grid"></div>
        </section>
        <aside class="detail-side" id="archive-detail"><div class="empty-note">请选择左侧合同卡片查看版本详情。</div></aside>
      </div>
    `;
  },
  bind({ query }) {
    const gallery = document.getElementById("archive-gallery");
    const detail = document.getElementById("archive-detail");

    const inputs = {
      dummy_id: document.getElementById("a-dummy"),
      formal_id: document.getElementById("a-formal"),
      customer_name: document.getElementById("a-customer"),
      product_name: document.getElementById("a-product"),
      contract_name: document.getElementById("a-contract"),
    };

    inputs.dummy_id.value = query.get("dummy_id") || inputs.dummy_id.value;

    const readFilters = () => Object.fromEntries(Object.entries(inputs).map(([k, el]) => [k, el.value.trim()]));

    const renderDetail = async (contractCaseId) => {
      const versions = await fetchJson(`/api/ops/contracts/archive/versions?contract_case_id=${encodeURIComponent(contractCaseId)}`, []);
      if (!versions.length) {
        detail.innerHTML = '<div class="empty-note">该合同暂无版本文件。</div>';
        return;
      }
      const selected = versions[0].version_type;
      const renderPreview = (versionType) => {
        const current = versions.find((v) => v.version_type === versionType) || versions[0];
        detail.innerHTML = `
          <h3>档案详情：${safeText(contractCaseId)}</h3>
          <div class="actions" style="justify-content:space-between;align-items:flex-end;">
            <div class="form-item" style="flex:1;margin:0;">
              <label>版本切换</label>
              <select id="version-switch">${renderVersionOptions(versions, current.version_type)}</select>
            </div>
            <a href="${safeText(current.file_url)}" download><button class="secondary">下载当前版本</button></a>
          </div>
          <iframe src="${safeText(current.file_url)}" title="pdf-preview" style="width:100%;height:360px;border:1px solid var(--border);border-radius:8px;"></iframe>
          <p class="card-hint">说明：当前为轻量在线预览（iframe）。</p>
        `;
        document.getElementById("version-switch").onchange = (e) => renderPreview(e.target.value);
      };
      renderPreview(selected);
    };

    const load = async () => {
      const f = readFilters();
      const params = new URLSearchParams();
      Object.entries(f).forEach(([k, v]) => v && params.set(k, v));
      const rows = await fetchJson(`/api/ops/contracts/archive?${params.toString()}`, []);
      gallery.innerHTML = rows.length ? rows.map(cardTemplate).join("") : '<div class="empty-note">未找到匹配合同档案</div>';
      gallery.querySelectorAll(".archive-card").forEach((card) => {
        card.style.cursor = "pointer";
        card.onclick = () => renderDetail(card.dataset.id);
      });
    };

    document.getElementById("archive-search").onclick = load;
    load();
  },
};
