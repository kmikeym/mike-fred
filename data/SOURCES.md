# MIKE FRED — Data Sources & Gather Reference

> **Canonical how-to lives in the operations repo:**
> `Publicly-Traded-Person/operations` → `governance/mike-fred/README.md`.
> This file is the code-adjacent quick-reference; if the two ever disagree, ops wins.

Record of where each indicator's numbers come from, the feed/endpoint, the gather
script, and the calc. The monthly close is: run the gather scripts → review →
`mike-fred-append-month.sh --write` → push. See `STANDARDS.md` for date conventions
and the null/missing rules.

Secrets (API keys) live in the gitignored `.env`, never here.

| Indicator | Source | Feed / endpoint | Gather | Convention |
|---|---|---|---|---|
| **PPI** Productivity | RescueTime Productivity Pulse | Analytic Data API (`/anapi/data`), key `RESCUETIME_API_KEY` in `.env` | `rescuetime-pull.sh` | release-lag |
| **KBER** Knowledge | Obsidian vault `.md` count | local vault (`MIKE_FRED_VAULT`) | `vault-pull.sh` | release-lag |
| **SCI** Social Capital | **SCI 2.0: 11 platforms, each normalized to its own Oct-Nov 2025 baseline, then weighted** (`lib/sci.ts`) | `sci-pull.sh` (5 platforms) + Mike (6) | `sci-row.ts` via `--sci-counts` | release-lag |
| **PHI** Health | Apple Health archive | separate PHI 2.0 generator | — | release-lag |
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
  is **flagged, not auto-nulled**: the pull warns, and publishing is a judgment call
  under `STANDARDS.md` §6. Default is to publish the measured value and state the
  coverage in the note, because a gap month is *measured over fewer days* rather than
  missing. Reserve `null` for a genuinely absent observation.
  *(This line previously cited a `§137` that does not exist; STANDARDS.md has 12
  sections. Corrected 2026-08-05, after the phantom rule was read as binding.)*
- **KBER:** raw vault note count. `vault-pull.sh` warns when a month-over-month jump is
  both > 2.5× the recent typical AND ≥ 300 notes above it (bulk-import guard).
- **SCI (2.0, from the 2026-11-01 release; operations#688).** `lib/sci.ts` is the source
  of truth. Every month's 11 counts are kept in `data/inputs/sci-platforms.csv`, and a
  test regenerates every published 2.0 row from them (#570).
  1. **Normalize:** each platform against its own baseline, the mean of its Oct and Nov
     2025 counts: `(count − baseline) ÷ max(baseline, 100) × 100 + 100`. The 100 floor
     stops a tiny account swinging the index; a platform crossing it needs a line in that
     month's note, and the append script refuses to run without one.
  2. **Weight:** `w = R·F·P ÷ ΣR·F·P` from the score table in `lib/sci.ts`. No rounding,
     no overrides. Substack's Reach dropped 3 → 2 on 2026-10-31 by the RFC's own default
     (`SUBSTACK_REACH_DEFAULT`); every row uses the table in force at publication.
  Dec 2025 and Jan 2026 were never measured and are empty (null) rows (#573).
- **SCI Classic (retired 2026-11, `social-capital-classic.csv`).** Kept exactly as
  published. Its method, for reading those rows: two stages, and the weights in
  `lib/sci.ts` (`SCI_WEIGHTS`) were typed data with a test pinning their sum, because the
  prose version drifted and was wrong in three of five places (#12).
  1. **Composite:** a *weighted mean* of 11 platform follower counts, weights summing to 1.
     So the raw figure (~3,078) is the weighted-average audience, **not a total across
     platforms**. `weightedComposite()` throws on a missing or unknown platform rather
     than scoring it zero, which would read as an audience collapse (§6).
  2. **Index:** `index = raw_composite / 3041.9 × 100`, where 3041.9 is the Oct 2025
     composite frozen as the anchor (§8).
  ⚠️ Changing a weight or the baseline re-scales the entire series against data captured
  under the old weighting: that is a methodology change requiring restatement (§9), never
  a routine edit.
  *(This line said "7-platform" until 2026-09-03; the code has used 11 throughout.
  Corrected per operations#175.)*
- **PWI:** net worth indexed to Mar 2026 = 100.
- **LMV:** films = 1 pt each; books = 2–5 pts by length. Canonical formula (Mike's
  spreadsheet): `=IF(type="Movie", 1, IF(pages<200, 2, IF(pages<400, 3, IF(pages<600, 4, 5))))`
  → `<200p→2, 200–399→3, 400–599→4, ≥600→5`; unknown page count → 3 (middle), flagged.
