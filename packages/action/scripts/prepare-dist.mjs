import { cpSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const monorepoRoot = resolve(packageRoot, '../..');
const distDir = resolve(packageRoot, 'dist');

mkdirSync(distDir, { recursive: true });
cpSync(resolve(monorepoRoot, 'rules'), resolve(distDir, 'rules'), { recursive: true });
