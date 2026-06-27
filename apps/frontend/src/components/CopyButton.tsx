import { useState } from 'react';

interface Props {
  text: string;
  label: string;
  copiedLabel: string;
  testId?: string;
}

export function CopyButton({ text, label, copiedLabel, testId }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      data-testid={testId}
      className="rounded-md border border-emerald-700 bg-emerald-900/40 px-2.5 py-1 text-xs font-medium text-emerald-200 hover:bg-emerald-900/70"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
