import { describe, expect, it } from 'vitest';
import { listCategories, normalizeCategory, resolveCategory, sameCategory, suggestCategories } from './categories';
import { matchesQuery, textKey } from './text';
import type { Item } from './types';

const item = (id: string, category: string): Item => ({ id, placeId: 'p', name: id, category });

describe('categories', () => {
  it('normalizes spelling but keeps accents', () => {
    expect(normalizeCategory('  Chipá ')).toBe('chipá');
    expect(normalizeCategory('Papas   Fritas')).toBe('papas fritas');
  });

  it('treats accent and case variants as the same category', () => {
    expect(sameCategory('chipa', 'Chipá')).toBe(true);
    expect(sameCategory('chipá', 'hamburguesa')).toBe(false);
  });

  it('merges variants and prefers the most used spelling', () => {
    const items = [item('a', 'chipá'), item('b', 'chipa'), item('c', 'chipá'), item('d', 'hamburguesa')];

    expect(listCategories(items)).toEqual([
      { key: 'chipa', label: 'chipá', itemCount: 3 },
      { key: 'hamburguesa', label: 'hamburguesa', itemCount: 1 },
    ]);
  });

  it('prefers the accented spelling on a tie', () => {
    expect(listCategories([item('a', 'chipa'), item('b', 'chipá')])[0]!.label).toBe('chipá');
  });

  it('reuses the existing spelling instead of creating a duplicate', () => {
    const items = [item('a', 'chipá')];

    expect(resolveCategory(items, 'Chipa')).toBe('chipá');
    expect(resolveCategory(items, ' Empanada ')).toBe('empanada');
  });

  it('suggests categories while typing, ignoring accents', () => {
    const items = [item('a', 'chipá'), item('b', 'hamburguesa')];

    expect(suggestCategories(items, 'chi').map((category) => category.label)).toEqual(['chipá']);
    expect(suggestCategories(items, '')).toHaveLength(2);
    expect(suggestCategories(items, 'pizza')).toEqual([]);
  });
});

describe('text matching', () => {
  it('builds accent-insensitive keys', () => {
    expect(textKey('  Perdú ')).toBe('perdu');
    expect(textKey('La  Cabaña')).toBe('la cabana');
  });

  it('matches every word of the query in any order', () => {
    expect(matchesQuery('La Cabaña de Chamigo', 'chamigo caba')).toBe(true);
    expect(matchesQuery('La Cabaña de Chamigo', 'chamigo perdu')).toBe(false);
  });
});
