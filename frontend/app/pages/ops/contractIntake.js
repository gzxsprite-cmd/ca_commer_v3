import { makeFormPage } from "../pageFactories.js";

export default makeFormPage({
  title: "合同登记与申请",
  taskHint: "补齐关键信息后提交，进入CM审核。",
  submitText: "提交合同申请",
  api: "/api/ops/contracts/intake",
  fields: [
    { key: "contract_code", label: "合同编号", placeholder: "如 CA-2026-001" },
    { key: "customer_name", label: "客户名称", placeholder: "请输入客户名称" },
  ],
});
