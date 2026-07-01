import type { AnalysisResult, SupportedLanguage } from '@shield/types';

export interface ShieldMcpConfig {
  mode: 'local' | 'remote';
  apiUrl: string;
  apiKey?: string;
  rulesDir?: string;
  demoMode: boolean;
}

export function loadConfigFromEnv(env: NodeJS.ProcessEnv = process.env): ShieldMcpConfig {
  const forceRemote = env.SHIELD_FORCE_REMOTE === 'true';
  const explicitMode = env.SHIELD_MCP_MODE?.trim().toLowerCase();
  const mode: 'local' | 'remote' =
    explicitMode === 'remote' || forceRemote
      ? 'remote'
      : explicitMode === 'local'
        ? 'local'
        : env.SHIELD_API_URL?.trim()
          ? 'remote'
          : 'local';

  return {
    mode,
    apiUrl: env.SHIELD_API_URL?.trim() || 'http://localhost:3001',
    apiKey: env.SHIELD_API_KEY?.trim() || undefined,
    rulesDir: env.RULES_DIR?.trim() || undefined,
    demoMode: env.SHIELD_MCP_DEMO === 'true' || env.DEMO_MODE === 'true',
  };
}

export function parseLanguage(value: string | undefined): SupportedLanguage | undefined {
  if (!value) return undefined;
  if (value === 'en' || value === 'uk') return value;
  throw new Error(`Invalid language: ${value}`);
}

export function summarizeAnalysis(result: AnalysisResult, language: SupportedLanguage): string {
  const explanation = result.explanation[language] ?? result.explanation.en;
  const recommendation = result.recommendation[language] ?? result.recommendation.en;
  const categories = result.categories.length > 0 ? result.categories.join(', ') : 'none';

  return [
    `Risk: ${result.risk}`,
    `Action: ${result.action}`,
    `Severity: ${result.severity}`,
    `Confidence: ${result.confidence}%`,
    `Categories: ${categories}`,
    `Matched rules: ${result.matchedRules.length}`,
    `AI invoked: ${result.aiInvoked}`,
    '',
    `Explanation: ${explanation}`,
    `Recommendation: ${recommendation}`,
  ].join('\n');
}
