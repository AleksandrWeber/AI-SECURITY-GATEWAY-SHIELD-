import type { AnalysisResult } from '@shield/types';
import type { Translator } from '../i18n';
import { CopyButton } from './CopyButton';

const RISK_COLORS = {
  SAFE: 'text-emerald-400 bg-emerald-950 border-emerald-800',
  SUSPICIOUS: 'text-amber-400 bg-amber-950 border-amber-800',
  MALICIOUS: 'text-red-400 bg-red-950 border-red-800',
} as const;

interface Props {
  result: AnalysisResult;
  tr: Translator;
  isFavorite?: boolean;
  feedbackSent?: boolean;
  onToggleFavorite?: () => void;
  onReportFalsePositive?: () => void;
  onExportPdf?: () => void;
  exportingPdf?: boolean;
}

export function ResultPanel({
  result,
  tr,
  isFavorite,
  feedbackSent,
  onToggleFavorite,
  onReportFalsePositive,
  onExportPdf,
  exportingPdf,
}: Props) {
  const explanation = tr.localize(result.explanation);
  const educationalNote = tr.localize(result.educationalNote);
  const recommendation = tr.localize(result.recommendation);
  const safeAlternative = tr.localize(result.safeAlternative);

  return (
    <section
      className="rounded-xl border border-slate-800 bg-slate-900/50 p-6"
      data-testid="result-panel"
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span
          data-testid="risk-badge"
          className={`rounded-lg border px-3 py-1 text-sm font-semibold ${RISK_COLORS[result.risk]}`}
        >
          {tr.risk(result.risk)}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          {onExportPdf && (
            <button
              type="button"
              data-testid="export-pdf"
              disabled={exportingPdf}
              onClick={onExportPdf}
              className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:border-sky-600 disabled:opacity-50"
            >
              {exportingPdf ? tr.t('result.exportingPdf') : tr.t('result.exportPdf')}
            </button>
          )}
          {onToggleFavorite && (
            <button
              type="button"
              data-testid="toggle-favorite"
              onClick={onToggleFavorite}
              className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:border-sky-600"
            >
              {isFavorite ? tr.t('result.removeFavorite') : tr.t('result.toggleFavorite')}
            </button>
          )}
          {onReportFalsePositive && result.risk !== 'SAFE' && (
            <button
              type="button"
              data-testid="report-false-positive"
              disabled={feedbackSent}
              onClick={onReportFalsePositive}
              className="rounded-md border border-amber-800 px-2.5 py-1 text-xs text-amber-200 hover:bg-amber-950/40 disabled:opacity-50"
            >
              {feedbackSent ? tr.t('result.falsePositiveSent') : tr.t('result.reportFalsePositive')}
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-400">
          {tr.t('result.severity')}: {tr.severity(result.severity)}
        </span>
        <span className="text-sm text-slate-400">
          {tr.t('result.confidence')}: {result.confidence}%
        </span>
        <span className="text-sm text-slate-400">
          {tr.t('result.action')}: {tr.action(result.action)}
        </span>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full transition-all ${
            result.risk === 'MALICIOUS'
              ? 'bg-red-500'
              : result.risk === 'SUSPICIOUS'
                ? 'bg-amber-500'
                : 'bg-emerald-500'
          }`}
          style={{ width: `${result.confidence}%` }}
          data-testid="confidence-bar"
        />
      </div>

      {result.matchedRules.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-medium text-slate-300">
            {tr.t('result.matchedRules')}
          </h3>
          <ul className="space-y-1 text-sm text-slate-400">
            {result.matchedRules.map((rule) => (
              <li key={rule.id}>
                {rule.name} ({rule.category})
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.dangerousFragments.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-medium text-slate-300">
            {tr.t('result.dangerousFragments')}
          </h3>
          <ul className="space-y-1">
            {result.dangerousFragments.map((f, i) => (
              <li key={i} className="rounded bg-red-950/50 px-2 py-1 font-mono text-xs text-red-300">
                {f.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {explanation && (
        <div className="mb-4">
          <h3 className="mb-1 text-sm font-medium text-slate-300">
            {tr.t('result.explanation')}
          </h3>
          <p className="text-sm text-slate-300" data-testid="explanation">
            {explanation}
          </p>
        </div>
      )}

      {educationalNote && (
        <div className="mb-4 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
          <h3 className="mb-1 text-sm font-medium text-sky-300">
            {tr.t('result.educationalNote')}
          </h3>
          <p className="text-sm text-slate-300" data-testid="educational-note">
            {educationalNote}
          </p>
        </div>
      )}

      {recommendation && (
        <div className="mb-4">
          <h3 className="mb-1 text-sm font-medium text-slate-300">
            {tr.t('result.recommendation')}
          </h3>
          <p className="text-sm text-slate-300" data-testid="recommendation">
            {recommendation}
          </p>
        </div>
      )}

      {safeAlternative && result.risk !== 'SAFE' && (
        <div className="mb-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-emerald-300">
              {tr.t('result.safeAlternative')}
            </h3>
            <CopyButton
              text={safeAlternative}
              label={tr.t('result.copySafeAlternative')}
              copiedLabel={tr.t('result.copied')}
              testId="copy-safe-alternative"
            />
          </div>
          <p
            className="rounded-lg bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100"
            data-testid="safe-alternative"
          >
            {safeAlternative}
          </p>
        </div>
      )}

      <p className="mt-2 text-xs text-slate-500">
        {tr.processingMeta(result.processingTimeMs, result.pipelineStage, result.aiInvoked)}
      </p>
    </section>
  );
}
