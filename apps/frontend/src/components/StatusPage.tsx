import type { AnalyticsSnapshot, SystemStatus } from '@shield/types';
import type { Translator } from '../i18n';

interface Props {
  status: SystemStatus | null;
  analytics: AnalyticsSnapshot | null;
  loading: boolean;
  tr: Translator;
}

function statusColor(status: SystemStatus['status']): string {
  if (status === 'ok') return 'text-emerald-400';
  if (status === 'degraded') return 'text-amber-400';
  return 'text-red-400';
}

export function StatusPage({ status, analytics, loading, tr }: Props) {
  if (loading || !status) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6" data-testid="status-page">
        <p className="text-sm text-slate-400">{tr.t('status.loading')}</p>
      </div>
    );
  }

  const system = analytics?.runtime.system ?? status.metrics.system;

  return (
    <div className="space-y-4" data-testid="status-page">
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-200">{tr.t('status.title')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">{tr.t('status.overall')}</p>
            <p className={`text-sm font-medium ${statusColor(status.status)}`}>
              {tr.t(`status.state.${status.status}`)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{tr.t('status.version')}</p>
            <p className="text-sm text-slate-200">{status.version}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{tr.t('status.uptime')}</p>
            <p className="text-sm text-slate-200">{status.uptimeSeconds}s</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{tr.t('status.database')}</p>
            <p className="text-sm text-slate-200">
              {status.database.connected ? tr.t('status.connected') : tr.t('status.disconnected')}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="mb-3 text-sm font-medium text-slate-300">{tr.t('status.rules')}</h3>
        <p className="text-sm text-slate-400">
          v{status.rules.version} · {status.rules.count} {tr.t('status.rulesLoaded')} ({status.rules.fileCount} file · {status.rules.dbCount} db)
        </p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="mb-3 text-sm font-medium text-slate-300">{tr.t('status.aiProvider')}</h3>
        <p className="text-sm text-slate-400">
          {status.aiProvider.name} ·{' '}
          {status.aiProvider.available ? tr.t('status.available') : tr.t('status.unavailable')}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {tr.t('status.demoMode')}: {status.demoMode ? tr.t('status.on') : tr.t('status.off')} ·{' '}
          {tr.t('status.privacyMode')}: {status.privacyMode ? tr.t('status.on') : tr.t('status.off')}
        </p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="mb-3 text-sm font-medium text-slate-300">{tr.t('status.metrics')}</h3>
        <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
          <span>
            {tr.t('metrics.requests')}: {status.metrics.totalRequests}
          </span>
          <span>
            p50: {status.metrics.latencyMs.p50}ms · p95: {status.metrics.latencyMs.p95}ms
          </span>
          <span>
            {tr.t('metrics.cacheHit')}: {Math.round(status.metrics.cacheHitRate * 100)}%
          </span>
          <span>
            {tr.t('metrics.aiUsage')}: {Math.round(status.metrics.aiUsageRate * 100)}%
          </span>
          {system && (
            <>
              <span>
                {tr.t('status.memoryRss')}: {system.memoryMb.rss} MB
              </span>
              <span>
                {tr.t('status.heapUsed')}: {system.memoryMb.heapUsed} MB
              </span>
              <span>
                {tr.t('status.cpuLoad1m')}: {system.cpuLoadAvg[0].toFixed(2)}
              </span>
            </>
          )}
        </div>
      </section>

      {analytics && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6" data-testid="analytics-panel">
          <h3 className="mb-3 text-sm font-medium text-slate-300">{tr.t('status.analytics')}</h3>
          <p className="mb-2 text-sm text-slate-400">
            {tr.t('status.analysesTotal')}: {analytics.analyses.totalAnalyses}
          </p>
          <p className="mb-2 text-xs text-slate-500">{tr.t('status.riskBreakdown')}</p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-400">
            <span>{tr.risk('SAFE')}: {analytics.analyses.byRisk.SAFE}</span>
            <span>{tr.risk('SUSPICIOUS')}: {analytics.analyses.byRisk.SUSPICIOUS}</span>
            <span>{tr.risk('MALICIOUS')}: {analytics.analyses.byRisk.MALICIOUS}</span>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="mb-2 text-sm font-medium text-slate-300">{tr.t('status.feedback')}</h3>
        <p className="text-sm text-slate-400">
          {tr.t('status.falsePositives')}: {status.feedback.falsePositiveCount}
        </p>
      </section>
    </div>
  );
}
