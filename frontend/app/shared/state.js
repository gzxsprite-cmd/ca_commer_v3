export const roles = [
  { code: "AM", label: "AM（客户经理）", hint: "负责合同发起与进度跟进" },
  { code: "CM", label: "CM（商务管理）", hint: "负责合规审核与账款执行" },
  { code: "SCP", label: "SCP（计划分析）", hint: "负责计划分解与偏差调整" },
  { code: "CA", label: "CA（审批管理）", hint: "负责签署审批与管理复盘" },
];

export const workspaces = [
  { code: "ops", label: "合同与开票执行", desc: "执行工作区" },
  { code: "plan", label: "计划与复盘管理", desc: "管理工作区" },
];

export const state = { role: "AM", workspace: "ops" };

export function currentRole() {
  return roles.find((r) => r.code === state.role);
}

export function currentWorkspace() {
  return workspaces.find((w) => w.code === state.workspace);
}
