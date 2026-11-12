import { categoryKey } from './categories';
import { averageRating, compareByAverageDesc } from './ratings';
import { cleanText, matchesQuery, textKey } from './text';
import type { Dataset, Id, Item, IsoDate, Place, Tasting, Visit } from './types';

/** A tasting together with the visit it happened in. */
export interface TastingPoint {
  tasting: Tasting;
  visit: Visit;
  date: IsoDate;
  rating: number;
}

export interface ItemEvolution {
  item: Item;
  /** Oldest first. */
  points: TastingPoint[];
  latest: TastingPoint | null;
  previous: TastingPoint | null;
  /** Latest rating minus the previous one (stored scale). Null with fewer than two tastings. */
  change: number | null;
  average: number | null;
  timesTried: number;
}

function byDateAsc(a: TastingPoint, b: TastingPoint): number {
  return (
    a.date.localeCompare(b.date) ||
    a.visit.createdAt.localeCompare(b.visit.createdAt) ||
    a.tasting.createdAt.localeCompare(b.tasting.createdAt)
  );
}

/** Every time an item was tried, oldest first. */
export function itemHistory(dataset: Dataset, itemId: Id): TastingPoint[] {
  const visits = new Map(dataset.visits.map((visit) => [visit.id, visit]));
  const points: TastingPoint[] = [];
  for (const tasting of dataset.tastings) {
    if (tasting.itemId !== itemId) continue;
    const visit = visits.get(tasting.visitId);
    if (!visit) continue;
    points.push({ tasting, visit, date: visit.date, rating: tasting.rating });
  }
  return points.sort(byDateAsc);
}

/** How the rating of an item moved across visits. */
export function itemEvolution(dataset: Dataset, item: Item): ItemEvolution {
  const points = itemHistory(dataset, item.id);
  const latest = points.at(-1) ?? null;
  const previous = points.at(-2) ?? null;
  return {
    item,
    points,
    latest,
    previous,
    change: latest && previous ? latest.rating - previous.rating : null,
    average: averageRating(points.map((point) => point.rating)),
    timesTried: points.length,
  };
}

/** Evolution of every item of a place, most tried first. */
export function placeItemEvolutions(dataset: Dataset, placeId: Id): ItemEvolution[] {
  return dataset.items
    .filter((item) => item.placeId === placeId)
    .map((item) => itemEvolution(dataset, item))
    .sort(
      (a, b) =>
        b.timesTried - a.timesTried ||
        (b.latest?.date ?? '').localeCompare(a.latest?.date ?? '') ||
        a.item.name.localeCompare(b.item.name, 'es'),
    );
}

export interface CategoryEntry extends ItemEvolution {
  place: Place;
}

/**
 * Items of one category across places, best average first.
 * Answers "compare the chipá of the three places" and "my best chipá".
 */
export function categoryRanking(dataset: Dataset, category: string): CategoryEntry[] {
  const key = categoryKey(category);
  const places = new Map(dataset.places.map((place) => [place.id, place]));
  const entries: CategoryEntry[] = [];
  for (const item of dataset.items) {
    if (categoryKey(item.category) !== key) continue;
    const place = places.get(item.placeId);
    if (!place) continue;
    entries.push({ ...itemEvolution(dataset, item), place });
  }
  return entries.sort(
    (a, b) =>
      compareByAverageDesc(a.average, b.average) ||
      b.timesTried - a.timesTried ||
      a.place.name.localeCompare(b.place.name, 'es'),
  );
}

/** Same category in other places (and other items of that category in the same place). */
export function similarItems(dataset: Dataset, item: Item): CategoryEntry[] {
  return categoryRanking(dataset, item.category).filter((entry) => entry.item.id !== item.id);
}

/** Autocomplete over the items already created for a place. */
export function suggestItems(dataset: Dataset, placeId: Id, query: string): Item[] {
  const items = dataset.items.filter((item) => item.placeId === placeId);
  const timesTried = new Map<Id, number>();
  for (const tasting of dataset.tastings) {
    timesTried.set(tasting.itemId, (timesTried.get(tasting.itemId) ?? 0) + 1);
  }
  return items
    .filter((item) => !cleanText(query) || matchesQuery(item.name, query))
    .sort(
      (a, b) =>
        (timesTried.get(b.id) ?? 0) - (timesTried.get(a.id) ?? 0) ||
        a.name.localeCompare(b.name, 'es'),
    );
}

/** An existing item of the place with the same name, ignoring case and accents. */
export function findItemByName(dataset: Dataset, placeId: Id, name: string): Item | null {
  const key = textKey(name);
  return (
    dataset.items.find((item) => item.placeId === placeId && textKey(item.name) === key) ?? null
  );
}
