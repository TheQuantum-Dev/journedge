# Changelog

All notable changes to Tradello are documented here.

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
