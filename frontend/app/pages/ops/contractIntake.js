import { fetchJson, postJson } from "../../shared/api.js";
import { renderTaskBar, safeText } from "../../shared/ui.js";

const stepTitles = ["Step 1 上传与提取确认", "Step 2 匹配 SE3/PMS", "Step 3 金额分配", "Step 4 提交确认"];

function fakeExtract(fileName) {
  const seed = fileName || "示例合同";
  return {
    customer_contract_no: `CNO-${Date.now().toString().slice(-6)}`,
    customer_name: "示例客户",
    project_name: `${seed.replace(/\..+$/, "")}-项目`,
    product_name: "示例产品",
    contract_name: seed.replace(/\..+$/, ""),
    total_amount: 120000,
    payment_terms: "SOD-30%;PPAP-50%;SOP-20%",
  };
}

function demoExtractTeslaIpb() {
  return {
    customer_contract_no: "TESLA-IPB-DEMO-001",
    customer_name: "Tesla",
    project_name: "Tesla IPB Integration",
    product_name: "IPB",
    contract_name: "Tesla IPB Demo Contract",
    total_amount: 180000,
    payment_terms: "SOD-30%;PPAP-40%;SOP-30%",
  };
}

function parseNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parsePaymentTerms(text) {
  return String(text || "")
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((item) => {
      const [node, pct] = item.split("-");
      const percent = parseNumber(String(pct || "").replace("%", ""));
      return { node: node?.trim() || "N/A", percent };
    })
    .filter((x) => x.percent > 0);
}

function calcNodeSplit(amount, terms) {
  return terms.map((t, i) => {
    const raw = (amount * t.percent) / 100;
    const value = i === terms.length - 1 ? amount - terms.slice(0, -1).reduce((a, x) => a + Math.round((amount * x.percent) / 100), 0) : Math.round(raw);
    return { node: t.node, percent: t.percent, amount: value };
  });
}

