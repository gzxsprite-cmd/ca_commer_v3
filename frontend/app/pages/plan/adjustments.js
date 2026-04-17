import { makeFormPage } from "../pageFactories.js";

export default makeFormPage({
  title: "计划调整申请",
  taskHint: "说明原因、影响和建议动作，便于管理判断。",
  submitText: "提交调整申请",
  api: "/api/plan/adjustments",
  fields: [
    { key: "scope_key", label: "调整范围", placeholder: "如 portfolio / 客户组" },
    { key: "adjustment_reason", label: "调整原因", placeholder: "请输入调整原因" },
    { key: "delta_value", label: "调整值", placeholder: "如 -15000" },
  ],
  extraPayload: (state) => ({ proposed_by_role: state.role }),
});
