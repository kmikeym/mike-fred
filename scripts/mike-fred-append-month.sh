#!/usr/bin/env bash
# mike-fred-append-month.sh
# The WRITE half of the monthly MIKE FRED update. Companion to mike-fred-vault-pull.sh
# (which GATHERS the vault-derivable inputs). This script takes the raw monthly inputs,
# applies each indicator's formula, appends a correctly-formatted row to the six CSVs in
# data/, and bumps the one remaining hardcoded date location (the app/page.tsx header).
# Indicator lastUpdate/nextUpdate are derived at load time and need no edit.
#
# SAFETY: dry-run by default (prints exactly what it WOULD change, touches nothing).
# Pass --write to apply. It NEVER commits and NEVER pushes — review the diff and push
# yourself. Release/deploy stays a human decision (Cloudflare auto-deploys on push to main).
#
# RELEASE-DATE CONVENTION: a release on the 1st of month M reports month M-1's actuals.
# The row date is M-01 (the release date). For the July-1 release of June data: --month 2026-07.
#
# Usage:
#   ./scripts/mike-fred-append-month.sh --month 2026-07 [per-series inputs] [--write]
#
# Per-series inputs (append a row only for the series you supply; omit to skip a series):
#   PPI   --pulse N            [--hours H]  [--ppi-note "..."]   value = pulse * 1.25
#   KBER  --kber N                          [--kber-note "..."]  value = N (raw vault note count)
#   SCI   --followers R                     [--sci-note "..."]   value = R / 3041.9 * 100
#   PHI   --sleep-h X --workout-days D --weight W  [--phi-note]  (or --phi-value V to set directly)
#   PWI   --wealth V                        [--pwi-note "..."]   value = V (wealth index, ask Mike)
#   LMV   --lmv-value V                     [--lmv-note "..."]   value = V (books+films points)
#
# Notes may contain commas and ordinary punctuation (STANDARDS.md §7). Newlines are collapsed.

set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DATA="$REPO/data"
WRITE=0

MONTH=""; PULSE=""; HOURS=""; PPI_NOTE=""
KBER=""; KBER_NOTE=""
FOLLOWERS=""; SCI_NOTE=""
SLEEP_H=""; WORKOUT=""; WEIGHT=""; PHI_VALUE=""; PHI_NOTE=""
WEALTH=""; PWI_NOTE=""
LMV_VALUE=""; LMV_NOTE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --month) MONTH="$2"; shift 2;;
    --pulse) PULSE="$2"; shift 2;;
    --hours) HOURS="$2"; shift 2;;
    --ppi-note) PPI_NOTE="$2"; shift 2;;
    --kber) KBER="$2"; shift 2;;
    --kber-note) KBER_NOTE="$2"; shift 2;;
    --followers) FOLLOWERS="$2"; shift 2;;
    --sci-note) SCI_NOTE="$2"; shift 2;;
    --sleep-h) SLEEP_H="$2"; shift 2;;
    --workout-days) WORKOUT="$2"; shift 2;;
    --weight) WEIGHT="$2"; shift 2;;
    --phi-value) PHI_VALUE="$2"; shift 2;;
    --phi-note) PHI_NOTE="$2"; shift 2;;
    --wealth) WEALTH="$2"; shift 2;;
    --pwi-note) PWI_NOTE="$2"; shift 2;;
    --lmv-value) LMV_VALUE="$2"; shift 2;;
    --lmv-note) LMV_NOTE="$2"; shift 2;;
    --write) WRITE=1; shift;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0;;
    *) echo "Unknown arg: $1" >&2; exit 2;;
  esac
done

[ -n "$MONTH" ] || { echo "ERROR: --month YYYY-MM is required." >&2; exit 2; }
echo "$MONTH" | grep -qE '^[0-9]{4}-[0-9]{2}$' || { echo "ERROR: --month must be YYYY-MM (e.g. 2026-07)." >&2; exit 2; }
ROWDATE="${MONTH}-01"

# Notes may contain commas — the parser claims trailing numeric columns from the right,
# so the note keeps its punctuation (STANDARDS.md §7). Newlines would still break the
# one-row-per-line format, so collapse those.
scrub() { printf '%s' "$1" | tr '\n\r' '  '; }

# guard: refuse to double-append a month already present in a file
present() { [ -f "$1" ] && cut -d, -f1 "$1" | grep -qx "$ROWDATE"; }

declare -a PLAN_FILE PLAN_ROW
add_plan() {  # $1 file, $2 row
  local f="$DATA/$1"
  if present "$f"; then
    echo "  SKIP $1 — $ROWDATE already present (idempotency guard)"
    return
  fi
  PLAN_FILE+=("$f"); PLAN_ROW+=("$2")
  echo "  $1  +  $2"
}

echo "=== MIKE FRED append month: $ROWDATE  (mode: $([ $WRITE -eq 1 ] && echo WRITE || echo DRY-RUN)) ==="
echo

