# Changelog

All notable changes to Journedge are documented here.

## [4.0.0](https://github.com/TheQuantum-Dev/journedge/compare/v3.2.1...v4.0.0) — 2026-07-19

> 15 commits · 2 contributors

### ✨ New Features

- delete trade from dashboard, journal, and trade panel [`c4e6d94`](https://github.com/TheQuantum-Dev/journedge/commit/c4e6d94)
- playbook linking from journal editor and trade panel [`c3b102d`](https://github.com/TheQuantum-Dev/journedge/commit/c3b102d)
- light mode, keyboard shortcuts, JSON export [`9735975`](https://github.com/TheQuantum-Dev/journedge/commit/9735975)
- improve sizer - increase risk to 100% [`8dcbfbd`](https://github.com/TheQuantum-Dev/journedge/commit/8dcbfbd)
- position sizing calculator — risk-based sizing for stocks, options, futures [`8634dcd`](https://github.com/TheQuantum-Dev/journedge/commit/8634dcd)
- daily risk controls — loss limit, max trades, dashboard indicators [`1672672`](https://github.com/TheQuantum-Dev/journedge/commit/1672672)
- analytics — hour-of-day heatmap, Recharts formatter type fix [`b3b2f59`](https://github.com/TheQuantum-Dev/journedge/commit/b3b2f59)
- playbook — setup library with per-entry trade stats, detail panel, rules editor [`2f60fde`](https://github.com/TheQuantum-Dev/journedge/commit/2f60fde)
- pre-trade planning — plans API, playbook API, PlansPage, PlaybookPage, sidebar nav, hourOfDay extraction [`04feb28`](https://github.com/TheQuantum-Dev/journedge/commit/04feb28)
- schema — TradePlan, Playbook tables, Trade additions (hourOfDay, playbookId, planId) and version change [`1c2e8d0`](https://github.com/TheQuantum-Dev/journedge/commit/1c2e8d0)

### 📚 Documentation

- update settings and import screenshots for v4.0.0 [`c86d878`](https://github.com/TheQuantum-Dev/journedge/commit/c86d878)
- Improved changelog generator, security policy, CSS type declaration, bug fixes and font fixes [`c9b02e1`](https://github.com/TheQuantum-Dev/journedge/commit/c9b02e1)
- v4.0.0 README — trade deletion, Schwab import, screenshots, file structure [`4b28619`](https://github.com/TheQuantum-Dev/journedge/commit/4b28619)

### 🔧 Maintenance

- **deps**: bump linkify-it from 5.0.0 to 5.0.2 [`154c1db`](https://github.com/TheQuantum-Dev/journedge/commit/154c1db)
- fixed wallet color sync with settings [`172ea9b`](https://github.com/TheQuantum-Dev/journedge/commit/172ea9b)

### 👥 Contributors

- The Quantum Dev
- lollllcat
- dependabot[bot]

## [3.2.1] - 2026-07-14

### Bug Fixes

- wire Schwab parser into import detection and add Charles Schwab card (`c703662`)

### Maintenance

- revert changes to AnalyticsPage (`ae77de9`)
- **deps**: bump next from 16.1.6 to 16.2.6 (`b10dde2`)
- update readme and security files for v3.2.0 (`0134954`)

### Other Changes

- rename: parseSchwabRealizedGainLossCSV.ts → parseSchwabCSV.ts and clean up parser logic (`3b1d07c`)
- Add Schwab realized gain/loss import (`b46902f`)

## [3.2.0] - 2026-04-09

### New Features

- v3.2.0 — MAE/MFE tracking, execution analytics, behavior analysis, risk of ruin, UI theme fixes (`1b046a0`)

## [3.1.1] - 2026-04-06

### New Features

- robust update pipeline — shadow install, env detection, semver comparison, backup verification (`3cc1b35`)

### Maintenance

- changed love back to ❤️ (`575fe08`)

## [3.1.0] - 2026-04-03

### New Features

- v3.1.0 — journal editor, tag system, templates (`181223a`)

### Bug Fixes

- correct filename missed in previous release (`c8f8acb`)

## [3.0.0] - 2026-03-30

### Maintenance

- updated readme and gitignore files (`1b199b7`)

### Other Changes

- rebrand: Tradello → Journedge, v3.0.0 (`c25e192`)

## [2.3.0] - 2026-03-21

### New Features

- added support for TD Ameritrade, Tastytrade and IBKR (`609b4ea`)

### Bug Fixes

- SSE double-close bug, add db backup step, bump to v2.3.0 (`1bd7b78`)
- track .env.example so install instructions work (`d371850`)

## [2.2.1] - 2026-03-16

### Improvements

- v2.2.1 — remove deprecated components, fix TradePanel import, update README badge (`7597bf6`)

## [2.2.0] - 2026-03-13

### New Features

- v2.2.0 — in-app auto-update system with SSE progress and restart (`e97a23b`)
- improved CalendarPage (`77845d2`)

### Maintenance

- release v2.1.0 (`174a606`)

## [2.1.0] - 2026-03-09

### New Features

- v2.1.0 — Tradello CSV import, auto-format detection, import page redesign (`1bbcbea`)
- Advanced Analytics Page (`359e922`)

### Maintenance

- release v2.0.0 (`7e761e1`)

### Other Changes

- Update supported versions in SECURITY.md (`a610742`)

## [2.0.0] - 2026-03-07

### New Features

- Advanced Analytics Page (`acc5471`)
- export page, journal redesign, PDF logo + journal entries, README dark mode (`1c98068`)

## [1.3.0] - 2026-03-06

### New Features

- PDF export with performance summary, trade history and daily breakdown (`5dc082c`)

### Documentation

- added security policy (`700d638`)

### Other Changes

- Update issue templates (`43d19c5`)
- Add Contributor Covenant Code of Conduct (`d228db0`)

## [1.2.0] - 2026-03-02

### New Features

- settings page with accent colors, trading preferences, export, and version checker (`d676ef4`)

### Bug Fixes

- accent color persists on refresh, improved version checker animation (`11824eb`)

## [1.1.0] - 2026-02-28

### New Features

- dashboard filtering by symbol, status, tag, date range and search (`959c69b`)
- manual trade entry modal with live P&L preview and auto symbol detection (`70866c9`)

### Maintenance

- Added .env sample (`be11ffa`)
- Updated ReadMe (`f39b78c`)
- update gitignore for uploads folder (`48e5aa1`)

## [1.0.0] - 2026-02-28

### New Features

- journal page with daily groups, filters, search and trade cards (`47b9d4e`)
- multi-account system with sidebar switcher and account-scoped trades (`e6e8419`)
- accounts API and database schema with multi-account support (`9c2c7b4`)
- analytics page with equity curve, charts and stats (`b48c1e4`)
- P&L calendar with day detail panel and trade preview (`683f900`)
- image uploads in trade journal panel (`c7be6ac`)
- trade journal panel with tags, R:R, times and chart link (`f3c8a93`)
- SQLite database with Prisma - trades now persist locally (`e1090e5`)
- Fidelity CSV parser and trade history dashboard (`621d1a1`)
- dashboard shell with dark theme and sidebar (`562e9bf`)

### Improvements

- clean architecture with Context, separated pages and shared types (`e0301e7`)

### Maintenance

- ignore uploads folder and add gitkeep (`bc1deff`)

### Other Changes

- Initial commit (`15c4cf1`)
- Initial commit from Create Next App (`ec037ac`)
