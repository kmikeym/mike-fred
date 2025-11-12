# MIKE Economic Data Dashboard

Official economic indicators and quarterly reports from the MIKE Economy. A FRED-style data portal for personal productivity, growth, and strategic output metrics.

## 🎯 Project Overview

This project provides a comprehensive economic data dashboard with official-looking indicators and quarterly reports. It elevates the "publicly traded person" concept by treating personal productivity and output as a legitimate economic entity worthy of professional economic analysis.

**Live URL:** https://mike.quarterly.systems

## 📊 Key Features

### 1. Economic Indicators Dashboard
- **6 Key Indicators:**
  - Personal Productivity Index (PPI) - RescueTime productive hours
  - Knowledge Base Expansion - Obsidian vault growth
  - Social Capital Index - Multi-platform engagement metrics
  - Content Production Velocity - Cross-platform content output
  - Revenue Index - Composite business performance
  - Project Completion Rate - Delivery effectiveness

### 2. FRED-Style Data Pages
- Interactive line charts with historical trends
- Current value displays with percentage changes
- Data tables with recent observations
- Metadata (source, frequency, calculation method)
- Download capabilities (CSV, JSON)

### 3. Reports
- Fed-style official economic reports
- Comprehensive indicator analysis
- Strategic outlook and forecasts
- Historical trends and YoY comparisons
- Professional government document styling

### 4. Embeddable Widget
- Compact dashboard for external websites
- Iframe and JavaScript embed options
- Auto-refresh with 6-hour intervals
- Responsive design
- Easy integration for KmikeyM.com

## 🛠 Tech Stack

- **Framework:** Next.js 15 with React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS 3
- **Charts:** Recharts
- **Package Manager:** Bun
- **Data Storage:** CSV files (git-tracked history)
- **Deployment:** Cloudflare Pages with @cloudflare/next-on-pages
- **API:** Cloudflare Workers with KV (planned)

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
│   └── IndicatorChart.tsx    # Recharts line chart
├── lib/                        # Utilities and logic
│   ├── types.ts              # TypeScript definitions
│   ├── indicators.ts         # Indicator registry & loaders
│   └── utils.ts              # Helper functions
├── data/                       # CSV data files
│   ├── ppi.csv
│   ├── knowledge-expansion.csv
│   ├── social-capital.csv
│   ├── content-velocity.csv
│   ├── revenue.csv
│   └── completion-rate.csv
├── worker/                     # Cloudflare Worker (future)
└── public/                     # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- Node.js 18+ (for compatibility)

### Installation

```bash
cd mike-fred
bun install
```

### Development

```bash
bun run dev
```

Visit http://localhost:3000

### Production Build

```bash
# Standard Next.js build (for testing)
bun run build
bun run start

# Cloudflare Pages build (for deployment)
bun run pages:build
```

## 📈 Data Management

### Adding New Data Points

1. Open the relevant CSV file in `/data/`
2. Add a new row with format: `date,value,notes` (optional 4th column for additional metadata)
3. Save and commit the file
4. Push to GitHub
5. Cloudflare Pages will auto-rebuild (2-5 minutes)
6. Updated data appears on live site

Example:
```csv
2025-12-01,130.5,Continued growth trajectory
```

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

**Required Configuration Files:**
- `wrangler.toml` - Sets `nodejs_compat` compatibility flag (required for Node.js APIs)
- Without this flag, you'll see "Node.JS Compatibility Error" on the live site

The `@cloudflare/next-on-pages` adapter converts Next.js SSG pages to Cloudflare Workers, enabling dynamic routes on Cloudflare's static hosting platform.

**Deployment Process:**
1. Push to `main` branch
2. Cloudflare Pages auto-builds and deploys (usually 2-5 minutes)
3. Site live at custom domain
4. All CSV data is baked into static HTML at build time

### Environment Variables (Future)
```env
NEXT_PUBLIC_API_URL=https://mike-api.quarterly.systems
```

## 🔄 Future Enhancements

- [ ] Cloudflare Worker API with KV caching
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

Private project - © 2025 K5M. All rights reserved.

## 🔗 Related Projects

- [Quarterly Systems](https://quarterly.systems) - Parent ecosystem
- [OKR Dashboard](../okr-dashboard) - Team goal tracking
- [News Dashboard](../News%20Dashboard) - Coding news aggregator
- [Branch](../Branch) - GitHub social graph analyzer

---

**Built with** ❤️ **by MIKE Economic Data**
*A [Quarterly Systems](https://quarterly.systems) project*
