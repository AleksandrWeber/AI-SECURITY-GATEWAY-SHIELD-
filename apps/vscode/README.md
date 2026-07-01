# SHIELD VS Code Extension

Analyze editor text for prompt injection and LLM security risks.

## Development

```bash
pnpm install
pnpm --filter shield-prompt-security build
pnpm --filter shield-prompt-security test
```

Open this folder in VS Code, run **Run Extension** from `apps/vscode` (F5) with a launch config pointing at the monorepo root.

## Commands

| Command | Description |
|---------|-------------|
| `SHIELD: Analyze Selection` | Scan highlighted text |
| `SHIELD: Analyze Document` | Scan the open file |

## Settings (`shield.*`)

| Setting | Default | Description |
|---------|---------|-------------|
| `shield.mode` | `local` | `local` offline rules or `remote` API |
| `shield.apiUrl` | `http://localhost:3001` | Remote API base URL |
| `shield.apiKey` | — | API key for remote mode |
| `shield.language` | `en` | Report language (`en` / `uk`) |
| `shield.analysisMode` | `quick` | `quick` or `detailed` |
| `shield.warnOnRisk` | `SUSPICIOUS` | Notification threshold |

## Package

```bash
pnpm --filter shield-prompt-security package
```

Produces `shield-prompt-security-0.1.0.vsix` for manual install.
