#!/usr/bin/env bash
# mike-fred-vault-pull.sh
# Computes the two MIKE FRED indicators that are derivable from the Obsidian vault:
#   - KBER (knowledge-expansion): total .md count in the vault
#   - Average nightly sleep (a PHI-CLASSIC input, reference only — PHI 2.0 does not use it)
# Everything else (RescueTime PPI, Wealth Index, follower total, books/films, weight,
# workout-day count) is NOT in the vault and must come from Mike — see the project CLAUDE.md.
#
# Usage:  ./scripts/mike-fred-vault-pull.sh [YYYY-MM]
#   YYYY-MM defaults to LAST month (the data a release on the 1st reports).
#
# Output: a human-readable block you paste into the monthly intake note. This script
# does NOT edit any CSV — it only reports. Writing rows + pushing stays a human decision.

set -euo pipefail

# Vault location. Override either value in the environment; both default to the
# layout this repo's author uses, expressed relative to $HOME so the script is
# portable to anyone who clones it.
#
#   MIKE_FRED_VAULT       path to the Obsidian vault      (default ~/Documents/K5M)
#   MIKE_FRED_DAILY_DIR   daily-notes dir inside the vault (default "1. Daily Notes")
VAULT="${MIKE_FRED_VAULT:-$HOME/Documents/K5M}"
DAILY="$VAULT/${MIKE_FRED_DAILY_DIR:-1. Daily Notes}"

if [ ! -d "$VAULT" ]; then
  echo "error: no Obsidian vault at $VAULT" >&2
  echo "set MIKE_FRED_VAULT to your vault path, e.g." >&2
  echo "  MIKE_FRED_VAULT=\"\$HOME/Obsidian/MyVault\" $0 ${1:-}" >&2
  exit 1
fi

if [ ! -d "$DAILY" ]; then
  echo "error: no daily-notes directory at $DAILY" >&2
  echo "set MIKE_FRED_DAILY_DIR to its name inside the vault, e.g." >&2
  echo "  MIKE_FRED_DAILY_DIR=\"Daily\" $0 ${1:-}" >&2
  exit 1
fi

# Default to last month (zsh/bash portable-ish; uses BSD date on macOS).
if [ "${1:-}" != "" ]; then
  MONTH="$1"
else
  MONTH=$(date -v-1m +%Y-%m 2>/dev/null || date -d "last month" +%Y-%m)
fi

echo "=== MIKE FRED vault pull — target month: $MONTH ==="
echo

# --- KBER: total markdown notes in vault (excludes dotfiles/dirs) ---
KBER=$(find "$VAULT" -name "*.md" -not -path "*/.*" | wc -l | tr -d ' ')

# The committed CSV is our only state: read the last recorded count (for the delta)
# and a trailing baseline of recent monthly deltas (for the spike guard).
REPO="$(cd "$(dirname "$0")/.." && pwd)"
KBER_CSV="$REPO/data/knowledge-expansion.csv"

# Spike guard tunables. A jump is "inorganic" (bulk import / migration, not real
# note-taking) when it is BOTH > MULT x the recent typical delta AND at least
# MIN_ABS notes above it — the absolute floor stops tiny vaults false-alarming.
KBER_WARN_MULT="${MIKE_FRED_KBER_WARN_MULT:-2.5}"
KBER_WARN_MIN_ABS="${MIKE_FRED_KBER_WARN_MIN_ABS:-300}"

echo "KBER (knowledge-expansion):"
echo "  Total vault .md notes (current snapshot): $KBER"

