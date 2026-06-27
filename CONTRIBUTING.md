# Contributing to SHIELD

Thank you for your interest in SHIELD.

## How to contribute

1. Fork the repository
2. Create a feature branch: `feature/your-feature`
3. Write clear commit messages (see MASTER_PROMPT.md)
4. Add tests for critical paths
5. Open a pull request with Summary, Reason, Changes, Testing, Risks

## Code standards

- TypeScript strict mode
- Pure rule-engine — no Express/DB in packages/rule-engine
- en + uk strings for user-facing text
- Wait for review before large architectural changes

## Security

Do not submit real API keys, passwords, or sensitive data in examples.
