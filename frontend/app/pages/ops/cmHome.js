import { fetchJson } from "../../shared/api.js";
import { renderCards, renderTaskBar } from "../../shared/ui.js";

const cmStatusCards = [
  { key: "pending_cm_confirm", title: "待CM确认" },
  { key: "pending_ca_sign", title: "待CA签字" },
  { key: "pending_cm_send", title: "待CM寄出" },
  { key: "pending_cm_archive", title: "待CM归档" },
  { key: "completed", title: "关闭-已归档" },
  { key: "archive_exception", title: "关闭-归档异常" },
];

export default {
  title: "CM 商务执行首页",
  type: "角色首页",
  async render() {
    const summary = await fetchJson("/api/ops/cm/home-summary", { recent_items: [] });
    const cards = cmStatusCards.map((c) => ({
      title: c.title,
      value: summary[c.key] ?? 0,
      hint: "点击进入合同跟进列表",
      key: c.key,
    }));

    return `
      ${renderTaskBar("先处理待CM确认/待CM归档，再处理寄出与异常闭环。")}
      <div id="cm-home-cards">${renderCards(cards)}</div>
    `;
  },
  bind() {
    document.querySelectorAll("#cm-home-cards .card").forEach((card, idx) => {
      card.style.cursor = "pointer";
      card.onclick = () => {
        const key = cmStatusCards[idx].key;
        location.hash = `/ops/contracts/tracking?status=${encodeURIComponent(key)}`;
      };
    });
  },
};
