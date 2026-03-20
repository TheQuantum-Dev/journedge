# Tradello

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/tradello-logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="public/tradello-logo-light.svg">
  <img alt="Tradello" src="public/tradello-logo-light.svg" width="240" />
</picture>

<br /><br />

![Version](https://img.shields.io/badge/version-2.3.0-00e57a?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)
![Open Source](https://img.shields.io/badge/open--source-yes-00e57a?style=flat-square)

**An institutional-grade trading journal built for serious traders.**

[Features](#features) · [Screenshots](#screenshots) · [Getting Started](#getting-started) · [Roadmap](#roadmap) · [Contributing](#contributing)

</div>

---

## Why Tradello

Most trading journals are either too simple to be useful or locked behind expensive subscriptions. Tradello is built differently.

- **Your data stays yours.** Everything runs locally on your machine using SQLite. No cloud, no accounts, no tracking.
- **Built for serious traders.** Multi-account support, real equity curve tracking, institutional analytics, tag-based behavioral analysis, and a structured daily journal — not just a trade log.
- **Open source.** The entire codebase is available, auditable, and open to contribution.

---

## Screenshots

### Dashboard
Real-time stat cards, full trade history table with multi-filter support, and account-scoped P&L tracking.

![Dashboard](docs/screenshots/dashboard.png)

---

### Analytics — Overview
Equity curve from actual account balance, P&L by symbol, P&L by tag — at a glance view of what's working.

![Analytics Overview](docs/screenshots/analytics-overview.png)

---

### Analytics — Risk Metrics
Sharpe, Sortino, and Calmar ratios. Drawdown curve over time. Rolling 20-trade win rate to surface consistency trends.

![Analytics Risk Metrics](docs/screenshots/analytics-risk.png)

---

### Analytics — Time Analysis
P&L by day of week, daily distribution bars, and win rate by tag — detect session-specific patterns and setup quality.

![Analytics Time Analysis](docs/screenshots/analytics-time.png)

---

### Journal
Day-grouped trade review with inline journal notes, tags, R:R, entry/exit times, and per-day stats.

![Journal](docs/screenshots/journal.png)

---

### Export
Report builder with date range, ticker, and tag filters. Live PDF preview. Full institutional-grade report generated client-side — data never leaves your machine.

![Export](docs/screenshots/export.png)

---

## Features

**Trade Management**
- Import trades from Fidelity CSV exports or re-import a Tradello export — format auto-detected
- Manual trade entry with live P&L preview and auto symbol detection
- Multi-account support — track multiple brokers separately with account-scoped data
- Full trade journal with notes, tags, screenshots, entry/exit times, and R:R ratio

**Dashboard**
- Real-time filtering by symbol, status, tag, and date range
- Stat cards update dynamically based on active filters
- Full trade history table with click-to-review trade panel

**Analytics**
- Equity curve starting from actual account balance
- Sharpe ratio, Sortino ratio, Calmar ratio
- Max drawdown, drawdown duration, drawdown over time chart
- Rolling 20-trade win rate
- Win rate, profit factor, expectancy, average win/loss
- P&L breakdown by symbol and by tag
- P&L by day of week with win rate per session
- Daily P&L distribution — reveals consistency vs spike dependency
- Win rate by tag — surfaces which setups convert

**Journal**
- Daily grouped trade review
- Search and filter by symbol, tag, win/loss status, or notes
- Per-day P&L, win/loss count, best day, worst day, notes coverage

**Calendar**
- Monthly P&L calendar view
- Click any day to see all trades with full detail

**Export**
- Report builder with filter-based export (date range, ticker, status, tags)
- Choose sections — cover page, performance summary, daily breakdown, trade history, journal entries
- Live preview before export
- Full PDF generated client-side via `@react-pdf/renderer` — your data never leaves your machine

**Settings**
- Accent color themes — green, blue, purple, orange, pink
- Trading preferences — default multiplier, commission, fees
- Version checker with live update detection
- Data management — export CSV, clear trades

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Database | SQLite via Prisma 5 |
| Charts | Recharts |
| PDF | @react-pdf/renderer |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/TheQuantum-Dev/tradello.git
cd tradello
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First Steps

1. Go to **Accounts** and create your first trading account with your starting balance
2. Go to **Import Trades** and upload your broker CSV — or use **Add Trade** to enter manually
3. Your trades will appear across Dashboard, Journal, Analytics, Calendar, and Export

---

## Importing Trades

Tradello auto-detects the CSV format on drop — no configuration required.

| Broker / Format | Status |
|----------------|--------|
| Fidelity | ✅ Supported |
| Tradello Export | ✅ Supported (re-import your own exports) |
| TD Ameritrade | 🔜 Coming soon |
| Tastytrade | 🔜 Coming soon |
| Interactive Brokers | 🔜 Coming soon |

### How to export from Fidelity

1. Log into Fidelity and go to **Activity & Orders**
2. Select your date range
3. Click **Download** and choose CSV
4. Drop the file onto the Import Trades page

---

## Project Structure

```
tradello/
├── app/
│   ├── api/              # API routes (trades, accounts, uploads)
│   ├── components/       # Shared UI components
│   ├── context/          # Global state (AppContext)
│   ├── hooks/            # Custom hooks (useSettings)
│   ├── lib/              # Types, Prisma client, CSV parsers, utilities
│   └── pages/            # Page-level components
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Migration history
├── public/               # Static assets — logos, icons
├── docs/
│   └── screenshots/      # README screenshots
├── scripts/
│   └── changelog.js      # Automated changelog generator
└── public/
    └── uploads/          # Local screenshot storage (gitignored)
```

---

## Roadmap

**v3.0.0 — Upcoming**
- Complete Journal redesign

**Future**
- GitHub Wiki with setup guides and metric explanations
- Risk of ruin calculator
- Overtrading and revenge trade detection signals

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full release history.

---

## License

Tradello is open source under the [MIT License](./LICENSE).

---

<div align="center">

Built by [TheQuantum-Dev](https://github.com/TheQuantum-Dev)

*Built for traders who take their craft seriously.*

</div>