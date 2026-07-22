# MIKE Economic Data Dashboard

Official economic indicators and quarterly reports from the MIKE Economy. A FRED-style data portal for personal productivity, growth, and strategic output metrics.

## 🎯 Project Overview

This project provides a comprehensive economic data dashboard with official-looking indicators and quarterly reports. It elevates the "publicly traded person" concept by treating personal productivity and output as a legitimate economic entity worthy of professional economic analysis.

**Live URL:** https://mike.quarterly.systems

## 📊 Key Features

### 1. Economic Indicators Dashboard
- **6 Key Indicators**, all monthly:
  - Personal Productivity Index (PPI) — RescueTime Productivity Pulse
  - Knowledge Base Expansion Rate (KBER) — Obsidian vault note count
  - Social Capital Index (SCI) — multi-platform audience reach
  - Personal Health Index (PHI) — Apple Watch recovery, sleep, activity, fitness
  - Personal Wealth Index (PWI) — net worth, indexed
  - Longform Media Velocity (LMV) — books and films consumed

Quarterly *reports* are a separate artifact; the indicators themselves are monthly.

PHI was rebuilt in 2026 as PHI 2.0. The legacy sleep/activity/weight index is
preserved as a vintage in `data/phi-classic.csv` rather than overwritten — see
[`STANDARDS.md`](STANDARDS.md) §4 and `/reports/phi-2.0-methodology`.

### 2. FRED-Style Data Pages
- Interactive line charts with historical trends and ALL/1Y/6M/3M range selection
- Current value displays with percentage changes
- Data tables with recent observations
- Metadata (source, frequency, calculation method)
- Link to the full dataset as CSV on GitHub

### 3. Reports
- Fed-style official economic reports
- Comprehensive indicator analysis
- Strategic outlook and forecasts
- Historical trends and YoY comparisons
- Professional government document styling

### 4. Embeddable Widget
- Compact dashboard for external websites
- Iframe embed (JavaScript embed is planned, not built)
- Responsive design
- Easy integration for KmikeyM.com

Values are baked in at build time, so the widget refreshes when the site rebuilds
rather than on a timer.

## 🛠 Tech Stack

