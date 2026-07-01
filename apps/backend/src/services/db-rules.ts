import { parseRule } from '@shield/rule-engine';
import type { DbRuleRecord, DbRuleSource, Rule, RuleSuggestion } from '@shield/types';
import { eq } from 'drizzle-orm';
import { useDb } from '../db/query.js';

let rulesDbEnabled = true;

export function configureDbRules(enabled: boolean): void {
  rulesDbEnabled = enabled;
}

export function isRulesDbEnabled(): boolean {
  return rulesDbEnabled;
}

function rowToRecord(row: {
  id: string;
  category: string;
  ruleJson: string;
  source: string;
  suggestionId: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}): DbRuleRecord {
  return {
    id: row.id,
    category: row.category as DbRuleRecord['category'],
    rule: JSON.parse(row.ruleJson) as Rule,
    source: row.source as DbRuleSource,
    suggestionId: row.suggestionId ?? undefined,
    enabled: row.enabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function loadEnabledDbRules(): Promise<Rule[]> {
  if (!rulesDbEnabled) return [];

  return useDb(async ({ db, schema }) => {
    const rows = await db.select().from(schema.rules).where(eq(schema.rules.enabled, true));
    return rows.map((row) => JSON.parse(row.ruleJson) as Rule);
  });
}

export async function listDbRules(): Promise<DbRuleRecord[]> {
  return useDb(async ({ db, schema }) => {
    const rows = await db.select().from(schema.rules);
    return rows.map(rowToRecord).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  });
}

export async function countEnabledDbRules(): Promise<number> {
  if (!rulesDbEnabled) return 0;
  const items = await listDbRules();
  return items.filter((item) => item.enabled).length;
}

export async function upsertDbRule(params: {
  rule: Rule;
  source: DbRuleSource;
  suggestionId?: string;
}): Promise<DbRuleRecord> {
  if (!rulesDbEnabled) {
    throw new Error('RULES_DB_DISABLED');
  }

  const validated = parseRule({ ...params.rule, enabled: true });
  const now = new Date().toISOString();

  await useDb(async ({ db, schema }) => {
    await db
      .insert(schema.rules)
      .values({
        id: validated.id,
        category: validated.category,
        ruleJson: JSON.stringify(validated),
        source: params.source,
        suggestionId: params.suggestionId ?? null,
        enabled: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: schema.rules.id,
        set: {
          category: validated.category,
          ruleJson: JSON.stringify(validated),
          source: params.source,
          suggestionId: params.suggestionId ?? null,
          enabled: true,
          updatedAt: now,
        },
      });
  });

  const records = await listDbRules();
  const record = records.find((item) => item.id === validated.id);
  if (!record) throw new Error('RULE_UPSERT_FAILED');
  return record;
}

export async function setDbRuleEnabled(id: string, enabled: boolean): Promise<boolean> {
  const now = new Date().toISOString();
  const updated = await useDb(async ({ db, schema }) => {
    const rows = await db
      .update(schema.rules)
      .set({ enabled, updatedAt: now })
      .where(eq(schema.rules.id, id))
      .returning({ id: schema.rules.id });
    return rows.length > 0;
  });

  return updated;
}

export async function deleteDbRule(id: string): Promise<boolean> {
  const deleted = await useDb(async ({ db, schema }) => {
    const rows = await db
      .delete(schema.rules)
      .where(eq(schema.rules.id, id))
      .returning({ id: schema.rules.id });
    return rows.length > 0;
  });

  return deleted;
}

export async function promoteSuggestionToDb(suggestion: RuleSuggestion): Promise<DbRuleRecord> {
  if (suggestion.status !== 'approved') {
    throw new Error('SUGGESTION_NOT_APPROVED');
  }

  return upsertDbRule({
    rule: {
      ...suggestion.suggestedRule,
      enabled: true,
      source: suggestion.suggestedRule.source ?? 'promoted',
    },
    source: 'promoted',
    suggestionId: suggestion.id,
  });
}
