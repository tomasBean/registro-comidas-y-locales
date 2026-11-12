import { cleanText, matchesQuery, textKey } from './text';
import type { Item } from './types';

/** Stored form of a category: lowercase, trimmed. Accents are kept ("chipá"). */
export function normalizeCategory(category: string): string {
  return cleanText(category).toLowerCase();
}

/** Two categories are the same when their keys match: "chipa" === "Chipá". */
export function categoryKey(category: string): string {
  return textKey(category);
}

export function sameCategory(a: string, b: string): boolean {
  return categoryKey(a) === categoryKey(b);
}

export interface CategorySummary {
  key: string;
  /** Most used spelling, shown to the user. */
  label: string;
  itemCount: number;
}

/** Distinct categories in use, most used first. Spelling variants are merged. */
export function listCategories(items: Item[]): CategorySummary[] {
  const groups = new Map<string, Map<string, number>>();
  for (const item of items) {
    const label = normalizeCategory(item.category);
    if (!label) continue;
    const key = categoryKey(label);
    const spellings = groups.get(key) ?? new Map<string, number>();
    spellings.set(label, (spellings.get(label) ?? 0) + 1);
    groups.set(key, spellings);
  }

  return [...groups.entries()]
    .map(([key, spellings]) => {
      const ranked = [...spellings.entries()].sort(
        // Prefer the most used spelling; on ties, the accented one ("chipá" over "chipa").
        (a, b) => b[1] - a[1] || Number(b[0] !== key) - Number(a[0] !== key) || a[0].localeCompare(b[0], 'es'),
      );
      const itemCount = ranked.reduce((sum, [, count]) => sum + count, 0);
      return { key, label: ranked[0]![0], itemCount };
    })
    .sort((a, b) => b.itemCount - a.itemCount || a.label.localeCompare(b.label, 'es'));
}

/** Autocomplete: existing categories matching what was typed. */
export function suggestCategories(items: Item[], query: string): CategorySummary[] {
  const categories = listCategories(items);
  if (!cleanText(query)) return categories;
  return categories.filter((category) => matchesQuery(category.label, query));
}

/**
 * Category to store for what the user typed: reuses the existing spelling when the
 * category is already in use, so "chipa" does not create a duplicate of "chipá".
 */
export function resolveCategory(items: Item[], typed: string): string {
  const key = categoryKey(typed);
  const existing = listCategories(items).find((category) => category.key === key);
  return existing ? existing.label : normalizeCategory(typed);
}
