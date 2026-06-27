import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  buildMockRuleSuggestion,
  buildSuggestionFromPrompt,
  shouldSuggestRule,
} from '@shield/ai-core';
import { normalizePrompt } from '@shield/rule-engine';
import type { AnalysisResult, RuleSuggestion, RuleSuggestionStatus, SupportedLanguage } from '@shield/types';
import { randomUUID } from 'node:crypto';
import { hashPrompt } from '../utils/privacy.js';
import { getRules } from './rules.js';

export interface KnowledgeConfig {
  knowledgeDir: string;
  enabled: boolean;
  autoSuggest: boolean;
  maxPending: number;
}

let runtimeConfig: KnowledgeConfig = {
  knowledgeDir: join(process.cwd(), '../../knowledge'),
  enabled: true,
  autoSuggest: true,
  maxPending: 100,
};

export function configureKnowledge(config: Partial<KnowledgeConfig>): void {
  runtimeConfig = { ...runtimeConfig, ...config };
}

function pendingDir(): string {
  return join(runtimeConfig.knowledgeDir, 'pending');
}

function approvedDir(): string {
  return join(runtimeConfig.knowledgeDir, 'approved');
}

function rejectedDir(): string {
  return join(runtimeConfig.knowledgeDir, 'rejected');
}

async function ensureKnowledgeDirs(): Promise<void> {
  await mkdir(pendingDir(), { recursive: true });
  await mkdir(approvedDir(), { recursive: true });
  await mkdir(rejectedDir(), { recursive: true });
}

function suggestionPath(id: string, status: RuleSuggestionStatus = 'pending'): string {
  const dir =
    status === 'approved' ? approvedDir() : status === 'rejected' ? rejectedDir() : pendingDir();
  return join(dir, `${id}.json`);
}

async function readSuggestionFile(filePath: string): Promise<RuleSuggestion | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as RuleSuggestion;
  } catch {
    return null;
  }
}

async function listSuggestionFiles(dir: string): Promise<RuleSuggestion[]> {
  await ensureKnowledgeDirs();
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return [];
  }

  const items: RuleSuggestion[] = [];
  for (const entry of entries.filter((name) => name.endsWith('.json')).sort()) {
    const item = await readSuggestionFile(join(dir, entry));
    if (item) items.push(item);
  }
  return items;
}

export async function listPendingSuggestions(
  status: RuleSuggestionStatus = 'pending',
): Promise<RuleSuggestion[]> {
  const dir =
    status === 'approved' ? approvedDir() : status === 'rejected' ? rejectedDir() : pendingDir();
  const items = await listSuggestionFiles(dir);
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPendingSuggestion(id: string): Promise<RuleSuggestion | null> {
  for (const status of ['pending', 'approved', 'rejected'] as const) {
    const item = await readSuggestionFile(suggestionPath(id, status));
    if (item) return item;
  }
  return null;
}

async function hasPendingForHash(promptHash: string): Promise<boolean> {
  const pending = await listSuggestionFiles(pendingDir());
  return pending.some((item) => item.promptHash === promptHash && item.status === 'pending');
}

async function writeSuggestion(suggestion: RuleSuggestion): Promise<void> {
  await ensureKnowledgeDirs();
  const path = suggestionPath(suggestion.id, suggestion.status);
  await writeFile(path, `${JSON.stringify(suggestion, null, 2)}\n`, 'utf-8');
}

export async function createRuleSuggestion(params: {
  prompt: string;
  language: SupportedLanguage;
  analysisId?: string;
  result?: Pick<
    AnalysisResult,
    'risk' | 'severity' | 'confidence' | 'action' | 'categories' | 'matchedRules' | 'aiInvoked'
  >;
  source: RuleSuggestion['source'];
}): Promise<RuleSuggestion | null> {
  if (!runtimeConfig.enabled) return null;

  const promptHash = hashPrompt(params.prompt);
  const promptLength = params.prompt.length;

  if (await hasPendingForHash(promptHash)) return null;

  const pending = await listSuggestionFiles(pendingDir());
  if (pending.length >= runtimeConfig.maxPending) {
    throw new Error('SUGGESTION_LIMIT_REACHED');
  }

  const existingRules = await getRules();
  const normalizedPrompt = normalizePrompt(params.prompt);

  const draft =
    params.result && shouldSuggestRule(params.result)
      ? buildMockRuleSuggestion({
          prompt: params.prompt,
          normalizedPrompt,
          result: params.result,
          language: params.language,
          existingRules,
        })
      : buildSuggestionFromPrompt({
          prompt: params.prompt,
          normalizedPrompt,
          language: params.language,
          existingRules,
        });

  const suggestion: RuleSuggestion = {
    id: randomUUID(),
    status: 'pending',
    source: params.source,
    analysisId: params.analysisId,
    promptHash,
    promptLength,
    suggestedRule: draft.suggestedRule,
    rationale: draft.rationale,
    createdAt: new Date().toISOString(),
  };

  await writeSuggestion(suggestion);
  return suggestion;
}

export async function suggestRuleFromAnalysis(
  result: AnalysisResult,
  prompt: string,
  language: SupportedLanguage,
): Promise<RuleSuggestion | null> {
  if (!runtimeConfig.enabled || !runtimeConfig.autoSuggest) return null;
  if (!shouldSuggestRule(result)) return null;

  return createRuleSuggestion({
    prompt,
    language,
    analysisId: result.analysisId,
    result,
    source: 'ai-auto',
  });
}

export async function reviewSuggestion(params: {
  id: string;
  status: 'approved' | 'rejected';
  note?: string;
}): Promise<RuleSuggestion | null> {
  const existing = await readSuggestionFile(suggestionPath(params.id, 'pending'));
  if (!existing || existing.status !== 'pending') return null;

  const reviewed: RuleSuggestion = {
    ...existing,
    status: params.status,
    reviewedAt: new Date().toISOString(),
    reviewNote: params.note,
  };

  await writeSuggestion(reviewed);
  await unlink(suggestionPath(params.id, 'pending'));
  return reviewed;
}

export function initKnowledgeFromEnv(env: {
  knowledgeDir: string;
  ruleSuggestionsEnabled: boolean;
  autoSuggestRules: boolean;
  maxPendingSuggestions: number;
}): void {
  configureKnowledge({
    knowledgeDir: env.knowledgeDir,
    enabled: env.ruleSuggestionsEnabled,
    autoSuggest: env.autoSuggestRules,
    maxPending: env.maxPendingSuggestions,
  });
}

/** Test helper — reset in-memory config defaults */
export function resetKnowledgeConfig(): void {
  runtimeConfig = {
    knowledgeDir: join(process.cwd(), '../../knowledge'),
    enabled: true,
    autoSuggest: true,
    maxPending: 100,
  };
}
