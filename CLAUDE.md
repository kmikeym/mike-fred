# MIKE Federal Reserve - Economic Data Dashboard

This is a Next.js 15 project deployed to Cloudflare Pages that displays personal economic indicators in a FRED-style dashboard.

## Project Overview

- **Tech Stack**: Next.js 15, React 18, TypeScript, Tailwind CSS, Recharts
- **Deployment**: Cloudflare Pages (auto-deploy on push to `main`)
- **Data Source**: CSV files in `/data` directory
- **Live URL**: https://mike.quarterly.systems
- **License**: CC0-1.0 (data and code) — see `LICENSE`

## ⚠️ Read STANDARDS.md before touching data

**`STANDARDS.md` is the normative reference for all MIKE data conventions** — date
semantics, vintages, series identity, note formatting, provenance, and the `/api/v1/`
machine-readable surface. It is the rule; the code implements it.

Read it before:

- adding an indicator, a CSV column, or an API field
- changing how a value is calculated or dated
- publishing anything under `/api/`

**Update `STANDARDS.md` in the same commit** as any change that introduces or alters a
convention. A conventions doc that lags the code is worse than none — this repo has
already shipped a hardcoded `nextUpdate` that drifted into telling the public the wrong
release date.

## Cloudflare Pages Deployment

This project requires the `@cloudflare/next-on-pages` adapter to convert Next.js SSG output to Cloudflare Workers format.

### Cloudflare Pages Build Settings:
- **Build command**: `npm run pages:build`
- **Build output directory**: `.vercel/output/static`
- **Environment variables**: `NODE_VERSION=20`

**Note**: This project uses Next.js 15 (not 16) because `@cloudflare/next-on-pages` officially supports Next.js up to 15.5.2. When the adapter adds Next.js 16 support, we can upgrade.

### Why this adapter is needed:
- Cloudflare Pages is a static hosting platform (no Node.js runtime)
- `@cloudflare/next-on-pages` converts Next.js SSG pages to Cloudflare Workers
- This allows dynamic routes like `/series/[id]` and `/reports/[id]` to work
- CSV data is read at build time and baked into static HTML

## Local Development

```bash
npm install             # Install dependencies
npm run dev             # Start Next.js dev server on :3000
npm run build           # Test production build locally
npm run pages:build     # Test Cloudflare Pages build (generates .vercel/output/static)
```

## Data Management

Indicator data is stored in CSV files in the `/data` directory:
- `ppi.csv` - Personal Productivity Index (RescueTime data)
- `knowledge-expansion.csv` - Obsidian vault note count
- `social-capital.csv` - Social media engagement metrics
- `completion-rate.csv` - Longform Media Velocity (books + films)
- `revenue.csv` - Personal Wealth Index
- `phi.csv` - Personal Health Index

### Monthly Update Checklist

Updates are due on the 1st of each month. Two things to update:

**1. Add a row to each CSV in `/data/`:**

| CSV | What to ask Mike | Format | Notes |
|-----|-----------------|--------|-------|
| `ppi.csv` | RescueTime Productivity Pulse score + total tracked hours | `date,value,notes,pulse,hours` (5 cols) | **Index `value` = `pulse × 1.25`** (80 pulse = 100 baseline). `hours` (col 5) drives the "Total Hours Tracked" bar chart on the PPI page — leave blank for months with no hours. Notes may contain commas — the parser claims trailing numeric columns from the right (STANDARDS.md §7) |
| `knowledge-expansion.csv` | Total Obsidian vault note count | `date,value,notes` | Raw count |
| `social-capital.csv` | Raw follower total across platforms | `date,value,notes` | Index = raw / 3041.9 × 100. Note format: `Measured growth (raw: XXXX.XX)` |
| `phi.csv` | **The computed PHI 2.0 index** (ask Mike) | `date,value,notes` | ⚠️ **NOT derived in this repo.** PHI 2.0 = 0.30·Recovery + 0.25·Sleep + 0.25·Activity + 0.20·Fitness, computed from the Apple Health archive against 2023-2025 baselines. ⚠️ **`phi.csv` is data-month dated** — the row for July's data is dated `2026-07-01`, unlike the five release-lag series. |
| `revenue.csv` | Wealth index value | `date,value,notes` | Ask Mike directly |
| `completion-rate.csv` | Books and films consumed | `date,value,notes` | Books = 2-5 pts by length, films = 1 pt each. Note format: `N books, N films` |

