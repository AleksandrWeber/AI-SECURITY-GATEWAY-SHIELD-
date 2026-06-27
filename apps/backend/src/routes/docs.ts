import { readFile } from 'node:fs/promises';
import { Router } from 'express';
import type { EnvConfig } from '../config.js';

export function createDocsRouter(env: Pick<EnvConfig, 'openapiPath'>) {
  const router = Router();

  router.get('/openapi.yaml', async (_req, res, next) => {
    try {
      const spec = await readFile(env.openapiPath, 'utf-8');
      res.type('text/yaml').send(spec);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
