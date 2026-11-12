/** Entities of the food notebook. Mirrors BRIEF.md §3; changing it affects the backend. */

export type Id = string;
/** Calendar date as "YYYY-MM-DD". */
export type IsoDate = string;
/** Instant as an ISO 8601 timestamp. */
export type IsoTimestamp = string;

export type PlaceStatus = 'visited' | 'wishlist';
export type PlacePhotoKind = 'menu' | 'general';

export interface Notebook {
  id: Id;
  name: string;
}

export interface NotebookMember {
  notebookId: Id;
  userId: Id;
  displayName: string;
}

export interface Place {
  id: Id;
  notebookId: Id;
  name: string;
  /** Free-text kind of venue: "panadería", "hamburguesería"… */
  type: string;
  address: string;
  lat: number | null;
  lng: number | null;
  status: PlaceStatus;
  /** Manually flagged as one of "los de siempre". */
  isRegular: boolean;
  notes: string;
  createdAt: IsoTimestamp;
}

/** A dish or product of ONE place. The same dish elsewhere is another Item sharing the category. */
export interface Item {
  id: Id;
  placeId: Id;
  name: string;
  /** Normalized label used to compare across places: "chipá", "hamburguesa"… */
  category: string;
}

export interface Visit {
  id: Id;
  placeId: Id;
  date: IsoDate;
  note: string;
  createdAt: IsoTimestamp;
}

/** One item tried in one visit. Each tasting carries its own rating. */
export interface Tasting {
  id: Id;
  visitId: Id;
  itemId: Id;
  /** Stored rating; scale defined in config/rating.ts. */
  rating: number;
  /** Total paid for `quantity` units, in whole ARS. Null when unknown. */
  priceTotal: number | null;
  quantity: number;
  comment: string;
  wouldReorder: boolean | null;
  /** Storage path of the photo, if any. */
  photoPath: string | null;
  createdBy: Id;
  createdAt: IsoTimestamp;
}

export interface PlacePhoto {
  id: Id;
  placeId: Id;
  kind: PlacePhotoKind;
  path: string;
  createdAt: IsoTimestamp;
}

/** Everything a notebook holds. Small enough to load at once and query in memory. */
export interface Dataset {
  places: Place[];
  items: Item[];
  visits: Visit[];
  tastings: Tasting[];
  placePhotos: PlacePhoto[];
}

export const emptyDataset = (): Dataset => ({
  places: [],
  items: [],
  visits: [],
  tastings: [],
  placePhotos: [],
});
