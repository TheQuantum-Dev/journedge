# Contributing to Journedge

Thanks for your interest in contributing. Journedge is built to be a serious tool for serious traders — contributions that add real value to that mission are welcome.

---

## Before You Start

- Check the [open issues](https://github.com/TheQuantum-Dev/journedge/issues) to avoid duplicate work
- For large features, open an issue first to discuss the approach
- Keep pull requests focused — one feature or fix per PR

---

## Development Setup

```bash
git clone https://github.com/TheQuantum-Dev/journedge.git
cd journedge
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

---

## Project Conventions

**File structure**
- Page-level components live in `app/pages/`
- Shared UI components live in `app/components/`
- All shared TypeScript types live in `app/lib/types.ts` — do not duplicate type definitions
- Global state is managed in `app/context/AppContext.tsx` via React Context

**Types**
- Always import `Trade` and `Account` from `app/lib/types.ts`
- Do not redefine types locally in components

**Styling**
- Journedge uses inline styles with CSS variables for theming
- CSS variables are defined in `app/globals.css`
- Do not introduce external CSS frameworks or Tailwind

**API routes**
- All routes live in `app/api/`
- All routes must handle errors and return consistent JSON responses
- Use Prisma for all database access — no raw SQL

---

## Adding Broker Support

The most impactful contribution you can make is adding CSV import support for a new broker.

1. Create a new parser file at `app/lib/parse{BrokerName}CSV.ts`
2. The parser must return `Trade[]` using the shared `Trade` type from `app/lib/types.ts`
3. Add the new parser to the import flow in `app/pages/ImportPage.tsx`
4. Test with a real CSV export from that broker
5. Document the export steps in your PR description

---

## Submitting a Pull Request

1. Fork the repository
2. Create a branch: `git checkout -b feat/your-feature-name`
3. Make your changes
4. Test locally — make sure `npm run dev` runs without errors
5. Commit with a clear message: `git commit -m "feat: add tastytrade CSV parser"`
6. Push and open a PR against `main`

**Commit message format:**
```
feat: add new feature
fix: fix a bug
refactor: code change with no behavior change
docs: documentation only
chore: tooling, deps, config
```

---

## What We're Looking For

High-value contributions include:

- New broker CSV parsers
- Additional analytics metrics (Sharpe, Sortino, MAE/MFE)
- Manual trade entry improvements
- Dashboard filtering
- Performance improvements
- Bug fixes with clear reproduction steps

Please avoid:

- Cosmetic-only changes
- Adding dependencies without discussion
- Changes that break the existing data model without migration support

---

## Questions

Open a GitHub Discussion or file an issue. PRs without context are harder to review.