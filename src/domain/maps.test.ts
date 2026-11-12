import { describe, expect, it } from 'vitest';
// eslint-disable-next-line no-restricted-imports
import { createSeedDataset } from '../data/memory/seed';
import { filterPlacesForMap, googleMapsUrl, isValidCoordinates, pinKind } from './maps';
import type { Dataset, Place } from './types';

function datasetWithWishlist(): Dataset {
  const dataset = createSeedDataset();
  dataset.places.push({
    ...dataset.places[0]!,
    id: 'place-wish',
    name: 'El Papagayo',
    type: 'restaurante',
    address: '',
    status: 'wishlist',
    isRegular: false,
    lat: null,
    lng: null,
  });
  return dataset;
}

const names = (entries: Array<{ place: Place }>) => entries.map((entry) => entry.place.name);

describe('googleMapsUrl', () => {
  it('searches by name and address', () => {
    expect(googleMapsUrl({ name: 'Albuche', address: 'Illia y Paraná, Nueva Córdoba', lat: -31.4, lng: -64.1 })).toBe(
      'https://www.google.com/maps/search/?api=1&query=Albuche%2C%20Illia%20y%20Paran%C3%A1%2C%20Nueva%20C%C3%B3rdoba',
    );
  });

  it('uses the coordinates when there is no address', () => {
    expect(googleMapsUrl({ name: 'Puesto de chipá', address: ' ', lat: -31.42, lng: -64.18 })).toBe(
      'https://www.google.com/maps/search/?api=1&query=-31.42%2C-64.18',
    );
  });

  it('falls back to the name alone', () => {
    expect(googleMapsUrl({ name: 'Perdú', address: '', lat: null, lng: null })).toBe(
      'https://www.google.com/maps/search/?api=1&query=Perd%C3%BA',
    );
  });
});

describe('map filters', () => {
  it('classifies pins', () => {
    const dataset = datasetWithWishlist();
    expect(dataset.places.map((place) => [place.name, pinKind(place)])).toEqual([
      ['Perdú', 'regular'],
      ['Albuche', 'visited'],
      ['La Cabaña de Chamigo', 'visited'],
      ['El Papagayo', 'wishlist'],
    ]);
  });

  it('shows everything by default and filters by kind', () => {
    const dataset = datasetWithWishlist();
    expect(filterPlacesForMap(dataset)).toHaveLength(4);
    expect(names(filterPlacesForMap(dataset, { kinds: ['wishlist'] }))).toEqual(['El Papagayo']);
    expect(names(filterPlacesForMap(dataset, { kinds: ['regular', 'visited'] }))).toEqual([
      'Albuche',
      'La Cabaña de Chamigo',
      'Perdú',
    ]);
  });

  it('filters by item category, ignoring accents', () => {
    const entries = filterPlacesForMap(datasetWithWishlist(), { category: 'chipa' });
    expect(entries.map((entry) => [entry.place.name, entry.rating])).toEqual([
      ['La Cabaña de Chamigo', 7],
      ['Perdú', 6.75],
    ]);
  });

  it('filters by minimum rating; places without ratings drop out', () => {
    const dataset = datasetWithWishlist();
    expect(names(filterPlacesForMap(dataset, { minRating: 7 }))).toEqual(['Albuche', 'La Cabaña de Chamigo']);
    // With a category, the minimum applies to that category at the place.
    expect(names(filterPlacesForMap(dataset, { category: 'hamburguesa', minRating: 8 }))).toEqual([]);
    expect(names(filterPlacesForMap(dataset, { category: 'papas fritas', minRating: 8 }))).toEqual(['Albuche']);
  });
});

describe('isValidCoordinates', () => {
  it('rejects values outside the globe', () => {
    expect(isValidCoordinates({ lat: -31.42, lng: -64.18 })).toBe(true);
    expect(isValidCoordinates({ lat: 91, lng: 0 })).toBe(false);
    expect(isValidCoordinates({ lat: Number.NaN, lng: 0 })).toBe(false);
  });
});
