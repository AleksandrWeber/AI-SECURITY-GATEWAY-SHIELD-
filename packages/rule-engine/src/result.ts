import { randomUUID } from 'node:crypto';
import type { AnalysisResult, SupportedLanguage } from '@shield/types';

const EMPTY_LOCALIZED = { en: '', uk: '' };

export function generateAnalysisId(): string {
  return randomUUID();
}

export function createEmptyResult(
  partial: Partial<AnalysisResult> & Pick<AnalysisResult, 'analysisId' | 'rulesVersion'>,
): AnalysisResult {
  const language: SupportedLanguage = partial.language ?? 'en';

  return {
    analysisId: partial.analysisId,
    timestamp: new Date().toISOString(),
    rulesVersion: partial.rulesVersion,
    risk: partial.risk ?? 'SAFE',
    severity: partial.severity ?? 'LOW',
    confidence: partial.confidence ?? 0,
    confidenceReasons: partial.confidenceReasons ?? [],
    action: partial.action ?? 'ALLOW',
    categories: partial.categories ?? [],
    matchedRules: partial.matchedRules ?? [],
    language,
    detectedLanguage: partial.detectedLanguage ?? language,
    dangerousFragments: partial.dangerousFragments ?? [],
    explanation: partial.explanation ?? EMPTY_LOCALIZED,
    educationalNote: partial.educationalNote ?? EMPTY_LOCALIZED,
    recommendation: partial.recommendation ?? EMPTY_LOCALIZED,
    safeAlternative: partial.safeAlternative ?? EMPTY_LOCALIZED,
    aiInvoked: partial.aiInvoked ?? false,
    processingTimeMs: partial.processingTimeMs ?? 0,
    pipelineStage: partial.pipelineStage ?? 'regex',
  };
}
