# Security Policy

## Supported Versions

Only the most recent minor release series receives security fixes. If you are on an older version, upgrade before reporting an issue.

| Version | Supported          |
|---------|--------------------|
| 4.0.x   | ✅ Active           |
| 3.2.x   | ✅ Security fixes only |
| 3.1.x   | ❌ End of life      |
| < 3.1.0 | ❌ End of life      |

---

## Application Security Model

Journedge is a **locally-run desktop application**. It has no hosted backend, no user authentication system, no cloud database, and no external API that receives your trade data. All data lives on your machine.

This significantly limits the attack surface compared to a typical web application. However, several components warrant attention.

### Attack Surface

| Component | Risk Level | Notes |
|-----------|-----------|-------|
| Auto-update endpoint (`/api/update`) | **High** | Executes shell commands on the host. Must never be exposed beyond localhost. |
| Screenshot upload handler (`/api/upload`) | **Medium** | Writes files to `public/uploads/`. Path traversal is the primary concern. |
| Journal editor (TipTap/ProseMirror) | **Medium** | Rich text with image and link support. XSS within the editor context is the primary concern. |
| Prisma query construction | **Low** | Parameterised queries throughout. SQL injection surface is minimal. |
| Next.js local dev server | **Low** | Bound to localhost by default. Exposure on a network interface elevates this. |
| SQLite database file | **Low** | Requires filesystem access. Protect the file at the OS level if needed. |

### The Auto-Update Endpoint

`/api/update` is the highest-risk surface in the application. It runs `git`, `npm`, and `prisma` commands directly on the host machine in response to an HTTP request. This is intentional — it is the in-app update mechanism — but it means:

- **Never expose Journedge on a network interface.** It is designed to run on `localhost` only.
- **Never run Journedge on a shared or public-facing server.** The update endpoint has no authentication.
- If you deploy Journedge in any non-localhost context (Docker with exposed ports, a reverse proxy, etc.), disable or block the `/api/update` route at the network level.

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report privately using GitHub's built-in vulnerability reporting:

**[GitHub → TheQuantum-Dev/journedge → Security → Report a vulnerability](https://github.com/TheQuantum-Dev/journedge/security/advisories/new)**

Include the following in your report:

- A clear description of the vulnerability
- Step-by-step reproduction instructions
- The potential impact and exploitability
- The version(s) affected
- Your suggested fix or mitigation if you have one

You will receive an acknowledgement within **72 hours**. If the vulnerability is confirmed, a patched release will be issued as quickly as possible — typically within **7 days for critical issues** and **30 days for high/medium severity**.

We follow responsible disclosure. We ask that you give us time to patch before making any details public.

---

## What to Report

Please report issues including but not limited to:

- Remote code execution via the update endpoint or any other route
- Path traversal in the file upload handler (`/api/upload`)
- Server-side request forgery
- SQL injection through Prisma query construction
- Cross-site scripting in the journal editor that could exfiltrate local file data or execute system commands
- Dependency vulnerabilities with a confirmed, working exploit path against Journedge specifically
- Logic vulnerabilities that allow bypassing intended access restrictions

---

## What Not to Report

The following are out of scope and will not be treated as security vulnerabilities:

- Issues that require physical access to the machine running Journedge
- Self-XSS where the attacker and victim are the same local user
- Rate limiting or brute force on localhost endpoints — there is no authentication system to bypass
- Missing security headers (CSP, HSTS, etc.) — these are irrelevant for a localhost-only application
- Dependency advisories without a confirmed exploit path against this specific application
- Theoretical vulnerabilities with no demonstrated impact

---

## Dependency Vulnerabilities

Run `npm audit` regularly to check for known vulnerabilities in installed packages.

```bash
npm audit
npm audit --audit-level=high
```

If you find a high or critical severity issue in a **direct dependency** with a known, working exploit path against Journedge, please report it via the private disclosure process above rather than opening a public issue. For transitive dependencies without a clear exploit path, opening a standard GitHub issue is acceptable.

---

## Security Best Practices for Users

Since Journedge runs locally, your security posture is largely determined by your operating system configuration. A few recommendations:

**Keep Journedge on localhost.** The default `npm run dev` binds to `localhost` only. Do not bind to `0.0.0.0` or expose the port through a reverse proxy unless you have added your own authentication layer in front of it.

**Protect your database file.** The SQLite file at `prisma/journedge.db` contains all your trade history and journal entries. Apply appropriate file system permissions. Back it up regularly — the Settings page has a CSV and JSON export for this purpose.

**Review uploads.** Screenshots are stored in `public/uploads/`. This directory is served statically by Next.js. Do not upload files you would not want accessible to any process with HTTP access to the server.

**Update regularly.** New releases patch bugs and address any identified security issues. Use the in-app auto-update or pull the latest release from GitHub.

---

## Changelog

Security-related fixes are noted in [CHANGELOG.md](./CHANGELOG.md) with appropriate context. Critical fixes are highlighted in the release notes.

---

Built by [TheQuantum-Dev](https://github.com/TheQuantum-Dev)
