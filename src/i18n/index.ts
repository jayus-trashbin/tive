import { useCallback } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { en } from './en';
import { ptBR } from './pt-BR';
import type { Dictionary, Language, TranslationKey, TranslationVars } from './types';

export type { Dictionary, Language, TranslationKey } from './types';
export { en, ptBR };

const DICTIONARIES: Record<Language, Dictionary> = {
  'en': en,
  'pt-BR': ptBR,
};

/** Resolve a dot-path against a dictionary, falling back to the English copy. */
function resolveKey(dict: Dictionary, key: TranslationKey): string {
  const parts = key.split('.');
  let cursor: unknown = dict;
  for (const part of parts) {
    if (cursor && typeof cursor === 'object' && part in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      cursor = undefined;
      break;
    }
  }
  if (typeof cursor === 'string') return cursor;

  // Fallback to English
  let fallback: unknown = en;
  for (const part of parts) {
    if (fallback && typeof fallback === 'object' && part in (fallback as Record<string, unknown>)) {
      fallback = (fallback as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof fallback === 'string' ? fallback : key;
}

function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`
  );
}

export function detectDefaultLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language?.toLowerCase() ?? '';
  return lang.startsWith('pt') ? 'pt-BR' : 'en';
}

/**
 * React hook that returns a typed translator and the current language.
 * Re-renders the component when the user switches languages.
 */
export function useTranslation() {
  const lang = useWorkoutStore(
    (s) => (s.userStats.language as Language | undefined) ?? detectDefaultLanguage()
  );
  const dict = DICTIONARIES[lang];

  const t = useCallback(
    (key: TranslationKey, vars?: TranslationVars) => interpolate(resolveKey(dict, key), vars),
    [dict]
  );

  return { t, lang };
}

/**
 * Non-reactive accessor for use outside React (services, stores).
 * Reads the current language from the workout store directly.
 */
export function translate(key: TranslationKey, vars?: TranslationVars): string {
  const lang =
    (useWorkoutStore.getState().userStats.language as Language | undefined) ??
    detectDefaultLanguage();
  return interpolate(resolveKey(DICTIONARIES[lang], key), vars);
}
