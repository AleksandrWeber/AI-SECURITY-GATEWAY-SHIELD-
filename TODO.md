# SHIELD — Project TODO

Track progress phase by phase. Mark `[x]` when done.

---

## Phase 0 — Foundation ✅ DONE

## Phase 1 — Rule Engine Core ✅ DONE

- [x] Normalization module
- [x] Stage 1: exact match
- [x] Stage 2: regex + contains
- [x] Confidence evaluation
- [x] Risk aggregation
- [x] Dangerous fragments with startIndex/endIndex
- [x] Seed rules (8 per category, 48 total, en + uk)
- [x] Rule loader from `/rules/*.json`
- [x] Rule JSON schema validator (Zod)
- [x] Golden dataset (100 prompts: 40 malicious, 20 suspicious, 40 safe)
- [x] Unit tests ≥90% on rule-engine (98.8% lines)

**Exit:** `analyzePrompt("ignore previous instructions")` → MALICIOUS ✅

---

## Phase 2 — AI Core ✅ DONE

- [x] AI decision gate (when to call LLM)
- [x] MockAIProvider deterministic responses
- [x] AI result parser → AnalysisResult (Zod)
- [x] In-memory SHA256 cache
- [x] Explanation engine (en/uk templates)
- [x] Educational notes from rule metadata
- [x] mergeAnalysisResults pipeline
- [x] enrichRuleOnlyResult (rule-only path)

**Exit:** Full pipeline works with Mock, no API keys ✅

---

## Phase 3 — Backend API ✅ DONE

- [x] `POST /api/v1/analyze` (mode: quick | detailed)
- [x] Zod request validation
- [x] Helmet + CORS
- [x] Rate limiting middleware (express-rate-limit)
- [x] Structured error responses (+ 429)
- [x] OpenAPI 3.1 spec (full) + `GET /api/v1/openapi.yaml`
- [x] Supertest integration tests
- [x] Language detection + Accept-Language

**Exit:** `curl POST /api/v1/analyze` returns valid JSON ✅

---

## Phase 4 — Database + Privacy ✅ DONE

- [x] Drizzle + SQLite
- [x] Migrations: analyses, audit_logs, settings, ai_cache
- [x] Privacy mode (hash-only storage)
- [x] Secret redaction (API keys, tokens, passwords, PII patterns)
- [x] PII detection rules (rule-engine Phase 1)
- [x] Audit logging on analyze

**Exit:** No plaintext prompts when `PRIVACY_MODE=true` ✅

---

## Phase 5 — Frontend Playground ✅

- [x] Prompt input + analyze
- [x] Result panel (risk, severity, confidence, action)
- [x] Dangerous fragments highlight
- [x] Risk visualization (bar, colors)
- [x] Educational note + recommendation (full i18n)
- [x] Language switcher (en/uk)
- [x] Attack library demo prompts
- [x] Copy safe alternative
- [x] Playwright smoke test

**Exit:** Demo attack shows MALICIOUS + explanation

---

## Phase 6 — V1 Finish ✅

- [x] Report history (recent analyses)
- [x] Metrics (p50/p95, cache hit, AI usage)
- [x] OWASP LLM test suite
- [x] Graceful shutdown
- [x] README quickstart

**Exit:** `docker compose up` → working SHIELD

---

## V1.5 — Polish ✅

- [x] System status page
- [x] Favorites / saved reports
- [x] API key authentication
- [x] Performance benchmarks
- [x] False positive tracking

---

## V2+

See MASTER_PROMPT.md roadmap section.

### V2.1 — PostgreSQL ✅

- [x] Dual Drizzle schema (SQLite + PostgreSQL)
- [x] Auto driver selection via `DATABASE_URL`
- [x] `postgres:16` in docker-compose
- [x] PG migrations in `drizzle/pg/`
- [x] ADR 004, README, `.env.example`
- [x] Optional PG smoke test (`TEST_DATABASE_URL`)

### V2.2 — Batch analyze ✅

