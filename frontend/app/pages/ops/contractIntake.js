import { fetchJson, postJson } from "../../shared/api.js";
import { renderTaskBar, safeText } from "../../shared/ui.js";

const stepTitles = ["Step 1 合同提取", "Step 2 业务匹配", "Step 3 金额分配", "Step 4 提交完成"];

function fakeExtract(fileName) {
  const seed = fileName || "示例合同";
  return {
    customer_contract_no: `CNO-${Date.now().toString().slice(-6)}`,
    customer_name: "示例客户",
    project_name: `${seed.replace(/\..+$/, "")}-项目`,
    product_name: "示例产品",
    contract_name: `${seed.replace(/\..+$/, "")}`,
    total_amount: 120000,
    payment_terms: "SOD-30%;PPAP-50%;SOP-20%",
  };
}

function parseNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default {
  title: "合同登记与申请",
  type: "流程/表单",
  async render() {
    return `
      ${renderTaskBar("流程说明：先提取并确认合同信息，再完成业务匹配与金额分配，最后提交。")}
      <div class="stepper" id="intake-stepper"></div>
      <div id="intake-step-content"></div>
    `;
  },
  async bind() {
    const state = {
      step: 1,
      contract_type: "OTP",
      upload_file_name: "",
      extracted: null,
      confirmedExtracted: null,
      se3Recommended: [],
      se3Extra: [],
      pmsRecommended: [],
      pmsExtra: [],
      selectedSe3: new Set(),
      selectedPms: new Set(),
      allocations: {},
      others_buffer: 0,
      submitResult: null,
    };

    const root = document.getElementById("intake-step-content");
    const stepper = document.getElementById("intake-stepper");

    const renderStepper = () => {
      stepper.innerHTML = `<div class="actions">${stepTitles
        .map(
          (s, i) =>
            `<span class="badge ${state.step === i + 1 ? "status-info" : ""}">${safeText(s)}</span>`
        )
        .join("")}</div>`;
    };

    const renderStep1 = () => {
      root.innerHTML = `
        <div class="detail-layout">
          <section>
            <h3>1) 合同类型与上传</h3>
            <div class="form-item"><label>合同类型</label>
              <select id="contract-type">
                <option value="OTP" ${state.contract_type === "OTP" ? "selected" : ""}>OTP 合同（本轮深度实现）</option>
                <option value="PRICE" ${state.contract_type === "PRICE" ? "selected" : ""}>Price 合同（暂未深度实现）</option>
                <option value="MIX" ${state.contract_type === "MIX" ? "selected" : ""}>Mix 合同（暂未深度实现）</option>
              </select>
            </div>
            <div class="form-item"><label>点击或拖拽 Word/PDF 拟文合同</label>
              <input id="contract-file" type="file" accept=".doc,.docx,.pdf" />
            </div>
            <div class="actions">
              <button id="extract-btn">提取合同内容</button>
              <button class="secondary" id="confirm-extract-btn" ${state.extracted ? "" : "disabled"}>确认提取并进入下一步</button>
            </div>
            <div class="empty-note" id="extract-msg"></div>
          </section>
          <aside class="detail-side">
            <h3>提取结果预览</h3>
            ${state.extracted ? extractedEditor(state.extracted) : '<div class="empty-note">上传后点击“提取合同内容”显示预览</div>'}
          </aside>
        </div>
      `;

      document.getElementById("contract-type").onchange = (e) => {
        state.contract_type = e.target.value;
        if (state.contract_type !== "OTP") {
          document.getElementById("extract-msg").textContent = "Price / Mix 本轮仅保留入口，暂不支持深度流程。";
        }
      };

      document.getElementById("extract-btn").onclick = () => {
        const file = document.getElementById("contract-file").files[0];
        if (!file) {
          document.getElementById("extract-msg").textContent = "请先上传合同文件。";
          return;
        }
        state.upload_file_name = file.name;
        state.extracted = fakeExtract(file.name);
        renderStep1();
      };

      const confirmBtn = document.getElementById("confirm-extract-btn");
      if (confirmBtn) {
        confirmBtn.onclick = async () => {
          if (!state.extracted) return;
          state.confirmedExtracted = readExtractedEditorValues();
          const q = new URLSearchParams({
            customer_name: state.confirmedExtracted.customer_name,
            product_name: state.confirmedExtracted.product_name,
          });
          state.se3Recommended = await fetchJson(`/api/ops/se3-snapshots?${q.toString()}`, []);
          state.pmsRecommended = await fetchJson(`/api/ops/pms-projects?${q.toString()}`, []);
          state.step = 2;
          renderAll();
        };
      }
    };

    const renderStep2 = () => {
      root.innerHTML = `
        <h3>2) 报价单 & 项目关联</h3>
        <div class="detail-layout">
          <section>
            <h4>SE3 报价单匹配（可多选）</h4>
            <div class="actions">
              <input id="se3-pid-search" placeholder="按 PID 搜索额外 SE3 快照" />
              <button class="secondary" id="se3-search-btn">搜索并加入候选</button>
            </div>
            <div id="se3-list">${renderSe3List()}</div>
          </section>
          <aside class="detail-side">
            <h4>PMS 项目匹配（可多选）</h4>
            <div class="actions">
              <input id="pms-mcr-search" placeholder="按 MCR 搜索" />
              <input id="pms-name-search" placeholder="按项目名搜索" />
              <button class="secondary" id="pms-search-btn">搜索并加入候选</button>
            </div>
            <div id="pms-list">${renderPmsList()}</div>
          </aside>
        </div>
        <div class="actions">
          <button class="secondary" id="back-step1">上一步</button>
          <button id="to-step3">进入金额分配</button>
          <span id="match-msg"></span>
        </div>
      `;

      bindSelectionHandlers();

      document.getElementById("se3-search-btn").onclick = async () => {
        const pid = document.getElementById("se3-pid-search").value.trim();
        if (!pid) return;
        const data = await fetchJson(`/api/ops/se3-snapshots?pid=${encodeURIComponent(pid)}`, []);
        state.se3Extra = mergeById(state.se3Extra, data, "snapshot_id");
        renderStep2();
      };

      document.getElementById("pms-search-btn").onclick = async () => {
        const mcr = document.getElementById("pms-mcr-search").value.trim();
        const name = document.getElementById("pms-name-search").value.trim();
        const q = new URLSearchParams();
        if (mcr) q.set("mcr", mcr);
        if (name) q.set("project_name", name);
        const data = await fetchJson(`/api/ops/pms-projects?${q.toString()}`, []);
        state.pmsExtra = mergeById(state.pmsExtra, data, "project_id");
        renderStep2();
      };

      document.getElementById("back-step1").onclick = () => {
        state.step = 1;
        renderAll();
      };

      document.getElementById("to-step3").onclick = () => {
        if (state.selectedPms.size === 0) {
          document.getElementById("match-msg").textContent = "PMS 项目是必填，请至少选择一个。";
          return;
        }
        initDefaultAllocation();
        state.step = 3;
        renderAll();
      };
    };

    const renderStep3 = () => {
      const selectedProjects = allPmsCandidates().filter((p) => state.selectedPms.has(p.project_id));
      const total = parseNumber(state.confirmedExtracted.total_amount);
      root.innerHTML = `
        <h3>3) 金额分配（绝对金额）</h3>
        <div class="task-bar">合同总金额：${total.toLocaleString()}。默认按所选 PMS 项目均分，Others / Buffer 默认为 0。</div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>PMS项目</th><th>项目负责人</th><th>分配金额</th><th>备注</th></tr></thead>
            <tbody>
              ${selectedProjects
                .map(
                  (p) => `<tr>
                    <td>${safeText(p.project_name)}</td>
                    <td>${safeText(p.pjm_owner)}</td>
                    <td><input class="alloc-input" data-id="${p.project_id}" value="${state.allocations[p.project_id] ?? 0}" /></td>
                    <td>${safeText(p.remark_from_pjm || "-")}</td>
                  </tr>`
                )
                .join("")}
              <tr><td>Others / Buffer</td><td>-</td><td><input id="others-buffer" value="${state.others_buffer}" /></td><td>默认 0</td></tr>
            </tbody>
          </table>
        </div>
        <div class="actions">
          <button class="secondary" id="back-step2">上一步</button>
          <button id="to-step4">校验并进入提交</button>
          <span id="alloc-msg"></span>
        </div>
      `;

      document.querySelectorAll(".alloc-input").forEach((el) => {
        el.oninput = () => {
          state.allocations[el.dataset.id] = parseNumber(el.value);
          validateAllocation();
        };
      });
      document.getElementById("others-buffer").oninput = (e) => {
        state.others_buffer = parseNumber(e.target.value);
        validateAllocation();
      };

      document.getElementById("back-step2").onclick = () => {
        state.step = 2;
        renderAll();
      };
      document.getElementById("to-step4").onclick = () => {
        const err = validateAllocation(true);
        if (!err) {
          state.step = 4;
          renderAll();
        }
      };
    };

    const renderStep4 = () => {
      const total = parseNumber(state.confirmedExtracted.total_amount);
      const allocTotal = Object.values(state.allocations).reduce((a, b) => a + parseNumber(b), 0) + parseNumber(state.others_buffer);
      root.innerHTML = `
        <h3>4) 提交完成</h3>
        <div class="task-bar">提交前检查：合同金额 ${total}，分配合计 ${allocTotal}。</div>
        <div class="actions">
          <button class="secondary" id="back-step3">上一步</button>
          <button id="submit-contract">提交合同申请</button>
          <span id="submit-msg"></span>
        </div>
        <div id="submit-result">${state.submitResult ? renderSubmitResult(state.submitResult) : ""}</div>
      `;

      document.getElementById("back-step3").onclick = () => {
        state.step = 3;
        renderAll();
      };

      document.getElementById("submit-contract").onclick = async () => {
        const err = validateAllBeforeSubmit();
        if (err) {
          document.getElementById("submit-msg").textContent = err;
          return;
        }
        const payload = {
          contract_type: state.contract_type,
          uploaded_file_name: state.upload_file_name,
          extracted_fields: state.confirmedExtracted,
          se3_matches: allSe3Candidates().filter((x) => state.selectedSe3.has(x.snapshot_id)),
          pms_matches: allPmsCandidates().filter((x) => state.selectedPms.has(x.project_id)),
          allocations: {
            projects: Object.entries(state.allocations).map(([project_id, amount]) => ({ project_id, amount: parseNumber(amount) })),
            others_buffer: parseNumber(state.others_buffer),
          },
        };
        try {
          const res = await postJson("/api/ops/contracts/intake", payload);
          state.submitResult = res;
          document.getElementById("submit-result").innerHTML = renderSubmitResult(res);
          bindSuccessActions(res);
        } catch {
          document.getElementById("submit-msg").textContent = "提交失败，请稍后重试。";
        }
      };

      if (state.submitResult) bindSuccessActions(state.submitResult);
    };

    const renderAll = () => {
      renderStepper();
      if (state.step === 1) renderStep1();
      if (state.step === 2) renderStep2();
      if (state.step === 3) renderStep3();
      if (state.step === 4) renderStep4();
    };

    const extractedEditor = (extracted) => `
      <div class="form-grid">
        ${[
          ["customer_contract_no", "客户合同号"],
          ["customer_name", "客户名"],
          ["project_name", "项目名"],
          ["product_name", "产品名"],
          ["contract_name", "合同名称"],
          ["total_amount", "合同总金额"],
          ["payment_terms", "分期节点与比例"],
        ]
          .map(
            ([k, label]) => `<div class="form-item"><label>${label}</label><input class="extract-field" data-key="${k}" value="${safeText(
              extracted[k]
            )}"/></div>`
          )
          .join("")}
      </div>
    `;

    const readExtractedEditorValues = () => {
      const out = {};
      document.querySelectorAll(".extract-field").forEach((el) => {
        out[el.dataset.key] = el.value;
      });
      out.total_amount = parseNumber(out.total_amount);
      return out;
    };

    const allSe3Candidates = () => mergeById(state.se3Recommended, state.se3Extra, "snapshot_id");
    const allPmsCandidates = () => mergeById(state.pmsRecommended, state.pmsExtra, "project_id");

    const renderSe3List = () => {
      const rows = allSe3Candidates();
      return rows.length
        ? `<div class="table-wrap"><table class="table"><thead><tr><th>选择</th><th>PID</th><th>配置名</th><th>OTP金额</th><th>OTC金额</th><th>支付年份</th><th>Sys EBIT金额</th><th>Sys EBIT%</th></tr></thead><tbody>${rows
            .map(
              (r) => `<tr>
              <td><input type="checkbox" class="se3-check" data-id="${r.snapshot_id}" ${state.selectedSe3.has(r.snapshot_id) ? "checked" : ""}/></td>
              <td>${safeText(r.pid)}</td><td>${safeText(r.configuration_name)}</td><td>${safeText(r.otp_amount)}</td><td>${safeText(r.otc_amount)}</td><td>${safeText(r.payment_year)}</td><td>${safeText(r.sys_ebit_amount)}</td><td>${safeText(r.sys_ebit_percent)}</td>
            </tr>`
            )
            .join("")}</tbody></table></div>`
        : '<div class="empty-note">暂无 SE3 候选</div>';
    };

    const renderPmsList = () => {
      const rows = allPmsCandidates();
      return rows.length
        ? `<div class="table-wrap"><table class="table"><thead><tr><th>选择</th><th>项目名称</th><th>类型</th><th>状态</th><th>关联PID</th><th>关联MCRL0</th><th>PjM负责人</th><th>remark from pjm</th></tr></thead><tbody>${rows
            .map(
              (r) => `<tr>
              <td><input type="checkbox" class="pms-check" data-id="${r.project_id}" ${state.selectedPms.has(r.project_id) ? "checked" : ""}/></td>
              <td>${safeText(r.project_name)}</td><td>${safeText(r.system_project_type)}</td><td>${safeText(r.project_status)}</td><td>${safeText(r.related_pid)}</td><td>${safeText(r.related_mcrl0)}</td><td>${safeText(r.pjm_owner)}</td><td>${safeText(r.remark_from_pjm)}</td>
            </tr>`
            )
            .join("")}</tbody></table></div>`
        : '<div class="empty-note">暂无 PMS 候选</div>';
    };

    const bindSelectionHandlers = () => {
      document.querySelectorAll(".se3-check").forEach((el) => {
        el.onchange = () => (el.checked ? state.selectedSe3.add(el.dataset.id) : state.selectedSe3.delete(el.dataset.id));
      });
      document.querySelectorAll(".pms-check").forEach((el) => {
        el.onchange = () => (el.checked ? state.selectedPms.add(el.dataset.id) : state.selectedPms.delete(el.dataset.id));
      });
    };

    const initDefaultAllocation = () => {
      const selected = allPmsCandidates().filter((p) => state.selectedPms.has(p.project_id));
      const total = parseNumber(state.confirmedExtracted.total_amount);
      const even = selected.length ? Math.floor(total / selected.length) : 0;
      state.allocations = {};
      selected.forEach((p, idx) => {
        state.allocations[p.project_id] = idx === selected.length - 1 ? total - even * (selected.length - 1) : even;
      });
      state.others_buffer = 0;
    };

    const validateAllocation = (showMsg = false) => {
      const total = parseNumber(state.confirmedExtracted.total_amount);
      const allocTotal = Object.values(state.allocations).reduce((a, b) => a + parseNumber(b), 0) + parseNumber(state.others_buffer);
      const ok = allocTotal === total;
      if (showMsg) {
        document.getElementById("alloc-msg").textContent = ok ? "金额校验通过。" : `金额不平：合同总额 ${total}，分配合计 ${allocTotal}`;
      }
      return ok ? "" : "金额分配合计必须等于合同总金额。";
    };

    const validateAllBeforeSubmit = () => {
      if (!state.confirmedExtracted) return "请先完成合同提取确认。";
      if (state.selectedPms.size === 0) return "PMS 项目是必填。";
      const allocErr = validateAllocation();
      if (allocErr) return allocErr;
      return "";
    };

    const renderSubmitResult = (res) => `
      <div class="focus-panel">
        <h3>提交成功</h3>
        <p>Dummy合同号：<strong id="dummy-id">${safeText(res.contract_case_id)}</strong></p>
        <div class="actions">
          <button class="secondary" id="copy-dummy-id">复制合同号</button>
          <button id="goto-tracking">去合同进度追踪</button>
          <button class="secondary" id="goto-archive">去历史合同档案库</button>
        </div>
        <p>下游流转路径：</p>
        <ol>
          <li>CM 校验</li>
          <li>CA 签字</li>
          <li>CM 寄送合同</li>
          <li>CM 归档合同</li>
        </ol>
      </div>
    `;

    const bindSuccessActions = (res) => {
      const copyBtn = document.getElementById("copy-dummy-id");
      if (copyBtn) copyBtn.onclick = async () => navigator.clipboard?.writeText(res.contract_case_id);
      const goTrack = document.getElementById("goto-tracking");
      if (goTrack) goTrack.onclick = () => (location.hash = `/ops/contracts/tracking?dummy_id=${encodeURIComponent(res.contract_case_id)}`);
      const goArchive = document.getElementById("goto-archive");
      if (goArchive) goArchive.onclick = () => (location.hash = `/ops/contracts/archive?dummy_id=${encodeURIComponent(res.contract_case_id)}`);
    };

    const mergeById = (a, b, id) => {
      const m = new Map();
      [...(a || []), ...(b || [])].forEach((x) => m.set(x[id], x));
      return Array.from(m.values());
    };

    renderAll();
  },
};
