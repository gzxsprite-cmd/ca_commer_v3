# RUN_LOCAL

## Purpose
Run and try the current Stage-1 local skeleton with real CSV-backed read/write behavior.

## Quick Start
```bash
python3 backend/server.py
```
Then open:
- `http://127.0.0.1:8010`

Stop with:
- `Ctrl + C`

## Prerequisites
- Python 3.10+ (3.11/3.12 also fine)
- A modern browser (Chrome/Edge/Firefox)

No external Python package install is required for current Stage-1.

## Install / Setup
From repository root:
1. Ensure Python is available:
   ```bash
   python3 --version
   ```
2. (Optional) create and activate virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

## Start Backend + Frontend
Current implementation uses **one process**:
```bash
python3 backend/server.py
```

Why one process works now:
- Backend API is served by `backend/server.py`.
- Frontend static files are also served by the same backend process.

So **no second frontend terminal** is needed in Stage-1.

## Expected Local URLs
- App UI: `http://127.0.0.1:8010/`
- Health check: `http://127.0.0.1:8010/api/health`

## CSV Data Location
CSV source files are in:
- `backend/data/users_roles.csv`
- `backend/data/workspaces.csv`
- `backend/data/contract_cases.csv`
- `backend/data/contract_status_events.csv`
- `backend/data/billing_plans.csv`
- `backend/data/billing_events.csv`
- `backend/data/contract_balances.csv`
- `backend/data/receivable_summaries.csv`
- `backend/data/planning_records.csv`
- `backend/data/adjustment_records.csv`
- `backend/data/dashboard_summary_cards.csv`

## How Data Is Read/Written in Stage-1
- UI reads cards/lists through backend API endpoints.
- UI write actions (intake, billing execution, adjustments) call backend POST endpoints.
- Backend persists changes to CSV files.
- CSV writes use safe update flow:
  1. read current CSV
  2. build updated content
  3. write temp file
  4. atomically replace original file

## Common Failure Points
1. **Port already in use (8010)**
   - Symptom: server fails to start with address-in-use error.
   - Fix: stop the process using 8010, then restart.

2. **Wrong working directory**
   - Symptom: cannot locate frontend or CSV files.
   - Fix: run command from repo root:
     ```bash
     python3 backend/server.py
     ```

3. **CSV file permission issues**
   - Symptom: write actions fail.
   - Fix: ensure `backend/data/*.csv` files are writable by current user.

4. **Browser stale cache**
   - Symptom: UI does not reflect latest JS/CSS.
   - Fix: hard refresh browser.

## Stop Services
Since Stage-1 is single-process:
- In the terminal running server: `Ctrl + C`
- If needed, manually kill process bound to `127.0.0.1:8010`.
