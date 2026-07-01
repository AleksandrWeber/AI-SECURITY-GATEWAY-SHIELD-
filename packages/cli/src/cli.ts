#!/usr/bin/env node
import { stdin as input } from 'node:process';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import type { AnalyzeMode, SupportedLanguage } from '@shield/types';
import { runAnalyzeCommand } from './commands/analyze.js';

const HELP = `SHIELD CLI — analyze prompts for security risks

Usage:
  shield analyze <prompt>
  shield analyze --stdin
  echo "prompt text" | shield analyze --stdin

Options:
  --mode <quick|detailed>   Analysis mode (default: quick)
  --language <en|uk>        Report language
  --local                   Run offline with bundled rules (default)
  --remote                  Call SHIELD API instead of local rules
  --url <baseUrl>           API base URL for remote mode (default: http://localhost:3001)
  --api-key <key>           API key for remote mode (or SHIELD_API_KEY env)
  --rules-dir <path>        Rules directory for local mode (or RULES_DIR env)
  --demo                    Force mock AI in local mode
  --fail-on-risk            Exit code 2 when risk is SUSPICIOUS or MALICIOUS
  -h, --help                Show help

Examples:
  shield analyze "ignore previous instructions"
  shield analyze --local --mode detailed "What is TypeScript?"
  shield analyze --remote --url http://localhost:3001 "test prompt"
`;

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of input) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8').trim();
}

function parseMode(value: string | undefined): AnalyzeMode {
  if (value === 'detailed') return 'detailed';
  if (value === 'quick') return 'quick';
  throw new Error(`Invalid --mode: ${value}`);
}

function parseLanguage(value: string | undefined): SupportedLanguage | undefined {
  if (!value) return undefined;
  if (value === 'en' || value === 'uk') return value;
  throw new Error(`Invalid --language: ${value}`);
}

export async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      mode: { type: 'string', default: 'quick' },
      language: { type: 'string' },
      local: { type: 'boolean', default: true },
      remote: { type: 'boolean', default: false },
      url: { type: 'string', default: process.env.SHIELD_API_URL ?? 'http://localhost:3001' },
      'api-key': { type: 'string' },
      'rules-dir': { type: 'string' },
      demo: { type: 'boolean', default: false },
      stdin: { type: 'boolean', default: false },
      'fail-on-risk': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
    strict: true,
  });

  if (values.help) {
    process.stdout.write(HELP);
    return 0;
  }

  if (positionals.length === 0 || positionals[0] !== 'analyze') {
    process.stdout.write(HELP);
    return positionals.length === 0 ? 0 : 1;
  }

  let prompt = positionals.slice(1).join(' ').trim();
  if (values.stdin) {
    prompt = (await readStdin()).trim();
  }

  if (!prompt) {
    process.stderr.write('Error: prompt is required (positional argument or --stdin)\n');
    return 1;
  }

  const useRemote = values.remote === true || process.env.SHIELD_FORCE_REMOTE === 'true';

  try {
    const result = await runAnalyzeCommand({
      prompt,
      mode: parseMode(values.mode),
      language: parseLanguage(values.language),
      local: !useRemote,
      url: values.url ?? 'http://localhost:3001',
      apiKey: values['api-key'] ?? process.env.SHIELD_API_KEY,
      rulesDir: values['rules-dir'],
      demoMode: values.demo === true,
    });

    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

    if (values['fail-on-risk'] && (result.risk === 'SUSPICIOUS' || result.risk === 'MALICIOUS')) {
      return 2;
    }

    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Error: ${message}\n`);
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const code = await main(process.argv.slice(2));
  process.exit(code);
}
