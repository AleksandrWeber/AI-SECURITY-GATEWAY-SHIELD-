import { randomUUID } from 'node:crypto';
import type {
  BatchAnalyzeItem,
  BatchAnalyzeResponse,
  BatchAnalyzeResultEntry,
  SupportedLanguage,
} from '@shield/types';
import type { AuditContext } from './storage.js';
import { runAnalysis } from './analyze.js';

export interface BatchDefaults {
  mode: 'quick' | 'detailed';
  language?: SupportedLanguage;
}

export interface RunBatchOptions {
  items: BatchAnalyzeItem[];
  defaults: BatchDefaults;
  acceptLanguage?: string;
  audit?: AuditContext;
  concurrency: number;
  maxPromptLength: number;
  resolveLanguage: (
    explicit: SupportedLanguage | undefined,
    acceptLanguage: string | undefined,
    prompt: string,
  ) => SupportedLanguage;
  detectLanguage: (prompt: string) => import('@shield/types').DetectedLanguage;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Math.min(Math.max(concurrency, 1), items.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

export async function runBatchAnalysis(options: RunBatchOptions): Promise<BatchAnalyzeResponse> {
  const started = Date.now();
  const batchId = randomUUID();
  const auditBase = options.audit ?? {};

  const results = await mapWithConcurrency(
    options.items,
    options.concurrency,
    async (item, index): Promise<BatchAnalyzeResultEntry> => {
      const id = item.id;

      if (item.prompt.length > options.maxPromptLength) {
        return {
          index,
          id,
          ok: false,
          error: {
            code: 'PROMPT_TOO_LONG',
            message: `Prompt exceeds maximum length of ${options.maxPromptLength}`,
          },
        };
      }

      try {
        const mode = item.mode ?? options.defaults.mode;
        const language = options.resolveLanguage(
          item.language ?? options.defaults.language,
          options.acceptLanguage,
          item.prompt,
        );
        const detectedLanguage = options.detectLanguage(item.prompt);

        const result = await runAnalysis(item.prompt, mode, language, detectedLanguage, {
          ...auditBase,
          path: `${auditBase.path ?? '/batch'}[${index}]`,
        });

        return { index, id, ok: true, result };
      } catch (err) {
        return {
          index,
          id,
          ok: false,
          error: {
            code: 'ANALYSIS_FAILED',
            message: err instanceof Error ? err.message : String(err),
          },
        };
      }
    },
  );

  const succeeded = results.filter((r) => r.ok).length;

  return {
    batchId,
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      succeeded,
      failed: results.length - succeeded,
      processingTimeMs: Date.now() - started,
    },
  };
}
