import { describe, expect, it } from 'vitest';
import { parseFailOnRisk, riskMeetsThreshold } from '../src/risk.js';

describe('riskMeetsThreshold', () => {
  it('treats MALICIOUS as meeting SUSPICIOUS threshold', () => {
    expect(riskMeetsThreshold('MALICIOUS', 'SUSPICIOUS')).toBe(true);
  });

  it('does not fail SAFE at SUSPICIOUS threshold', () => {
    expect(riskMeetsThreshold('SAFE', 'SUSPICIOUS')).toBe(false);
  });

  it('only fails MALICIOUS at MALICIOUS threshold', () => {
    expect(riskMeetsThreshold('SUSPICIOUS', 'MALICIOUS')).toBe(false);
    expect(riskMeetsThreshold('MALICIOUS', 'MALICIOUS')).toBe(true);
  });
});

describe('parseFailOnRisk', () => {
  it('parses case-insensitive values', () => {
    expect(parseFailOnRisk('malicious')).toBe('MALICIOUS');
  });

  it('rejects invalid values', () => {
    expect(() => parseFailOnRisk('high')).toThrow(/Invalid fail-on-risk/);
  });
});
