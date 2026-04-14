export const statusLabel = {
  draft: "草稿",
  submitted: "已提交",
  cm_in_review: "CM审核中",
  ca_pending_signature: "待CA签署",
  ca_signed: "CA已签署",
  sent_to_customer: "已发客户",
  dual_signed_returned: "双签回收",
  execution_closed: "执行关闭",
  not_archived: "未归档",
  archived_indexed: "已归档",
  outstanding: "有未收款",
  overdue_risk: "逾期风险",
  clear: "已清",
  plan_pending: "计划待执行",
  planning_under_review: "计划评审中",
  planning_published: "计划已发布",
  planning_revised: "计划已修订",
  adjustment_in_assessment: "调整评估中",
  adjustment_proposed: "已提出调整",
  allocated_to_contracts: "已分配到合同",
};

export function cnStatus(raw) {
  return statusLabel[raw] || raw || "-";
}

export function badgeClass(text) {
  if (!text) return "status-info";
  if (text.includes("风险") || text.includes("阻塞") || text.includes("逾期")) return "status-danger";
  if (text.includes("待") || text.includes("评估") || text.includes("审核")) return "status-warning";
  if (text.includes("已") || text.includes("完成") || text.includes("关闭") || text.includes("清")) return "status-success";
  return "status-info";
}
