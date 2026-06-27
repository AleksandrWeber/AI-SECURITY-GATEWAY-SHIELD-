import type { AnalysisResult, AnalyzeOptions, DetectionCategory, Rule } from '@shield/types';
import { normalizePrompt } from './normalize.js';
import { matchExactRules, matchPatternRules } from './matchers.js';
import { evaluateConfidence, aggregateRisk } from './risk.js';
import { createEmptyResult, generateAnalysisId } from './result.js';

const DEFAULT_RULES_VERSION = '1.0.0';

/**
 * Pure prompt analyzer — no Express, DB, or external APIs.
 * Phase 1 will expand matchers, confidence, and normalization.
 */
export function analyzePrompt(
  prompt: string,
  rules: Rule[],
  options: AnalyzeOptions = {},
): AnalysisResult {
  const start = performance.now();
  const rulesVersion = options.rulesVersion ?? DEFAULT_RULES_VERSION;
  const language = options.language ?? 'en';

  const enabledRules = rules.filter((r) => r.enabled);
  const normalized = normalizePrompt(prompt);

  const exactMatches = matchExactRules(normalized, enabledRules);
  const patternMatches = matchPatternRules(normalized, enabledRules);
  const allMatches = [...exactMatches, ...patternMatches];

  const matchedRules = allMatches.map((m) => ({
    id: m.rule.id,
    name: m.rule.name,
    severity: m.rule.severity,
    category: m.rule.category,
  }));

  const dangerousFragments = allMatches.map((m) => ({
    text: m.matchedText,
    startIndex: m.startIndex,
    endIndex: m.endIndex,
    ruleId: m.rule.id,
    ruleMatched: m.rule.name,
    severity: m.rule.severity,
  }));

  const categories = [...new Set(allMatches.map((m) => m.rule.category))] as DetectionCategory[];

  const { confidence, confidenceReasons } = evaluateConfidence(allMatches);
  const { risk, severity, action } = aggregateRisk(allMatches, confidence);

  const result = createEmptyResult({
    analysisId: generateAnalysisId(),
    rulesVersion,
    language,
    risk,
    severity,
    confidence,
    confidenceReasons,
    action,
    categories,
    matchedRules,
    dangerousFragments,
    pipelineStage: allMatches.length > 0 ? (exactMatches.length > 0 ? 'exact' : 'regex') : 'regex',
    aiInvoked: false,
    processingTimeMs: Math.round(performance.now() - start),
  });

  return result;
}

export { normalizePrompt } from './normalize.js';
export { loadRulesFromDirectory, loadRulesFromDirectoryDetailed } from './loader.js';
export {
  ruleSchema,
  ruleFileSchema,
  parseRule,
  parseRuleFile,
  validateRuleFile,
  RuleValidationError,
} from './schema.js';
export type { RuleMatch } from './matchers.js';
export type { LoadRulesOptions, LoadRulesResult } from './loader.js';
