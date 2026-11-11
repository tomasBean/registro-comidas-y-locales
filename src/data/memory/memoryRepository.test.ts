import { describe, expect, it } from 'vitest';
import { categoryRanking, itemEvolution } from '../../domain/items';
import { wishlistPlaces } from '../../domain/places';
import { emptyTastingDraft } from '../../domain/visits';
import { RepositoryError } from '../repository';
import { MemoryRepository } from './memoryRepository';
import { createSeedDataset, seedMembers } from './seed';

function createRepository() {
  let counter = 0;
  return new MemoryRepository({
    dataset: createSeedDataset(),
    members: seedMembers,
    now: () => new Date('2026-11-11T15:00:00.000Z'),
    newId: () => `new-${++counter}`,
  });
}

describe('MemoryRepository', () => {
  it('returns copies: mutating a result does not change the store', async () => {
    const repository = createRepository();
    const first = await repository.loadDataset();
    first.places.length = 0;

    expect((await repository.loadDataset()).places).toHaveLength(3);
  });

  it('records a visit with several items, reusing and creating items', async () => {
    const repository = createRepository();

    const recorded = await repository.recordVisit({
      placeId: 'place-albuche',
      date: '2026-11-11',
      note: ' Cena ',
      tastings: [
        { ...emptyTastingDraft(), itemId: 'item-albuche-triple', rating: 10 },
        // Typed by hand with other casing: must reuse the existing "Papas".
        { ...emptyTastingDraft(), itemName: 'papas', rating: 6 },
        // New item; category typed without accent reuses "chipá".
        { ...emptyTastingDraft(), itemName: 'Chipá relleno', category: 'Chipa', rating: 7, priceTotal: 3000, quantity: 2 },
      ],
    });

    expect(recorded.visit.note).toBe('Cena');
    expect(recorded.tastings.map((tasting) => tasting.itemId)).toEqual([
      'item-albuche-triple',
      'item-albuche-papas',
      recorded.createdItems[0]!.id,
    ]);
    expect(recorded.createdItems).toHaveLength(1);
    expect(recorded.createdItems[0]).toMatchObject({ name: 'Chipá relleno', category: 'chipá' });
    expect(recorded.tastings.every((tasting) => tasting.createdBy === 'user-1')).toBe(true);

    const dataset = await repository.loadDataset();
    const triple = dataset.items.find((item) => item.id === 'item-albuche-triple')!;
    expect(itemEvolution(dataset, triple).latest!.rating).toBe(10);
    expect(categoryRanking(dataset, 'chipá')).toHaveLength(3);
  });

  it('turns a wishlist place into a visited one on its first visit', async () => {
    const repository = createRepository();
    const place = await repository.createPlace({
      name: '  El Papagayo ',
      type: 'Restaurante',
      address: '',
      lat: null,
      lng: null,
      status: 'wishlist',
      notes: 'Probar la milanesa',
    });
    expect(place).toMatchObject({ name: 'El Papagayo', type: 'restaurante', status: 'wishlist' });
    expect(wishlistPlaces(await repository.loadDataset())).toHaveLength(1);

    await repository.recordVisit({
      placeId: place.id,
      date: '2026-11-11',
      note: '',
      tastings: [{ ...emptyTastingDraft(), itemName: 'Milanesa', category: 'milanesa', rating: 9 }],
    });

    const dataset = await repository.loadDataset();
    expect(dataset.places.find((candidate) => candidate.id === place.id)!.status).toBe('visited');
    expect(wishlistPlaces(dataset)).toEqual([]);
  });

  it('rejects an invalid visit and leaves the store untouched', async () => {
    const repository = createRepository();
    const before = await repository.loadDataset();

    await expect(
      repository.recordVisit({ placeId: 'place-perdu', date: '2026-11-11', note: '', tastings: [] }),
    ).rejects.toBeInstanceOf(RepositoryError);
    await expect(
      repository.recordVisit({
        placeId: 'place-perdu',
        date: '2026-11-11',
        note: '',
        tastings: [
          { ...emptyTastingDraft(), itemName: 'Medialuna', category: 'facturas', rating: 8 },
          // Belongs to another place: the whole visit must fail.
          { ...emptyTastingDraft(), itemId: 'item-albuche-papas', rating: 8 },
        ],
      }),
    ).rejects.toMatchObject({ kind: 'invalid' });

    expect(await repository.loadDataset()).toEqual(before);
  });

  it('deletes a visit with its tastings, and a place with everything in it', async () => {
    const repository = createRepository();

    await repository.deleteVisit('visit-albuche-2');
    let dataset = await repository.loadDataset();
    expect(dataset.tastings.some((tasting) => tasting.visitId === 'visit-albuche-2')).toBe(false);
    expect(dataset.items.some((item) => item.id === 'item-albuche-papas')).toBe(true);

    await repository.deletePlace('place-albuche');
    dataset = await repository.loadDataset();
    expect(dataset.places.map((place) => place.id)).toEqual(['place-perdu', 'place-chamigo']);
    expect(dataset.items.some((item) => item.placeId === 'place-albuche')).toBe(false);
    expect(dataset.visits.some((visit) => visit.placeId === 'place-albuche')).toBe(false);
  });

  it('updates places, tastings and items', async () => {
    const repository = createRepository();

    expect((await repository.updatePlace('place-albuche', { isRegular: true })).isRegular).toBe(true);
    expect((await repository.updateTasting('tasting-perdu-4', { rating: 5 })).rating).toBe(5);
    expect((await repository.updateItem('item-albuche-papas', { category: 'Chipa' })).category).toBe('chipá');
    await expect(repository.updatePlace('nope', { name: 'x' })).rejects.toMatchObject({ kind: 'not-found' });
    await expect(repository.updatePlace('place-albuche', { name: ' ' })).rejects.toMatchObject({ kind: 'invalid' });
  });

  it('stores photos and attaches them to a place', async () => {
    const repository = createRepository();

    const path = await repository.uploadPhoto('place-perdu', new Blob(['x'], { type: 'image/jpeg' }));
    expect(path).toMatch(/^notebook-1\/place-perdu\/.+\.jpg$/);
    expect(await repository.photoUrl(path)).toMatch(/^blob:/);

    const photo = await repository.addPlacePhoto('place-perdu', 'menu', path);
    expect((await repository.loadDataset()).placePhotos).toEqual([photo]);

    await repository.deletePlacePhoto(photo.id);
    expect((await repository.loadDataset()).placePhotos).toEqual([]);
    await expect(repository.photoUrl('missing')).rejects.toMatchObject({ kind: 'not-found' });
  });
});
