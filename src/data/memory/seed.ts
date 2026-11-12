import type { Dataset, NotebookMember, Tasting } from '../../domain/types';

/**
 * Example data from BRIEF.md §9. Illustrative: prices, dates and comments are made up,
 * and the coordinates are rough guesses inside Nueva Córdoba / Centro, not surveyed. Ratings are stored values (display × 2).
 */

export const SEED_NOTEBOOK_ID = 'notebook-1';

export const seedMembers: NotebookMember[] = [
  { notebookId: SEED_NOTEBOOK_ID, userId: 'user-1', displayName: 'Tomás' },
  { notebookId: SEED_NOTEBOOK_ID, userId: 'user-2', displayName: 'Invitada' },
];

const at = (date: string, time = '13:00:00') => `${date}T${time}.000Z`;

const tasting = (
  id: string,
  visitId: string,
  itemId: string,
  date: string,
  rating: number,
  rest: Partial<Tasting> = {},
): Tasting => ({
  id,
  visitId,
  itemId,
  rating,
  priceTotal: null,
  quantity: 1,
  comment: '',
  wouldReorder: null,
  photoPath: null,
  createdBy: 'user-1',
  createdAt: at(date),
  ...rest,
});

export function createSeedDataset(): Dataset {
  return {
    places: [
      {
        id: 'place-perdu',
        notebookId: SEED_NOTEBOOK_ID,
        name: 'Perdú',
        type: 'panadería',
        address: 'Rondeau, Nueva Córdoba',
        lat: -31.4262,
        lng: -64.187,
        status: 'visited',
        isRegular: true,
        notes: '',
        createdAt: at('2026-09-26', '12:00:00'),
      },
      {
        id: 'place-albuche',
        notebookId: SEED_NOTEBOOK_ID,
        name: 'Albuche',
        type: 'hamburguesería',
        address: 'Illia y Paraná, Nueva Córdoba',
        lat: -31.4218,
        lng: -64.1822,
        status: 'visited',
        isRegular: false,
        notes: '',
        createdAt: at('2026-09-19', '21:00:00'),
      },
      {
        id: 'place-chamigo',
        notebookId: SEED_NOTEBOOK_ID,
        name: 'La Cabaña de Chamigo',
        type: 'panadería',
        address: 'Belgrano',
        lat: -31.4236,
        lng: -64.1903,
        status: 'visited',
        isRegular: false,
        notes: '',
        createdAt: at('2026-11-05', '17:00:00'),
      },
    ],
    items: [
      { id: 'item-perdu-chipa', placeId: 'place-perdu', name: 'Chipá', category: 'chipá' },
      {
        id: 'item-albuche-triple',
        placeId: 'place-albuche',
        name: 'Triple customizada',
        category: 'hamburguesa',
      },
      { id: 'item-albuche-papas', placeId: 'place-albuche', name: 'Papas', category: 'papas fritas' },
      { id: 'item-chamigo-chipa', placeId: 'place-chamigo', name: 'Chipá', category: 'chipá' },
    ],
    visits: [
      { id: 'visit-perdu-1', placeId: 'place-perdu', date: '2026-09-26', note: '', createdAt: at('2026-09-26') },
      { id: 'visit-perdu-2', placeId: 'place-perdu', date: '2026-10-17', note: '', createdAt: at('2026-10-17') },
      { id: 'visit-perdu-3', placeId: 'place-perdu', date: '2026-11-03', note: '', createdAt: at('2026-11-03') },
      { id: 'visit-perdu-4', placeId: 'place-perdu', date: '2026-11-10', note: '', createdAt: at('2026-11-10') },
      { id: 'visit-albuche-1', placeId: 'place-albuche', date: '2026-09-19', note: '', createdAt: at('2026-09-19', '22:00:00') },
      { id: 'visit-albuche-2', placeId: 'place-albuche', date: '2026-10-10', note: '', createdAt: at('2026-10-10', '22:00:00') },
      { id: 'visit-albuche-3', placeId: 'place-albuche', date: '2026-11-07', note: '', createdAt: at('2026-11-07', '22:00:00') },
      { id: 'visit-chamigo-1', placeId: 'place-chamigo', date: '2026-11-05', note: '', createdAt: at('2026-11-05', '17:30:00') },
    ],
    tastings: [
      // Perdú: three times a 4, then a 1.5.
      tasting('tasting-perdu-1', 'visit-perdu-1', 'item-perdu-chipa', '2026-09-26', 8, { priceTotal: 2500, wouldReorder: true }),
      tasting('tasting-perdu-2', 'visit-perdu-2', 'item-perdu-chipa', '2026-10-17', 8, { priceTotal: 2500, wouldReorder: true }),
      tasting('tasting-perdu-3', 'visit-perdu-3', 'item-perdu-chipa', '2026-11-03', 8, { priceTotal: 2800, wouldReorder: true }),
      tasting('tasting-perdu-4', 'visit-perdu-4', 'item-perdu-chipa', '2026-11-10', 3, {
        comment: 'Estaba seco, como del día anterior.',
        wouldReorder: false,
      }),
      // Albuche: the triple at 4.5, 3 and 4; fries rated apart in the second visit.
      tasting('tasting-albuche-1', 'visit-albuche-1', 'item-albuche-triple', '2026-09-19', 9, { priceTotal: 12000,
        comment: 'Con cheddar, panceta y cebolla caramelizada.',
        wouldReorder: true,
      }),
      tasting('tasting-albuche-2', 'visit-albuche-2', 'item-albuche-triple', '2026-10-10', 6, { priceTotal: 12500,
        comment: 'Con cheddar, panceta y huevo. La carne, pasada.',
        wouldReorder: true,
      }),
      tasting('tasting-albuche-2-papas', 'visit-albuche-2', 'item-albuche-papas', '2026-10-10', 8, { priceTotal: 4500,
        comment: 'Crocantes.',
        wouldReorder: true,
        createdAt: at('2026-10-10', '13:01:00'),
      }),
      tasting('tasting-albuche-3', 'visit-albuche-3', 'item-albuche-triple', '2026-11-07', 8, { priceTotal: 13000,
        comment: 'Con cheddar, panceta y cebolla crispy.',
        wouldReorder: true,
      }),
      // La Cabaña de Chamigo: 3 chipá, $ 6.000 in total, 3.5.
      tasting('tasting-chamigo-1', 'visit-chamigo-1', 'item-chamigo-chipa', '2026-11-05', 7, {
        priceTotal: 6000,
        quantity: 3,
        wouldReorder: true,
      }),
    ],
    placePhotos: [],
  };
}
