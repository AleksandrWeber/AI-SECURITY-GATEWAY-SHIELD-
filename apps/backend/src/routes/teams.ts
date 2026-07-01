import { Router } from 'express';
import { z } from 'zod';
import type { EnvConfig } from '../config.js';
import { createTeamAdminMiddleware, extractApiKey } from '../middleware/teamAdmin.js';
import { resolveTeamApiKey, touchTeamApiKeyLastUsed } from '../services/teams.js';
import {
  createTeam,
  createTeamApiKey,
  getTeamAnalytics,
  getTeamById,
  listTeamApiKeys,
  listTeams,
  revokeTeamApiKey,
} from '../services/teams.js';

const createTeamSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

const createKeySchema = z.object({
  name: z.string().min(1).max(120),
});

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

type TeamsEnv = Pick<EnvConfig, 'teamsEnabled' | 'teamAdminKey'>;

export function createTeamsRouter(env: TeamsEnv) {
  const router = Router();
  const admin = createTeamAdminMiddleware(env);

  router.use(async (req, _res, next) => {
    const provided = extractApiKey(req);
    if (!provided) {
      next();
      return;
    }

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
      }
    } catch (err) {
      next(err);
      return;
    }

    next();
  });

  router.get('/teams/me', (req, res) => {
    if (!env.teamsEnabled) {
      res.status(503).json({ error: 'TEAMS_DISABLED', message: 'Team features are disabled' });
      return;
    }

    if (!req.team) {
      res.status(401).json({
        error: 'TEAM_KEY_REQUIRED',
        message: 'Authenticate with a team API key (shld_…)',
      });
      return;
    }

    res.json(req.team);
  });

  router.get('/teams', admin, async (_req, res, next) => {
    try {
      const items = await listTeams();
      res.json({ items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  router.post('/teams', admin, async (req, res, next) => {
    try {
      const body = createTeamSchema.parse(req.body);
      const created = await createTeam(body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.get('/teams/:teamId', admin, async (req, res, next) => {
    try {
      const team = await getTeamById(param(req.params.teamId));
      if (!team) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Team not found' });
        return;
      }
      res.json(team);
    } catch (err) {
      next(err);
    }
  });

  router.get('/teams/:teamId/keys', admin, async (req, res, next) => {
    try {
      const team = await getTeamById(param(req.params.teamId));
      if (!team) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Team not found' });
        return;
      }

      const items = await listTeamApiKeys(team.id);
      res.json({ items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  router.post('/teams/:teamId/keys', admin, async (req, res, next) => {
    try {
      const body = createKeySchema.parse(req.body);
      const created = await createTeamApiKey(param(req.params.teamId), body.name);
      if (!created) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Team not found' });
        return;
      }
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/teams/:teamId/keys/:keyId', admin, async (req, res, next) => {
    try {
      const ok = await revokeTeamApiKey(param(req.params.teamId), param(req.params.keyId));
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'API key not found' });
        return;
      }
      res.json({ ok: true, id: param(req.params.keyId) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/teams/:teamId/analytics', async (req, res, next) => {
    try {
      if (!env.teamsEnabled) {
        res.status(503).json({ error: 'TEAMS_DISABLED', message: 'Team features are disabled' });
        return;
      }

      const isAdmin = Boolean(env.teamAdminKey && extractApiKey(req) === env.teamAdminKey);
      const isOwnTeam = req.team?.id === param(req.params.teamId);

      if (!isAdmin && !isOwnTeam) {
        res.status(403).json({ error: 'FORBIDDEN', message: 'Team admin or team API key required' });
        return;
      }

      const analytics = await getTeamAnalytics(param(req.params.teamId));
      if (!analytics) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Team not found' });
        return;
      }

      res.json(analytics);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
