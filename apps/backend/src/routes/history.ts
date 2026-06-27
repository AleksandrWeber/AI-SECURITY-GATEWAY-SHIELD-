import { Router } from 'express';
import { z } from 'zod';
import { getRecentAnalyses } from '../services/history.js';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const historyRouter = Router();

historyRouter.get('/history', async (req, res, next) => {
  try {
    const { limit } = querySchema.parse(req.query);
    const data = await getRecentAnalyses(limit);
    res.json(data);
  } catch (err) {
    next(err);
  }
});
