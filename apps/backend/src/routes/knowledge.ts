import { Router } from 'express';
import type { EnvConfig } from '../config.js';
import {
  listPendingQuerySchema,
  reviewSuggestionSchema,
  suggestRuleSchema,
} from '../schemas/knowledge.js';
import {
  createRuleSuggestion,
  getPendingSuggestion,
  listPendingSuggestions,
  reviewSuggestion,
} from '../services/knowledge.js';
import { detectPromptLanguage, resolveReportLanguage } from '../utils/language.js';

type KnowledgeEnv = Pick<
  EnvConfig,
  'ruleSuggestionsEnabled' | 'maxPromptLength'
>;

export function createKnowledgeRouter(env: KnowledgeEnv) {
  const router = Router();

  router.get('/knowledge/pending', async (req, res, next) => {
    try {
      if (!env.ruleSuggestionsEnabled) {
        res.status(503).json({
          error: 'SUGGESTIONS_DISABLED',
          message: 'Rule suggestions are disabled',
        });
        return;
      }

      const query = listPendingQuerySchema.parse(req.query);
      const items = await listPendingSuggestions(query.status ?? 'pending');
      res.json({ items, total: items.length, status: query.status ?? 'pending' });
    } catch (err) {
      next(err);
    }
  });

  router.get('/knowledge/pending/:id', async (req, res, next) => {
    try {
      if (!env.ruleSuggestionsEnabled) {
        res.status(503).json({
          error: 'SUGGESTIONS_DISABLED',
          message: 'Rule suggestions are disabled',
        });
        return;
      }

      const item = await getPendingSuggestion(req.params.id);
      if (!item) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Suggestion not found' });
        return;
      }
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.post('/knowledge/pending/suggest', async (req, res, next) => {
    try {
      if (!env.ruleSuggestionsEnabled) {
        res.status(503).json({
          error: 'SUGGESTIONS_DISABLED',
          message: 'Rule suggestions are disabled',
        });
        return;
      }

      const body = suggestRuleSchema.parse(req.body);
      if (body.prompt.length > env.maxPromptLength) {
        res.status(400).json({
          error: 'PROMPT_TOO_LONG',
          message: `Prompt exceeds maximum length of ${env.maxPromptLength}`,
        });
        return;
      }

      const acceptLanguage = req.header('accept-language');
      const language = resolveReportLanguage(body.language, acceptLanguage, body.prompt);
      detectPromptLanguage(body.prompt);

      const created = await createRuleSuggestion({
        prompt: body.prompt,
        language,
        analysisId: body.analysisId,
        source: 'manual',
      });

      if (!created) {
        res.status(409).json({
          error: 'DUPLICATE_PENDING',
          message: 'A pending suggestion already exists for this prompt hash',
        });
        return;
      }

      res.status(201).json(created);
    } catch (err) {
      if (err instanceof Error && err.message === 'SUGGESTION_LIMIT_REACHED') {
        res.status(400).json({
          error: 'SUGGESTION_LIMIT_REACHED',
          message: 'Maximum pending suggestions reached',
        });
        return;
      }
      next(err);
    }
  });

  router.post('/knowledge/pending/:id/approve', async (req, res, next) => {
    try {
      if (!env.ruleSuggestionsEnabled) {
        res.status(503).json({
          error: 'SUGGESTIONS_DISABLED',
          message: 'Rule suggestions are disabled',
        });
        return;
      }

      const body = reviewSuggestionSchema.parse(req.body ?? {});
      const reviewed = await reviewSuggestion({
        id: req.params.id,
        status: 'approved',
        note: body.note,
      });

      if (!reviewed) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Pending suggestion not found' });
        return;
      }

      res.json(reviewed);
    } catch (err) {
      next(err);
    }
  });

  router.post('/knowledge/pending/:id/reject', async (req, res, next) => {
    try {
      if (!env.ruleSuggestionsEnabled) {
        res.status(503).json({
          error: 'SUGGESTIONS_DISABLED',
          message: 'Rule suggestions are disabled',
        });
        return;
      }

      const body = reviewSuggestionSchema.parse(req.body ?? {});
      const reviewed = await reviewSuggestion({
        id: req.params.id,
        status: 'rejected',
        note: body.note,
      });

      if (!reviewed) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Pending suggestion not found' });
        return;
      }

      res.json(reviewed);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
