import { describe, expect, it } from 'vitest';
import { formatRating } from '../config/rating';
// The seed is the acceptance fixture of BRIEF.md §9; tests may read it from data/.
// eslint-disable-next-line no-restricted-imports
import { createSeedDataset } from '../data/memory/seed';
import { categoryRanking, itemEvolution, placeItemEvolutions, similarItems } from './items';
import { mostVisitedPlaces, rankPlacesByAverage, regularPlaces } from './places';
import { unitPrice, visitDetail } from './visits';

const dataset = createSeedDataset();
const item = (id: string) => dataset.items.find((candidate) => candidate.id === id)!;

describe('acceptance cases from the brief (§9)', () => {
  it('compares the chipá of every place that has it', () => {
    const ranking = categoryRanking(dataset, 'chipá');

    expect(ranking.map((entry) => [entry.place.name, entry.average])).toEqual([
      ['La Cabaña de Chamigo', 7],
      ['Perdú', 6.75],
    ]);
    // Spelling without the accent finds the same category.
    expect(categoryRanking(dataset, 'Chipa')).toHaveLength(2);
  });

  it('shows how the Albuche triple evolved', () => {
    const evolution = itemEvolution(dataset, item('item-albuche-triple'));

    expect(evolution.points.map((point) => [point.date, formatRating(point.rating)])).toEqual([
      ['2026-09-19', '4,5'],
      ['2026-10-10', '3'],
      ['2026-11-07', '4'],
    ]);
    expect(evolution.timesTried).toBe(3);
    expect(evolution.change).toBe(2);
    expect(evolution.points[0]!.tasting.comment).toContain('cheddar');
  });

  it('shows the Perdú chipá dropping from 4 to 1,5', () => {
    const evolution = itemEvolution(dataset, item('item-perdu-chipa'));

    expect(evolution.points.map((point) => formatRating(point.rating))).toEqual(['4', '4', '4', '1,5']);
    expect(formatRating(evolution.previous!.rating)).toBe('4');
    expect(formatRating(evolution.latest!.rating)).toBe('1,5');
    expect(evolution.change).toBe(-5);
  });

  it('rates fries and burger apart within the same Albuche visit', () => {
    const detail = visitDetail(dataset, 'visit-albuche-2')!;

    expect(detail.place.name).toBe('Albuche');
    expect(detail.tastings.map(({ item, tasting }) => [item.name, formatRating(tasting.rating)])).toEqual([
      ['Triple customizada', '3'],
      ['Papas', '4'],
    ]);
  });

  it('finds the most visited place of the month', () => {
    const november = mostVisitedPlaces(dataset, { month: '2026-11' });

    expect(november[0]!.place.name).toBe('Perdú');
    expect(november[0]!.visitCount).toBe(2);
    expect(november.map((summary) => summary.visitCount)).toEqual([2, 1, 1]);

    const allTime = mostVisitedPlaces(dataset);
    expect(allTime.map((summary) => [summary.place.name, summary.visitCount])).toEqual([
      ['Perdú', 4],
      ['Albuche', 3],
      ['La Cabaña de Chamigo', 1],
    ]);
    expect(mostVisitedPlaces(dataset, { month: '2025-01' })).toEqual([]);
  });

  it('keeps the Chamigo chipá as 3 units for $ 6.000', () => {
    const [point] = itemEvolution(dataset, item('item-chamigo-chipa')).points;

    expect(point!.tasting.quantity).toBe(3);
    expect(point!.tasting.priceTotal).toBe(6000);
    expect(unitPrice(point!.tasting)).toBe(2000);
    expect(formatRating(point!.rating)).toBe('3,5');
  });
});

describe('other rules over the seed', () => {
  it('ranks places by average rating', () => {
    const ranking = rankPlacesByAverage(dataset);

    expect(ranking.map((summary) => summary.place.name)).toEqual([
      'Albuche',
      'La Cabaña de Chamigo',
      'Perdú',
    ]);
    expect(ranking[0]!.average).toBe(7.75);
  });

  it('lists similar items in other places', () => {
    const similar = similarItems(dataset, item('item-perdu-chipa'));

    expect(similar.map((entry) => entry.place.name)).toEqual(['La Cabaña de Chamigo']);
    expect(similarItems(dataset, item('item-albuche-papas'))).toEqual([]);
  });

  it('suggests regulars by visit count next to the flagged ones', () => {
    const regulars = regularPlaces(dataset);

    expect(regulars.map((regular) => [regular.place.name, regular.reason])).toEqual([
      ['Perdú', 'manual'],
      ['Albuche', 'suggested'],
    ]);
  });

  it('orders the items of a place by how often they were tried', () => {
    const evolutions = placeItemEvolutions(dataset, 'place-albuche');

    expect(evolutions.map((evolution) => [evolution.item.name, evolution.timesTried])).toEqual([
      ['Triple customizada', 3],
      ['Papas', 1],
    ]);
  });
});
