import { describe, expect, it } from 'vitest';
import type { Rule } from '@shield/types';
import { buildExplanations, mergeRisk, getMatchedRuleDefinitions, mergeLocalized } from '../src/explanation.js';

const jailbreakRule: Rule = {
  id: 'jb-001',
  name: 'DAN jailbreak',
  category: 'jailbreak',
  language: ['en'],
  severity: 'HIGH',
  type: 'contains',
  pattern: 'act as dan',
  confidenceBoost: 40,
  enabled: true,
  educationalNote: {
    en: 'Classic DAN roleplay jailbreak.',
    uk: 'Класичний DAN roleplay jailbreak.',
  },
};

describe('buildExplanations', () => {
  it('returns safe messaging when no rules matched', () => {
    const bundle = buildExplanations(
      {
        risk: 'SAFE',
        action: 'ALLOW',
        categories: [],
        matchedRules: [],
        dangerousFragments: [],
      },
      [],
    );

    expect(bundle.explanation.en).toContain('No known attack patterns');
    expect(bundle.recommendation.en).toContain('No action required');
  });

  it('uses rule educational notes when rules matched', () => {
    const bundle = buildExplanations(
      {
        risk: 'MALICIOUS',
        action: 'BLOCK',
        categories: ['jailbreak'],
        matchedRules: [{ id: 'jb-001', name: 'DAN jailbreak', severity: 'HIGH', category: 'jailbreak' }],
        dangerousFragments: [],
      },
      [jailbreakRule],
    );

    expect(bundle.explanation.en).toContain('jailbreak');
    expect(bundle.educationalNote.en).toContain('Classic DAN');
    expect(bundle.recommendation.en).toContain('Do not send');
    expect(bundle.safeAlternative.en).toContain('safety best practices');
  });
});

describe('mergeRisk', () => {
  it('never downgrades MALICIOUS', () => {
    expect(mergeRisk('MALICIOUS', 'SAFE')).toBe('MALICIOUS');
    expect(mergeRisk('SAFE', 'MALICIOUS')).toBe('MALICIOUS');
  });
});

describe('getMatchedRuleDefinitions', () => {
  it('uses generic safe alternative when category unknown', () => {
    const bundle = buildExplanations(
      {
        risk: 'SUSPICIOUS',
        action: 'REVIEW',
        categories: [],
        matchedRules: [{ id: 'x-001', name: 'Unknown', severity: 'MEDIUM', category: 'jailbreak' }],
        dangerousFragments: [],
      },
      [],
    );
    expect(bundle.safeAlternative.en).toContain('Rephrase');
  });

  it('mergeLocalized prefers secondary when non-empty', () => {
    expect(
      mergeLocalized(
        { en: 'Rule text', uk: 'Rule uk' },
        { en: 'AI text', uk: '' },
      ).en,
    ).toBe('AI text');
  });
});
