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
    "users_roles": DATA_DIR / "users_roles.csv",
    "workspaces": DATA_DIR / "workspaces.csv",
    "contract_cases": DATA_DIR / "contract_cases.csv",
    "contract_status_events": DATA_DIR / "contract_status_events.csv",
    "billing_plans": DATA_DIR / "billing_plans.csv",
    "billing_events": DATA_DIR / "billing_events.csv",
    "contract_balances": DATA_DIR / "contract_balances.csv",
    "receivable_summaries": DATA_DIR / "receivable_summaries.csv",
    "planning_records": DATA_DIR / "planning_records.csv",
    "adjustment_records": DATA_DIR / "adjustment_records.csv",
    "dashboard_summary_cards": DATA_DIR / "dashboard_summary_cards.csv",
}


def read_csv_dicts(path: Path) -> list[dict[str, str]]:
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

        raw = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(raw)))
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

        if path == "/api/ops/contracts/tracking":
            rows = read_csv_dicts(CSV_FILES["contract_cases"])
            return self._send_json(200, rows)

        if path == "/api/ops/contracts/review-queue":
            rows = read_csv_dicts(CSV_FILES["contract_cases"])
            queue = [r for r in rows if r["execution_status"] in {"cm_in_review", "ca_pending_signature"}]
            return self._send_json(200, queue)

        if path == "/api/ops/contracts/archive":
            rows = read_csv_dicts(CSV_FILES["contract_cases"])
            archived = [r for r in rows if r["archive_status"] == "archived_indexed"]
            return self._send_json(200, archived)

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

        if path in {"/", "/index.html"}:
            return self._send_static("index.html")
        if path in {"/app.js", "/styles.css"}:
            return self._send_static(path.lstrip("/"))

        self.send_error(404, "Not found")

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        payload = self._read_json()

        if path == "/api/ops/contracts/intake":
            now = datetime.utcnow().isoformat(timespec="seconds")
            contract_id = payload.get("contract_case_id", f"CC-{now.replace(':', '').replace('-', '')}")
            new_case = {
                "contract_case_id": contract_id,
                "contract_code": payload.get("contract_code", contract_id),
                "customer_name": payload.get("customer_name", "TBD Customer"),
                "am_owner_id": payload.get("am_owner_id", "U-AM-001"),
                "cm_owner_id": payload.get("cm_owner_id", "U-CM-001"),
                "execution_status": "submitted",
                "archive_status": "not_archived",
                "current_owner_role": "CM",
                "next_step_label": "CM review completeness",
            }
            append_csv_row(CSV_FILES["contract_cases"], new_case)
            append_csv_row(
                CSV_FILES["contract_status_events"],
                {
                    "event_id": f"EV-{contract_id}",
                    "contract_case_id": contract_id,
                    "event_type": "submitted",
                    "event_status": "submitted",
                    "event_time": now,
                    "actor_role": payload.get("actor_role", "AM"),
                },
            )
            return self._send_json(201, {"ok": True, "contract_case_id": contract_id})

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
