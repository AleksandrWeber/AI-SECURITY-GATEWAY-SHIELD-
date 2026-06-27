import { Router } from 'express';
import {
  createWebhookSubscription,
  deleteWebhookSubscription,
  listWebhookSubscriptions,
  setWebhookSubscriptionEnabled,
} from '../services/webhooks.js';
import { createWebhookSchema, updateWebhookSchema } from '../schemas/webhooks.js';

export const webhooksRouter = Router();

webhooksRouter.get('/webhooks', async (_req, res, next) => {
  try {
    const items = await listWebhookSubscriptions();
    res.json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
});

webhooksRouter.post('/webhooks', async (req, res, next) => {
  try {
    const body = createWebhookSchema.parse(req.body);
    const created = await createWebhookSubscription(body);
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof Error && err.message === 'WEBHOOK_LIMIT_REACHED') {
      res.status(400).json({
        error: 'WEBHOOK_LIMIT_REACHED',
        message: 'Maximum webhook subscriptions reached',
      });
      return;
    }
    next(err);
  }
});

webhooksRouter.patch('/webhooks/:id', async (req, res, next) => {
  try {
    const body = updateWebhookSchema.parse(req.body);
    const ok = await setWebhookSubscriptionEnabled(req.params.id, body.enabled);
    if (!ok) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Webhook subscription not found' });
      return;
    }
    res.json({ ok: true, id: req.params.id, enabled: body.enabled });
  } catch (err) {
    next(err);
  }
});

webhooksRouter.delete('/webhooks/:id', async (req, res, next) => {
  try {
    const ok = await deleteWebhookSubscription(req.params.id);
    if (!ok) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Webhook subscription not found' });
      return;
    }
    res.json({ ok: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});
