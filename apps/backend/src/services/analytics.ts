import os from 'node:os';
import type {
  Action,
  AnalysisAnalytics,
  AnalyticsSnapshot,
  DetectionCategory,
  MetricsSnapshot,
  Risk,
  SystemResources,
} from '@shield/types';
import { useDb } from '../db/query.js';
import { getMetricsSnapshot } from './metrics.js';

function bytesToMb(value: number): number {
  return Math.round((value / 1024 / 1024) * 10) / 10;
}

export function getSystemResources(): SystemResources {
  const memory = process.memoryUsage();
  const load = os.loadavg();

  return {
    memoryMb: {
      rss: bytesToMb(memory.rss),
      heapUsed: bytesToMb(memory.heapUsed),
      heapTotal: bytesToMb(memory.heapTotal),
      external: bytesToMb(memory.external),
    },
    cpuLoadAvg: [load[0] ?? 0, load[1] ?? 0, load[2] ?? 0],
  };
}

export function enrichMetricsWithSystem(metrics: MetricsSnapshot): MetricsSnapshot {
  return {
    ...metrics,
    system: getSystemResources(),
  };
}

const EMPTY_RISK: Record<Risk, number> = {
  SAFE: 0,
  SUSPICIOUS: 0,
  MALICIOUS: 0,
};

const EMPTY_ACTION: Record<Action, number> = {
  ALLOW: 0,
  REVIEW: 0,
  BLOCK: 0,
  SANITIZE: 0,
};

export async function getAnalysisAnalytics(): Promise<AnalysisAnalytics> {
  return useDb(async ({ db, schema }) => {
    const rows = await db.select().from(schema.analyses);

    const byRisk: Record<Risk, number> = { ...EMPTY_RISK };
    const byAction: Record<Action, number> = { ...EMPTY_ACTION };
    const categoryCounts = new Map<DetectionCategory, number>();

    for (const row of rows) {
      const risk = row.risk as Risk;
      const action = row.action as Action;
      if (risk in byRisk) byRisk[risk] += 1;
      if (action in byAction) byAction[action] += 1;

      const categories = JSON.parse(row.categoriesJson) as DetectionCategory[];
      for (const category of categories) {
        categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
      }
    }

    const topCategories = [...categoryCounts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalAnalyses: rows.length,
      byRisk,
      byAction,
      topCategories,
    };
  });
}

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  const runtime = enrichMetricsWithSystem(getMetricsSnapshot());
  const analyses = await getAnalysisAnalytics();

  return {
    timestamp: new Date().toISOString(),
    runtime,
    analyses,
  };
}
