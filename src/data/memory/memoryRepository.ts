import { resolveCategory } from '../../domain/categories';
import { findItemByName } from '../../domain/items';
import { placeAfterVisit } from '../../domain/places';
import { cleanText } from '../../domain/text';
import { emptyDataset } from '../../domain/types';
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
} from '../../domain/types';
import { validateVisitDraft } from '../../domain/visits';
import { RepositoryError } from '../repository';
import type {
  ItemPatch,
  NewPlace,
  PlacePatch,
  RecordedVisit,
  Repository,
  TastingPatch,
  ValidVisitDraft,
  VisitPatch,
} from '../repository';

export interface MemoryRepositoryOptions {
  dataset?: Dataset;
  members?: NotebookMember[];
  /** Injectable for deterministic tests. */
  now?: () => Date;
  newId?: () => Id;
}

const DEFAULT_MEMBER: NotebookMember = {
  notebookId: 'notebook-1',
  userId: 'user-1',
  displayName: 'Yo',
};

/**
 * Repository that lives in memory: used for development, demos and tests.
 * Data is lost on reload. Reads return copies, so callers cannot mutate the store.
 */
export class MemoryRepository implements Repository {
  private data: Dataset;
  private readonly members: NotebookMember[];
  private readonly photos = new Map<string, Blob>();
  private readonly photoUrls = new Map<string, string>();
  private readonly now: () => Date;
  private readonly newId: () => Id;

  constructor(options: MemoryRepositoryOptions = {}) {
    this.data = structuredClone(options.dataset ?? emptyDataset());
    this.members = options.members?.length ? options.members : [DEFAULT_MEMBER];
    this.now = options.now ?? (() => new Date());
    this.newId = options.newId ?? (() => crypto.randomUUID());
  }

  async currentMember(): Promise<NotebookMember> {
    return { ...this.members[0]! };
  }

  async listMembers(): Promise<NotebookMember[]> {
    return structuredClone(this.members);
  }

  async loadDataset(): Promise<Dataset> {
    return structuredClone(this.data);
  }

  async createPlace(input: NewPlace): Promise<Place> {
    const name = cleanText(input.name);
    if (!name) throw new RepositoryError('El lugar necesita un nombre.', 'invalid');
    const place: Place = {
      id: this.newId(),
      notebookId: this.members[0]!.notebookId,
      name,
      type: cleanText(input.type).toLowerCase(),
      address: cleanText(input.address),
      lat: input.lat,
      lng: input.lng,
      status: input.status,
      isRegular: input.isRegular ?? false,
      notes: input.notes.trim(),
      createdAt: this.timestamp(),
    };
    this.data.places.push(place);
    return { ...place };
  }

  async updatePlace(id: Id, patch: PlacePatch): Promise<Place> {
    const place = this.find(this.data.places, id, 'No encontramos ese lugar.');
    if (patch.name !== undefined && !cleanText(patch.name)) {
      throw new RepositoryError('El lugar necesita un nombre.', 'invalid');
    }
    Object.assign(place, patch);
    return { ...place };
  }

  async deletePlace(id: Id): Promise<void> {
    this.find(this.data.places, id, 'No encontramos ese lugar.');
    const visitIds = new Set(this.data.visits.filter((v) => v.placeId === id).map((v) => v.id));
    this.data.tastings = this.data.tastings.filter((t) => !visitIds.has(t.visitId));
    this.data.visits = this.data.visits.filter((v) => v.placeId !== id);
    this.data.items = this.data.items.filter((i) => i.placeId !== id);
    this.data.placePhotos = this.data.placePhotos.filter((p) => p.placeId !== id);
    this.data.places = this.data.places.filter((p) => p.id !== id);
  }

  async updateItem(id: Id, patch: ItemPatch): Promise<Item> {
    const item = this.find(this.data.items, id, 'No encontramos ese ítem.');
    if (patch.name !== undefined) {
      const name = cleanText(patch.name);
      if (!name) throw new RepositoryError('El ítem necesita un nombre.', 'invalid');
      item.name = name;
    }
    if (patch.category !== undefined) {
      const others = this.data.items.filter((other) => other.id !== id);
      item.category = resolveCategory(others, patch.category);
    }
    return { ...item };
  }

