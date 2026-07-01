# ADR 009: Teams and enterprise API keys (V3.6)

## Status

Accepted — 2026-07-01

## Context

Organizations deploying SHIELD need isolated API keys, per-team usage visibility, and scoped analytics. Flat `API_KEYS` env vars do not scale for multiple squads or tenants.

## Decision

1. Add `teams` and `team_api_keys` tables; optional `team_id` on `analyses` and `audit_logs`.
2. Team keys use `shld_` prefix; only SHA-256 hashes stored in DB.
3. `TEAM_ADMIN_KEY` protects team management routes (`POST /teams`, key CRUD).
4. Team keys authenticate analyze/batch like legacy keys; middleware attaches `req.team`.
5. `GET /api/v1/teams/:id/analytics` — team key or admin.
6. `GET /api/v1/teams/me` — current team from key.
7. Legacy `API_KEYS` env remains for backward compatibility.

## Consequences

- Enable with `TEAMS_ENABLED=true` and set `TEAM_ADMIN_KEY`.
- Per-team reporting without multi-tenant rule isolation (shared rule base in V3.6).
- Future: team-scoped webhooks, quotas, RBAC.

## Alternatives considered

- Full multi-tenant rule DB per team — deferred.
- OAuth/SSO — deferred to later enterprise phase.
