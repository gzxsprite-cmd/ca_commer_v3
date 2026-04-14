const roles = ["AM", "CM", "SCP", "CA"];
const workspaces = [
  { code: "ops", name: "Contract & Billing Operations" },
  { code: "plan", name: "Planning & Review" },
];

const routes = [
  { path: "/ops/am/home", workspace: "ops", label: "AM Home", roles: ["AM"], kind: "home" },
  { path: "/ops/cm/home", workspace: "ops", label: "CM Home", roles: ["CM"], kind: "home" },
  { path: "/ops/ca/home", workspace: "ops", label: "CA Home", roles: ["CA"], kind: "home" },
  { path: "/ops/contracts/intake", workspace: "ops", label: "Contract Intake", roles: ["AM", "CM"], kind: "form", api: "/api/ops/contracts/intake" },
  { path: "/ops/contracts/tracking", workspace: "ops", label: "Contract Tracking", roles: ["AM", "CM", "CA"], kind: "list", api: "/api/ops/contracts/tracking" },
  { path: "/ops/contracts/review-queue", workspace: "ops", label: "Review Queue", roles: ["CM", "CA"], kind: "list", api: "/api/ops/contracts/review-queue" },
  { path: "/ops/contracts/archive", workspace: "ops", label: "Contract Archive", roles: ["CM", "AM", "CA"], kind: "list", api: "/api/ops/contracts/archive" },
  { path: "/ops/billing/execution", workspace: "ops", label: "Billing Execution", roles: ["CM"], kind: "form", api: "/api/ops/billing/execution" },
  { path: "/ops/billing/records", workspace: "ops", label: "Billing Records", roles: ["CM"], kind: "list", api: "/api/ops/billing/records" },
  { path: "/ops/receivables/balances", workspace: "ops", label: "Receivables", roles: ["AM", "CM", "CA"], kind: "list", api: "/api/ops/receivables/balances" },
  { path: "/ops/billing/plan", workspace: "ops", label: "Billing Plan", roles: ["CM"], kind: "list", api: "/api/ops/billing/plan" },
  { path: "/plan/scp/home", workspace: "plan", label: "SCP Home", roles: ["SCP"], kind: "home" },
  { path: "/plan/ca/home", workspace: "plan", label: "CA Review Home", roles: ["CA"], kind: "home" },
  { path: "/plan/contracts", workspace: "plan", label: "Contract Planning", roles: ["SCP", "CA"], kind: "list", api: "/api/plan/contracts" },
  { path: "/plan/billing", workspace: "plan", label: "Billing Planning", roles: ["SCP", "CA"], kind: "list", api: "/api/plan/billing" },
  { path: "/plan/targets", workspace: "plan", label: "Target Allocation", roles: ["SCP", "CA"], kind: "list", api: "/api/plan/targets" },
  { path: "/plan/cost-coverage", workspace: "plan", label: "Cost Coverage", roles: ["SCP", "CA"], kind: "list", api: "/api/plan/cost-coverage" },
  { path: "/plan/adjustments", workspace: "plan", label: "Adjustments", roles: ["SCP", "CA"], kind: "form", api: "/api/plan/adjustments" },
  { path: "/plan/review-dashboard", workspace: "plan", label: "Review Dashboard", roles: ["SCP", "CA"], kind: "home" },
];

const archetypes = {
  "/ops/am/home": "Role Home",
  "/ops/cm/home": "Role Home",
  "/ops/ca/home": "Role Home",
  "/plan/scp/home": "Role Home",
  "/plan/ca/home": "Role Home",
  "/ops/contracts/intake": "Flow / Form",
  "/ops/contracts/tracking": "List / Trace",
  "/ops/contracts/review-queue": "Review / Approval",
  "/ops/contracts/archive": "List / Trace + Detail",
  "/ops/billing/execution": "Flow / Form",
  "/ops/billing/records": "List / Trace",
  "/ops/receivables/balances": "List / Trace",
  "/ops/billing/plan": "List / Flow",
  "/plan/contracts": "List / Trace",
  "/plan/billing": "List / Flow",
  "/plan/targets": "Flow / Review",
  "/plan/cost-coverage": "List / Trace",
  "/plan/adjustments": "Flow / Form + List",
  "/plan/review-dashboard": "Workspace Home / Review",
};

const state = { role: "AM", workspace: "ops" };

function getCurrentPath() {
  return location.hash.replace(/^#/, "") || defaultPath();
}

function defaultPath() {
  if (state.workspace === "ops") {
    if (state.role === "AM") return "/ops/am/home";
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

function renderSwitchers() {
  const ws = document.getElementById("workspace-switcher");
  const rs = document.getElementById("role-switcher");

  ws.innerHTML = workspaces.map((w) => `<option value="${w.code}">${w.name}</option>`).join("");
  rs.innerHTML = roles.map((r) => `<option value="${r}">${r}</option>`).join("");
  ws.value = state.workspace;
  rs.value = state.role;

  ws.onchange = () => {
    state.workspace = ws.value;
    location.hash = defaultPath();
    render();
  };

  rs.onchange = () => {
    state.role = rs.value;
    location.hash = defaultPath();
    render();
  };
}

function renderNav() {
  const current = getCurrentPath();
  const nav = document.getElementById("top-nav");
  nav.innerHTML = availableRoutes()
    .map((r) => `<button class="nav-item ${current === r.path ? "active" : ""}" data-path="${r.path}">${r.label}</button>`)
    .join("");

  nav.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => {
      location.hash = btn.dataset.path;
      render();
    };
  });
}

async function fetchJson(url, fallback = []) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("request failed");
    return await res.json();
  } catch {
    return fallback;
  }
}

