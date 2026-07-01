import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function moduleDir(): string {
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  return dirname(fileURLToPath(import.meta.url));
}

export function bundledRulesDir(): string {
  return join(moduleDir(), 'rules');
}

export function resolveRulesDir(explicit?: string): string {
  if (explicit?.trim()) {
    return resolve(explicit.trim());
  }

  const bundled = bundledRulesDir();
  if (existsSync(bundled)) {
    return bundled;
  }

  return resolve(process.cwd(), 'rules');
}

export function monorepoRulesDir(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '../../../rules');
}
