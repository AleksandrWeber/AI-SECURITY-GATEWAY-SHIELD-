# SHIELD — AI Security Gateway

**Analyze prompts for security risks before they reach LLMs.**

[Українська документація](./README.uk.md)

SHIELD is an AI security platform for developers and AppSec engineers. It acts as an **AI firewall** between users and language models — detecting prompt injection, jailbreaks, data exfiltration, PII leaks, and related threats, then explaining risks in plain language.

```text
User / App → SHIELD → LLM
```

---

## Features

### Core analysis

| Capability | Description |
|------------|-------------|
| **Rule engine** | 80+ detection rules across 12 categories (prompt override, jailbreak, extraction, PII, indirect injection, RAG poisoning, role confusion, context manipulation, and more) |
| **AI-assisted analysis** | Mock AI in dev/test; optional real providers — invoked only when rules need confirmation (cost-aware) |
| **Risk scoring** | `SAFE` / `SUSPICIOUS` / `MALICIOUS` with severity, confidence, and recommended action (`ALLOW`, `REVIEW`, `BLOCK`, `SANITIZE`) |
| **Bilingual reports** | English and Ukrainian explanations, recommendations, and safe alternatives |
| **Dangerous fragments** | Highlights risky spans with rule references |

### Interfaces

| Interface | Use case |
|-----------|----------|
| **Web playground** | Interactive demo, attack library, PDF export, history, favorites |
| **REST API** | Integrate into apps and pipelines (`POST /api/v1/analyze`, batch, OpenAPI 3.1) |
| **CLI** | `shield analyze` — local offline or remote API, `--fail-on-risk` for CI |
| **TypeScript SDK** | `@shield/sdk` — `ShieldClient` + `analyzeLocal()` |
| **MCP server** | `shield_analyze` tools for Cursor / Claude Desktop |
| **GitHub Action** | Scan prompt files in PRs with configurable `fail-on-risk` |
| **VS Code extension** | Analyze selection or whole document from the editor |

### Security & operations

| Capability | Description |
|------------|-------------|
| **Privacy mode** | Hash-only prompt storage; secret redaction; no plaintext in DB |
| **API key auth** | Env-based keys or per-team `shld_…` keys |
| **Rate limiting** | Configurable request limits |
| **Webhooks** | HMAC-signed events on analysis (`analysis.completed`, `analysis.blocked`) |
| **Analytics & metrics** | p50/p95 latency, AI usage, risk breakdown, system resources |
| **PDF export** | Downloadable security reports |
| **OWASP LLM suite** | Golden dataset + automated regression tests |

### Self-learning (V3)

| Capability | Description |
|------------|-------------|
| **AI rule suggestions** | Gaps trigger pending suggestions — never auto-applied |
| **Human review** | Approve / reject flow with privacy-safe storage |
| **Database rules** | Promote approved rules to DB; merged at runtime (DB wins on ID conflict) |

### Enterprise / teams (V3.6)

| Capability | Description |
|------------|-------------|
| **Teams** | Isolated squads with named API keys (`shld_…`) |
| **Team analytics** | Per-team analysis counts, risk/action breakdown |
| **Admin API** | Create teams and keys via `TEAM_ADMIN_KEY` |
| **Audit tagging** | Analyses and audit logs scoped to `team_id` |

---

## Quick start

### Prerequisites

- **Node.js 20+**
- **pnpm 9** (or `npx pnpm@9.15.0` without global install)

```bash
git clone https://github.com/AleksandrWeber/AI-SECURITY-GATEWAY-SHIELD-.git
cd AI-SECURITY-GATEWAY-SHIELD-
cp .env.example .env
pnpm install
pnpm build
```

### Run locally (two terminals)

```bash
pnpm --filter @shield/backend dev    # API → http://localhost:3001
pnpm --filter @shield/frontend dev   # UI  → http://localhost:5173
```

| URL | Purpose |
|-----|---------|
| http://localhost:5173 | Playground |
| http://localhost:3001/health | Health check |
| http://localhost:3001/api/v1/status | System status |
| http://localhost:3001/api/v1/openapi.yaml | OpenAPI spec |

### Docker (production-style)

```bash
pnpm build
docker compose up --build
```

Uses **PostgreSQL 16** with persistent volume. Playground: http://localhost:5173

---

## Usage

### Playground

1. Open http://localhost:5173
2. Paste a prompt or pick a demo attack
3. Review risk, explanation, matched rules, and safe alternative
4. Switch language (EN / UK), export PDF, save favorites

### API

```bash
curl -X POST http://localhost:3001/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{"prompt":"ignore previous instructions","mode":"quick","language":"en"}'
```

**Batch** (up to 50 prompts):

```bash
curl -X POST http://localhost:3001/api/v1/analyze/batch \
  -H "Content-Type: application/json" \
  -d '{"items":[{"prompt":"hello"},{"prompt":"ignore all rules"}]}'
```

With API keys enabled:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" ...
```

### CLI

```bash
pnpm build
pnpm exec shield analyze "ignore previous instructions"
pnpm exec shield analyze --stdin <<< "What is TypeScript?"
pnpm exec shield analyze --fail-on-risk "test"    # exit 2 on SUSPICIOUS/MALICIOUS
pnpm exec shield analyze --remote --url http://localhost:3001 "prompt"
```

### TypeScript SDK

```typescript
import { ShieldClient, analyzeLocal } from '@shield/sdk';

