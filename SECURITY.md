# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x.x   | :white_check_mark:       |
| 1.x.x   | :x:        |

Only the latest release receives security updates. If you are on an older version, please upgrade before reporting.

## Reporting a Vulnerability

If you discover a security vulnerability in Tradello, please do not open a public GitHub issue. Public disclosure before a fix is available puts other users at risk.

Instead, report it privately by emailing:

**thequantumdev@gmail.com**

Please include:
- A description of the vulnerability
- Steps to reproduce the issue
- The potential impact
- Your suggested fix if you have one

You can expect an acknowledgement within 48 hours and a resolution or update within 7 days depending on severity.

## Scope

Tradello is a locally-run desktop application. It does not have a hosted backend, user accounts, or a public API. The primary security concerns are:

- Local database access and data integrity
- CSV parsing vulnerabilities
- API route security if the app is exposed on a network
- Dependency vulnerabilities

## Out of Scope

- Issues in third-party dependencies should be reported directly to those projects
- Vulnerabilities that require physical access to the user's machine
- Social engineering attacks

## Disclosure Policy

Once a fix is released, the vulnerability will be disclosed in the relevant GitHub release notes. Credit will be given to the reporter unless they prefer to remain anonymous.
