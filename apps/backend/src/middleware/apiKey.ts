import type { RequestHandler } from 'express';
import type { EnvConfig } from '../config.js';
import { resolveTeamApiKey, touchTeamApiKeyLastUsed } from '../services/teams.js';
import { extractApiKey } from './teamAdmin.js';

export function createApiKeyMiddleware(
  env: Pick<EnvConfig, 'apiKeyRequired' | 'apiKeys' | 'teamsEnabled' | 'teamAdminKey'>,
): RequestHandler {
  return async (req, res, next) => {
    const provided = extractApiKey(req);

    if (
      env.teamsEnabled &&
      env.teamAdminKey &&
      provided &&
      provided === env.teamAdminKey
    ) {
      next();
      return;
    }

    if (env.teamsEnabled && provided) {
      try {
        const lookup = await resolveTeamApiKey(provided);
        if (lookup) {
          req.team = {
            id: lookup.team.id,
            name: lookup.team.name,
            slug: lookup.team.slug,
          };
          req.teamApiKeyId = lookup.key.id;
          void touchTeamApiKeyLastUsed(lookup.key.id);
          next();
          return;
        }
      } catch (err) {
        next(err);
        return;
      }
    }

    if (provided && env.apiKeys.includes(provided)) {
      next();
      return;
    }

    if (!env.apiKeyRequired) {
      next();
      return;
    }

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
