# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: [INSERT SECURITY EMAIL]

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information in your report:

- Type of vulnerability (e.g., XSS, SQL injection, authentication bypass)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

This information will help us triage your report more quickly.

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find any similar problems
3. Prepare fixes for all supported releases
4. Release patches as soon as possible

## Security Update Process

1. Security patches are released as soon as possible
2. A security advisory will be published on GitHub
3. Users will be notified via:
   - GitHub security advisories
   - Email notifications (if registered)
   - Project changelog

## Security Best Practices

When contributing to this project:

- **Never commit secrets** (API keys, passwords, tokens) to the repository
- Use environment variables for sensitive configuration
- Follow secure coding guidelines:
  - Validate all user inputs
  - Use parameterized queries to prevent SQL injection
  - Implement proper authentication and authorization
  - Use HTTPS for all communications
  - Keep dependencies up to date
- Review the OWASP Top 10 vulnerabilities
- Run security linters and scanners before submitting PRs

## Known Security Measures

This project implements:

- JWT-based authentication with refresh tokens
- Password hashing using bcrypt
- Field-level encryption for sensitive data (PII)
- Row-level security (RLS) for multi-tenancy
- CORS configuration
- Input validation using Zod schemas
- SQL injection prevention via Prisma ORM
- XSS prevention via React's built-in escaping
- Rate limiting on API endpoints
- Secure HTTP headers

## Dependencies

We use Dependabot to keep dependencies up to date and receive alerts for known vulnerabilities in our dependency tree.

## Contact

For security-related questions or concerns, contact: [INSERT SECURITY EMAIL]
