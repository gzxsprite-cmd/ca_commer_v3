import { fetchJson, postJson } from "../../shared/api.js";
import { billingBadgeClass, billingStepLabel } from "../../shared/status.js";
import { renderTaskBar, safeText } from "../../shared/ui.js";

const flow = ["planned", "customer_confirmed", "rb_mapped", "settlement_adjusted", "declaration_booked", "closed"];
const flowCn = [
  "Step 0 计划开票",
  "Step 1 客户确认",
  "Step 2 RB内部mapping",
  "Step 3 结算调整",
  "Step 4 开票声明和预约",
  "Step 5 关闭",
];

function parseInvoiceText(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [invoice_no, amount] = line.split(/[,，\t ]+/);
      return { invoice_no, amount: amount || "" };
    });
}

function subNav() {
  return `<div class="billing-subnav">
    <button class="secondary" id="go-list">开票事项列表</button>
    <button class="secondary" id="go-calendar">开票日历</button>
  </div>`;
}

export default {
  title: "开票跟进｜开票事项详情",
  type: "详情/执行",
  async render({ query }) {
    const id = query.get("id") || "";
    const row = await fetchJson(`/api/ops/cm/billing/tasks/detail?task_id=${encodeURIComponent(id)}`, null);
    if (!row || !row.billing_task_id) {
      return `${renderTaskBar("返回列表重新选择事项。")}<div class="empty-note">未找到开票事项。</div>`;
    }
    const fixed = row.source_type === "plan_generated" || row.locked_anchor === "1";
    const showStep4 = (row.status_idx || 0) >= 4 || row.status_code === "partial_closed";
    return `
      ${renderTaskBar("按步骤推进开票事项，Step4字段完成后才允许关闭。")}
      ${subNav()}
      <div class="actions" style="justify-content:space-between;">
        <h3 style="margin:0;">事项：${safeText(row.billing_task_id)}</h3>
        <a href="#/ops/billing/tasks"><button class="secondary">返回列表</button></a>
      </div>

      <section class="focus-panel" style="margin-top:10px;">
        <div class="form-grid">
          <div><strong>来源：</strong>${safeText(row.source_type)}</div>
          <div><strong>当前状态：</strong><span id="detail-status-badge" class="badge ${billingBadgeClass(row.status_code)}">${safeText(
      billingStepLabel(row.status_code, row.status_label)
    )}</span></div>
          <div><strong>当前责任人：</strong>${safeText(row.current_owner || "CM")}</div>
          <div><strong>下一步：</strong>${safeText(row.next_step || "-")}</div>
          <div><strong>must billing金额：</strong>${safeText(row.plan_must_billing_amount || "0")}</div>
          <div><strong>计划金额：</strong>${safeText(row.plan_amount || "0")}</div>
        </div>
      </section>

      <section class="focus-panel" style="margin-top:10px;">
        <h4>业务锚点</h4>
        <div class="form-grid">
          <div class="form-item"><label>customer_project_id</label><input id="d-cp" value="${safeText(row.customer_project_id || "")}" ${fixed ? "disabled" : ""} /></div>
          <div class="form-item"><label>contract_id</label><input id="d-contract" value="${safeText(row.contract_id || "")}" ${fixed ? "disabled" : ""} /></div>
          <div><strong>项目名：</strong>${safeText(row.project_name || "-")}</div>
          <div><strong>合同号：</strong>${safeText(row.contract_no || "-")}</div>
        </div>
      </section>

      <section class="decision-panel" style="margin-top:10px;">
        <h4>步骤推进</h4>
        <div id="detail-step-chips" class="chip-row">${flowCn
          .map((n, idx) => `<span class="badge ${idx <= (row.status_idx || 0) ? "status-info" : "status-neutral"}">${n}</span>`)
          .join(" ")}</div>
        <div class="actions" style="margin-top:10px;">
          <button id="go-next">推进到下一步</button>
          <input id="done-time" value="${safeText(new Date().toISOString().slice(0, 19))}" />
        </div>
        <div id="progress-msg"></div>
      </section>

      <section id="step4-panel" class="focus-panel" style="margin-top:10px;${showStep4 ? "" : "display:none;"}">
        <h4>Step 4 开票声明和预约（必填后可关闭）</h4>
        <div class="form-grid">
          <div class="form-item"><label>Workon号（必填）</label><input id="workon-no" value="${safeText(row.workon_no || "")}" /></div>
          <div class="form-item"><label>总开票金额（必填）</label><input id="invoice-total" value="${safeText(row.total_invoice_amount || "")}" /></div>
          <div class="form-item" style="grid-column:1 / span 2;">
            <label>发票号+金额（可粘贴多行，格式：invoice_no amount）</label>
            <textarea id="invoice-lines" rows="6">${safeText((row.invoice_lines || []).map((x) => `${x.invoice_no || ""} ${x.amount || ""}`).join("\n"))}</textarea>
          </div>
        </div>
        <div class="actions">
          <button id="close-full">关闭</button>
          <button id="close-partial" class="secondary">部分关闭</button>
          <input id="partial-reason" placeholder="部分关闭原因（仅部分关闭必填）" />
          <span id="close-msg"></span>
        </div>
      </section>
    `;
  },
  bind({ query }) {
    const id = query.get("id") || "";

    document.getElementById("go-list")?.addEventListener("click", () => {
      location.hash = "/ops/billing/tasks";
    });
    document.getElementById("go-calendar")?.addEventListener("click", () => {
      location.hash = "/ops/billing/calendar";
    });

    const statusToNext = (status) => {
      const idx = Math.max(flow.indexOf(status), 0);
      return flow[Math.min(idx + 1, flow.length - 2)];
    };

    document.getElementById("go-next").onclick = async () => {
      const status = (await fetchJson(`/api/ops/cm/billing/tasks/detail?task_id=${encodeURIComponent(id)}`, {})).status_code;
      const target = statusToNext(status || "planned");
      await postJson("/api/ops/cm/billing/tasks/progress", {
        billing_task_id: id,
        target_status: target,
        completion_time: document.getElementById("done-time").value,
      });
      const statusBadge = document.getElementById("detail-status-badge");
      if (statusBadge) {
        statusBadge.className = `badge ${billingBadgeClass(target)}`;
        statusBadge.textContent = billingStepLabel(target, "");
      }
      if (target === "declaration_booked") {
        const panel = document.getElementById("step4-panel");
        if (panel) panel.style.display = "block";
      }
      document.getElementById("progress-msg").textContent = `已推进到 ${billingStepLabel(target, "")}`;
    };

    const close = async (partial) => {
      const invoiceLines = parseInvoiceText(document.getElementById("invoice-lines")?.value || "");
      await postJson("/api/ops/cm/billing/tasks/close", {
        billing_task_id: id,
        close_type: partial ? "partial_closed" : "closed",
        workon_no: document.getElementById("workon-no")?.value || "",
        total_invoice_amount: document.getElementById("invoice-total")?.value || "",
        invoice_lines: invoiceLines,
        partial_reason: document.getElementById("partial-reason")?.value || "",
      });
      document.getElementById("close-msg").textContent = partial ? "已部分关闭并回写实际。" : "已关闭并回写实际。";
      setTimeout(() => (location.hash = "/ops/billing/tasks"), 500);
    };

    const fullBtn = document.getElementById("close-full");
    const partialBtn = document.getElementById("close-partial");
    if (fullBtn) fullBtn.onclick = () => close(false);
    if (partialBtn) partialBtn.onclick = () => close(true);
  },
};
