import type { AnalysisHistoryItem } from '@shield/types';
import { count, desc } from 'drizzle-orm';
import { useDb } from '../db/query.js';

export async function getRecentAnalyses(limit = 20): Promise<{
  items: AnalysisHistoryItem[];
  total: number;
}> {
  return useDb(async ({ db, schema }) => {
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    const rows = await db
      .select()
      .from(schema.analyses)
      .orderBy(desc(schema.analyses.createdAt))
      .limit(safeLimit);

    const [{ value: total }] = await db.select({ value: count() }).from(schema.analyses);

    const items: AnalysisHistoryItem[] = rows.map((row) => ({
      id: row.id,
      risk: row.risk as AnalysisHistoryItem['risk'],
      severity: row.severity as AnalysisHistoryItem['severity'],
      confidence: row.confidence,
      action: row.action as AnalysisHistoryItem['action'],
      promptLength: row.promptLength,
      aiInvoked: row.aiInvoked,
      pipelineStage: row.pipelineStage as AnalysisHistoryItem['pipelineStage'],
      createdAt: row.createdAt,
    }));

    return { items, total };
  });
}
