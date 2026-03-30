# Journedge

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/journedge-logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="public/journedge-logo-light.svg">
  <img alt="Journedge" src="public/journedge-logo-light.svg" width="240" />
</picture>

<br /><br />

![Version](https://img.shields.io/badge/version-3.0.0-4d9fff?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)
![Open Source](https://img.shields.io/badge/open--source-yes-4d9fff?style=flat-square)

**An institutional-grade trading journal built for serious traders.**

[Features](#features) · [Screenshots](#screenshots) · [Getting Started](#getting-started) · [Importing Trades](#importing-trades) · [Analytics](#analytics-engine) · [Roadmap](#roadmap) · [Contributing](#contributing)

</div>

---

## Why Journedge

Most trading journals are either too simple to be useful or locked behind expensive subscriptions. Journedge is built differently.

**Your data stays yours.** Everything runs locally on your machine using SQLite. No cloud sync, no user accounts, no telemetry, no third-party data transfers. Your trade history, journal entries, and performance data never leave your machine.

**Built for serious traders.** Multi-account support, real equity curve tracking from actual starting balance, institutional-grade risk analytics, tag-based behavioural analysis, and a structured daily journal — not just a P&L spreadsheet.

**Open source and auditable.** The entire codebase is available, readable, and open to contribution. You can verify exactly what the application does with your data.

> Journedge was previously released as Tradello (v1.0.0 through v2.3.0). The project has been renamed to better reflect its core purpose — turning your journal into your edge. Full history is preserved in [CHANGELOG.md](./CHANGELOG.md).

---

## Screenshots

### Dashboard
Real-time stat cards, full trade history table with multi-filter support, and account-scoped P&L tracking. Filters by symbol, status, tag, and date range update all metrics dynamically.

![Dashboard](docs/screenshots/dashboard.png)

---

### Analytics — Overview
Equity curve from actual account balance, P&L by symbol, P&L by tag, win/loss breakdown, and streak analysis.

![Analytics Overview](docs/screenshots/analytics-overview.png)

---

### Analytics — Risk Metrics
Sharpe, Sortino, and Calmar ratios with contextual interpretation. Drawdown curve over time with duration tracking. Rolling 20-trade win rate to surface consistency trends.

![Analytics Risk Metrics](docs/screenshots/analytics-risk.png)

---

### Analytics — Time Analysis
P&L and win rate by day of week, daily distribution bars, and win rate by tag — reveals session-specific patterns and setup quality at a glance.

![Analytics Time Analysis](docs/screenshots/analytics-time.png)

---

### Journal
Day-grouped trade review with inline journal notes, tags, R:R, entry/exit times, image screenshots, and per-day stats. Searchable and filterable.

![Journal](docs/screenshots/journal.png)

---

### Export
Report builder with date range, ticker, tag, and status filters. Live PDF preview. Full institutional-grade report generated entirely client-side.

![Export](docs/screenshots/export.png)

---

## Features

### Trade Management

- Import trades from five brokers — format is auto-detected on file drop, no configuration required
- Manual trade entry with live P&L preview, auto symbol detection, and option detail parsing from OCC-format symbols
- Multi-account support — create separate accounts per broker, switch between them from the sidebar, all analytics and journal data are account-scoped
- Full trade journal panel — notes, tags, screenshots, entry/exit times, R:R ratio, chart links
- Idempotent imports — re-importing the same file does not create duplicate trades

### Dashboard

- Stat cards for net P&L, win rate, profit factor, and average loss — all reactive to active filters
- Filter by symbol, status, tag, date range, and free-text search simultaneously
- Full trade history table with click-to-open detail panel
- Active filter count shown inline with one-click clear

### Analytics Engine

**Performance metrics**
- Net P&L and equity curve plotted from initial account balance
- Win rate, profit factor, expectancy expressed in dollars per trade
- Average win, average loss, best trade, worst trade
- Maximum win streak, maximum loss streak, current open streak

**Risk metrics**
- Sharpe ratio — risk-adjusted return per unit of total volatility, annualised to 252 trading days
- Sortino ratio — same as Sharpe but penalises only downside deviation, more meaningful for active traders
- Calmar ratio — annualised return divided by maximum drawdown percentage
- Maximum drawdown in dollars and percentage from equity peak
- Longest drawdown duration in days, current open drawdown duration

**Drawdown analysis**
- Full drawdown curve over time showing percentage deviation from rolling high-water mark
- Visual identification of drawdown entry and recovery periods

**Consistency analysis**
- Rolling 20-trade win rate — reveals whether performance is consistent or spike-dependent
- Daily P&L distribution chart — surfaces reliance on outlier days
- P&L by day of week with trade count and win rate per session

**R-Multiple analysis**
- R-multiple histogram using average loss as 1R proxy
- Average R per trade and expectancy expressed in R units
- Distribution shape reveals structural edge — positive skew indicates a sound system

**Breakdown analysis**
- P&L and win rate by underlying symbol — identifies which instruments you trade well
- P&L and win rate by tag — correlates setup labels with actual performance outcomes

### Journal

- Trades grouped by trading day with per-day P&L, win count, loss count, and win rate
- Free-text search across journal notes and symbols
- Filter by win/loss status and by tag independently
- Stats strip — days traded, best day, worst day, notes coverage ratio
- Journal entries visible inline with 3-line preview, full entry in trade panel

### Calendar

- Full monthly calendar with per-day P&L and direction colouring
- Click any day to open a detail panel with all trades and journal entries for that session
- Monthly stats — trading day count, average daily P&L, best day, worst day

### Export

- Report builder with independent controls for date range, tickers, tags, and trade status
- Toggle individual report sections — cover page, performance summary, daily breakdown, trade history, journal entries
- Journal layout options — 1, 2, or 4 entries per page
- Live scaled preview before generating
- PDF rendered entirely client-side via `@react-pdf/renderer` — no server involvement, data never transmitted

### Settings

- Accent colour themes — green, blue, purple, orange, pink — applied instantly and persisted across sessions
- Trading preferences — default options multiplier, commission, and fees pre-fill manual trade entry
- CSV export for backup or migration to another tool
- In-app auto-update system — fetches the latest tagged release from GitHub, stashes local changes, runs `npm install` and `prisma migrate deploy`, then prompts for server restart
- Automatic database backup before every update — last five backups retained in `/backups`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Database | SQLite via Prisma 5 |
| Charts | Recharts 3 |
| PDF | @react-pdf/renderer 4 |
| Icons | Lucide React |
| Styling | Inline styles with CSS custom properties |

---

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Installation

```bash
git clone https://github.com/TheQuantum-Dev/journedge.git
cd journedge
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First Steps

1. Go to **Accounts** and create your first trading account — name it, select your broker, and enter your starting balance. This is the baseline the equity curve is calculated from.
2. Go to **Import Trades** and drop your broker CSV. The format is detected automatically.
3. Your trades populate immediately across Dashboard, Journal, Analytics, Calendar, and Export.
4. Open any trade from the Dashboard or Journal to add notes, tags, screenshots, entry/exit times, and R:R ratio.

---

## Importing Trades

Drop your CSV file onto the Import Trades page. Journedge reads the header row and detects the broker format automatically — no field mapping, no configuration required.

| Broker | Status | Notes |
|--------|--------|-------|
| Fidelity | ✅ Supported | Export from Activity and Orders |
| TD Ameritrade | ✅ Supported | Works with post-Schwab merger exports |
| Tastytrade | ✅ Supported | Options, stocks, and futures supported |
| Interactive Brokers | ✅ Supported | Export from Flex Query or Activity Statement |
| Journedge Export | ✅ Supported | Re-import your own exports — all journal data preserved |

### How to export from Fidelity

1. Log in and go to **Accounts and Trade → Activity and Orders**
2. Select your date range
3. Click **Download** and choose CSV

### How to export from Tastytrade

1. Go to **History**
2. Set your date range
3. Click **Export** in the top right

### How to export from TD Ameritrade

1. Go to **My Account → History and Statements**
2. Select **Transactions** and your date range
3. Export as CSV

### How to export from Interactive Brokers

1. Go to **Reports → Flex Queries** or open an **Activity Statement**
2. Set format to CSV
3. Ensure the **Trades** section is included

---

## Architecture Notes

**Database.** SQLite via Prisma. All data is local — no hosted database, no connection strings pointing anywhere external. The database file lives at `prisma/journedge.db` and is gitignored.

**CSV parsers.** Each broker has an isolated parser in `app/lib/`. The import page runs format detection in priority order — Journedge export first, then Tastytrade, TD Ameritrade, IBKR, with Fidelity as the fallback. Parsers return a normalised `Trade[]` and never mutate shared state.

**PDF generation.** `@react-pdf/renderer` runs entirely in the browser. `ExportPDFInner` is dynamically imported with `ssr: false` to prevent the renderer loading in a Node environment. The logo is rasterised from SVG to PNG at mount time via a canvas element before being passed to the document definition.

**Auto-update.** The update endpoint streams progress via Server-Sent Events. Steps run sequentially — git preflight, database backup, local stash, tag checkout, npm install, prisma migrate deploy. The backup step retains the five most recent copies and is non-fatal on failure. The restart endpoint calls `process.exit(0)` after flushing the response.

**State management.** A single React Context holds all trades, accounts, and navigation state. Trades load once on mount and update locally after API calls to avoid full reloads. The active account filters the trade array at render time — no separate fetch per account switch.

---

## Project Structure

```
journedge/
├── app/
│   ├── api/
│   │   ├── accounts/            # Account CRUD
│   │   ├── trades/              # Trade read, write, patch, clear
│   │   ├── upload/              # Screenshot file uploads
│   │   └── update/              # Auto-update SSE stream + restart endpoint
│   ├── components/
│   │   ├── Sidebar.tsx          # Navigation and account switcher
│   │   ├── TradePanel.tsx       # Slide-out journal and edit panel
│   │   ├── AddTradeModal.tsx    # Manual trade entry
│   │   ├── TradingReportPDF.tsx # PDF document definition
│   │   └── ExportPDFInner.tsx   # Client-only PDF download wrapper
│   ├── context/
│   │   └── AppContext.tsx       # Global state — trades, accounts, navigation
│   ├── hooks/
│   │   └── useSettings.ts       # Settings persistence via localStorage
│   ├── lib/
│   │   ├── types.ts             # Shared Trade and Account interfaces
│   │   ├── db.ts                # Prisma client singleton
│   │   ├── svgToPng.ts          # SVG rasteriser for PDF logo
│   │   ├── parseFidelityCSV.ts
│   │   ├── parseTDAmeritradeCSV.ts
│   │   ├── parseTastytradeCSV.ts
│   │   ├── parseIBKRCSV.ts
│   │   └── parseJournedgeCSV.ts  # Journedge export format parser
│   └── pages/
│       ├── Dashboard.tsx
│       ├── JournalPage.tsx
│       ├── AnalyticsPage.tsx
│       ├── CalendarPage.tsx
│       ├── ImportPage.tsx
│       ├── AccountsPage.tsx
│       ├── ExportPage.tsx
│       └── SettingsPage.tsx
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Full migration history
├── public/
│   ├── journedge-logo-dark.svg
│   ├── journedge-logo-light.svg
│   └── journedge-icon.svg
├── scripts/
│   └── changelog.js             # Automated changelog entry generator
└── backups/                     # Auto-update database backups (gitignored)
```

---

## Roadmap

**v3.0.0 — Current**
- Rebrand from Tradello to Journedge
- New mark, logo, and identity

**v3.1.0 — In progress**
- Complete Journal page redesign
- Improved daily review workflow

**Planned**
- Risk of ruin calculator
- Overtrading detection — flags sessions where trade frequency exceeds your statistical baseline
- Revenge trading detection — flags trades taken within a configurable window after a loss
- MAE/MFE tracking — maximum adverse and favourable excursion per trade
- GitHub Wiki — setup guides, metric explanations, broker export walkthroughs

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

The highest-value contributions are new broker CSV parsers. If your broker is not on the supported list, open an issue with a sanitised sample CSV and we can spec the parser together.

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full release history going back to v1.0.0.

---

## Security

See [SECURITY.md](./SECURITY.md) for the supported versions and vulnerability disclosure policy.

---

## License

Journedge is open source under the [MIT License](./LICENSE).

---

<div align="center">

Built by [TheQuantum-Dev](https://github.com/TheQuantum-Dev)

*Built for traders who take their craft seriously.*

</div>