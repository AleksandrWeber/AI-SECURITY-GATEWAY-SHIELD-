import { mkdirSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient, type Client } from '@libsql/client';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { migrate as migrateSqlite } from 'drizzle-orm/libsql/migrator';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { parseDatabaseUrl, type DatabaseDialect } from './dialect.js';
import * as pgSchema from './schema.pg.js';
import * as sqliteSchema from './schema.sqlite.js';
import { setActiveSchema } from './schema.js';

type LibsqlDb = ReturnType<typeof drizzleLibsql<typeof sqliteSchema>>;
type PostgresDb = ReturnType<typeof drizzlePostgres<typeof pgSchema>>;

export type DbClient = LibsqlDb | PostgresDb;

let dbInstance: DbClient | null = null;
let clientInstance: Client | null = null;
let postgresClient: ReturnType<typeof postgres> | null = null;
let activeDialect: DatabaseDialect | null = null;
let activeFilePath: string | null = null;

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const sqliteMigrationsFolder = join(backendRoot, 'drizzle');
const postgresMigrationsFolder = join(backendRoot, 'drizzle/pg');

const testDataDir = join(backendRoot, '.test-data');

/** @deprecated Use parseDatabaseUrl from dialect.ts */
export function resolveDatabaseUrl(databaseUrl: string): string {
  return parseDatabaseUrl(databaseUrl).url;
}

function materializeSqliteUrl(url: string): string {
  if (!url.includes(':memory:')) {
    return url;
  }

  mkdirSync(testDataDir, { recursive: true });
  activeFilePath = join(testDataDir, `${randomUUID()}.db`);
  return `file:${activeFilePath}`;
}

async function initSqlite(url: string): Promise<DbClient> {
  const filePath = url.replace(/^file:/, '');
  if (!url.includes(':memory:')) {
    mkdirSync(dirname(filePath), { recursive: true });
  }

  clientInstance = createClient({ url });
  const db = drizzleLibsql(clientInstance, { schema: sqliteSchema });
  await migrateSqlite(db, { migrationsFolder: sqliteMigrationsFolder });
  return db;
}

async function initPostgres(url: string): Promise<DbClient> {
  postgresClient = postgres(url, { max: 10 });
  const db = drizzlePostgres(postgresClient, { schema: pgSchema });
  await migratePostgres(db, { migrationsFolder: postgresMigrationsFolder });
  return db;
}

export async function initDatabase(databaseUrl: string): Promise<DbClient> {
  if (dbInstance) return dbInstance;

  const parsed = parseDatabaseUrl(databaseUrl);
  activeDialect = parsed.dialect;
  setActiveSchema(parsed.dialect);

  if (parsed.dialect === 'postgresql') {
    dbInstance = await initPostgres(parsed.url);
  } else {
    const sqliteUrl = materializeSqliteUrl(parsed.url);
    dbInstance = await initSqlite(sqliteUrl);
  }

  return dbInstance;
}

export function getDb(): DbClient {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

export function getDatabaseDialect(): DatabaseDialect {
  if (!activeDialect) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return activeDialect;
}

export async function resetDatabase(): Promise<void> {
  if (clientInstance) {
    clientInstance.close();
    clientInstance = null;
  }

  if (postgresClient) {
    await postgresClient.end({ timeout: 5 });
    postgresClient = null;
  }

  if (activeFilePath) {
    try {
      unlinkSync(activeFilePath);
    } catch {
      // File may already be removed.
    }
    activeFilePath = null;
  }

  dbInstance = null;
  activeDialect = null;
}

export { setActiveSchema, getSchema, DEFAULT_SETTINGS } from './schema.js';
export { parseDatabaseUrl } from './dialect.js';
export type { DatabaseDialect } from './dialect.js';
