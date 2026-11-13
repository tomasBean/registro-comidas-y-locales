/** Single place for URL shapes, so screens never build paths by hand. */
export const routes = {
  home: () => '/',
  places: (view?: 'regulars' | 'wishlist') => (view ? `/places?ver=${view}` : '/places'),
  newPlace: (status?: 'wishlist') => (status ? `/places/new?estado=${status}` : '/places/new'),
  editPlace: (placeId: string) => `/places/${placeId}/edit`,
  map: () => '/map',
  stats: () => '/stats',
  place: (placeId: string) => `/places/${placeId}`,
  item: (itemId: string) => `/items/${itemId}`,
  editVisit: (visitId: string) => `/visits/${visitId}/edit`,
  newVisit: (placeId?: string) => (placeId ? `/visits/new?place=${encodeURIComponent(placeId)}` : '/visits/new'),
};
