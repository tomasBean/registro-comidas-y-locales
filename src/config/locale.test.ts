import { describe, expect, it } from 'vitest';
import { formatDate, formatPrice, todayIsoDate } from './locale';

// Intl separates the currency symbol with a non-breaking space.
const normalize = (text: string) => text.replaceAll(String.fromCharCode(0xa0), ' ');

describe('es-AR formats', () => {
  it('formats prices as whole pesos', () => {
    expect(normalize(formatPrice(6000))).toBe('$ 6.000');
    expect(normalize(formatPrice(950))).toBe('$ 950');
  });

  it('formats ISO dates as dd/mm/aaaa without time zone shifts', () => {
    expect(formatDate('2026-03-05')).toBe('05/03/2026');
    expect(formatDate('2026-12-31T23:59:59Z')).toBe('31/12/2026');
    expect(() => formatDate('05/03/2026')).toThrow();
  });

  it('builds today as a local ISO date', () => {
    expect(todayIsoDate(new Date(2026, 0, 9, 23, 30))).toBe('2026-01-09');
  });
});
