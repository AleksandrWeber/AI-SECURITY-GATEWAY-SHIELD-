import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Rule } from '@shield/types';
import { RuleValidationError, validateRuleFile } from './schema.js';

export interface LoadRulesOptions {
  /** Skip disabled rules. Default: true */
  enabledOnly?: boolean;
}

export interface LoadRulesResult {
  rules: Rule[];
  filesLoaded: number;
  rulesSkipped: number;
}

/**
 * Load and validate all rules from a directory of JSON rule files.
 * Throws RuleValidationError if any file fails schema validation.
 */
export async function loadRulesFromDirectory(
  rulesDir: string,
  options: LoadRulesOptions = {},
): Promise<Rule[]> {
  const result = await loadRulesFromDirectoryDetailed(rulesDir, options);
  return result.rules;
}

export async function loadRulesFromDirectoryDetailed(
  rulesDir: string,
  options: LoadRulesOptions = {},
): Promise<LoadRulesResult> {
  const enabledOnly = options.enabledOnly ?? true;
  const entries = await readdir(rulesDir);
  const jsonFiles = entries.filter((f) => f.endsWith('.json')).sort();

  const allRules: Rule[] = [];
  let rulesSkipped = 0;

  for (const file of jsonFiles) {
    const content = await readFile(join(rulesDir, file), 'utf-8');
    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch {
      throw new RuleValidationError(`Invalid JSON in rule file: ${file}`, file, []);
    }

    const ruleFile = validateRuleFile(parsed, file);

    for (const rule of ruleFile.rules) {
      if (enabledOnly && !rule.enabled) {
        rulesSkipped++;
        continue;
      }
      allRules.push(rule);
    }
  }

  return {
    rules: allRules,
    filesLoaded: jsonFiles.length,
    rulesSkipped,
  };
}
