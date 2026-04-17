import { makeListPage } from "../pageFactories.js";

export default makeListPage({
  title: "目标分解与分配",
  taskHint: "从区域目标到客户目标分层拆解。",
  api: "/api/plan/targets",
});
