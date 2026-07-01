import type { AnalysisResult } from '@shield/types';
import { eq } from 'drizzle-orm';
import { useDb } from '../db/query.js';
import { hashPrompt, preparePromptForStorage, redactSecrets } from '../utils/privacy.js';

export interface AuditContext {
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
}

/** Strip prompt-derived content before persisting when privacy mode is on. */
export function sanitizeResultForStorage(
  result: AnalysisResult,
  privacyMode: boolean,
): AnalysisResult {
  if (!privacyMode) return result;

  return {
    ...result,
    dangerousFragments: result.dangerousFragments.map((f) => ({
      ...f,
      text: '[REDACTED]',
    })),
    explanation: {
      en: redactSecrets(result.explanation.en),
      uk: redactSecrets(result.explanation.uk),
    },
    educationalNote: {
      en: redactSecrets(result.educationalNote.en),
      uk: redactSecrets(result.educationalNote.uk),
    },
  };
}

export async function persistAnalysis(
  result: AnalysisResult,
  prompt: string,
  privacyMode: boolean,
): Promise<void> {
  const { promptHash, promptLength } = preparePromptForStorage(prompt, privacyMode);
  const safeResult = sanitizeResultForStorage(result, privacyMode);
  const resultJson = JSON.stringify(safeResult);

  if (privacyMode && prompt.length >= 8 && resultJson.includes(prompt.slice(0, 32))) {
    throw new Error('Privacy violation: prompt text would be stored in result');
  }

  await useDb(async ({ db, schema }) => {
    await db.insert(schema.analyses).values({
      id: result.analysisId,
      promptHash,
      promptLength,
      risk: result.risk,
      severity: result.severity,
      confidence: result.confidence,
      action: result.action,
      rulesVersion: result.rulesVersion,
      aiInvoked: result.aiInvoked,
      pipelineStage: result.pipelineStage,
      categoriesJson: JSON.stringify(result.categories),
      matchedRulesJson: JSON.stringify(result.matchedRules),
      resultJson,
      createdAt: result.timestamp,
    });
  });
}

export async function writeAuditLog(
  params: AuditContext & {
    prompt: string;
    privacyMode: boolean;
    result?: AnalysisResult;
    exception?: string;
  },
): Promise<void> {
  const { promptHash, promptLength } = preparePromptForStorage(params.prompt, params.privacyMode);

  await useDb(async ({ db, schema }) => {
    await db.insert(schema.auditLogs).values({
      timestamp: new Date().toISOString(),
      method: params.method,
      path: params.path,
      ip: params.ip,
      userAgent: params.userAgent,
      promptHash,
      promptLength,
      rulesTriggered: params.result
        ? JSON.stringify(params.result.matchedRules.map((r) => r.id))
        : null,
      aiInvoked: params.result?.aiInvoked ?? null,
      resultSummary: params.result
        ? JSON.stringify({ risk: params.result.risk, action: params.result.action })
        : null,
      exception: params.exception ?? null,
    });
  });
}

export async function getAnalysisById(id: string): Promise<AnalysisResult | null> {
  return useDb(async ({ db, schema }) => {
    const rows = await db
      .select()
      .from(schema.analyses)
      .where(eq(schema.analyses.id, id))
      .limit(1);

    if (rows.length === 0) return null;
    return JSON.parse(rows[0].resultJson) as AnalysisResult;
  });
}

/** Test helper — verify no plaintext prompt in DB tables */
export async function findPlaintextPromptInDb(prompt: string): Promise<boolean> {
  return useDb(async ({ db, schema }) => {
    const needle = prompt.slice(0, Math.min(prompt.length, 32));
    if (needle.length < 8) return false;

    const analysisRows = await db.select().from(schema.analyses);
    for (const row of analysisRows) {
      if (row.resultJson.includes(needle)) return true;
    }

    const auditRows = await db.select().from(schema.auditLogs);
    for (const row of auditRows) {
      const blob = JSON.stringify(row);
      if (blob.includes(needle)) return true;
    }

    return false;
  });
}

export { hashPrompt };
