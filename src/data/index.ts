import { MemoryRepository } from './memory/memoryRepository';
import { createSeedDataset, seedMembers } from './memory/seed';
import type { Repository } from './repository';

export type { Repository } from './repository';
export { RepositoryError } from './repository';

/**
 * Picks the data source for the app. Today: memory with the example data.
 * The Supabase implementation plugs in here (H3) without touching any screen.
 */
export function createRepository(): Repository {
  return new MemoryRepository({ dataset: createSeedDataset(), members: seedMembers });
}
