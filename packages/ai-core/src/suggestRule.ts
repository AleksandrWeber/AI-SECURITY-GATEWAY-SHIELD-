import type {
  AnalysisResult,
  DetectionCategory,
  LocalizedText,
  Rule,
  RuleSuggestionSource,
  Severity,
  SupportedLanguage,
} from '@shield/types';

export const CATEGORY_PREFIX: Record<DetectionCategory, string> = {
  prompt_override: 'po',
  jailbreak: 'jb',
  extraction: 'ex',
  data_exfiltration: 'de',
  tool_abuse: 'ta',
  pii_exposure: 'pi',
  indirect_injection: 'ii',
  rag_poisoning: 'rg',
  role_confusion: 'rc',
  context_manipulation: 'cm',
};

const CATEGORY_KEYWORDS: Array<{ category: DetectionCategory; pattern: RegExp }> = [
  { category: 'prompt_override', pattern: /ignore (all )?(previous|prior|above) instructions/i },
  { category: 'jailbreak', pattern: /\b(dan|jailbreak|developer mode|do anything now)\b/i },
  { category: 'extraction', pattern: /\b(system prompt|reveal instructions|show your rules)\b/i },
  { category: 'data_exfiltration', pattern: /\b(exfiltrate|dump database|export all users)\b/i },
  { category: 'tool_abuse', pattern: /\b(run shell|execute command|curl http|wget)\b/i },
  { category: 'pii_exposure', pattern: /\b(ssn|social security|credit card|passport number)\b/i },
  { category: 'indirect_injection', pattern: /\b(hidden instruction|embedded command|ignore when summarizing)\b/i },
  { category: 'rag_poisoning', pattern: /\b(poison|corrupt).*(knowledge|vector|retrieval)/i },
  { category: 'role_confusion', pattern: /\b(you are now|pretend to be|act as (?:an? )?(admin|root|developer))\b/i },
  { category: 'context_manipulation', pattern: /\b(forget (everything|context)|reset conversation|new session)\b/i },
];

export interface RuleSuggestionInput {
  prompt: string;
  normalizedPrompt: string;
  result: Pick<
    AnalysisResult,
    'risk' | 'severity' | 'confidence' | 'action' | 'categories' | 'matchedRules' | 'aiInvoked'
  >;
  language: SupportedLanguage;
  existingRules: Rule[];
}

export interface RuleSuggestionDraft {
  suggestedRule: Rule;
  rationale: LocalizedText;
  category: DetectionCategory;
}

export function shouldSuggestRule(
  result: Pick<AnalysisResult, 'risk' | 'matchedRules' | 'aiInvoked'>,
): boolean {
  if (!result.aiInvoked) return false;
  if (result.matchedRules.length > 0) return false;
  return result.risk !== 'SAFE';
}

export function nextRuleId(category: DetectionCategory, existingRules: Rule[]): string {
  const prefix = CATEGORY_PREFIX[category];
  const numbers = existingRules
    .filter((rule) => rule.id.startsWith(`${prefix}-`))
    .map((rule) => Number.parseInt(rule.id.split('-')[1] ?? '', 10))
    .filter((value) => Number.isFinite(value));

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

function inferCategory(
  prompt: string,
  normalizedPrompt: string,
  categories: DetectionCategory[],
): DetectionCategory {
  if (categories.length > 0) return categories[0];

  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.pattern.test(prompt) || entry.pattern.test(normalizedPrompt)) {
      return entry.category;
    }
  }

  return 'prompt_override';
}

function extractPattern(normalizedPrompt: string): { type: Rule['type']; pattern: string } {
  const trimmed = normalizedPrompt.trim().slice(0, 120);
  const words = trimmed.split(/\s+/).filter(Boolean);

  if (words.length >= 3 && words.length <= 8) {
    return { type: 'contains', pattern: words.join(' ').slice(0, 80) };
  }

  if (words.length > 8) {
    return { type: 'contains', pattern: words.slice(0, 6).join(' ').slice(0, 80) };
  }

  return { type: 'contains', pattern: trimmed.slice(0, 60) || 'suspicious prompt pattern' };
}

function severityForRisk(risk: AnalysisResult['risk']): Severity {
  if (risk === 'MALICIOUS') return 'HIGH';
  if (risk === 'SUSPICIOUS') return 'MEDIUM';
  return 'LOW';
}

function buildRuleName(category: DetectionCategory, pattern: string, language: SupportedLanguage): string {
  const shortPattern = pattern.length > 40 ? `${pattern.slice(0, 37)}...` : pattern;
  const categoryLabel = category.replace(/_/g, ' ');
  return language === 'uk'
    ? `AI пропозиція: ${categoryLabel} (${shortPattern})`
    : `AI suggestion: ${categoryLabel} (${shortPattern})`;
}

/**
 * Deterministic mock rule suggestion for offline development and tests.
 * Never writes to /rules — callers persist to knowledge/pending only.
 */
export function buildMockRuleSuggestion(input: RuleSuggestionInput): RuleSuggestionDraft {
  const category = inferCategory(input.prompt, input.normalizedPrompt, input.result.categories);
  const { type, pattern } = extractPattern(input.normalizedPrompt);
  const id = nextRuleId(category, input.existingRules);
  const severity = severityForRisk(input.result.risk);

  const suggestedRule: Rule = {
    id,
    name: buildRuleName(category, pattern, input.language),
    category,
    language: [input.language, 'universal'],
    severity,
    type,
    pattern,
    confidenceBoost: input.result.risk === 'MALICIOUS' ? 35 : 28,
    enabled: false,
    source: 'ai-suggestion',
    tags: ['pending-review', 'ai-generated'],
    educationalNote: {
      en: 'Suggested by AI after detecting a gap in active rules. Requires human approval before activation.',
      uk: 'Запропоновано AI після виявлення прогалини в активних правилах. Потребує людського схвалення.',
    },
  };

  const rationale: LocalizedText = {
    en: `Mock AI detected ${input.result.risk} risk without rule matches. Proposed a "${type}" pattern for category "${category}".`,
    uk: `Mock AI виявив ризик ${input.result.risk} без збігів правил. Запропоновано патерн "${type}" для категорії "${category}".`,
  };

  return { suggestedRule, rationale, category };
}

export function buildSuggestionFromPrompt(params: {
  prompt: string;
  normalizedPrompt: string;
  language: SupportedLanguage;
  existingRules: Rule[];
  source?: RuleSuggestionSource;
}): RuleSuggestionDraft {
  const suspicious =
    /secret|password|api[_-]?key|token|credential|exploit|hack|ignore|jailbreak|inject/i.test(
      params.normalizedPrompt,
    );

  const result: RuleSuggestionInput['result'] = {
    risk: suspicious ? 'SUSPICIOUS' : 'SAFE',
    severity: suspicious ? 'MEDIUM' : 'LOW',
    confidence: suspicious ? 72 : 85,
    action: suspicious ? 'REVIEW' : 'ALLOW',
    categories: [],
    matchedRules: [],
    aiInvoked: true,
  };

  return buildMockRuleSuggestion({
    prompt: params.prompt,
    normalizedPrompt: params.normalizedPrompt,
    result,
    language: params.language,
    existingRules: params.existingRules,
  });
}
