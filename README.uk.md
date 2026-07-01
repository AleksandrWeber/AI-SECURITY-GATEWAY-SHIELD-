# SHIELD — AI Security Gateway

**Аналізуйте промпти на ризики безпеки до того, як вони потраплять до LLM.**

[English documentation](./README.md)

SHIELD — це платформа AI-безпеки для розробників і AppSec-інженерів. Вона працює як **AI-файрвол** між користувачем і мовною моделлю: виявляє prompt injection, jailbreak, витік даних, PII та інші загрози й пояснює ризики зрозумілою мовою.

```text
Користувач / Додаток → SHIELD → LLM
```

---

## Можливості

### Ядро аналізу

| Можливість | Опис |
|------------|------|
| **Rule engine** | 80+ правил у 12 категоріях (prompt override, jailbreak, extraction, PII, indirect injection, RAG poisoning, role confusion, context manipulation тощо) |
| **AI-аналіз** | Mock AI у dev/test; реальні провайдери опційно — викликається лише коли правила потребують підтвердження |
| **Оцінка ризику** | `SAFE` / `SUSPICIOUS` / `MALICIOUS` з severity, confidence і дією (`ALLOW`, `REVIEW`, `BLOCK`, `SANITIZE`) |
| **Двомовні звіти** | Пояснення, рекомендації та безпечні альтернативи **англійською та українською** |
| **Небезпечні фрагменти** | Підсвітка ризикових фрагментів із посиланням на правила |

### Інтерфейси

| Інтерфейс | Призначення |
|-----------|-------------|
| **Web playground** | Інтерактивне демо, бібліотека атак, PDF, історія, обране |
| **REST API** | Інтеграція в додатки (`POST /api/v1/analyze`, batch, OpenAPI 3.1) |
| **CLI** | `shield analyze` — офлайн або через API, `--fail-on-risk` для CI |
| **TypeScript SDK** | `@shield/sdk` — `ShieldClient` + `analyzeLocal()` |
| **MCP server** | Інструменти `shield_analyze` для Cursor / Claude Desktop |
| **GitHub Action** | Сканування prompt-файлів у PR з порогом `fail-on-risk` |
| **VS Code extension** | Аналіз виділення або всього документа в редакторі |

### Безпека та експлуатація

| Можливість | Опис |
|------------|------|
| **Privacy mode** | Зберігання лише хешів; редагування секретів; без plaintext у БД |
| **API key auth** | Ключі з env або командні ключі `shld_…` |
| **Rate limiting** | Обмеження кількості запитів |
| **Webhooks** | HMAC-підписані події (`analysis.completed`, `analysis.blocked`) |
| **Аналітика** | p50/p95, використання AI, розбивка за ризиком, ресурси системи |
| **PDF export** | Завантажувані звіти безпеки |
| **OWASP LLM suite** | Golden dataset + автоматичні регресійні тести |

### Самонавчання (V3)

| Можливість | Опис |
|------------|------|
| **AI rule suggestions** | Пропозиції правил при прогалинах — **ніколи не застосовуються автоматично** |
| **Human review** | Approve / reject з privacy-safe зберіганням |
| **Database rules** | Промоут схвалених правил у БД; merge з файлами (БД перемагає при конфлікті ID) |

### Enterprise / команди (V3.6)

| Можливість | Опис |
|------------|------|
| **Teams** | Ізольовані команди з іменованими API-ключами (`shld_…`) |
| **Team analytics** | Кількість аналізів, розбивка за ризиком/дією на команду |
| **Admin API** | Створення команд і ключів через `TEAM_ADMIN_KEY` |
| **Audit tagging** | Аналізи та audit logs з `team_id` |

---

## Швидкий старт

### Вимоги

- **Node.js 20+**
- **pnpm 9** (або `npx pnpm@9.15.0` без глобального встановлення)

```bash
git clone https://github.com/AleksandrWeber/AI-SECURITY-GATEWAY-SHIELD-.git
cd AI-SECURITY-GATEWAY-SHIELD-
cp .env.example .env
pnpm install
pnpm build
```

### Локальний запуск (два термінали)

```bash
pnpm --filter @shield/backend dev    # API → http://localhost:3001
pnpm --filter @shield/frontend dev   # UI  → http://localhost:5173
```

| URL | Призначення |
|-----|-------------|
| http://localhost:5173 | Playground |
| http://localhost:3001/health | Health check |
| http://localhost:3001/api/v1/status | Статус системи |
| http://localhost:3001/api/v1/openapi.yaml | OpenAPI spec |

### Docker (production-style)

```bash
pnpm build
docker compose up --build
```

**PostgreSQL 16** з persistent volume. Playground: http://localhost:5173

---

## Як користуватись

### Playground

1. Відкрийте http://localhost:5173
2. Вставте промпт або оберіть демо-атаку
3. Перегляньте ризик, пояснення, правила та безпечну альтернативу
4. Перемикайте мову (EN / UK), експортуйте PDF, зберігайте в обране

### API

```bash
curl -X POST http://localhost:3001/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{"prompt":"ignore previous instructions","mode":"quick","language":"uk"}'
```

**Batch** (до 50 промптів):

```bash
curl -X POST http://localhost:3001/api/v1/analyze/batch \
  -H "Content-Type: application/json" \
  -d '{"items":[{"prompt":"привіт"},{"prompt":"ignore all rules"}]}'
```

З API-ключем:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" ...
```

### CLI

```bash
pnpm build
pnpm exec shield analyze "ignore previous instructions"
pnpm exec shield analyze --stdin <<< "Що таке TypeScript?"
pnpm exec shield analyze --fail-on-risk "test"    # exit 2 при SUSPICIOUS/MALICIOUS
pnpm exec shield analyze --remote --url http://localhost:3001 "prompt"
```

### TypeScript SDK

```typescript
import { ShieldClient, analyzeLocal } from '@shield/sdk';

