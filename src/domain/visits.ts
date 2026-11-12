import { isValidStoredRating } from '../config/rating';
import { compareVisitsDesc } from './places';
import { cleanText } from './text';
import type { Dataset, Id, Item, IsoDate, Place, Tasting, Visit } from './types';

export interface TastingWithItem {
  tasting: Tasting;
  item: Item;
}

export interface VisitDetail {
  visit: Visit;
  place: Place;
  /** In the order they were added. */
  tastings: TastingWithItem[];
}

/** A visit with everything that was tried in it: compares items within the same visit. */
export function visitDetail(dataset: Dataset, visitId: Id): VisitDetail | null {
  const visit = dataset.visits.find((candidate) => candidate.id === visitId);
  if (!visit) return null;
  const place = dataset.places.find((candidate) => candidate.id === visit.placeId);
  if (!place) return null;

  const items = new Map(dataset.items.map((item) => [item.id, item]));
  const tastings: TastingWithItem[] = [];
  for (const tasting of dataset.tastings) {
    if (tasting.visitId !== visitId) continue;
    const item = items.get(tasting.itemId);
    if (item) tastings.push({ tasting, item });
  }
  tastings.sort((a, b) => a.tasting.createdAt.localeCompare(b.tasting.createdAt));
  return { visit, place, tastings };
}

/** Visit history of a place with its tastings, newest first. */
export function placeVisitDetails(dataset: Dataset, placeId: Id): VisitDetail[] {
  return dataset.visits
    .filter((visit) => visit.placeId === placeId)
    .sort(compareVisitsDesc)
    .map((visit) => visitDetail(dataset, visit.id))
    .filter((detail): detail is VisitDetail => detail !== null);
}

/** Latest visits across all places, newest first. */
export function recentVisits(dataset: Dataset, limit?: number): VisitDetail[] {
  const visits = [...dataset.visits].sort(compareVisitsDesc);
  return (limit === undefined ? visits : visits.slice(0, limit))
    .map((visit) => visitDetail(dataset, visit.id))
    .filter((detail): detail is VisitDetail => detail !== null);
}

/** What the visit form collects for each item tried. */
export interface TastingDraft {
  /** Existing item, or null to create one from `itemName` and `category`. */
  itemId: Id | null;
  itemName: string;
  category: string;
  rating: number | null;
  priceTotal: number | null;
  quantity: number;
  comment: string;
  wouldReorder: boolean | null;
  photoPath: string | null;
}

export interface VisitDraft {
  placeId: Id | null;
  date: IsoDate;
  note: string;
  tastings: TastingDraft[];
}

export type TastingField = 'item' | 'rating' | 'priceTotal' | 'quantity';

export interface VisitDraftErrors {
  place?: 'required';
  date?: 'invalid';
  tastings?: 'empty';
  /** Problems per tasting, by position in the draft. */
  tastingFields: Array<Partial<Record<TastingField, 'required' | 'invalid'>>>;
}

export function emptyTastingDraft(): TastingDraft {
  return {
    itemId: null,
    itemName: '',
    category: '',
    rating: null,
    priceTotal: null,
    quantity: 1,
    comment: '',
    wouldReorder: null,
    photoPath: null,
  };
}

export function isValidIsoDate(date: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
  );
}

/** Returns null when the draft can be saved. */
export function validateVisitDraft(draft: VisitDraft): VisitDraftErrors | null {
  const errors: VisitDraftErrors = { tastingFields: [] };
  if (!draft.placeId) errors.place = 'required';
  if (!isValidIsoDate(draft.date)) errors.date = 'invalid';
  if (draft.tastings.length === 0) errors.tastings = 'empty';

  errors.tastingFields = draft.tastings.map((tasting) => {
    const fields: VisitDraftErrors['tastingFields'][number] = {};
    if (!tasting.itemId && !cleanText(tasting.itemName)) fields.item = 'required';
    if (tasting.rating === null) fields.rating = 'required';
    else if (!isValidStoredRating(tasting.rating)) fields.rating = 'invalid';
    if (tasting.priceTotal !== null && (!Number.isInteger(tasting.priceTotal) || tasting.priceTotal < 0)) {
      fields.priceTotal = 'invalid';
    }
    if (!Number.isInteger(tasting.quantity) || tasting.quantity < 1) fields.quantity = 'invalid';
    return fields;
  });

  const hasErrors =
    errors.place !== undefined ||
    errors.date !== undefined ||
    errors.tastings !== undefined ||
    errors.tastingFields.some((fields) => Object.keys(fields).length > 0);
  return hasErrors ? errors : null;
}

/** Price of one unit, or null when the total is unknown. */
export function unitPrice(tasting: Pick<Tasting, 'priceTotal' | 'quantity'>): number | null {
  if (tasting.priceTotal === null || tasting.quantity < 1) return null;
  return tasting.priceTotal / tasting.quantity;
}
