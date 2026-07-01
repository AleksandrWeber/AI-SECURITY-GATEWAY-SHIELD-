import { loadRulesFromDirectory } from '@shield/rule-engine';
import type { Rule } from '@shield/types';
import { env } from '../config.js';
import { isRulesDbEnabled, loadEnabledDbRules } from './db-rules.js';

let rulesCache: Rule[] | null = null;
let fileRulesCount = 0;

function shouldReloadRulesEachRequest(): boolean {
  return env.nodeEnv === 'development' || env.nodeEnv === 'test';
}

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

async function loadRules(): Promise<Rule[]> {
  const fileRules = await loadRulesFromDirectory(env.rulesDir);
  fileRulesCount = fileRules.length;
  const dbRules = isRulesDbEnabled() ? await loadEnabledDbRules() : [];
  return mergeRules(fileRules, dbRules);
}

export async function getRules(): Promise<Rule[]> {
  if (shouldReloadRulesEachRequest()) {
    return loadRules();
  }

  if (!rulesCache) {
    rulesCache = await loadRules();
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
