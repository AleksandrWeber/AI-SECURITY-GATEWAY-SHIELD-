import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { useDb } from '../db/query.js';
import {
  addFavorite,
  listFavorites,
  removeFavorite,
  submitFeedback,
} from '../services/favorites.js';

export const favoritesRouter = Router();

favoritesRouter.get('/favorites', async (_req, res, next) => {
  try {
    const items = await listFavorites();
    res.json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
});

favoritesRouter.post('/favorites/:analysisId', async (req, res, next) => {
  try {
    const ok = await addFavorite(req.params.analysisId);
    if (!ok) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Analysis not found' });
      return;
    }
    res.status(201).json({ ok: true, analysisId: req.params.analysisId });
  } catch (err) {
    next(err);
  }
});

favoritesRouter.delete('/favorites/:analysisId', async (req, res, next) => {
  try {
    await removeFavorite(req.params.analysisId);
    res.json({ ok: true, analysisId: req.params.analysisId });
  } catch (err) {
    next(err);
  }
});

const feedbackSchema = z.object({
  analysisId: z.string().min(1),
  type: z.literal('false_positive'),
  note: z.string().max(2000).optional(),
});

export const feedbackRouter = Router();

feedbackRouter.post('/feedback', async (req, res, next) => {
  try {
    const body = feedbackSchema.parse(req.body);
    const rows = await useDb(async ({ db, schema }) =>
      db.select().from(schema.analyses).where(eq(schema.analyses.id, body.analysisId)).limit(1),
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Analysis not found' });
      return;
    }

    const record = await submitFeedback({
      analysisId: body.analysisId,
      type: body.type,
      note: body.note,
      riskAtReport: rows[0].risk,
    });

    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});
