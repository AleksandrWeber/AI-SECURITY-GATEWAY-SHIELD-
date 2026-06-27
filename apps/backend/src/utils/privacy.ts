import { createHash } from 'node:crypto';

const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp; replacement: string }> = [
  {
    name: 'openai_key',
    pattern: /sk-[a-zA-Z0-9]{20,}/g,
    replacement: '[REDACTED_OPENAI_KEY]',
  },
  {
    name: 'aws_key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    replacement: '[REDACTED_AWS_KEY]',
  },
  {
    name: 'bearer_token',
    pattern: /bearer\s+[a-zA-Z0-9._-]{20,}/gi,
    replacement: 'Bearer [REDACTED_TOKEN]',
  },
  {
    name: 'password_assignment',
    pattern: /password\s*[:=]\s*\S+/gi,
    replacement: 'password=[REDACTED]',
  },
  {
    name: 'api_key_assignment',
    pattern: /api[_-]?key\s*[:=]\s*\S+/gi,
    replacement: 'api_key=[REDACTED]',
  },
  {
    name: 'private_key',
    pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC )?PRIVATE KEY-----/g,
    replacement: '[REDACTED_PRIVATE_KEY]',
  },
  {
    name: 'ssn',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[REDACTED_SSN]',
  },
  {
    name: 'credit_card',
    pattern: /\b(?:\d{4}[- ]?){3}\d{4}\b/g,
    replacement: '[REDACTED_CARD]',
  },
];

export function hashPrompt(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex');
}

export function redactSecrets(text: string): string {
  let redacted = text;
  for (const { pattern, replacement } of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }
  return redacted;
}

export interface PrivacyStoragePayload {
  promptHash: string;
  promptLength: number;
  /** Never stored when privacyMode is true */
  promptText?: never;
}

export function preparePromptForStorage(
  prompt: string,
  privacyMode: boolean,
): { promptHash: string; promptLength: number; storedPrompt: string | null } {
  const redacted = redactSecrets(prompt);
  return {
    promptHash: hashPrompt(prompt),
    promptLength: prompt.length,
    storedPrompt: privacyMode ? null : redacted,
  };
}
