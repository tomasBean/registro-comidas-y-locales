import { describe, expect, it } from 'vitest';
// eslint-disable-next-line no-restricted-imports
import { createSeedDataset } from '../data/memory/seed';
import { categoryRanking } from './items';
import { mostVisitedPlaces, rankPlacesByAverage } from './places';
import { monthOf, spendingByMonth } from './stats';
import { emptyDataset } from './types';

const dataset = createSeedDataset();

describe('spending by month', () => {
  it('adds up known prices per month, newest first', () => {
    expect(spendingByMonth(dataset)).toEqual([
      // Nov: Perdú 2.800 + (one chipá without price) + Albuche 13.000 + Chamigo 6.000.
      { month: '2026-11', total: 21800, visitCount: 4, pricedCount: 3, unpricedCount: 1 },
      // Oct: Perdú 2.500 + Albuche 12.500 + 4.500.
      { month: '2026-10', total: 19500, visitCount: 2, pricedCount: 3, unpricedCount: 0 },
      // Sep: Perdú 2.500 + Albuche 12.000.
      { month: '2026-09', total: 14500, visitCount: 2, pricedCount: 2, unpricedCount: 0 },
    ]);
  });

  it('is empty without visits', () => {
    expect(spendingByMonth(emptyDataset())).toEqual([]);
  });

  it('takes the month from the visit date', () => {
    expect(monthOf('2026-11-30')).toBe('2026-11');
  });
});

describe('rankings used by the stats screen', () => {
  it('most visited: this month and all time', () => {
    expect(mostVisitedPlaces(dataset, { month: '2026-10' }).map((s) => [s.place.name, s.visitCount])).toEqual([
      ['Perdú', 1],
      ['Albuche', 1],
    ]);
    expect(mostVisitedPlaces(dataset)[0]).toMatchObject({ visitCount: 4, lastVisitDate: '2026-11-10' });
  });

  it('places by average: all time and within a month', () => {
    expect(rankPlacesByAverage(dataset).map((s) => [s.place.name, s.average, s.tastingCount])).toEqual([
      ['Albuche', 7.75, 4],
      ['La Cabaña de Chamigo', 7, 1],
      ['Perdú', 6.75, 4],
    ]);
    // In November the Perdú chipá dropped: 8 and 3.
    expect(rankPlacesByAverage(dataset, { month: '2026-11' }).map((s) => [s.place.name, s.average])).toEqual([
      ['Albuche', 8],
      ['La Cabaña de Chamigo', 7],
      ['Perdú', 5.5],
    ]);
  });

  it('breaks average ties by number of tastings, then by name', () => {
    const tied = createSeedDataset();
    // Chamigo: one tasting at 7. Give Perdú a single 7 as well; Albuche keeps four.
    tied.tastings = tied.tastings.filter((t) => !t.id.startsWith('tasting-perdu') || t.id === 'tasting-perdu-1');
    tied.tastings.find((t) => t.id === 'tasting-perdu-1')!.rating = 7;
    expect(rankPlacesByAverage(tied).map((s) => s.place.name)).toEqual(['Albuche', 'La Cabaña de Chamigo', 'Perdú']);
  });

  it('best items of a category ("mis mejores chipá")', () => {
    expect(categoryRanking(dataset, 'chipá').map((e) => [e.place.name, e.item.name, e.average, e.timesTried])).toEqual([
      ['La Cabaña de Chamigo', 'Chipá', 7, 1],
      ['Perdú', 'Chipá', 6.75, 4],
    ]);
    expect(categoryRanking(dataset, 'hamburguesa')).toHaveLength(1);
    expect(categoryRanking(dataset, 'sushi')).toEqual([]);
  });

  it('puts items never tried last', () => {
    const withUntried = createSeedDataset();
    withUntried.items.push({ id: 'item-new', placeId: 'place-albuche', name: 'Chipá relleno', category: 'chipa' });
    const ranking = categoryRanking(withUntried, 'chipá');
    expect(ranking.at(-1)).toMatchObject({ average: null, timesTried: 0 });
    expect(ranking.at(-1)!.item.name).toBe('Chipá relleno');
  });
});