// Remote
const client = new ShieldClient({ baseUrl: 'http://localhost:3001', apiKey: '…' });
const result = await client.analyze('ignore previous instructions');

// Offline (no server)
const local = await analyzeLocal({ prompt: 'Hello world' });
```

### MCP (Cursor / Claude Desktop)

```bash
pnpm --filter @shield/mcp build
```

Add to MCP config — see [docs/mcp-cursor.example.json](./docs/mcp-cursor.example.json).

Tools: `shield_analyze`, `shield_batch_analyze`, `shield_status`.

### GitHub Action

```yaml
- uses: actions/checkout@v4
- uses: AleksandrWeber/AI-SECURITY-GATEWAY-SHIELD-@main
  with:
    paths: 'prompts/**'
    fail-on-risk: SUSPICIOUS
```

See [docs/github-action.example.yml](./docs/github-action.example.yml).

### VS Code extension

```bash
pnpm --filter shield-prompt-security build
pnpm --filter shield-prompt-security package   # → .vsix
```

Commands: **SHIELD: Analyze Selection**, **SHIELD: Analyze Document**.  
Settings: `shield.mode`, `shield.apiUrl`, `shield.language` — see [apps/vscode/README.md](./apps/vscode/README.md).

### Teams (enterprise)

Enable in `.env`:

```env
TEAMS_ENABLED=true
TEAM_ADMIN_KEY=your-secret-admin-key
API_KEY_REQUIRED=true
```

```bash
# Create team
curl -X POST http://localhost:3001/api/v1/teams \
  -H "Authorization: Bearer $TEAM_ADMIN_KEY" \
  -d '{"name":"AppSec Squad","slug":"appsec"}'

# Issue team key (plaintext shown once)
curl -X POST http://localhost:3001/api/v1/teams/<teamId>/keys \
  -H "Authorization: Bearer $TEAM_ADMIN_KEY" \
  -d '{"name":"CI pipeline"}'

# Analyze with team key
curl -X POST http://localhost:3001/api/v1/analyze \
  -H "Authorization: Bearer shld_…" \
  -d '{"prompt":"test"}'

# Team analytics
curl http://localhost:3001/api/v1/teams/<teamId>/analytics \
  -H "Authorization: Bearer shld_…"
```

See [ADR 009](docs/adr/009-enterprise-teams.md).

### Self-learning pipeline

```bash
# List pending AI suggestions
curl http://localhost:3001/api/v1/knowledge/pending

# Approve and promote to database rules
curl -X POST http://localhost:3001/api/v1/knowledge/pending/<id>/approve \
  -d '{"promoteToDb":true}'
```

---

## Configuration

Copy `.env.example` → `.env`. Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PRIVACY_MODE` | `true` | Hash-only storage, redact secrets |
| `DEMO_MODE` | `false` | Force mock AI |
| `DATABASE_URL` | SQLite file | Or PostgreSQL URL |
| `API_KEY_REQUIRED` | `false` | Require API key on protected routes |
| `API_KEYS` | — | Comma-separated legacy keys |
| `TEAMS_ENABLED` | `false` | Team API keys + analytics |
| `TEAM_ADMIN_KEY` | — | Admin key for team management |
| `RULES_DB_ENABLED` | `true` | Database-backed rules |
| `WEBHOOKS_ENABLED` | `true` | Webhook dispatch |
| `RULE_SUGGESTIONS_ENABLED` | `true` | AI suggestion pipeline |

---

## Monorepo structure

```text
apps/frontend          React playground
apps/backend           Express API + Drizzle ORM
apps/vscode            VS Code extension
packages/rule-engine   Pure detection core
packages/ai-core       AI providers, cache, explanations
packages/cli           Terminal CLI
packages/sdk           TypeScript SDK
packages/mcp           MCP server
packages/action        GitHub Action (bundled)
packages/types         Shared types
rules/                 Baseline JSON rules (80+)
attacks/               OWASP LLM test payloads
docs/adr/              Architecture decision records
```

---

## Development

```bash
pnpm test              # Vitest unit + integration
pnpm test:e2e          # Playwright smoke tests
pnpm benchmark         # Rule engine performance
pnpm --filter @shield/backend db:migrate
```

Roadmap: [TODO.md](./TODO.md) — **V3 complete** (playground through enterprise teams).

---

## API reference (selected)

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /api/v1/analyze` | API key* | Analyze prompt |
| `POST /api/v1/analyze/batch` | API key* | Batch analyze |
| `GET /api/v1/status` | — | System dashboard |
| `GET /api/v1/analytics` | — | Aggregated analytics |
| `GET /api/v1/history` | — | Recent analyses |
| `GET/POST /api/v1/teams` | Admin | Team management |
| `GET /api/v1/teams/:id/analytics` | Team / admin | Per-team stats |
| `GET/POST /api/v1/rules/db` | API key* | Database rules |
| `GET/POST /api/v1/knowledge/pending` | API key* | Rule suggestions |
| `GET/POST /api/v1/webhooks` | API key* | Webhook subscriptions |

\* When `API_KEY_REQUIRED` or `API_KEYS` is set.

Full spec: `GET /api/v1/openapi.yaml`

---

## License

Copyright (c) 2026 Oleksandr Shvachko. See [LICENSE](./LICENSE).  
Commercial use requires permission — [LICENSE-COMMERCIAL.md](./LICENSE-COMMERCIAL.md).
