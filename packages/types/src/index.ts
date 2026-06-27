export type Risk = 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

export type Action = 'ALLOW' | 'REVIEW' | 'BLOCK' | 'SANITIZE';

export type AnalyzeMode = 'quick' | 'detailed';

export type SupportedLanguage = 'en' | 'uk';

export type DetectedLanguage = 'en' | 'uk' | 'mixed';

export type RuleType = 'exact' | 'regex' | 'contains';

export type DetectionCategory =
  | 'prompt_override'
  | 'jailbreak'
  | 'extraction'
  | 'data_exfiltration'
  | 'tool_abuse'
  | 'pii_exposure';

export type PipelineStage = 'exact' | 'regex' | 'ai' | 'cache';

export interface LocalizedText {
  en: string;
  uk: string;
}

export interface Rule {
  id: string;
  name: string;
  category: DetectionCategory;
  language: (SupportedLanguage | 'universal')[];
  severity: Severity;
  type: RuleType;
  pattern: string;
  confidenceBoost: number;
  enabled: boolean;
  source?: string;
  tags?: string[];
  educationalNote?: LocalizedText;
}

export interface RuleFile {
  version: string;
  category: DetectionCategory;
  rules: Rule[];
}

export interface MatchedRule {
  id: string;
  name: string;
  severity: Severity;
  category: DetectionCategory;
}

export interface DangerousFragment {
  text: string;
  startIndex: number;
  endIndex: number;
  ruleId: string;
  ruleMatched: string;
  severity: Severity;
}

export interface AnalysisResult {
  analysisId: string;
  timestamp: string;
  rulesVersion: string;
  risk: Risk;
  severity: Severity;
  confidence: number;
  confidenceReasons: string[];
  action: Action;
  categories: DetectionCategory[];
  matchedRules: MatchedRule[];
  language: SupportedLanguage;
  detectedLanguage: DetectedLanguage;
  dangerousFragments: DangerousFragment[];
  explanation: LocalizedText;
  educationalNote: LocalizedText;
  recommendation: LocalizedText;
  safeAlternative: LocalizedText;
  aiInvoked: boolean;
  processingTimeMs: number;
  pipelineStage: PipelineStage;
}

export interface AnalyzeOptions {
  mode?: AnalyzeMode;
  language?: SupportedLanguage;
  rulesVersion?: string;
  minPromptLengthForAi?: number;
}

export interface AnalyzeRequest {
  prompt: string;
  mode?: AnalyzeMode;
  language?: SupportedLanguage;
}

export interface AIAnalysisInput {
  prompt: string;
  normalizedPrompt: string;
  language: SupportedLanguage;
  partialResult?: Partial<AnalysisResult>;
}

export interface AIProvider {
  readonly name: string;
  analyze(input: AIAnalysisInput): Promise<Partial<AnalysisResult>>;
  isAvailable(): boolean;
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
}

export interface AnalysisHistoryItem {
  id: string;
  risk: Risk;
  severity: Severity;
  confidence: number;
  action: Action;
  promptLength: number;
  aiInvoked: boolean;
  pipelineStage: PipelineStage;
  createdAt: string;
}

export interface HistoryResponse {
  items: AnalysisHistoryItem[];
  total: number;
}

export interface MetricsSnapshot {
  totalRequests: number;
  errorCount: number;
  errorRate: number;
  aiUsageRate: number;
  cacheHitRate: number;
  latencyMs: {
    p50: number;
    p95: number;
    p99: number;
  };
  uptimeSeconds: number;
}

export interface SystemStatus {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  privacyMode: boolean;
  demoMode: boolean;
  database: { connected: boolean };
  rules: { version: string; count: number };
  aiProvider: { name: string; available: boolean };
  metrics: MetricsSnapshot;
  feedback: { falsePositiveCount: number };
}

export interface FavoriteItem extends AnalysisHistoryItem {
  favoritedAt: string;
}

export type FeedbackType = 'false_positive';

export interface FeedbackRequest {
  analysisId: string;
  type: FeedbackType;
  note?: string;
}

export interface FeedbackRecord {
  id: number;
  analysisId: string;
  type: FeedbackType;
  note: string | null;
  riskAtReport: string;
  createdAt: string;
}
