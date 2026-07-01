import { loadRulesFromDirectory } from '@shield/rule-engine';
import type { Rule } from '@shield/types';
import { env } from '../config.js';
import { isRulesDbEnabled, loadEnabledDbRules } from './db-rules.js';

let rulesCache: Rule[] | null = null;
let fileRulesCount = 0;

function mergeRules(fileRules: Rule[], dbRules: Rule[]): Rule[] {
  const byId = new Map<string, Rule>();
  for (const rule of fileRules) {
    byId.set(rule.id, rule);
  }
  for (const rule of dbRules) {
    byId.set(rule.id, rule);
  }
  return [...byId.values()];
}

/** @internal test helper */
export function mergeRulesForTest(fileRules: Rule[], dbRules: Rule[]): Rule[] {
  return mergeRules(fileRules, dbRules);
}

export async function getRules(): Promise<Rule[]> {
  if (!rulesCache) {
    const fileRules = await loadRulesFromDirectory(env.rulesDir);
    fileRulesCount = fileRules.length;
    const dbRules = isRulesDbEnabled() ? await loadEnabledDbRules() : [];
    rulesCache = mergeRules(fileRules, dbRules);
  }
  return rulesCache;
}

export function getFileRulesCount(): number {
  return fileRulesCount;
}

export function reloadRules(): void {
  rulesCache = null;
  fileRulesCount = 0;
}

export function resetRulesCache(): void {
  reloadRules();
}
