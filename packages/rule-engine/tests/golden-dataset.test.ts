import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, beforeAll } from 'vitest';
import type { Action, DetectionCategory, Risk, Rule } from '@shield/types';
import { analyzePrompt, loadRulesFromDirectory } from '../src/index.js';

interface GoldenEntry {
  id: string;
  group: 'malicious' | 'suspicious' | 'safe';
  language: 'en' | 'uk';
  prompt: string;
  expectedRisk: Risk;
  expectedAction: Action;
  expectedCategories?: DetectionCategory[];
}

interface GoldenDataset {
  version: string;
  prompts: GoldenEntry[];
}

const rulesDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../rules');
const datasetPath = resolve(dirname(fileURLToPath(import.meta.url)), 'golden-dataset.json');

describe('golden dataset', () => {
  let rules: Rule[];
  let entries: GoldenEntry[];

  beforeAll(async () => {
    rules = await loadRulesFromDirectory(rulesDir);
    const dataset = JSON.parse(readFileSync(datasetPath, 'utf-8')) as GoldenDataset;
    entries = dataset.prompts;
  });

  it('contains 117 prompts in expected groups (V2 categories included)', () => {
    expect(entries).toHaveLength(117);
    const groups = entries.reduce(
      (acc, p) => {
        acc[p.group] = (acc[p.group] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    expect(groups.malicious).toBe(57);
    expect(groups.suspicious).toBe(20);
    expect(groups.safe).toBe(40);
  });

  it('evaluates all golden prompts correctly', () => {
    const failures: string[] = [];

    for (const entry of entries) {
      const result = analyzePrompt(entry.prompt, rules, { language: entry.language });

      if (result.risk !== entry.expectedRisk) {
        failures.push(`${entry.id}: expected risk ${entry.expectedRisk}, got ${result.risk}`);
      }

      if (result.action !== entry.expectedAction) {
        failures.push(`${entry.id}: expected action ${entry.expectedAction}, got ${result.action}`);
      }

      if (entry.expectedCategories?.length) {
        for (const cat of entry.expectedCategories) {
          if (!result.categories.includes(cat)) {
            failures.push(`${entry.id}: expected category ${cat} missing`);
          }
        }
      }

      if (entry.group === 'safe' && result.matchedRules.length > 0) {
        failures.push(
          `${entry.id}: safe prompt matched rules: ${result.matchedRules.map((r) => r.id).join(', ')}`,
        );
      }
    }

    expect(failures, failures.join('\n')).toEqual([]);
  });
});
