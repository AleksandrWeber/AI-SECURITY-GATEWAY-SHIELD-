import { analyzeLocal, ShieldClient } from '@shield/sdk';
import type { AnalysisResult, AnalyzeMode, SupportedLanguage } from '@shield/types';
import { resolveRulesDir } from './paths.js';

export interface ShieldExtensionConfig {
  mode: 'local' | 'remote';
  apiUrl: string;
  apiKey?: string;
  language: SupportedLanguage;
  analysisMode: AnalyzeMode;
  rulesDir?: string;
}

export async function analyzeWithConfig(
  prompt: string,
  config: ShieldExtensionConfig,
): Promise<AnalysisResult> {
  if (config.mode === 'remote') {
    const client = new ShieldClient({
      baseUrl: config.apiUrl,
      apiKey: config.apiKey,
    });

    return client.analyze(prompt, {
      mode: config.analysisMode,
      language: config.language,
    });
  }

  return analyzeLocal({
    prompt,
    mode: config.analysisMode,
    language: config.language,
    rulesDir: resolveRulesDir(config.rulesDir),
  });
}

export type WarnOnRisk = 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS';

const RISK_RANK: Record<WarnOnRisk, number> = {
  SAFE: 0,
  SUSPICIOUS: 1,
  MALICIOUS: 2,
};

export function riskMeetsThreshold(risk: AnalysisResult['risk'], threshold: WarnOnRisk): boolean {
  return RISK_RANK[risk] >= RISK_RANK[threshold];
}
