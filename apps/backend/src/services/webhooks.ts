import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import type { AnalysisResult, WebhookEvent, WebhookPayload, WebhookSubscription } from '@shield/types';
import { eq } from 'drizzle-orm';
import type { EnvConfig } from '../config.js';
import { useDb } from '../db/query.js';
import { preparePromptForStorage } from '../utils/privacy.js';

export const WEBHOOK_EVENTS: WebhookEvent[] = ['analysis.completed', 'analysis.blocked'];

export interface WebhookConfig {
  enabled: boolean;
  maxRetries: number;
  timeoutMs: number;
  maxSubscriptions: number;
  privacyMode: boolean;
}

let runtimeConfig: WebhookConfig = {
  enabled: true,
  maxRetries: 3,
  timeoutMs: 5000,
  maxSubscriptions: 20,
  privacyMode: true,
};

/** Injectable fetch for tests */
let fetchImpl: typeof fetch = globalThis.fetch;

export function configureWebhooks(config: Partial<WebhookConfig>): void {
  runtimeConfig = { ...runtimeConfig, ...config };
}

export function setWebhookFetch(impl: typeof fetch): void {
  fetchImpl = impl;
}

export function resetWebhookFetch(): void {
  fetchImpl = globalThis.fetch;
}

export function signWebhookPayload(secret: string, timestamp: string, body: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

export function verifyWebhookSignature(
  secret: string,
  timestamp: string,
  body: string,
  signatureHex: string,
): boolean {
  const expected = signWebhookPayload(secret, timestamp, body);
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signatureHex, 'hex'));
  } catch {
    return false;
  }
}

function rowToSubscription(row: {
  id: string;
  url: string;
  eventsJson: string;
  enabled: boolean;
  createdAt: string;
}): WebhookSubscription {
  return {
    id: row.id,
    url: row.url,
    events: JSON.parse(row.eventsJson) as WebhookEvent[],
    enabled: row.enabled,
    createdAt: row.createdAt,
  };
}

export async function listWebhookSubscriptions(): Promise<WebhookSubscription[]> {
  return useDb(async ({ db, schema }) => {
    const rows = await db.select().from(schema.webhookSubscriptions);
    return rows.map(rowToSubscription);
  });
}

export async function createWebhookSubscription(params: {
  url: string;
  secret?: string;
  events?: WebhookEvent[];
}): Promise<WebhookSubscription> {
  const events: WebhookEvent[] = params.events?.length
    ? params.events
    : ['analysis.completed'];
  const secret = params.secret ?? randomBytes(32).toString('hex');
  const id = randomUUID();
  const createdAt = new Date().toISOString();

  await useDb(async ({ db, schema }) => {
    const existing = await db.select().from(schema.webhookSubscriptions);
    if (existing.length >= runtimeConfig.maxSubscriptions) {
      throw new Error('WEBHOOK_LIMIT_REACHED');
    }

    await db.insert(schema.webhookSubscriptions).values({
      id,
      url: params.url,
      secret,
      eventsJson: JSON.stringify(events),
      enabled: true,
      createdAt,
    });
  });

  return { id, url: params.url, events, enabled: true, createdAt, secret };
}

export async function deleteWebhookSubscription(id: string): Promise<boolean> {
  return useDb(async ({ db, schema }) => {
    const deleted = await db
      .delete(schema.webhookSubscriptions)
      .where(eq(schema.webhookSubscriptions.id, id))
      .returning({ id: schema.webhookSubscriptions.id });
    return deleted.length > 0;
  });
}

export async function setWebhookSubscriptionEnabled(
  id: string,
  enabled: boolean,
): Promise<boolean> {
  return useDb(async ({ db, schema }) => {
    const updated = await db
      .update(schema.webhookSubscriptions)
      .set({ enabled })
      .where(eq(schema.webhookSubscriptions.id, id))
      .returning({ id: schema.webhookSubscriptions.id });
    return updated.length > 0;
  });
}

