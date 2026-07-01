import type { RequestHandler } from 'express';
import type { EnvConfig } from '../config.js';

export function extractApiKey(req: {
  header(name: string): string | undefined;
}): string | undefined {
  const headerKey = req.header('x-api-key');
  const authHeader = req.header('authorization');
  const bearerKey =
    authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : undefined;
  return headerKey ?? bearerKey;
}

export function createTeamAdminMiddleware(
  env: Pick<EnvConfig, 'teamsEnabled' | 'teamAdminKey'>,
): RequestHandler {
  return (req, res, next) => {
    if (!env.teamsEnabled) {
      res.status(503).json({ error: 'TEAMS_DISABLED', message: 'Team features are disabled' });
      return;
    }

    if (!env.teamAdminKey) {
      res.status(503).json({
        error: 'TEAM_ADMIN_NOT_CONFIGURED',
        message: 'Set TEAM_ADMIN_KEY to manage teams',
      });
      return;
    }

    const provided = extractApiKey(req);
    if (provided !== env.teamAdminKey) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Valid team admin API key required',
      });
      return;
    }

    next();
  };
}
