# ADR 003: Pure Rule Engine

## Status
Accepted

## Context
Core detection logic must be testable without HTTP, database, or LLM dependencies.

## Decision
Implement `@shield/rule-engine` as a pure function package with no Express or external API imports.

## Consequences
- Fast unit tests
- Can be reused in CLI, VS Code extension, and GitHub Action later
- AI layer is optional and orchestrated by backend service
