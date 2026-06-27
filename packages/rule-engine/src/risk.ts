import type { Action, Risk, Severity } from '@shield/types';
import type { RuleMatch } from './matchers.js';

const SEVERITY_RANK: Record<Severity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

export function evaluateConfidence(matches: RuleMatch[]): {
  confidence: number;
  confidenceReasons: string[];
} {
  if (matches.length === 0) {
    return { confidence: 0, confidenceReasons: ['No rules matched'] };
  }

  let confidence = 0;
  const reasons: string[] = [];

  for (const match of matches) {
    confidence += match.rule.confidenceBoost;
    reasons.push(`Matched rule: ${match.rule.name} (${match.rule.type})`);
  }

  return {
    confidence: Math.min(confidence, 100),
    confidenceReasons: reasons,
  };
}

export function aggregateRisk(
  matches: RuleMatch[],
  confidence: number,
): { risk: Risk; severity: Severity; action: Action } {
  if (matches.length === 0) {
    return { risk: 'SAFE', severity: 'LOW', action: 'ALLOW' };
  }

  const severity = matches.reduce<Severity>((max, m) => {
    return SEVERITY_RANK[m.rule.severity] > SEVERITY_RANK[max] ? m.rule.severity : max;
  }, 'LOW');

  let risk: Risk = 'SUSPICIOUS';
  if (severity === 'HIGH') {
    risk = 'MALICIOUS';
  } else if (severity === 'LOW' && confidence < 30) {
    risk = 'SUSPICIOUS';
  }

  const action: Action =
    risk === 'MALICIOUS' ? 'BLOCK' : risk === 'SUSPICIOUS' ? 'REVIEW' : 'ALLOW';

  return { risk, severity, action };
}
