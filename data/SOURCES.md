# MIKE FRED — Data Sources & Gather Reference

Canonical record of where each indicator's numbers come from, the feed/endpoint,
the gather script, and the calc. The monthly close is: run the gather scripts →
review → `mike-fred-append-month.sh --write` → push. See `STANDARDS.md` for date
conventions and the null/missing rules.

Secrets (API keys) live in the gitignored `.env`, never here.

| Indicator | Source | Feed / endpoint | Gather | Convention |
|---|---|---|---|---|
| **PPI** Productivity | RescueTime Productivity Pulse | Analytic Data API (`/anapi/data`), key `RESCUETIME_API_KEY` in `.env` | `rescuetime-pull.sh` | release-lag |
| **KBER** Knowledge | Obsidian vault `.md` count | local vault (`MIKE_FRED_VAULT`) | `vault-pull.sh` | release-lag |
| **SCI** Social Capital | 7-platform follower composite | manual (Mike's tab set) | — | release-lag |
| **PHI** Health | Apple Health archive | separate PHI 2.0 generator | — | **data-month** |
| **PWI** Wealth | Net worth, indexed (Mar 2026 = 100) | manual (Mike) | — | release-lag |
| **LMV** Media | Goodreads (books) + Letterboxd (films) | RSS, see below | `lmv-pull.sh` | release-lag |

## Feed URLs

- **Letterboxd (films):** `https://letterboxd.com/kmikeym/rss/`
  - Per-film `<letterboxd:watchedDate>` buckets the month; 1 pt each.
- **Goodreads (books):** `https://www.goodreads.com/review/list_rss/3105910?shelf=read`
  - User ID `3105910`. Per-book `<user_read_at>` buckets the month; `<num_pages>` drives points.
  - Books with no read date are listed as "undated" and NOT counted.

> ⚠️ **RSS caveat:** both feeds are depth-limited (~most recent 50 items) and hand-logged
> by Mike. Reliable for the current month's close; do NOT trust for deep back-fill, and
> verify the freshness line the script prints before trusting a recent month.

## Calc details

- **PPI:** `pulse = Σ(seconds × (level+2)) / (total_seconds × 4) × 100`, rounded to an
  integer, then `value = pulse × 1.25`. Verified against the daily-summary feed and
  reproduces committed history. A real tracking gap (contiguous untracked run ≥ 3 days)
  → `value = null` per `STANDARDS.md` §137, hours reflect tracked days only.
- **KBER:** raw vault note count. `vault-pull.sh` warns when a month-over-month jump is
  both > 2.5× the recent typical AND ≥ 300 notes above it (bulk-import guard).
- **SCI:** `index = raw_follower_total / 3041.9 × 100` (Oct 2025 = 100).
- **PWI:** net worth indexed to Mar 2026 = 100.
- **LMV:** films = 1 pt each. **Books = 2–5 pts by length — CANONICAL SCALE PENDING
  (Mike is providing).** Current placeholder in `lmv-pull.sh`: `<200p→2, 200–399→3,
  400–599→4, ≥600→5, unknown→3`. Replace with Mike's numbers when they land.
