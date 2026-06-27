import { z } from 'zod';
import type { AnalysisResult } from '@shield/types';

const localizedTextSchema = z.object({
  en: z.string(),
  uk: z.string(),
});

const aiPartialSchema = z.object({
  risk: z.enum(['SAFE', 'SUSPICIOUS', 'MALICIOUS']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  confidence: z.number().min(0).max(100).optional(),
  confidenceReasons: z.array(z.string()).optional(),
  action: z.enum(['ALLOW', 'REVIEW', 'BLOCK', 'SANITIZE']).optional(),
  categories: z
    .array(
      z.enum([
        'prompt_override',
        'jailbreak',
        'extraction',
        'data_exfiltration',
        'tool_abuse',
        'pii_exposure',
      ]),
    )
    .optional(),
  explanation: localizedTextSchema.optional(),
  educationalNote: localizedTextSchema.optional(),
  recommendation: localizedTextSchema.optional(),
  safeAlternative: localizedTextSchema.optional(),
  aiInvoked: z.boolean().optional(),
  pipelineStage: z.enum(['exact', 'regex', 'ai', 'cache']).optional(),
});

export class AIParseError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AIParseError';
  }
}

/**
 * Parse raw AI provider output (JSON string or object) into a partial AnalysisResult.
 */
export function parseAIAnalysisResponse(raw: string | unknown): Partial<AnalysisResult> {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return aiPartialSchema.parse(data) as Partial<AnalysisResult>;
  } catch (err) {
    throw new AIParseError('Failed to parse AI analysis response', err);
  }
}

export { aiPartialSchema };
