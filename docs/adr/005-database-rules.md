# ADR 005: Database-backed rules (V3.1)

## Status

Accepted — 2026-07-01

## Context

V1–V2 stored active detection rules only as JSON files in `/rules`. V2.5 added AI suggestions in `knowledge/pending/` with human approve/reject, but approved rules were not applied at runtime.

V3 requires human-approved self-learning with rules that can live in the database.

## Decision

1. Add a `rules` table (SQLite + PostgreSQL) storing validated rule JSON.
2. At runtime, merge **file rules** + **enabled DB rules**; DB wins on ID conflict.
3. Promote flow: `pending` → `approved` (file) → **promote** → DB rule (enabled).
4. Never auto-promote: explicit `POST .../promote` or `approve` with `promoteToDb: true`.
5. File rules remain the baseline; DB rules extend or override without editing `/rules` on disk.

## Consequences

- Hotfixes and AI-approved rules can ship without redeploying rule files.
- CLI local mode still reads files only (no DB) unless extended later.
- Rule cache must invalidate after DB mutations (`reloadRules()`).
- Schema validated via existing `parseRule()` from `@shield/rule-engine`.

## Alternatives considered

- Writing promoted rules directly to `/rules/*.json` — rejected (git noise, deploy coupling).
- Full migration of all rules to DB in V3.1 — deferred; files stay source of truth for baseline.
