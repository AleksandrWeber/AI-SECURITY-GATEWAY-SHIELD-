import type { AnalysisHistoryItem, AnalysisResult, SupportedLanguage, SystemStatus } from '@shield/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addFavorite,
  analyzePrompt,
  fetchFavorites,
  fetchHistory,
  fetchMetrics,
  fetchStatus,
  removeFavorite,
  submitFalsePositive,
} from './api';
import { HistoryPanel } from './components/HistoryPanel';
import { MetricsBar } from './components/MetricsBar';
import { ResultPanel } from './components/ResultPanel';
import { StatusPage } from './components/StatusPage';
import { DEMO_ATTACKS } from './demo-attacks';
import { createTranslator } from './i18n';

type Page = 'playground' | 'status';

export default function App() {
  const [page, setPage] = useState<Page>('playground');
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [favorites, setFavorites] = useState<AnalysisHistoryItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<Awaited<ReturnType<typeof fetchMetrics>> | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [feedbackSentIds, setFeedbackSentIds] = useState<Set<string>>(new Set());

  const tr = useMemo(() => createTranslator(language), [language]);

  const refreshSidebar = useCallback(async () => {
    try {
      const [historyData, metricsData, favoritesData] = await Promise.all([
        fetchHistory(15),
        fetchMetrics(),
        fetchFavorites(),
      ]);
      setHistory(historyData.items);
      setHistoryTotal(historyData.total);
      setMetrics(metricsData);
      setFavorites(favoritesData.items);
      setFavoriteIds(new Set(favoritesData.items.map((f) => f.id)));
    } catch {
      // Sidebar data is non-critical.
    }
  }, []);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      setStatus(await fetchStatus());
    } catch {
      setStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSidebar();
  }, [refreshSidebar]);

  useEffect(() => {
    if (page === 'status') {
      void loadStatus();
    }
  }, [page, loadStatus]);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzePrompt(prompt, language);
      setResult(data);
      await refreshSidebar();
    } catch (e) {
      setError(e instanceof Error ? e.message : tr.t('playground.errorAnalysisFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFavorite(analysisId: string) {
    try {
      if (favoriteIds.has(analysisId)) {
        await removeFavorite(analysisId);
      } else {
        await addFavorite(analysisId);
      }
      await refreshSidebar();
    } catch {
      // ignore
    }
  }

  async function handleReportFalsePositive(analysisId: string) {
    try {
      await submitFalsePositive(analysisId);
      setFeedbackSentIds((prev) => new Set(prev).add(analysisId));
      if (page === 'status') {
        await loadStatus();
      }
    } catch {
      // ignore
    }
  }

  function loadDemo(text: string) {
    setPrompt(text);
    setResult(null);
    setPage('playground');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <img src="/shield.svg" alt={tr.t('app.name')} className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">{tr.t('app.name')}</h1>
              <p className="text-xs text-slate-400">{tr.t('app.tagline')}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex rounded-lg border border-slate-700 p-0.5">
              <button
                type="button"
                data-testid="nav-playground"
                onClick={() => setPage('playground')}
                className={`rounded-md px-3 py-1 text-xs ${
                  page === 'playground' ? 'bg-sky-600 text-white' : 'text-slate-300'
                }`}
              >
                {tr.t('nav.playground')}
              </button>
              <button
                type="button"
                data-testid="nav-status"
                onClick={() => setPage('status')}
                className={`rounded-md px-3 py-1 text-xs ${
                  page === 'status' ? 'bg-sky-600 text-white' : 'text-slate-300'
                }`}
              >
                {tr.t('nav.status')}
              </button>
            </nav>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              data-testid="language-select"
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm"
            >
              <option value="en">{tr.t('language.en')}</option>
              <option value="uk">{tr.t('language.uk')}</option>
            </select>
          </div>
        </div>
      </header>

      {page === 'playground' && <MetricsBar metrics={metrics} tr={tr} />}

      <main className="mx-auto max-w-5xl px-4 py-8">
        {page === 'status' ? (
          <StatusPage status={status} loading={statusLoading} tr={tr} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <section>
                <label htmlFor="prompt" className="mb-2 block text-sm font-medium text-slate-300">
                  {tr.t('playground.promptLabel')}
                </label>
                <textarea
                  id="prompt"
                  data-testid="prompt-input"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  placeholder={tr.t('playground.promptPlaceholder')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={loading || !prompt.trim()}
                    data-testid="analyze-button"
                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
                  >
                    {loading ? tr.t('playground.analyzing') : tr.t('playground.analyze')}
                  </button>
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-400" data-testid="error-message">
                    {error}
                  </p>
                )}
              </section>

              <section>
                <h2 className="mb-3 text-sm font-medium text-slate-400">
                  {tr.t('playground.demoAttacks')}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {DEMO_ATTACKS.map((attack) => (
                    <button
                      key={attack.id}
                      type="button"
                      data-testid={`demo-${attack.id}`}
                      onClick={() => loadDemo(attack.prompt)}
                      className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300 hover:border-sky-600 hover:text-sky-300"
                    >
                      {language === 'uk' ? attack.label.uk : attack.label.en}
                    </button>
                  ))}
                </div>
              </section>

              {result && (
                <ResultPanel
                  result={result}
                  tr={tr}
                  isFavorite={favoriteIds.has(result.analysisId)}
                  feedbackSent={feedbackSentIds.has(result.analysisId)}
                  onToggleFavorite={() => handleToggleFavorite(result.analysisId)}
                  onReportFalsePositive={() => handleReportFalsePositive(result.analysisId)}
                />
              )}
            </div>

            <aside className="space-y-4 lg:col-span-1">
              <HistoryPanel
                items={history}
                total={historyTotal}
                tr={tr}
                titleKey="history.title"
                emptyKey="history.empty"
                selectedId={result?.analysisId}
              />
              <HistoryPanel
                items={favorites}
                total={favorites.length}
                tr={tr}
                titleKey="history.favoritesTitle"
                emptyKey="history.favoritesEmpty"
                selectedId={result?.analysisId}
              />
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