- **Framework:** Next.js 15 with React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS 3
- **Charts:** Recharts
- **Package Manager:** npm (Cloudflare runs `npm ci` — keep the lockfile in sync)
- **Tests:** bun test
- **Data Storage:** CSV files (git-tracked history)
- **Deployment:** Cloudflare Pages with @cloudflare/next-on-pages
- **Machine-readable API:** static JSON at `/api/v1/` (designed, not yet built — see issue #6)

**Note:** Using Next.js 15 (not 16) due to `@cloudflare/next-on-pages` compatibility requirements.

## 📁 Project Structure

```
mike-fred/
├── app/                        # Next.js app directory
│   ├── page.tsx               # Main dashboard
│   ├── layout.tsx             # Root layout with navigation
│   ├── globals.css            # Global styles
│   ├── series/[id]/           # Individual indicator pages
│   ├── reports/               # Quarterly reports
│   │   ├── page.tsx          # Reports list
│   │   └── [id]/page.tsx     # Individual report
│   └── widget/                # Embeddable widget
│       ├── page.tsx          # Widget documentation
│       └── embed/page.tsx    # Standalone embed
├── components/                 # React components
│   ├── IndicatorChart.tsx    # Recharts line + volume-bar chart
│   ├── ChartWithRange.tsx    # ALL/1Y/6M/3M range selector
│   ├── PhiOverlapChart.tsx   # PHI 2.0 vs PHI-Classic overlay
│   ├── YoYChart.tsx          # Year-over-year comparison
│   ├── Sparkline.tsx         # Inline mini-chart
│   └── CopyButton.tsx        # Copy-to-clipboard
├── lib/                        # Utilities and logic
│   ├── types.ts              # TypeScript definitions
│   ├── indicators.ts         # Indicator registry, CSV parser, loaders
│   ├── utils.ts              # Helper functions
│   └── *.test.ts             # Tests (bun test)
├── data/                       # CSV data files
│   ├── ppi.csv               # date,value,notes,pulse,hours
│   ├── knowledge-expansion.csv
│   ├── social-capital.csv
│   ├── phi.csv               # PHI 2.0
│   ├── phi-classic.csv       # preserved pre-2026 vintage
│   ├── revenue.csv
│   ├── completion-rate.csv
│   └── quarterly/*.json      # quarterly report narratives
├── scripts/                    # Monthly update helpers
├── STANDARDS.md                # Normative data conventions
└── public/                     # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ (Cloudflare builds with `NODE_VERSION=20`)
- [Bun](https://bun.sh) to run the test suite

### Installation

```bash
cd mike-fred
npm install
```

### Development

```bash
npm run dev
```

Visit http://localhost:3000

### Production Build

```bash
# Standard Next.js build (for testing)
npm run build
npm run start

# Cloudflare Pages build (for deployment)
npm run pages:build
```

> ⚠️ `npm run pages:build` rewrites `package-lock.json` as a side effect
> (`@cloudflare/next-on-pages` runs its own install). Cloudflare runs `npm ci`,
> which fails outright when the lockfile and `package.json` disagree — so after
> running it, check `git diff --stat package-lock.json` (expect nothing) and
> `npm ci --dry-run` (expect exit 0) before committing.

### Tests

```bash
npm test          # bun test
npm run test:tz   # same suite under three timezones
```

Covers the data-integrity invariants in [`STANDARDS.md`](STANDARDS.md): notes
round-trip byte-for-byte from every shipped CSV, and dates render identically in
any timezone.

## 📈 Data Management

### Adding New Data Points

> Read [`STANDARDS.md`](STANDARDS.md) first — it is normative for date semantics,
> note formatting, nulls, and provenance.

1. Open the relevant CSV file in `/data/`
2. Add a row: `date,value,notes` — or `date,value,notes,pulse,hours` for `ppi.csv`.
   Notes may contain commas; the parser claims trailing numeric columns from the right.
3. Run `npm test` — the round-trip guard catches malformed rows before they ship
4. Commit and push to GitHub
5. Cloudflare Pages auto-rebuilds (2-5 minutes)
6. Confirm the change is live on production, not just that the local build passed

Example:
```csv
2025-12-01,130.5,Continued growth trajectory, and a strong close
```

`scripts/mike-fred-append-month.sh` automates the monthly release (dry-run by
default; never commits or pushes). `scripts/mike-fred-vault-pull.sh` gathers the
vault-derivable inputs — set `MIKE_FRED_VAULT` to your Obsidian vault path.

**Note:** Data is baked into static pages at build time via Static Site Generation (SSG), so updates require a full rebuild to appear on the live site.

### Creating New Indicators

1. Add CSV file to `/data/[indicator-id].csv`
2. Update `lib/indicators.ts` INDICATOR_REGISTRY
3. Add to TypeScript types in `lib/types.ts`
4. Indicator automatically appears on dashboard

## 🎨 Design System

### Colors
- **Fed Navy:** `#002147` - Primary header color
- **Fed Teal:** `#008080` - Accent color
- **Fed Gold:** `#D4AF37` - Highlights
- **Primary Purple:** `#667eea` - Quarterly Systems brand
- **Trend Colors:**
  - Up: `#10b981` (green)
  - Down: `#ef4444` (red)
  - Neutral: `#f59e0b` (yellow)

### Typography
- **Headers:** System font stack (San Francisco, Segoe UI, etc.)
- **Body:** -apple-system, BlinkMacSystemFont, Roboto
- **Fed Documents:** Georgia, Times New Roman (serif)

## 🔌 Widget Embedding

### Iframe Method
```html
<iframe
  src="https://mike.quarterly.systems/widget/embed"
  width="100%"
  height="400"
  frameborder="0"
  style="border: none; border-radius: 12px;"
></iframe>
```

### JavaScript Method (Future)
```html
<div id="mike-widget"></div>
<script src="https://mike.quarterly.systems/widget/embed.js"></script>
<script>
  MIKEWidget.init({
    container: '#mike-widget',
    theme: 'light'
  });
</script>
```

## 📝 Reports

Reports are generated quarterly and include:
- Executive summary
- Detailed indicator analysis
- Historical trends
- Strategic outlook
- Methodology documentation

Reports follow Federal Reserve document styling for professional presentation.

## 🚀 Deployment

### Cloudflare Pages

**Status:** ✅ Live at https://mike.quarterly.systems

**Build Configuration:**
- **Build command:** `npm run pages:build`
- **Build output directory:** `.vercel/output/static`
- **Environment variables:** `NODE_VERSION=20`

**Compatibility flags:** `nodejs_compat` must be enabled for the deployed site to
work. This repo contains no `wrangler.toml` and the site builds and runs, so the
flag is configured in the Cloudflare Pages dashboard (Settings → Functions →
Compatibility flags). Do not add a `wrangler.toml` to "fix" a compatibility error —
Cloudflare Pages does not read it, and its presence causes build errors.

The `@cloudflare/next-on-pages` adapter converts Next.js SSG pages to Cloudflare Workers, enabling dynamic routes on Cloudflare's static hosting platform.

**Deployment Process:**
1. Push to `main` branch
2. Cloudflare runs `npm ci`, then `npm run pages:build`
3. Auto-deploys (usually 2-5 minutes); site live at the custom domain
4. All CSV data is baked into static HTML at build time

**Verify against production, not the local build.** Nothing in the local workflow
runs `npm ci`, so `npm run build`, `tsc`, and `bun test` can all pass while the
deploy fails. A site frozen on an old commit is a *failed* build, not a slow one —
Cloudflare keeps serving the last successful deploy. See `CLAUDE.md` →
Troubleshooting.

### Environment Variables (Future)
```env
NEXT_PUBLIC_API_URL=https://mike-api.quarterly.systems
```

## 🔄 Future Enhancements

- [ ] [Machine-readable JSON API at `/api/v1/`](https://github.com/kmikeym/mike-fred/issues/6) — FRED-style, agent-facing
- [ ] MCP server wrapping the JSON API
- [ ] Automated data collection (RescueTime, GitHub APIs)
- [ ] Real-time updates via WebSockets
- [ ] Historical data comparison tools
- [ ] Export to PDF for quarterly reports
- [ ] Dark mode support
- [ ] Mobile app version
- [ ] Shareholder voting integration

## 🤝 Integration Points

- **KmikeyM.com:** Main widget embed
- **Quarterly Systems:** Landing page cross-link
- **Substack:** Newsletter content source
- **YouTube:** Content metrics tracking
- **GitHub:** Project completion tracking
- **RescueTime:** Productivity data source

## 📄 License

**CC0-1.0** — data and code are released into the public domain. No conditions, no
attribution required. Copy it, fork it, build on it. See [`LICENSE`](LICENSE).

Data conventions and the machine-readable API contract are documented in
[`STANDARDS.md`](STANDARDS.md).

## 🔗 Related Projects

- [Quarterly Systems](https://quarterly.systems) - Parent ecosystem
- [OKR Dashboard](../okr-dashboard) - Team goal tracking
- [News Dashboard](../News%20Dashboard) - Coding news aggregator
- [Branch](../Branch) - GitHub social graph analyzer

---

**Built with** ❤️ **by MIKE Economic Data**
*A [Quarterly Systems](https://quarterly.systems) project*
