# Journedge

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/journedge-logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="public/journedge-logo-light.svg">
  <img alt="Journedge" src="public/journedge-logo-light.svg" width="260" />
</picture>

<br /><br />

![Version](https://img.shields.io/badge/version-4.0.0-4d9fff?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)
![SQLite](https://img.shields.io/badge/SQLite-local-07405e?style=flat-square&logo=sqlite)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)
![Open Source](https://img.shields.io/badge/open--source-yes-4d9fff?style=flat-square)

### An institutional-grade trading journal built for serious traders.

[Features](#features) · [Screenshots](#screenshots) · [Getting Started](#getting-started) · [Importing Trades](#importing-trades) · [Analytics](#analytics-engine) · [Architecture](#architecture-notes) · [Roadmap](#roadmap) · [Contributing](#contributing)

</div>

---

## Why Journedge

Most trading journals are either too simple to be useful or locked behind expensive subscriptions. Journedge is built differently — it is a complete trading process tool, not just a P&L logger.

**Your data stays yours.** Everything runs locally on your machine using SQLite. No cloud sync, no user accounts, no telemetry, no third-party data transfers of any kind. Your trade history, journal entries, screenshots, and performance data never leave your machine.

**Built for serious traders.** Multi-account support, real equity curve tracking from your actual starting balance, institutional-grade risk metrics, execution quality analysis, behavioral pattern detection, pre-trade planning, a strategy playbook with live performance stats, position sizing, hour-of-day heatmaps, and a full rich text journal with templates.

**Open source and auditable.** The entire codebase is open, readable, and open to contribution. You can verify exactly what the application does with your data — because you can read every line of it.

---

## Screenshots

### Dashboard
Stat cards, daily risk meters, full trade history with multi-filter support and inline trade deletion.

![Dashboard](docs/screenshots/dashboard.png)

### Journal
Day-grouped trade cards with journal previews, tags, and quick delete.

![Journal](docs/screenshots/journal.png)

### Journal Editor
Full-page rich text editor with formatting toolbar, trade stats header, and playbook linking.

![Journal Editor](docs/screenshots/journal-editor.png)

### Trade Panel (Quick View)
Slide-out panel with entry/exit times, R:R, MAE/MFE, tags, screenshots, and delete.

![Trade Panel](docs/screenshots/trade-panel.png)

### Pre-Trade Planning
Plan your thesis, entry zone, stop, and target before the trade. Compare plan vs execution after.

![Trade Plans](docs/screenshots/plans.png)

### Playbook
Strategy library with setup rules, entry triggers, and live per-setup performance from linked trades.

![Playbook](docs/screenshots/playbook.png)

### Position Sizing Calculator
Risk-based position sizing for stocks, options, and futures with full R:R output.

![Position Sizer](docs/screenshots/position-sizer.png)

### Analytics — Overview
Equity curve from actual account balance, P&L by symbol, P&L by tag, win/loss breakdown, and streak analysis.

![Analytics Overview](docs/screenshots/analytics-overview.png)

### Analytics — Risk Metrics
Sharpe, Sortino, and Calmar ratios. Drawdown curve over time. Rolling 20-trade win rate.

![Analytics Risk](docs/screenshots/analytics-risk.png)

### Analytics — Hour-of-Day Heatmap
Performance breakdown by hour of the trading day — P&L, win rate, and trade count per hour slot.

![Analytics Heatmap](docs/screenshots/analytics-heatmap.png)

### Analytics — Execution Quality
MAE/MFE per-trade chart, entry efficiency, and exit efficiency analysis.

![Analytics Execution](docs/screenshots/analytics-execution.png)

### Analytics — Behavioral Analysis
Overtrading detection, revenge trade sequences, discipline score, and interactive risk of ruin calculator.

![Analytics Behavior](docs/screenshots/analytics-behavior.png)

### Calendar
Monthly P&L calendar — always hardcoded red/green. Snaps to your most recent trading month automatically.

![Calendar](docs/screenshots/calendar.png)

### Import
Broker auto-detection including Fidelity, Charles Schwab, TD Ameritrade, Tastytrade, and Interactive Brokers.

![Import](docs/screenshots/import.png)

### Export
Report builder with filters, section toggles, and live PDF preview. Renders entirely client-side.

![Export](docs/screenshots/export.png)

### Settings
Accent color, light/dark mode, risk controls, trading preferences, and in-app auto-update.

![Settings](docs/screenshots/settings.png)

---

## Features

### Trade Management

- Import from five brokers — format auto-detected on file drop, no configuration required
- Manual trade entry with live P&L preview, auto symbol detection, and OCC option symbol parsing
- Multi-account support — create accounts per broker, switch from the sidebar, all data account-scoped
- Every trade supports: entry/exit times, R:R ratio, MAE/MFE, tags, chart link, screenshots, and a rich text journal
- Idempotent imports — re-importing the same file never creates duplicates
- Delete any trade from the Dashboard table, the Journal page, or the trade quick-view panel — each requires a two-step confirmation so nothing is removed by accident

### Journal Editor

A full word processor built on TipTap and ProseMirror, not a text area.

The toolbar includes undo/redo, 15 font families with dynamic Google Fonts loading, font weight from Light to ExtraBold, H1/H2/H3, bold/italic/underline/strikethrough, text color with a 40-swatch palette and pinnable custom hex colors, highlights, text alignment, bullet and numbered lists, horizontal dividers, links, and inline image insertion.

Content autosaves 1.5 seconds after the last keystroke with a live Saving / Saved indicator. Templates let you define a document structure once and auto-apply it whenever you open a new journal for a specific trade type.

### Pre-Trade Planning

Plan before you trade. Review after.

Create a plan with your thesis, setup type, entry zone, stop level, and target. The R:R ratio calculates live as you type. Once the trade executes, link it back to the plan and compare what you intended versus what actually happened.

Plans track their status through a lifecycle: **Pending → Executed / Missed / Cancelled**. Filter and review your full plan history at any time.

### Strategy Playbook

A dedicated strategy library separate from the journal. Document each setup you trade — its rules, entry triggers, exit criteria, timeframes, and instruments — then link individual trades to it from the journal editor or the trade quick-view panel.

Once trades are linked, the playbook shows live performance stats per setup: trade count, win rate, and net P&L calculated automatically. Over time this becomes your personal trading handbook with quantified evidence for which setups actually work.

### Tag System

Tags are stored in a dedicated database table and shared globally across the entire app. Creating a tag anywhere makes it immediately available everywhere else. No duplicate management, no sync issues.

### Dashboard

Stat cards for net P&L, win rate, profit factor, and average loss react instantly to any active filter. The daily risk controls strip shows live meters for your loss limit and trade count limit, turning yellow at 75% and red when a limit is reached.

The full trade history table supports simultaneous filtering by symbol, status, tag, date range, and free-text search, with a delete action on every row.

### Analytics Engine

Seven tabs of analysis covering every dimension of trading performance.

**Overview** — equity curve from initial account balance, P&L by symbol, P&L by tag, win/loss breakdown, and streak analysis.

**Risk** — Sharpe, Sortino, and Calmar ratios annualised to 252 trading days. Maximum drawdown in dollars and percentage from the equity peak, with longest and current drawdown duration. Rolling 20-trade win rate.

**Time** — P&L and win rate by day of week, daily P&L distribution showing consistency vs spike dependency.

**Heatmap** — hour-of-day performance analysis showing P&L, win rate, and trade count per hour of the trading day. Toggle between metrics. Requires entry times to be logged on trades.

**R-Multiples** — R-multiple histogram using average loss as 1R. Average R per trade, expectancy in R units, and symbol breakdown.

**Execution** — MAE/MFE analysis including entry efficiency (MFE / (MFE + MAE)), exit efficiency (PnL / MFE on wins), and a paired bar chart showing MAE vs MFE for the last 20 trades with data.

**Behavior** — overtrading detection using a statistical threshold of mean + 1.5 standard deviations of your daily trade count. Revenge trade sequence detection. Discipline score. Interactive risk of ruin calculator with Kelly Criterion and half-Kelly recommendation.

### Position Sizing Calculator

Enter your account size, risk percentage, entry price, and stop price. The calculator returns your exact position size in shares or contracts, dollar risk, position value as a percentage of account, and stop distance. Add a target to see R:R ratio, potential gain, breakeven win rate, and a proportional risk/reward bar.

Supports stocks, options (with configurable multiplier), and futures. Long and short direction aware. Account balance auto-populates from your active account.

### Daily Risk Controls

Set a daily loss limit and max daily trades in Settings. The dashboard shows a live strip with progress meters — green while within limits, yellow approaching them, red when reached. Both controls are completely hidden when set to zero, so there's no visual clutter if you don't use them.

### Calendar

Monthly calendar with per-day P&L colouring — always hardcoded green and red, never affected by your accent theme. Automatically opens to the month of your most recent trade. Click any day to open a detail panel showing all trades for that session.

### Export

Report builder with date range, ticker, tag, and status filters. Toggle individual sections on or off — cover page, performance summary, daily breakdown, trade history, journal entries. Live preview before generating. The PDF renders entirely in the browser — no data is transmitted anywhere.

### Settings

- Accent colour themes — green, blue, purple, orange, pink
- Light and dark mode with no flash on page load
- Default options multiplier, commission, and fees
- Daily loss limit, max daily trades, and default risk percentage
- CSV and JSON export for backup or migration
- In-app auto-update with shadow install, semver comparison, and automatic database backup

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `D` | Dashboard |
| `J` | Journal |
| `A` | Analytics |
| `C` | Calendar |
| `P` | Trade Plans |
| `B` | Playbook |
| `I` | Import Trades |
| `E` | Export |
| `N` | New Trade |
| `/` | Show all shortcuts |
| `Esc` | Close any open modal |

Shortcuts are disabled while typing in any input field or the journal editor.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Database | SQLite via Prisma 5 |
| Editor | TipTap 2 (ProseMirror) |
| Charts | Recharts 3 |
| PDF | @react-pdf/renderer 4 |
| Icons | Lucide React |
| Styling | Inline styles with CSS custom properties |

---

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm

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

> **Existing users updating manually:** `git pull origin main && npm install && npx prisma migrate dev`

### First Steps

1. Go to **Accounts** and create your first account — name it, select your broker, and enter your starting balance.
2. Go to **Import Trades** and drop your broker CSV. The format is detected automatically.
3. Your trades appear immediately across Dashboard, Journal, Analytics, Calendar, and Export.
4. Open **Playbook** and document the setups you actually trade.
5. Use **Trade Plans** to write out your thesis before your next trade.
6. Open the **Journal**, click **Open Journal** on any trade, and start writing.

---

## Importing Trades

| Broker | Notes | Status |
|--------|-------|--------|
| Fidelity | Export from Activity and Orders | ✅ Supported |
| Charles Schwab | Export the Realized Gain/Loss Lot Details CSV from the Gain/Loss tab | ✅ Supported |
| TD Ameritrade | Works with post-Schwab merger exports | ✅ Supported |
| Tastytrade | Options, stocks, and futures all supported | ✅ Supported |
| Interactive Brokers | Export from Flex Query or Activity Statement | ✅ Supported |
| Journedge Export | Re-import your own exports — all journal data preserved | ✅ Supported |

### Fidelity
**Accounts and Trade → Activity and Orders**, select date range, click **Download**, choose CSV.

### Charles Schwab
Go to your **Gain/Loss** tab, select **Realized Gain/Loss**, choose **Lot Details**, export as CSV.

### Tastytrade
**History**, set date range, click **Export** in the top right.

### TD Ameritrade
**My Account → History and Statements**, select **Transactions** and date range, export as CSV.

### Interactive Brokers
**Reports → Flex Queries** or open an **Activity Statement**, set format to CSV, ensure the **Trades** section is included.

---

## Architecture Notes

**Database.** SQLite via Prisma. All data is local. The database file lives at `prisma/journedge.db` and is gitignored.

**CSV parsers.** Each broker has an isolated parser in `app/lib/`. Format detection runs in priority order — Journedge export first, then Charles Schwab, Tastytrade, TD Ameritrade, IBKR, with Fidelity as the fallback. The Schwab parser is distinct from the others because Schwab's export reports closed lots directly rather than individual buy/sell transaction rows.

**Journal editor.** Built on TipTap with ProseMirror. Documents stored as TipTap JSON in the `journalEntry` TEXT column. Legacy plain-text entries render as plain paragraphs. Autosave debounces 1.5 seconds and patches the in-memory trade immediately so navigation never shows stale content.

**Tag system.** Tags stored in a dedicated `Tag` table, seeded from all existing trade tag arrays on first load. Every creation writes to the database and updates global state — no full reload required.

**Template system.** Templates stored as TipTap JSON with a scope string (`all`, `option`, `stock`, `future`). Auto-apply runs when the editor opens an empty journal — applies silently if exactly one template matches.

**Playbook linking.** `playbookId` is a soft reference on `Trade` with no FK constraint, so playbooks can be deleted without cascading. Stats are computed at read time in `useMemo`.

**Pre-trade planning.** `TradePlan` has a unique `tradeId` constraint enforcing one plan per trade. `planId` on `Trade` links back to the originating plan.

**Trade deletion.** A single `deleteTrade` function lives in `AppContext`, calling `DELETE /api/trades` and removing the trade from in-memory state immediately. It's used identically from the Dashboard table, the Journal page's trade cards, and the trade quick-view panel — each surface implements its own two-click confirmation to prevent accidental deletion, but all three call the same underlying context function.

**Hour-of-day heatmap.** `hourOfDay` (0–23 integer) is extracted from `entryTime` on every trade write and stored directly — enables heatmap queries without recomputing from strings.

**Theme system.** `[data-theme="light"]` overrides all CSS variables. The FOUC prevention script in `layout.tsx` reads stored settings and sets the attribute before React hydrates so there is no visible flash.

**Auto-update.** Streams progress via Server-Sent Events through six steps. Uses a shadow install directory so the live `node_modules` is untouched until the install succeeds. `.next` is deleted last, after packages are fully rebuilt.

**State management.** A single React Context holds trades, accounts, tags, plans, playbook, and navigation state. `updateTradeInMemory` and `deleteTrade` patch the trades array directly without a full API reload.

---

## Project Structure

```
journedge/
├── app/
│   ├── api/
│   │   ├── accounts/            # Account CRUD
│   │   ├── trades/              # Trade read, write, patch, delete, clear
│   │   ├── tags/                # Global tag management
│   │   ├── templates/           # Journal template CRUD
│   │   ├── plans/               # Pre-trade plan CRUD
│   │   ├── playbook/            # Playbook entry CRUD
│   │   ├── upload/               # Screenshot file uploads
│   │   └── update/              # Auto-update SSE stream + restart endpoint
│   ├── components/
│   │   ├── Sidebar.tsx          # Navigation, account switcher
│   │   ├── TradePanel.tsx       # Slide-out quick view, edit, and delete panel
│   │   ├── AddTradeModal.tsx    # Manual trade entry modal
│   │   ├── TagSelector.tsx      # Shared tag input used across the app
│   │   ├── JournalToolbar.tsx   # TipTap formatting toolbar
│   │   ├── TradingReportPDF.tsx # PDF document definition
│   │   └── ExportPDFInner.tsx   # Client-only PDF download wrapper
│   ├── context/
│   │   └── AppContext.tsx       # Global state — trades, accounts, tags, plans, playbook, deleteTrade
│   ├── hooks/
│   │   └── useSettings.ts       # Settings persistence via localStorage
│   ├── lib/
│   │   ├── types.ts             # Shared TypeScript interfaces
│   │   ├── db.ts                # Prisma client singleton
│   │   ├── svgToPng.ts          # SVG rasteriser for PDF logo
│   │   ├── parseFidelityCSV.ts
│   │   ├── parseSchwabCSV.ts     # Charles Schwab realized gain/loss lot parser
│   │   ├── parseTDAmeritradeCSV.ts
│   │   ├── parseTastytradeCSV.ts
│   │   ├── parseIBKRCSV.ts
│   │   └── parseJournedgeCSV.ts  # Journedge export re-import parser
│   └── pages/
│       ├── Dashboard.tsx         # Overview, stat cards, trade history table with delete
│       ├── JournalPage.tsx       # Day-grouped trade cards with delete on each card
│       ├── JournalEditorPage.tsx # Full-page rich text editor per trade
│       ├── AnalyticsPage.tsx     # Seven-tab analytics engine
│       ├── CalendarPage.tsx      # Monthly P&L calendar
│       ├── PlansPage.tsx         # Pre-trade planning
│       ├── PlaybookPage.tsx      # Strategy library with trade performance
│       ├── PositionSizerPage.tsx # Risk-based position size calculator
│       ├── ImportPage.tsx        # CSV import with auto-detection
│       ├── AccountsPage.tsx      # Account management
│       ├── ExportPage.tsx        # PDF report builder
│       └── SettingsPage.tsx      # Preferences, theme, update, export
├── prisma/
│   ├── schema.prisma             # Full database schema
│   └── migrations/               # Full migration history
├── public/
│   ├── journedge-logo-dark.svg
│   ├── journedge-logo-light.svg
│   └── icon.svg
├── scripts/
│   └── changelog.js              # Automated changelog entry generator
├── docs/
│   └── screenshots/              # Screenshot assets referenced in this README
└── backups/                      # Auto-update database backups (gitignored)
```

---

## Roadmap

**v4.0.0 — Current**
- Pre-trade planning with thesis, levels, R:R preview, and plan-to-execution linking
- Strategy playbook with setup rules, entry triggers, and live per-setup trade performance
- Playbook linking from journal editor and trade panel
- Hour-of-day performance heatmap in Analytics
- Daily risk controls — loss limit and max trade count with live dashboard meters
- Position sizing calculator — stocks, options, and futures with full R:R output
- Light mode and dark mode with no flash on load
- Keyboard shortcuts with in-app help overlay
- JSON export alongside existing CSV and PDF
- Trade deletion from the Dashboard, Journal, and trade quick-view panel (requested by [@thomasfischer089](https://github.com/thomasfischer089) in [#2](https://github.com/TheQuantum-Dev/journedge/issues/2))

**v3.2.1**
- Charles Schwab Realized Gain/Loss CSV import support (community contribution)

**v3.2.0**
- MAE/MFE tracking with execution quality analytics
- Overtrading detection, revenge trade detection, and discipline score
- Risk of ruin calculator with Kelly Criterion
- Robust auto-update pipeline with shadow install

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

Thanks to [@lollllcat](https://github.com/lollllcat) for the Charles Schwab import support in v3.2.1 — the first community-contributed feature merged into Journedge.

Thanks to [@thomasfischer089](https://github.com/thomasfischer089) for requesting per-trade deletion in [#2](https://github.com/TheQuantum-Dev/journedge/issues/2) — implemented in v4.0.0.

---

## Changelog

Full release history from v1.0.0 is documented in [CHANGELOG.md](./CHANGELOG.md).

---

## Security

See [SECURITY.md](./SECURITY.md) for the vulnerability disclosure policy.

---

## License

Journedge is open source under the [MIT License](./LICENSE).

---

<div align="center">

Built by [TheQuantum-Dev](https://github.com/TheQuantum-Dev)

*Built for traders who take their craft seriously.*

<br />

<sub>Previously released as Tradello (v1.0.0 – v2.3.0). Renamed to better reflect its purpose — turning your journal into your edge.</sub>

</div>
