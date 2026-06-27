import type { Rule } from '@shield/types';

export interface RuleMatch {
  rule: Rule;
  matchedText: string;
  startIndex: number;
  endIndex: number;
}

export function matchExactRules(normalizedPrompt: string, rules: Rule[]): RuleMatch[] {
  const matches: RuleMatch[] = [];

  for (const rule of rules) {
    if (rule.type !== 'exact') continue;
    const pattern = rule.pattern.toLowerCase();
    let searchFrom = 0;
    let index = normalizedPrompt.indexOf(pattern, searchFrom);
    while (index !== -1) {
      matches.push({
        rule,
        matchedText: pattern,
        startIndex: index,
        endIndex: index + pattern.length,
      });
      searchFrom = index + pattern.length;
      index = normalizedPrompt.indexOf(pattern, searchFrom);
    }
  }

  return matches;
}

export function matchPatternRules(normalizedPrompt: string, rules: Rule[]): RuleMatch[] {
  const matches: RuleMatch[] = [];

  for (const rule of rules) {
    if (rule.type === 'exact') continue;

    try {
      if (rule.type === 'contains') {
        const pattern = rule.pattern.toLowerCase();
        let searchFrom = 0;
        let index = normalizedPrompt.indexOf(pattern, searchFrom);
        while (index !== -1) {
          matches.push({
            rule,
            matchedText: normalizedPrompt.slice(index, index + pattern.length),
            startIndex: index,
            endIndex: index + pattern.length,
          });
          searchFrom = index + 1;
          index = normalizedPrompt.indexOf(pattern, searchFrom);
        }
      } else if (rule.type === 'regex') {
        const regex = new RegExp(rule.pattern, 'gi');
        let match: RegExpExecArray | null;
        while ((match = regex.exec(normalizedPrompt)) !== null) {
          matches.push({
            rule,
            matchedText: match[0],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
          });
          if (match[0].length === 0) regex.lastIndex++;
        }
      }
    } catch {
      // Invalid regex — skip rule silently in V0; Phase 1 adds validation
    }
  }

  return matches;
}
