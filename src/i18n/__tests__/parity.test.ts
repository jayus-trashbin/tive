import { describe, it, expect } from 'vitest';
import { en } from '../en';
import { ptBR } from '../pt-BR';

function collectKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [];
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, val]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'string') return [path];
    return collectKeys(val, path);
  });
}

describe('i18n parity', () => {
  const enKeys = collectKeys(en).sort();
  const ptKeys = collectKeys(ptBR).sort();

  it('pt-BR has the same keys as en', () => {
    expect(ptKeys).toEqual(enKeys);
  });

  it('every value is a non-empty string', () => {
    [...collectKeys(en), ...collectKeys(ptBR)].forEach((path) => {
      const cursor = path.split('.').reduce<unknown>((acc, k) => {
        if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[k];
        return undefined;
      }, en);
      expect(typeof cursor).toBe('string');
    });
  });
});
