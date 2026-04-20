import { postJson } from "../shared/api.js";
import { detectColumns, renderCards, renderTable, renderTaskBar, safeText } from "../shared/ui.js";
import { cnStatus } from "../shared/status.js";

export function makeHomePage({ title, taskHint, cardsFromApi, fallbackCards }) {
  return {
    title,
    type: "角色首页",
    async render({ state, fetchJson }) {
      const data = cardsFromApi
        ? await fetchJson(`${cardsFromApi}?workspace=${state.workspace}&role=${state.role}`)
        : [];
      const cards = data.length
        ? data.map((d) => ({ title: d.metric_label, value: d.metric_value, hint: `趋势：${d.trend_hint || "-"}` }))
        : fallbackCards;
      return `${renderTaskBar(`今日建议：${taskHint}`)}${renderCards(cards)}<div class="empty-note">先处理待办，再进入具体页面推进。</div>`;
    },
  };
}

export function makeListPage({ title, taskHint, api }) {
  return {
    title,
    type: "列表/追踪",
    async render({ fetchJson }) {
      const rows = await fetchJson(api);
      const cols = detectColumns(rows[0]);
      return `${renderTaskBar(`任务关注：${taskHint}`)}${renderTable(cols, rows.slice(0, 18))}`;
    },
  };
}

export function makeFormPage({ title, taskHint, submitText, api, fields, extraPayload }) {
  return {
    title,
    type: "流程/表单",
    async render() {
      return `
        ${renderTaskBar(`操作说明：${taskHint}`)}
        <div class="form-grid">
          ${fields
            .map(
              (f) => `<div class="form-item"><label>${safeText(f.label)}</label><input name="${f.key}" placeholder="${safeText(
                f.placeholder
              )}"/></div>`
            )
            .join("")}
        </div>
        <div class="actions">
          <button id="submit-form">${submitText}</button>
          <button id="reset-form" class="secondary">清空输入</button>
          <span id="form-msg"></span>
        </div>`;
    },
    bind({ state }) {
      const submitBtn = document.getElementById("submit-form");
      const resetBtn = document.getElementById("reset-form");
      const msg = document.getElementById("form-msg");
      if (resetBtn) {
        resetBtn.onclick = () => {
          document.querySelectorAll("#page-content input").forEach((el) => (el.value = ""));
          msg.textContent = "";
        };
      }
      if (!submitBtn) return;
      submitBtn.onclick = async () => {
        const payload = {};
        document.querySelectorAll("#page-content input").forEach((el) => {
          if (el.name) payload[el.name] = el.value;
        });
        if (extraPayload) Object.assign(payload, extraPayload(state));
        try {
          await postJson(api, payload);
          msg.textContent = "已保存，可在对应列表页查看。";
        } catch {
          msg.textContent = "保存失败，请检查输入或稍后重试。";
        }
      };
    },
  };
}

export function makeReviewPage({ title, taskHint, api }) {
  return {
    title,
    type: "评审/决策",
    async render({ fetchJson }) {
      const rows = await fetchJson(api);
      const focus = rows.slice(0, 6);
      const cols = detectColumns(focus[0]);
      return `
        ${renderTaskBar(`评审关注：${taskHint}`)}
        <div class="review-layout">
          <section class="focus-panel">
            <h3>待关注事项</h3>
            ${focus.length ? renderTable(cols, focus) : '<div class="empty-note">暂无待评审事项</div>'}
          </section>
          <section class="decision-panel">
            <h3>决策提醒</h3>
            <p>优先处理长期停留、风险状态、责任不清的条目。</p>
            <div class="actions"><button>进入重点处理</button><button class="secondary">仅查看高风险</button></div>
          </section>
        </div>`;
    },
  };
}

export function makeDetailPage({ title, taskHint, api }) {
  return {
    title,
    type: "详情/抽屉",
    async render({ fetchJson }) {
      const rows = await fetchJson(api);
      const cols = detectColumns(rows[0]);
      const first = rows[0] || {};
      return `
        ${renderTaskBar(`详情目标：${taskHint}`)}
        <div class="detail-layout">
          <section>${renderTable(cols, rows.slice(0, 12))}</section>
          <aside class="detail-side">
            <h3>记录侧栏</h3>
            <p><strong>合同：</strong>${safeText(first.contract_code || "-")}</p>
            <p><strong>当前状态：</strong>${safeText(cnStatus(first.execution_status || first.archive_status || "-"))}</p>
            <p><strong>当前责任人：</strong>${safeText(first.current_owner_role || "-")}</p>
            <p><strong>下一步：</strong>${safeText(first.next_step_label || "确认归档信息")}</p>
            <div class="empty-note">侧栏用于不跳页查看关键信息。</div>
          </aside>
        </div>`;
    },
  };
}
