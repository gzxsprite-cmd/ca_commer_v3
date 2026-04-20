import { makeListPage } from "../pageFactories.js";

export default makeListPage({
  title: "成本覆盖评估",
  taskHint: "识别覆盖不足项目并准备调整建议。",
  api: "/api/plan/cost-coverage",
});
