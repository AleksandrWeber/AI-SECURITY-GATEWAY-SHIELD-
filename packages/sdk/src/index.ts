export { ShieldClient } from './client.js';
export type {
  AnalyzeOptions,
  ApproveSuggestionOptions,
  ApproveSuggestionResult,
  PromoteSuggestionResult,
  ReviewSuggestionOptions,
  ShieldClientOptions,
} from './client.js';
export { ShieldApiError } from './errors.js';
export { analyzeLocal } from './local.js';
export type { LocalAnalyzeOptions } from './local.js';
export { defaultRulesDir, findMonorepoRoot } from './paths.js';

export type {
  Action,
  AnalysisResult,
  AnalyticsSnapshot,
  BatchAnalyzeRequest,
  BatchAnalyzeResponse,
  DbRuleRecord,
  HealthStatus,
  HistoryResponse,
  MetricsSnapshot,
  Risk,
  RuleSuggestion,
  SupportedLanguage,
  SystemStatus,
  WebhookSubscription,
} from '@shield/types';
