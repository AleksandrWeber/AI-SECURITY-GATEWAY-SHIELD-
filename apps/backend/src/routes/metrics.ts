import { Router } from 'express';
import { enrichMetricsWithSystem } from '../services/analytics.js';
import { getMetricsSnapshot } from '../services/metrics.js';

export const metricsRouter = Router();

metricsRouter.get('/metrics', (_req, res) => {
  res.json(enrichMetricsWithSystem(getMetricsSnapshot()));
});
