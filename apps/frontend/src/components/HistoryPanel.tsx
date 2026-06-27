import type { AnalysisHistoryItem } from '@shield/types';
import type { Translator } from '../i18n';

const RISK_DOT = {
  SAFE: 'bg-emerald-500',
  SUSPICIOUS: 'bg-amber-500',
  MALICIOUS: 'bg-red-500',
} as const;

interface Props {
  items: AnalysisHistoryItem[];
  total: number;
  tr: Translator;
  titleKey: string;
  emptyKey: string;
  selectedId?: string | null;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function HistoryPanel({ items, total, tr, titleKey, emptyKey, selectedId }: Props) {
  return (
    <section
      className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
      data-testid="history-panel"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-slate-300">{tr.t(titleKey)}</h2>
        <span className="text-xs text-slate-500">{total}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-500">{tr.t(emptyKey)}</p>
      ) : (
        <ul className="max-h-60 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <li key={item.id}>
              <div
                data-testid={`history-item-${item.id}`}
                className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${
                  selectedId === item.id
                    ? 'border-sky-600 bg-sky-950/40'
                    : 'border-slate-800 bg-slate-900'
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${RISK_DOT[item.risk]}`} />
                  <span className="font-medium text-slate-200">{tr.risk(item.risk)}</span>
                  <span className="text-slate-500">{item.confidence}%</span>
                </div>
                <div className="text-slate-500">
                  {tr.action(item.action)} · {item.promptLength} {tr.t('history.chars')}
                </div>
                <div className="mt-0.5 text-slate-600">{formatTime(item.createdAt)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