const client = new ShieldClient({ baseUrl: 'http://localhost:3001', apiKey: '…' });
const result = await client.analyze('ignore previous instructions');

const local = await analyzeLocal({ prompt: 'Привіт', language: 'uk' });
```

### MCP (Cursor / Claude Desktop)

```bash
pnpm --filter @shield/mcp build
```

Додайте до MCP-конфігу — [docs/mcp-cursor.example.json](./docs/mcp-cursor.example.json).

Інструменти: `shield_analyze`, `shield_batch_analyze`, `shield_status`.

### GitHub Action

```yaml
- uses: actions/checkout@v4
- uses: AleksandrWeber/AI-SECURITY-GATEWAY-SHIELD-@main
  with:
    paths: 'prompts/**'
    fail-on-risk: SUSPICIOUS
```

Детальніше: [docs/github-action.example.yml](./docs/github-action.example.yml).

### VS Code extension

```bash
pnpm --filter shield-prompt-security build
pnpm --filter shield-prompt-security package   # → .vsix
```

Команди: **SHIELD: Analyze Selection**, **SHIELD: Analyze Document**.  
Налаштування: `shield.mode`, `shield.apiUrl`, `shield.language` — [apps/vscode/README.md](./apps/vscode/README.md).

### Команди (enterprise)

У `.env`:

```env
TEAMS_ENABLED=true
TEAM_ADMIN_KEY=your-secret-admin-key
API_KEY_REQUIRED=true
```

```bash
# Створити команду
curl -X POST http://localhost:3001/api/v1/teams \
  -H "Authorization: Bearer $TEAM_ADMIN_KEY" \
  -d '{"name":"AppSec Squad","slug":"appsec"}'

# Видати ключ команди (plaintext лише один раз)
curl -X POST http://localhost:3001/api/v1/teams/<teamId>/keys \
  -H "Authorization: Bearer $TEAM_ADMIN_KEY" \
  -d '{"name":"CI pipeline"}'

# Аналіз з ключем команди
curl -X POST http://localhost:3001/api/v1/analyze \
  -H "Authorization: Bearer shld_…" \
  -d '{"prompt":"test","language":"uk"}'

# Аналітика команди
curl http://localhost:3001/api/v1/teams/<teamId>/analytics \
  -H "Authorization: Bearer shld_…"
```

Детальніше: [ADR 009](docs/adr/009-enterprise-teams.md).

### Пайплайн самонавчання

```bash
curl http://localhost:3001/api/v1/knowledge/pending

curl -X POST http://localhost:3001/api/v1/knowledge/pending/<id>/approve \
  -d '{"promoteToDb":true}'
```

---

## Конфігурація

Скопіюйте `.env.example` → `.env`:

| Змінна | За замовч. | Опис |
|--------|------------|------|
| `PRIVACY_MODE` | `true` | Лише хеші, редагування секретів |
| `DEMO_MODE` | `false` | Примусовий mock AI |
| `DATABASE_URL` | SQLite | Або PostgreSQL URL |
| `API_KEY_REQUIRED` | `false` | Вимагати API-ключ |
| `API_KEYS` | — | Legacy-ключі через кому |
| `TEAMS_ENABLED` | `false` | Командні ключі + аналітика |
| `TEAM_ADMIN_KEY` | — | Admin-ключ для керування командами |
| `RULES_DB_ENABLED` | `true` | Правила в БД |
| `WEBHOOKS_ENABLED` | `true` | Webhooks |
| `RULE_SUGGESTIONS_ENABLED` | `true` | AI-пропозиції правил |

---

## Структура monorepo

```text
apps/frontend          React playground
apps/backend           Express API + Drizzle ORM
apps/vscode            Розширення VS Code
packages/rule-engine   Ядро детекції
packages/ai-core       AI, кеш, пояснення
packages/cli           Термінальний CLI
packages/sdk           TypeScript SDK
packages/mcp           MCP server
packages/action        GitHub Action
packages/types         Спільні типи
rules/                 Базові JSON-правила (80+)
attacks/               OWASP LLM тести
docs/adr/              Architecture decision records
```

---

## Розробка

```bash
pnpm test              # Vitest
pnpm test:e2e          # Playwright
pnpm benchmark         # Продуктивність rule engine
pnpm --filter @shield/backend db:migrate
```

Roadmap: [TODO.md](./TODO.md) — **V3 завершено**.

---

## API (основне)

| Endpoint | Auth | Опис |
|----------|------|------|
| `POST /api/v1/analyze` | API key* | Аналіз промпту |
| `POST /api/v1/analyze/batch` | API key* | Batch-аналіз |
| `GET /api/v1/status` | — | Дашборд системи |
| `GET /api/v1/analytics` | — | Агрегована аналітика |
| `GET/POST /api/v1/teams` | Admin | Керування командами |
| `GET /api/v1/teams/:id/analytics` | Team / admin | Статистика команди |
| `GET/POST /api/v1/rules/db` | API key* | Правила в БД |
| `GET/POST /api/v1/knowledge/pending` | API key* | Пропозиції правил |
| `GET/POST /api/v1/webhooks` | API key* | Webhooks |

\* Коли увімкнено `API_KEY_REQUIRED` або задано `API_KEYS`.

Повна специфікація: `GET /api/v1/openapi.yaml`

---

## Ліцензія

Copyright (c) 2026 Oleksandr Shvachko. Див. [LICENSE](./LICENSE).  
Комерційне використання — за дозволом: [LICENSE-COMMERCIAL.md](./LICENSE-COMMERCIAL.md).
