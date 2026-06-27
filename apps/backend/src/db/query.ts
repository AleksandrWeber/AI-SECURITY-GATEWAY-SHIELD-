import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { getDbContext } from './context.js';
import * as sqliteSchema from './schema.sqlite.js';

export type SqliteDbContext = {
  dialect: 'sqlite';
  db: ReturnType<typeof drizzleLibsql<typeof sqliteSchema>>;
  schema: typeof sqliteSchema;
};

/**
 * Execute a database callback with a normalized TypeScript context.
 * Runtime always pairs the correct driver with its schema; types use the SQLite
 * shape because both dialects share identical table/column names.
 */
export async function useDb<T>(fn: (ctx: SqliteDbContext) => Promise<T>): Promise<T> {
  const ctx = getDbContext();
  return fn({
    dialect: 'sqlite',
    db: ctx.db as SqliteDbContext['db'],
    schema: ctx.schema as typeof sqliteSchema,
  });
}
