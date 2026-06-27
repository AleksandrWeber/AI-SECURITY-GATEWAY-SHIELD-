import {
  analyzeWithAI,
  buildCacheKey,
  enrichRuleOnlyResult,
  MockAIProvider,
  shouldInvokeAI,
} from '@shield/ai-core';
import { analyzePrompt, normalizePrompt } from '@shield/rule-engine';
import type { AnalysisResult, DetectedLanguage, SupportedLanguage } from '@shield/types';
import { env } from '../config.js';
import { DbAICache } from '../db/ai-cache.js';
import { suggestRuleFromAnalysis } from './knowledge.js';
import { getRules, reloadRules, resetRulesCache } from './rules.js';
import { type AuditContext, persistAnalysis, writeAuditLog } from './storage.js';
import { recordAnalysisError, recordAnalysisSuccess } from './metrics.js';

const mockProvider = new MockAIProvider();
let aiCache: DbAICache | null = null;

function getAiCache(): DbAICache {
  if (!aiCache) {
    aiCache = new DbAICache(mockProvider.name);
  }
  return aiCache;
}

function withLanguageFields(
  result: AnalysisResult,
  language: SupportedLanguage,
  detectedLanguage?: DetectedLanguage,
): AnalysisResult {
  return {
    ...result,
    language,
    detectedLanguage: detectedLanguage ?? result.detectedLanguage,
  };
}

export async function runAnalysis(
  prompt: string,
  mode: 'quick' | 'detailed' = 'quick',
  language: SupportedLanguage = 'en',
  detectedLanguage?: DetectedLanguage,
  audit?: AuditContext,
): Promise<AnalysisResult> {
  try {
    const rules = await getRules();
    const baseResult = analyzePrompt(prompt, rules, {
      mode,
      language,
      rulesVersion: env.rulesVersion,
    });

    const needsAi =
      env.demoMode ||
      shouldInvokeAI({
        matchedRulesCount: baseResult.matchedRules.length,
        promptLength: prompt.length,
        risk: baseResult.risk,
        confidence: baseResult.confidence,
        mode,
      });

    let result: AnalysisResult;

    if (!needsAi) {
      result = withLanguageFields(
        enrichRuleOnlyResult(baseResult, rules),
        language,
        detectedLanguage,
      );
    } else {
      const normalized = normalizePrompt(prompt);
      const cacheKey = buildCacheKey(normalized, mockProvider.name, env.rulesVersion);

      const merged = await analyzeWithAI(
        mockProvider,
        baseResult,
        { prompt, normalizedPrompt: normalized, language, partialResult: baseResult },
        { cache: getAiCache(), cacheKey, allRules: rules },
      );

      result = withLanguageFields(merged, language, detectedLanguage);
    }

    await persistAnalysis(result, prompt, env.privacyMode);
    await writeAuditLog({
      ...audit,
      prompt,
      privacyMode: env.privacyMode,
      result,
    });

    if (env.ruleSuggestionsEnabled && env.autoSuggestRules) {
      void suggestRuleFromAnalysis(result, prompt, language);
    }

    recordAnalysisSuccess({
      processingTimeMs: result.processingTimeMs,
      needsAi,
      pipelineStage: result.pipelineStage,
    });

    return result;
  } catch (err) {
    recordAnalysisError();
    await writeAuditLog({
      ...audit,
      prompt,
      privacyMode: env.privacyMode,
      exception: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export { reloadRules };

export function resetAnalysisCaches(): void {
  resetRulesCache();
  aiCache = null;
}
