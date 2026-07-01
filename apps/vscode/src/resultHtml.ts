import type { AnalysisResult, SupportedLanguage } from '@shield/types';

const RISK_COLORS: Record<AnalysisResult['risk'], string> = {
  SAFE: '#34d399',
  SUSPICIOUS: '#fbbf24',
  MALICIOUS: '#f87171',
};

function localize(text: { en: string; uk: string }, language: SupportedLanguage): string {
  return text[language] ?? text.en;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderResultHtml(result: AnalysisResult, language: SupportedLanguage): string {
  const explanation = localize(result.explanation, language);
  const recommendation = localize(result.recommendation, language);
  const educationalNote = localize(result.educationalNote, language);
  const safeAlternative = localize(result.safeAlternative, language);
  const riskColor = RISK_COLORS[result.risk];

  const fragments = result.dangerousFragments
    .map(
      (fragment) =>
        `<li><code>${escapeHtml(fragment.text)}</code> <span class="muted">(${escapeHtml(fragment.severity)})</span></li>`,
    )
    .join('');

  const matchedRules = result.matchedRules
    .map((rule) => `<li>${escapeHtml(rule.name)} <span class="muted">[${escapeHtml(rule.category)}]</span></li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';" />
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 16px;
      line-height: 1.5;
    }
    .badge {
      display: inline-block;
      border: 1px solid ${riskColor};
      color: ${riskColor};
      border-radius: 6px;
      padding: 4px 10px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    h2 { font-size: 1rem; margin: 18px 0 8px; }
    .muted { color: var(--vscode-descriptionForeground); }
    code {
      background: var(--vscode-textCodeBlock-background);
      padding: 1px 4px;
      border-radius: 4px;
    }
    ul { padding-left: 20px; }
    .grid { display: grid; gap: 8px; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="badge">${result.risk} · ${result.action}</div>
  <div class="grid">
    <div><strong>Severity:</strong> ${result.severity}</div>
    <div><strong>Confidence:</strong> ${result.confidence}%</div>
    <div><strong>Categories:</strong> ${result.categories.length ? result.categories.join(', ') : 'none'}</div>
    <div><strong>Pipeline:</strong> ${result.pipelineStage}${result.aiInvoked ? ' (AI)' : ''}</div>
  </div>

  <h2>Explanation</h2>
  <p>${escapeHtml(explanation)}</p>

  <h2>Recommendation</h2>
  <p>${escapeHtml(recommendation)}</p>

  <h2>Educational note</h2>
  <p>${escapeHtml(educationalNote)}</p>

  <h2>Safe alternative</h2>
  <p>${escapeHtml(safeAlternative)}</p>

  ${
    matchedRules
      ? `<h2>Matched rules</h2><ul>${matchedRules}</ul>`
      : ''
  }

  ${
    fragments
      ? `<h2>Dangerous fragments</h2><ul>${fragments}</ul>`
      : ''
  }
</body>
</html>`;
}
