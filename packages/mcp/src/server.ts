import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { loadConfigFromEnv, parseLanguage, summarizeAnalysis } from './config.js';
import { createServices, type ShieldMcpServices } from './services.js';

export interface CreateShieldMcpServerOptions {
  config?: ReturnType<typeof loadConfigFromEnv>;
  services?: ShieldMcpServices;
}

export function createShieldMcpServer(options: CreateShieldMcpServerOptions = {}): McpServer {
  const config = options.config ?? loadConfigFromEnv();
  const services = options.services ?? createServices(config);

  const server = new McpServer({
    name: 'shield',
    version: '0.1.0',
  });

  server.registerTool(
    'shield_analyze',
    {
      title: 'Analyze prompt security',
      description:
        'Analyze a user or system prompt for prompt injection, jailbreaks, data exfiltration, and other LLM security risks before sending it to a model.',
      inputSchema: {
        prompt: z.string().min(1).describe('The prompt text to analyze'),
        mode: z
          .enum(['quick', 'detailed'])
          .optional()
          .describe('Analysis depth (default: quick)'),
        language: z
          .enum(['en', 'uk'])
          .optional()
          .describe('Report language for explanations'),
      },
    },
    async ({ prompt, mode, language }) => {
      const resolvedLanguage = parseLanguage(language) ?? 'en';
      const result = await services.analyze({ prompt, mode, language: resolvedLanguage });

      return {
        content: [
          {
            type: 'text',
            text: summarizeAnalysis(result, resolvedLanguage),
          },
        ],
        structuredContent: result as unknown as Record<string, unknown>,
      };
    },
  );

  server.registerTool(
    'shield_batch_analyze',
    {
      title: 'Batch analyze prompts',
      description:
        'Analyze multiple prompts in one call. Useful for scanning conversation history or bulk inputs.',
      inputSchema: {
        prompts: z
          .array(z.string().min(1))
          .min(1)
          .max(50)
          .describe('Prompts to analyze (max 50)'),
        mode: z.enum(['quick', 'detailed']).optional(),
        language: z.enum(['en', 'uk']).optional(),
      },
    },
    async ({ prompts, mode, language }) => {
      const resolvedLanguage = parseLanguage(language) ?? 'en';
      const results = await services.analyzeBatch({ prompts, mode, language: resolvedLanguage });

      const summary = results
        .map((result, index) => `[${index + 1}] ${result.risk} / ${result.action} — ${prompts[index]?.slice(0, 80)}`)
        .join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Analyzed ${results.length} prompt(s):\n${summary}`,
          },
        ],
        structuredContent: { results: results as unknown as Record<string, unknown>[] },
      };
    },
  );

  server.registerTool(
    'shield_status',
    {
      title: 'SHIELD status',
      description:
        'Get SHIELD runtime status — local mode info or remote API metrics, rules counts, and health.',
      inputSchema: {},
    },
    async () => {
      const status = await services.getStatus();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(status, null, 2),
          },
        ],
        structuredContent: status as Record<string, unknown>,
      };
    },
  );

  return server;
}
