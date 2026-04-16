import { fetchJson, postJson } from "../../shared/api.js";
import { cnStatus } from "../../shared/status.js";
import { renderTaskBar, safeText } from "../../shared/ui.js";

const DRAFT_PDF = "/assets/contracts/draft_sample.pdf";
const SINGLE_PDF = "/assets/contracts/single_sign_sample.pdf";
const DUAL_PDF = "/assets/contracts/double_sign_sample.pdf";

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
  if (row.comparison_status === "ok") return '<span class="badge status-success">比较结果：内容核对无误</span>';
  if (row.comparison_status === "warning") return '<span class="badge status-warning">比较结果：存在差异，请核对</span>';
  return '<span class="badge">比较结果：待核对</span>';
}

function statusKey(status) {
  return status === "submitted_in_review" ? "pending_cm_confirm" : status;
}

function hasDual(row) {
  return Boolean(String(row.dual_signed_archive_file || "").trim());
}

function hasSingle(row) {
  return Boolean(String(row.ca_single_sign_backup || "").trim());
}

function comparisonReady(row) {
  return statusKey(row.execution_status) === "pending_cm_archive" && hasDual(row);
}

function topStatusBlock(row) {
  return `
    <section class="focus-panel" style="margin-top:10px;">
      <h4>合同流转状态</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div><strong>Dummy ID：</strong>${safeText(row.contract_case_id || "-")}</div>
        <div><strong>Official ID：</strong>${safeText(row.formal_contract_id || "未生成")}</div>
      </div>
      <p style="margin-top:6px;"><strong>链路：</strong>AM登记 → CM校验 → CA签字 → CM寄送 → CM归档</p>
      <p><strong>当前步骤：</strong>${safeText(row.current_step || "-")} ｜ <strong>当前责任人：</strong>${safeText(row.current_owner_role || "-")} ｜ <strong>下一步：</strong>${safeText(
    row.next_step_label || row.next_step || "-"
  )}</p>
      <p><strong>当前状态：</strong><span class="badge">${safeText(cnStatus(row.execution_status))}</span></p>
    </section>
  `;
}

function middleInfoBlock(row) {
  return `
    <section class="focus-panel" style="margin-top:10px;">
      <h4>合同基础信息</h4>
      <p><strong>客户名：</strong>${safeText(row.customer_name || "-")}</p>
      <p><strong>项目名：</strong>${safeText(row.project_name || "-")}</p>
      <p><strong>产品名：</strong>${safeText(row.product_name || "-")}</p>
      <p><strong>合同名：</strong>${safeText(row.contract_name || "-")}</p>

      ${renderTags("SE3匹配信息", row.se3_summary)}
      ${renderTags("PMS匹配信息", row.pms_summary)}

      <h4>金额分配信息</h4>
      <p><strong>合同金额：</strong>${safeText(row.total_amount || "-")}</p>
      <p><strong>支付节点与比例：</strong>${safeText(row.payment_terms || "-")}</p>
      <p><strong>分配摘要：</strong>${safeText(row.allocation_summary || "-")}</p>
    </section>
  `;
}

function versionButton(id, label, available) {
  return `<button id="${id}" class="secondary" ${available ? "" : "disabled"}>${label}${available ? "" : "（暂无）"}</button>`;
}

function cmActionBlock(row, isCm) {
  if (!isCm) return "";
  return `
    <section class="decision-panel" style="margin-top:10px;">
      <h4>CM工作区</h4>
      <div id="cm-feedback"></div>
      <div class="actions" id="cm-action-area"></div>
      <div id="comparison-tools" style="margin-top:10px;"></div>
      <div class="form-item" id="cm-reason-wrap" style="display:none;">
        <label>异常原因（必填）</label>
        <textarea id="cm-exception-reason" placeholder="请说明归档异常原因"></textarea>
      </div>
    </section>
  `;
}

