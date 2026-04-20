import { makeHomePage } from "../pageFactories.js";

export default makeHomePage({
  title: "CA 管理复盘首页",
  taskHint: "先看管理摘要，再关注需要决策的异常。",
  cardsFromApi: "/api/home/cards",
  fallbackCards: [
    { title: "管理看板关键指标", value: "--", hint: "等待数据" },
    { title: "目标达成趋势", value: "--", hint: "等待数据" },
    { title: "需要决策事项", value: "--", hint: "等待数据" },
  ],
});
