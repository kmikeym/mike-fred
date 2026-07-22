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
# DATE CONVENTIONS: --month is always the RELEASE month. Each series' row date comes from
# INDICATOR_REGISTRY.dateConvention (the same source the site reads), not from an assumption
# here:
#   release-lag (5 series) - row dated the release month; the 2026-08 release reports July
#                            in a row dated 2026-08-01.
#   data-month  (PHI only)  - row dated the month it MEASURES; that same July data is dated
#                            2026-07-01. PHI rows for an incomplete month are refused.
#
# Usage:
#   ./scripts/mike-fred-append-month.sh --month 2026-07 [per-series inputs] [--write]
#
# Per-series inputs (append a row only for the series you supply; omit to skip a series):
#   PPI   --pulse N            [--hours H]  [--ppi-note "..."]   value = pulse * 1.25
#   KBER  --kber N                          [--kber-note "..."]  value = N (raw vault note count)
#   SCI   --followers R                     [--sci-note "..."]   value = R / 3041.9 * 100
#   PHI   --phi-value V                     [--phi-note "..."]   PHI 2.0 is generated from the
#                                                                Apple Health archive, NOT here.
#                                                                The old --sleep-h/--workout-days/
#                                                                --weight flags computed the retired
#                                                                PHI-Classic index and now error.
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
ROWDATE="${MONTH}-01"   # the release date itself (used for the app/page.tsx header)

# Per-series conventions come from INDICATOR_REGISTRY — the same source the site
# reads — so the write path can never drift from it (#12). One bun call, ~20ms.
CONVENTIONS=$(cd "$REPO" && bun -e "
import { INDICATOR_REGISTRY, rowDateForRelease } from './lib/indicators.ts';
for (const id of Object.keys(INDICATOR_REGISTRY)) {
  const m = INDICATOR_REGISTRY[id];
  console.log([id, rowDateForRelease(id, '$MONTH'), m.dateConvention, m.valueSource].join(' '));
}" 2>&1) || { echo "ERROR: could not read INDICATOR_REGISTRY (is bun installed?)" >&2; echo "$CONVENTIONS" >&2; exit 1; }

field_for()       { echo "$CONVENTIONS" | awk -v i="$1" -v n="$2" '$1==i {print $n}'; }
rowdate_for()     { field_for "$1" 2; }
convention_for()  { field_for "$1" 3; }
valuesource_for() { field_for "$1" 4; }

THIS_MONTH=$(date +%Y-%m)

# A series whose value is computed elsewhere must be HANDED a value; this script
# must never derive one. Called before any derivation, so the rule is enforced
# from registry data rather than by remembering which series is special.
require_derivable() {  # $1 = id
  if [ "$(valuesource_for "$1")" = "external" ]; then
    echo "ERROR: $1 values are not computed in this repository (valueSource: external)." >&2
    echo "       Pass the computed value directly rather than derivation inputs." >&2
    exit 2
  fi
}

# Notes may contain commas — the parser claims trailing numeric columns from the right,
# so the note keeps its punctuation (STANDARDS.md §7). Newlines would still break the
# one-row-per-line format, so collapse those.
scrub() { printf '%s' "$1" | tr '\n\r' '  '; }

# guard: refuse to double-append a date already present in a file
present() { [ -f "$1" ] && cut -d, -f1 "$1" | grep -qx "$2"; }

declare -a PLAN_FILE PLAN_ROW
add_plan() {  # $1 = indicator id, $2 = row content AFTER the date
  local id="$1" rest="$2"
  local f="$DATA/$id.csv"
  local rd; rd=$(rowdate_for "$id")

  if [ -z "$rd" ]; then
    echo "ERROR: no row date for '$id' — is it in INDICATOR_REGISTRY?" >&2; exit 1
  fi

  # A data-month row is dated the month it MEASURES, so that month must be over.
  # This is the check that would have caught a PHI row generated mid-month.
  if [ "$(convention_for "$id")" = "data-month" ] && ! [ "${rd:0:7}" \< "$THIS_MONTH" ]; then
    echo "ERROR: refusing to write $id.csv row for $rd — ${rd:0:7} is not complete." >&2
    echo "       $id is dated by the month it measures, not the release month." >&2
    exit 2
  fi

  if present "$f" "$rd"; then
    echo "  SKIP $id.csv — $rd already present (idempotency guard)"
    return
  fi
  PLAN_FILE+=("$f"); PLAN_ROW+=("${rd},${rest}")
  echo "  $id.csv  +  ${rd},${rest}   [$(convention_for "$id")]"
}

echo "=== MIKE FRED append month: $ROWDATE  (mode: $([ $WRITE -eq 1 ] && echo WRITE || echo DRY-RUN)) ==="
echo

# --- PPI: value = pulse * 1.25 ; cols date,value,notes,pulse,hours ---
if [ -n "$PULSE" ]; then
  require_derivable "ppi"
  PVAL=$(awk "BEGIN{printf \"%.2f\", $PULSE*1.25}")
  note=$(scrub "${PPI_NOTE:-Release}")
  add_plan "ppi" "${PVAL},${note},${PULSE},${HOURS}"
fi

# --- KBER: raw vault note count ---
if [ -n "$KBER" ]; then
  note=$(scrub "${KBER_NOTE:-vault snapshot}")
  add_plan "knowledge-expansion" "${KBER},${note}"
fi

# --- SCI: index = raw / 3041.9 * 100 ; note default 'Measured growth (raw: R)' ---
if [ -n "$FOLLOWERS" ]; then
  require_derivable "social-capital"
  SVAL=$(awk "BEGIN{printf \"%.2f\", $FOLLOWERS/3041.9*100}")
  note=$(scrub "${SCI_NOTE:-Measured growth (raw: $FOLLOWERS)}")
  add_plan "social-capital" "${SVAL},${note}"
fi

# --- PHI 2.0: value only. Computed from the Apple Health archive, not here. ---
# The legacy flags computed PHI-Classic (sleep/activity/weight). That index is
# retired; using it to produce a PHI 2.0 row silently writes a legacy-scale
# number into the live series, so the flags are now a hard error rather than a
# silent wrong answer.
if [ -n "$SLEEP_H" ] || [ -n "$WORKOUT" ] || [ -n "$WEIGHT" ]; then
  echo "ERROR: --sleep-h/--workout-days/--weight computed the retired PHI-Classic index" >&2
  echo "       (sleep%*0.4 + activity%*0.35 + weight%*0.25). PHI 2.0 is a four-pillar" >&2
  echo "       composite generated from the Apple Health archive and is NOT derived here." >&2
  echo "       Pass the computed index with --phi-value instead." >&2
  exit 2
fi

if [ -n "$PHI_VALUE" ]; then
  add_plan "phi" "${PHI_VALUE},$(scrub "${PHI_NOTE:-Release}")"
fi

# --- PWI (revenue): wealth index value, direct ---
if [ -n "$WEALTH" ]; then
  note=$(scrub "${PWI_NOTE:-Release}")
  add_plan "revenue" "${WEALTH},${note}"
fi

# --- LMV (completion-rate): books+films points, direct ---
if [ -n "$LMV_VALUE" ]; then
  note=$(scrub "${LMV_NOTE:-Media velocity}")
  add_plan "completion-rate" "${LMV_VALUE},${note}"
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
