import { Router } from 'express';
import { getAnalyticsSnapshot } from '../services/analytics.js';

export const analyticsRouter = Router();

analyticsRouter.get('/analytics', async (_req, res, next) => {
  try {
    const snapshot = await getAnalyticsSnapshot();
    res.json(snapshot);
  } catch (err) {
    next(err);
  }
});
