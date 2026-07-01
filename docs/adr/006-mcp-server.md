# ADR 006: MCP server integration (V3.3)

## Status

Accepted — 2026-07-01

## Context

SHIELD targets AI developers and AppSec engineers. MCP (Model Context Protocol) lets coding assistants call tools from external servers. V3 roadmap includes MCP so agents can scan prompts before sending them to LLMs.

## Decision

1. Add `@shield/mcp` package with stdio transport (`shield-mcp` binary).
2. Expose three tools:
   - `shield_analyze` — single prompt analysis
   - `shield_batch_analyze` — up to 50 prompts
   - `shield_status` — runtime / API status
3. Default to **local** mode (offline rules via `@shield/sdk`); switch to **remote** when `SHIELD_API_URL` is set or `SHIELD_MCP_MODE=remote`.
4. Reuse `@shield/sdk` — no duplicate HTTP or rule-engine logic in the MCP layer.

## Consequences

- Cursor, Claude Desktop, and other MCP clients can gate prompts without custom plugins.
- Local mode works without a running backend; remote mode includes DB rules and analytics.
- Stdio only in V3.3; Streamable HTTP transport deferred.

## Alternatives considered

- Embedding MCP in the backend HTTP app — rejected for V3.3 (stdio is the standard for IDE integration).
- Publishing to npm publicly — deferred (`private: true` in monorepo).
