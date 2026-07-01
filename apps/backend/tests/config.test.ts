import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadEnv, monorepoRoot } from '../src/config.js';

describe('config paths', () => {
  it('resolves monorepo rules directory regardless of cwd', () => {
    const env = loadEnv();
    expect(env.rulesDir).toBe(resolve(monorepoRoot, 'rules'));
    expect(existsSync(env.rulesDir)).toBe(true);
  });
});
