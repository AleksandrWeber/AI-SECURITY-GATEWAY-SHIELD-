import * as vscode from 'vscode';
import type { SupportedLanguage } from '@shield/types';
import {
  analyzeWithConfig,
  riskMeetsThreshold,
  type ShieldExtensionConfig,
  type WarnOnRisk,
} from './analyzer.js';
import { ResultPanel } from './resultPanel.js';

function getConfig(): ShieldExtensionConfig & { warnOnRisk: WarnOnRisk } {
  const configuration = vscode.workspace.getConfiguration('shield');

  return {
    mode: configuration.get<'local' | 'remote'>('mode', 'local'),
    apiUrl: configuration.get<string>('apiUrl', 'http://localhost:3001'),
    apiKey: configuration.get<string>('apiKey') || undefined,
    language: configuration.get<SupportedLanguage>('language', 'en'),
    analysisMode: configuration.get<'quick' | 'detailed'>('analysisMode', 'quick'),
    rulesDir: configuration.get<string>('rulesDir') || undefined,
    warnOnRisk: configuration.get<WarnOnRisk>('warnOnRisk', 'SUSPICIOUS'),
  };
}

async function analyzeText(
  prompt: string,
  title: string,
  resultPanel: ResultPanel,
): Promise<void> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    void vscode.window.showWarningMessage('SHIELD: nothing to analyze');
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'SHIELD analyzing prompt…',
      cancellable: false,
    },
    async () => {
      const config = getConfig();

      try {
        const result = await analyzeWithConfig(trimmed, config);
        resultPanel.show(result, config.language, title);

        if (riskMeetsThreshold(result.risk, config.warnOnRisk)) {
          const message = `SHIELD: ${result.risk} — ${result.action}`;
          if (result.risk === 'MALICIOUS') {
            void vscode.window.showErrorMessage(message);
          } else {
            void vscode.window.showWarningMessage(message);
          }
        } else {
          void vscode.window.showInformationMessage(`SHIELD: ${result.risk} — ${result.action}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        void vscode.window.showErrorMessage(`SHIELD analysis failed: ${message}`);
      }
    },
  );
}

export function activate(context: vscode.ExtensionContext): void {
  const resultPanel = new ResultPanel();

  context.subscriptions.push(
    vscode.commands.registerCommand('shield.analyzeSelection', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        void vscode.window.showWarningMessage('SHIELD: open an editor first');
        return;
      }

      const selection = editor.document.getText(editor.selection);
      await analyzeText(selection, 'Selection', resultPanel);
    }),
    vscode.commands.registerCommand('shield.analyzeDocument', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        void vscode.window.showWarningMessage('SHIELD: open an editor first');
        return;
      }

      const text = editor.document.getText();
      const fileName = editor.document.fileName.split(/[/\\]/).pop() ?? 'Document';
      await analyzeText(text, fileName, resultPanel);
    }),
  );
}

export function deactivate(): void {}
