import type { AnalysisResult, AnalyzeMode, SupportedLanguage } from '@shield/types';
import { analyzeLocal } from '../local.js';
import { analyzeRemote } from '../remote.js';

export interface AnalyzeCommandOptions {
  prompt: string;
  mode: AnalyzeMode;
  language?: SupportedLanguage;
  local: boolean;
  url: string;
  apiKey?: string;
  rulesDir?: string;
  demoMode: boolean;
}

export async function runAnalyzeCommand(options: AnalyzeCommandOptions): Promise<AnalysisResult> {
  if (options.local) {
    return analyzeLocal({
      prompt: options.prompt,
      mode: options.mode,
      language: options.language,
      rulesDir: options.rulesDir,
      demoMode: options.demoMode,
    });
  }

  return analyzeRemote({
    prompt: options.prompt,
    url: options.url,
    mode: options.mode,
    language: options.language,
    apiKey: options.apiKey,
  });
}
