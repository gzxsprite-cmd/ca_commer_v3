import { makeHomePage } from "../pageFactories.js";

export default makeHomePage({
  title: "CM 商务执行首页",
  taskHint: "优先处理待审核与待更新节点，再处理开票与计划。",
  cardsFromApi: "/api/home/cards",
  fallbackCards: [
    { title: "待审核提交", value: "--", hint: "等待数据" },
    { title: "本月开票计划金额", value: "--", hint: "等待数据" },
    { title: "待处理应收风险", value: "--", hint: "等待数据" },
  ],
});
