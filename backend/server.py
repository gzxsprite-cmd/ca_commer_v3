from __future__ import annotations

import csv
import json
import os
import tempfile
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
FRONTEND_DIR = BASE_DIR.parent / "frontend"

CSV_FILES = {
    "users_roles": DATA_DIR / "users_roles.csv",  # legacy compatibility
    "users": DATA_DIR / "users.csv",
    "workspaces": DATA_DIR / "workspaces.csv",
    "roles": DATA_DIR / "roles.csv",
    "workspace_role_visibility": DATA_DIR / "workspace_role_visibility.csv",
    "nav_items": DATA_DIR / "nav_items.csv",
    "nav_role_visibility": DATA_DIR / "nav_role_visibility.csv",
    "contract_cases": DATA_DIR / "contract_cases.csv",
    "contract_structured_fields": DATA_DIR / "contract_structured_fields.csv",
    "contract_documents": DATA_DIR / "contract_documents.csv",
    "contract_payment_nodes": DATA_DIR / "contract_payment_nodes.csv",
    "contract_quote_links": DATA_DIR / "contract_quote_links.csv",
    "contract_project_links": DATA_DIR / "contract_project_links.csv",
    "contract_allocations": DATA_DIR / "contract_allocations.csv",
    "contract_workflow_events": DATA_DIR / "contract_workflow_events.csv",
    "contract_archive_reviews": DATA_DIR / "contract_archive_reviews.csv",
    "contract_exception_records": DATA_DIR / "contract_exception_records.csv",
    "contract_status_events": DATA_DIR / "contract_status_events.csv",  # legacy compatibility
    "contract_archive_versions": DATA_DIR / "contract_archive_versions.csv",  # legacy compatibility
    "billing_plans": DATA_DIR / "billing_plans.csv",
    "billing_events": DATA_DIR / "billing_events.csv",
    "contract_balances": DATA_DIR / "contract_balances.csv",
    "receivable_summaries": DATA_DIR / "receivable_summaries.csv",
    "planning_records": DATA_DIR / "planning_records.csv",
    "adjustment_records": DATA_DIR / "adjustment_records.csv",
    "dashboard_summary_cards": DATA_DIR / "dashboard_summary_cards.csv",
    "se3_snapshots": DATA_DIR / "se3_snapshots.csv",
    "pms_projects": DATA_DIR / "pms_projects.csv",
}


def read_csv_dicts(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh))


