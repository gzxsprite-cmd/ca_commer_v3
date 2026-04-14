import { makeDetailPage } from "../pageFactories.js";

export default makeDetailPage({
  title: "合同归档与详情",
  taskHint: "先定位目标合同，再查看责任链路与后续事项。",
  api: "/api/ops/contracts/archive",
});
