import * as core from '@actions/core';
import * as glob from '@actions/glob';
import { createAnalyzer } from './analyzer.js';
import { parseFailOnRisk, riskMeetsThreshold } from './risk.js';
import { scanFiles } from './scan.js';

function parseMode(value: string): 'quick' | 'detailed' {
  if (value === 'detailed') return 'detailed';
  if (value === 'quick') return 'quick';
  throw new Error(`Invalid mode: ${value}`);
}

function parseLanguage(value: string | undefined): 'en' | 'uk' | undefined {
  if (!value) return undefined;
  if (value === 'en' || value === 'uk') return value;
  throw new Error(`Invalid language: ${value}`);
}

export async function runAction(): Promise<void> {
  const paths = core.getInput('paths') || '**/*.{txt,md,prompt}';
  const mode = parseMode(core.getInput('mode') || 'quick');
  const failOnRisk = parseFailOnRisk(core.getInput('fail-on-risk') || 'SUSPICIOUS');
  const apiUrl = core.getInput('api-url').trim() || undefined;
  const apiKey = core.getInput('api-key').trim() || undefined;
  const localInput = core.getInput('local');
  const rulesDir = core.getInput('rules-dir').trim() || undefined;
  const language = parseLanguage(core.getInput('language').trim() || undefined);
  const maxFileKb = Number.parseInt(core.getInput('max-file-kb') || '32', 10);

  if (!Number.isFinite(maxFileKb) || maxFileKb < 1) {
    throw new Error('max-file-kb must be a positive integer');
  }

  const useLocal = localInput !== 'false' && !apiUrl;
  const analyzer = createAnalyzer({
    local: useLocal,
    apiUrl,
    apiKey,
    mode,
    language,
    rulesDir,
  });

  const globber = await glob.create(paths, { followSymbolicLinks: false });
  const files = await globber.glob();

  if (files.length === 0) {
    core.warning(`No files matched pattern: ${paths}`);
  }

  core.info(`SHIELD scanning ${files.length} file(s) with ${useLocal ? 'local' : 'remote'} analyzer`);

  const summary = await scanFiles({
    files,
    analyze: analyzer,
    maxFileBytes: maxFileKb * 1024,
  });

  let failedCount = 0;

  for (const finding of summary.findings) {
    const message = `[${finding.risk}/${finding.action}] ${finding.file} — ${finding.categories.join(', ') || 'no categories'}`;

    if (riskMeetsThreshold(finding.risk, failOnRisk)) {
      failedCount += 1;
      core.error(message, { title: `SHIELD ${finding.risk}` });
    } else if (finding.risk !== 'SAFE') {
      core.warning(message);
    } else {
      core.info(message);
    }
  }

  for (const skipped of summary.skipped) {
    core.info(`Skipped ${skipped.file}: ${skipped.reason}`);
  }

  const riskyFindings = summary.findings.filter((finding) => finding.risk !== 'SAFE');

  core.setOutput('scanned-count', String(summary.scanned));
  core.setOutput('findings-count', String(riskyFindings.length));
  core.setOutput('failed-count', String(failedCount));
  core.setOutput('summary', JSON.stringify(summary));

  if (failedCount > 0) {
    core.setFailed(
      `SHIELD found ${failedCount} file(s) at or above ${failOnRisk} risk (threshold: fail-on-risk=${failOnRisk})`,
    );
  }
}
