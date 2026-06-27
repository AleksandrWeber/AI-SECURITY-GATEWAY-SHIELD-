import { z } from 'zod';

export const suggestRuleSchema = z.object({
  prompt: z.string().min(1).max(32000),
  language: z.enum(['en', 'uk']).optional(),
  analysisId: z.string().uuid().optional(),
});

export const reviewSuggestionSchema = z.object({
  note: z.string().max(1000).optional(),
});

export const listPendingQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});
