import { makeHomePage } from "../pageFactories.js";

export default makeHomePage({
  title: "AM 今日执行首页",
  taskHint: "先看待办合同与应收风险，再进入登记或追踪。",
  cardsFromApi: "/api/home/cards",
  fallbackCards: [
    { title: "我发起的待推进合同", value: "--", hint: "等待数据" },
    { title: "待CA签署合同", value: "--", hint: "等待数据" },
    { title: "我的应收未回款", value: "--", hint: "等待数据" },
  ],
});
