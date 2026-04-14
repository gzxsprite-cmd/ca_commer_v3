import { makeListPage } from "../pageFactories.js";

export default makeListPage({
  title: "开票计划复盘",
  taskHint: "核对计划与执行偏差并标注下一步。",
  api: "/api/plan/billing",
});