- [x] `POST /api/v1/analyze/batch` (up to 50 prompts, concurrency limit)
- [x] Per-item errors without failing whole batch
- [x] OpenAPI + integration tests

### V2.3 — V2 detection categories ✅

- [x] `indirect_injection`, `rag_poisoning`, `role_confusion`, `context_manipulation`
- [x] 32 new rules (8 per category, en + uk)
- [x] Golden dataset + OWASP suite coverage

### V2.4 — Webhooks ✅

- [x] `POST/GET/PATCH/DELETE /api/v1/webhooks`
- [x] HMAC-SHA256 signing (`X-SHIELD-Signature`)
- [x] Retry with exponential backoff
- [x] Fire-and-forget dispatch on analyze + batch
- [x] Privacy-safe payload (hash only, no plaintext prompt)
- [x] OpenAPI + integration tests

### V2.5 — AI rule suggestions ✅

- [x] Mock AI proposes rules when analysis finds gaps (no rule match + AI invoked)
- [x] Suggestions stored in `knowledge/pending/` (never auto-applied to `/rules`)
- [x] `GET/POST /api/v1/knowledge/pending` + approve/reject review flow
- [x] Privacy-safe storage (prompt hash only)
- [x] OpenAPI + integration tests

### V2.6 — CLI ✅

- [x] `packages/cli` with `shield analyze` command
- [x] Local offline analysis (default) + `--remote` API mode
- [x] JSON stdout, `--stdin`, `--fail-on-risk` for CI
- [x] Unit tests

### V2.7 — PDF export + analytics ✅

- [x] `GET /api/v1/analyze/:id/export.pdf` and `POST /api/v1/analyze/export.pdf`
- [x] `GET /api/v1/analytics` — risk/action breakdown + system resources
- [x] Extended `/metrics` with memory and CPU load
- [x] Playground PDF export button + analytics on status page
- [x] Integration tests

### V3.1 — Database rules (self-learning foundation) ✅

- [x] `rules` table (SQLite + PostgreSQL) + migrations `0003_rules`
- [x] Merge file + DB rules at runtime (DB overrides on ID conflict)
- [x] `GET/POST/PATCH/DELETE /api/v1/rules/db`
- [x] `POST /api/v1/knowledge/pending/:id/promote` + `approve` with `promoteToDb`
- [x] ADR 005 + integration tests

### V3.2 — npm SDK (`@shield/sdk`) ✅

- [x] `ShieldClient` — typed HTTP wrapper for SHIELD API
- [x] `analyzeLocal` — offline analysis (rule engine + mock AI)
- [x] `ShieldApiError`, re-exports from `@shield/types`
- [x] Unit tests (mock fetch + local analyze)

### V3.3 — MCP server integration ✅

- [x] `@shield/mcp` package with `shield-mcp` stdio binary
- [x] Tools: `shield_analyze`, `shield_batch_analyze`, `shield_status`
- [x] Local (default) + remote modes via env
- [x] ADR 006, Cursor config example, unit tests

### V3.4 — GitHub Action ✅

- [x] Root `action.yml` + `@shield/action` bundled with esbuild
- [x] Scan files by glob, `fail-on-risk` threshold, local + remote modes
- [x] Bundled `/rules` for offline CI scans
- [x] ADR 007, example workflow, CI dogfood on safe fixtures

### V3.5 — VS Code extension ✅

- [x] `apps/vscode` — Analyze Selection / Analyze Document commands
- [x] Webview result panel, `shield.*` settings, bundled local rules
- [x] esbuild bundle, unit tests, ADR 008

### V3.6 — Enterprise / teams ✅

- [x] `teams` + `team_api_keys` tables, `team_id` on analyses/audit
- [x] `shld_…` team API keys (hashed storage)
- [x] Admin routes (`TEAM_ADMIN_KEY`), team analytics, `/teams/me`
- [x] ADR 009 + integration tests

## V3 roadmap — complete ✅
