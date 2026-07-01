import { readFile } from 'node:fs/promises';
import type { Action, AnalysisResult, Risk, Severity } from '@shield/types';

export interface ScanFinding {
  file: string;
  risk: Risk;
  action: Action;
  severity: Severity;
  confidence: number;
  matchedRules: number;
  categories: string[];
}

export interface ScanSummary {
  scanned: number;
  skipped: Array<{ file: string; reason: string }>;
  findings: ScanFinding[];
}

export interface ScanFilesOptions {
  files: string[];
  analyze: (prompt: string) => Promise<AnalysisResult>;
  maxFileBytes?: number;
}

function toFinding(file: string, result: AnalysisResult): ScanFinding {
  return {
    file,
    risk: result.risk,
    action: result.action,
    severity: result.severity,
    confidence: result.confidence,
    matchedRules: result.matchedRules.length,
    categories: result.categories,
  };
}

export async function scanFiles(options: ScanFilesOptions): Promise<ScanSummary> {
  const maxBytes = options.maxFileBytes ?? 32_000;
  const skipped: ScanSummary['skipped'] = [];
  const findings: ScanFinding[] = [];

  for (const file of options.files) {
    let content: string;
    try {
      const buffer = await readFile(file);
      if (buffer.byteLength === 0) {
        skipped.push({ file, reason: 'empty file' });
        continue;
      }
      if (buffer.byteLength > maxBytes) {
        skipped.push({ file, reason: `file exceeds ${maxBytes} bytes` });
        continue;
      }
      if (buffer.includes(0)) {
        skipped.push({ file, reason: 'binary file' });
        continue;
      }
      content = buffer.toString('utf-8').trim();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      skipped.push({ file, reason: message });
      continue;
    }

    if (!content) {
      skipped.push({ file, reason: 'empty content' });
      continue;
    }

    const result = await options.analyze(content);
    findings.push(toFinding(file, result));
  }

  return {
    scanned: findings.length,
    skipped,
    findings,
  };
}
