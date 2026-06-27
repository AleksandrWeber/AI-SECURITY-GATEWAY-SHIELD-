import { describe, expect, it } from 'vitest';
import type { AnalysisResult, Rule } from '@shield/types';
import { mergeAnalysisResults, enrichRuleOnlyResult } from '../src/merge.js';

const rule: Rule = {
  id: 'po-001',
  name: 'Ignore previous instructions',
  category: 'prompt_override',
  language: ['en'],
  severity: 'HIGH',
  type: 'contains',
  pattern: 'ignore previous instructions',
  confidenceBoost: 45,
  enabled: true,
  educationalNote: {
    en: 'Override attempt.',
    uk: 'Спроба override.',
  },
};

function baseWithMatch(): AnalysisResult {
  return {
    analysisId: 'test-id',
    timestamp: new Date().toISOString(),
    rulesVersion: '1.0.0',
    risk: 'MALICIOUS',
    severity: 'HIGH',
    confidence: 45,
    confidenceReasons: ['Matched rule'],
    action: 'BLOCK',
    categories: ['prompt_override'],
    matchedRules: [
      {
        id: 'po-001',
        name: 'Ignore previous instructions',
        severity: 'HIGH',
        category: 'prompt_override',
      },
    ],
    language: 'en',
    detectedLanguage: 'en',
    dangerousFragments: [],
    explanation: { en: '', uk: '' },
    educationalNote: { en: '', uk: '' },
    recommendation: { en: '', uk: '' },
    safeAlternative: { en: '', uk: '' },
    aiInvoked: false,
    processingTimeMs: 5,
    pipelineStage: 'regex',
  };
}

describe('mergeAnalysisResults', () => {
  it('preserves MALICIOUS when AI returns SUSPICIOUS', () => {
    const merged = mergeAnalysisResults(
      baseWithMatch(),
      { risk: 'SUSPICIOUS', action: 'REVIEW', aiInvoked: true },
      [rule],
    );
    expect(merged.risk).toBe('MALICIOUS');
    expect(merged.action).toBe('BLOCK');
  });

  it('fills explanation from rules when AI partial is empty', () => {
    const merged = mergeAnalysisResults(baseWithMatch(), { aiInvoked: true }, [rule]);
    expect(merged.explanation.en).toContain('override');
    expect(merged.educationalNote.en).toContain('Override attempt');
    expect(merged.recommendation.en).toContain('Do not send');
  });

  it('marks pipelineStage as cache when fromCache option set', () => {
    const merged = mergeAnalysisResults(
      baseWithMatch(),
      { aiInvoked: true, pipelineStage: 'ai' },
      [rule],
      { fromCache: true },
    );
    expect(merged.pipelineStage).toBe('cache');
  });
});

describe('enrichRuleOnlyResult', () => {
  it('adds explanations without invoking AI', () => {
    const enriched = enrichRuleOnlyResult(baseWithMatch(), [rule]);
    expect(enriched.aiInvoked).toBe(false);
    expect(enriched.explanation.en.length).toBeGreaterThan(0);
  });
});
