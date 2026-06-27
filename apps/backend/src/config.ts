import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '../../.env.local') });

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
}

function parseApiKeys(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

export function loadEnv(overrides: Partial<EnvConfig> = {}): EnvConfig {
  const databaseUrl = process.env.DATABASE_URL ?? 'file:../../data/shield.db';
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
    rulesDir: process.env.RULES_DIR ?? resolve(process.cwd(), '../../rules'),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 100),
    openapiPath:
      process.env.OPENAPI_PATH ?? resolve(process.cwd(), '../../docs/openapi.yaml'),
    databaseUrl,
    apiKeys,
    apiKeyRequired,
    ...overrides,
  };
}

/** Singleton used by the running server */
export const env = loadEnv();
