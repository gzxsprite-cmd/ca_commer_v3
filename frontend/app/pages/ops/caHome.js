import { makeHomePage } from "../pageFactories.js";

export default makeHomePage({
  title: "CA 签署与复核首页",
  taskHint: "优先处理待签合同，再查看近期签署回顾。",
  cardsFromApi: "/api/home/cards",
  fallbackCards: [
    { title: "待签署合同", value: "--", hint: "等待数据" },
    { title: "已签署回顾", value: "--", hint: "等待数据" },
    { title: "需关注异常项", value: "--", hint: "等待数据" },
  ],
});
