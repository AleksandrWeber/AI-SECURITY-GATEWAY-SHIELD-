import type { Risk } from '@shield/types';

export type FailOnRisk = Risk;

const RISK_RANK: Record<Risk, number> = {
  SAFE: 0,
  SUSPICIOUS: 1,
  MALICIOUS: 2,
};

export function riskMeetsThreshold(risk: Risk, threshold: FailOnRisk): boolean {
  return RISK_RANK[risk] >= RISK_RANK[threshold];
}

export function parseFailOnRisk(value: string): FailOnRisk {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'SAFE' || normalized === 'SUSPICIOUS' || normalized === 'MALICIOUS') {
    return normalized;
  }
  throw new Error(`Invalid fail-on-risk: ${value}`);
}
