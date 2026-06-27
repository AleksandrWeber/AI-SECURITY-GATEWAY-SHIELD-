import { describe, expect, it } from 'vitest';
import { analyzeWithAI, buildCacheKey, InMemoryAICache, shouldInvokeAI } from '../src/index.js';
import { MockAIProvider } from '../src/providers/mock.js';
import type { AnalysisResult, Rule } from '@shield/types';

function emptyBase(): AnalysisResult {
  return {
    analysisId: 'a1',
    timestamp: new Date().toISOString(),
    rulesVersion: '1.0.0',
    risk: 'SAFE',
    severity: 'LOW',
    confidence: 0,
    confidenceReasons: [],
    action: 'ALLOW',
    categories: [],
    matchedRules: [],
    language: 'en',
    detectedLanguage: 'en',
    dangerousFragments: [],
    explanation: { en: '', uk: '' },
    educationalNote: { en: '', uk: '' },
    recommendation: { en: '', uk: '' },
    safeAlternative: { en: '', uk: '' },
    aiInvoked: false,
    processingTimeMs: 1,
    pipelineStage: 'regex',
  };
}

describe('shouldInvokeAI', () => {
  it('skips AI for high-confidence malicious rule match', () => {
    expect(
      shouldInvokeAI({
        matchedRulesCount: 2,
        promptLength: 100,
        risk: 'MALICIOUS',
        confidence: 95,
      }),
    ).toBe(false);
  });

  it('invokes AI for suspicious risk', () => {
    expect(
      shouldInvokeAI({
        matchedRulesCount: 1,
        promptLength: 50,
        risk: 'SUSPICIOUS',
        confidence: 55,
      }),
    ).toBe(true);
  });

  it('invokes AI when no rules matched and prompt is long enough', () => {
    expect(
      shouldInvokeAI({
        matchedRulesCount: 0,
        promptLength: 50,
        risk: 'SAFE',
        confidence: 0,
      }),
    ).toBe(true);
  });

  it('skips AI for safe high-confidence result', () => {
    expect(
      shouldInvokeAI({
        matchedRulesCount: 0,
        promptLength: 5,
        risk: 'SAFE',
        confidence: 85,
      }),
    ).toBe(false);
  });

  it('invokes AI for low-confidence malicious match', () => {
    expect(
      shouldInvokeAI({
        matchedRulesCount: 1,
        promptLength: 50,
        risk: 'MALICIOUS',
        confidence: 50,
      }),
    ).toBe(true);
  });

  it('always invokes AI in detailed mode', () => {
    expect(
      shouldInvokeAI({
        matchedRulesCount: 2,
        promptLength: 100,
        risk: 'MALICIOUS',
        confidence: 95,
        mode: 'detailed',
      }),
    ).toBe(true);
  });
});

describe('analyzeWithAI pipeline', () => {
  const provider = new MockAIProvider();
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
  };

  it('merges mock AI with base result and uses cache on second call', async () => {
    const base = emptyBase();

    const cache = new InMemoryAICache();
    const key = buildCacheKey('hello world test prompt here', 'mock', '1.0.0');

    const first = await analyzeWithAI(
      provider,
      base,
      {
        prompt: 'hello world test prompt here with secret keyword',
        normalizedPrompt: 'hello world test prompt here with secret keyword',
        language: 'en',
        partialResult: base,
      },
      { cache, cacheKey: key, allRules: [rule] },
    );

    expect(first.aiInvoked).toBe(true);
    expect(first.explanation.en.length).toBeGreaterThan(0);

    const second = await analyzeWithAI(
      provider,
      base,
      {
        prompt: 'hello world test prompt here with secret keyword',
        normalizedPrompt: 'hello world test prompt here with secret keyword',
        language: 'en',
        partialResult: base,
      },
      { cache, cacheKey: key, allRules: [rule] },
    );

    expect(second.pipelineStage).toBe('cache');
  });
});
