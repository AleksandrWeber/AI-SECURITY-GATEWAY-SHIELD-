import type { AICache } from '@shield/ai-core';
import type { AnalysisResult } from '@shield/types';
import { eq } from 'drizzle-orm';
import { useDb } from './query.js';

export class DbAICache implements AICache {
  constructor(private readonly modelName: string = 'mock') {}

  async get(key: string): Promise<Partial<AnalysisResult> | null> {
    return useDb(async ({ db, schema }) => {
      const rows = await db
        .select()
        .from(schema.aiCache)
        .where(eq(schema.aiCache.cacheKey, key))
        .limit(1);

      if (rows.length === 0) return null;
      return JSON.parse(rows[0].resultJson) as Partial<AnalysisResult>;
    });
  }

  async set(key: string, value: Partial<AnalysisResult>): Promise<void> {
    await useDb(async ({ db, schema }) => {
      const now = new Date().toISOString();
      const row = {
        cacheKey: key,
        resultJson: JSON.stringify(value),
        model: this.modelName,
        rulesVersion: value.rulesVersion ?? '1.0.0',
        createdAt: now,
      };

      await db.insert(schema.aiCache).values(row).onConflictDoUpdate({
        target: schema.aiCache.cacheKey,
        set: { resultJson: row.resultJson, createdAt: now },
      });
    });
  }
}