# --- PPI: value = pulse * 1.25 ; cols date,value,notes,pulse,hours ---
if [ -n "$PULSE" ]; then
  PVAL=$(awk "BEGIN{printf \"%.2f\", $PULSE*1.25}")
  note=$(scrub "${PPI_NOTE:-Release}")
  add_plan "ppi.csv" "${ROWDATE},${PVAL},${note},${PULSE},${HOURS}"
fi

# --- KBER: raw vault note count ---
if [ -n "$KBER" ]; then
  note=$(scrub "${KBER_NOTE:-vault snapshot}")
  add_plan "knowledge-expansion.csv" "${ROWDATE},${KBER},${note}"
fi

# --- SCI: index = raw / 3041.9 * 100 ; note default 'Measured growth (raw: R)' ---
if [ -n "$FOLLOWERS" ]; then
  SVAL=$(awk "BEGIN{printf \"%.2f\", $FOLLOWERS/3041.9*100}")
  note=$(scrub "${SCI_NOTE:-Measured growth (raw: $FOLLOWERS)}")
  add_plan "social-capital.csv" "${ROWDATE},${SVAL},${note}"
fi

# --- PHI: sleep% x0.4 + activity% x0.35 + weight% x0.25 (or --phi-value direct) ---
if [ -n "$PHI_VALUE" ] || { [ -n "$SLEEP_H" ] && [ -n "$WORKOUT" ] && [ -n "$WEIGHT" ]; }; then
  if [ -n "$PHI_VALUE" ]; then
    HVAL="$PHI_VALUE"; note=$(scrub "${PHI_NOTE:-Release}")
  else
    HVAL=$(awk "BEGIN{sp=$SLEEP_H/8*100; ap=$WORKOUT/30*100; wp=100-(($WEIGHT-175)/175*100); printf \"%.1f\", sp*0.4+ap*0.35+wp*0.25}")
    note=$(scrub "${PHI_NOTE:-Sleep ${SLEEP_H}h avg; ${WORKOUT} workout days; weight ${WEIGHT}}")
  fi
  add_plan "phi.csv" "${ROWDATE},${HVAL},${note}"
fi

# --- PWI (revenue): wealth index value, direct ---
if [ -n "$WEALTH" ]; then
  note=$(scrub "${PWI_NOTE:-Release}")
  add_plan "revenue.csv" "${ROWDATE},${WEALTH},${note}"
fi

# --- LMV (completion-rate): books+films points, direct ---
if [ -n "$LMV_VALUE" ]; then
  note=$(scrub "${LMV_NOTE:-Media velocity}")
  add_plan "completion-rate.csv" "${ROWDATE},${LMV_VALUE},${note}"
fi

echo
if [ "${#PLAN_FILE[@]}" -eq 0 ]; then
  echo "Nothing to append (no series inputs, or all already present). Exiting."
  exit 0
fi

# --- Date bumps preview ---
NEXTMONTH=$(date -j -v+1m -f "%Y-%m-%d" "$ROWDATE" +%Y-%m-01 2>/dev/null || echo "?")
HUMAN=$(date -j -f "%Y-%m-%d" "$ROWDATE" "+%B 1, %Y" 2>/dev/null || echo "$ROWDATE")
HUMAN_NEXT=$(date -j -f "%Y-%m-%d" "$NEXTMONTH" "+%B 1, %Y" 2>/dev/null || echo "$NEXTMONTH")
echo "Date bumps:"
echo "  app/page.tsx      : Last Updated: $HUMAN , Next Update: $HUMAN_NEXT"
echo

if [ "$WRITE" -eq 0 ]; then
  echo "DRY-RUN — nothing written. Re-run with --write to apply, then review 'git diff' and push."
  exit 0
fi

# --- WRITE ---
i=0
while [ $i -lt "${#PLAN_FILE[@]}" ]; do
  f="${PLAN_FILE[$i]}"; row="${PLAN_ROW[$i]}"
  [ -z "$(tail -c1 "$f")" ] || printf '\n' >> "$f"   # ensure trailing newline before append
  printf '%s\n' "$row" >> "$f"
  i=$((i+1))
done
# lib/indicators.ts needs no bump: lastUpdate/nextUpdate are derived from the data
# at load time (STANDARDS.md §9). Only the homepage header is still hand-written.
# bump app/page.tsx header
sed -i '' -E "s/Last Updated: [A-Za-z]+ [0-9]+, [0-9]{4}/Last Updated: $HUMAN/; s/Next Update: [A-Za-z]+ [0-9]+, [0-9]{4}/Next Update: $HUMAN_NEXT/" "$REPO/app/page.tsx"

echo "WROTE rows + date bumps. Review and push:"
echo "  cd $REPO && git diff --stat && git diff"
echo "  git add -A && git commit -m 'data: monthly release' && git push"
echo "(Cloudflare auto-deploys on push to main. This script did NOT push.)"