export default {
  title: "合同登记与申请",
  type: "流程/表单",
  async render() {
    return `
      ${renderTaskBar("按 上传→提取确认→SE3/PMS匹配→金额分配→提交确认 完成登记。")}
      <div class="stepper" id="intake-stepper"></div>
      <div id="intake-step-content"></div>
    `;
  },
  bind() {
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

    const allSe3Candidates = () => mergeById(state.se3Recommended, state.se3Extra, "snapshot_id");
    const allPmsCandidates = () => mergeById(state.pmsRecommended, state.pmsExtra, "project_id");
    const selectedSe3Rows = () => allSe3Candidates().filter((x) => state.selectedSe3.has(x.snapshot_id));
    const selectedPmsRows = () => allPmsCandidates().filter((x) => state.selectedPms.has(x.project_id));
    const paymentNodes = () => parsePaymentTerms(state.confirmedExtracted?.payment_terms || "");

    const renderStepper = () => {
      stepper.innerHTML = `<div class="actions">${stepTitles
        .map((s, i) => `<span class="badge ${state.step === i + 1 ? "status-info" : ""}">${safeText(s)}</span>`)
        .join("")}</div>`;
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
      document.querySelectorAll(".extract-field").forEach((el) => (out[el.dataset.key] = el.value));
      out.total_amount = parseNumber(out.total_amount);
      return out;
    };

    const renderStep1 = () => {
      root.innerHTML = `
        <div class="intake-step1-layout">
          <section class="focus-panel">
            <h3>上传合同并提取</h3>
            <div class="form-item"><label>合同类型</label>
              <select id="contract-type">
                <option value="OTP" ${state.contract_type === "OTP" ? "selected" : ""}>OTP 合同（本轮深度）</option>
                <option value="PRICE" ${state.contract_type === "PRICE" ? "selected" : ""}>Price 合同（仅入口）</option>
                <option value="MIX" ${state.contract_type === "MIX" ? "selected" : ""}>Mix 合同（仅入口）</option>
              </select>
            </div>
            <div class="form-item"><label>上传 Word / PDF 拟文合同</label>
              <input id="contract-file" type="file" accept=".doc,.docx,.pdf" />
            </div>
            <div class="actions">
              <button id="extract-btn">提取合同内容</button>
              <button class="secondary" id="confirm-extract-btn" ${state.extracted ? "" : "disabled"}>确认提取并进入下一步</button>
              <button class="secondary" id="load-demo-case-btn">载入演示案例（Tesla + IPB）</button>
            </div>
            <div class="empty-note" id="extract-msg">流程：上传 → 提取 → 人工复核后确认。</div>
          </section>
          <aside class="decision-panel intake-preview-panel">
            <h3>提取结果预览（可编辑复核）</h3>
            ${state.extracted ? extractedEditor(state.extracted) : '<div class="empty-note">暂无提取结果，请先上传并提取。</div>'}
          </aside>
        </div>
      `;

      document.getElementById("contract-type").onchange = (e) => {
        state.contract_type = e.target.value;
        if (state.contract_type !== "OTP") document.getElementById("extract-msg").textContent = "Price / Mix 本轮仅保留入口。";
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
      document.getElementById("load-demo-case-btn").onclick = () => {
        state.contract_type = "OTP";
        state.upload_file_name = "demo_tesla_ipb_contract.pdf";
        state.extracted = demoExtractTeslaIpb();
        document.getElementById("extract-msg").textContent = "已载入演示案例：Tesla + IPB。你仍可编辑所有提取字段后继续。";
        renderStep1();
      };
      const btn = document.getElementById("confirm-extract-btn");
      if (btn) {
        btn.onclick = async () => {
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
        <div class="focus-panel"><h3>SE3 报价单匹配</h3>
          <div class="actions compact-actions">
            <input id="se3-pid-search" placeholder="按 PID 搜索并加入候选" />
            <button class="secondary" id="se3-search-btn">搜索加入</button>
          </div>
          <h4>候选列表（统一勾选）</h4>
          ${renderSe3Table(allSe3Candidates())}
        </div>

        <div class="focus-panel" style="margin-top:12px;"><h3>PMS 项目匹配</h3>
          <div class="actions compact-actions">
            <input id="pms-mcr-search" placeholder="按 MCR 搜索" />
            <input id="pms-name-search" placeholder="按项目名搜索" />
            <button class="secondary" id="pms-search-btn">搜索加入</button>
          </div>
          <h4>候选列表（统一勾选）</h4>
          ${renderPmsTable(allPmsCandidates())}
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
        const rows = await fetchJson(`/api/ops/se3-snapshots?pid=${encodeURIComponent(pid)}`, []);
        state.se3Extra = mergeById(state.se3Extra, rows, "snapshot_id");
        renderStep2();
      };
      document.getElementById("pms-search-btn").onclick = async () => {
        const mcr = document.getElementById("pms-mcr-search").value.trim();
        const name = document.getElementById("pms-name-search").value.trim();
        const q = new URLSearchParams();
        if (mcr) q.set("mcr", mcr);
        if (name) q.set("project_name", name);
        const rows = await fetchJson(`/api/ops/pms-projects?${q.toString()}`, []);
        state.pmsExtra = mergeById(state.pmsExtra, rows, "project_id");
        renderStep2();
      };
      document.getElementById("back-step1").onclick = () => {
        state.step = 1;
        renderAll();
      };
      document.getElementById("to-step3").onclick = () => {
        if (!selectedPmsRows().length) {
          document.getElementById("match-msg").textContent = "至少选择一个 PMS 项目。";
          return;
        }
        initDefaultAllocation();
        state.step = 3;
        renderAll();
      };
    };

    const renderStep3 = () => {
      const projects = selectedPmsRows();
      const nodes = paymentNodes();
      root.innerHTML = `
        <div class="task-bar">总金额：${parseNumber(state.confirmedExtracted.total_amount).toLocaleString()}；默认均分到所选 PMS；Others/Buffer 默认 0。</div>
        <div class="allocation-grid">
          ${projects
            .map((p) => {
              const amount = parseNumber(state.allocations[p.project_id]);
              const splits = calcNodeSplit(amount, nodes);
              return `<article class="allocation-card">
                <h4>${safeText(p.project_name)}</h4>
                <p class="card-hint">PjM：${safeText(p.pjm_owner)} ｜ 备注：${safeText(p.remark_from_pjm || "-")}</p>
                <div class="form-item"><label>分配金额</label><input class="alloc-input" data-id="${p.project_id}" value="${amount}" /></div>
                <div class="chip-row">${splits.map((s) => `<span class="badge">${safeText(s.node)} ${s.percent}% = ${s.amount}</span>`).join(" ")}</div>
              </article>`;
            })
            .join("")}
          <article class="allocation-card allocation-buffer">
            <h4>Others / Buffer</h4>
            <div class="form-item"><label>分配金额</label><input id="others-buffer" value="${state.others_buffer}" /></div>
            <div class="chip-row"><span class="badge">默认 0，用于兜底差额。</span></div>
          </article>
        </div>
        <div class="actions">
          <button class="secondary" id="back-step2">上一步</button>
          <button id="to-step4">校验并进入提交确认</button>
          <span id="alloc-msg"></span>
        </div>
      `;

      document.querySelectorAll(".alloc-input").forEach((el) => {
        el.oninput = () => {
          state.allocations[el.dataset.id] = parseNumber(el.value);
          validateAllocation(true);
        };
      });
      document.getElementById("others-buffer").oninput = (e) => {
        state.others_buffer = parseNumber(e.target.value);
        validateAllocation(true);
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
      const terms = paymentNodes();
      const projects = selectedPmsRows();
      const allocTotal = Object.values(state.allocations).reduce((a, b) => a + parseNumber(b), 0) + parseNumber(state.others_buffer);
      const total = parseNumber(state.confirmedExtracted.total_amount);
      root.innerHTML = `
        <div class="intake-confirm-layout">
          <section class="focus-panel">
            <h3>提交前完整确认</h3>
            <h4>合同基础信息</h4>
            <div class="form-grid">
              <div><strong>合同类型：</strong>${safeText(state.contract_type)}</div>
              <div><strong>上传文件：</strong>${safeText(state.upload_file_name || "-")}</div>
              <div><strong>客户名：</strong>${safeText(state.confirmedExtracted.customer_name)}</div>
              <div><strong>合同名称：</strong>${safeText(state.confirmedExtracted.contract_name)}</div>
              <div><strong>项目名：</strong>${safeText(state.confirmedExtracted.project_name)}</div>
              <div><strong>总金额：</strong>${safeText(total)}</div>
            </div>

            <h4>提取字段 / 分期节点</h4>
            <p>${safeText(state.confirmedExtracted.payment_terms)}</p>
            <div class="chip-row">${terms.map((t) => `<span class="badge status-info">${safeText(t.node)} ${t.percent}%</span>`).join(" ")}</div>

            <h4>匹配结果</h4>
            <p><strong>SE3：</strong>${selectedSe3Rows().map((x) => safeText(x.pid)).join("，") || "-"}</p>
            <p><strong>PMS：</strong>${projects.map((x) => safeText(x.project_name)).join("，") || "-"}</p>

            <h4>分配结果（含节点拆分）</h4>
            ${projects
              .map((p) => {
                const amount = parseNumber(state.allocations[p.project_id]);
                return `<div class="confirm-project-block">
                  <strong>${safeText(p.project_name)}：</strong>${amount}
                  <div class="chip-row">${calcNodeSplit(amount, terms)
                    .map((s) => `<span class="badge">${safeText(s.node)} ${s.amount}</span>`)
                    .join(" ")}</div>
                </div>`;
              })
              .join("")}
            <div class="confirm-project-block"><strong>Others / Buffer：</strong>${safeText(state.others_buffer)}</div>
          </section>

          <aside class="decision-panel">
            <h3>提交校验摘要</h3>
            <p>合同总额：<strong>${total}</strong></p>
            <p>分配合计：<strong>${allocTotal}</strong></p>
            <p>金额平衡：<strong>${allocTotal === total ? "通过" : "不通过"}</strong></p>
            <p>原文件快照入口：<span class="badge">${safeText(state.upload_file_name || "无")}</span></p>
            <div class="actions">
              <button class="secondary" id="back-step3">返回调整</button>
              <button id="submit-contract">确认提交</button>
            </div>
            <div id="submit-msg"></div>
          </aside>
        </div>
        <div id="submit-result" style="margin-top:12px;">${state.submitResult ? renderSubmitResult(state.submitResult) : ""}</div>
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
          se3_matches: selectedSe3Rows(),
          pms_matches: projects,
          allocations: {
            projects: Object.entries(state.allocations).map(([project_id, amount]) => ({ project_id, amount: parseNumber(amount) })),
            others_buffer: parseNumber(state.others_buffer),
            payment_nodes: terms,
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

    const renderSubmitResult = (res) => `
      <div class="success-hero">
        <div class="success-icon">✓</div>
        <div>
          <h3>提交成功</h3>
          <p>Dummy合同号：<strong id="dummy-id">${safeText(res.contract_case_id)}</strong></p>
          <p>下游流转：CM 校验 → CA 签字 → CM 寄送合同 → CM 归档合同</p>
          <div class="actions">
            <button class="secondary" id="copy-dummy-id">复制合同号</button>
            <button id="goto-tracking">进入合同进度追踪</button>
          </div>
        </div>
      </div>
    `;

    const bindSuccessActions = (res) => {
      const copyBtn = document.getElementById("copy-dummy-id");
      if (copyBtn) copyBtn.onclick = async () => navigator.clipboard?.writeText(res.contract_case_id);
      const goTrack = document.getElementById("goto-tracking");
      if (goTrack) goTrack.onclick = () => (location.hash = `/ops/contracts/tracking?q=${encodeURIComponent(res.contract_case_id)}`);
    };

    const renderSe3Table = (rows) =>
      rows.length
        ? `<div class="table-wrap"><table class="table"><thead><tr><th>选</th><th>PID</th><th>配置名</th><th>OTP</th><th>OTC</th><th>支付年份</th><th>Sys EBIT</th><th>Sys EBIT%</th></tr></thead><tbody>${rows
            .map(
              (r) => `<tr>
                <td><input type="checkbox" class="se3-check" data-id="${r.snapshot_id}" ${state.selectedSe3.has(r.snapshot_id) ? "checked" : ""}/></td>
                <td>${safeText(r.pid)}</td><td>${safeText(r.configuration_name)}</td><td>${safeText(r.otp_amount)}</td><td>${safeText(r.otc_amount)}</td><td>${safeText(r.payment_year)}</td><td>${safeText(r.sys_ebit_amount)}</td><td>${safeText(r.sys_ebit_percent)}</td>
              </tr>`
            )
            .join("")}</tbody></table></div>`
        : '<div class="empty-note">暂无 SE3 候选</div>';

    const renderPmsTable = (rows) =>
      rows.length
        ? `<div class="table-wrap"><table class="table"><thead><tr><th>选</th><th>项目名</th><th>system project type</th><th>project status</th><th>关联PID</th><th>关联MCRL0</th><th>PjM负责人</th><th>remark from pjm</th></tr></thead><tbody>${rows
            .map(
              (r) => `<tr>
                <td><input type="checkbox" class="pms-check" data-id="${r.project_id}" ${state.selectedPms.has(r.project_id) ? "checked" : ""}/></td>
                <td>${safeText(r.project_name)}</td><td>${safeText(r.system_project_type)}</td><td>${safeText(r.project_status)}</td><td>${safeText(r.related_pid)}</td><td>${safeText(r.related_mcrl0)}</td><td>${safeText(r.pjm_owner)}</td><td>${safeText(r.remark_from_pjm)}</td>
              </tr>`
            )
            .join("")}</tbody></table></div>`
        : '<div class="empty-note">暂无 PMS 候选</div>';

    const bindSelectionHandlers = () => {
      document.querySelectorAll(".se3-check").forEach((el) => {
        el.onchange = () => (el.checked ? state.selectedSe3.add(el.dataset.id) : state.selectedSe3.delete(el.dataset.id));
      });
      document.querySelectorAll(".pms-check").forEach((el) => {
        el.onchange = () => (el.checked ? state.selectedPms.add(el.dataset.id) : state.selectedPms.delete(el.dataset.id));
      });
    };

    const initDefaultAllocation = () => {
      const selected = selectedPmsRows();
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
        const msgEl = document.getElementById("alloc-msg");
        if (msgEl) msgEl.textContent = ok ? "金额校验通过。" : `金额不平：总额 ${total}，分配 ${allocTotal}`;
      }
      return ok ? "" : "金额分配合计必须等于合同总金额。";
    };

    const validateAllBeforeSubmit = () => {
      if (!state.confirmedExtracted) return "请先完成提取确认。";
      if (!selectedPmsRows().length) return "PMS 项目是必填。";
      return validateAllocation();
    };

    const mergeById = (a, b, id) => {
      const m = new Map();
      [...(a || []), ...(b || [])].forEach((x) => m.set(x[id], x));
      return Array.from(m.values());
    };

    const renderAll = () => {
      renderStepper();
      if (state.step === 1) renderStep1();
      if (state.step === 2) renderStep2();
      if (state.step === 3) renderStep3();
      if (state.step === 4) renderStep4();
    };

    renderAll();
  },
};
