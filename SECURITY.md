# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 3.2.x   | :white_check_mark: |
| 3.1.x   | :white_check_mark: |
| < 3.1.0   | :x:  |

Only the most recent minor releases receive security fixes. If you are on an older version, upgrade before reporting.

---

## Scope

Journedge runs entirely locally on your machine. There is no hosted backend, no authentication system, no cloud database, and no external API that handles your trade data. The attack surface is limited to:

- The Next.js local dev server running on localhost
- The SQLite database file at `prisma/journedge.db`
- File uploads written to `public/uploads/`
- The auto-update endpoint which executes shell commands via the `/api/update` route

The auto-update route is the highest-risk surface — it runs `git`, `npm`, and `prisma` commands on the host machine. It should never be exposed to a network beyond localhost.

---

## Reporting a Vulnerability

If you find a security issue, do not open a public GitHub issue.

Report it privately by emailing the maintainer directly via GitHub's private vulnerability reporting:

**GitHub → TheQuantum-Dev/journedge → Security → Report a vulnerability**

Include:

- A description of the vulnerability
- Steps to reproduce it
- The potential impact
- Your suggested fix if you have one

You will receive a response within 72 hours. If the vulnerability is confirmed, a patched release will be issued as soon as possible, typically within 7 days for critical issues.

---

## What to Report

Report issues including but not limited to:

- Remote code execution via the update endpoint
- Path traversal in the file upload handler
- SQL injection via Prisma query construction
- Cross-site scripting in the journal editor that could exfiltrate local data
- Dependency vulnerabilities with a confirmed exploit path

---

## What Not to Report

- Issues that require physical access to the machine running Journedge
- Issues in dependencies without a confirmed exploit path against Journedge specifically
- Rate limiting or brute force on localhost endpoints — there is no authentication system
- Self-XSS where the attacker and victim are the same person

---

## Dependency Vulnerabilities

Run `npm audit` to check for known vulnerabilities in installed packages. If you find a high or critical severity issue in a direct dependency that has a known exploit path, report it via the process above rather than opening a public issue.

---

Built by [TheQuantum-Dev](https://github.com/TheQuantum-Dev)
