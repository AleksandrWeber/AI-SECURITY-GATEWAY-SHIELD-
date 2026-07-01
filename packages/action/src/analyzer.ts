import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeLocal, ShieldClient } from '@shield/sdk';
import type { AnalyzeMode, SupportedLanguage } from '@shield/types';

export interface AnalyzerOptions {
  local: boolean;
  apiUrl?: string;
  apiKey?: string;
  mode: AnalyzeMode;
  language?: SupportedLanguage;
  rulesDir?: string;
  demoMode?: boolean;
}

function moduleDir(): string {
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  return dirname(fileURLToPath(import.meta.url));
}

export function bundledRulesDir(): string {
  return join(moduleDir(), 'rules');
}

export function resolveRulesDir(explicit?: string): string {
  if (explicit?.trim()) {
    return resolve(explicit.trim());
  }

  const bundled = bundledRulesDir();
  if (existsSync(bundled)) {
    return bundled;
  }

  return resolve(process.cwd(), 'rules');
}

export function createAnalyzer(options: AnalyzerOptions): (prompt: string) => Promise<import('@shield/types').AnalysisResult> {
  if (!options.local) {
    const client = new ShieldClient({
      baseUrl: options.apiUrl ?? 'http://localhost:3001',
      apiKey: options.apiKey,
    });

    return (prompt) =>
      client.analyze(prompt, {
        mode: options.mode,
        language: options.language,
      });
  }

  const rulesDir = resolveRulesDir(options.rulesDir);

  return (prompt) =>
    analyzeLocal({
      prompt,
      mode: options.mode,
      language: options.language ?? 'en',
      rulesDir,
      demoMode: options.demoMode,
    });
}
