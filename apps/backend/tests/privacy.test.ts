import { describe, expect, it } from 'vitest';
import { hashPrompt, redactSecrets } from '../src/utils/privacy.js';

describe('redactSecrets', () => {
  it('redacts OpenAI API keys', () => {
    const input = 'Use key sk-abcdefghijklmnopqrstuvwxyz1234567890 here';
    expect(redactSecrets(input)).not.toContain('sk-abc');
    expect(redactSecrets(input)).toContain('[REDACTED_OPENAI_KEY]');
  });

  it('redacts AWS keys', () => {
    const input = 'AKIAIOSFODNN7EXAMPLE';
    expect(redactSecrets(input)).toContain('[REDACTED_AWS_KEY]');
  });

  it('redacts bearer tokens', () => {
    const input = 'Authorization: bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9token';
    expect(redactSecrets(input)).toContain('[REDACTED_TOKEN]');
  });

  it('redacts password assignments', () => {
    expect(redactSecrets('password=supersecret')).toContain('[REDACTED]');
  });

  it('redacts SSN patterns', () => {
    expect(redactSecrets('SSN 123-45-6789')).toContain('[REDACTED_SSN]');
  });
});

describe('hashPrompt', () => {
  it('returns stable sha256 hex', () => {
    const a = hashPrompt('test prompt');
    const b = hashPrompt('test prompt');
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });
});
