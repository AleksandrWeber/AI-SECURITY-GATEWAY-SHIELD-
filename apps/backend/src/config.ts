import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Monorepo root — stable regardless of process.cwd() when starting the server */
export const monorepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

config({ path: resolve(monorepoRoot, '.env') });
config({ path: resolve(monorepoRoot, '.env.local') });

export interface EnvConfig {
  nodeEnv: string;
  port: number;
  privacyMode: boolean;
  demoMode: boolean;
  logLevel: string;
  aiConfidenceThreshold: number;
  maxPromptLength: number;
  rulesVersion: string;
  corsOrigin: string;
  rulesDir: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  openapiPath: string;
  databaseUrl: string;
  apiKeys: string[];
  apiKeyRequired: boolean;
  batchMaxItems: number;
  batchConcurrency: number;
  webhooksEnabled: boolean;
  webhookMaxRetries: number;
  webhookTimeoutMs: number;
  webhookMaxSubscriptions: number;
  knowledgeDir: string;
  ruleSuggestionsEnabled: boolean;
  autoSuggestRules: boolean;
  maxPendingSuggestions: number;
  rulesDbEnabled: boolean;
  teamsEnabled: boolean;
  teamAdminKey: string;
}

function parseApiKeys(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

export function loadEnv(overrides: Partial<EnvConfig> = {}): EnvConfig {
  const databaseUrl =
    process.env.DATABASE_URL ?? `file:${resolve(monorepoRoot, 'data/shield.db')}`;
  const apiKeys = parseApiKeys(process.env.API_KEYS);
  const apiKeyRequired =
    process.env.API_KEY_REQUIRED === 'true' ||
    (apiKeys.length > 0 && process.env.API_KEY_REQUIRED !== 'false');

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3001),
    privacyMode: process.env.PRIVACY_MODE !== 'false',
    demoMode: process.env.DEMO_MODE === 'true',
    logLevel: process.env.LOG_LEVEL ?? 'info',
    aiConfidenceThreshold: Number(process.env.AI_CONFIDENCE_THRESHOLD ?? 70),
    maxPromptLength: Number(process.env.MAX_PROMPT_LENGTH ?? 32000),
    rulesVersion: process.env.RULES_VERSION ?? '1.0.0',
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    rulesDir: process.env.RULES_DIR ?? resolve(monorepoRoot, 'rules'),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 100),
    openapiPath: process.env.OPENAPI_PATH ?? resolve(monorepoRoot, 'docs/openapi.yaml'),
    databaseUrl,
    apiKeys,
    apiKeyRequired,
    batchMaxItems: Number(process.env.BATCH_MAX_ITEMS ?? 50),
    batchConcurrency: Number(process.env.BATCH_CONCURRENCY ?? 5),
    webhooksEnabled: process.env.WEBHOOKS_ENABLED !== 'false',
    webhookMaxRetries: Number(process.env.WEBHOOK_MAX_RETRIES ?? 3),
    webhookTimeoutMs: Number(process.env.WEBHOOK_TIMEOUT_MS ?? 5000),
    webhookMaxSubscriptions: Number(process.env.WEBHOOK_MAX_SUBSCRIPTIONS ?? 20),
    knowledgeDir: process.env.KNOWLEDGE_DIR ?? resolve(monorepoRoot, 'knowledge'),
    ruleSuggestionsEnabled: process.env.RULE_SUGGESTIONS_ENABLED !== 'false',
    autoSuggestRules: process.env.AUTO_SUGGEST_RULES !== 'false',
    maxPendingSuggestions: Number(process.env.MAX_PENDING_SUGGESTIONS ?? 100),
    rulesDbEnabled: process.env.RULES_DB_ENABLED !== 'false',
    teamsEnabled: process.env.TEAMS_ENABLED === 'true',
    teamAdminKey: process.env.TEAM_ADMIN_KEY?.trim() ?? '',
    ...overrides,
  };
}

/** Singleton used by the running server */
export const env = loadEnv();
