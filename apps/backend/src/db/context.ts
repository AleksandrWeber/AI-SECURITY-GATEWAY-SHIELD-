import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { getDatabaseDialect, getDb } from './index.js';
import * as pgSchema from './schema.pg.js';
import * as sqliteSchema from './schema.sqlite.js';

export type SqliteDbContext = {
  dialect: 'sqlite';
  db: ReturnType<typeof drizzleLibsql<typeof sqliteSchema>>;
  schema: typeof sqliteSchema;
};

export type PostgresDbContext = {
  dialect: 'postgresql';
  db: ReturnType<typeof drizzlePostgres<typeof pgSchema>>;
  schema: typeof pgSchema;
};

export type DbContext = SqliteDbContext | PostgresDbContext;

export function getDbContext(): DbContext {
  const dialect = getDatabaseDialect();
  if (dialect === 'postgresql') {
    return {
      dialect,
      db: getDb() as PostgresDbContext['db'],
      schema: pgSchema,
    };
  }
  return {
    dialect,
    db: getDb() as SqliteDbContext['db'],
    schema: sqliteSchema,
  };
}
