import { MemoryRepository } from './memory/memoryRepository';
import { createSeedDataset, seedMembers } from './memory/seed';
import { NominatimGeocoder } from './geocoding/nominatimGeocoder';
import type { Geocoder } from './geocoding/geocoder';
import type { Repository } from './repository';

export type { Repository } from './repository';
export { RepositoryError } from './repository';
export type { Geocoder, GeocodeResult } from './geocoding/geocoder';
export { GeocodingError } from './geocoding/geocoder';

/**
 * Picks the data source for the app. Today: memory with the example data.
 * The Supabase implementation plugs in here (H3) without touching any screen.
 */
export function createRepository(): Repository {
  return new MemoryRepository({ dataset: createSeedDataset(), members: seedMembers });
}

/** Address search provider. Swap the class here to change it. */
export function createGeocoder(): Geocoder {
  return new NominatimGeocoder();
}
