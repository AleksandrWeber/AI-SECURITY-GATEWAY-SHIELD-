import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadRulesFromDirectory } from './loader.js';
import {
  RuleValidationError,
  parseRule,
  parseRuleFile,
  validateRuleFile,
} from './schema.js';

const rulesDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../rules');

const validRule = {
  id: 'jb-001',
  name: 'Test rule',
  category: 'jailbreak',
  language: ['en', 'universal'],
  severity: 'HIGH',
  type: 'contains',
  pattern: 'ignore instructions',
  confidenceBoost: 40,
  enabled: true,
};

describe('ruleSchema', () => {
  it('accepts a valid rule', () => {
    expect(parseRule(validRule)).toMatchObject({ id: 'jb-001' });
  });

  it('rejects invalid rule id format', () => {
    expect(() => parseRule({ ...validRule, id: 'invalid' })).toThrow();
  });

  it('rejects confidenceBoost out of range', () => {
    expect(() => parseRule({ ...validRule, confidenceBoost: 150 })).toThrow();
  });

  it('rejects invalid regex pattern', () => {
    expect(() => parseRule({ ...validRule, type: 'regex', pattern: '[invalid' })).toThrow();
  });

  it('accepts valid regex pattern', () => {
    expect(
      parseRule({ ...validRule, type: 'regex', pattern: '\\bjailbreak\\b' }),
    ).toMatchObject({ type: 'regex' });
  });
});

describe('ruleFileSchema', () => {
  it('accepts a valid rule file', () => {
    const file = parseRuleFile({
      version: '1.0.0',
      category: 'jailbreak',
      rules: [validRule],
    });
    expect(file.rules).toHaveLength(1);
  });

  it('rejects rule category mismatch with file category', () => {
    expect(() =>
      validateRuleFile(
        {
          version: '1.0.0',
          category: 'jailbreak',
          rules: [{ ...validRule, category: 'extraction' }],
        },
        'test.json',
      ),
    ).toThrow(RuleValidationError);
  });

  it('rejects duplicate rule ids in same file', () => {
    expect(() =>
      validateRuleFile(
        {
          version: '1.0.0',
          category: 'jailbreak',
          rules: [validRule, validRule],
        },
        'test.json',
      ),
    ).toThrow(RuleValidationError);
  });

  it('formats validation errors with paths', () => {
    try {
      validateRuleFile({ version: 'bad', category: 'jailbreak', rules: [] }, 'bad.json');
    } catch (err) {
      expect(err).toBeInstanceOf(RuleValidationError);
      const validationErr = err as RuleValidationError;
      expect(validationErr.formatIssues().length).toBeGreaterThan(0);
    }
  });
});

describe('loadRulesFromDirectory', () => {
  it('loads and validates all production rule files', async () => {
    const rules = await loadRulesFromDirectory(rulesDir);
    expect(rules).toHaveLength(48);
    expect(rules.every((r) => r.id && r.pattern)).toBe(true);
  });
});