export function buildWebhookPayload(
  event: WebhookEvent,
  result: AnalysisResult,
  prompt: string,
  privacyMode: boolean,
): WebhookPayload {
  const { promptHash, promptLength } = preparePromptForStorage(prompt, privacyMode);
  return {
    event,
    timestamp: new Date().toISOString(),
    analysisId: result.analysisId,
    promptHash,
    promptLength,
    result: {
      risk: result.risk,
      severity: result.severity,
      confidence: result.confidence,
      action: result.action,
      categories: result.categories,
      aiInvoked: result.aiInvoked,
      pipelineStage: result.pipelineStage,
    },
  };
}

function eventsForResult(result: AnalysisResult): WebhookEvent[] {
  const events: WebhookEvent[] = ['analysis.completed'];
  if (result.action === 'BLOCK' || result.risk === 'MALICIOUS') {
    events.push('analysis.blocked');
  }
  return events;
}

async function recordDelivery(params: {
  subscriptionId: string;
  event: WebhookEvent;
  analysisId: string;
  status: 'success' | 'failed';
  attempts: number;
  lastError?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  await useDb(async ({ db, schema }) => {
    await db.insert(schema.webhookDeliveries).values({
      subscriptionId: params.subscriptionId,
      event: params.event,
      analysisId: params.analysisId,
      status: params.status,
      attempts: params.attempts,
      lastError: params.lastError ?? null,
      createdAt: now,
      deliveredAt: params.status === 'success' ? now : null,
    });
  });
}

async function deliverOnce(
  url: string,
  secret: string,
  payload: WebhookPayload,
  deliveryId: string,
): Promise<void> {
  const body = JSON.stringify(payload);
  const timestamp = payload.timestamp;
  const signature = signWebhookPayload(secret, timestamp, body);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), runtimeConfig.timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SHIELD-Event': payload.event,
        'X-SHIELD-Delivery': deliveryId,
        'X-SHIELD-Timestamp': timestamp,
        'X-SHIELD-Signature': `sha256=${signature}`,
      },
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

async function deliverWithRetry(
  subscriptionId: string,
  url: string,
  secret: string,
  payload: WebhookPayload,
): Promise<void> {
  const deliveryId = randomUUID();
  let lastError = 'unknown error';

  for (let attempt = 1; attempt <= runtimeConfig.maxRetries; attempt++) {
    try {
      await deliverOnce(url, secret, payload, deliveryId);
      await recordDelivery({
        subscriptionId,
        event: payload.event,
        analysisId: payload.analysisId,
        status: 'success',
        attempts: attempt,
      });
      return;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt < runtimeConfig.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2 ** (attempt - 1) * 500));
      }
    }
  }

  await recordDelivery({
    subscriptionId,
    event: payload.event,
    analysisId: payload.analysisId,
    status: 'failed',
    attempts: runtimeConfig.maxRetries,
    lastError,
  });
}

export async function dispatchAnalysisWebhooks(
  result: AnalysisResult,
  prompt: string,
): Promise<void> {
  if (!runtimeConfig.enabled) return;

  const events = eventsForResult(result);

  await useDb(async ({ db, schema }) => {
    const subscriptions = await db
      .select()
      .from(schema.webhookSubscriptions)
      .where(eq(schema.webhookSubscriptions.enabled, true));

    const tasks: Promise<void>[] = [];

    for (const sub of subscriptions) {
      const subscribed = JSON.parse(sub.eventsJson) as WebhookEvent[];
      for (const event of events) {
        if (!subscribed.includes(event)) continue;
        const payload = buildWebhookPayload(
          event,
          result,
          prompt,
          runtimeConfig.privacyMode,
        );
        tasks.push(deliverWithRetry(sub.id, sub.url, sub.secret, payload));
      }
    }

    await Promise.allSettled(tasks);
  });
}

export function initWebhooksFromEnv(env: Pick<
  EnvConfig,
  'webhooksEnabled' | 'webhookMaxRetries' | 'webhookTimeoutMs' | 'webhookMaxSubscriptions' | 'privacyMode'
>): void {
  configureWebhooks({
    enabled: env.webhooksEnabled,
    maxRetries: env.webhookMaxRetries,
    timeoutMs: env.webhookTimeoutMs,
    maxSubscriptions: env.webhookMaxSubscriptions,
    privacyMode: env.privacyMode,
  });
}

export async function getWebhookDeliveryCount(): Promise<number> {
  return useDb(async ({ db, schema }) => {
    const rows = await db.select().from(schema.webhookDeliveries);
    return rows.length;
  });
}
