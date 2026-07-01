import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(fileURLToPath(import.meta.url));

/** Monorepo root when running from built `dist/` or `src/`. */
export function findMonorepoRoot(): string {
  const candidates = [
    resolve(packageRoot, '../..'),
    resolve(packageRoot, '../../..'),
    process.cwd(),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'rules')) && existsSync(join(candidate, 'pnpm-workspace.yaml'))) {
      return candidate;
    }
  }

  return process.cwd();
}

export function defaultRulesDir(): string {
  const fromEnv = process.env.RULES_DIR?.trim();
  if (fromEnv) return resolve(fromEnv);
  return join(findMonorepoRoot(), 'rules');
}
