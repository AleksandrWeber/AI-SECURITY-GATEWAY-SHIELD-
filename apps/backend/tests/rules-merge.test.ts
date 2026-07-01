import { describe, expect, it } from 'vitest';
import type { Rule } from '@shield/types';
import { mergeRulesForTest } from '../src/services/rules.js';

describe('rules merge', () => {
  it('database rules override file rules with the same id', () => {
    const fileRules: Rule[] = [
      {
        id: 'po-001',
        name: 'File rule',
        category: 'prompt_override',
        language: ['en'],
        severity: 'HIGH',
        type: 'contains',
        pattern: 'file pattern',
        confidenceBoost: 30,
        enabled: true,
      },
    ];

    const dbRules: Rule[] = [
      {
        id: 'po-001',
        name: 'DB override',
        category: 'prompt_override',
        language: ['en'],
        severity: 'MEDIUM',
        type: 'contains',
        pattern: 'db pattern',
        confidenceBoost: 25,
        enabled: true,
      },
      {
        id: 'po-099',
        name: 'DB only',
        category: 'prompt_override',
        language: ['en'],
        severity: 'LOW',
        type: 'contains',
        pattern: 'new pattern',
        confidenceBoost: 20,
        enabled: true,
      },
    ];

    const merged = mergeRulesForTest(fileRules, dbRules);
    expect(merged).toHaveLength(2);
    expect(merged.find((rule) => rule.id === 'po-001')?.name).toBe('DB override');
    expect(merged.find((rule) => rule.id === 'po-099')?.name).toBe('DB only');
  });
});
