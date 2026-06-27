import { z } from 'zod';
import type { Rule, RuleFile } from '@shield/types';

const detectionCategorySchema = z.enum([
  'prompt_override',
  'jailbreak',
  'extraction',
  'data_exfiltration',
  'tool_abuse',
  'pii_exposure',
  'indirect_injection',
  'rag_poisoning',
  'role_confusion',
  'context_manipulation',
]);

const severitySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

const ruleTypeSchema = z.enum(['exact', 'regex', 'contains']);

const ruleLanguageSchema = z.enum(['en', 'uk', 'universal']);

const localizedTextSchema = z.object({
  en: z.string().min(1),
  uk: z.string().min(1),
});

export const ruleSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .regex(/^[a-z]{2}-\d{3}$/i, 'Rule id must match format: xx-000 (e.g. jb-001)'),
    name: z.string().min(1).max(200),
    category: detectionCategorySchema,
    language: z.array(ruleLanguageSchema).min(1),
    severity: severitySchema,
    type: ruleTypeSchema,
    pattern: z.string().min(1).max(2000),
    confidenceBoost: z.number().int().min(0).max(100),
    enabled: z.boolean().default(true),
    source: z.string().max(100).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    educationalNote: localizedTextSchema.optional(),
  })
  .superRefine((rule, ctx) => {
    if (rule.type === 'regex') {
      try {
        new RegExp(rule.pattern);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pattern'],
          message: `Invalid regex pattern: ${rule.pattern}`,
        });
      }
    }
  });

export const ruleFileSchema = z
  .object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver (e.g. 1.0.0)'),
    category: detectionCategorySchema,
    rules: z.array(ruleSchema).min(1),
  })
  .superRefine((file, ctx) => {
    const ids = new Set<string>();

    file.rules.forEach((rule, index) => {
      if (rule.category !== file.category) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rules', index, 'category'],
          message: `Rule category "${rule.category}" must match file category "${file.category}"`,
        });
      }

      if (ids.has(rule.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rules', index, 'id'],
          message: `Duplicate rule id: ${rule.id}`,
        });
      }
      ids.add(rule.id);
    });
  });

export type RuleSchema = z.infer<typeof ruleSchema>;
export type RuleFileSchema = z.infer<typeof ruleFileSchema>;

export class RuleValidationError extends Error {
  constructor(
    message: string,
    readonly fileName: string,
    readonly issues: z.ZodIssue[],
  ) {
    super(message);
    this.name = 'RuleValidationError';
  }

  formatIssues(): string[] {
    return this.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `[${path}] ${issue.message}`;
    });
  }
}

export function parseRule(data: unknown): Rule {
  return ruleSchema.parse(data) as Rule;
}

export function parseRuleFile(data: unknown): RuleFile {
  return ruleFileSchema.parse(data) as RuleFile;
}

export function safeParseRuleFile(data: unknown) {
  return ruleFileSchema.safeParse(data);
}

export function validateRuleFile(data: unknown, fileName: string): RuleFile {
  const result = ruleFileSchema.safeParse(data);

  if (!result.success) {
    throw new RuleValidationError(
      `Invalid rule file: ${fileName}`,
      fileName,
      result.error.issues,
    );
  }

  return result.data as RuleFile;
}
