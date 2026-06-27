import type { MetricsSnapshot } from '@shield/types';

const MAX_LATENCY_SAMPLES = 1000;

interface MetricsState {
  totalRequests: number;
  errorCount: number;
  aiInvocations: number;
  aiEligibleRequests: number;
  cacheHits: number;
  latenciesMs: number[];
  startedAt: number;
}

const state: MetricsState = {
  totalRequests: 0,
  errorCount: 0,
  aiInvocations: 0,
  aiEligibleRequests: 0,
  cacheHits: 0,
  latenciesMs: [],
  startedAt: Date.now(),
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)] ?? 0;
}

export interface AnalysisMetricsInput {
  processingTimeMs: number;
  needsAi: boolean;
  pipelineStage: string;
}

export function recordAnalysisSuccess(input: AnalysisMetricsInput): void {
  state.totalRequests += 1;
  state.latenciesMs.push(input.processingTimeMs);
  if (state.latenciesMs.length > MAX_LATENCY_SAMPLES) {
    state.latenciesMs.shift();
  }

  if (input.needsAi) {
    state.aiEligibleRequests += 1;
    if (input.pipelineStage === 'cache') {
      state.cacheHits += 1;
    } else if (input.pipelineStage === 'ai') {
      state.aiInvocations += 1;
    }
  }
}

export function recordAnalysisError(): void {
  state.totalRequests += 1;
  state.errorCount += 1;
}

export function getMetricsSnapshot(): MetricsSnapshot {
  const sorted = [...state.latenciesMs].sort((a, b) => a - b);
  const total = state.totalRequests;
  const aiEligible = state.aiEligibleRequests;

  return {
    totalRequests: total,
    errorCount: state.errorCount,
    errorRate: total > 0 ? state.errorCount / total : 0,
    aiUsageRate: total > 0 ? state.aiInvocations / total : 0,
    cacheHitRate: aiEligible > 0 ? state.cacheHits / aiEligible : 0,
    latencyMs: {
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
    },
    uptimeSeconds: Math.floor((Date.now() - state.startedAt) / 1000),
  };
}

export function resetMetrics(): void {
  state.totalRequests = 0;
  state.errorCount = 0;
  state.aiInvocations = 0;
  state.aiEligibleRequests = 0;
  state.cacheHits = 0;
  state.latenciesMs = [];
  state.startedAt = Date.now();
}
