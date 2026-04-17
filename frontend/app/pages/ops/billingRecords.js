import { makeListPage } from "../pageFactories.js";

export default makeListPage({
  title: "开票记录",
  taskHint: "追踪开票记录与合同分配是否清晰。",
  api: "/api/ops/billing/records",
});
