import { Router } from 'express';
import type { EnvConfig } from '../config.js';
import { getSystemStatus } from '../services/status.js';

export function createStatusRouter(env: EnvConfig) {
  const router = Router();

  router.get('/status', async (_req, res, next) => {
    try {
      const status = await getSystemStatus(env);
      res.json(status);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
