# Git commit workflow for SHIELD

After each completed roadmap phase (TODO.md / MASTER_PROMPT.md):

1. Run verification: `pnpm build && pnpm test`
2. Stage only files for that phase
3. Commit with a clear message: what was added and why
4. Push: `git push origin main`

Example messages:
- `Add batch analyze API (V2.2)`
- `Add V2 detection categories and seed rules (V2.3)`

Never commit: `.env`, `*.db`, `node_modules`, secrets.

Remote: https://github.com/AleksandrWeber/AI-SECURITY-GATEWAY-SHIELD-.git
