import PDFDocument from 'pdfkit';
import type { AnalysisResult, SupportedLanguage } from '@shield/types';

type PdfDoc = InstanceType<typeof PDFDocument>;

function pickLocalized(
  text: { en: string; uk: string },
  language: SupportedLanguage,
): string {
  return text[language]?.trim() || text.en;
}

function sectionTitle(doc: PdfDoc, title: string): void {
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor('#0ea5e9').text(title);
  doc.fillColor('#111827');
  doc.moveDown(0.25);
}

function bodyText(doc: PdfDoc, text: string): void {
  doc.fontSize(10).fillColor('#374151').text(text, { lineGap: 4 });
  doc.fillColor('#111827');
}

export function generateAnalysisPdf(
  result: AnalysisResult,
  language: SupportedLanguage = 'en',
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(22).fillColor('#0f172a').text('SHIELD Analysis Report');
    doc.fontSize(10).fillColor('#64748b').text('AI Security Gateway');
    doc.moveDown();

    doc.fontSize(10).fillColor('#334155');
    doc.text(`Report ID: ${result.analysisId}`);
    doc.text(`Generated: ${result.timestamp}`);
    doc.text(`Rules version: ${result.rulesVersion}`);
    doc.moveDown();

    sectionTitle(doc, 'Risk assessment');
    doc.fontSize(14).text(`Risk: ${result.risk} · Action: ${result.action}`);
    doc.fontSize(10).text(
      `Severity: ${result.severity} · Confidence: ${result.confidence}% · Pipeline: ${result.pipelineStage}`,
    );
    if (result.aiInvoked) {
      doc.text('AI-assisted analysis: yes');
    }

    if (result.matchedRules.length > 0) {
      sectionTitle(doc, 'Matched rules');
      for (const rule of result.matchedRules) {
        bodyText(doc, `• ${rule.name} (${rule.id}) — ${rule.category}, ${rule.severity}`);
      }
    }

    const explanation = pickLocalized(result.explanation, language);
    if (explanation) {
      sectionTitle(doc, 'Explanation');
      bodyText(doc, explanation);
    }

    const educational = pickLocalized(result.educationalNote, language);
    if (educational) {
      sectionTitle(doc, 'Educational note');
      bodyText(doc, educational);
    }

    const recommendation = pickLocalized(result.recommendation, language);
    if (recommendation) {
      sectionTitle(doc, 'Recommendation');
      bodyText(doc, recommendation);
    }

    const safeAlt = pickLocalized(result.safeAlternative, language);
    if (safeAlt && result.risk !== 'SAFE') {
      sectionTitle(doc, 'Safe alternative');
      bodyText(doc, safeAlt);
    }

    if (result.dangerousFragments.length > 0) {
      sectionTitle(doc, 'Dangerous fragments');
      for (const fragment of result.dangerousFragments) {
        bodyText(doc, `• [${fragment.severity}] ${fragment.text}`);
      }
    }

    doc.moveDown();
    doc.fontSize(8).fillColor('#94a3b8').text(
      'Privacy notice: this report does not include the original prompt text. Prompt hash is stored server-side when privacy mode is enabled.',
    );

    doc.end();
  });
}
