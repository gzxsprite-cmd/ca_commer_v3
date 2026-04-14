import { fetchJson } from "./shared/api.js";
import { renderIdentity } from "./shared/ui.js";
import { currentRole, currentWorkspace, roles, state, workspaces } from "./shared/state.js";
import { routes } from "./routes.js";

function parseHash() {
  const raw = location.hash.replace(/^#/, "") || getDefaultPath();
  const [path, queryString = ""] = raw.split("?");
  return { path, query: new URLSearchParams(queryString) };
}

function getDefaultPath() {
  if (state.workspace === "ops") {
    if (state.role === "CM") return "/ops/cm/home";
    if (state.role === "CA") return "/ops/ca/home";
    return "/ops/am/home";
  }
  if (state.role === "CA") return "/plan/ca/home";
  return "/plan/scp/home";
}

function availableRoutes() {
  return routes.filter((r) => r.workspace === state.workspace && r.roles.includes(state.role));
}

function renderGlobalContext() {
  const el = document.getElementById("global-context");
  const ws = currentWorkspace();
  const role = currentRole();
  el.innerHTML = `
    <span class="context-chip strong">${ws.label}</span>
    <span class="context-chip">${ws.desc}</span>
    <span class="context-chip strong">当前角色：${role.label}</span>
  `;
}

function renderSwitchers() {
  const wsEl = document.getElementById("workspace-switcher");
  const roleEl = document.getElementById("role-switcher");
  wsEl.innerHTML = workspaces.map((w) => `<option value="${w.code}">${w.label}</option>`).join("");
  roleEl.innerHTML = roles.map((r) => `<option value="${r.code}">${r.label}</option>`).join("");
  wsEl.value = state.workspace;
  roleEl.value = state.role;

  wsEl.onchange = () => {
    state.workspace = wsEl.value;
    location.hash = getDefaultPath();
    render();
  };
  roleEl.onchange = () => {
    state.role = roleEl.value;
    location.hash = getDefaultPath();
    render();
  };
}

function renderSideNav() {
  const nav = document.getElementById("side-nav");
  const { path: current } = parseHash();
  nav.innerHTML = availableRoutes()
    .map((r) => `<button class="nav-link ${r.path === current ? "active" : ""}" data-path="${r.path}">${r.nav}</button>`)
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

  if (page.bind) {
    page.bind({ state, fetchJson, query, route });
  }
}

function render() {
  renderGlobalContext();
  renderSwitchers();
  renderSideNav();
  renderPage();
}

window.addEventListener("hashchange", render);
render();
