export const state = {
  role: "AM",
  workspace: "ops",
  workspaces: [],
  roles: [],
  workspaceRoleVisibility: [],
  navItems: [],
  navRoleVisibility: [],
  users: [],
};

export function setShellConfig(config) {
  state.workspaces = (config.workspaces || []).map((w) => ({
    code: w.workspace_code,
    label: w.workspace_label,
    order: Number(w.display_order || 999),
    enabled: String(w.is_enabled) === "1",
  }));
  state.roles = (config.roles || []).map((r) => ({
    code: r.role_code,
    label: r.role_label,
    order: Number(r.display_order || 999),
    enabled: String(r.is_enabled) === "1",
  }));
  state.workspaceRoleVisibility = config.workspace_role_visibility || [];
  state.navItems = (config.nav_items || []).map((n) => ({
    key: n.nav_key,
    label: n.nav_label,
    workspace: n.workspace_code,
    route: n.route,
    order: Number(n.display_order || 999),
    enabled: String(n.is_enabled) === "1",
  }));
  state.navRoleVisibility = config.nav_role_visibility || [];
  state.users = config.users || [];

  if (!workspaceAllowedRoles(state.workspace).includes(state.role)) {
    state.role = workspaceAllowedRoles(state.workspace)[0] || "AM";
  }
}

export function enabledWorkspaces() {
  return [...state.workspaces].filter((w) => w.enabled).sort((a, b) => a.order - b.order);
}

export function enabledRoles() {
  return [...state.roles].filter((r) => r.enabled).sort((a, b) => a.order - b.order);
}

export function workspaceAllowedRoles(workspaceCode) {
  const allowed = state.workspaceRoleVisibility
    .filter((x) => x.workspace_code === workspaceCode && String(x.is_visible) === "1")
    .map((x) => x.role_code);
  return enabledRoles()
    .map((r) => r.code)
    .filter((code) => allowed.includes(code));
}

export function visibleNavItems(workspaceCode, roleCode) {
  const roleVisibleNavKeys = state.navRoleVisibility
    .filter((x) => x.role_code === roleCode && String(x.is_visible) === "1")
    .map((x) => x.nav_key);

  return state.navItems
    .filter((n) => n.enabled && n.workspace === workspaceCode && roleVisibleNavKeys.includes(n.key))
    .sort((a, b) => a.order - b.order);
}

export function currentRole() {
  return enabledRoles().find((r) => r.code === state.role) || enabledRoles()[0] || { code: "", label: "" };
}

export function currentWorkspace() {
  return enabledWorkspaces().find((w) => w.code === state.workspace) || enabledWorkspaces()[0] || { code: "", label: "" };
}

export function currentUser() {
  return state.users.find((u) => u.role_code === state.role) || state.users[0] || { display_name: "Demo User" };
}
