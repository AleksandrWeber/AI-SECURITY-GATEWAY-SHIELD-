import { describe, expect, it } from 'vitest';
import type { Rule } from '@shield/types';
import { matchExactRules, matchPatternRules } from '../src/matchers.js';

const exactRule: Rule = {
  id: 'te-001',
  name: 'Exact test',
  category: 'jailbreak',
  language: ['en'],
  severity: 'HIGH',
  type: 'exact',
  pattern: 'exact match phrase',
  confidenceBoost: 40,
  enabled: true,
};

const containsRule: Rule = {
  id: 'tc-001',
  name: 'Contains test',
  category: 'jailbreak',
  language: ['en'],
  severity: 'MEDIUM',
  type: 'contains',
  pattern: 'partial',
  confidenceBoost: 30,
  enabled: true,
};

const regexRule: Rule = {
  id: 'tr-001',
  name: 'Regex test',
  category: 'jailbreak',
  language: ['en'],
  severity: 'HIGH',
  type: 'regex',
  pattern: '\\badmin\\b',
  confidenceBoost: 40,
  enabled: true,
};

const badRegexRule: Rule = {
  ...regexRule,
  id: 'tr-002',
  pattern: '[invalid',
};

describe('matchExactRules', () => {
  it('finds exact matches with indices', () => {
    const matches = matchExactRules('start exact match phrase end', [exactRule]);
    expect(matches).toHaveLength(1);
    expect(matches[0].startIndex).toBe(6);
    expect(matches[0].endIndex).toBe(24);
  });

  it('finds multiple occurrences', () => {
    const matches = matchExactRules('exact match phrase and exact match phrase', [exactRule]);
    expect(matches).toHaveLength(2);
  });
});

describe('matchPatternRules', () => {
  it('finds contains matches', () => {
    const matches = matchPatternRules('has partial text inside', [containsRule]);
    expect(matches).toHaveLength(1);
  });

  it('finds regex word boundary matches', () => {
    const matches = matchPatternRules('login as admin user', [regexRule]);
    expect(matches).toHaveLength(1);
    expect(matches[0].matchedText).toBe('admin');
  });

  it('skips invalid regex rules without throwing', () => {
    const matches = matchPatternRules('admin access', [badRegexRule]);
    expect(matches).toHaveLength(0);
  });

  it('skips exact type rules', () => {
    const matches = matchPatternRules('exact match phrase', [exactRule]);
    expect(matches).toHaveLength(0);
  });
});
