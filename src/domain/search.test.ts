import { describe, expect, it } from 'vitest';
// eslint-disable-next-line no-restricted-imports
import { createSeedDataset } from '../data/memory/seed';
import { search } from './search';

const dataset = createSeedDataset();

describe('search', () => {
  it('returns nothing for an empty query', () => {
    expect(search(dataset, '  ')).toEqual({ places: [], items: [] });
  });

  it('finds places by name, type or address, ignoring accents', () => {
    expect(search(dataset, 'perdu').places.map((place) => place.name)).toEqual(['Perdú']);
    expect(search(dataset, 'PANADERIA').places.map((place) => place.name)).toEqual(['La Cabaña de Chamigo', 'Perdú']);
    expect(search(dataset, 'nueva cordoba').places.map((place) => place.name)).toEqual(['Albuche', 'Perdú']);
  });

  it('finds items by name or category, with their place', () => {
    expect(search(dataset, 'chipa').items.map((hit) => [hit.item.name, hit.place.name])).toEqual([
      ['Chipá', 'La Cabaña de Chamigo'],
      ['Chipá', 'Perdú'],
    ]);
    expect(search(dataset, 'hamburguesa').items.map((hit) => hit.item.name)).toEqual(['Triple customizada']);
  });

  it('puts names that start with the query first', () => {
    expect(search(dataset, 'pa').items.map((hit) => hit.item.name)).toEqual(['Papas', 'Chipá', 'Chipá']);
    expect(search(dataset, 'a').places[0]!.name).toBe('Albuche');
  });
});
