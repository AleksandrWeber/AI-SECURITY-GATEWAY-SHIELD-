import { z } from 'zod';

export const createWebhookSchema = z.object({
  url: z.string().url().max(2048),
  secret: z.string().min(16).max(256).optional(),
  events: z.array(z.enum(['analysis.completed', 'analysis.blocked'])).min(1).optional(),
});

export const updateWebhookSchema = z.object({
  enabled: z.boolean(),
});

export type CreateWebhookBody = z.infer<typeof createWebhookSchema>;
