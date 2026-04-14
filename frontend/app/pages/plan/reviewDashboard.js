import { makeReviewPage } from "../pageFactories.js";

export default makeReviewPage({
  title: "管理复盘看板",
  taskHint: "聚焦异常趋势和待决策事项。",
  api: "/api/plan/review-dashboard",
});
