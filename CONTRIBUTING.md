# Contributing Guide

Thank you for your interest in contributing to CTF Write-up Builder!

## How to Contribute
- Fork the repository and create your branch from `master`.
- Follow the code style and conventions used in the project.
- Write clear, descriptive commit messages.
- Test your changes locally before submitting a pull request.
- Ensure your code does not introduce security vulnerabilities.

## Security Best Practices
- Sanitize all user input and output. Use [DOMPurify](https://github.com/cure53/DOMPurify) for any HTML rendering.
- Never commit secrets, API keys, or credentials to the repository.
- Validate and restrict file uploads and imports.
- Follow the principle of least privilege in all code and configuration.

## Reporting Security Issues
If you find a security issue, please report it privately to **writeup_builder@proton.me**. Do not open a public issue.

## Responsible Disclosure
- Give us reasonable time to address the issue before public disclosure.
- Provide clear steps to reproduce the vulnerability.

## Community Standards
- Follow our [Code of Conduct](./CODE_OF_CONDUCT.md).
- Be respectful and collaborative.

We appreciate your help in making CTF Write-up Builder better and more secure! 