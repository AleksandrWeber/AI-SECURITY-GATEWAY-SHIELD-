import type {
  AnalysisResult,
  AnalyticsSnapshot,
  BatchAnalyzeRequest,
  BatchAnalyzeResponse,
  DbRuleRecord,
  FeedbackRequest,
  FeedbackRecord,
  HealthStatus,
  HistoryResponse,
  MetricsSnapshot,
  Rule,
  RuleSuggestion,
  RuleSuggestionStatus,
  SupportedLanguage,
  SystemStatus,
  WebhookEvent,
  WebhookSubscription,
} from '@shield/types';
import type { HttpTransport } from './http.js';
import { requestBuffer, requestJson } from './http.js';

export interface ShieldClientOptions {
  /** SHIELD API base URL, e.g. `http://localhost:3001` */
  baseUrl: string;
  apiKey?: string;
  fetch?: typeof fetch;
}

export interface AnalyzeOptions {
  mode?: 'quick' | 'detailed';
  language?: SupportedLanguage;
}

export interface ApproveSuggestionOptions {
  note?: string;
  promoteToDb?: boolean;
}

export interface ReviewSuggestionOptions {
  note?: string;
}

export interface ApproveSuggestionResult extends RuleSuggestion {
  promotedRule?: DbRuleRecord | null;
}

export interface PromoteSuggestionResult {
  suggestion: RuleSuggestion;
  promotedRule: DbRuleRecord;
}

export class ShieldClient {
  private readonly transport: HttpTransport;

  constructor(options: ShieldClientOptions) {
    this.transport = {
      baseUrl: options.baseUrl,
      apiKey: options.apiKey,
      fetch: options.fetch ?? globalThis.fetch,
    };
  }

  analyze(prompt: string, options: AnalyzeOptions = {}): Promise<AnalysisResult> {
    return requestJson<AnalysisResult>(this.transport, 'POST', '/api/v1/analyze', {
      prompt,
      mode: options.mode,
      language: options.language,
    });
  }

  analyzeBatch(request: BatchAnalyzeRequest): Promise<BatchAnalyzeResponse> {
    return requestJson<BatchAnalyzeResponse>(this.transport, 'POST', '/api/v1/analyze/batch', request);
  }

  getHealth(): Promise<HealthStatus> {
    return requestJson<HealthStatus>(this.transport, 'GET', '/health');
  }

  getStatus(): Promise<SystemStatus> {
    return requestJson<SystemStatus>(this.transport, 'GET', '/api/v1/status');
  }

  getHistory(limit = 20): Promise<HistoryResponse> {
    return requestJson<HistoryResponse>(this.transport, 'GET', '/api/v1/history', undefined, { limit });
  }

  getMetrics(): Promise<MetricsSnapshot> {
    return requestJson<MetricsSnapshot>(this.transport, 'GET', '/api/v1/metrics');
  }

  getAnalytics(): Promise<AnalyticsSnapshot> {
    return requestJson<AnalyticsSnapshot>(this.transport, 'GET', '/api/v1/analytics');
  }

  exportAnalysisPdf(analysisId: string, language?: SupportedLanguage): Promise<ArrayBuffer> {
    return requestBuffer(this.transport, 'GET', `/api/v1/analyze/${analysisId}/export.pdf`, undefined, {
      language,
    });
  }

  exportPdfFromResult(result: AnalysisResult, language?: SupportedLanguage): Promise<ArrayBuffer> {
    return requestBuffer(this.transport, 'POST', '/api/v1/analyze/export.pdf', {
      ...result,
      language: language ?? result.language,
    });
  }

  listWebhooks(): Promise<{ items: WebhookSubscription[]; total: number }> {
    return requestJson(this.transport, 'GET', '/api/v1/webhooks');
  }

  createWebhook(input: { url: string; events: WebhookEvent[] }): Promise<WebhookSubscription> {
    return requestJson<WebhookSubscription>(this.transport, 'POST', '/api/v1/webhooks', input);
  }

  setWebhookEnabled(id: string, enabled: boolean): Promise<{ ok: true; id: string; enabled: boolean }> {
    return requestJson(this.transport, 'PATCH', `/api/v1/webhooks/${id}`, { enabled });
  }

  deleteWebhook(id: string): Promise<{ ok: true; id: string }> {
    return requestJson(this.transport, 'DELETE', `/api/v1/webhooks/${id}`);
  }

  listPendingSuggestions(
    status: RuleSuggestionStatus = 'pending',
  ): Promise<{ items: RuleSuggestion[]; total: number; status: RuleSuggestionStatus }> {
    return requestJson(this.transport, 'GET', '/api/v1/knowledge/pending', undefined, { status });
  }

  getPendingSuggestion(id: string): Promise<RuleSuggestion> {
    return requestJson<RuleSuggestion>(this.transport, 'GET', `/api/v1/knowledge/pending/${id}`);
  }

  approveSuggestion(id: string, options: ApproveSuggestionOptions = {}): Promise<ApproveSuggestionResult> {
    return requestJson<ApproveSuggestionResult>(
      this.transport,
      'POST',
      `/api/v1/knowledge/pending/${id}/approve`,
      options,
    );
  }

  rejectSuggestion(id: string, options: ReviewSuggestionOptions = {}): Promise<RuleSuggestion> {
    return requestJson<RuleSuggestion>(
      this.transport,
      'POST',
      `/api/v1/knowledge/pending/${id}/reject`,
      options,
    );
  }

  promoteSuggestion(id: string): Promise<PromoteSuggestionResult> {
    return requestJson<PromoteSuggestionResult>(
      this.transport,
      'POST',
      `/api/v1/knowledge/pending/${id}/promote`,
    );
  }

  listDbRules(): Promise<{ items: DbRuleRecord[]; total: number }> {
    return requestJson(this.transport, 'GET', '/api/v1/rules/db');
  }

  createDbRule(rule: Rule): Promise<DbRuleRecord> {
    return requestJson<DbRuleRecord>(this.transport, 'POST', '/api/v1/rules/db', { rule });
  }

  setDbRuleEnabled(id: string, enabled: boolean): Promise<{ ok: true; id: string; enabled: boolean }> {
    return requestJson(this.transport, 'PATCH', `/api/v1/rules/db/${id}`, { enabled });
  }

  deleteDbRule(id: string): Promise<{ ok: true; id: string }> {
    return requestJson(this.transport, 'DELETE', `/api/v1/rules/db/${id}`);
  }

  listFavorites(): Promise<{ items: unknown[]; total: number }> {
    return requestJson(this.transport, 'GET', '/api/v1/favorites');
  }

  addFavorite(analysisId: string): Promise<{ ok: true; analysisId: string }> {
    return requestJson(this.transport, 'POST', `/api/v1/favorites/${analysisId}`);
  }

  removeFavorite(analysisId: string): Promise<{ ok: true; analysisId: string }> {
    return requestJson(this.transport, 'DELETE', `/api/v1/favorites/${analysisId}`);
  }

  submitFeedback(input: FeedbackRequest): Promise<FeedbackRecord> {
    return requestJson<FeedbackRecord>(this.transport, 'POST', '/api/v1/feedback', input);
  }
}
