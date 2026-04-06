# Changelog

All notable changes to Journedge are documented here.

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
