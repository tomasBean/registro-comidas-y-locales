import { describe, expect, it } from 'vitest';
import { averageRating } from './ratings';
import { emptyTastingDraft, isValidIsoDate, unitPrice, validateVisitDraft } from './visits';
import type { VisitDraft } from './visits';

const validDraft = (): VisitDraft => ({
  placeId: 'place-1',
  date: '2026-11-11',
  note: '',
  tastings: [{ ...emptyTastingDraft(), itemName: 'Chipá', category: 'chipá', rating: 8 }],
});

describe('visit draft validation', () => {
  it('accepts a complete draft', () => {
    expect(validateVisitDraft(validDraft())).toBeNull();
  });

  it('requires a place, a real date and at least one item', () => {
    const errors = validateVisitDraft({ placeId: null, date: '2026-02-30', note: '', tastings: [] });

    expect(errors).toMatchObject({ place: 'required', date: 'invalid', tastings: 'empty' });
  });

  it('reports problems per tasting', () => {
    const draft = validDraft();
    draft.tastings = [
      { ...emptyTastingDraft(), itemName: '  ' },
      { ...emptyTastingDraft(), itemId: 'item-1', rating: 11, priceTotal: -1, quantity: 0 },
      { ...emptyTastingDraft(), itemId: 'item-1', rating: 7, priceTotal: 0 },
    ];

    expect(validateVisitDraft(draft)!.tastingFields).toEqual([
      { item: 'required', rating: 'required' },
      { rating: 'invalid', priceTotal: 'invalid', quantity: 'invalid' },
      {},
    ]);
  });

  it('rejects half ratings in the stored scale and fractional prices', () => {
    const draft = validDraft();
    draft.tastings[0] = { ...draft.tastings[0]!, rating: 7.5, priceTotal: 10.5 };

    expect(validateVisitDraft(draft)!.tastingFields[0]).toEqual({ rating: 'invalid', priceTotal: 'invalid' });
  });
});

describe('helpers', () => {
  it('validates calendar dates', () => {
    expect(isValidIsoDate('2028-02-29')).toBe(true);
    expect(isValidIsoDate('2026-02-29')).toBe(false);
    expect(isValidIsoDate('11/11/2026')).toBe(false);
  });

  it('computes the unit price', () => {
    expect(unitPrice({ priceTotal: 6000, quantity: 3 })).toBe(2000);
    expect(unitPrice({ priceTotal: null, quantity: 3 })).toBeNull();
  });

  it('averages ratings and returns null when empty', () => {
    expect(averageRating([8, 8, 8, 3])).toBe(6.75);
    expect(averageRating([])).toBeNull();
  });
});
