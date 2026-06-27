import en from '@locales/en/common.json';
import uk from '@locales/uk/common.json';
import type {
  Action,
  LocalizedText,
  Risk,
  Severity,
  SupportedLanguage,
} from '@shield/types';

const catalogs = { en, uk } as const;

type Catalog = (typeof catalogs)[SupportedLanguage];

function getNested(catalog: Catalog, path: string): string {
  const value = path.split('.').reduce<unknown>((obj, key) => {
    if (obj && typeof obj === 'object' && key in obj) {
      return (obj as Record<string, unknown>)[key];
    }
    return undefined;
  }, catalog);

  return typeof value === 'string' ? value : path;
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '');
}

export function createTranslator(language: SupportedLanguage) {
  const catalog = catalogs[language];

  return {
    language,
    t(path: string): string {
      return getNested(catalog, path);
    },
    localize(text: LocalizedText): string {
      return text[language] ?? text.en;
    },
    risk(risk: Risk): string {
      return catalog.risk[risk];
    },
    severity(severity: Severity): string {
      return catalog.severity[severity];
    },
    action(action: Action): string {
      return catalog.action[action];
    },
    processingMeta(ms: number, stage: string, aiInvoked: boolean): string {
      return interpolate(catalog.result.processingMeta, {
        ms: String(ms),
        stage,
        ai: aiInvoked ? ' · AI' : '',
      });
    },
  };
}

export type Translator = ReturnType<typeof createTranslator>;
