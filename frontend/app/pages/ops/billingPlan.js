import { makeListPage } from "../pageFactories.js";

export default makeListPage({
  title: "开票计划",
  taskHint: "以月度节奏维护计划，确保与执行一致。",
  api: "/api/ops/billing/plan",
});
