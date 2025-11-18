# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in ModalEdit Line Indicator, please report it privately.

### How to Report

1. **Do not** open a public issue
2. Use GitHub's private security advisory feature or email the maintainer
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- Acknowledgment within 48 hours
- Regular updates on progress
- Credit in release notes (if desired)

### Disclosure Policy

- Security issues will be patched as soon as possible
- A new version will be released with the fix
- Public disclosure after patch is available

## Security Best Practices

This extension:
- Does not collect or transmit user data
- Does not execute arbitrary code
- Only accesses VS Code APIs for visual decorations
- Does not make network requests

## Scope

Security issues in scope:
- Code injection vulnerabilities
- Unauthorized data access
- Malicious code execution

Out of scope:
- Issues in VS Code itself
- Issues in dependencies (report to respective projects)
- UI/UX issues without security impact
