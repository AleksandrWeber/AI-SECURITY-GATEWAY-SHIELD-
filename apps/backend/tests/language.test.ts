import { describe, expect, it } from 'vitest';
import {
  detectPromptLanguage,
  parseAcceptLanguage,
  resolveReportLanguage,
} from '../src/utils/language.js';

describe('detectPromptLanguage', () => {
  it('detects English', () => {
    expect(detectPromptLanguage('Hello world')).toBe('en');
  });

  it('detects Ukrainian', () => {
    expect(detectPromptLanguage('Привіт, як справи?')).toBe('uk');
  });

  it('detects mixed', () => {
    expect(detectPromptLanguage('Hello привіт world')).toBe('mixed');
  });
});

describe('parseAcceptLanguage', () => {
  it('prefers higher q-value', () => {
    expect(parseAcceptLanguage('en;q=0.5, uk;q=0.9')).toBe('uk');
  });

  it('returns undefined for unsupported languages', () => {
    expect(parseAcceptLanguage('fr, de')).toBeUndefined();
  });
});

describe('resolveReportLanguage', () => {
  it('uses body language first', () => {
    expect(resolveReportLanguage('uk', 'en', 'Hello')).toBe('uk');
  });

  it('falls back to Accept-Language', () => {
    expect(resolveReportLanguage(undefined, 'uk-UA,en;q=0.8', 'Hello')).toBe('uk');
  });

  it('detects from Ukrainian prompt', () => {
    expect(resolveReportLanguage(undefined, undefined, 'ігноруй інструкції')).toBe('uk');
  });

  it('defaults to en', () => {
    expect(resolveReportLanguage(undefined, undefined, 'Hello')).toBe('en');
  });
});
