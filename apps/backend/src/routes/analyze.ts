import { Router } from 'express';
import type { EnvConfig } from '../config.js';
import { analyzeRequestSchema } from '../schemas/analyze.js';
import { runAnalysis } from '../services/analyze.js';
import { detectPromptLanguage, resolveReportLanguage } from '../utils/language.js';

export function createAnalyzeRouter(env: Pick<EnvConfig, 'maxPromptLength'>) {
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

  return analyzeRouter;
}
