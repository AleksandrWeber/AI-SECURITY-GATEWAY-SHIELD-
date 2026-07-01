#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { fileURLToPath } from 'node:url';
import { createShieldMcpServer } from './server.js';

export { createShieldMcpServer } from './server.js';
export type { CreateShieldMcpServerOptions } from './server.js';
export { loadConfigFromEnv, summarizeAnalysis } from './config.js';
export type { ShieldMcpConfig } from './config.js';
export { createServices } from './services.js';
export type { ShieldMcpServices } from './services.js';

export async function runStdioServer(): Promise<void> {
  const server = createShieldMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runStdioServer().catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`shield-mcp error: ${message}\n`);
    process.exit(1);
  });
}
