import { cleanText, matchesQuery, textKey } from './text';
import type { Dataset, Item, Place } from './types';

export interface ItemHit {
  item: Item;
  place: Place;
}

export interface SearchResults {
  places: Place[];
  items: ItemHit[];
}

/** Rank: names that start with the query first, then alphabetical. */
function byRelevance(query: string, nameOf: (index: number) => string) {
  const key = textKey(query);
  return (a: number, b: number) =>
    Number(textKey(nameOf(b)).startsWith(key)) - Number(textKey(nameOf(a)).startsWith(key)) ||
    nameOf(a).localeCompare(nameOf(b), 'es');
}

/**
 * Text search over places (name, type, address, notes) and items (name, category).
 * Ignores case and accents; every word of the query must appear.
 */
export function search(dataset: Dataset, query: string): SearchResults {
  if (!cleanText(query)) return { places: [], items: [] };

  const places = dataset.places.filter((place) =>
    matchesQuery(`${place.name} ${place.type} ${place.address} ${place.notes}`, query),
  );
  const placeById = new Map(dataset.places.map((place) => [place.id, place]));
  const items: ItemHit[] = [];
  for (const item of dataset.items) {
    const place = placeById.get(item.placeId);
    if (place && matchesQuery(`${item.name} ${item.category}`, query)) items.push({ item, place });
  }

  const placeOrder = places.map((_, index) => index).sort(byRelevance(query, (index) => places[index]!.name));
  const itemOrder = items
    .map((_, index) => index)
    .sort(
      (a, b) =>
        byRelevance(query, (index) => items[index]!.item.name)(a, b) ||
        items[a]!.place.name.localeCompare(items[b]!.place.name, 'es'),
    );
  return { places: placeOrder.map((index) => places[index]!), items: itemOrder.map((index) => items[index]!) };
}
