import type { AnalysisResult, AnalyzeMode, SupportedLanguage } from '@shield/types';

export interface RemoteAnalyzeOptions {
  prompt: string;
  url: string;
  mode?: AnalyzeMode;
  language?: SupportedLanguage;
  apiKey?: string;
}

export class ShieldApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ShieldApiError';
  }
}

export async function analyzeRemote(options: RemoteAnalyzeOptions): Promise<AnalysisResult> {
  const baseUrl = options.url.replace(/\/$/, '');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.apiKey) {
    headers.Authorization = `Bearer ${options.apiKey}`;
  }

  const response = await fetch(`${baseUrl}/api/v1/analyze`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: options.prompt,
      mode: options.mode ?? 'quick',
      language: options.language,
    }),
  });

  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message =
      typeof body === 'object' && body && 'message' in body
        ? String((body as { message: string }).message)
        : `HTTP ${response.status}`;
    throw new ShieldApiError(message, response.status, body);
  }

  return body as AnalysisResult;
}
