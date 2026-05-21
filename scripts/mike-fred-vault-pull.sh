#!/usr/bin/env bash
# mike-fred-vault-pull.sh
# Computes the two MIKE FRED indicators that are derivable from the Obsidian vault:
#   - KBER (knowledge-expansion): total .md count in the vault
#   - PHI sleep input: average nightly sleep across the target month's daily notes
# Everything else (RescueTime PPI, Wealth Index, follower total, books/films, weight,
# workout-day count) is NOT in the vault and must come from Mike — see the project CLAUDE.md.
#
# Usage:  ./scripts/mike-fred-vault-pull.sh [YYYY-MM]
#   YYYY-MM defaults to LAST month (the data a release on the 1st reports).
#
# Output: a human-readable block you paste into the monthly intake note. This script
# does NOT edit any CSV — it only reports. Writing rows + pushing stays a human decision.

set -euo pipefail

VAULT="/Users/kmikeym/Documents/K5M"
DAILY="$VAULT/1. Daily Notes"

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
echo "KBER (knowledge-expansion):"
echo "  Total vault .md notes (current snapshot): $KBER"
echo "  -> knowledge-expansion.csv row:  ${MONTH}-01,${KBER},<delta note>"
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
echo "PHI sleep input:"
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
