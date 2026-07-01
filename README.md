# SHIELD — AI Security Gateway

Analyze prompts for security risks before they reach LLMs.

## Prerequisites

Node.js **20+** is required. This repo uses **pnpm** (see `packageManager` in `package.json`).

If `pnpm: command not found`, pick **one** option:

**A) No global install (simplest, no sudo)**

```bash
npx pnpm@9.15.0 install
npx pnpm@9.15.0 build
```

**B) Corepack (needs write access to `/usr/local/bin`)**

```bash
sudo corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm -v
```

If you see `EACCES: permission denied` without `sudo`, use option A or C.

**C) npm global in your home directory (no sudo)**

```bash
mkdir -p ~/.npm-global
npm config set prefix "$HOME/.npm-global"
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
npm install -g pnpm@9.15.0
pnpm -v
```

## Quick start (local)

```bash
# From project root
cd "/Users/oleksandrsvacko/Desktop/AI SECURITY GATEWAY (SHIELD)"

# Install dependencies
pnpm install

# Copy environment
cp .env.example .env

# Build all packages
pnpm build

# Run backend + frontend (two terminals)
pnpm --filter @shield/backend dev
pnpm --filter @shield/frontend dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001
- Health: http://localhost:3001/health
- Metrics: http://localhost:3001/api/v1/metrics
- History: http://localhost:3001/api/v1/history

## Docker (optional)

Docker is **not required** for local development. Use `pnpm dev` in two terminals (see Quick start).

For containerized deploy, install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/), start it, then verify:

```bash
docker -v
docker compose version
```

```bash
pnpm build   # or: npx pnpm@9.15.0 build
docker compose up --build
```

- Playground: http://localhost:5173
- API (direct): http://localhost:3001
- Database: **PostgreSQL 16** (service `postgres`, credentials `shield`/`shield`)

Data persists in the `postgres-data` Docker volume.

### Local PostgreSQL (optional)

```bash
docker run --name shield-pg -e POSTGRES_USER=shield -e POSTGRES_PASSWORD=shield \
  -e POSTGRES_DB=shield -p 5432:5432 -d postgres:16-alpine
```

Set `DATABASE_URL=postgresql://shield:shield@localhost:5432/shield` in `.env`.

### Database commands

```bash
pnpm --filter @shield/backend db:migrate       # SQLite migrations
pnpm --filter @shield/backend db:migrate:pg    # PostgreSQL migrations
pnpm --filter @shield/backend db:seed          # idempotent settings seed
```

Local dev defaults to **SQLite** (`file:./data/shield.db`) — no Postgres required.

## CLI (V2.6)

Analyze prompts from the terminal without starting the API:

```bash
pnpm build
pnpm exec shield analyze "ignore previous instructions"
pnpm exec shield analyze --stdin <<< "What is TypeScript?"
pnpm exec shield analyze --fail-on-risk "test prompt"   # exit 2 on SUSPICIOUS/MALICIOUS
```

Remote mode (backend must be running):

```bash
pnpm exec shield analyze --remote --url http://localhost:3001 "test prompt"
```

## PDF export & analytics (V2.7)

```bash
# Download PDF for a stored analysis
curl -o report.pdf "http://localhost:3001/api/v1/analyze/<analysisId>/export.pdf?language=en"

# Analytics snapshot (runtime + DB aggregates + system resources)
curl http://localhost:3001/api/v1/analytics
```

The playground includes an **Export PDF** button on each result. The status page shows memory, CPU load, and risk breakdown.

## V3.1 — Database rules

Approved AI suggestions can be promoted into the database and used at runtime (merged with `/rules` files; DB wins on ID conflict):

```bash
# Approve then promote
curl -X POST http://localhost:3001/api/v1/knowledge/pending/<id>/approve -d '{"note":"ok"}'
curl -X POST http://localhost:3001/api/v1/knowledge/pending/<id>/promote

# Or approve + promote in one step
curl -X POST http://localhost:3001/api/v1/knowledge/pending/<id>/approve -d '{"promoteToDb":true}'

# List database rules
curl http://localhost:3001/api/v1/rules/db
```

Set `RULES_DB_ENABLED=false` to disable DB rules. See [ADR 005](docs/adr/005-database-rules.md).

