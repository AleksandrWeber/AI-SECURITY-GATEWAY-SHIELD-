import type { RequestHandler } from 'express';
import type { EnvConfig } from '../config.js';

export function createApiKeyMiddleware(
  env: Pick<EnvConfig, 'apiKeyRequired' | 'apiKeys'>,
): RequestHandler {
  return (req, res, next) => {
    if (!env.apiKeyRequired) {
      next();
      return;
    }

    const headerKey = req.header('x-api-key');
    const authHeader = req.header('authorization');
    const bearerKey =
      authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : undefined;
    const provided = headerKey ?? bearerKey;

    if (!provided || !env.apiKeys.includes(provided)) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Valid API key required (X-API-Key or Authorization: Bearer)',
      });
      return;
    }

    next();
  };
}
