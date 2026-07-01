import { createHash } from 'node:crypto';
import type { AIAnalysisInput, AIProvider, AnalysisResult, AnalyzeMode, Rule } from '@shield/types';
import type { AICache } from './cache.js';
import { mergeAnalysisResults } from './merge.js';

export { MockAIProvider } from './providers/mock.js';
export { InMemoryAICache, type AICache } from './cache.js';
export {
  buildExplanations,
  getMatchedRuleDefinitions,
  mergeLocalized,
  mergeRisk,
  riskToAction,
} from './explanation.js';
export { mergeAnalysisResults, enrichRuleOnlyResult } from './merge.js';
export { parseAIAnalysisResponse, AIParseError, aiPartialSchema } from './parser.js';
export {
  buildMockRuleSuggestion,
  buildSuggestionFromPrompt,
  shouldSuggestRule,
  nextRuleId,
  CATEGORY_PREFIX,
  type RuleSuggestionDraft,
  type RuleSuggestionInput,
} from './suggestRule.js';

export interface AIDecisionInput {
  matchedRulesCount: number;
  promptLength: number;
  risk: AnalysisResult['risk'];
  confidence: number;
  mode?: AnalyzeMode;
  minPromptLengthForAi?: number;
}

export function shouldInvokeAI(input: AIDecisionInput): boolean {
  const minLen = input.minPromptLengthForAi ?? 10;

  if (input.mode === 'detailed') return true;

  if (input.risk === 'MALICIOUS' && input.confidence >= 90 && input.matchedRulesCount > 0) {
    return false;
  }

  if (input.risk === 'SAFE' && input.confidence >= 80) {
    return false;
  }

  if (input.matchedRulesCount === 0 && input.promptLength > minLen) {
    return true;
  }

  if (input.risk === 'SUSPICIOUS') return true;

  if (input.risk === 'MALICIOUS' && input.confidence < 70) return true;

  return false;
}

export function buildCacheKey(
  normalizedPrompt: string,
  model: string,
  rulesVersion: string,
  rulesFingerprint?: string | number,
): string {
  const fingerprint = rulesFingerprint ?? rulesVersion;
  return createHash('sha256')
    .update(`${normalizedPrompt}|${model}|${rulesVersion}|${fingerprint}`)
    .digest('hex');
}

export interface AnalyzeWithAIOptions {
  cache?: AICache;
  cacheKey?: string;
  allRules: Rule[];
}

/**
 * Run AI provider (with cache), parse and merge into full AnalysisResult.
 */
export async function analyzeWithAI(
  provider: AIProvider,
  baseResult: AnalysisResult,
  input: AIAnalysisInput,
  options: AnalyzeWithAIOptions,
): Promise<AnalysisResult> {
  const { cache, cacheKey, allRules } = options;

  if (cache && cacheKey) {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return mergeAnalysisResults(baseResult, cached, allRules, { fromCache: true });
    }
  }

  const aiPartial = await provider.analyze(input);

  if (cache && cacheKey) {
    await cache.set(cacheKey, aiPartial);
  }

  return mergeAnalysisResults(baseResult, aiPartial, allRules);
}
