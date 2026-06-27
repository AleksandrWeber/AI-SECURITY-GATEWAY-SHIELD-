import { Router } from 'express';
import { getMetricsSnapshot } from '../services/metrics.js';

export const metricsRouter = Router();

metricsRouter.get('/metrics', (_req, res) => {
  res.json(getMetricsSnapshot());
});