function sanitize(value) {
  return String(value ?? "").replace(/[<>&"']/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[ch]));
}

async function renderHome(path, label) {
  const cards = await fetchJson(`/api/home/cards?workspace=${state.workspace}&role=${state.role}`);
  return `
    <h2>${label}</h2>
    <div class="card-grid">
      ${cards
        .map(
          (card) => `
        <article class="card">
          <div class="k">${sanitize(card.metric_label)}</div>
          <div class="v">${sanitize(card.metric_value)}</div>
          <span class="badge">Trend: ${sanitize(card.trend_hint)}</span>
        </article>
      `
        )
        .join("") || '<article class="card"><div class="k">No cards</div><div class="v">0</div></article>'}
    </div>
    <div class="placeholder">Role-specific home connected to CSV-backed service.</div>
  `;
}

function pickColumns(row) {
  const keys = Object.keys(row || {});
  if (keys.includes("contract_code")) return ["contract_code", "execution_status", "current_owner_role", "next_step_label"];
  if (keys.includes("billing_event_id")) return ["billing_event_id", "billing_date", "amount", "allocation_status"];
  if (keys.includes("billing_plan_id")) return ["billing_plan_id", "period_key", "planned_amount", "plan_status"];
  if (keys.includes("planning_record_id")) return ["planning_record_id", "planning_type", "planned_value", "planning_status"];
  if (keys.includes("adjustment_id")) return ["adjustment_id", "adjustment_reason", "delta_value", "adjustment_status"];
  return keys.slice(0, 4);
}

async function renderList(label, api) {
  const rows = await fetchJson(api);
  const columns = pickColumns(rows[0]);
  return `
    <h2>${label}</h2>
    <table class="table">
      <thead>
        <tr>${columns.map((c) => `<th>${sanitize(c)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${
          rows.length
            ? rows
                .slice(0, 15)
                .map((row) => `<tr>${columns.map((c) => `<td>${sanitize(row[c])}</td>`).join("")}</tr>`)
                .join("")
            : `<tr><td colspan="${columns.length || 1}" class="placeholder">No data rows</td></tr>`
        }
      </tbody>
    </table>
  `;
}

function formTemplate(path, label) {
  if (path === "/ops/contracts/intake") {
    return `
      <h2>${label}</h2>
      <div class="form-row"><label>Contract Code</label><input name="contract_code" required /></div>
      <div class="form-row"><label>Customer Name</label><input name="customer_name" required /></div>
      <button id="submit-form">Submit Intake</button>
      <span id="form-msg"></span>
    `;
  }

  if (path === "/ops/billing/execution") {
    return `
      <h2>${label}</h2>
      <div class="form-row"><label>Billing Date</label><input name="billing_date" placeholder="YYYY-MM-DD" required /></div>
      <div class="form-row"><label>Amount</label><input name="amount" required /></div>
      <div class="form-row"><label>Linked Contract IDs</label><input name="linked_contract_case_ids" placeholder="CC-001,CC-002" /></div>
      <button id="submit-form">Record Billing</button>
      <span id="form-msg"></span>
    `;
  }

  return `
    <h2>${label}</h2>
    <div class="form-row"><label>Scope</label><input name="scope_key" required /></div>
    <div class="form-row"><label>Adjustment Reason</label><input name="adjustment_reason" required /></div>
    <div class="form-row"><label>Delta Value</label><input name="delta_value" required /></div>
    <button id="submit-form">Create Adjustment</button>
    <span id="form-msg"></span>
  `;
}

async function bindForm(path, api) {
  const submit = document.getElementById("submit-form");
  if (!submit) return;

  submit.onclick = async () => {
    const payload = {};
    document.querySelectorAll("#page-content input, #page-content textarea").forEach((el) => {
      if (el.name) payload[el.name] = el.value;
    });
    if (path === "/plan/adjustments") payload.proposed_by_role = state.role;

    try {
      const res = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("submit failed");
      const data = await res.json();
      document.getElementById("form-msg").textContent = ` Saved: ${Object.values(data).join(" / ")}`;
    } catch {
      document.getElementById("form-msg").textContent = " Save failed";
    }
  };
}

async function renderPage() {
  const path = getCurrentPath();
  const allowed = availableRoutes().find((r) => r.path === path);
  const context = document.getElementById("page-context");
  const content = document.getElementById("page-content");

  if (!allowed) {
    location.hash = defaultPath();
    return renderPage();
  }

  context.textContent = `Workspace: ${state.workspace.toUpperCase()} · Role: ${state.role} · Archetype: ${archetypes[path] || "Skeleton"}`;

  if (allowed.kind === "home") {
    content.innerHTML = await renderHome(path, allowed.label);
    return;
  }
  if (allowed.kind === "form") {
    content.innerHTML = formTemplate(path, allowed.label);
    await bindForm(path, allowed.api);
    return;
  }
  content.innerHTML = await renderList(allowed.label, allowed.api);
}

function render() {
  renderSwitchers();
  renderNav();
  renderPage();
}

window.addEventListener("hashchange", render);
render();
