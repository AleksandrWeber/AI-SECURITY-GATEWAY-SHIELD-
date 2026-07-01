import { Router } from 'express';
import { z } from 'zod';
import { parseRule } from '@shield/rule-engine';
import type { EnvConfig } from '../config.js';
import {
  configureDbRules,
  deleteDbRule,
  listDbRules,
  setDbRuleEnabled,
  upsertDbRule,
} from '../services/db-rules.js';
import { reloadRules } from '../services/rules.js';

const createDbRuleSchema = z.object({
  rule: z.record(z.unknown()),
});

const updateDbRuleSchema = z.object({
  enabled: z.boolean(),
});

type RulesEnv = Pick<EnvConfig, 'rulesDbEnabled'>;

export function initDbRulesFromEnv(env: Pick<EnvConfig, 'rulesDbEnabled'>): void {
  configureDbRules(env.rulesDbEnabled);
}

export function createRulesRouter(env: RulesEnv) {
  const router = Router();

  router.get('/rules/db', async (_req, res, next) => {
    try {
      if (!env.rulesDbEnabled) {
        res.status(503).json({ error: 'RULES_DB_DISABLED', message: 'Database rules are disabled' });
        return;
      }

      const items = await listDbRules();
      res.json({ items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  router.post('/rules/db', async (req, res, next) => {
    try {
      if (!env.rulesDbEnabled) {
        res.status(503).json({ error: 'RULES_DB_DISABLED', message: 'Database rules are disabled' });
        return;
      }

      const body = createDbRuleSchema.parse(req.body);
      const rule = parseRule(body.rule);
      const created = await upsertDbRule({ rule, source: 'manual' });
      reloadRules();
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/rules/db/:id', async (req, res, next) => {
    try {
      if (!env.rulesDbEnabled) {
        res.status(503).json({ error: 'RULES_DB_DISABLED', message: 'Database rules are disabled' });
        return;
      }

      const body = updateDbRuleSchema.parse(req.body);
      const ok = await setDbRuleEnabled(req.params.id, body.enabled);
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Database rule not found' });
        return;
      }
      reloadRules();
      res.json({ ok: true, id: req.params.id, enabled: body.enabled });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/rules/db/:id', async (req, res, next) => {
    try {
      if (!env.rulesDbEnabled) {
        res.status(503).json({ error: 'RULES_DB_DISABLED', message: 'Database rules are disabled' });
        return;
      }

      const ok = await deleteDbRule(req.params.id);
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Database rule not found' });
        return;
      }
      reloadRules();
      res.json({ ok: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
