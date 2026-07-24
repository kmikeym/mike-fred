#!/usr/bin/env bash
# mike-fred-rescuetime-healthcheck.sh
# A one-glance "is RescueTime actually tracking?" check, meant to be called from a
# morning routine. It exists because the tracker silently stopped 2026-07-14..21 and
# nobody noticed for a week, poking a hole in that month's PPI.
#
# It asks the RescueTime daily-summary feed for the most recent day that logged any
# time, and compares it to today:
#   staleness <= 1 day  -> ✅ healthy (data through yesterday/today)
#   staleness >= 2 days  -> ⚠️  likely NOT running (prints how stale + the last day seen)
#
# One line of output. Exit code: 0 healthy · 1 stale/warn · 2 error (so a caller can
# branch). A genuine day with the computer off will read as stale — that's the safe
# direction for a morning nudge; dismiss if you know it was an off day.
#
# Usage:  ./scripts/mike-fred-rescuetime-healthcheck.sh
# Key:    RESCUETIME_API_KEY from env, else gitignored .env at repo root.
# Tunable: MIKE_FRED_RT_STALE_DAYS (default 2) — staleness that trips the warning.

set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
KEY="${RESCUETIME_API_KEY:-}"
if [ -z "$KEY" ] && [ -f "$REPO/.env" ]; then
  KEY=$(grep -E '^RESCUETIME_API_KEY=' "$REPO/.env" | head -1 | cut -d= -f2- | tr -d "\"'")
fi
if [ -z "$KEY" ]; then
  echo "⚠️  RescueTime healthcheck: no RESCUETIME_API_KEY (env or $REPO/.env)" >&2
  exit 2
fi

KEY="$KEY" STALE="${MIKE_FRED_RT_STALE_DAYS:-2}" python3 - <<'PY'
import os, sys, json, urllib.request, datetime

key = os.environ["KEY"]
stale_limit = int(os.environ["STALE"])

url = "https://www.rescuetime.com/anapi/daily_summary_feed?key=" + key
try:
    with urllib.request.urlopen(url, timeout=20) as r:
        feed = json.load(r)
except Exception as e:
    print(f"⚠️  RescueTime healthcheck: API request failed ({e})")
    sys.exit(2)

if not feed:
    print("⚠️  RescueTime: no data in the feed at all — tracker likely not running.")
    sys.exit(1)

# most recent day with any logged time
def hrs(row): return row.get("total_hours") or 0
dated = sorted(((d["date"], hrs(d)) for d in feed if hrs(d) > 0), reverse=True)
if not dated:
    print("⚠️  RescueTime: feed present but zero tracked hours — tracker likely not running.")
    sys.exit(1)

last_date_s, last_hours = dated[0]
last_date = datetime.date.fromisoformat(last_date_s)
today = datetime.date.today()
stale = (today - last_date).days

if stale <= 1:
    print(f"✅ RescueTime tracking live — last data {last_date_s} ({last_hours:.1f}h).")
    sys.exit(0)
else:
    print(f"⚠️  RescueTime may NOT be running — last data {last_date_s} ({stale} days ago). "
          f"Check the app on the computer.")
    sys.exit(1)
PY
