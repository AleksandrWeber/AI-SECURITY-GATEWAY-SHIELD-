import type { AIAnalysisInput, AIProvider, AnalysisResult } from '@shield/types';
import { buildExplanations } from '../explanation.js';

/**
 * Deterministic mock provider for tests, demos, and offline development.
 * Supplements rule-engine results when no rules matched, or adds AI confirmation.
 */
export class MockAIProvider implements AIProvider {
  readonly name = 'mock';

  isAvailable(): boolean {
    return true;
  }

  async analyze(input: AIAnalysisInput): Promise<Partial<AnalysisResult>> {
    const base = input.partialResult;

    if (base && base.matchedRules && base.matchedRules.length > 0) {
      return {
        aiInvoked: true,
        pipelineStage: 'ai',
        confidenceReasons: ['Mock AI: confirmed rule-based assessment'],
      };
    }

    const suspicious =
      /secret|password|api[_-]?key|token|credential|exploit|hack|jailbreak|developer mode|no safety rules|ignore (all )?(previous|prior) instructions|disregard\s+\w+\s+polic|hidden\s+system\s+instructions|system instructions verbatim|as a debug session|reveal your system prompt/i.test(
        input.normalizedPrompt,
      );

    if (!suspicious) {
      return {
        risk: 'SAFE',
        severity: 'LOW',
        confidence: 85,
        action: 'ALLOW',
        aiInvoked: true,
        pipelineStage: 'ai',
        confidenceReasons: ['Mock AI: no suspicious keywords detected'],
        explanation: {
          en: 'Mock AI analysis: no suspicious patterns found beyond rule scan.',
          uk: 'Mock AI аналіз: підозрілих патернів поза rule scan не знайдено.',
        },
      };
    }

    const categories = base?.categories ?? [];

    return {
      risk: 'SUSPICIOUS',
      severity: 'MEDIUM',
      confidence: 72,
      action: 'REVIEW',
      aiInvoked: true,
      pipelineStage: 'ai',
      confidenceReasons: ['Mock AI: suspicious keywords detected without rule match'],
      explanation: {
        en: 'Mock AI detected potentially sensitive or adversarial language not covered by current rules.',
        uk: 'Mock AI виявив потенційно чутливу або adversarial мову, не покриту поточними правилами.',
      },
      educationalNote: {
        en: 'Consider adding a new rule for this pattern after human review.',
        uk: 'Розгляньте додавання нового правила для цього патерну після людського review.',
      },
      recommendation: buildExplanations(
        {
          risk: 'SUSPICIOUS',
          action: 'REVIEW',
          categories,
          matchedRules: [],
          dangerousFragments: [],
        },
        [],
      ).recommendation,
      safeAlternative: {
        en: 'Rephrase your request using neutral, task-focused language.',
        uk: 'Переформулюйте запит нейтральною, task-focused мовою.',
      },
    };
  }
}
