import { loadRulesFromDirectory } from '@shield/rule-engine';
import type { Rule } from '@shield/types';
import { env } from '../config.js';

let rulesCache: Rule[] | null = null;

export async function getRules(): Promise<Rule[]> {
  if (!rulesCache) {
    rulesCache = await loadRulesFromDirectory(env.rulesDir);
  }
  return rulesCache;
}

export function reloadRules(): void {
  rulesCache = null;
}

export function resetRulesCache(): void {
  rulesCache = null;
}
