import type { AnalysisResult } from '@shield/types';

export interface AICache {
  get(key: string): Promise<Partial<AnalysisResult> | null>;
  set(key: string, value: Partial<AnalysisResult>): Promise<void>;
}

/** In-memory cache for V0. SQLite cache comes in Phase 4. */
export class InMemoryAICache implements AICache {
  private store = new Map<string, Partial<AnalysisResult>>();

  async get(key: string): Promise<Partial<AnalysisResult> | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: Partial<AnalysisResult>): Promise<void> {
    this.store.set(key, value);
  }
}
