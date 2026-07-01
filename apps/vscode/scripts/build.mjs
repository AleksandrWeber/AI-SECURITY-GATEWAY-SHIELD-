import { cpSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const monorepoRoot = resolve(packageRoot, '../..');
const distDir = resolve(packageRoot, 'dist');

mkdirSync(distDir, { recursive: true });
cpSync(resolve(monorepoRoot, 'rules'), resolve(distDir, 'rules'), { recursive: true });

const watch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: [resolve(packageRoot, 'src/extension.ts')],
  bundle: true,
  outfile: resolve(distDir, 'extension.js'),
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  external: ['vscode'],
  sourcemap: true,
  logLevel: 'info',
};

if (watch) {
  const context = await esbuild.context(buildOptions);
  await context.watch();
  console.log('Watching apps/vscode...');
} else {
  await esbuild.build(buildOptions);
}
