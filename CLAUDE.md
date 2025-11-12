# MIKE Federal Reserve - Economic Data Dashboard

This is a Next.js 15 project deployed to Cloudflare Pages that displays personal economic indicators in a FRED-style dashboard.

## Project Overview

- **Tech Stack**: Next.js 15, React 18, TypeScript, Tailwind CSS, Recharts
- **Deployment**: Cloudflare Pages (auto-deploy on push to `main`)
- **Data Source**: CSV files in `/data` directory
- **Live URL**: https://mike.quarterly.systems

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
- `content-velocity.csv` - Content production rate
- `revenue.csv` - Revenue index
- `completion-rate.csv` - Project completion percentage

### Adding New Data Points

1. Open the relevant CSV file in `/data/`
2. Add a new row with format: `date,value,notes`
3. Save and commit the file
4. Push to GitHub
5. Cloudflare Pages will auto-rebuild (2-5 minutes)
6. Updated data appears on live site

**Important**: Data is baked into static pages at build time via Static Site Generation (SSG), so updates require a full rebuild to appear on the live site.

## Deployment Process

1. Push changes to `main` branch
2. Cloudflare Pages detects the push
3. Runs `npm run pages:build` command
4. Deploys `.vercel/output/static` directory
5. Site is live at https://mike.quarterly.systems

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

**Issue**: Build fails with "wrangler.toml" errors
- **Solution**: Cloudflare Pages doesn't use wrangler.toml. Remove it or ensure it only has `compatibility_flags = ["nodejs_compat"]`.

**Issue**: "Invalid prerender config" warnings
- **Solution**: These are harmless warnings from the adapter. Site will work correctly.