def write_csv_atomic(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.NamedTemporaryFile("w", delete=False, encoding="utf-8", newline="", dir=path.parent) as tmp:
        writer = csv.DictWriter(tmp, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
        temp_name = tmp.name

    os.replace(temp_name, path)


def append_csv_row(path: Path, row: dict[str, str]) -> None:
    current_rows = read_csv_dicts(path)
    fieldnames = list(current_rows[0].keys()) if current_rows else list(row.keys())

    normalized_row = {k: row.get(k, "") for k in fieldnames}
    updated_rows = [*current_rows, normalized_row]

    write_csv_atomic(path, updated_rows, fieldnames)


def contains(haystack: str, needle: str) -> bool:
    return needle.lower() in (haystack or "").lower()


def status_bucket(raw: str) -> str:
    mapping = {
        "submitted": "submitted_in_review",
        "cm_in_review": "submitted_in_review",
        "submitted_in_review": "submitted_in_review",
        "pending_cm_confirm": "pending_cm_confirm",
        "ca_pending_signature": "pending_ca_sign",
        "pending_ca_sign": "pending_ca_sign",
        "pending_cm_send": "pending_cm_send",
        "pending_cm_archive": "pending_cm_archive",
        "execution_closed": "completed",
        "completed": "completed",
        "archive_exception": "archive_exception",
    }
    return mapping.get(raw, raw or "submitted_in_review")


def contract_domain_data() -> dict[str, list[dict[str, str]]]:
    return {
        "cases": read_csv_dicts(CSV_FILES["contract_cases"]),
        "structured": read_csv_dicts(CSV_FILES["contract_structured_fields"]),
        "documents": read_csv_dicts(CSV_FILES["contract_documents"]),
        "payment_nodes": read_csv_dicts(CSV_FILES["contract_payment_nodes"]),
        "quote_links": read_csv_dicts(CSV_FILES["contract_quote_links"]),
        "project_links": read_csv_dicts(CSV_FILES["contract_project_links"]),
        "allocations": read_csv_dicts(CSV_FILES["contract_allocations"]),
        "workflow": read_csv_dicts(CSV_FILES["contract_workflow_events"]),
        "archive_reviews": read_csv_dicts(CSV_FILES["contract_archive_reviews"]),
        "exceptions": read_csv_dicts(CSV_FILES["contract_exception_records"]),
    }


def build_contract_view(case_row: dict[str, str], data: dict[str, list[dict[str, str]]]) -> dict[str, str]:
    cid = case_row.get("contract_case_id", "")
    structured = next((r for r in data["structured"] if r.get("contract_case_id") == cid), {})
    docs = [r for r in data["documents"] if r.get("contract_case_id") == cid]
    quote_links = [r for r in data["quote_links"] if r.get("contract_case_id") == cid]
    project_links = [r for r in data["project_links"] if r.get("contract_case_id") == cid]
    alloc_rows = [r for r in data["allocations"] if r.get("contract_case_id") == cid]
    archive_review = next((r for r in data["archive_reviews"] if r.get("contract_case_id") == cid), {})
    exception = next((r for r in data["exceptions"] if r.get("contract_case_id") == cid), {})

    def doc_url(doc_type: str) -> str:
        row = next((d for d in docs if d.get("document_type") == doc_type and d.get("file_url")), None)
        return row.get("file_url", "") if row else ""

    pms_links = [r.get("project_name", "") for r in project_links if r.get("project_name")]
    se3_links = [r.get("pid", "") for r in quote_links if r.get("pid")]
    allocation_summary = ";".join([f"{r.get('target_id', '')}:{r.get('allocated_amount', '0')}" for r in alloc_rows])

    view = {
        "contract_case_id": cid,
        "contract_code": case_row.get("contract_code", ""),
        "formal_contract_id": case_row.get("official_contract_id", ""),
        "contract_type": case_row.get("contract_type", ""),
        "customer_contract_no": structured.get("customer_contract_no", ""),
        "customer_name": case_row.get("customer_name", ""),
        "project_name": case_row.get("project_name", ""),
        "product_name": case_row.get("product_name", ""),
        "contract_name": structured.get("contract_name") or case_row.get("contract_title", ""),
        "total_amount": structured.get("total_amount", "0"),
        "payment_terms": structured.get("payment_terms", ""),
        "uploaded_file_name": structured.get("uploaded_file_name", ""),
        "se3_summary": ", ".join(se3_links),
        "pms_summary": ", ".join(pms_links),
        "extract_summary": structured.get("extract_summary", ""),
        "allocation_summary": allocation_summary,
        "am_owner_id": case_row.get("am_owner_id") or case_row.get("main_owner_id", ""),
        "cm_owner_id": case_row.get("cm_owner_id", ""),
        "execution_status": case_row.get("execution_status", ""),
        "archive_status": case_row.get("archive_status", ""),
        "current_owner_role": case_row.get("current_owner_role", ""),
        "next_step_label": case_row.get("next_step_label", ""),
        "flow_chain": case_row.get("flow_chain", ""),
        "current_step": case_row.get("current_step", ""),
        "next_step": case_row.get("next_step", ""),
        "created_at": case_row.get("created_at", ""),
        "updated_at": case_row.get("updated_at", ""),
        "watermarked_pdf_path": doc_url("watermarked_formal"),
        "ca_single_sign_backup": doc_url("ca_single_signed") or doc_url("single_sign"),
        "dual_signed_archive_file": doc_url("dual_signed") or doc_url("double_sign"),
        "comparison_status": archive_review.get("comparison_status", ""),
        "comparison_diff": archive_review.get("diff_summary", ""),
        "exception_reason": exception.get("cm_comment", ""),
        "tax_rate": structured.get("tax_rate", "13%"),
        "pre_tax_amount": structured.get("pre_tax_amount", ""),
        "post_tax_amount": structured.get("post_tax_amount", ""),
    }
    return view


def write_case_rows(rows: list[dict[str, str]]) -> None:
    if not rows:
        return
    write_csv_atomic(CSV_FILES["contract_cases"], rows, list(rows[0].keys()))


def upsert_structured(case_id: str, data: dict[str, str], now: str, role: str = "AM") -> None:
    rows = read_csv_dicts(CSV_FILES["contract_structured_fields"])
    idx = next((i for i, r in enumerate(rows) if r.get("contract_case_id") == case_id), -1)
    payload = {
        "structured_field_id": rows[idx]["structured_field_id"] if idx >= 0 else f"SF-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{case_id[-4:]}",
        "contract_case_id": case_id,
        "customer_contract_no": data.get("customer_contract_no", ""),
        "contract_name": data.get("contract_name", ""),
        "total_amount": str(data.get("total_amount", "0")),
        "payment_terms": data.get("payment_terms", ""),
        "uploaded_file_name": data.get("uploaded_file_name", ""),
        "extract_summary": data.get("extract_summary", ""),
        "tax_rate": data.get("tax_rate", "13%"),
        "pre_tax_amount": str(data.get("pre_tax_amount", "")),
        "post_tax_amount": str(data.get("post_tax_amount", data.get("total_amount", "0"))),
        "maintained_by_role": role,
        "maintained_at": now,
    }
    if idx >= 0:
        rows[idx] = payload
    else:
        rows.append(payload)
    write_csv_atomic(CSV_FILES["contract_structured_fields"], rows, list(rows[0].keys()))


def replace_child_rows(file_key: str, case_id: str, new_rows: list[dict[str, str]]) -> None:
    rows = [r for r in read_csv_dicts(CSV_FILES[file_key]) if r.get("contract_case_id") != case_id]
    rows.extend(new_rows)
    if rows:
        write_csv_atomic(CSV_FILES[file_key], rows, list(rows[0].keys()))


def append_workflow_event(case_id: str, event_type: str, event_status: str, actor_role: str, event_comment: str = "") -> None:
    now = datetime.utcnow().isoformat(timespec="seconds")
    event_id = f"EV-{case_id}-{datetime.utcnow().strftime('%H%M%S')}"
    event = {
        "event_id": event_id,
        "contract_case_id": case_id,
        "event_type": event_type,
        "event_status": event_status,
        "event_time": now,
        "actor_role": actor_role,
        "event_comment": event_comment,
    }
    append_csv_row(CSV_FILES["contract_workflow_events"], event)
    append_csv_row(
        CSV_FILES["contract_status_events"],
        {k: event.get(k, "") for k in ["event_id", "contract_case_id", "event_type", "event_status", "event_time", "actor_role"]},
    )


def upsert_archive_review(case_id: str, status: str, diff_summary: str, actor_role: str) -> None:
    rows = read_csv_dicts(CSV_FILES["contract_archive_reviews"])
    idx = next((i for i, r in enumerate(rows) if r.get("contract_case_id") == case_id), -1)
    now = datetime.utcnow().isoformat(timespec="seconds")
    payload = {
        "archive_review_id": rows[idx]["archive_review_id"] if idx >= 0 else f"AR-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{case_id[-4:]}",
        "contract_case_id": case_id,
        "comparison_base_document_type": "draft",
        "comparison_target_document_type": "dual_signed",
        "comparison_status": status,
        "diff_summary": diff_summary,
        "diff_page_refs": "",
        "reviewed_by_role": actor_role,
        "reviewed_at": now,
    }
    if idx >= 0:
        rows[idx] = payload
    else:
        rows.append(payload)
    write_csv_atomic(CSV_FILES["contract_archive_reviews"], rows, list(rows[0].keys()))


class Handler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, payload: dict | list) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def _send_static(self, rel_path: str) -> None:
        target = (FRONTEND_DIR / rel_path.lstrip("/")).resolve()
        if not str(target).startswith(str(FRONTEND_DIR.resolve())) or not target.exists() or target.is_dir():
            self.send_error(404, "Not found")
            return

        content_type = "text/plain"
        if target.suffix == ".html":
            content_type = "text/html; charset=utf-8"
        elif target.suffix == ".css":
            content_type = "text/css; charset=utf-8"
        elif target.suffix == ".js":
            content_type = "application/javascript; charset=utf-8"
        elif target.suffix == ".pdf":
            content_type = "application/pdf"

        raw = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/api/health":
            return self._send_json(200, {"status": "ok", "mode": "csv-backed"})

        if path == "/api/home/cards":
            workspace = query.get("workspace", [""])[0]
            role = query.get("role", [""])[0]
            rows = read_csv_dicts(CSV_FILES["dashboard_summary_cards"])
            cards = [r for r in rows if r["workspace_code"] == workspace and r["role_code"] == role]
            return self._send_json(200, cards)

        if path == "/api/shell/config":
            users = read_csv_dicts(CSV_FILES["users"]) or read_csv_dicts(CSV_FILES["users_roles"])
            return self._send_json(
                200,
                {
                    "workspaces": read_csv_dicts(CSV_FILES["workspaces"]),
                    "roles": read_csv_dicts(CSV_FILES["roles"]),
                    "workspace_role_visibility": read_csv_dicts(CSV_FILES["workspace_role_visibility"]),
                    "nav_items": read_csv_dicts(CSV_FILES["nav_items"]),
                    "nav_role_visibility": read_csv_dicts(CSV_FILES["nav_role_visibility"]),
                    "users": users,
                },
            )

        if path == "/api/ops/am/status-counts":
            data = contract_domain_data()
            rows = [build_contract_view(r, data) for r in data["cases"]]
            out = {
                "pending_cm_confirm": 0,
                "pending_ca_sign": 0,
                "pending_cm_send": 0,
                "pending_cm_archive": 0,
                "completed": 0,
                "archive_exception": 0,
            }
            for row in rows:
                key = status_bucket(row.get("execution_status", ""))
                if key == "submitted_in_review":
                    out["pending_cm_confirm"] += 1
                elif key in out:
                    out[key] += 1
            return self._send_json(200, out)

        if path == "/api/ops/cm/home-summary":
            data = contract_domain_data()
            rows = [build_contract_view(r, data) for r in data["cases"]]
            out = {
                "pending_cm_confirm": 0,
                "pending_ca_sign": 0,
                "pending_cm_send": 0,
                "pending_cm_archive": 0,
                "completed": 0,
                "archive_exception": 0,
                "recent_items": [],
            }
            for r in rows:
                key = status_bucket(r.get("execution_status", ""))
                if key in out:
                    out[key] += 1
                if key == "submitted_in_review":
                    out["pending_cm_confirm"] += 1
            pending = [r for r in rows if status_bucket(r.get("execution_status", "")) in {"pending_cm_confirm", "pending_cm_send", "pending_cm_archive", "archive_exception"}]
            out["recent_items"] = sorted(pending, key=lambda x: x.get("updated_at", ""), reverse=True)[:5]
            return self._send_json(200, out)

        if path == "/api/ops/se3-snapshots":
            rows = read_csv_dicts(CSV_FILES["se3_snapshots"])
            pid = query.get("pid", [""])[0].strip()
            customer_name = query.get("customer_name", [""])[0].strip()
            product_name = query.get("product_name", [""])[0].strip()
            if pid:
                rows = [r for r in rows if contains(r.get("pid", ""), pid)]
            if customer_name:
                rows = [r for r in rows if contains(r.get("customer_name", ""), customer_name)]
            if product_name:
                rows = [r for r in rows if contains(r.get("product_name", ""), product_name)]
            return self._send_json(200, rows)

        if path == "/api/ops/pms-projects":
            rows = read_csv_dicts(CSV_FILES["pms_projects"])
            mcr = query.get("mcr", [""])[0].strip()
            project_name = query.get("project_name", [""])[0].strip()
            customer_name = query.get("customer_name", [""])[0].strip()
            product_name = query.get("product_name", [""])[0].strip()
            if mcr:
                rows = [r for r in rows if contains(r.get("related_mcrl0", ""), mcr)]
            if project_name:
                rows = [r for r in rows if contains(r.get("project_name", ""), project_name)]
            if customer_name:
                rows = [r for r in rows if contains(r.get("customer_name", ""), customer_name)]
            if product_name:
                rows = [r for r in rows if contains(r.get("product_name", ""), product_name)]
            return self._send_json(200, rows)

        if path == "/api/ops/contracts/tracking":
            data = contract_domain_data()
            rows = [build_contract_view(r, data) for r in data["cases"]]
            status = query.get("status", [""])[0].strip()
            keyword = query.get("q", [""])[0].strip()
            dummy_id = query.get("dummy_id", [""])[0].strip()
            formal_id = query.get("formal_id", [""])[0].strip()
            customer_name = query.get("customer_name", [""])[0].strip()
            project_name = query.get("project_name", [""])[0].strip()

            def match(row: dict[str, str]) -> bool:
                bucket = status_bucket(row.get("execution_status", ""))
                if status:
                    if status == "pending_cm_confirm":
                        if bucket not in {"pending_cm_confirm", "submitted_in_review"}:
                            return False
                    elif bucket != status:
                        return False
                if keyword and not any(
                    contains(row.get(k, ""), keyword)
                    for k in ("contract_case_id", "formal_contract_id", "contract_code", "customer_name", "project_name")
                ):
                    return False
                if dummy_id and not contains(row.get("contract_case_id", ""), dummy_id):
                    return False
                if formal_id and not contains(row.get("formal_contract_id", ""), formal_id):
                    return False
                if customer_name and not contains(row.get("customer_name", ""), customer_name):
                    return False
                if project_name and not contains(row.get("project_name", ""), project_name):
                    return False
                return True

            filtered = [r for r in rows if match(r)]
            return self._send_json(200, filtered)

        if path == "/api/ops/contracts/tracking/detail":
            contract_case_id = query.get("contract_case_id", [""])[0].strip()
            data = contract_domain_data()
            case_row = next((r for r in data["cases"] if r.get("contract_case_id") == contract_case_id), None)
            if not case_row:
                return self._send_json(200, {})
            return self._send_json(200, build_contract_view(case_row, data))

        if path == "/api/ops/contracts/review-queue":
            data = contract_domain_data()
            rows = [build_contract_view(r, data) for r in data["cases"]]
            queue = [r for r in rows if r["execution_status"] in {"cm_in_review", "ca_pending_signature"}]
            return self._send_json(200, queue)

        if path == "/api/ops/contracts/archive":
            data = contract_domain_data()
            rows = [build_contract_view(r, data) for r in data["cases"]]
            keyword = query.get("q", [""])[0].strip()
            dummy_id = query.get("dummy_id", [""])[0].strip()
            formal_id = query.get("formal_id", [""])[0].strip()
            customer_name = query.get("customer_name", [""])[0].strip()
            product_name = query.get("product_name", [""])[0].strip()
            contract_name = query.get("contract_name", [""])[0].strip()

            def match_archive(row: dict[str, str]) -> bool:
                if row.get("archive_status") != "archived_indexed":
                    return False
                if keyword and not any(
                    contains(row.get(k, ""), keyword)
                    for k in ("contract_case_id", "formal_contract_id", "contract_name", "customer_name")
                ):
                    return False
                if dummy_id and not contains(row.get("contract_case_id", ""), dummy_id):
                    return False
                if formal_id and not contains(row.get("formal_contract_id", ""), formal_id):
                    return False
                if customer_name and not contains(row.get("customer_name", ""), customer_name):
                    return False
                if product_name and not contains(row.get("product_name", ""), product_name):
                    return False
                if contract_name and not contains(row.get("contract_name", ""), contract_name):
                    return False
                return True

            return self._send_json(200, [r for r in rows if match_archive(r)])

        if path == "/api/ops/contracts/archive/versions":
            contract_case_id = query.get("contract_case_id", [""])[0].strip()
            docs = read_csv_dicts(CSV_FILES["contract_documents"])
            out = [
                {
                    "version_id": r.get("document_id", ""),
                    "contract_case_id": r.get("contract_case_id", ""),
                    "version_type": r.get("document_type", ""),
                    "version_label": r.get("version_label", ""),
                    "file_url": r.get("file_url", ""),
                }
                for r in docs
                if r.get("contract_case_id") == contract_case_id and r.get("document_type") in {"draft", "single_sign", "double_sign", "ca_single_signed", "dual_signed"}
            ]
            if not out:
                legacy_rows = read_csv_dicts(CSV_FILES["contract_archive_versions"])
                out = [r for r in legacy_rows if r.get("contract_case_id") == contract_case_id]
            return self._send_json(200, out)

        if path == "/api/ops/billing/records":
            return self._send_json(200, read_csv_dicts(CSV_FILES["billing_events"]))

        if path == "/api/ops/receivables/balances":
            return self._send_json(200, read_csv_dicts(CSV_FILES["contract_balances"]))

        if path == "/api/ops/billing/plan":
            return self._send_json(200, read_csv_dicts(CSV_FILES["billing_plans"]))

        if path == "/api/plan/contracts":
            rows = [r for r in read_csv_dicts(CSV_FILES["planning_records"]) if r["planning_type"] == "contract"]
            return self._send_json(200, rows)

        if path == "/api/plan/billing":
            rows = [r for r in read_csv_dicts(CSV_FILES["planning_records"]) if r["planning_type"] == "billing"]
            return self._send_json(200, rows)

        if path == "/api/plan/targets":
            rows = [r for r in read_csv_dicts(CSV_FILES["planning_records"]) if r["planning_type"] == "target"]
            return self._send_json(200, rows)

        if path == "/api/plan/cost-coverage":
            rows = [r for r in read_csv_dicts(CSV_FILES["planning_records"]) if r["planning_type"] == "coverage"]
            return self._send_json(200, rows)

        if path == "/api/plan/adjustments":
            return self._send_json(200, read_csv_dicts(CSV_FILES["adjustment_records"]))

        if path == "/api/plan/review-dashboard":
            cards = [
                r
                for r in read_csv_dicts(CSV_FILES["dashboard_summary_cards"])
                if r["workspace_code"] == "plan" and r["role_code"] in {"CA", "SCP"}
            ]
            return self._send_json(200, cards)

        if path == "/":
            return self._send_static("index.html")

        static_candidate = (FRONTEND_DIR / path.lstrip("/")).resolve()
        if str(static_candidate).startswith(str(FRONTEND_DIR.resolve())) and static_candidate.exists() and static_candidate.is_file():
            return self._send_static(path.lstrip("/"))

        self.send_error(404, "Not found")

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        payload = self._read_json()

        if path == "/api/ops/contracts/intake":
            now_dt = datetime.utcnow()
            now = now_dt.isoformat(timespec="seconds")
            ts = now_dt.strftime("%Y%m%d-%H%M%S")
            contract_id = payload.get("contract_case_id", f"DMY-{ts}")
            extracted = payload.get("extracted_fields", {})
            se3_matches = payload.get("se3_matches", [])
            pms_matches = payload.get("pms_matches", [])
            allocation_payload = payload.get("allocations", {})

            flow_chain = "AM提交 -> CM校验 -> CA签字 -> CM寄出 -> CM归档"
            new_case = {
                "contract_case_id": contract_id,
                "contract_code": payload.get("contract_code", contract_id),
                "dummy_contract_id": contract_id,
                "official_contract_id": payload.get("formal_contract_id", ""),
                "contract_type": payload.get("contract_type", "OTP"),
                "customer_name": extracted.get("customer_name", "TBD Customer"),
                "project_name": extracted.get("project_name", ""),
                "product_name": extracted.get("product_name", ""),
                "contract_title": extracted.get("contract_name", ""),
                "main_owner_id": payload.get("am_owner_id", "U-AM-001"),
                "am_owner_id": payload.get("am_owner_id", "U-AM-001"),
                "cm_owner_id": payload.get("cm_owner_id", "U-CM-001"),
                "current_owner_role": "CM",
                "execution_status": "submitted_in_review",
                "current_step": "CM 校验",
                "next_step": "CA 签字",
                "next_step_label": "CM completeness confirm",
                "archive_effective_flag": "0",
                "archive_status": "not_archived",
                "flow_chain": flow_chain,
                "created_at": now,
                "updated_at": now,
            }
            append_csv_row(CSV_FILES["contract_cases"], new_case)

            upsert_structured(
                contract_id,
                {
                    "customer_contract_no": extracted.get("customer_contract_no", ""),
                    "contract_name": extracted.get("contract_name", ""),
                    "total_amount": extracted.get("total_amount", "0"),
                    "payment_terms": extracted.get("payment_terms", ""),
                    "uploaded_file_name": payload.get("uploaded_file_name", ""),
                    "extract_summary": f"{extracted.get('customer_name', '')}/{extracted.get('project_name', '')}/{extracted.get('product_name', '')}",
                    "post_tax_amount": extracted.get("total_amount", "0"),
                },
                now,
                "AM",
            )

            replace_child_rows(
                "contract_quote_links",
                contract_id,
                [
                    {
                        "quote_link_id": f"QL-{contract_id}-{i+1}",
                        "contract_case_id": contract_id,
                        "snapshot_id": x.get("snapshot_id", ""),
                        "pid": x.get("pid", ""),
                        "link_source": "am_intake",
                        "is_primary": "1" if i == 0 else "0",
                    }
                    for i, x in enumerate(se3_matches)
                ],
            )

            replace_child_rows(
                "contract_project_links",
                contract_id,
                [
                    {
                        "project_link_id": f"PL-{contract_id}-{i+1}",
                        "contract_case_id": contract_id,
                        "project_id": x.get("project_id", ""),
                        "project_name": x.get("project_name", ""),
                        "link_source": "am_intake",
                        "is_primary": "1" if i == 0 else "0",
                    }
                    for i, x in enumerate(pms_matches)
                ],
            )

            payment_nodes = allocation_payload.get("payment_nodes", [])
            replace_child_rows(
                "contract_payment_nodes",
                contract_id,
                [
                    {
                        "payment_node_id": f"PN-{contract_id}-{i+1}",
                        "contract_case_id": contract_id,
                        "node_name": x.get("node", ""),
                        "node_ratio": str(x.get("percent", "")),
                        "node_amount": str(x.get("amount", "")),
                        "node_sequence": str(i + 1),
                        "payment_year": "",
                    }
                    for i, x in enumerate(payment_nodes)
                ],
            )

            allocations = []
            for i, item in enumerate(allocation_payload.get("projects", [])):
                allocations.append(
                    {
                        "allocation_id": f"AL-{contract_id}-{i+1}",
                        "contract_case_id": contract_id,
                        "target_type": "project",
                        "target_id": item.get("project_id", ""),
                        "target_name": item.get("project_id", ""),
                        "allocated_amount": str(item.get("amount", "0")),
                        "currency": "CNY",
                        "source_note": "am_intake",
                    }
                )
            allocations.append(
                {
                    "allocation_id": f"AL-{contract_id}-BUFFER",
                    "contract_case_id": contract_id,
                    "target_type": "buffer",
                    "target_id": "BUFFER",
                    "target_name": "Others / Buffer",
                    "allocated_amount": str(allocation_payload.get("others_buffer", "0")),
                    "currency": "CNY",
                    "source_note": "am_intake",
                }
            )
            replace_child_rows("contract_allocations", contract_id, allocations)

            replace_child_rows(
                "contract_documents",
                contract_id,
                [
                    {
                        "document_id": f"DOC-{contract_id}-DRAFT",
                        "contract_case_id": contract_id,
                        "document_type": "draft",
                        "version_label": "草拟版",
                        "file_url": "/assets/contracts/draft_sample.pdf",
                        "is_current": "1",
                        "uploaded_by_role": "AM",
                        "uploaded_at": now,
                    }
                ],
            )

            upsert_archive_review(contract_id, "pending", "", "AM")
            append_workflow_event(contract_id, "submitted", "submitted_in_review", payload.get("actor_role", "AM"))

            return self._send_json(
                201,
                {
                    "ok": True,
                    "contract_case_id": contract_id,
                    "flow_chain": ["CM 校验", "CA 签字", "CM 寄出合同", "CM 归档合同"],
                },
            )

        if path == "/api/ops/contracts/cm-action":
            action = payload.get("action", "")
            case_id = payload.get("contract_case_id", "")
            rows = read_csv_dicts(CSV_FILES["contract_cases"])
            idx = next((i for i, r in enumerate(rows) if r.get("contract_case_id") == case_id), -1)
            if idx < 0:
                return self._send_json(404, {"ok": False, "message": "contract not found"})

            now = datetime.utcnow().isoformat(timespec="seconds")
            row = rows[idx]
            event_comment = ""

            if action == "cm_confirm_complete":
                if not row.get("official_contract_id"):
                    row["official_contract_id"] = f"Official-{datetime.utcnow().strftime('%Y%m%d')}-{case_id[-4:]}"
                row["execution_status"] = "pending_ca_sign"
                row["current_owner_role"] = "CA"
                row["next_step_label"] = "CA签字"
                row["current_step"] = "CM 校验完成"
                row["next_step"] = "CA 签字"
                docs = read_csv_dicts(CSV_FILES["contract_documents"])
                if not any(d.get("contract_case_id") == case_id and d.get("document_type") == "watermarked_formal" for d in docs):
                    append_csv_row(
                        CSV_FILES["contract_documents"],
                        {
                            "document_id": f"DOC-{case_id}-WM",
                            "contract_case_id": case_id,
                            "document_type": "watermarked_formal",
                            "version_label": "带水印版",
                            "file_url": "/assets/contracts/draft_sample.pdf",
                            "is_current": "1",
                            "uploaded_by_role": "CM",
                            "uploaded_at": now,
                        },
                    )
            elif action == "cm_to_send":
                row["execution_status"] = "pending_cm_send"
                row["current_owner_role"] = "CM"
                row["next_step_label"] = "CM寄出"
                row["current_step"] = "CM 寄出"
                row["next_step"] = "CM 归档"
                if payload.get("ca_single_sign_backup"):
                    append_csv_row(
                        CSV_FILES["contract_documents"],
                        {
                            "document_id": f"DOC-{case_id}-SINGLE-{datetime.utcnow().strftime('%H%M%S')}",
                            "contract_case_id": case_id,
                            "document_type": "ca_single_signed",
                            "version_label": "单签版",
                            "file_url": payload.get("ca_single_sign_backup"),
                            "is_current": "1",
                            "uploaded_by_role": "CM",
                            "uploaded_at": now,
                        },
                    )
            elif action == "cm_upload_ca_single_backup":
                append_csv_row(
                    CSV_FILES["contract_documents"],
                    {
                        "document_id": f"DOC-{case_id}-SINGLE-{datetime.utcnow().strftime('%H%M%S')}",
                        "contract_case_id": case_id,
                        "document_type": "ca_single_signed",
                        "version_label": "单签版",
                        "file_url": payload.get("ca_single_sign_backup", ""),
                        "is_current": "1",
                        "uploaded_by_role": "CM",
                        "uploaded_at": now,
                    },
                )
            elif action == "cm_upload_dual_signed":
                append_csv_row(
                    CSV_FILES["contract_documents"],
                    {
                        "document_id": f"DOC-{case_id}-DUAL-{datetime.utcnow().strftime('%H%M%S')}",
                        "contract_case_id": case_id,
                        "document_type": "dual_signed",
                        "version_label": "双签版",
                        "file_url": payload.get("dual_signed_archive_file", ""),
                        "is_current": "1",
                        "uploaded_by_role": "CM",
                        "uploaded_at": now,
                    },
                )
                upsert_archive_review(case_id, payload.get("comparison_status", "warning"), payload.get("comparison_diff", ""), "CM")
                row["execution_status"] = "pending_cm_archive"
                row["current_owner_role"] = "CM"
                row["next_step_label"] = "CM归档确认"
                row["current_step"] = "CM 归档核对"
                row["next_step"] = "关闭"
            elif action == "cm_close_archived":
                row["execution_status"] = "completed"
                row["archive_status"] = "archived_indexed"
                row["archive_effective_flag"] = "1"
                row["current_owner_role"] = "CM"
                row["next_step_label"] = "关闭-已归档"
                row["current_step"] = "已归档"
                row["next_step"] = "-"
                upsert_archive_review(case_id, "ok", "", "CM")
            elif action == "cm_close_exception":
                reason = payload.get("exception_reason", "").strip()
                if not reason:
                    return self._send_json(400, {"ok": False, "message": "exception reason required"})
                row["execution_status"] = "archive_exception"
                row["archive_status"] = "archive_exception"
                row["current_owner_role"] = "CM"
                row["next_step_label"] = "关闭-归档异常"
                row["current_step"] = "归档异常关闭"
                row["next_step"] = "AM后续处理"
                review_row = next((r for r in read_csv_dicts(CSV_FILES["contract_archive_reviews"]) if r.get("contract_case_id") == case_id), {})
                event_comment = reason
                append_csv_row(
                    CSV_FILES["contract_exception_records"],
                    {
                        "exception_record_id": f"EX-{case_id}-{datetime.utcnow().strftime('%H%M%S')}",
                        "contract_case_id": case_id,
                        "system_anomaly_reason": review_row.get("diff_summary", ""),
                        "cm_comment": reason,
                        "created_by_role": "CM",
                        "created_at": now,
                        "exception_status": "closed_exception",
                    },
                )
            else:
                return self._send_json(400, {"ok": False, "message": "unknown action"})

            row["updated_at"] = now
            rows[idx] = row
            write_case_rows(rows)
            append_workflow_event(case_id, action, row.get("execution_status", ""), "CM", event_comment)
            return self._send_json(200, {"ok": True, "contract_case_id": case_id, "execution_status": row.get("execution_status", "")})

        if path == "/api/ops/billing/execution":
            now = datetime.utcnow().isoformat(timespec="seconds")
            event_id = payload.get("billing_event_id", f"BE-{now.replace(':', '').replace('-', '')}")
            append_csv_row(
                CSV_FILES["billing_events"],
                {
                    "billing_event_id": event_id,
                    "billing_date": payload.get("billing_date", now[:10]),
                    "amount": str(payload.get("amount", "0")),
                    "allocation_status": payload.get("allocation_status", "allocated_to_contracts"),
                    "linked_contract_case_ids": payload.get("linked_contract_case_ids", ""),
                },
            )
            return self._send_json(201, {"ok": True, "billing_event_id": event_id})

        if path == "/api/plan/adjustments":
            now = datetime.utcnow().isoformat(timespec="seconds")
            adj_id = payload.get("adjustment_id", f"ADJ-{now.replace(':', '').replace('-', '')}")
            append_csv_row(
                CSV_FILES["adjustment_records"],
                {
                    "adjustment_id": adj_id,
                    "scope_key": payload.get("scope_key", "portfolio"),
                    "adjustment_reason": payload.get("adjustment_reason", "new variance"),
                    "delta_value": str(payload.get("delta_value", "0")),
                    "adjustment_status": payload.get("adjustment_status", "adjustment_proposed"),
                    "proposed_by_role": payload.get("proposed_by_role", "SCP"),
                },
            )
            return self._send_json(201, {"ok": True, "adjustment_id": adj_id})

        self.send_error(404, "Not found")


def run() -> None:
    host, port = "127.0.0.1", 8010
    httpd = ThreadingHTTPServer((host, port), Handler)
    print(f"CA_Commer Stage-1 service running at http://{host}:{port}")
    httpd.serve_forever()


if __name__ == "__main__":
    run()
