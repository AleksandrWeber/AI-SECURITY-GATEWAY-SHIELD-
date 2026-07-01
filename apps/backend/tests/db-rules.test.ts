import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp, loadEnv } from '../src/app.js';
import { resetDatabase } from '../src/db/index.js';
import { resetAnalysisCaches } from '../src/services/analyze.js';
import { configureKnowledge, resetKnowledgeConfig } from '../src/services/knowledge.js';
import { reloadRules } from '../src/services/rules.js';

let tempKnowledgeDir = '';

describe('V3.1 database rules', () => {
  beforeEach(async () => {
    await resetDatabase();
    resetAnalysisCaches();
    reloadRules();
    tempKnowledgeDir = await mkdtemp(join(tmpdir(), 'shield-knowledge-'));
    configureKnowledge({
      knowledgeDir: tempKnowledgeDir,
      enabled: true,
      autoSuggest: true,
      maxPending: 20,
    });
  });

  afterEach(async () => {
    resetKnowledgeConfig();
    reloadRules();
    if (tempKnowledgeDir) {
      await rm(tempKnowledgeDir, { recursive: true, force: true });
      tempKnowledgeDir = '';
    }
  });

  it('promotes approved suggestion to DB and uses it at runtime', async () => {
    const app = await createApp({
      env: loadEnv({
        databaseUrl: 'file::memory:',
        privacyMode: false,
        knowledgeDir: tempKnowledgeDir,
        ruleSuggestionsEnabled: true,
        rulesDbEnabled: true,
      }),
      skipRateLimit: true,
    });

    const created = await request(app)
      .post('/api/v1/knowledge/pending/suggest')
      .send({ prompt: 'totally unique custom attack phrase xyz-12345' });

    expect(created.status).toBe(201);
    const suggestionId = created.body.id;
    const ruleId = created.body.suggestedRule.id;

    const approved = await request(app)
      .post(`/api/v1/knowledge/pending/${suggestionId}/approve`)
      .send({ note: 'ok' });
    expect(approved.status).toBe(200);

    const promoted = await request(app).post(`/api/v1/knowledge/pending/${suggestionId}/promote`);
    expect(promoted.status).toBe(200);
    expect(promoted.body.promotedRule.id).toBe(ruleId);
    expect(promoted.body.promotedRule.enabled).toBe(true);

    const listed = await request(app).get('/api/v1/rules/db');
    expect(listed.status).toBe(200);
    expect(listed.body.total).toBe(1);
    expect(listed.body.items[0].id).toBe(ruleId);
    expect(listed.body.items[0].source).toBe('promoted');
  });

  it('approve with promoteToDb inserts rule in one step', async () => {
    const app = await createApp({
      env: loadEnv({
        databaseUrl: 'file::memory:',
        knowledgeDir: tempKnowledgeDir,
        ruleSuggestionsEnabled: true,
        rulesDbEnabled: true,
      }),
      skipRateLimit: true,
    });

    const created = await request(app)
      .post('/api/v1/knowledge/pending/suggest')
      .send({ prompt: 'another unique promoted phrase abc-99999' });

    const approved = await request(app)
      .post(`/api/v1/knowledge/pending/${created.body.id}/approve`)
      .send({ promoteToDb: true });

    expect(approved.status).toBe(200);
    expect(approved.body.promotedRule).toBeTruthy();

    const listed = await request(app).get('/api/v1/rules/db');
    expect(listed.body.total).toBe(1);
  });
});
