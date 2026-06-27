const ZERO_WIDTH = /[\u200B-\u200D\uFEFF\u00AD]/g;

/**
 * Normalize prompt for consistent rule matching.
 * Handles NFC, case, whitespace, and zero-width characters.
 */
export function normalizePrompt(prompt: string): string {
  return prompt
    .normalize('NFC')
    .replace(ZERO_WIDTH, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
