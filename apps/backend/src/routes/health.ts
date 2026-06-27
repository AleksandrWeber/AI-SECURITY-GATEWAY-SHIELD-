import { Router } from 'express';

const startedAt = Date.now();

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    uptime: Math.floor((Date.now() - startedAt) / 1000),
  });
});

healthRouter.get('/ready', (_req, res) => {
  res.json({ ready: true });
});

healthRouter.get('/live', (_req, res) => {
  res.json({ live: true });
});