export default {
  title: "合同跟进详情",
  type: "详情页",
  async render({ query, state }) {
    const id = query.get("id") || "";
    const isCm = state.role === "CM";
    const flash = query.get("flash") || "";
    const row = id ? await fetchJson(`/api/ops/contracts/tracking/detail?contract_case_id=${encodeURIComponent(id)}`, null) : null;
    if (!row || !row.contract_case_id) {
      return `${renderTaskBar("返回列表重新选择合同。")}<div class="empty-note">未找到合同详情。</div><div class="actions"><a href="#/ops/contracts/tracking"><button class="secondary">返回列表</button></a></div>`;
    }

    const compareReady = comparisonReady(row);

    return `
      ${renderTaskBar("合同跟进详情：上层状态、中层信息、下层版本与CM动作区。")}
      <div class="actions" style="justify-content:space-between;align-items:center;">
        <h3 style="margin:0;">合同跟进详情：${safeText(row.contract_case_id)}</h3>
        <a href="#/ops/contracts/tracking"><button class="secondary">返回列表</button></a>
      </div>

      ${
        flash
          ? `<div class="focus-panel" style="margin-top:10px;border:1px solid #2f6f3e;background:#edf8f0;"><strong>操作成功：</strong>${safeText(
              flash
            )}，状态已更新，产物区已刷新。</div>`
          : ""
      }

      ${topStatusBlock(row)}
      ${middleInfoBlock(row)}

      <section class="focus-panel" style="margin-top:10px;">
        <h4>版本快照</h4>
        <div class="actions">
          ${versionButton("open-draft", "草拟版", true)}
          ${versionButton("open-single", "单签版", hasSingle(row))}
          ${versionButton("open-dual", "双签版", hasDual(row))}
        </div>
      </section>

      ${cmActionBlock(row, isCm)}

      ${
        compareReady
          ? `<section class="focus-panel" style="margin-top:10px;">
              <h4>归档比较结果</h4>
              <p>${comparisonBadge(row)}</p>
              <p><strong>差异说明：</strong>${safeText(row.comparison_diff || "-")}</p>
            </section>`
          : ""
      }

      <dialog id="snapshot-modal" style="width:88vw;max-width:1100px;">
        <div class="actions" style="justify-content:space-between;align-items:center;">
          <h3 id="snapshot-title" style="margin:0;">版本预览</h3>
          <button id="snapshot-download">下载</button>
        </div>
        <iframe id="snapshot-frame" src="${DRAFT_PDF}" style="width:100%;height:68vh;border:1px solid var(--border);"></iframe>
        <div class="actions"><button id="snapshot-close" class="secondary">关闭</button></div>
      </dialog>

      <dialog id="compare-modal" style="width:90vw;max-width:1200px;">
        <div class="actions" style="justify-content:space-between;align-items:center;">
          <h3 style="margin:0;">比对详情</h3>
          <div class="actions" style="margin:0;">
            <label>左侧版本：</label>
            <select id="compare-left-target"></select>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-height:70vh;overflow:hidden;">
          <div style="overflow:auto;border:1px solid var(--border);padding:8px;"><h4 id="compare-left-title">左侧</h4><iframe id="compare-left-frame" src="${DRAFT_PDF}" style="width:100%;height:58vh;"></iframe></div>
          <div style="overflow:auto;border:1px solid var(--border);padding:8px;"><h4>右侧：双签版</h4><iframe id="compare-right-frame" src="${DUAL_PDF}" style="width:100%;height:58vh;"></iframe></div>
        </div>
        <div class="actions"><button id="close-compare-modal">关闭</button></div>
      </dialog>
    `;
  },
  async bind({ state, query }) {
    const id = query.get("id") || "";
    const row = id ? await fetchJson(`/api/ops/contracts/tracking/detail?contract_case_id=${encodeURIComponent(id)}`, null) : null;
    if (!row?.contract_case_id) return;

    const snapshotModal = document.getElementById("snapshot-modal");
    const snapshotTitle = document.getElementById("snapshot-title");
    const snapshotFrame = document.getElementById("snapshot-frame");
    const snapshotDownload = document.getElementById("snapshot-download");
    const snapshotClose = document.getElementById("snapshot-close");

    let currentSnapshot = DRAFT_PDF;
    const openSnapshot = (title, src) => {
      currentSnapshot = src;
      snapshotTitle.textContent = title;
      snapshotFrame.src = src;
      snapshotModal?.showModal();
    };

    document.getElementById("open-draft")?.addEventListener("click", () => openSnapshot("草拟版预览", DRAFT_PDF));
    document.getElementById("open-single")?.addEventListener("click", () => {
      if (hasSingle(row)) openSnapshot("单签版预览", SINGLE_PDF);
    });
    document.getElementById("open-dual")?.addEventListener("click", () => {
      if (hasDual(row)) openSnapshot("双签版预览", DUAL_PDF);
    });
    snapshotClose?.addEventListener("click", () => snapshotModal?.close());
    snapshotDownload?.addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = currentSnapshot;
      a.download = currentSnapshot.split("/").pop() || "snapshot.pdf";
      a.click();
    });

    const compareModal = document.getElementById("compare-modal");
    const closeCompareBtn = document.getElementById("close-compare-modal");
    const leftTarget = document.getElementById("compare-left-target");
    const leftTitle = document.getElementById("compare-left-title");
    const leftFrame = document.getElementById("compare-left-frame");

    const updateCompareLeft = () => {
      const value = leftTarget.value;
      if (value === "single") {
        leftTitle.textContent = "左侧：单签版";
        leftFrame.src = SINGLE_PDF;
      } else {
        leftTitle.textContent = "左侧：草拟版";
        leftFrame.src = DRAFT_PDF;
      }
    };

    if (leftTarget) {
      leftTarget.innerHTML = hasSingle(row)
        ? '<option value="draft">草拟版</option><option value="single">单签版</option>'
        : '<option value="draft">草拟版</option>';
      leftTarget.value = "draft";
      leftTarget.onchange = updateCompareLeft;
      updateCompareLeft();
    }
    closeCompareBtn?.addEventListener("click", () => compareModal?.close());

    if (state.role !== "CM") return;

    const actionArea = document.getElementById("cm-action-area");
    const feedback = document.getElementById("cm-feedback");
    const reasonWrap = document.getElementById("cm-reason-wrap");
    const comparisonTools = document.getElementById("comparison-tools");
    const currentStatus = statusKey(row.execution_status);

    const setFeedback = (type, text) => {
      if (!feedback) return;
      const style =
        type === "loading"
          ? "background:#fff8db;border:1px solid #b38a02;"
          : type === "success"
            ? "background:#edf8f0;border:1px solid #2f6f3e;"
            : "background:#fdecec;border:1px solid #b42318;";
      feedback.innerHTML = `<div class="focus-panel" style="${style}margin:0 0 8px 0;"><strong>${safeText(text)}</strong></div>`;
    };

    const doAction = async (action, payload = {}, successText = "操作已完成") => {
      try {
        setFeedback("loading", "处理中，请稍候...");
        const res = await postJson("/api/ops/contracts/cm-action", { action, contract_case_id: row.contract_case_id, ...payload });
        setFeedback("success", `${successText}（新状态：${cnStatus(res.execution_status || "")}）`);
        setTimeout(() => {
          location.hash = `/ops/contracts/tracking/detail?id=${encodeURIComponent(row.contract_case_id)}&flash=${encodeURIComponent(successText)}`;
        }, 600);
      } catch {
        setFeedback("error", "操作失败，请重试。");
      }
    };

    const addButton = (id, label, onClick, secondary = false) => {
      const b = document.createElement("button");
      b.id = id;
      b.className = secondary ? "secondary" : "";
      b.textContent = label;
      b.onclick = onClick;
      actionArea?.appendChild(b);
    };

    if (currentStatus === "pending_cm_confirm") {
      addButton("cm-confirm", "确认完毕", () => doAction("cm_confirm_complete", {}, "CM确认完成，已生成Official ID并进入待CA签字"));
      return;
    }

    if (currentStatus === "pending_ca_sign") {
      addButton("cm-to-send", "切换到CM寄送", () => doAction("cm_to_send", {}, "已切换到待CM寄送"));
      addButton(
        "cm-upload-single",
        "上传CA单签备份",
        () => {
          const name = prompt("输入CA单签备份文件名（演示）", "ca_single_sign_demo.pdf");
          if (name) doAction("cm_upload_ca_single_backup", { ca_single_sign_backup: name }, "CA单签备份上传成功");
        },
        true
      );
      return;
    }

    if (currentStatus === "pending_cm_send") {
      addButton(
        "cm-upload-dual",
        "上传客户双签备份",
        () => {
          const file = prompt("输入双签归档文件名（演示）", "dual_signed_returned.pdf");
          if (!file) return;
          const same = confirm("内容是否完全一致？确定=无误，取消=存在差异");
          const diff = same ? "" : prompt("请填写差异说明（页码+差异内容）", "第2页金额条款文字差异");
          doAction(
            "cm_upload_dual_signed",
            { dual_signed_archive_file: file, comparison_status: same ? "ok" : "warning", comparison_diff: diff || "" },
            "双签备份上传成功，已进入待CM归档"
          );
        },
        false
      );
      return;
    }

    if (currentStatus === "pending_cm_archive" && hasDual(row)) {
      comparisonTools.innerHTML = `
        <h4>归档比对工具</h4>
        <p>${comparisonBadge(row)}</p>
        <p><strong>差异说明：</strong>${safeText(row.comparison_diff || "-")}</p>
        <div class="actions"><button id="open-compare-modal" class="secondary">详情比对</button></div>
      `;
      document.getElementById("open-compare-modal")?.addEventListener("click", () => compareModal?.showModal());
      addButton("cm-close-ok", "确认完毕", () => doAction("cm_close_archived", {}, "归档确认完成，合同已关闭"));
      addButton(
        "cm-close-ex",
        "关闭-归档异常",
        () => {
          reasonWrap.style.display = "block";
          const reason = document.getElementById("cm-exception-reason")?.value.trim();
          if (!reason) {
            setFeedback("error", "归档异常必须填写原因");
            return;
          }
          doAction("cm_close_exception", { exception_reason: reason }, "已按归档异常关闭");
        },
        true
      );
    }
  },
};
