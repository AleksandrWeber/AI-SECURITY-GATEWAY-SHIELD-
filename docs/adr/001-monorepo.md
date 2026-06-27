# ADR 001: Monorepo with pnpm and Turborepo

## Status
Accepted

## Context
SHIELD has multiple packages (types, rule-engine, ai-core) and apps (backend, frontend) that share types and build order dependencies.

## Decision
Use pnpm workspaces with Turborepo for task orchestration.

## Consequences
- Shared dependencies are hoisted efficiently
- Build order is managed via `dependsOn: ["^build"]`
- Requires pnpm (via corepack or npx)