  async recordVisit(draft: ValidVisitDraft): Promise<RecordedVisit> {
    if (validateVisitDraft(draft)) {
      throw new RepositoryError('Faltan datos para guardar la visita.', 'invalid');
    }
    const place = this.find(this.data.places, draft.placeId, 'No encontramos ese lugar.');
    const member = this.members[0]!;

    // Work on a copy and swap at the end, so a failure leaves the store untouched.
    const next = structuredClone(this.data);
    const createdAt = this.timestamp();
    const visit: Visit = {
      id: this.newId(),
      placeId: place.id,
      date: draft.date,
      note: draft.note.trim(),
      createdAt,
    };
    next.visits.push(visit);

    const tastings: Tasting[] = [];
    const createdItems: Item[] = [];
    draft.tastings.forEach((entry, index) => {
      let item = entry.itemId
        ? (next.items.find((i) => i.id === entry.itemId && i.placeId === place.id) ?? null)
        : findItemByName(next, place.id, entry.itemName);
      if (entry.itemId && !item) {
        throw new RepositoryError('Uno de los ítems no pertenece a este lugar.', 'invalid');
      }
      if (!item) {
        item = {
          id: this.newId(),
          placeId: place.id,
          name: cleanText(entry.itemName),
          category: resolveCategory(next.items, entry.category),
        };
        next.items.push(item);
        createdItems.push(item);
      }
      const tasting: Tasting = {
        id: this.newId(),
        visitId: visit.id,
        itemId: item.id,
        rating: entry.rating!,
        priceTotal: entry.priceTotal,
        quantity: entry.quantity,
        comment: entry.comment.trim(),
        wouldReorder: entry.wouldReorder,
        photoPath: entry.photoPath,
        createdBy: member.userId,
        // Keeps the order in which the items were added to the visit.
        createdAt: new Date(Date.parse(createdAt) + index).toISOString(),
      };
      next.tastings.push(tasting);
      tastings.push(tasting);
    });

    const placeIndex = next.places.findIndex((p) => p.id === place.id);
    next.places[placeIndex] = placeAfterVisit(next.places[placeIndex]!);

    this.data = next;
    return structuredClone({ visit, tastings, createdItems });
  }

  async updateVisit(id: Id, patch: VisitPatch): Promise<Visit> {
    const visit = this.find(this.data.visits, id, 'No encontramos esa visita.');
    Object.assign(visit, patch);
    return { ...visit };
  }

  async deleteVisit(id: Id): Promise<void> {
    this.find(this.data.visits, id, 'No encontramos esa visita.');
    this.data.tastings = this.data.tastings.filter((t) => t.visitId !== id);
    this.data.visits = this.data.visits.filter((v) => v.id !== id);
  }

  async updateTasting(id: Id, patch: TastingPatch): Promise<Tasting> {
    const tasting = this.find(this.data.tastings, id, 'No encontramos ese registro.');
    Object.assign(tasting, patch);
    return { ...tasting };
  }

  async deleteTasting(id: Id): Promise<void> {
    this.find(this.data.tastings, id, 'No encontramos ese registro.');
    this.data.tastings = this.data.tastings.filter((t) => t.id !== id);
  }

  async uploadPhoto(placeId: Id, image: Blob): Promise<string> {
    const place = this.find(this.data.places, placeId, 'No encontramos ese lugar.');
    const path = `${place.notebookId}/${place.id}/${this.newId()}.jpg`;
    this.photos.set(path, image);
    return path;
  }

  async photoUrl(path: string): Promise<string> {
    const cached = this.photoUrls.get(path);
    if (cached) return cached;
    const image = this.photos.get(path);
    if (!image) throw new RepositoryError('No encontramos esa foto.', 'not-found');
    const url = URL.createObjectURL(image);
    this.photoUrls.set(path, url);
    return url;
  }

  async addPlacePhoto(placeId: Id, kind: PlacePhotoKind, path: string): Promise<PlacePhoto> {
    this.find(this.data.places, placeId, 'No encontramos ese lugar.');
    const photo: PlacePhoto = { id: this.newId(), placeId, kind, path, createdAt: this.timestamp() };
    this.data.placePhotos.push(photo);
    return { ...photo };
  }

  async deletePlacePhoto(id: Id): Promise<void> {
    this.find(this.data.placePhotos, id, 'No encontramos esa foto.');
    this.data.placePhotos = this.data.placePhotos.filter((p) => p.id !== id);
  }

  private timestamp(): string {
    return this.now().toISOString();
  }

  private find<T extends { id: Id }>(rows: T[], id: Id, message: string): T {
    const row = rows.find((candidate) => candidate.id === id);
    if (!row) throw new RepositoryError(message, 'not-found');
    return row;
  }
}
