import type { FavoriteItem, FeedbackRecord } from '@shield/types';
import { desc, eq } from 'drizzle-orm';
import { useDb } from '../db/query.js';

export async function listFavorites(): Promise<FavoriteItem[]> {
  return useDb(async ({ db, schema }) => {
    const rows = await db
      .select({
        favorite: schema.favorites,
        analysis: schema.analyses,
      })
      .from(schema.favorites)
      .innerJoin(schema.analyses, eq(schema.favorites.analysisId, schema.analyses.id))
      .orderBy(desc(schema.favorites.createdAt));

    return rows.map(({ favorite, analysis }) => ({
      id: analysis.id,
      risk: analysis.risk as FavoriteItem['risk'],
      severity: analysis.severity as FavoriteItem['severity'],
      confidence: analysis.confidence,
      action: analysis.action as FavoriteItem['action'],
      promptLength: analysis.promptLength,
      aiInvoked: analysis.aiInvoked,
      pipelineStage: analysis.pipelineStage as FavoriteItem['pipelineStage'],
      createdAt: analysis.createdAt,
      favoritedAt: favorite.createdAt,
    }));
  });
}

export async function addFavorite(analysisId: string): Promise<boolean> {
  return useDb(async ({ db, schema }) => {
    const existing = await db
      .select()
      .from(schema.analyses)
      .where(eq(schema.analyses.id, analysisId))
      .limit(1);
    if (existing.length === 0) return false;

    await db
      .insert(schema.favorites)
      .values({ analysisId, createdAt: new Date().toISOString() })
      .onConflictDoNothing();

    return true;
  });
}

export async function removeFavorite(analysisId: string): Promise<void> {
  await useDb(async ({ db, schema }) => {
    await db.delete(schema.favorites).where(eq(schema.favorites.analysisId, analysisId));
  });
}

export async function isFavorite(analysisId: string): Promise<boolean> {
  return useDb(async ({ db, schema }) => {
    const rows = await db
      .select()
      .from(schema.favorites)
      .where(eq(schema.favorites.analysisId, analysisId))
      .limit(1);
    return rows.length > 0;
  });
}

export async function listFavoriteIds(): Promise<Set<string>> {
  return useDb(async ({ db, schema }) => {
    const rows = await db.select({ id: schema.favorites.analysisId }).from(schema.favorites);
    return new Set(rows.map((r) => r.id));
  });
}

export async function submitFeedback(params: {
  analysisId: string;
  type: 'false_positive';
  note?: string;
  riskAtReport: string;
}): Promise<FeedbackRecord | null> {
  return useDb(async ({ db, schema }) => {
    const existing = await db
      .select()
      .from(schema.analyses)
      .where(eq(schema.analyses.id, params.analysisId))
      .limit(1);
    if (existing.length === 0) return null;

    const createdAt = new Date().toISOString();
    const inserted = await db
      .insert(schema.feedback)
      .values({
        analysisId: params.analysisId,
        type: params.type,
        note: params.note ?? null,
        riskAtReport: params.riskAtReport,
        createdAt,
      })
      .returning();

    const row = inserted[0];
    return {
      id: row.id,
      analysisId: row.analysisId,
      type: row.type as FeedbackRecord['type'],
      note: row.note,
      riskAtReport: row.riskAtReport,
      createdAt: row.createdAt,
    };
  });
}

export async function countFalsePositives(): Promise<number> {
  return useDb(async ({ db, schema }) => {
    const rows = await db
      .select()
      .from(schema.feedback)
      .where(eq(schema.feedback.type, 'false_positive'));
    return rows.length;
  });
}
