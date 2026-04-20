import { fetchJson, postJson } from "../../shared/api.js";
import { renderTaskBar, safeText } from "../../shared/ui.js";

const sourceOptions = [
  ["cm_manual", "CM手动"],
  ["am_triggered", "AM触发"],
  ["pjm_triggered", "PjM触发"],
];

export default {
  title: "新建开票事件",
  type: "流程/表单",
  async render() {
    const cps = await fetchJson("/api/cm/billing/plan-grid", { rows: [] });
    const options = (cps.rows || []).map((r) => ({
      customer_project_id: r.customer_project_id,
      contract_id: r.contract_id,
      label: `${r.customer_name} / ${r.project_name} / ${r.contract_no}`,
    }));
    return `
      ${renderTaskBar("用于非计划自动生成的事项创建：默认来源为CM手动，可改为AM/PjM触发。")}
      <div class="form-grid">
        <div class="form-item"><label>来源类型</label><select id="f-source">${sourceOptions
          .map(([v, l]) => `<option value="${v}">${l}</option>`)
          .join("")}</select></div>
        <div class="form-item"><label>客户项目 + 合同</label><select id="f-cp-contract"><option value="">请选择</option>${options
          .map((o) => `<option value="${o.customer_project_id}||${o.contract_id}">${safeText(o.label)}</option>`)
          .join("")}</select></div>
        <div class="form-item"><label>计划年份</label><input id="f-year" value="${new Date().getFullYear()}" /></div>
        <div class="form-item"><label>计划月份</label><input id="f-month" value="${String(new Date().getMonth() + 1).padStart(2, "0")}" /></div>
        <div class="form-item"><label>计划金额</label><input id="f-plan" placeholder="0" /></div>
        <div class="form-item"><label>must billing金额</label><input id="f-must" placeholder="0" /></div>
      </div>
      <div class="actions">
        <button id="submit-task">创建开票事项</button>
        <span id="submit-msg"></span>
      </div>
    `;
  },
  bind() {
    document.getElementById("submit-task").onclick = async () => {
      const val = document.getElementById("f-cp-contract").value;
      if (!val) {
        document.getElementById("submit-msg").textContent = "请选择客户项目与合同。";
        return;
      }
      const [customer_project_id, contract_id] = val.split("||");
      const payload = {
        source_type: document.getElementById("f-source").value,
        customer_project_id,
        contract_id,
        year: document.getElementById("f-year").value,
        month: document.getElementById("f-month").value,
        plan_amount: document.getElementById("f-plan").value || "0",
        plan_must_billing_amount: document.getElementById("f-must").value || "0",
      };
      try {
        const res = await postJson("/api/ops/cm/billing/tasks", payload);
        document.getElementById("submit-msg").textContent = `创建成功：${res.billing_task_id}`;
        setTimeout(() => (location.hash = `/ops/billing/tasks/detail?id=${encodeURIComponent(res.billing_task_id)}`), 400);
      } catch {
        document.getElementById("submit-msg").textContent = "创建失败，请检查输入。";
      }
    };
  },
};
