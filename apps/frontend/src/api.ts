import type {
  AnalysisHistoryItem,
  AnalysisResult,
  FavoriteItem,
  FeedbackRecord,
  MetricsSnapshot,
  SupportedLanguage,
  SystemStatus,
} from '@shield/types';

export async function analyzePrompt(
  prompt: string,
  language: SupportedLanguage,
): Promise<AnalysisResult> {
  const res = await fetch('/api/v1/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, language, mode: 'quick' }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchHistory(
  limit = 20,
): Promise<{ items: AnalysisHistoryItem[]; total: number }> {
  const res = await fetch(`/api/v1/history?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchMetrics(): Promise<MetricsSnapshot> {
  const res = await fetch('/api/v1/metrics');
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchStatus(): Promise<SystemStatus> {
  const res = await fetch('/api/v1/status');
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchFavorites(): Promise<{ items: FavoriteItem[]; total: number }> {
  const res = await fetch('/api/v1/favorites');
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export async function addFavorite(analysisId: string): Promise<void> {
  const res = await fetch(`/api/v1/favorites/${analysisId}`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
}

export async function removeFavorite(analysisId: string): Promise<void> {
  const res = await fetch(`/api/v1/favorites/${analysisId}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
}

export async function submitFalsePositive(
  analysisId: string,
  note?: string,
): Promise<FeedbackRecord> {
  const res = await fetch('/api/v1/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisId, type: 'false_positive', note }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}
