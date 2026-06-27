import type { MetricsSnapshot } from '@shield/types';
import type { Translator } from '../i18n';

interface Props {
  metrics: MetricsSnapshot | null;
  tr: Translator;
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function MetricsBar({ metrics, tr }: Props) {
  if (!metrics || metrics.totalRequests === 0) {
    return null;
  }

  return (
    <div
      className="border-b border-slate-800 bg-slate-950/60 px-4 py-2"
      data-testid="metrics-bar"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span>
          {tr.t('metrics.requests')}: {metrics.totalRequests}
        </span>
        <span>
          p50: {metrics.latencyMs.p50}ms · p95: {metrics.latencyMs.p95}ms
        </span>
        <span>
          {tr.t('metrics.cacheHit')}: {pct(metrics.cacheHitRate)}
        </span>
        <span>
          {tr.t('metrics.aiUsage')}: {pct(metrics.aiUsageRate)}
        </span>
        <span>
          {tr.t('metrics.errors')}: {pct(metrics.errorRate)}
        </span>
      </div>
    </div>
  );
}
