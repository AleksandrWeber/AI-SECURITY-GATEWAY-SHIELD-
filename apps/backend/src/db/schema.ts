import type { DatabaseDialect } from './dialect.js';
import * as pgSchema from './schema.pg.js';
import * as sqliteSchema from './schema.sqlite.js';

export type AppSchema = typeof sqliteSchema;

let activeSchema: AppSchema = sqliteSchema;

export function setActiveSchema(dialect: DatabaseDialect): void {
  activeSchema = (dialect === 'postgresql' ? pgSchema : sqliteSchema) as AppSchema;
}

export function getSchema(): AppSchema {
  return activeSchema;
}

export const DEFAULT_SETTINGS = [
  { key: 'privacy_mode', value: 'true' },
  { key: 'rules_version', value: '1.0.0' },
] as const;
