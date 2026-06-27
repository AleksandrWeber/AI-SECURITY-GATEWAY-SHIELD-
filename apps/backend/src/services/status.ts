import type { SystemStatus } from '@shield/types';
import { MockAIProvider } from '@shield/ai-core';
import { loadRulesFromDirectory } from '@shield/rule-engine';
import type { EnvConfig } from '../config.js';
import { useDb } from '../db/query.js';
import { countFalsePositives } from './favorites.js';
import { getMetricsSnapshot } from './metrics.js';

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

  let rulesCount = 0;
  try {
    const rules = await loadRulesFromDirectory(env.rulesDir);
    rulesCount = rules.length;
  } catch {
    rulesCount = 0;
  }

  const metrics = getMetricsSnapshot();
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
    rules: { version: env.rulesVersion, count: rulesCount },
    aiProvider: { name: mockProvider.name, available: mockProvider.isAvailable() },
    metrics,
    feedback: { falsePositiveCount },
  };
}
