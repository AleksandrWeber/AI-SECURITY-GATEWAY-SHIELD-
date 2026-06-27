import { z } from 'zod';

export const analyzeRequestSchema = z.object({
  prompt: z.string().min(1).max(32000),
  mode: z.enum(['quick', 'detailed']).optional().default('quick'),
  /** Report language — optional; falls back to Accept-Language or prompt detection */
  language: z.enum(['en', 'uk']).optional(),
});

export const batchAnalyzeItemSchema = z.object({
  id: z.string().min(1).max(128).optional(),
  prompt: z.string().min(1).max(32000),
  mode: z.enum(['quick', 'detailed']).optional(),
  language: z.enum(['en', 'uk']).optional(),
});

export const batchAnalyzeRequestSchema = z.object({
  items: z.array(batchAnalyzeItemSchema).min(1),
  mode: z.enum(['quick', 'detailed']).optional().default('quick'),
  language: z.enum(['en', 'uk']).optional(),
});

export type AnalyzeRequestBody = z.infer<typeof analyzeRequestSchema>;
export type BatchAnalyzeRequestBody = z.infer<typeof batchAnalyzeRequestSchema>;
