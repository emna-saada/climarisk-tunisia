"""Refresh the data of the results website (website/, Vite + React) from the pipeline outputs.

Steps: export the dashboard tables from outputs/ (scripts/export_dashboard_data.py) and copy them into
website/public/data. Then build the site with `cd website && npm ci && npm run build` (output: website/dist).
Run after `make run`.
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "website/public/data"


def main() -> None:
    subprocess.run([sys.executable, str(ROOT / "scripts/export_dashboard_data.py")], check=True)
    DATA.mkdir(parents=True, exist_ok=True)
    for f in (ROOT / "outputs/dashboard").glob("*.json"):
        shutil.copy2(f, DATA / f.name)
    print("website data ready:", DATA)


if __name__ == "__main__":
    main()
