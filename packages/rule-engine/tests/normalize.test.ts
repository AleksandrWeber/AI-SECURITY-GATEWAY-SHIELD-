import { describe, expect, it } from 'vitest';
import { normalizePrompt } from '../src/normalize.js';

describe('normalizePrompt', () => {
  it('lowercases text', () => {
    expect(normalizePrompt('HELLO World')).toBe('hello world');
  });

  it('collapses whitespace', () => {
    expect(normalizePrompt('  hello   world  ')).toBe('hello world');
  });

  it('strips zero-width characters', () => {
    expect(normalizePrompt('test\u200Bvalue')).toBe('testvalue');
  });

  it('applies NFC normalization', () => {
    const decomposed = 'e\u0301';
    expect(normalizePrompt(decomposed)).toBe('é');
  });

  it('handles empty string', () => {
    expect(normalizePrompt('')).toBe('');
  });
});
