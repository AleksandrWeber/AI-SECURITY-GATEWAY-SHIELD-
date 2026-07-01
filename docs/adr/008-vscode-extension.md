# ADR 008: VS Code extension (V3.5)

## Status

Accepted — 2026-07-01

## Context

SHIELD targets AI developers who write and edit prompts in VS Code. CLI and MCP cover terminal and assistant flows; an editor extension enables in-context analysis of selections and whole files.

## Decision

1. Add `apps/vscode` extension `shield-prompt-security`.
2. Commands: **Analyze Selection**, **Analyze Document** (editor context menu + palette).
3. Reuse `@shield/sdk` for local and remote analysis; bundle rules into `dist/rules/` at build time.
4. Results in a **webview panel** beside the editor (risk, explanation, recommendation, matched rules).
5. Settings under `shield.*` mirror CLI/MCP env options.
6. esbuild bundle with `vscode` as external dependency.

## Consequences

- Extension must be rebuilt when rules change (`pnpm --filter shield-prompt-security build`).
- Not published to Marketplace in V3.5; install via VSIX or Extension Development Host.
- Keybinding uses `Cmd/Ctrl+Shift+Alt+S` to avoid Save As conflicts.

## Alternatives considered

- Language Server Protocol — deferred (heavier, V3.5 focuses on explicit analyze commands).
- Inline diagnostics for all open files — deferred (performance + noise).
