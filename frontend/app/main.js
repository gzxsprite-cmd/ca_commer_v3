import { fetchJson } from "./shared/api.js";
import { renderIdentity } from "./shared/ui.js";
import {
  currentRole,
  currentUser,
  currentWorkspace,
  enabledWorkspaces,
  setShellConfig,
  state,
  visibleNavItems,
  workspaceAllowedRoles,
} from "./shared/state.js";
import { routes } from "./routes.js";

function parseHash() {
  const raw = location.hash.replace(/^#/, "") || getDefaultPath();
  const [path, queryString = ""] = raw.split("?");
  return { path, query: new URLSearchParams(queryString) };
}

function getDefaultPath() {
  const items = visibleNavItems(state.workspace, state.role);
  return items[0]?.route || "/ops/am/home";
}

function availableRoutes() {
  const visibleRoutes = new Set(visibleNavItems(state.workspace, state.role).map((n) => n.route));
  return routes.filter((r) => {
    if (r.workspace !== state.workspace || !r.roles.includes(state.role)) return false;
    if (r.hiddenNav) return true;
    return visibleRoutes.has(r.path);
  });
}

function renderTopWorkspaceSwitcher() {
  const el = document.getElementById("workspace-switcher-top");
  el.innerHTML = enabledWorkspaces()
    .map((w) => `<button class="workspace-tab ${w.code === state.workspace ? "active" : ""}" data-ws="${w.code}">${w.label}</button>`)
    .join("");

  el.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => {
      state.workspace = btn.dataset.ws;
      const allowedRoles = workspaceAllowedRoles(state.workspace);
      if (!allowedRoles.includes(state.role)) state.role = allowedRoles[0] || state.role;
      location.hash = getDefaultPath();
      render();
    };
  });
}

function renderTopRightIdentity() {
  const roleEl = document.getElementById("role-switcher-top");
  const userEl = document.getElementById("user-identity");
  const allowedRoles = workspaceAllowedRoles(state.workspace);

  roleEl.innerHTML = allowedRoles.map((code) => {
    const role = state.roles.find((r) => r.code === code);
    return `<option value="${code}">${role?.label || code}</option>`;
  });
  if (!allowedRoles.includes(state.role)) state.role = allowedRoles[0] || state.role;
  roleEl.value = state.role;

  roleEl.onchange = () => {
    state.role = roleEl.value;
    location.hash = getDefaultPath();
    render();
  };

  const user = currentUser();
  userEl.textContent = `${user.display_name || "Demo User"}（${currentRole().label}）`;
}

function renderSideNav() {
  const nav = document.getElementById("side-nav");
  const { path: current } = parseHash();
  nav.innerHTML = visibleNavItems(state.workspace, state.role)
    .map((n) => `<button class="nav-link ${n.route === current ? "active" : ""}" data-path="${n.route}">${n.label}</button>`)
    .join("");

  nav.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => {
      location.hash = btn.dataset.path;
      render();
    };
  });
}

async function renderPage() {
  const { path, query } = parseHash();
  const route = availableRoutes().find((r) => r.path === path);
  if (!route) {
    location.hash = getDefaultPath();
    return renderPage();
  }

  const mod = await route.load();
  const page = mod.default;
  const identity = document.getElementById("page-identity");
  identity.innerHTML = renderIdentity(page, currentRole().label, currentWorkspace().label);

  const html = await page.render({ state, fetchJson, query, route });
  const content = document.getElementById("page-content");
  content.innerHTML = html;

  if (page.bind) page.bind({ state, fetchJson, query, route });
}

function render() {
  renderTopWorkspaceSwitcher();
  renderTopRightIdentity();
  renderSideNav();
  renderPage();
}

async function boot() {
  const config = await fetchJson("/api/shell/config", {});
  setShellConfig(config);
  const allowed = workspaceAllowedRoles(state.workspace);
  if (!allowed.includes(state.role)) state.role = allowed[0] || state.role;
  if (!enabledWorkspaces().some((w) => w.code === state.workspace)) {
    state.workspace = enabledWorkspaces()[0]?.code || "ops";
  }
  render();
}

window.addEventListener("hashchange", render);
boot();
