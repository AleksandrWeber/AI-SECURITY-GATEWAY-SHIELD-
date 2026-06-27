import { resolve } from 'node:path';

export type DatabaseDialect = 'sqlite' | 'postgresql';

export interface ParsedDatabaseUrl {
  dialect: DatabaseDialect;
  url: string;
}

/** Classify and normalize DATABASE_URL for the active driver. */
export function parseDatabaseUrl(databaseUrl: string): ParsedDatabaseUrl {
  const trimmed = databaseUrl.trim();

  if (trimmed.startsWith('postgresql://') || trimmed.startsWith('postgres://')) {
    return { dialect: 'postgresql', url: trimmed };
  }

  if (trimmed.startsWith('file:')) {
    const raw = trimmed.slice(5);
    if (raw === ':memory:' || raw.startsWith(':memory:')) {
      return { dialect: 'sqlite', url: 'file::memory:' };
    }
    const abs = raw.startsWith('/') ? raw : resolve(process.cwd(), raw);
    return { dialect: 'sqlite', url: `file:${abs}` };
  }

  return { dialect: 'sqlite', url: `file:${resolve(process.cwd(), '../../data/shield.db')}` };
}
