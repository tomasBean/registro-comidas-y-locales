import type { Coordinates } from '../../domain/maps';

export interface GeocodeResult extends Coordinates {
  /** Human-readable address, as the provider wrote it. */
  label: string;
}

/** Turns an address typed by the user into candidate locations. Swappable provider. */
export interface Geocoder {
  search(query: string): Promise<GeocodeResult[]>;
}

export class GeocodingError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'GeocodingError';
  }
}
