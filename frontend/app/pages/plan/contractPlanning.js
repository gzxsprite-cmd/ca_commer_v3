import { makeListPage } from "../pageFactories.js";

export default makeListPage({
  title: "合同计划视图",
  taskHint: "按合同维度查看未来回款与计划状态。",
  api: "/api/plan/contracts",
});
