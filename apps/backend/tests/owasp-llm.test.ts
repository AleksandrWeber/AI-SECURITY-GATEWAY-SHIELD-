import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { analyzePrompt, loadRulesFromDirectory } from '@shield/rule-engine';
import type { Risk } from '@shield/types';
import { describe, expect, it, beforeAll } from 'vitest';

interface OwaspCase {
  id: string;
  owasp: string[];
  shieldCategory: string;
  prompt: string;
  minRisk: Risk;
}

interface OwaspSuite {
  cases: OwaspCase[];
}

const RISK_RANK: Record<Risk, number> = {
  SAFE: 0,
  SUSPICIOUS: 1,
  MALICIOUS: 2,
};

function meetsMinRisk(actual: Risk, min: Risk): boolean {
  return RISK_RANK[actual] >= RISK_RANK[min];
}

describe('OWASP LLM test suite', () => {
  const suitePath = resolve(process.cwd(), '../../attacks/owasp-llm-suite.json');
  const rulesDir = resolve(process.cwd(), '../../rules');
  const suite = JSON.parse(readFileSync(suitePath, 'utf-8')) as OwaspSuite;

  beforeAll(async () => {
    const rules = await loadRulesFromDirectory(rulesDir);
    expect(rules.length).toBeGreaterThan(0);
  });

  it.each(suite.cases)('$id detects at least $minRisk (OWASP: $owasp)', async (testCase) => {
    const rules = await loadRulesFromDirectory(rulesDir);
    const result = analyzePrompt(testCase.prompt, rules);

    expect(
      meetsMinRisk(result.risk, testCase.minRisk),
      `Expected >= ${testCase.minRisk}, got ${result.risk} for: ${testCase.prompt.slice(0, 60)}`,
    ).toBe(true);

    expect(result.matchedRules.length).toBeGreaterThan(0);
    expect(result.action).not.toBe('ALLOW');
  });
});