if [ -f "$KBER_CSV" ]; then
  PREV=$(awk -F, 'NR>1 && $2 ~ /^[0-9]+$/ {v=$2} END{print v}' "$KBER_CSV")
  # trailing baseline = mean of the last up-to-3 month-over-month deltas
  BASELINE=$(awk -F, 'NR>1 && $2 ~ /^[0-9]+$/ {vals[n++]=$2}
    END{ dc=0; for(i=1;i<n;i++){d[dc++]=vals[i]-vals[i-1]}
         start=dc-3; if(start<0)start=0; s=0; c=0
         for(i=start;i<dc;i++){s+=d[i]; c++}
         if(c>0) printf "%.0f", s/c }' "$KBER_CSV")
  if [ -n "$PREV" ]; then
    DELTA=$((KBER - PREV))
    if [ "$DELTA" -ge 0 ]; then SIGN="+$DELTA"; else SIGN="$DELTA"; fi
    echo "  Prev recorded: $PREV    Delta since then: $SIGN"
    echo "  -> knowledge-expansion.csv row:  ${MONTH}-01,${KBER},${SIGN} notes (vault snapshot $(date +%Y-%m-%d))"
    if [ -n "$BASELINE" ] && [ "$BASELINE" -gt 0 ]; then
      SPIKE=$(awk -v d="$DELTA" -v b="$BASELINE" -v m="$KBER_WARN_MULT" -v a="$KBER_WARN_MIN_ABS" \
        'BEGIN{ if(d > b*m && (d-b) >= a) print 1; else print 0 }')
      if [ "$SPIKE" = "1" ]; then
        echo
        echo "  ⚠️  KBER SPIKE WARNING"
        echo "     This delta ($SIGN) is >${KBER_WARN_MULT}x the recent typical (~${BASELINE}/mo)."
        echo "     Likely INORGANIC (bulk import / migration), not organic note-taking."
        echo "     Do NOT report as organic growth — add an explanatory note to the row"
        echo "     (STANDARDS §7), e.g. 'one-time Evernote->Obsidian backfill'."
      fi
    fi
  else
    echo "  (no prior value in $KBER_CSV — delta guard skipped)"
  fi
else
  echo "  (no $KBER_CSV found — delta guard skipped)"
fi
echo

# --- PHI sleep: average nightly sleep across the month's daily notes ---
# Heuristic: first 'sleep Xh Ym' match per daily note = that day's canonical figure.
total=0; n=0
for d in "$DAILY/$MONTH"-*.md; do
  [ -e "$d" ] || continue
  s=$(grep -ohiE "sleep[: ]*[0-9]+h ?[0-9]*m?" "$d" 2>/dev/null | head -1 || true)
  [ -n "$s" ] || continue
  h=$(echo "$s" | grep -oE "[0-9]+h" | tr -d h)
  m=$(echo "$s" | grep -oE "[0-9]+m" | tr -d m)
  m=${m:-0}
  mins=$((h*60+m))
  total=$((total+mins)); n=$((n+1))
done
echo "Average nightly sleep (PHI-Classic input — reference only, NOT used by PHI 2.0):"
if [ "$n" -gt 0 ]; then
  avg=$((total/n))
  sleep_h=$(awk "BEGIN{printf \"%.2f\", $avg/60}")
  sleep_pct=$(awk "BEGIN{printf \"%.1f\", ($avg/60)/8*100}")
  echo "  Days logging sleep: $n"
  echo "  Avg sleep: $((avg/60))h $((avg%60))m  (${sleep_h}h decimal)"
  echo "  Sleep% (vs 8h baseline): ${sleep_pct}%"
else
  echo "  No sleep figures found in $MONTH daily notes."
fi
echo
echo "=== STILL NEEDED FROM MIKE (not in vault) ==="
echo "  1. RescueTime Productivity Pulse        -> ppi.csv"
echo "  2. Wealth Index value                   -> revenue.csv"
echo "  3. Raw follower total (all platforms)   -> social-capital.csv  (index = raw/3041.9*100)"
echo "  4. Books + films consumed               -> completion-rate.csv"
echo "  5. Weight avg + workout-day count        -> phi.csv (combine w/ sleep above)"
echo
echo "PHI formula reminder: sleep% x0.4 + activity% x0.35 + weight% x0.25"
echo "  activity% = workout_days/30*100   weight% = 100-((avg_lbs-175)/175*100)"
