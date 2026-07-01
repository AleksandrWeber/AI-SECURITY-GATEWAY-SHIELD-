import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { and, count, desc, eq } from 'drizzle-orm';
import type {
  Action,
  Risk,
  TeamAnalytics,
  TeamApiKeyCreated,
  TeamApiKeyRecord,
  TeamRecord,
} from '@shield/types';
import { useDb } from '../db/query.js';

const KEY_PREFIX = 'shld_';

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'team';
}

function mapTeam(row: {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}): TeamRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.createdAt,
  };
}

function mapKey(row: {
  id: string;
  teamId: string;
  name: string;
  keyPrefix: string;
  enabled: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}): TeamApiKeyRecord {
  return {
    id: row.id,
    teamId: row.teamId,
    name: row.name,
    keyPrefix: row.keyPrefix,
    enabled: row.enabled,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt ?? undefined,
  };
}

export async function createTeam(input: { name: string; slug?: string }): Promise<TeamRecord> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  let slug = input.slug?.trim() || slugify(input.name);

  return useDb(async ({ db, schema }) => {
    const existing = await db.select().from(schema.teams).where(eq(schema.teams.slug, slug)).limit(1);
    if (existing.length > 0) {
      slug = `${slug}-${id.slice(0, 8)}`;
    }

    await db.insert(schema.teams).values({
      id,
      name: input.name.trim(),
      slug,
      createdAt,
    });

    return { id, name: input.name.trim(), slug, createdAt };
  });
}

export async function listTeams(): Promise<TeamRecord[]> {
  return useDb(async ({ db, schema }) => {
    const rows = await db.select().from(schema.teams).orderBy(desc(schema.teams.createdAt));
    return rows.map(mapTeam);
  });
}

export async function getTeamById(teamId: string): Promise<TeamRecord | null> {
  return useDb(async ({ db, schema }) => {
    const rows = await db.select().from(schema.teams).where(eq(schema.teams.id, teamId)).limit(1);
    return rows[0] ? mapTeam(rows[0]) : null;
  });
}

export async function createTeamApiKey(
  teamId: string,
  name: string,
): Promise<TeamApiKeyCreated | null> {
  const team = await getTeamById(teamId);
  if (!team) return null;

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const secret = randomBytes(24).toString('base64url');
  const key = `${KEY_PREFIX}${secret}`;
  const keyPrefix = key.slice(0, KEY_PREFIX.length + 8);
  const keyHash = hashApiKey(key);

  await useDb(async ({ db, schema }) => {
    await db.insert(schema.teamApiKeys).values({
      id,
      teamId,
      name: name.trim(),
      keyHash,
      keyPrefix,
      enabled: true,
      createdAt,
    });
  });

  return {
    id,
    teamId,
    name: name.trim(),
    keyPrefix,
    enabled: true,
    createdAt,
    key,
  };
}

export async function listTeamApiKeys(teamId: string): Promise<TeamApiKeyRecord[]> {
  return useDb(async ({ db, schema }) => {
    const rows = await db
      .select()
      .from(schema.teamApiKeys)
      .where(eq(schema.teamApiKeys.teamId, teamId))
      .orderBy(desc(schema.teamApiKeys.createdAt));
    return rows.map(mapKey);
  });
}

export async function revokeTeamApiKey(teamId: string, keyId: string): Promise<boolean> {
  return useDb(async ({ db, schema }) => {
    const rows = await db
      .update(schema.teamApiKeys)
      .set({ enabled: false })
      .where(and(eq(schema.teamApiKeys.id, keyId), eq(schema.teamApiKeys.teamId, teamId)))
      .returning({ id: schema.teamApiKeys.id });
    return rows.length > 0;
  });
}

export interface TeamKeyLookup {
  team: TeamRecord;
  key: TeamApiKeyRecord;
}

export async function resolveTeamApiKey(rawKey: string): Promise<TeamKeyLookup | null> {
  if (!rawKey.startsWith(KEY_PREFIX)) return null;

  const keyHash = hashApiKey(rawKey);

  return useDb(async ({ db, schema }) => {
    const keyRows = await db
      .select()
      .from(schema.teamApiKeys)
      .where(and(eq(schema.teamApiKeys.keyHash, keyHash), eq(schema.teamApiKeys.enabled, true)))
      .limit(1);

    const keyRow = keyRows[0];
    if (!keyRow) return null;

    const teamRows = await db
      .select()
      .from(schema.teams)
      .where(eq(schema.teams.id, keyRow.teamId))
      .limit(1);

    const teamRow = teamRows[0];
    if (!teamRow) return null;

    return {
      team: mapTeam(teamRow),
      key: mapKey(keyRow),
    };
  });
}

export async function touchTeamApiKeyLastUsed(keyId: string): Promise<void> {
  const lastUsedAt = new Date().toISOString();
  await useDb(async ({ db, schema }) => {
    await db
      .update(schema.teamApiKeys)
      .set({ lastUsedAt })
      .where(eq(schema.teamApiKeys.id, keyId));
  });
}

export async function getTeamAnalytics(teamId: string): Promise<TeamAnalytics | null> {
  const team = await getTeamById(teamId);
  if (!team) return null;

  return useDb(async ({ db, schema }) => {
    const rows = await db
      .select({
        risk: schema.analyses.risk,
        action: schema.analyses.action,
        createdAt: schema.analyses.createdAt,
      })
      .from(schema.analyses)
      .where(eq(schema.analyses.teamId, teamId));

    const byRisk: Record<Risk, number> = { SAFE: 0, SUSPICIOUS: 0, MALICIOUS: 0 };
    const byAction: Record<Action, number> = { ALLOW: 0, REVIEW: 0, BLOCK: 0, SANITIZE: 0 };
    let lastAnalysisAt: string | undefined;

    for (const row of rows) {
      const risk = row.risk as Risk;
      const action = row.action as Action;
      if (risk in byRisk) byRisk[risk] += 1;
      if (action in byAction) byAction[action] += 1;
      if (!lastAnalysisAt || row.createdAt > lastAnalysisAt) {
        lastAnalysisAt = row.createdAt;
      }
    }

    return {
      teamId: team.id,
      teamName: team.name,
      totalAnalyses: rows.length,
      byRisk,
      byAction,
      lastAnalysisAt,
    };
  });
}

export async function countTeams(): Promise<number> {
  return useDb(async ({ db, schema }) => {
    const rows = await db.select({ value: count() }).from(schema.teams);
    return Number(rows[0]?.value ?? 0);
  });
}
