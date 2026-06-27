import { describe, expect, it } from 'vitest';
import type { Rule } from '@shield/types';
import { evaluateConfidence, aggregateRisk } from '../src/risk.js';
import type { RuleMatch } from '../src/matchers.js';

function makeMatch(rule: Partial<Rule> & Pick<Rule, 'severity' | 'confidenceBoost' | 'name'>): RuleMatch {
  return {
    rule: {
      id: 'x-001',
      category: 'jailbreak',
      type: 'contains',
      pattern: 'x',
      language: ['en'],
      enabled: true,
      ...rule,
    } as Rule,
    matchedText: 'x',
    startIndex: 0,
    endIndex: 1,
  };
}

describe('evaluateConfidence', () => {
  it('returns zero when no matches', () => {
    const result = evaluateConfidence([]);
    expect(result.confidence).toBe(0);
    expect(result.confidenceReasons).toContain('No rules matched');
  });

  it('sums confidence boosts capped at 100', () => {
    const matches = [
      makeMatch({ name: 'A', severity: 'HIGH', confidenceBoost: 60 }),
      makeMatch({ name: 'B', severity: 'HIGH', confidenceBoost: 60 }),
    ];
    expect(evaluateConfidence(matches).confidence).toBe(100);
  });
});

describe('aggregateRisk', () => {
  it('returns SAFE when no matches', () => {
    expect(aggregateRisk([], 0)).toEqual({
      risk: 'SAFE',
      severity: 'LOW',
      action: 'ALLOW',
    });
  });

  it('returns MALICIOUS for HIGH severity match', () => {
    const matches = [makeMatch({ name: 'High', severity: 'HIGH', confidenceBoost: 40 })];
    expect(aggregateRisk(matches, 40).risk).toBe('MALICIOUS');
    expect(aggregateRisk(matches, 40).action).toBe('BLOCK');
  });

  it('returns SUSPICIOUS for MEDIUM severity match', () => {
    const matches = [makeMatch({ name: 'Med', severity: 'MEDIUM', confidenceBoost: 30 })];
    expect(aggregateRisk(matches, 30).risk).toBe('SUSPICIOUS');
    expect(aggregateRisk(matches, 30).action).toBe('REVIEW');
  });

  it('picks max severity from multiple matches', () => {
    const matches = [
      makeMatch({ name: 'Low', severity: 'LOW', confidenceBoost: 20 }),
      makeMatch({ name: 'High', severity: 'HIGH', confidenceBoost: 40 }),
    ];
    expect(aggregateRisk(matches, 60).severity).toBe('HIGH');
  });
});
