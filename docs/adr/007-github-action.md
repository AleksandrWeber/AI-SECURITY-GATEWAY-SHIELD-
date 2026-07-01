# ADR 007: GitHub Action (V3.4)

## Status

Accepted — 2026-07-01

## Context

V2.6 added `shield analyze --fail-on-risk` for CI. V3 requires a native GitHub Action so repositories can gate prompt files in PRs without custom scripts.

## Decision

1. Add `@shield/action` package bundled with esbuild into `packages/action/dist/index.js`.
2. Root `action.yml` exposes a **node20** action with inputs: `paths`, `mode`, `fail-on-risk`, `local`, `api-url`, `api-key`.
3. Bundle monorepo `/rules` into `dist/rules/` at build time for offline scans.
4. Default `fail-on-risk: SUSPICIOUS` (aligned with CLI).
5. Dogfood in CI: build action + scan safe fixtures via `uses: ./`.

## Consequences

- Consumers use `uses: owner/repo@ref` without installing Node dependencies.
- Action artifact must be rebuilt when rules change (`pnpm --filter @shield/action build`).
- Remote mode optional for teams running SHIELD backend with DB rules.

## Alternatives considered

- Composite action invoking `pnpm shield` — rejected (requires full monorepo install in consumer CI).
- Docker action — rejected for V3.4 (heavier, slower cold starts).
