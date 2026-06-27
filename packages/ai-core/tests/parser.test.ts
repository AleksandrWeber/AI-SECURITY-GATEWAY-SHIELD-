import { describe, expect, it } from 'vitest';
import { AIParseError, parseAIAnalysisResponse } from '../src/parser.js';

describe('parseAIAnalysisResponse', () => {
  it('parses valid JSON string', () => {
    const result = parseAIAnalysisResponse(
      JSON.stringify({
        risk: 'SUSPICIOUS',
        confidence: 70,
        explanation: { en: 'Test', uk: 'Тест' },
      }),
    );
    expect(result.risk).toBe('SUSPICIOUS');
    expect(result.confidence).toBe(70);
  });

  it('parses valid object', () => {
    const result = parseAIAnalysisResponse({
      action: 'REVIEW',
      pipelineStage: 'ai',
    });
    expect(result.action).toBe('REVIEW');
  });

  it('throws AIParseError on invalid payload', () => {
    expect(() => parseAIAnalysisResponse({ confidence: 200 })).toThrow(AIParseError);
  });

  it('throws AIParseError on invalid JSON string', () => {
    expect(() => parseAIAnalysisResponse('{ bad json')).toThrow(AIParseError);
  });
});
