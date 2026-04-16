import { fetchJson, postJson } from "../../shared/api.js";
import { cnStatus } from "../../shared/status.js";
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

function comparisonBadge(row) {
  if (row.comparison_status === "ok") return '<span class="badge status-success">内容核对无误</span>';
  if (row.comparison_status === "warning") return '<span class="badge status-warning">存在差异，请核对</span>';
  return '<span class="badge">待核对</span>';
}

export default {
  title: "合同跟进详情",
  type: "详情页",
  async render({ query, state }) {
    const id = query.get("id") || "";
    const isCm = state.role === "CM";
    const row = id ? await fetchJson(`/api/ops/contracts/tracking/detail?contract_case_id=${encodeURIComponent(id)}`, null) : null;
    if (!row || !row.contract_case_id) {
      return `${renderTaskBar("返回列表重新选择合同。")}<div class="empty-note">未找到合同详情。</div><div class="actions"><a href="#/ops/contracts/tracking"><button class="secondary">返回列表</button></a></div>`;
    }

    return `
      ${renderTaskBar("CM详情动作：校验编号、寄送推进、归档核对与异常关闭。")}
      <div class="actions" style="justify-content:space-between;">
        <h3 style="margin:0;">合同跟进详情：${safeText(row.contract_case_id)}</h3>
        <a href="#/ops/contracts/tracking"><button class="secondary">返回列表</button></a>
      </div>

      <div class="focus-panel" style="margin-top:10px;">
        <h4>流转链路（5步）</h4>
        <ol><li>AM登记</li><li>CM校验</li><li>CA签字</li><li>CM寄送</li><li>CM归档</li></ol>
        <p><strong>当前步骤：</strong>${safeText(row.current_step || "-")} ｜ <strong>当前责任人：</strong>${safeText(row.current_owner_role || "-")} ｜ <strong>下一步：</strong>${safeText(row.next_step_label || row.next_step || "-")}</p>
        <p><strong>当前状态：</strong>${safeText(cnStatus(row.execution_status))}</p>
      </div>

      <div class="detail-layout" style="margin-top:10px;grid-template-columns:1fr 1fr;">
        <section class="focus-panel">
          <h4>合同基础信息</h4>
          <p><strong>Dummy合同号：</strong>${safeText(row.contract_case_id || "-")}</p>
          <p><strong>正式合同号：</strong>${safeText(row.formal_contract_id || "-")}</p>
          <p><strong>客户名：</strong>${safeText(row.customer_name || "-")}</p>
          <p><strong>合同名：</strong>${safeText(row.contract_name || "-")}</p>
          <p><strong>产品名：</strong>${safeText(row.product_name || "-")}</p>
          <p><strong>合同金额：</strong>${safeText(row.total_amount || "-")}</p>
          <p><strong>支付节点与比例：</strong>${safeText(row.payment_terms || "-")}</p>

          ${renderTags("SE3报价单匹配清单", row.se3_summary)}
          ${renderTags("PMS项目匹配清单", row.pms_summary)}

          <h4>文件区</h4>
          <p><strong>AM原始文件：</strong>${safeText(row.uploaded_file_name || "-")}</p>
          <p><strong>带水印PDF：</strong>${safeText(row.watermarked_pdf_path || "未生成")}</p>
          <p><strong>CA单签备份：</strong>${safeText(row.ca_single_sign_backup || "未上传")}</p>
          <p><strong>双签归档件：</strong>${safeText(row.dual_signed_archive_file || "未上传")}</p>
        </section>

        <aside class="decision-panel">
          <h4>比较结果</h4>
          <p>${comparisonBadge(row)}</p>
          <p><strong>差异说明：</strong>${safeText(row.comparison_diff || "-")}</p>
          ${row.exception_reason ? `<p><strong>异常原因：</strong>${safeText(row.exception_reason)}</p>` : ""}
          <div class="actions"><button class="secondary" id="open-compare-modal">查看比对详情</button></div>

          ${
            isCm
              ? `<h4>CM动作区</h4>
              <div class="actions" id="cm-action-area"></div>
              <div class="form-item" id="cm-reason-wrap" style="display:none;"><label>异常原因（必填）</label><textarea id="cm-exception-reason" placeholder="请说明归档异常原因"></textarea></div>
              <div id="cm-action-msg"></div>`
              : ""
          }
        </aside>
      </div>

      <dialog id="compare-modal" style="width:88vw;max-width:1100px;">
        <h3>合同内容比对</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-height:70vh;overflow:hidden;">
          <div style="overflow:auto;border:1px solid var(--border);padding:8px;"><h4>草拟版（左）</h4><iframe src="/assets/contracts/draft_sample.pdf" style="width:100%;height:58vh;"></iframe></div>
          <div style="overflow:auto;border:1px solid var(--border);padding:8px;"><h4>双签版（右）</h4><iframe src="/assets/contracts/double_sign_sample.pdf" style="width:100%;height:58vh;"></iframe></div>
        </div>
        <div class="actions"><button id="close-compare-modal">关闭</button></div>
      </dialog>
    `;
  },
  async bind({ state, query }) {
    const modal = document.getElementById("compare-modal");
    const openBtn = document.getElementById("open-compare-modal");
    const closeBtn = document.getElementById("close-compare-modal");
    if (openBtn) openBtn.onclick = () => modal?.showModal();
    if (closeBtn) closeBtn.onclick = () => modal?.close();

    if (state.role !== "CM") return;
    const id = query.get("id") || "";
    const intent = query.get("intent") || "";
    const initRow = id ? await fetchJson(`/api/ops/contracts/tracking/detail?contract_case_id=${encodeURIComponent(id)}`, null) : null;
    if (!initRow?.contract_case_id) return;
    const init = { id: initRow.contract_case_id, status: initRow.execution_status, intent };
    const actionArea = document.getElementById("cm-action-area");
    const msg = document.getElementById("cm-action-msg");
    const reasonWrap = document.getElementById("cm-reason-wrap");

    const doAction = async (action, payload = {}) => {
      try {
        await postJson("/api/ops/contracts/cm-action", { action, contract_case_id: init.id, ...payload });
        location.hash = `/ops/contracts/tracking/detail?id=${encodeURIComponent(init.id)}`;
      } catch {
        msg.textContent = "操作失败，请稍后重试。";
      }
    };

    const addButton = (id, label, onClick, secondary = false) => {
      const b = document.createElement("button");
      b.id = id;
      b.className = secondary ? "secondary" : "";
      b.textContent = label;
      b.onclick = onClick;
      actionArea.appendChild(b);
    };

    if (init.status === "pending_cm_confirm" || init.status === "submitted_in_review") {
      addButton("cm-confirm", "确认完毕", () => doAction("cm_confirm_complete"));
    }
    addButton("cm-download-wm", "下载带水印PDF", () => window.open("/assets/contracts/draft_sample.pdf", "_blank"), true);

    if (init.status === "pending_ca_sign") {
      addButton("cm-to-send", "切到待CM寄送", () => doAction("cm_to_send"));
      addButton(
        "cm-upload-single",
        "上传CA单签备份（可选）",
        () => {
          const name = prompt("输入CA单签备份文件名（演示）", "ca_single_sign_demo.pdf");
          if (name) doAction("cm_upload_ca_single_backup", { ca_single_sign_backup: name });
        },
        true
      );
      if (init.intent === "upload-ca-backup") reasonWrap.style.display = "none";
    }

    if (init.status === "pending_cm_send" || init.status === "pending_cm_archive") {
      addButton(
        "cm-upload-dual",
        "上传双签归档件（必需）",
        () => {
          const file = prompt("输入双签归档文件名（演示）", "dual_signed_returned.pdf");
          if (!file) return;
          const ok = confirm("内容是否完全一致？确定=无误，取消=存在差异");
          const diff = ok ? "" : prompt("请填写差异说明（页码+差异内容）", "第2页金额条款文字差异");
          doAction("cm_upload_dual_signed", { dual_signed_archive_file: file, comparison_status: ok ? "ok" : "warning", comparison_diff: diff || "" });
        }
      );
    }

    if (init.status === "pending_cm_archive") {
      addButton("cm-close-ok", "确认无误", () => doAction("cm_close_archived"));
      addButton(
        "cm-close-ex",
        "关闭-归档异常",
        async () => {
          reasonWrap.style.display = "block";
          const reason = document.getElementById("cm-exception-reason").value.trim();
          if (!reason) {
            msg.textContent = "归档异常必须填写原因。";
            return;
          }
          doAction("cm_close_exception", { exception_reason: reason });
        },
        true
      );
    }
  },
};
