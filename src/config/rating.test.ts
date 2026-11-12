import { describe, expect, it } from 'vitest';
import { formatRating, isValidStoredRating, toDisplayRating, toStoredRating } from './rating';

describe('rating scale', () => {
  it('shows stored half-star steps on a 1–5 scale', () => {
    expect(toDisplayRating(8)).toBe(4);
    expect(toDisplayRating(3)).toBe(1.5);
    expect(toStoredRating(3.5)).toBe(7);
  });

  it('formats with a decimal comma and no trailing zero', () => {
    expect(formatRating(7)).toBe('3,5');
    expect(formatRating(8)).toBe('4');
    expect(formatRating(7.33)).toBe('3,7');
  });

  it('accepts only integers within the stored range', () => {
    expect(isValidStoredRating(1)).toBe(true);
    expect(isValidStoredRating(10)).toBe(true);
    expect(isValidStoredRating(0)).toBe(false);
    expect(isValidStoredRating(11)).toBe(false);
    expect(isValidStoredRating(4.5)).toBe(false);
  });
});
