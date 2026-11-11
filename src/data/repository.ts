import type {
  Dataset,
  Id,
  Item,
  NotebookMember,
  Place,
  PlacePhoto,
  PlacePhotoKind,
  Tasting,
  Visit,
} from '../domain/types';
import type { VisitDraft } from '../domain/visits';

export type NewPlace = Pick<Place, 'name' | 'type' | 'address' | 'lat' | 'lng' | 'status' | 'notes'> &
  Partial<Pick<Place, 'isRegular'>>;

export type PlacePatch = Partial<
  Pick<Place, 'name' | 'type' | 'address' | 'lat' | 'lng' | 'status' | 'isRegular' | 'notes'>
>;

export type ItemPatch = Partial<Pick<Item, 'name' | 'category'>>;
export type VisitPatch = Partial<Pick<Visit, 'date' | 'note'>>;
export type TastingPatch = Partial<
  Pick<Tasting, 'rating' | 'priceTotal' | 'quantity' | 'comment' | 'wouldReorder' | 'photoPath'>
>;

/** A draft that passed `validateVisitDraft`: it has a place. */
export type ValidVisitDraft = VisitDraft & { placeId: Id };

export interface RecordedVisit {
  visit: Visit;
  tastings: Tasting[];
  /** Items created because they did not exist in the place yet. */
  createdItems: Item[];
}

/** Thrown by every implementation, with a message that can be shown to the user (es-AR). */
export class RepositoryError extends Error {
  constructor(
    message: string,
    readonly kind: 'not-found' | 'invalid' | 'offline' | 'unauthorized' | 'unknown' = 'unknown',
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'RepositoryError';
  }
}

/**
 * The only door between the app and its data. Screens depend on this interface;
 * `memory/` and `supabase/` implement it. Swapping providers means replacing a folder.
 */
export interface Repository {
  /** The member using the app; `createdBy` of what they record. */
  currentMember(): Promise<NotebookMember>;
  listMembers(): Promise<NotebookMember[]>;

  /** Everything in the notebook. The data set is small: rules run on it in `domain/`. */
  loadDataset(): Promise<Dataset>;

  createPlace(input: NewPlace): Promise<Place>;
  updatePlace(id: Id, patch: PlacePatch): Promise<Place>;
  deletePlace(id: Id): Promise<void>;

  updateItem(id: Id, patch: ItemPatch): Promise<Item>;

  /**
   * Saves a visit with all its tastings, creating missing items and turning a
   * wishlist place into a visited one. All or nothing.
   */
  recordVisit(draft: ValidVisitDraft): Promise<RecordedVisit>;
  updateVisit(id: Id, patch: VisitPatch): Promise<Visit>;
  deleteVisit(id: Id): Promise<void>;

  updateTasting(id: Id, patch: TastingPatch): Promise<Tasting>;
  deleteTasting(id: Id): Promise<void>;

  /** Stores an already compressed image and returns its storage path. */
  uploadPhoto(placeId: Id, image: Blob): Promise<string>;
  /** A URL the browser can display for a storage path. */
  photoUrl(path: string): Promise<string>;
  addPlacePhoto(placeId: Id, kind: PlacePhotoKind, path: string): Promise<PlacePhoto>;
  deletePlacePhoto(id: Id): Promise<void>;
}
