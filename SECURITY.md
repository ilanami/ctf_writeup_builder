# Security Policy

## Supported Versions
We support the latest major and minor versions of CTF Write-up Builder. Please ensure you are using the most recent release for the best security and features.

| Version | Supported          |
| ------- | ----------------- |
| Latest  | :white_check_mark:|
| Older   | :x:               |

## Reporting a Vulnerability
If you discover a security vulnerability, please report it responsibly by emailing: **writeup_builder@proton.me**

- Do **not** create public GitHub issues for security problems.
- We aim to respond within 48 hours and resolve critical issues as soon as possible.

## Security Best Practices
- All user input is sanitized using [DOMPurify](https://github.com/cure53/DOMPurify) to prevent XSS.
- The app is 100% client-side; no sensitive data is sent to external servers (except for AI API requests, which go directly to the provider).
- API keys are stored locally in Base64 (not secure encryption, but never sent to our servers).
- We recommend using unique API keys and never sharing them.
- Always keep your browser and OS updated.

## Responsible Disclosure Policy
We encourage responsible disclosure of security issues. Please:
- Report vulnerabilities privately to the email above.
- Allow us reasonable time to investigate and fix before public disclosure.
- Provide clear steps to reproduce the issue.

## Security Context
- The app has been security-audited and maintains an A/A+ rating on securityheaders.com.
- No XSS vulnerabilities are present; all Markdown and HTML rendering is sanitized.
- No hardcoded secrets or credentials in the codebase.
- CORS and security headers are enforced in production.

Thank you for helping keep CTF Write-up Builder secure for the global CTF community! 