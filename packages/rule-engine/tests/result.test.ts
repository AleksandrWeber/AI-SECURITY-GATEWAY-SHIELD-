import { describe, expect, it } from 'vitest';
import { createEmptyResult, generateAnalysisId } from '../src/result.js';

describe('result helpers', () => {
  it('generateAnalysisId returns uuid format', () => {
    expect(generateAnalysisId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('createEmptyResult fills defaults', () => {
    const id = generateAnalysisId();
    const result = createEmptyResult({ analysisId: id, rulesVersion: '1.0.0' });

    expect(result.analysisId).toBe(id);
    expect(result.rulesVersion).toBe('1.0.0');
    expect(result.risk).toBe('SAFE');
    expect(result.action).toBe('ALLOW');
    expect(result.explanation.en).toBe('');
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('createEmptyResult respects partial overrides', () => {
    const result = createEmptyResult({
      analysisId: generateAnalysisId(),
      rulesVersion: '2.0.0',
      risk: 'MALICIOUS',
      action: 'BLOCK',
      language: 'uk',
    });

    expect(result.risk).toBe('MALICIOUS');
    expect(result.language).toBe('uk');
  });
});