**Fast path — vault-derivable metrics (`scripts/mike-fred-vault-pull.sh`):**
- Run `./scripts/mike-fred-vault-pull.sh [YYYY-MM]` (defaults to last month). It computes **KBER** (vault note count) automatically and prints the values still needed from Mike. It also reports an average nightly sleep figure — that is a **PHI-Classic** input, kept for reference only; it is *not* used by PHI 2.0.

**How to get PHI:** ask Mike for the computed PHI 2.0 index. Do **not** calculate it.

The old sleep/activity/weight formula computed **PHI-Classic**, which was retired in July 2026 and preserved as `data/phi-classic.csv`. Using it now writes a legacy-scale number into the live PHI 2.0 series — a ~10-point error on a different baseline. The append script refuses the old `--sleep-h/--workout-days/--weight` flags for exactly this reason (#12).

PHI 2.0 needs per-day HRV, resting heart rate, sleep stages, energy, steps, exercise minutes, VO2 max and cardio recovery, plus 2023-2025 baseline statistics. None of that lives in this repo; it comes from Mike's Apple Health pipeline.

**How to calculate Social Capital Index:**
- Get raw follower total from Mike
- Divide by baseline 3041.9, multiply by 100

**Date conventions — two of them.** The authoritative source is `INDICATOR_REGISTRY[id].dateConvention` in `lib/indicators.ts`, which both the site and the append script read. Do not restate the rule from memory; check the field.

- **`release-lag`** (PPI, KBER, SCI, PWI, LMV) — a row dated month N reports month **N-1**'s actuals. April's data lives in the `2026-05-01` row. Charts label the x-axis by row date, so a bar reads one month ahead of the data it shows — known and accepted as of 2026-05.
- **`data-month`** (PHI only) — the row is dated the month it **measures**. June's data is the `2026-06-01` row, and no row exists for a month until that month is over.

This split is why `./scripts/mike-fred-append-month.sh --month 2026-08` writes the five release-lag series at `2026-08-01` and PHI at `2026-07-01`. Keep each month's pulse and hours together in the same row.

**2. Update `app/page.tsx`:**
- Lines ~21-23 have hardcoded "Last Updated" and "Next Update" dates in the homepage header
- Change both to match the current/next month

**3. Commit and push to `main`.** Cloudflare auto-rebuilds in 2-5 minutes.

**No longer needed:** `lib/indicators.ts` requires no date edit. Each indicator's
`lastUpdate` comes from its last data row and `nextUpdate` from `lastUpdate` +
frequency (all six are monthly). The old hardcoded pairs drifted and published a
wrong PHI release date — see issue #4 and STANDARDS.md §9.

### Adding New Data Points

> Read `STANDARDS.md` first — especially §3 (date conventions), §6 (values, nulls) and
> §7 (notes). §12 has the new-indicator checklist.

1. Open the relevant CSV file in `/data/`
2. Add a new row with the correct format (see table above — PPI has 5 columns, others have 3).
   Notes may contain commas; the parser claims trailing numeric columns from the right.
3. Run `npm test` — the round-trip guard catches malformed rows before they ship
4. Commit all changes and push to `main`
5. Cloudflare Pages will auto-rebuild (2-5 minutes)
6. Updated data appears on live site

**Important**: Data is baked into static pages at build time via Static Site Generation (SSG), so updates require a full rebuild to appear on the live site.

## Deployment Process

1. Push changes to `main` branch
2. Cloudflare Pages detects the push
3. Runs `npm ci`, then `npm run pages:build`
4. Deploys `.vercel/output/static` directory
5. Site is live at https://mike.quarterly.systems

### ⚠️ Verify deploys against production, not against a local build

**A green local build does not mean the deploy succeeded.** Cloudflare runs
`npm ci` first, and nothing in the local workflow does — `npm run build`,
`npx tsc --noEmit`, and `bun test` can all pass while the deploy fails outright.

After pushing, confirm the change is actually live:

```bash
curl -s https://mike.quarterly.systems/series/ppi | grep -oE 'Last Updated.{0,90}'
```

**A frozen site is a failed build, not a slow one.** Cloudflare serves the last
*successful* deploy, so if production still shows the state from before your
commit, the build errored — waiting longer will not help. Check the Cloudflare
Pages build log.

Reproduce Cloudflare's install step locally with `npm ci --dry-run` (exit 0 = the
lockfile is in sync). This is the check that catches the failure below.

