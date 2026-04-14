import { makeReviewPage } from "../pageFactories.js";

export default makeReviewPage({
  title: "合同审核队列",
  taskHint: "先处理高风险或长期滞留项，明确结论与动作。",
  api: "/api/ops/contracts/review-queue",
});
