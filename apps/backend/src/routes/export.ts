import { Router } from 'express';
import { z } from 'zod';
import type { AnalysisResult } from '@shield/types';
import { generateAnalysisPdf } from '../services/pdf.js';
import { getAnalysisById } from '../services/storage.js';

const languageQuerySchema = z.object({
  language: z.enum(['en', 'uk']).optional(),
});

const exportBodySchema = z
  .object({
    language: z.enum(['en', 'uk']).optional(),
    analysisId: z.string().uuid(),
    risk: z.enum(['SAFE', 'SUSPICIOUS', 'MALICIOUS']),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    confidence: z.number(),
    action: z.enum(['ALLOW', 'REVIEW', 'BLOCK', 'SANITIZE']),
    explanation: z.object({ en: z.string(), uk: z.string() }),
    recommendation: z.object({ en: z.string(), uk: z.string() }),
    educationalNote: z.object({ en: z.string(), uk: z.string() }),
    safeAlternative: z.object({ en: z.string(), uk: z.string() }),
    matchedRules: z.array(z.unknown()),
    dangerousFragments: z.array(z.unknown()),
    categories: z.array(z.string()),
    confidenceReasons: z.array(z.string()).optional(),
    detectedLanguage: z.enum(['en', 'uk', 'mixed']).optional(),
    timestamp: z.string(),
    rulesVersion: z.string(),
    aiInvoked: z.boolean(),
    pipelineStage: z.string(),
    processingTimeMs: z.number(),
  })
  .passthrough();

function sendPdf(
  res: import('express').Response,
  pdf: Buffer,
  analysisId: string,
): void {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="shield-report-${analysisId}.pdf"`);
  res.send(pdf);
}

export const exportRouter = Router();

exportRouter.get('/analyze/:id/export.pdf', async (req, res, next) => {
  try {
    const query = languageQuerySchema.parse(req.query);
    const result = await getAnalysisById(req.params.id);

    if (!result) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Analysis not found' });
      return;
    }

    const language = query.language ?? result.language ?? 'en';
    const pdf = await generateAnalysisPdf(result, language);
    sendPdf(res, pdf, result.analysisId);
  } catch (err) {
    next(err);
  }
});

exportRouter.post('/analyze/export.pdf', async (req, res, next) => {
  try {
    const parsed = exportBodySchema.parse(req.body) as unknown as AnalysisResult;
    const language = parsed.language ?? 'en';
    const pdf = await generateAnalysisPdf(parsed, language);
    sendPdf(res, pdf, parsed.analysisId);
  } catch (err) {
    next(err);
  }
});
