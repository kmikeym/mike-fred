#!/usr/bin/env bash
# mike-fred-rescuetime-pull.sh
# Computes the PPI (Personal Productivity Index) input from RescueTime — the one
# indicator that used to be hand-keyed every month. Companion to vault-pull.sh
# (vault-derivable inputs) and append-month.sh (the CSV write half).
#
# It pulls the target month's productivity buckets from the RescueTime Analytic
# Data API, rebuilds the monthly Productivity Pulse from them (the daily-summary
# feed only spans ~2 weeks, too short for a month-end close), applies the PPI
# formula (value = pulse x 1.25), and reports total tracked hours.
#
# It ALSO checks day-coverage from the same call and WARNS on a real tracking gap
# (e.g. the 2026-07-16..20 RescueTime outage). The warning is a prompt for a judgment
# call, NOT an instruction. See STANDARDS.md §6: a gap month is still a MEASURED month
# over fewer days, so the default is to publish the measured value with the coverage
# stated in the note. §6 reserves null for a MISSING observation, and warns against a
# hole that implies "a collapse rather than a missing reading", which is exactly the
# risk when the preceding point was already a decline.
#
# (This block used to cite "STANDARDS.md §137" and instruct value=null. There is no
# §137; STANDARDS.md has 12 sections. The phantom citation was read as binding on
# 2026-08-05 and nearly published a hole where a real number belonged.)
#
# This script does NOT edit any CSV or push — it prints a paste-ready row + report.
# Writing rows and deploying stay human decisions.
#
# Usage:  ./scripts/mike-fred-rescuetime-pull.sh [YYYY-MM]
#   YYYY-MM is the DATA month you are measuring (defaults to LAST month).
#   PPI is release-lag, so July data lands in a row dated the following 2026-08-01.
#
# Key:  reads RESCUETIME_API_KEY from the environment, else from .env at repo root
#       (gitignored). Get one at rescuetime.com/rtx/developers (free/Lite works).
#
# Tunables (env):
#   MIKE_FRED_PPI_GAP_DAYS   longest untracked run (days) that triggers the partial
#                            -month warning. Default 3.

set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"

# --- resolve the API key: env wins, else .env at repo root ---
KEY="${RESCUETIME_API_KEY:-}"
if [ -z "$KEY" ] && [ -f "$REPO/.env" ]; then
  KEY=$(grep -E '^RESCUETIME_API_KEY=' "$REPO/.env" | head -1 | cut -d= -f2- | tr -d "\"'")
fi
if [ -z "$KEY" ]; then
  echo "error: no RESCUETIME_API_KEY (set it in the environment or $REPO/.env)" >&2
  exit 1
fi

# --- target DATA month (default last month) ---
if [ "${1:-}" != "" ]; then
  MONTH="$1"
else
  MONTH=$(date -v-1m +%Y-%m 2>/dev/null || date -d "last month" +%Y-%m)
fi

GAP_DAYS="${MIKE_FRED_PPI_GAP_DAYS:-3}"

KEY="$KEY" MONTH="$MONTH" GAP_DAYS="$GAP_DAYS" python3 - <<'PY'
import os, sys, json, urllib.request, urllib.parse, datetime, calendar

key   = os.environ["KEY"]
month = os.environ["MONTH"]          # "YYYY-MM"
gap_days = int(os.environ["GAP_DAYS"])

y, m = (int(x) for x in month.split("-"))
begin = datetime.date(y, m, 1)
last_dom = calendar.monthrange(y, m)[1]
today = datetime.date.today()
# If we're measuring the current (incomplete) month, stop at today.
end = min(datetime.date(y, m, last_dom), today)

qs = urllib.parse.urlencode({
    "key": key,
    "perspective": "interval",
    "resolution_time": "day",
    "restrict_begin": begin.isoformat(),
    "restrict_end": end.isoformat(),
    "restrict_kind": "productivity",
    "format": "json",
})
url = "https://www.rescuetime.com/anapi/data?" + qs
try:
    with urllib.request.urlopen(url, timeout=30) as r:
        data = json.load(r)
except Exception as e:
    sys.exit(f"error: RescueTime API request failed: {e}")

rows = data.get("rows", [])
# columns: [Date, Time Spent (seconds), Number of People, Productivity(level -2..2)]
total_sec = sum(r[1] for r in rows)

print(f"=== MIKE FRED RescueTime pull — data month: {month} (range {begin}..{end}) ===\n")
print("PPI (productivity):")

if total_sec == 0:
    print("  No tracked time in range. Nothing to report (mark the month null).")
    sys.exit(0)

# monthly pulse = weighted mean of (level+2)/4, x100.
# Match the series convention: round pulse to an integer FIRST, then x1.25
# (e.g. 67 -> 83.75), so new rows are consistent with committed history.
num = sum(r[1] * (r[3] + 2) for r in rows)
pulse_raw = num / (total_sec * 4) * 100
pulse = round(pulse_raw)
value = pulse * 1.25
hours = total_sec / 3600.0

# day coverage from the same rows
tracked = {r[0][:10] for r in rows}                       # ISO date -> tracked that day
cal_days = [(begin + datetime.timedelta(days=i)) for i in range((end - begin).days + 1)]
missing = [d.isoformat() for d in cal_days if d.isoformat() not in tracked]

# longest contiguous untracked run
longest, run, run_start, best_start, best_end = 0, 0, None, None, None
prev_missing = False
for d in cal_days:
    iso = d.isoformat()
    if iso in missing:
        run = run + 1 if prev_missing else 1
        if not prev_missing: run_start = d
        if run > longest:
            longest, best_start, best_end = run, run_start, d
        prev_missing = True
    else:
        prev_missing = False

print(f"  Monthly productivity pulse: {pulse} (raw {pulse_raw:.1f})")
print(f"  PPI value (pulse x1.25):    {value:.2f}")
print(f"  Total tracked hours:        {hours:.1f}")
print(f"  Coverage: {len(tracked)} of {len(cal_days)} calendar days in range tracked")

partial = longest >= gap_days
if partial:
    span = f"{best_start.isoformat()} .. {best_end.isoformat()}" if best_start else "?"
    print(f"\n  ⚠️  PARTIAL MONTH: longest untracked run = {longest} days ({span})")
    print(f"     Missing days: {', '.join(missing)}")
    print( "     JUDGMENT CALL, not an instruction (STANDARDS.md §6). The value above is")
    print( "     MEASURED, over fewer days. Default: publish it and state the coverage in")
    print( "     the note. Reserve null for a MISSING observation, and weigh §6's warning")
    print( "     that a hole can imply 'a collapse rather than a missing reading'.")
elif missing:
    print(f"  ({len(missing)} untracked day(s) — likely days off, no contiguous gap >= {gap_days}: not flagged)")

# release-lag: data month M -> row dated first of the NEXT month
row_date = (datetime.date(y, m, 1) + datetime.timedelta(days=32)).replace(day=1).isoformat()
print(f"\n  -> ppi.csv row (release-lag, dated {row_date}):")
if partial:
    print(f"     {row_date},{value:.2f},\"<note: state the {longest}-day gap {best_start}..{best_end} and the coverage>\",{pulse:.0f},{hours:.1f}")
else:
    print(f"     {row_date},{value:.2f},\"<note>\",{pulse:.0f},{hours:.1f}")
PY
