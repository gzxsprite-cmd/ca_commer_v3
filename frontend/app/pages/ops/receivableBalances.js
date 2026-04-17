import { makeListPage } from "../pageFactories.js";

export default makeListPage({
  title: "应收账款与合同余额",
  taskHint: "优先关注高余额和高风险项。",
  api: "/api/ops/receivables/balances",
});
