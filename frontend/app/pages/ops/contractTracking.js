import { makeListPage } from "../pageFactories.js";

export default makeListPage({
  title: "合同进度追踪",
  taskHint: "关注阻塞状态、当前责任人、下一步动作。",
  api: "/api/ops/contracts/tracking",
});
