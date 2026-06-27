# ADR 004: Dual Database Driver (SQLite + PostgreSQL)

## Status
Accepted

## Context
V1 used SQLite via libSQL for zero-dependency local dev and Docker. V2 needs PostgreSQL for production workloads (batch analyze, webhooks, analytics).

## Decision
- Keep **SQLite** for local development and Vitest (default `DATABASE_URL=file:./data/shield.db`).
- Add **PostgreSQL 16** via `postgres` + Drizzle `postgres-js` driver.
- Auto-select driver from `DATABASE_URL` prefix:
  - `file:` → SQLite
  - `postgresql://` / `postgres://` → PostgreSQL
- Maintain parallel Drizzle schemas: `schema.sqlite.ts` and `schema.pg.ts`.
- Separate migration folders: `drizzle/` (SQLite) and `drizzle/pg/` (PostgreSQL).
- Docker Compose uses PostgreSQL for the backend service.

## Consequences
- Services resolve tables through `getSchema()` after `initDatabase()`.
- Developers run without Docker/Postgres unchanged.
- Production Docker stack requires the `postgres` service.
- Schema changes must update both dialect files and both migration sets.
