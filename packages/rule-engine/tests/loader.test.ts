import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it, afterEach } from 'vitest';
import { loadRulesFromDirectory, loadRulesFromDirectoryDetailed } from '../src/loader.js';
import { RuleValidationError } from '../src/schema.js';

describe('loadRulesFromDirectory', () => {
  let tempDir: string;

  afterEach(async () => {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  it('loads valid rules and skips disabled', async () => {
    tempDir = join(tmpdir(), `shield-rules-${Date.now()}`);
    await mkdir(tempDir);
    await writeFile(
      join(tempDir, 'jailbreak.json'),
      JSON.stringify({
        version: '1.0.0',
        category: 'jailbreak',
        rules: [
          {
            id: 'jb-001',
            name: 'Active',
            category: 'jailbreak',
            language: ['en'],
            severity: 'HIGH',
            type: 'contains',
            pattern: 'active',
            confidenceBoost: 40,
            enabled: true,
          },
          {
            id: 'jb-002',
            name: 'Disabled',
            category: 'jailbreak',
            language: ['en'],
            severity: 'HIGH',
            type: 'contains',
            pattern: 'disabled',
            confidenceBoost: 40,
            enabled: false,
          },
        ],
      }),
    );

    const detailed = await loadRulesFromDirectoryDetailed(tempDir);
    expect(detailed.rules).toHaveLength(1);
    expect(detailed.rulesSkipped).toBe(1);
    expect(detailed.filesLoaded).toBe(1);
  });

  it('throws on invalid JSON', async () => {
    tempDir = join(tmpdir(), `shield-rules-bad-${Date.now()}`);
    await mkdir(tempDir);
    await writeFile(join(tempDir, 'bad.json'), '{ not json');

    await expect(loadRulesFromDirectory(tempDir)).rejects.toThrow(RuleValidationError);
  });

  it('throws on schema validation failure', async () => {
    tempDir = join(tmpdir(), `shield-rules-schema-${Date.now()}`);
    await mkdir(tempDir);
    await writeFile(
      join(tempDir, 'bad.json'),
      JSON.stringify({ version: '1.0.0', category: 'jailbreak', rules: [] }),
    );

    await expect(loadRulesFromDirectory(tempDir)).rejects.toThrow(RuleValidationError);
  });
});
