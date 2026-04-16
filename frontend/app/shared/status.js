export const statusLabel = {
  draft: "草稿",
  submitted: "待CM确认",
  submitted_in_review: "待CM确认",
  pending_cm_confirm: "待CM确认",
  cm_in_review: "待CM确认",
  pending_ca_sign: "待CA签字",
  ca_pending_signature: "待CA签字",
  pending_cm_send: "待CM寄送",
  pending_cm_archive: "待CM归档",
  completed: "关闭-已归档",
  execution_closed: "关闭-已归档",
  archive_exception: "关闭-归档异常",
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
