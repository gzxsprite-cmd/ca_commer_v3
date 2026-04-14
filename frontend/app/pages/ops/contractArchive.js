import { fetchJson } from "../../shared/api.js";
import { renderTaskBar, safeText } from "../../shared/ui.js";

function cardTemplate(r) {
  return `<article class="card archive-card" data-id="${safeText(r.contract_case_id)}">
    <div class="card-title">${safeText(r.contract_case_id)}</div>
    <div><strong>${safeText(r.contract_name || "未命名合同")}</strong></div>
    <div class="card-hint">客户：${safeText(r.customer_name || "-")}</div>
    <div class="card-hint">Formal：${safeText(r.formal_contract_id || "-")}</div>
  </article>`;
}

export default {
  title: "历史合同档案库",
  type: "画廊+大预览",
  async render({ query }) {
    return `
      ${renderTaskBar("紧凑搜索 + 左侧档案画廊 + 右侧大预览。")}
      <div class="compact-filter-bar">
        <input id="a-q" placeholder="搜索 ID / 客户 / 合同名" value="${safeText(query.get("q") || query.get("dummy_id") || "")}" />
        <select id="a-version">
          <option value="">全部版本</option>
          <option value="draft">草拟</option>
          <option value="single_sign">单签</option>
          <option value="double_sign">双签</option>
        </select>
        <button id="archive-search">搜索</button>
      </div>
      <div class="archive-layout">
        <section id="archive-gallery" class="grid"></section>
        <aside class="detail-side archive-preview-pane" id="archive-detail"><div class="empty-note">请选择左侧合同卡片查看详情。</div></aside>
      </div>
    `;
  },
  bind({ query }) {
    const qInput = document.getElementById("a-q");
    const versionFilter = document.getElementById("a-version");
    const gallery = document.getElementById("archive-gallery");
    const detail = document.getElementById("archive-detail");

    const renderDetail = async (contractCaseId) => {
      const rows = await fetchJson(`/api/ops/contracts/archive/versions?contract_case_id=${encodeURIComponent(contractCaseId)}`, []);
      const wanted = versionFilter.value.trim();
      const versions = wanted ? rows.filter((x) => x.version_type === wanted) : rows;
      if (!versions.length) {
        detail.innerHTML = '<div class="empty-note">该合同无匹配版本。</div>';
        return;
      }

      const paint = (versionType) => {
        const current = versions.find((v) => v.version_type === versionType) || versions[0];
        detail.innerHTML = `
          <h3>合同档案：${safeText(contractCaseId)}</h3>
          <div class="archive-toolbar">
            <div class="form-item" style="margin:0;">
              <label>版本切换</label>
              <select id="archive-version-switch">${versions
                .map(
                  (v) => `<option value="${safeText(v.version_type)}" ${v.version_type === current.version_type ? "selected" : ""}>${safeText(
                    v.version_label
                  )}</option>`
                )
                .join("")}</select>
            </div>
            <a href="${safeText(current.file_url)}" download><button class="secondary">下载当前版本</button></a>
          </div>
          <iframe src="${safeText(current.file_url)}" title="archive-pdf-preview" class="archive-preview-frame"></iframe>
        `;
        document.getElementById("archive-version-switch").onchange = (e) => paint(e.target.value);
      };

      paint(versions[0].version_type);
    };

    const load = async () => {
      const q = qInput.value.trim();
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const rows = await fetchJson(`/api/ops/contracts/archive?${params.toString()}`, []);
      gallery.innerHTML = rows.length ? rows.map(cardTemplate).join("") : '<div class="empty-note">未找到匹配档案</div>';
      gallery.querySelectorAll(".archive-card").forEach((card) => {
        card.style.cursor = "pointer";
        card.onclick = () => renderDetail(card.dataset.id);
      });
    };

    document.getElementById("archive-search").onclick = () => {
      const params = new URLSearchParams();
      if (qInput.value.trim()) params.set("q", qInput.value.trim());
      location.hash = `/ops/contracts/archive${params.toString() ? `?${params.toString()}` : ""}`;
      load();
    };

    qInput.value = query.get("q") || query.get("dummy_id") || "";
    load();
  },
};
