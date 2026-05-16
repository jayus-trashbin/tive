import type { en } from './en';

export type Language = 'en' | 'pt-BR';

/** Widen literal string types in the source dictionary into plain `string`s.
 *  This lets translation files share the same shape while having different values. */
type Widen<T> = T extends string
  ? string
  : T extends Record<string, unknown>
    ? { [K in keyof T]: Widen<T[K]> }
    : T;

export type Dictionary = Widen<typeof en>;

type DotPath<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends Record<string, unknown>
      ? DotPath<T[K], `${Prefix}${K}.`>
      : never;
}[keyof T & string];

export type TranslationKey = DotPath<Dictionary>;

export type TranslationVars = Record<string, string | number>;
