import type { DetectedLanguage, SupportedLanguage } from '@shield/types';

const CYRILLIC = /[\u0400-\u04FF]/g;
const LATIN = /[a-zA-Z]/g;

/**
 * Detect primary language of prompt content.
 */
export function detectPromptLanguage(prompt: string): DetectedLanguage {
  const cyrillicCount = (prompt.match(CYRILLIC) ?? []).length;
  const latinCount = (prompt.match(LATIN) ?? []).length;

  if (cyrillicCount > 0 && latinCount > 0) {
    return 'mixed';
  }

  if (cyrillicCount > latinCount) {
    return 'uk';
  }

  return 'en';
}

/**
 * Parse Accept-Language header for supported locales (en, uk).
 */
export function parseAcceptLanguage(header: string | undefined): SupportedLanguage | undefined {
  if (!header) return undefined;

  const parts = header.split(',').map((part) => {
    const [tag, qPart] = part.trim().split(';');
    const q = qPart?.startsWith('q=') ? Number(qPart.slice(2)) : 1;
    return { tag: tag.toLowerCase(), q: Number.isFinite(q) ? q : 0 };
  });

  parts.sort((a, b) => b.q - a.q);

  for (const { tag } of parts) {
    if (tag.startsWith('uk') || tag === 'ua') return 'uk';
    if (tag.startsWith('en')) return 'en';
  }

  return undefined;
}

/**
 * Resolve report language: body > Accept-Language > prompt detection > en.
 */
export function resolveReportLanguage(
  bodyLanguage: SupportedLanguage | undefined,
  acceptLanguageHeader: string | undefined,
  prompt: string,
): SupportedLanguage {
  if (bodyLanguage) return bodyLanguage;

  const fromHeader = parseAcceptLanguage(acceptLanguageHeader);
  if (fromHeader) return fromHeader;

  const detected = detectPromptLanguage(prompt);
  if (detected === 'uk') return 'uk';

  return 'en';
}
