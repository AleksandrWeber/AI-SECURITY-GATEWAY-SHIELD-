import { eq } from 'drizzle-orm';
import { env } from '../src/config.js';
import { initDatabase, resetDatabase } from '../src/db/index.js';
import { DEFAULT_SETTINGS } from '../src/db/schema.js';
import { useDb } from '../src/db/query.js';

async function seedSettings(): Promise<void> {
  await initDatabase(env.databaseUrl);
  const now = new Date().toISOString();

  await useDb(async ({ db, schema }) => {
    for (const row of DEFAULT_SETTINGS) {
      const existing = await db
        .select()
        .from(schema.settings)
        .where(eq(schema.settings.key, row.key))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(schema.settings).values({ key: row.key, value: row.value, updatedAt: now });
        console.log(`Seeded setting: ${row.key}`);
      }
    }
  });
}

try {
  await seedSettings();
  await resetDatabase();
  console.log('Seed complete.');
} catch (err) {
  console.error(err);
  process.exit(1);
}