### ⚠️ `npm run pages:build` rewrites package-lock.json

`@cloudflare/next-on-pages` runs its own install as a side effect, which can
leave `package.json` and `package-lock.json` out of sync. `npm ci` then refuses
to install — it asserts the two already agree rather than reconciling them, the
way `npm install` would — and **every subsequent deploy fails** until the
lockfile is repaired.

This has broken production once (see c140db4; adding a devDependency rewrote the
lockfile and froze the live site for four commits).

So: **after running `pages:build` locally, always check**

```bash
git diff --stat package-lock.json    # expect no output
npm ci --dry-run                     # expect exit 0
```

and never commit an unintended lockfile change. Adding or removing a dependency
is the other way into this state — verify with `npm ci --dry-run` before pushing.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── page.tsx           # Homepage dashboard
│   ├── series/            # Indicator pages
│   │   ├── page.tsx       # List of all indicators
│   │   └── [id]/page.tsx  # Individual indicator detail
│   ├── reports/           # Quarterly reports
│   └── widget/            # Embeddable widget
├── components/            # React components
│   └── IndicatorChart.tsx # Recharts line chart
├── lib/                   # Utilities and data loading
│   ├── indicators.ts      # Indicator registry and CSV parser
│   ├── types.ts           # TypeScript types
│   └── utils.ts           # Helper functions
├── data/                  # CSV data files
│   ├── ppi.csv
│   ├── knowledge-expansion.csv
│   └── ...
├── public/                # Static assets
└── next.config.mjs        # Next.js configuration
```

## Key Features

- **Static Site Generation (SSG)**: All pages pre-rendered at build time
- **Dynamic routes**: `/series/[id]` generates pages for each indicator
- **CSV-based data**: Easy to update via Git commits
- **Responsive design**: Works on mobile, tablet, and desktop
- **FRED-style aesthetics**: Professional economic dashboard look

## Troubleshooting

**Issue**: Changes to CSV files don't appear on live site
- **Solution**: CSV data is read at build time. Push to GitHub triggers a new build. Wait 2-5 minutes for deployment.
- **If it's been longer than that, stop waiting** — see the next entry.

**Issue**: Production is stuck on an old commit; pushes have no effect
- **Diagnosis**: Cloudflare serves the last *successful* build, so a site frozen at
  a pre-existing state means builds are **failing**, not queuing. Identify the last
  good commit by what production still shows.
- **First thing to check**: `npm ci --dry-run` (exit 0 = lockfile in sync). Cloudflare
  runs `npm ci`, which fails outright when `package.json` and `package-lock.json`
  disagree — and no local command (`npm run build`, `tsc`, `bun test`) reproduces it.
- **Common cause**: an unintended `package-lock.json` change, either from adding a
  dependency or as a side effect of `npm run pages:build`. See the Deployment Process
  warnings above.
- **Fix**: restore the lockfile from the last successfully deployed commit —
  `git checkout <good-sha> -- package-lock.json` — then confirm `npm ci --dry-run`
  exits 0 before pushing.

**Issue**: Build fails with "wrangler.toml" errors
- **Solution**: Cloudflare Pages doesn't use wrangler.toml. Remove it or ensure it only has `compatibility_flags = ["nodejs_compat"]`.

**Issue**: "Invalid prerender config" warnings
- **Solution**: These are harmless warnings from the adapter. Site will work correctly.
