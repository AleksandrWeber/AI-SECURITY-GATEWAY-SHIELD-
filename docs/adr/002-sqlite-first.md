# ADR 002: SQLite First, PostgreSQL Later

## Status
Accepted

## Context
V1 needs persistence for audit logs, cache, and history without operational complexity.

## Decision
Use SQLite with Drizzle ORM in V1. Migrate to PostgreSQL in V2.

## Consequences
- Zero external DB dependency for local dev and Docker
- Drizzle schema can be shared when migrating to PostgreSQL
