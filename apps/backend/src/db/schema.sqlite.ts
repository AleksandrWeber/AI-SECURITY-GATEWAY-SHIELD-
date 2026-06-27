import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const analyses = sqliteTable('analyses', {
  id: text('id').primaryKey(),
  promptHash: text('prompt_hash').notNull(),
  promptLength: integer('prompt_length').notNull(),
  risk: text('risk').notNull(),
  severity: text('severity').notNull(),
  confidence: integer('confidence').notNull(),
  action: text('action').notNull(),
  rulesVersion: text('rules_version').notNull(),
  aiInvoked: integer('ai_invoked', { mode: 'boolean' }).notNull().default(false),
  pipelineStage: text('pipeline_stage').notNull(),
  categoriesJson: text('categories_json').notNull().default('[]'),
  matchedRulesJson: text('matched_rules_json').notNull().default('[]'),
  resultJson: text('result_json').notNull(),
  createdAt: text('created_at').notNull(),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: text('timestamp').notNull(),
  method: text('method'),
  path: text('path'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  promptHash: text('prompt_hash'),
  promptLength: integer('prompt_length'),
  rulesTriggered: text('rules_triggered'),
  aiInvoked: integer('ai_invoked', { mode: 'boolean' }),
  resultSummary: text('result_summary'),
  exception: text('exception'),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const aiCache = sqliteTable('ai_cache', {
  cacheKey: text('cache_key').primaryKey(),
  resultJson: text('result_json').notNull(),
  model: text('model').notNull(),
  rulesVersion: text('rules_version').notNull(),
  createdAt: text('created_at').notNull(),
});

export const favorites = sqliteTable('favorites', {
  analysisId: text('analysis_id').primaryKey(),
  createdAt: text('created_at').notNull(),
});

export const feedback = sqliteTable('feedback', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  analysisId: text('analysis_id').notNull(),
  type: text('type').notNull(),
  note: text('note'),
  riskAtReport: text('risk_at_report').notNull(),
  createdAt: text('created_at').notNull(),
});

export const webhookSubscriptions = sqliteTable('webhook_subscriptions', {
  id: text('id').primaryKey(),
  url: text('url').notNull(),
  secret: text('secret').notNull(),
  eventsJson: text('events_json').notNull().default('["analysis.completed"]'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
});

export const webhookDeliveries = sqliteTable('webhook_deliveries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subscriptionId: text('subscription_id').notNull(),
  event: text('event').notNull(),
  analysisId: text('analysis_id').notNull(),
  status: text('status').notNull(),
  attempts: integer('attempts').notNull().default(0),
  lastError: text('last_error'),
  createdAt: text('created_at').notNull(),
  deliveredAt: text('delivered_at'),
});
