/** Single place for URL shapes, so screens never build paths by hand. */
export const routes = {
  home: () => '/',
  places: () => '/places',
  place: (placeId: string) => `/places/${placeId}`,
  item: (itemId: string) => `/items/${itemId}`,
  newVisit: (placeId?: string) => (placeId ? `/visits/new?place=${encodeURIComponent(placeId)}` : '/visits/new'),
};
