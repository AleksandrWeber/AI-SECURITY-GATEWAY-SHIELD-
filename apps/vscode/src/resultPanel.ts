import * as vscode from 'vscode';
import type { AnalysisResult, SupportedLanguage } from '@shield/types';
import { renderResultHtml } from './resultHtml.js';

const VIEW_TYPE = 'shield.result';

export class ResultPanel {
  private panel: vscode.WebviewPanel | undefined;

  show(result: AnalysisResult, language: SupportedLanguage, title: string): void {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        VIEW_TYPE,
        'SHIELD Analysis',
        vscode.ViewColumn.Beside,
        { enableScripts: false, retainContextWhenHidden: true },
      );

      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });
    }

    this.panel.title = `SHIELD — ${title}`;
    this.panel.webview.html = renderResultHtml(result, language);
    this.panel.reveal(vscode.ViewColumn.Beside);
  }
}
