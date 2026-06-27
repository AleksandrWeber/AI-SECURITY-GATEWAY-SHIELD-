import { z } from 'zod';

export const analyzeRequestSchema = z.object({
  prompt: z.string().min(1).max(32000),
  mode: z.enum(['quick', 'detailed']).optional().default('quick'),
  /** Report language — optional; falls back to Accept-Language or prompt detection */
  language: z.enum(['en', 'uk']).optional(),
});

export type AnalyzeRequestBody = z.infer<typeof analyzeRequestSchema>;