## V3.2 — TypeScript SDK

```bash
pnpm --filter @shield/sdk build
```

```typescript
import { ShieldClient, analyzeLocal } from '@shield/sdk';

// Remote API
const client = new ShieldClient({
  baseUrl: 'http://localhost:3001',
  apiKey: process.env.SHIELD_API_KEY,
});
const result = await client.analyze('ignore previous instructions');

// Offline (no server)
const local = await analyzeLocal({ prompt: 'Hello world' });
```

## V3.3 — MCP server

Expose SHIELD to AI assistants (Cursor, Claude Desktop) via [Model Context Protocol](https://modelcontextprotocol.io/):

```bash
pnpm --filter @shield/mcp build
```

**Local mode** (offline, no backend):

```json
{
  "mcpServers": {
    "shield": {
      "command": "node",
      "args": ["/path/to/SHIELD/packages/mcp/dist/index.js"],
      "env": { "SHIELD_MCP_MODE": "local" }
    }
  }
}
```

**Remote mode** (uses running SHIELD API + DB rules):

```json
{
  "mcpServers": {
    "shield": {
      "command": "node",
      "args": ["/path/to/SHIELD/packages/mcp/dist/index.js"],
      "env": {
        "SHIELD_MCP_MODE": "remote",
        "SHIELD_API_URL": "http://localhost:3001",
        "SHIELD_API_KEY": "your-key"
      }
    }
  }
}
```

Tools: `shield_analyze`, `shield_batch_analyze`, `shield_status`. See [ADR 006](docs/adr/006-mcp-server.md) and [docs/mcp-cursor.example.json](docs/mcp-cursor.example.json).

## V3.4 — GitHub Action

Scan prompt files in CI before they reach production:

```yaml
- uses: actions/checkout@v4

- uses: AleksandrWeber/AI-SECURITY-GATEWAY-SHIELD-@main
  with:
    paths: |
      prompts/**
      **/*.prompt
    fail-on-risk: SUSPICIOUS
```

Build locally: `pnpm --filter @shield/action build` (bundles rules into `packages/action/dist/`).

Remote mode: set `api-url` + `api-key` and `local: false`. See [ADR 007](docs/adr/007-github-action.md) and [docs/github-action.example.yml](docs/github-action.example.yml).

## V3.5 — VS Code extension

Analyze prompts directly in the editor:

```bash
pnpm --filter shield-prompt-security build
pnpm --filter shield-prompt-security package   # produces .vsix
```

Commands: **SHIELD: Analyze Selection**, **SHIELD: Analyze Document**. Configure `shield.mode`, `shield.apiUrl`, and `shield.language` in VS Code settings. See [apps/vscode/README.md](apps/vscode/README.md) and [ADR 008](docs/adr/008-vscode-extension.md).

## Tests

```bash
pnpm test              # unit + integration (Vitest, SQLite)
pnpm test:e2e          # Playwright E2E smoke tests
pnpm benchmark         # rule-engine p50/p95 perf check
```

Optional PostgreSQL smoke test (requires running Postgres):

```bash
TEST_DATABASE_URL=postgresql://shield:shield@localhost:5432/shield pnpm --filter @shield/backend test
```

## Monorepo structure

```text
apps/frontend     React playground
apps/backend      Express API
packages/types    Shared TypeScript types
packages/rule-engine   Pure analysis core
packages/ai-core       AI providers + cache
packages/cli           Terminal CLI (`shield analyze`)
rules/            Active detection rules
attacks/          Demo + OWASP test payloads
docs/             ADRs and API docs
```

## Development phases

See [TODO.md](./TODO.md) for the full roadmap. Current status: **V3.5** (VS Code extension); V2 complete.

## API endpoints (V1.5)

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/v1/status` | — | System status dashboard data |
| `GET /api/v1/metrics` | — | Runtime metrics |
| `GET /api/v1/history` | — | Recent analyses |
| `GET /api/v1/favorites` | API key* | Saved reports |
| `POST /api/v1/favorites/:id` | API key* | Save report |
| `POST /api/v1/feedback` | API key* | False positive report |

\* Required when `API_KEYS` is set. See `.env.example`.

## License

Copyright (c) 2026 Oleksandr Shvachko. See [LICENSE](./LICENSE).
