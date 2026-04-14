import { makeFormPage } from "../pageFactories.js";

export default makeFormPage({
  title: "开票登记",
  taskHint: "按实际开票信息登记并关联合同。",
  submitText: "提交开票登记",
  api: "/api/ops/billing/execution",
  fields: [
    { key: "billing_date", label: "开票日期", placeholder: "YYYY-MM-DD" },
    { key: "amount", label: "开票金额", placeholder: "请输入金额" },
    { key: "linked_contract_case_ids", label: "关联合同", placeholder: "如 CC-001,CC-002" },
  ],
});
