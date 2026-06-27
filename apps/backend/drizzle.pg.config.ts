import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.pg.ts',
  out: './drizzle/pg',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://shield:shield@localhost:5432/shield',
  },
});
