/** Trims and collapses inner whitespace. */
export function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Comparison key: lowercase, no diacritics, single spaces.
 * "Chipá" and "chipa " share the key "chipa".
 */
export function textKey(text: string): string {
  return cleanText(text)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** True when every word of `query` appears in `text`, ignoring case and accents. */
export function matchesQuery(text: string, query: string): boolean {
  const haystack = textKey(text);
  return textKey(query)
    .split(' ')
    .every((word) => haystack.includes(word));
}
