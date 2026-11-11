import { averageRating, compareByAverageDesc } from './ratings';
import type { Dataset, Id, IsoDate, Place, Visit } from './types';

/** Visits of a place at or above this count make it a suggested "de siempre". */
export const SUGGESTED_REGULAR_MIN_VISITS = 3;

export interface PlaceSummary {
  place: Place;
  visitCount: number;
  lastVisitDate: IsoDate | null;
  /** Mean of every tasting rating at the place (stored scale). */
  average: number | null;
  tastingCount: number;
}

export function compareVisitsDesc(a: Visit, b: Visit): number {
  return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
}

/** Visits of a place, newest first. */
export function visitsOfPlace(dataset: Dataset, placeId: Id): Visit[] {
  return dataset.visits.filter((visit) => visit.placeId === placeId).sort(compareVisitsDesc);
}

export interface VisitFilter {
  /** Only visits of this month, as "YYYY-MM". */
  month?: string;
}

function inFilter(visit: Visit, filter: VisitFilter): boolean {
  return !filter.month || visit.date.startsWith(`${filter.month}-`);
}

/** One summary per place, counting only the visits that pass the filter. */
export function summarizePlaces(dataset: Dataset, filter: VisitFilter = {}): PlaceSummary[] {
  const visitsByPlace = new Map<Id, Visit[]>();
  const placeByVisit = new Map<Id, Id>();
  for (const visit of dataset.visits) {
    if (!inFilter(visit, filter)) continue;
    const visits = visitsByPlace.get(visit.placeId) ?? [];
    visits.push(visit);
    visitsByPlace.set(visit.placeId, visits);
    placeByVisit.set(visit.id, visit.placeId);
  }

  const ratingsByPlace = new Map<Id, number[]>();
  for (const tasting of dataset.tastings) {
    const placeId = placeByVisit.get(tasting.visitId);
    if (!placeId) continue;
    const ratings = ratingsByPlace.get(placeId) ?? [];
    ratings.push(tasting.rating);
    ratingsByPlace.set(placeId, ratings);
  }

  return dataset.places.map((place) => {
    const visits = visitsByPlace.get(place.id) ?? [];
    const ratings = ratingsByPlace.get(place.id) ?? [];
    return {
      place,
      visitCount: visits.length,
      lastVisitDate: visits.reduce<IsoDate | null>(
        (latest, visit) => (latest === null || visit.date > latest ? visit.date : latest),
        null,
      ),
      average: averageRating(ratings),
      tastingCount: ratings.length,
    };
  });
}

export function summarizePlace(dataset: Dataset, placeId: Id): PlaceSummary | null {
  return summarizePlaces(dataset).find((summary) => summary.place.id === placeId) ?? null;
}

/** Places with at least one visit in the period, most visited first. */
export function mostVisitedPlaces(dataset: Dataset, filter: VisitFilter = {}): PlaceSummary[] {
  return summarizePlaces(dataset, filter)
    .filter((summary) => summary.visitCount > 0)
    .sort(
      (a, b) =>
        b.visitCount - a.visitCount ||
        (b.lastVisitDate ?? '').localeCompare(a.lastVisitDate ?? '') ||
        a.place.name.localeCompare(b.place.name, 'es'),
    );
}

/** Places ranked by average rating, best first. Places without ratings are left out. */
export function rankPlacesByAverage(dataset: Dataset, filter: VisitFilter = {}): PlaceSummary[] {
  return summarizePlaces(dataset, filter)
    .filter((summary) => summary.average !== null)
    .sort(
      (a, b) =>
        compareByAverageDesc(a.average, b.average) ||
        b.tastingCount - a.tastingCount ||
        a.place.name.localeCompare(b.place.name, 'es'),
    );
}

export interface RegularPlace extends PlaceSummary {
  /** `manual`: flagged by the user. `suggested`: enough visits to qualify. */
  reason: 'manual' | 'suggested';
}

/** "Los de siempre": flagged places first, then the ones suggested by visit count. */
export function regularPlaces(
  dataset: Dataset,
  minVisits: number = SUGGESTED_REGULAR_MIN_VISITS,
): RegularPlace[] {
  return summarizePlaces(dataset)
    .filter((summary) => summary.place.isRegular || summary.visitCount >= minVisits)
    .map((summary) => ({
      ...summary,
      reason: summary.place.isRegular ? ('manual' as const) : ('suggested' as const),
    }))
    .sort(
      (a, b) =>
        Number(b.place.isRegular) - Number(a.place.isRegular) ||
        b.visitCount - a.visitCount ||
        a.place.name.localeCompare(b.place.name, 'es'),
    );
}

/** The "quiero ir" list, newest first. */
export function wishlistPlaces(dataset: Dataset): Place[] {
  return dataset.places
    .filter((place) => place.status === 'wishlist')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Registering a visit turns a wishlist place into a visited one. */
export function placeAfterVisit(place: Place): Place {
  return place.status === 'wishlist' ? { ...place, status: 'visited' } : place;
}
