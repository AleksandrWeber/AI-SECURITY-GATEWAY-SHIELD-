import type { SystemStatus } from '@shield/types';
import { MockAIProvider } from '@shield/ai-core';
import type { EnvConfig } from '../config.js';
import { useDb } from '../db/query.js';
import { countFalsePositives } from './favorites.js';
import { enrichMetricsWithSystem } from './analytics.js';
import { countEnabledDbRules } from './db-rules.js';
import { getMetricsSnapshot } from './metrics.js';
import { getFileRulesCount, getRules } from './rules.js';

const serverStartedAt = Date.now();
const mockProvider = new MockAIProvider();

export function getServerUptimeSeconds(): number {
  return Math.floor((Date.now() - serverStartedAt) / 1000);
}

export async function getSystemStatus(env: EnvConfig): Promise<SystemStatus> {
  let databaseConnected = false;
  try {
    await useDb(async ({ db, schema }) => {
      await db.select().from(schema.settings).limit(1);
    });
    databaseConnected = true;
  } catch {
    databaseConnected = false;
  }

  let fileCount = 0;
  let dbCount = 0;
  let rulesCount = 0;
  try {
    const rules = await getRules();
    rulesCount = rules.length;
    fileCount = getFileRulesCount();
    dbCount = await countEnabledDbRules();
  } catch {
    rulesCount = 0;
    fileCount = 0;
    dbCount = 0;
  }

  const metrics = enrichMetricsWithSystem(getMetricsSnapshot());
  const falsePositiveCount = await countFalsePositives();
  const degraded = !databaseConnected || rulesCount === 0;

  return {
    status: databaseConnected ? (degraded ? 'degraded' : 'ok') : 'error',
    version: '0.1.0',
    uptimeSeconds: getServerUptimeSeconds(),
    timestamp: new Date().toISOString(),
    privacyMode: env.privacyMode,
    demoMode: env.demoMode,
    database: { connected: databaseConnected },
    rules: { version: env.rulesVersion, count: rulesCount, fileCount, dbCount },
    aiProvider: { name: mockProvider.name, available: mockProvider.isAvailable() },
    metrics,
    feedback: { falsePositiveCount },
  };
}
