import { Router } from 'express';
import type { EnvConfig } from '../config.js';
import { analyzeRequestSchema, batchAnalyzeRequestSchema } from '../schemas/analyze.js';
import { runAnalysis } from '../services/analyze.js';
import { runBatchAnalysis } from '../services/batch.js';
import { detectPromptLanguage, resolveReportLanguage } from '../utils/language.js';

type AnalyzeEnv = Pick<
  EnvConfig,
  'maxPromptLength' | 'batchMaxItems' | 'batchConcurrency'
>;

export function createAnalyzeRouter(env: AnalyzeEnv) {
  const analyzeRouter = Router();

  analyzeRouter.post('/', async (req, res, next) => {
    try {
      const parsed = analyzeRequestSchema.parse(req.body);

      if (parsed.prompt.length > env.maxPromptLength) {
        res.status(400).json({
          error: 'PROMPT_TOO_LONG',
          message: `Prompt exceeds maximum length of ${env.maxPromptLength}`,
        });
        return;
      }

      const acceptLanguage = req.header('accept-language');
      const language = resolveReportLanguage(parsed.language, acceptLanguage, parsed.prompt);
      const detectedLanguage = detectPromptLanguage(parsed.prompt);

      const result = await runAnalysis(parsed.prompt, parsed.mode, language, detectedLanguage, {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.header('user-agent'),
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  analyzeRouter.post('/batch', async (req, res, next) => {
    try {
      const parsed = batchAnalyzeRequestSchema.parse(req.body);

      if (parsed.items.length > env.batchMaxItems) {
        res.status(400).json({
          error: 'BATCH_TOO_LARGE',
          message: `Batch exceeds maximum of ${env.batchMaxItems} items`,
        });
        return;
      }

      const acceptLanguage = req.header('accept-language');
      const response = await runBatchAnalysis({
        items: parsed.items,
        defaults: { mode: parsed.mode, language: parsed.language },
        acceptLanguage,
        audit: {
          method: req.method,
          path: req.path,
          ip: req.ip,
          userAgent: req.header('user-agent'),
        },
        concurrency: env.batchConcurrency,
        maxPromptLength: env.maxPromptLength,
        resolveLanguage: resolveReportLanguage,
        detectLanguage: detectPromptLanguage,
      });

      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  return analyzeRouter;
}
