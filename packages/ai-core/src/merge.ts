import type { AnalysisResult, Rule } from '@shield/types';
import {
  appendLocalized,
  buildExplanations,
  getMatchedRuleDefinitions,
  mergeLocalized,
  mergeRisk,
  riskToAction,
} from './explanation.js';

export interface MergeOptions {
  /** When true, pipelineStage is 'cache' instead of 'ai' */
  fromCache?: boolean;
}

/**
 * Merge rule-engine base result with optional AI partial output and rule metadata.
 */
export function mergeAnalysisResults(
  base: AnalysisResult,
  aiPartial: Partial<AnalysisResult>,
  allRules: Rule[],
  options: MergeOptions = {},
): AnalysisResult {
  const matchedRuleDefs = getMatchedRuleDefinitions(
    base.matchedRules.map((r) => r.id),
    allRules,
  );

  const mergedRisk = mergeRisk(base.risk, aiPartial.risk);
  const mergedAction = riskToAction(mergedRisk);
  const mergedSeverity =
    mergedRisk === 'MALICIOUS'
      ? 'HIGH'
      : mergedRisk === 'SUSPICIOUS'
        ? 'MEDIUM'
        : aiPartial.severity ?? base.severity;

  const mergedConfidence = Math.max(base.confidence, aiPartial.confidence ?? 0);
  const mergedConfidenceReasons = [
    ...base.confidenceReasons,
    ...(aiPartial.confidenceReasons ?? []),
  ];

  const ruleExplanations = buildExplanations(
    {
      ...base,
      risk: mergedRisk,
      action: mergedAction,
    },
    matchedRuleDefs,
  );

  const aiInvoked = aiPartial.aiInvoked ?? Object.keys(aiPartial).length > 0;

  return {
    ...base,
    ...aiPartial,
    risk: mergedRisk,
    severity: mergedSeverity,
    confidence: Math.min(mergedConfidence, 100),
    confidenceReasons: [...new Set(mergedConfidenceReasons)],
    action: mergedAction,
    categories: base.categories.length > 0 ? base.categories : (aiPartial.categories ?? []),
    explanation: mergeLocalized(ruleExplanations.explanation, aiPartial.explanation),
    educationalNote: appendLocalized(
      ruleExplanations.educationalNote,
      aiPartial.educationalNote,
    ),
    recommendation: mergeLocalized(ruleExplanations.recommendation, aiPartial.recommendation),
    safeAlternative: mergeLocalized(ruleExplanations.safeAlternative, aiPartial.safeAlternative),
    aiInvoked,
    pipelineStage: options.fromCache ? 'cache' : aiInvoked ? 'ai' : base.pipelineStage,
    processingTimeMs: base.processingTimeMs,
  };
}

/**
 * Enrich a rule-only result with explanations (no AI invoked).
 */
export function enrichRuleOnlyResult(base: AnalysisResult, allRules: Rule[]): AnalysisResult {
  return mergeAnalysisResults(base, {}, allRules);
}
