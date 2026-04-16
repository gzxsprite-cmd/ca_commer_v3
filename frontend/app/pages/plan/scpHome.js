import { makeHomePage } from "../pageFactories.js";

export default makeHomePage({
  title: "SCP 计划与调整首页",
  taskHint: "先看计划偏差，再处理分解、覆盖和调整。",
  cardsFromApi: "/api/home/cards",
  fallbackCards: [
    { title: "管理合同总数", value: "--", hint: "等待数据" },
    { title: "未来三个月计划回款", value: "--", hint: "等待数据" },
    { title: "待处理调整单", value: "--", hint: "等待数据" },
  ],
});
