import { renderCards, renderTaskBar, safeText } from "../../shared/ui.js";

const statusCards = [
  { key: "pending_cm_confirm", title: "待CM确认的" },
  { key: "pending_ca_sign", title: "待CA签字的" },
  { key: "pending_cm_send", title: "待CM寄出的" },
  { key: "pending_cm_archive", title: "待CM归档的" },
  { key: "completed", title: "已完成的" },
  { key: "archive_exception", title: "关闭-有异常" },
];

export default {
  title: "AM 今日执行首页",
  type: "角色首页",
  async render({ fetchJson }) {
    const counts = await fetchJson("/api/ops/am/status-counts", {});
    const cards = statusCards.map((c) => ({
      title: c.title,
      value: counts[c.key] ?? 0,
      hint: "点击查看对应进度",
      key: c.key,
    }));

    return `
      ${renderTaskBar("今日建议：先处理在审与待确认合同，再发起新的合同登记。")}
      <div id="am-status-cards">${renderCards(cards)}</div>
      <div class="empty-note">点击卡片将进入“合同进度追踪”并自动带入流转状态筛选。</div>
    `;
  },
  bind() {
    document.querySelectorAll("#am-status-cards .card").forEach((card, idx) => {
      card.style.cursor = "pointer";
      card.onclick = () => {
        const key = statusCards[idx].key;
        location.hash = `/ops/contracts/tracking?status=${encodeURIComponent(key)}`;
      };
    });
  },
};
