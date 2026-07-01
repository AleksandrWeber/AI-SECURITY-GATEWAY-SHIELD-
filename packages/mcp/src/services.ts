import { analyzeLocal, ShieldClient } from '@shield/sdk';
import type { AnalysisResult, AnalyzeMode, SupportedLanguage } from '@shield/types';
import type { ShieldMcpConfig } from './config.js';
import { parseLanguage } from './config.js';

export interface AnalyzeInput {
  prompt: string;
  mode?: AnalyzeMode;
  language?: SupportedLanguage;
}

export interface BatchAnalyzeInput {
  prompts: string[];
  mode?: AnalyzeMode;
  language?: SupportedLanguage;
}

export interface ShieldMcpServices {
  analyze(input: AnalyzeInput): Promise<AnalysisResult>;
  analyzeBatch(input: BatchAnalyzeInput): Promise<AnalysisResult[]>;
  getStatus(): Promise<unknown>;
}

export function createServices(config: ShieldMcpConfig): ShieldMcpServices {
  if (config.mode === 'remote') {
    const client = new ShieldClient({
      baseUrl: config.apiUrl,
      apiKey: config.apiKey,
    });

    return {
      analyze: (input) =>
        client.analyze(input.prompt, {
          mode: input.mode,
          language: input.language,
        }),
      analyzeBatch: async (input) => {
        const response = await client.analyzeBatch({
          items: input.prompts.map((prompt) => ({
            prompt,
            mode: input.mode,
            language: input.language,
          })),
          mode: input.mode,
          language: input.language,
        });

        return response.results.map((entry, index) => {
          if (entry.ok) return entry.result;
          throw new Error(entry.error.message || `Batch item ${index} failed`);
        });
      },
      getStatus: () => client.getStatus(),
    };
  }

  return {
    analyze: (input) =>
      analyzeLocal({
        prompt: input.prompt,
        mode: input.mode,
        language: input.language ?? parseLanguage(undefined) ?? 'en',
        rulesDir: config.rulesDir,
        demoMode: config.demoMode,
      }),
    analyzeBatch: async (input) => {
      const results: AnalysisResult[] = [];
      for (const prompt of input.prompts) {
        results.push(
          await analyzeLocal({
            prompt,
            mode: input.mode,
            language: input.language ?? 'en',
            rulesDir: config.rulesDir,
            demoMode: config.demoMode,
          }),
        );
      }
      return results;
    },
    getStatus: async () => ({
      mode: 'local',
      rulesDir: config.rulesDir,
      demoMode: config.demoMode,
      message: 'Local MCP mode — connect SHIELD_API_URL for remote status metrics',
    }),
  };
}
