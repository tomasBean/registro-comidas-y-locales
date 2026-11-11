import { categoryKey } from './categories';
import { summarizePlaces } from './places';
import type { PlaceSummary } from './places';
import { averageRating } from './ratings';
import { cleanText } from './text';
import type { Dataset, Place } from './types';

export interface Coordinates {
  lat: number;
  lng: number;
}

/** Córdoba, Argentina: where the map opens when there is nothing to show. */
export const DEFAULT_MAP_CENTER: Coordinates = { lat: -31.4201, lng: -64.1888 };

export function hasLocation(place: Place): place is Place & Coordinates {
  return place.lat !== null && place.lng !== null;
}

export function isValidCoordinates({ lat, lng }: Coordinates): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

/**
 * "Abrir en Google Maps": a plain search link, no API or key involved.
 * Searches by name and address so Google lands on the venue; falls back to coordinates.
 */
export function googleMapsUrl(place: Pick<Place, 'name' | 'address' | 'lat' | 'lng'>): string {
  const text = [cleanText(place.name), cleanText(place.address)].filter(Boolean).join(', ');
  const hasAddress = cleanText(place.address) !== '';
  const query =
    !hasAddress && place.lat !== null && place.lng !== null ? `${place.lat},${place.lng}` : text;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export type PinKind = 'regular' | 'visited' | 'wishlist';

export const PIN_KINDS: PinKind[] = ['regular', 'visited', 'wishlist'];

/** A place is drawn as one kind: wishlist, else "de siempre" when flagged, else visited. */
export function pinKind(place: Place): PinKind {
  if (place.status === 'wishlist') return 'wishlist';
  return place.isRegular ? 'regular' : 'visited';
}

export interface MapFilter {
  /** Kinds to show. Empty or missing means all. */
  kinds?: PinKind[];
  /** Only places that have an item of this category. */
  category?: string | null;
  /** Minimum average in the stored scale. With a category, the average of that category there. */
  minRating?: number | null;
}

export interface MapEntry extends PlaceSummary {
  kind: PinKind;
  /** The rating the filter looked at: of the category when filtering by one, else the place's. */
  rating: number | null;
}

/** Places that pass the map filters, with or without coordinates. */
export function filterPlacesForMap(dataset: Dataset, filter: MapFilter = {}): MapEntry[] {
  const kinds = filter.kinds?.length ? filter.kinds : PIN_KINDS;
  const key = filter.category ? categoryKey(filter.category) : null;

  // Ratings per place for the chosen category.
  const categoryRatings = new Map<string, number[]>();
  const placesWithCategory = new Set<string>();
  if (key) {
    const itemPlace = new Map<string, string>();
    for (const item of dataset.items) {
      if (categoryKey(item.category) !== key) continue;
      itemPlace.set(item.id, item.placeId);
      placesWithCategory.add(item.placeId);
    }
    for (const tasting of dataset.tastings) {
      const placeId = itemPlace.get(tasting.itemId);
      if (!placeId) continue;
      const ratings = categoryRatings.get(placeId) ?? [];
      ratings.push(tasting.rating);
      categoryRatings.set(placeId, ratings);
    }
  }

  return summarizePlaces(dataset)
    .map((summary): MapEntry => ({
      ...summary,
      kind: pinKind(summary.place),
      rating: key ? averageRating(categoryRatings.get(summary.place.id) ?? []) : summary.average,
    }))
    .filter((entry) => kinds.includes(entry.kind))
    .filter((entry) => !key || placesWithCategory.has(entry.place.id))
    .filter(
      (entry) =>
        filter.minRating === null ||
        filter.minRating === undefined ||
        (entry.rating !== null && entry.rating >= filter.minRating),
    )
    .sort((a, b) => a.place.name.localeCompare(b.place.name, 'es'));
}
