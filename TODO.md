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

### V2.5+ (pending)

- [ ] AI rule suggestions
- [ ] CLI
- [ ] PDF export + analytics
