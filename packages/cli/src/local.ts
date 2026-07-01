import {
  analyzeWithAI,
  buildCacheKey,
  enrichRuleOnlyResult,
  InMemoryAICache,
  MockAIProvider,
  shouldInvokeAI,
} from '@shield/ai-core';
import { analyzePrompt, loadRulesFromDirectory, normalizePrompt } from '@shield/rule-engine';
import type { AnalysisResult, AnalyzeMode, SupportedLanguage } from '@shield/types';
import { defaultRulesDir } from './paths.js';

const mockProvider = new MockAIProvider();
const memoryCache = new InMemoryAICache();

export interface LocalAnalyzeOptions {
  prompt: string;
  mode?: AnalyzeMode;
  language?: SupportedLanguage;
  rulesDir?: string;
  rulesVersion?: string;
  demoMode?: boolean;
}

export async function analyzeLocal(options: LocalAnalyzeOptions): Promise<AnalysisResult> {
  const rulesDir = options.rulesDir ?? defaultRulesDir();
  const rulesVersion = options.rulesVersion ?? process.env.RULES_VERSION ?? '1.0.0';
  const mode = options.mode ?? 'quick';
  const language = options.language ?? 'en';

  const rules = await loadRulesFromDirectory(rulesDir);
  const baseResult = analyzePrompt(options.prompt, rules, { mode, language, rulesVersion });

  const needsAi =
    options.demoMode === true ||
    shouldInvokeAI({
      matchedRulesCount: baseResult.matchedRules.length,
      promptLength: options.prompt.length,
      risk: baseResult.risk,
      confidence: baseResult.confidence,
      mode,
    });

  if (!needsAi) {
    return enrichRuleOnlyResult(baseResult, rules);
  }

  const normalized = normalizePrompt(options.prompt);
  const cacheKey = buildCacheKey(normalized, mockProvider.name, rulesVersion);

  return analyzeWithAI(
    mockProvider,
    baseResult,
    {
      prompt: options.prompt,
      normalizedPrompt: normalized,
      language,
      partialResult: baseResult,
    },
    { cache: memoryCache, cacheKey, allRules: rules },
  );
}
